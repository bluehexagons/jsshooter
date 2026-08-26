import "./styles.css";
import { type ShipId, type WeaponId } from "./game/config";
import { Game, SHIPS, type GameSnapshot, type GameState, type ShopItem } from "./game/game";

function requiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

const canvas = requiredElement<HTMLCanvasElement>("#game-canvas");
const shipGrid = requiredElement<HTMLDivElement>("#ship-grid");
const shipDescription = requiredElement<HTMLParagraphElement>("#ship-description");
const selectionOverlay = requiredElement<HTMLElement>("#selection-overlay");
const statusOverlay = requiredElement<HTMLElement>("#status-overlay");
const statusKicker = requiredElement<HTMLParagraphElement>("#status-kicker");
const statusTitle = requiredElement<HTMLHeadingElement>("#status-title");
const statusCopy = requiredElement<HTMLParagraphElement>("#status-copy");
const launchButton = requiredElement<HTMLButtonElement>("#launch-button");
const resumeButton = requiredElement<HTMLButtonElement>("#resume-button");
const newFlightButton = requiredElement<HTMLButtonElement>("#new-flight-button");
const pauseButton = requiredElement<HTMLButtonElement>("#pause-button");
const hangar = requiredElement<HTMLElement>("#hangar");
const weaponGrid = requiredElement<HTMLDivElement>("#weapon-grid");
const repairButton = requiredElement<HTMLButtonElement>("#repair-button");
const healthFill = requiredElement<HTMLDivElement>("#health-fill");
const healthValue = requiredElement<HTMLElement>("#health-value");
const creditsValue = requiredElement<HTMLElement>("#credits-value");
const waveValue = requiredElement<HTMLElement>("#wave-value");
const scoreValue = requiredElement<HTMLElement>("#score-value");
const timeValue = requiredElement<HTMLElement>("#time-value");

let selectedShip: ShipId = "rounded";
let currentState: GameState = "menu";
let shopFingerprint = "";
let game: Game | undefined;

function createShipCard(ship: (typeof SHIPS)[number]): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ship-card";
  button.dataset.shipId = ship.id;
  button.setAttribute("aria-pressed", String(ship.id === selectedShip));
  button.setAttribute("aria-label", `${ship.name}, ${ship.role}`);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "-35 -28 70 56");
  svg.setAttribute("aria-hidden", "true");
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", ship.shape.map((point) => `${point.x},${point.y}`).join(" "));
  polygon.setAttribute("fill", "rgba(61, 227, 255, 0.08)");
  polygon.setAttribute("stroke", "currentColor");
  polygon.setAttribute("stroke-width", "1.5");
  svg.append(polygon);

  const name = document.createElement("strong");
  name.textContent = ship.name;
  const role = document.createElement("span");
  role.textContent = ship.role;
  button.append(svg, name, role);
  button.addEventListener("click", () => selectShip(ship.id));
  return button;
}

function selectShip(id: ShipId): void {
  selectedShip = id;
  const ship = SHIPS.find((candidate) => candidate.id === id);
  if (!ship) {
    return;
  }
  for (const card of shipGrid.querySelectorAll<HTMLButtonElement>(".ship-card")) {
    card.setAttribute("aria-pressed", String(card.dataset.shipId === ship.id));
  }
  shipDescription.textContent = `${ship.description} Hull ${ship.hull} · Speed ${ship.speed} · ${ship.armory.length} compatible weapons.`;
}

