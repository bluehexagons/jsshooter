import type { Point } from "./vector";

export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 600;
export const MAX_WEAPON_LEVEL = 5;
export const MAX_WEAPONS = 3;

export type ShipId =
  | "rounded"
  | "sprayer"
  | "tank"
  | "focus"
  | "ghost"
  | "mastermind"
  | "knight";

export type WeaponId =
  | "rapid"
  | "rapid2"
  | "fan"
  | "pulse"
  | "spray"
  | "laser"
  | "orbit"
  | "shell"
  | "shell2";

export interface ShipDefinition {
  id: ShipId;
  name: string;
  role: string;
  description: string;
  hull: number;
  speed: number;
  shape: readonly Point[];
  armory: readonly WeaponId[];
}

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  description: string;
  price: number;
  cooldown: number;
  damage: number;
  projectileSpeed: number;
  color: string;
}

export const SHIPS: readonly ShipDefinition[] = [
  {
    id: "rounded",
    name: "Vanguard",
    role: "Balanced",
    description: "A forgiving all-round frame with a broad armory and steady handling.",
    hull: 110,
    speed: 330,
    shape: [
      { x: 24, y: 0 },
      { x: 2, y: 15 },
      { x: -20, y: 11 },
      { x: -11, y: 0 },
      { x: -20, y: -11 },
      { x: 2, y: -15 },
    ],
    armory: ["rapid", "rapid2", "fan", "laser", "pulse"],
  },
  {
    id: "sprayer",
    name: "Scatter",
    role: "Area control",
    description: "An agile frame built for wide projectile patterns and mobile defense.",
    hull: 90,
    speed: 365,
    shape: [
      { x: 22, y: 0 },
      { x: 7, y: 9 },
      { x: -17, y: 18 },
      { x: -12, y: 4 },
      { x: -12, y: -4 },
      { x: -17, y: -18 },
      { x: 7, y: -9 },
    ],
    armory: ["shell", "shell2", "spray", "orbit"],
  },
  {
    id: "tank",
    name: "Bulwark",
    role: "Heavy",
    description: "Slower to reposition, but its reinforced hull can absorb sustained pressure.",
    hull: 165,
    speed: 265,
    shape: [
      { x: 22, y: 0 },
      { x: 14, y: 17 },
      { x: -13, y: 20 },
      { x: -22, y: 10 },
      { x: -22, y: -10 },
      { x: -13, y: -20 },
      { x: 14, y: -17 },
    ],
    armory: ["laser", "shell", "pulse"],
  },
  {
    id: "focus",
    name: "Needle",
    role: "Precision",
    description: "A compact, responsive interceptor suited to focused fire and clean lanes.",
    hull: 80,
    speed: 350,
    shape: [
      { x: 29, y: 0 },
      { x: 4, y: 6 },
      { x: -9, y: 3 },
      { x: -16, y: 8 },
      { x: -12, y: 0 },
      { x: -16, y: -8 },
      { x: -9, y: -3 },
      { x: 4, y: -6 },
    ],
    armory: ["laser", "rapid", "fan"],
  },
  {
    id: "ghost",
    name: "Ghost",
    role: "Skirmisher",
    description: "The fastest frame in the fleet, trading hull strength for evasive speed.",
    hull: 72,
    speed: 405,
    shape: [
      { x: 24, y: 0 },
      { x: 3, y: 12 },
      { x: -9, y: 7 },
      { x: -20, y: 15 },
      { x: -13, y: 0 },
      { x: -20, y: -15 },
      { x: -9, y: -7 },
      { x: 3, y: -12 },
    ],
    armory: ["shell", "rapid", "orbit"],
  },
  {
    id: "mastermind",
    name: "Oracle",
    role: "Artillery",
    description: "A measured long-range platform with high-output energy weapon access.",
    hull: 98,
    speed: 305,
    shape: [
      { x: 21, y: 0 },
      { x: 5, y: 17 },
      { x: -5, y: 9 },
      { x: -19, y: 12 },
      { x: -14, y: 0 },
      { x: -19, y: -12 },
      { x: -5, y: -9 },
      { x: 5, y: -17 },
    ],
    armory: ["laser", "pulse", "spray"],
  },
  {
    id: "knight",
    name: "Lancer",
    role: "Brawler",
    description: "A durable close-range frame that excels with shells and sweeping fire.",
    hull: 140,
    speed: 290,
    shape: [
      { x: 29, y: 0 },
      { x: 5, y: 8 },
      { x: -5, y: 19 },
      { x: -10, y: 8 },
      { x: -22, y: 8 },
      { x: -17, y: 0 },
      { x: -22, y: -8 },
      { x: -10, y: -8 },
      { x: -5, y: -19 },
      { x: 5, y: -8 },
    ],
    armory: ["shell", "fan", "rapid2"],
  },
] as const;

export const WEAPONS: Readonly<Record<WeaponId, WeaponDefinition>> = {
  rapid: {
    id: "rapid",
    name: "Rapid port",
    description: "Fast, accurate supporting fire.",
    price: 25,
    cooldown: 0.13,
    damage: 8,
    projectileSpeed: 920,
    color: "#79eaff",
  },
  rapid2: {
    id: "rapid2",
    name: "Rapid starboard",
    description: "A mirrored rapid-fire mount.",
    price: 25,
    cooldown: 0.13,
    damage: 8,
    projectileSpeed: 920,
    color: "#79eaff",
  },
  fan: {
    id: "fan",
    name: "Fan cannon",
    description: "Sweeps shots across a wide arc.",
    price: 65,
    cooldown: 0.095,
    damage: 6,
    projectileSpeed: 760,
    color: "#b9f6ff",
  },
  pulse: {
    id: "pulse",
    name: "Pulse driver",
    description: "Slow, heavy energy bolts that pierce armor.",
    price: 110,
    cooldown: 0.5,
    damage: 34,
    projectileSpeed: 680,
    color: "#c594ff",
  },
  spray: {
    id: "spray",
    name: "Arc sprayer",
    description: "Seven-shot bursts for crowd control.",
    price: 90,
    cooldown: 0.6,
    damage: 5,
    projectileSpeed: 720,
    color: "#93a7ff",
  },
  laser: {
    id: "laser",
    name: "Beam lance",
    description: "High-velocity rounds with innate penetration.",
    price: 125,
    cooldown: 0.22,
    damage: 18,
    projectileSpeed: 1500,
    color: "#ff5f84",
  },
  orbit: {
    id: "orbit",
    name: "Orbit repeater",
    description: "Rotating twin emitters weave a dense pattern.",
    price: 105,
    cooldown: 0.12,
    damage: 7,
    projectileSpeed: 820,
    color: "#80a6ff",
  },
  shell: {
    id: "shell",
    name: "Shell rack port",
    description: "A paired kinetic broadside.",
    price: 80,
    cooldown: 0.34,
    damage: 15,
    projectileSpeed: 800,
    color: "#ffd284",
  },
  shell2: {
    id: "shell2",
    name: "Shell rack starboard",
    description: "A mirrored kinetic broadside.",
    price: 80,
    cooldown: 0.34,
    damage: 15,
    projectileSpeed: 800,
    color: "#ffd284",
  },
};

export function getShip(id: ShipId): ShipDefinition {
  const ship = SHIPS.find((candidate) => candidate.id === id);
  if (!ship) {
    throw new Error(`Unknown ship: ${id}`);
  }
  return ship;
}

export function weaponUpgradeCost(weapon: WeaponDefinition, level: number): number {
  if (level >= MAX_WEAPON_LEVEL) {
    return 0;
  }
  return Math.round(weapon.price * (0.75 + level * 0.8));
}