function formatTime(secondsTotal: number): string {
  const minutes = Math.floor(secondsTotal / 60);
  const seconds = Math.floor(secondsTotal % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateState(state: GameState, snapshot: GameSnapshot): void {
  currentState = state;
  selectionOverlay.hidden = state !== "menu";
  statusOverlay.hidden = state !== "paused" && state !== "gameover";
  hangar.hidden = state === "menu" || state === "gameover";
  pauseButton.disabled = state === "menu" || state === "gameover";
  pauseButton.firstChild!.textContent = state === "paused" ? "Resume " : "Pause ";

  if (state === "menu") {
    selectionOverlay.scrollTop = 0;
  }

  if (state === "paused") {
    statusKicker.textContent = "Flight suspended";
    statusTitle.textContent = "Paused";
    statusCopy.textContent = "The simulation is frozen. Tune your loadout or resume when ready.";
    resumeButton.textContent = "Resume";
  } else if (state === "gameover") {
    statusKicker.textContent = "Signal lost";
    statusTitle.textContent = "Ship destroyed";
    statusCopy.textContent = `Score ${snapshot.score.toLocaleString()} · Best ${snapshot.highScore.toLocaleString()}. Ready another copy of this frame?`;
    resumeButton.textContent = "Fly again";
  }
}

function updateSnapshot(snapshot: GameSnapshot, shop: readonly ShopItem[]): void {
  const healthRatio = snapshot.maxHealth > 0 ? snapshot.health / snapshot.maxHealth : 0;
  healthFill.style.width = `${Math.max(0, healthRatio) * 100}%`;
  healthFill.style.background = healthRatio < 0.3 ? "var(--red)" : "var(--green)";
  healthValue.textContent = snapshot.maxHealth ? `${Math.ceil(snapshot.health)}/${snapshot.maxHealth}` : "—";
  creditsValue.textContent = snapshot.credits.toLocaleString();
  waveValue.textContent = snapshot.state === "menu" ? "—" : String(snapshot.wave).padStart(2, "0");
  scoreValue.textContent = snapshot.score.toLocaleString();
  timeValue.textContent = formatTime(snapshot.elapsed);

  const repairCost = game?.repairCost ?? 0;
  repairButton.textContent = repairCost > 0 ? `Repair hull · ${repairCost} cr` : "Hull at full integrity";
  repairButton.disabled = repairCost <= 0 || snapshot.credits < repairCost;
  repairButton.classList.toggle("affordable", repairCost > 0 && snapshot.credits >= repairCost);

  const fingerprint = shop
    .map((item) => `${item.definition.id}:${item.level}:${item.cost}:${item.canAfford}:${item.disabledReason}`)
    .join("|");
  if (fingerprint !== shopFingerprint) {
    shopFingerprint = fingerprint;
    renderShop(shop);
  }
}

function renderShop(items: readonly ShopItem[]): void {
  weaponGrid.replaceChildren();
  for (const item of items) {
    const card = document.createElement("article");
    card.className = "weapon-card";
    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.definition.name;
    const copy = document.createElement("p");
    copy.textContent = item.definition.description;
    details.append(title, copy);

    if (item.level !== null) {
      const owned = document.createElement("p");
      owned.className = "owned";
      owned.textContent = `Installed · level ${item.level}`;
      details.append(owned);
    }

    const action = document.createElement("button");
    action.type = "button";
    action.className = "weapon-action";
    action.disabled = !item.canAfford;
    action.textContent = item.disabledReason ?? `${item.level === null ? "Buy" : "Upgrade"} · ${item.cost} cr`;
    action.addEventListener("click", () => {
      const id = item.definition.id as WeaponId;
      if (item.level === null) {
        game?.purchaseWeapon(id);
      } else {
        game?.upgradeWeapon(id);
      }
    });
    card.append(details, action);
    weaponGrid.append(card);
  }
}

for (const ship of SHIPS) {
  shipGrid.append(createShipCard(ship));
}
selectShip(selectedShip);

game = new Game(canvas, {
  onStateChange: updateState,
  onSnapshot: updateSnapshot,
});

launchButton.addEventListener("click", () => game?.start(selectedShip));
pauseButton.addEventListener("click", () => game?.togglePause());
resumeButton.addEventListener("click", () => {
  if (currentState === "gameover") {
    game?.start(selectedShip);
  } else {
    game?.resume();
  }
});
newFlightButton.addEventListener("click", () => game?.returnToMenu());
repairButton.addEventListener("click", () => game?.repairShip());
