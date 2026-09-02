import {
  getShip,
  MAX_WEAPONS,
  MAX_WEAPON_LEVEL,
  SHIPS,
  type ShipDefinition,
  type ShipId,
  WEAPONS,
  type WeaponDefinition,
  type WeaponId,
  type WireframeSegment,
  weaponMaxDurability,
  weaponRepairCost as calculateWeaponRepairCost,
  weaponUpgradeCost,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./config";
import {
  centipedeLength,
  ENEMIES,
  FORMATIONS,
  formationTop,
  type EnemyKind,
  type FormationId,
} from "./enemies";
import {
  advanceWireFragment,
  createWireExplosion,
  type WireFragment,
  wireFragmentOpacity,
} from "./destruction";
import {
  advanceEffectParticle,
  effectOpacity,
  type EffectParticle,
  type ParticleKind,
  wrappedParallaxX,
} from "./effects";
import { InputController, type QuickAction } from "./input";
import { resolveArmoryAction } from "./loadout";
import { advanceMountMotion, animatedMountOffset, mountMotionBounds } from "./mount-motion";
import {
  advanceCooldown,
  reflectVector,
  rectangleCircleOverlap,
  segmentCircleHit,
  segmentCircleHitFraction,
  segmentRectangleHit,
  transformLocalPoint,
  type SegmentHit,
  usesFallbackCannon,
} from "./mechanics";
import {
  bossArrivalThreatLimit,
  chooseOpenLaneY,
  chooseSpawn,
  enemyThreat,
  formationCuesForWave,
  formationThreat,
  randomSpawnInterval,
  threatLimit,
} from "./spawning";
import { circlesOverlap, clamp, type Point, Vector } from "./vector";
import {
  advanceWeaponFeedback,
  createWeaponFeedback,
  triggerWeaponFeedback,
  type WeaponFeedback,
} from "./weapon-feedback";
import {
  flakBlastRadius,
  flakSplashDamage,
  pulseClipSize,
  pulseReloadTime,
  railPierce,
  resolveLaserImpact,
  shellAngles,
  weaponCooldown,
  weaponDamage,
} from "./weapons";

export type GameState = "menu" | "playing" | "paused" | "destroyed" | "gameover";

export interface GameSnapshot {
  state: GameState;
  health: number;
  maxHealth: number;
  credits: number;
  wave: number;
  score: number;
  elapsed: number;
  highScore: number;
  quickAction: QuickAction;
}

export interface ShopItem {
  definition: WeaponDefinition;
  level: number | null;
  hotkeySlot: number;
  cost: number;
  canAfford: boolean;
  disabledReason: string | null;
  health: number | null;
  maxHealth: number | null;
  repairCost: number;
  canRepair: boolean;
  ammo: number | null;
  maxAmmo: number | null;
  clipAmmo: number | null;
  clipSize: number | null;
  reloadCost: number;
  canReload: boolean;
}

export interface GameCallbacks {
  onStateChange: (state: GameState, snapshot: GameSnapshot) => void;
  onSnapshot: (snapshot: GameSnapshot, shop: readonly ShopItem[]) => void;
}

interface Player {
  position: Vector;
  velocity: Vector;
  angle: number;
  health: number;
  invulnerable: number;
  baseCooldown: number;
  weapons: WeaponMount[];
  ship: ShipDefinition;
}

interface WeaponMount {
  id: WeaponId;
  level: number;
  cooldown: number;
  phase: number;
  motionPhase: number;
  feedback: WeaponFeedback;
  health: number;
  ammo: number | null;
  burstShots: number;
  clipAmmo: number | null;
  contactCooldown: number;
  hitFlash: number;
}

interface Projectile {
  position: Vector;
  velocity: Vector;
  radius: number;
  damage: number;
  life: number;
  color: string;
  friendly: boolean;
  pierce: number;
  hitEnemies: Set<number>;
  turnTarget: number | null;
  beamLength: number;
  penetration: number | null;
  blastRadius: number;
}

interface Enemy {
  id: number;
  kind: EnemyKind;
  position: Vector;
  velocity: Vector;
  radius: number;
  health: number;
  maxHealth: number;
  reward: number;
  contactDamage: number;
  age: number;
  phase: number;
  inFormation: boolean;
  pathOffset: number;
  shootCooldown: number;
  hitFlash: number;
}

interface Star {
  x: number;
  y: number;
  depth: number;
  size: number;
  twinkle: number;
}

interface Nebula {
  x: number;
  yRatio: number;
  radius: number;
  depth: number;
  color: string;
}

interface BackdropDebris {
  x: number;
  y: number;
  depth: number;
  size: number;
  rotation: number;
  spin: number;
  sides: number;
}

interface ScheduledFormation {
  at: number;
  id: FormationId;
  preferredTop: number;
}

interface SpawnEnemyOptions {
  y?: number;
  xOffset?: number;
  speed?: number;
  pathOffset?: number;
  inFormation?: boolean;
}

const REPAIR_RATE = 1.5;
const BASE_FIRE_COOLDOWN = 0.5;
const HIGH_SCORE_KEY = "corvus-high-score";
const RESPAWN_COST = 2500;
const MAX_PARTICLES = 520;
const MAX_WIRE_FRAGMENTS = 420;
const DESTRUCTION_DURATION = 1.75;

export class Game {
  private readonly context: CanvasRenderingContext2D;
  private readonly input: InputController;
  private readonly stars: Star[];
  private readonly nebulas: readonly Nebula[];
  private readonly backdropDebris: BackdropDebris[];
  private readonly projectiles: Projectile[] = [];
  private readonly enemies: Enemy[] = [];
  private readonly particles: EffectParticle[] = [];
  private readonly wireFragments: WireFragment[] = [];
  private readonly scheduledFormations: ScheduledFormation[] = [];
  private player: Player | null = null;
  private state: GameState = "menu";
  private credits = 0;
  private score = 0;
  private elapsed = 0;
  private wave = 1;
  private spawnCooldown = 0;
  private lastBossWave = 0;
  private nextEnemyId = 1;
  private lastFrameTime = performance.now();
  private uiCooldown = 0;
  private screenFlash = 0;
  private worldHeight = WORLD_HEIGHT;
  private engineParticleCooldown = 0;
  private destructionCountdown = 0;
  private pendingRespawn = false;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly callbacks: GameCallbacks,
  ) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D is not supported by this browser.");
    }
    this.context = context;
    this.input = new InputController(
      canvas,
      () => this.togglePause(),
      (action, slot) => this.applyQuickAction(action, slot),
      () => this.emitSnapshot(),
    );
    this.stars = Array.from({ length: 190 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * this.worldHeight,
      depth: Math.random() * 0.9 + 0.1,
      size: Math.random() * 1.4 + 0.4,
      twinkle: Math.random() * Math.PI * 2,
    }));
    this.nebulas = [
      { x: 160, yRatio: 0.2, radius: 260, depth: 0.12, color: "45, 96, 154" },
      { x: 690, yRatio: 0.82, radius: 320, depth: 0.18, color: "86, 46, 128" },
      { x: 1110, yRatio: 0.38, radius: 220, depth: 0.25, color: "26, 112, 124" },
    ];
    this.backdropDebris = Array.from({ length: 11 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * this.worldHeight,
      depth: Math.random() * 0.55 + 0.15,
      size: 10 + Math.random() * 28,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.18,
      sides: 5 + Math.floor(Math.random() * 4),
    }));

    new ResizeObserver(this.resizeCanvas).observe(canvas);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === "playing") {
        this.pause();
      }
    });
    window.addEventListener("blur", () => this.pause());

    this.resizeCanvas();
    this.render(performance.now() / 1000);
    requestAnimationFrame(this.tick);
    this.emitState();
  }

  public start(shipId: ShipId): void {
    const ship = getShip(shipId);
    this.player = this.createPlayer(ship);
    this.projectiles.length = 0;
    this.enemies.length = 0;
    this.particles.length = 0;
    this.wireFragments.length = 0;
    this.credits = 150;
    this.score = 0;
    this.elapsed = 0;
    this.wave = 1;
    this.spawnCooldown = 7.5;
    this.lastBossWave = 0;
    this.nextEnemyId = 1;
    this.scheduledFormations.length = 0;
    this.engineParticleCooldown = 0;
    this.destructionCountdown = 0;
    this.pendingRespawn = false;
    const openingTop = this.worldHeight / 2 - FORMATIONS.chevron.height / 2;
    this.scheduledFormations.push(
      { at: 0.5, id: "chevron", preferredTop: openingTop },
      { at: 1.75, id: "chevron", preferredTop: openingTop },
      { at: 3, id: "chevron", preferredTop: openingTop },
    );
    this.screenFlash = 0;
    this.input.aim.x = 600;
    this.input.aim.y = this.worldHeight / 2;
    this.setState("playing");
    this.canvas.focus({ preventScroll: true });
  }

  private createPlayer(ship: ShipDefinition): Player {
    return {
      position: new Vector(115, this.worldHeight / 2),
      velocity: new Vector(),
      angle: 0,
      health: ship.hull,
      invulnerable: 1,
      baseCooldown: 0,
      weapons: [],
      ship,
    };
  }

  public returnToMenu(): void {
    this.player = null;
    this.projectiles.length = 0;
    this.enemies.length = 0;
    this.particles.length = 0;
    this.wireFragments.length = 0;
    this.credits = 0;
    this.score = 0;
    this.elapsed = 0;
    this.wave = 1;
    this.destructionCountdown = 0;
    this.pendingRespawn = false;
    this.setState("menu");
  }

  public togglePause(): void {
    if (this.state === "playing") {
      this.pause();
    } else if (this.state === "paused") {
      this.resume();
    }
  }

  public pause(): void {
    if (this.state === "playing") {
      this.setState("paused");
    }
  }

  public resume(): void {
    if (this.state === "paused") {
      this.lastFrameTime = performance.now();
      this.setState("playing");
      this.canvas.focus({ preventScroll: true });
    }
  }

  public purchaseWeapon(id: WeaponId): boolean {
    const player = this.player;
    const definition = WEAPONS[id];
    if (
      !this.canManageLoadout ||
      !player ||
      !player.ship.armory.includes(id) ||
      player.weapons.some((weapon) => weapon.id === id) ||
      player.weapons.length >= MAX_WEAPONS ||
      this.credits < definition.price
    ) {
      return false;
    }

    this.credits -= definition.price;
    player.weapons.push({
      id,
      level: 1,
      cooldown: definition.cooldown * (0.45 + player.weapons.length * 0.35),
      phase: player.weapons.length * 0.7,
      motionPhase: player.ship.armory.indexOf(id) * 0.9,
      feedback: createWeaponFeedback(),
      health: weaponMaxDurability(definition, 1),
      ammo: definition.ammoCapacity,
      burstShots: 0,
      clipAmmo: id === "pulse" ? pulseClipSize(1) : null,
      contactCooldown: 0,
      hitFlash: 0,
    });
    this.render(performance.now() / 1000);
    this.emitSnapshot();
    return true;
  }

  public upgradeWeapon(id: WeaponId): boolean {
    if (!this.canManageLoadout) {
      return false;
    }
    const mount = this.player?.weapons.find((weapon) => weapon.id === id);
    if (!mount || mount.level >= MAX_WEAPON_LEVEL) {
      return false;
    }
    const cost = weaponUpgradeCost(mount.level);
    if (this.credits < cost) {
      return false;
    }
    this.credits -= cost;
    const oldMaximum = weaponMaxDurability(WEAPONS[id], mount.level);
    mount.level += 1;
    mount.health += weaponMaxDurability(WEAPONS[id], mount.level) - oldMaximum;
    if (mount.id === "pulse" && mount.clipAmmo !== null) {
      mount.clipAmmo += 3;
    }
    this.render(performance.now() / 1000);
    this.emitSnapshot();
    return true;
  }

  public repairWeapon(id: WeaponId): boolean {
    if (!this.canManageLoadout) {
      return false;
    }
    const mount = this.player?.weapons.find((weapon) => weapon.id === id);
    if (!mount) {
      return false;
    }
    const definition = WEAPONS[id];
    const cost = calculateWeaponRepairCost(definition, mount.level, mount.health);
    if (cost <= 0 || this.credits < cost) {
      return false;
    }
    this.credits -= cost;
    mount.health = weaponMaxDurability(definition, mount.level);
    this.render(performance.now() / 1000);
    this.emitSnapshot();
    return true;
  }

  public reloadWeapon(id: WeaponId): boolean {
    if (!this.canManageLoadout) {
      return false;
    }
    const mount = this.player?.weapons.find((weapon) => weapon.id === id);
    const definition = WEAPONS[id];
    if (!mount || mount.ammo === null || definition.ammoCapacity === null) {
      return false;
    }
    const cost = (definition.ammoCapacity - mount.ammo) * definition.reloadPrice;
    if (cost <= 0 || this.credits < cost) {
      return false;
    }
    this.credits -= cost;
    mount.ammo = definition.ammoCapacity;
    this.render(performance.now() / 1000);
    this.emitSnapshot();
    return true;
  }

  public repairShip(): boolean {
    const player = this.player;
    const cost = this.repairCost;
    if (!this.canManageLoadout || !player || cost <= 0 || this.credits < cost) {
      return false;
    }
    this.credits -= cost;
    player.health = player.ship.hull;
    this.emitSnapshot();
    return true;
  }

  public get repairCost(): number {
    if (!this.player) {
      return 0;
    }
    return Math.ceil((this.player.ship.hull - this.player.health) * REPAIR_RATE);
  }

  private readonly tick = (timestamp: number): void => {
    const delta = Math.min((timestamp - this.lastFrameTime) / 1000, 0.04);
    this.lastFrameTime = timestamp;

    if (this.state === "playing") {
      this.update(delta);
    } else if (this.state === "destroyed") {
      this.updateDestruction(delta);
    }
    this.render(timestamp / 1000);

    this.uiCooldown -= delta;
    if (this.uiCooldown <= 0) {
      this.uiCooldown = 0.12;
      this.emitSnapshot();
    }
    requestAnimationFrame(this.tick);
  };

  private update(delta: number): void {
    const player = this.player;
    if (!player) {
      return;
    }

    this.elapsed += delta;
    const nextWave = Math.floor(this.elapsed / 18) + 1;
    if (nextWave !== this.wave) {
      this.wave = nextWave;
      this.createBurst(new Vector(WORLD_WIDTH * 0.72, 52), "#3de3ff", 18);
      this.scheduledFormations.length = 0;
      for (const cue of formationCuesForWave(this.wave)) {
        const definition = FORMATIONS[cue.id];
        this.scheduledFormations.push({
          at: this.elapsed + cue.delay,
          id: cue.id,
          preferredTop: 22 + Math.random() * (this.worldHeight - definition.height - 44),
        });
      }
    }

    this.updateStars(delta);
    this.updatePlayer(player, delta);
    this.updateSpawning(delta);
    this.updateEnemies(player, delta);
    this.updateProjectiles(player, delta);
    this.updateParticles(delta);
    this.updateWireFragments(delta);
    this.screenFlash = Math.max(0, this.screenFlash - delta * 2.4);
  }

  private updateDestruction(delta: number): void {
    this.updateStars(delta * 0.7);
    this.updateParticles(delta);
    this.updateWireFragments(delta);
    this.screenFlash = Math.max(0, this.screenFlash - delta * 1.8);
    this.destructionCountdown -= delta;
    if (this.destructionCountdown > 0) {
      return;
    }

    const destroyedPlayer = this.player;
    if (this.pendingRespawn && destroyedPlayer && this.credits >= RESPAWN_COST) {
      this.credits -= RESPAWN_COST;
      const shockOrigin = destroyedPlayer.position.clone();
      this.player = this.createPlayer(destroyedPlayer.ship);
      this.player.invulnerable = 2;
      for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
        const enemy = this.enemies[index];
        if (!enemy) {
          continue;
        }
        enemy.health -= 80;
        if (enemy.health <= 0) {
          this.enemies.splice(index, 1);
          this.explodeEnemy(
            enemy,
            Vector.between(shockOrigin, enemy.position).normalize().scale(420),
          );
        }
      }
      for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
        if (!this.projectiles[index]?.friendly) {
          this.projectiles.splice(index, 1);
        }
      }
      this.createBurst(this.player.position, "#3de3ff", 22);
      this.pendingRespawn = false;
      this.setState("playing");
      return;
    }

    this.pendingRespawn = false;
    this.saveHighScore();
    this.setState("gameover");
  }

  private updateStars(delta: number): void {
    for (const star of this.stars) {
      star.x -= (24 + star.depth * 76) * delta;
      if (star.x < -4) {
        star.x = WORLD_WIDTH + 4;
        star.y = Math.random() * this.worldHeight;
      }
    }
    for (const debris of this.backdropDebris) {
      debris.x -= (7 + debris.depth * 28) * delta;
      debris.rotation += debris.spin * delta;
      if (debris.x < -debris.size * 2) {
        debris.x = WORLD_WIDTH + debris.size * 2;
        debris.y = Math.random() * this.worldHeight;
      }
    }
  }

  private updatePlayer(player: Player, delta: number): void {
    const movement = this.input.movement;
    const desiredVelocity = movement.clone().scale(player.ship.speed);
    const responsiveness = 1 - Math.exp(-delta * 11);
    player.velocity.x += (desiredVelocity.x - player.velocity.x) * responsiveness;
    player.velocity.y += (desiredVelocity.y - player.velocity.y) * responsiveness;
    player.position.add(player.velocity.clone().scale(delta));
    player.position.x += (110 - player.position.x) * Math.min(1, delta * 0.42);
    player.position.x = clamp(player.position.x, 35, WORLD_WIDTH * 0.62);
    player.position.y = clamp(player.position.y, 35, this.worldHeight - 35);
    player.angle = Vector.between(player.position, this.input.aim).angle;
    this.clampPlayerToWorld(player);
    player.angle = Vector.between(player.position, this.input.aim).angle;
    player.invulnerable = Math.max(0, player.invulnerable - delta);
    player.baseCooldown = advanceCooldown(player.baseCooldown, delta);
    this.updateEngineTrail(player, delta);

    for (const weapon of player.weapons) {
      const definition = WEAPONS[weapon.id];
      weapon.feedback = advanceWeaponFeedback(
        weapon.feedback,
        delta,
        definition.recoilDistance,
      );
      weapon.motionPhase = advanceMountMotion(
        weapon.motionPhase,
        definition.movement,
        delta * (1 + weapon.feedback.activity * 0.16),
      );
      weapon.cooldown = advanceCooldown(weapon.cooldown, delta);
      weapon.contactCooldown = Math.max(0, weapon.contactCooldown - delta);
      weapon.hitFlash = Math.max(0, weapon.hitFlash - delta * 5);
    }

    if (!this.input.firing) {
      return;
    }

    if (usesFallbackCannon(player.weapons.length) && player.baseCooldown <= 0) {
      player.baseCooldown += BASE_FIRE_COOLDOWN;
      this.createPlayerProjectile(player.angle, 0, 7, 880, "#d8fbff");
    }

    for (const weapon of player.weapons) {
      const hasAmmunition =
        weapon.id === "laser"
          ? weapon.burstShots > 0 || weapon.ammo !== 0
          : weapon.id === "pulse"
            ? (weapon.clipAmmo ?? 0) > 0 || weapon.ammo !== 0
            : weapon.ammo !== 0;
      if (weapon.cooldown <= 0 && hasAmmunition) {
        this.fireWeapon(weapon, player.angle);
      }
    }
  }

  private updateEngineTrail(player: Player, delta: number): void {
    this.engineParticleCooldown -= delta;
    const thrust = clamp(player.velocity.length / player.ship.speed, 0, 1);
    const interval = 0.075 - thrust * 0.035;
    while (this.engineParticleCooldown <= 0) {
      this.engineParticleCooldown += interval;
      const tail = Math.min(...player.ship.shape.map((point) => point.x));
      const position = this.playerOffsetPosition(player, {
        x: tail - 4,
        y: (Math.random() - 0.5) * 5,
      });
      const exhaustSpeed = 55 + thrust * 125 + Math.random() * 35;
      const velocity = Vector.fromAngle(
        player.angle + Math.PI + (Math.random() - 0.5) * 0.22,
        exhaustSpeed,
      ).add(player.velocity.clone().scale(0.12));
      const life = 0.2 + Math.random() * 0.22;
      this.addParticle({
        position,
        velocity,
        life,
        maxLife: life,
        color: Math.random() < 0.35 ? "#d8fbff" : "#70f0b1",
        kind: Math.random() < 0.72 ? "spark" : "glow",
        size: 1 + thrust * 1.2,
        growth: -0.8,
        drag: 0.3,
        rotation: player.angle + Math.PI,
        spin: 0,
      });
    }
  }

  private updateSpawning(delta: number): void {
    this.spawnCooldown -= delta;
    let bossActive = this.enemies.some((enemy) => enemy.kind === "boss");
    const bossWave = this.wave >= 5 && this.wave % 5 === 0;
    const scheduled = this.scheduledFormations[0];
    if (scheduled && scheduled.at <= this.elapsed) {
      const projectedThreat = this.activeThreat + formationThreat(scheduled.id);
      if (!bossWave && !bossActive && projectedThreat <= threatLimit(this.wave) * 1.25) {
        this.scheduledFormations.shift();
        this.spawnFormation(scheduled.id, scheduled.preferredTop);
      } else {
        scheduled.at = this.elapsed + 0.75;
      }
    }

    if (bossWave && this.lastBossWave !== this.wave) {
      if (this.activeThreat > bossArrivalThreatLimit(this.wave)) {
        this.spawnCooldown = Math.max(this.spawnCooldown, 0.55);
        return;
      }
      this.lastBossWave = this.wave;
      this.spawnEnemy("boss");
      this.spawnCooldown = 3.5;
      return;
    }

    if (this.spawnCooldown > 0) {
      return;
    }

    bossActive = this.enemies.some((enemy) => enemy.kind === "boss");
    if (this.activeThreat >= threatLimit(this.wave)) {
      this.spawnCooldown = 0.4;
      return;
    }

    const interval = randomSpawnInterval(this.wave, bossActive);
    this.spawnCooldown += interval * (0.78 + Math.random() * 0.5);
    const choice = chooseSpawn(this.wave, Math.random(), bossActive);
    if (choice === "centipede") {
      this.spawnCentipede();
    } else {
      this.spawnEnemy(choice);
    }
  }

  private spawnFormation(id: FormationId, preferredTop: number): void {
    const definition = FORMATIONS[id];
    const top = formationTop(definition, preferredTop, this.worldHeight);
    for (const placement of definition.placements) {
      this.spawnEnemy(placement.kind, {
        y: top + placement.y,
        xOffset: placement.x,
        speed: definition.speed,
        inFormation: true,
      });
    }
    this.spawnCooldown = Math.max(this.spawnCooldown, 2.1);
  }

  private spawnCentipede(): void {
    const y = this.openSpawnY(ENEMIES.curve.radius);
    const length = centipedeLength(Math.random);
    for (let segment = 0; segment < length; segment += 1) {
      this.spawnEnemy("curve", {
        y,
        xOffset: segment * 26,
        speed: ENEMIES.curve.speed,
        pathOffset: y,
        inFormation: true,
      });
    }
  }

  private spawnEnemy(kind: EnemyKind, options: SpawnEnemyOptions = {}): void {
    const definition = ENEMIES[kind];
    const y = options.y ?? this.openSpawnY(definition.radius);
    const healthScale = 1 + (this.wave - 1) * 0.12;
    const health =
      kind === "boss" ? definition.health + this.wave * 105 : definition.health * healthScale;
    this.enemies.push({
      id: this.nextEnemyId++,
      kind,
      position: new Vector(
        options.xOffset === undefined
          ? WORLD_WIDTH + definition.radius + 10
          : WORLD_WIDTH + 30 + options.xOffset,
        kind === "boss" ? this.worldHeight / 2 : y,
      ),
      velocity: new Vector(-(options.speed ?? definition.speed), 0),
      radius: definition.radius,
      health,
      maxHealth: health,
      reward: Math.round(
        (kind === "boss" ? definition.reward + this.wave * 40 : definition.reward) *
          (1 + this.wave * 0.035),
      ),
      contactDamage: definition.contactDamage,
      age: 0,
      phase: Math.random() * Math.PI * 2,
      inFormation: options.inFormation ?? false,
      pathOffset: options.pathOffset ?? y,
      shootCooldown: kind === "boss" ? 0.15 + Math.random() * 0.25 : Number.POSITIVE_INFINITY,
      hitFlash: 0,
    });
  }

  private updateEnemies(player: Player, delta: number): void {
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      if (!enemy) {
        continue;
      }
      enemy.age += delta;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - delta * 5);
      enemy.shootCooldown -= delta;

      if (enemy.kind === "scout" && !enemy.inFormation) {
        enemy.position.y += Math.sin(enemy.age * 3.4 + enemy.phase) * 34 * delta;
      } else if (enemy.kind === "eagle") {
        const speed = enemy.velocity.length;
        const desired = Vector.between(enemy.position, player.position).normalize().scale(speed);
        enemy.velocity.add(desired.scale(delta * 1.15)).normalize().scale(speed);
      } else if (enemy.kind === "zipper") {
        enemy.velocity.scale(Math.pow(1.01, delta * 20)).limit(650);
      } else if (enemy.kind === "wall") {
        const speed = enemy.velocity.length;
        const desired = new Vector(-1, Math.sign(player.position.y - enemy.position.y) * 0.7)
          .normalize()
          .scale(speed);
        enemy.velocity.add(desired.scale(delta * 0.8)).normalize().scale(speed);
      } else if (enemy.kind === "boss") {
        if (enemy.position.x < WORLD_WIDTH * 0.5) {
          enemy.velocity.x = ENEMIES.boss.speed;
        } else if (enemy.position.x > WORLD_WIDTH * 0.75) {
          enemy.velocity.x = -ENEMIES.boss.speed;
        }
      }

      enemy.position.add(enemy.velocity.clone().scale(delta));
      if (enemy.kind === "curve") {
        const amplitude = (this.worldHeight - 30) / 2;
        enemy.position.y =
          15 +
          amplitude +
          Math.cos(((enemy.pathOffset + enemy.position.x) / WORLD_WIDTH) * Math.PI * 2) *
            amplitude;
      } else if (enemy.kind === "boss") {
        enemy.position.y = this.worldHeight / 2;
      }
      enemy.position.y = clamp(enemy.position.y, enemy.radius, this.worldHeight - enemy.radius);

      if (enemy.shootCooldown <= 0 && enemy.kind === "boss") {
        this.enemyFire(enemy, player);
      }

      let blockingMount: WeaponMount | undefined;
      let blockingDistance = Number.POSITIVE_INFINITY;
      for (const mount of player.weapons) {
        const definition = WEAPONS[mount.id];
        const position = this.weaponPosition(mount);
        if (!this.enemyOverlapsCircle(enemy, position, definition.collisionRadius)) {
          continue;
        }
        const distance = Vector.between(enemy.position, position).length;
        if (distance < blockingDistance) {
          blockingDistance = distance;
          blockingMount = mount;
        }
      }
      if (blockingMount) {
        if (blockingMount.contactCooldown <= 0) {
          blockingMount.contactCooldown = 0.22;
          if (blockingMount.id === "shell" || blockingMount.id === "shell2") {
            const absorbed = Math.min(enemy.health, blockingMount.health);
            this.damageWeapon(blockingMount, absorbed);
            enemy.health -= absorbed;
          } else {
            const definition = WEAPONS[blockingMount.id];
            this.damageWeapon(
              blockingMount,
              enemy.contactDamage * (definition.contactDamageTakenScale ?? 0.48),
            );
            enemy.health -= definition.contactDamage ?? 16;
          }
        }
        enemy.velocity.x = Math.max(150, Math.abs(enemy.velocity.x) * 0.7);
        enemy.position.x += 4;
        if (enemy.health <= 0) {
          this.destroyEnemy(index, enemy);
          continue;
        }
      } else if (
        this.enemyOverlapsCircle(enemy, player.position, this.playerCollisionRadius(player))
      ) {
        this.damagePlayer(enemy.contactDamage);
        enemy.health -= 65;
        enemy.velocity.x += 180;
        if (enemy.health <= 0) {
          this.destroyEnemy(index, enemy);
          continue;
        }
      }

      if (enemy.position.x < -enemy.radius * 2) {
        this.enemies.splice(index, 1);
      }
    }
  }

  private get activeThreat(): number {
    return this.enemies.reduce((total, enemy) => total + enemyThreat(enemy.kind), 0);
  }

  private openSpawnY(radius: number): number {
    const minimum = radius + 18;
    const maximum = this.worldHeight - radius - 18;
    const occupied = this.enemies
      .filter((enemy) => enemy.position.x > WORLD_WIDTH * 0.55)
      .map((enemy) => enemy.position.y);
    return chooseOpenLaneY(minimum, maximum, occupied, Math.random);
  }

  private enemyFire(enemy: Enemy, player: Player): void {
    enemy.shootCooldown += 0.18 + Math.random() * 0.22;
    const direction = Vector.between(enemy.position, player.position).normalize();
    this.projectiles.push({
      position: enemy.position.clone().add(Vector.fromAngle(direction.angle, enemy.radius * 0.8)),
      velocity: Vector.fromAngle(direction.angle, 390),
      radius: 5,
      damage: 13,
      life: 5,
      color: "#ffbf66",
      friendly: false,
      pierce: 0,
      hitEnemies: new Set(),
      turnTarget: null,
      beamLength: 0,
      penetration: null,
      blastRadius: 0,
    });
  }

  private updateProjectiles(player: Player, delta: number): void {
    for (
      let projectileIndex = this.projectiles.length - 1;
      projectileIndex >= 0;
      projectileIndex -= 1
    ) {
      const projectile = this.projectiles[projectileIndex];
      if (!projectile) {
        continue;
      }

      if (projectile.turnTarget !== null) {
        const difference = Math.atan2(
          Math.sin(projectile.turnTarget - projectile.velocity.angle),
          Math.cos(projectile.turnTarget - projectile.velocity.angle),
        );
        const nextAngle = projectile.velocity.angle + difference * Math.min(1, delta * 2.8);
        projectile.velocity = Vector.fromAngle(nextAngle, projectile.velocity.length);
      }
      const previousPosition = projectile.position.clone();
      projectile.position.add(projectile.velocity.clone().scale(delta));
      const nextPosition = projectile.position.clone();
      projectile.life -= delta;
      let removeProjectile =
        projectile.life <= 0 ||
        projectile.position.x < -50 ||
        projectile.position.x > WORLD_WIDTH + 50 ||
        projectile.position.y < -50 ||
        projectile.position.y > this.worldHeight + 50;

      if (projectile.friendly) {
        const collisions = this.enemies
          .filter((enemy) => !projectile.hitEnemies.has(enemy.id))
          .map((enemy) => ({
            enemy,
            impact: this.enemyProjectileImpact(
              enemy,
              previousPosition,
              nextPosition,
              projectile.radius,
            ),
          }))
          .filter(
            (collision): collision is { enemy: Enemy; impact: SegmentHit } =>
              collision.impact !== null,
          )
          .sort((left, right) => left.impact.fraction - right.impact.fraction);

        for (const collision of collisions) {
          const { enemy, impact } = collision;
          const enemyIndex = this.enemies.indexOf(enemy);
          if (enemyIndex < 0) {
            continue;
          }
          projectile.hitEnemies.add(enemy.id);
          const laserImpact =
            projectile.penetration === null
              ? null
              : resolveLaserImpact(projectile.penetration, ENEMIES[enemy.kind].resistance);
          enemy.health -= laserImpact?.reflects ? projectile.damage / 3 : projectile.damage;
          enemy.hitFlash = 1;
          projectile.position.x =
            previousPosition.x + (nextPosition.x - previousPosition.x) * impact.fraction;
          projectile.position.y =
            previousPosition.y + (nextPosition.y - previousPosition.y) * impact.fraction;
          this.createImpact(
            projectile.position,
            projectile.color,
            impact.normal,
            laserImpact?.reflects ? 8 : 4,
          );
          if (enemy.health <= 0) {
            this.destroyEnemy(enemyIndex, enemy, projectile.velocity);
          }
          if (laserImpact?.reflects) {
            projectile.penetration = laserImpact.remainingPenetration;
            projectile.friendly = false;
            projectile.velocity = reflectVector(projectile.velocity, impact.normal);
            projectile.position.add(projectile.velocity.clone().normalize().scale(1.5));
            projectile.turnTarget = null;
            break;
          }
          if (laserImpact) {
            projectile.penetration = laserImpact.remainingPenetration;
            if (projectile.penetration < 1) {
              removeProjectile = true;
              break;
            }
            continue;
          }
          if (projectile.blastRadius > 0) {
            this.detonateFlak(projectile, enemy.id);
            removeProjectile = true;
            break;
          }
          if (projectile.pierce <= 0) {
            removeProjectile = true;
            break;
          }
          projectile.pierce -= 1;
        }
        if (!removeProjectile && projectile.friendly) {
          projectile.position = nextPosition;
        }
      } else {
        let blockingMount: WeaponMount | null = null;
        let closestFraction = Number.POSITIVE_INFINITY;
        for (const mount of player.weapons) {
          const definition = WEAPONS[mount.id];
          const fraction = segmentCircleHitFraction(
            previousPosition,
            nextPosition,
            this.weaponPosition(mount),
            projectile.radius + definition.collisionRadius,
          );
          if (fraction !== null && fraction < closestFraction) {
            closestFraction = fraction;
            blockingMount = mount;
          }
        }
        const hullFraction = segmentCircleHitFraction(
          previousPosition,
          nextPosition,
          player.position,
          projectile.radius + this.playerCollisionRadius(player),
        );
        const hitHull = hullFraction !== null && hullFraction < closestFraction;
        const impactFraction = hitHull ? hullFraction : closestFraction;
        if (impactFraction !== null && Number.isFinite(impactFraction)) {
          projectile.position.x =
            previousPosition.x + (nextPosition.x - previousPosition.x) * impactFraction;
          projectile.position.y =
            previousPosition.y + (nextPosition.y - previousPosition.y) * impactFraction;
        }

        if (hitHull) {
          this.createImpact(
            projectile.position,
            projectile.color,
            Vector.fromAngle(projectile.velocity.angle + Math.PI),
            6,
          );
          this.damagePlayer(projectile.damage);
          removeProjectile = true;
        } else if (blockingMount) {
          this.createImpact(
            projectile.position,
            projectile.color,
            Vector.fromAngle(projectile.velocity.angle + Math.PI),
            5,
          );
          this.damageWeapon(blockingMount, projectile.damage);
          removeProjectile = true;
        }
      }

      if (removeProjectile) {
        this.projectiles.splice(projectileIndex, 1);
      }
    }
  }

  private updateParticles(delta: number): void {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      if (!particle) {
        continue;
      }
      if (!advanceEffectParticle(particle, delta)) {
        this.particles.splice(index, 1);
      }
    }
  }

  private updateWireFragments(delta: number): void {
    for (let index = this.wireFragments.length - 1; index >= 0; index -= 1) {
      const fragment = this.wireFragments[index];
      if (!fragment) {
        continue;
      }
      if (!advanceWireFragment(fragment, delta)) {
        this.wireFragments.splice(index, 1);
      }
    }
  }

  private fireWeapon(mount: WeaponMount, playerAngle: number): void {
    const definition = WEAPONS[mount.id];
    const cooldown = weaponCooldown(definition, mount.level);
    const damage = weaponDamage(definition, mount.level);
    const mountPosition = this.weaponPosition(mount);
    const mountFacingAngle =
      mount.id === "drone" ? this.droneTargetAngle(mountPosition, playerAngle) : playerAngle;
    const origin = this.weaponMuzzlePosition(mount);
    const fire = (
      angle: number,
      offset = 0,
      radius = 3.5,
      pierce = 0,
      turnTarget: number | null = null,
      beamLength = 0,
      penetration: number | null = null,
      blastRadius = 0,
      life = 2.4,
    ): void => {
      this.createPlayerProjectile(
        angle,
        offset,
        damage,
        definition.projectileSpeed,
        definition.color,
        radius,
        pierce,
        origin,
        turnTarget,
        beamLength,
        penetration,
        blastRadius,
        life,
      );
      const muzzleAngle = Math.atan2(
        Math.sin(angle - mountFacingAngle),
        Math.cos(angle - mountFacingAngle),
      );
      mount.feedback = triggerWeaponFeedback(mount.feedback, muzzleAngle);
      this.createMuzzleEffect(
        origin,
        definition.color,
        angle,
        definition.recoilDistance,
        mount.id,
      );
    };

    switch (mount.id) {
      case "rapid":
        fire(playerAngle - 0.018);
        mount.cooldown += cooldown;
        mount.phase += 0.43;
        break;
      case "rapid2":
        fire(playerAngle + 0.018);
        mount.cooldown += cooldown;
        mount.phase += 0.43;
        break;
      case "fan":
        fire(playerAngle + Math.sin(mount.phase) * 0.68);
        mount.cooldown += cooldown;
        mount.phase += 0.43;
        break;
      case "pulse": {
        if ((mount.clipAmmo ?? 0) <= 0) {
          if ((mount.ammo ?? 0) > 0) {
            mount.ammo = Math.max(0, (mount.ammo ?? 0) - 1);
            mount.clipAmmo = pulseClipSize(mount.level);
            mount.cooldown += pulseReloadTime(mount.level);
          }
          break;
        }
        mount.clipAmmo = Math.max(0, (mount.clipAmmo ?? 0) - 1);
        fire(playerAngle, 0, 8, 1);
        mount.cooldown += cooldown;
        break;
      }
      case "spray": {
        const barrelCount = 5 + mount.level * 2;
        const barrel = Math.floor(mount.phase) % barrelCount;
        const arc = barrelCount === 1 ? 0 : barrel / (barrelCount - 1) - 0.5;
        fire(playerAngle + arc * (140 * Math.PI) / 180, 0, 3.5, 0, playerAngle);
        mount.phase += 1;
        mount.cooldown += cooldown;
        break;
      }
      case "laser": {
        if (mount.burstShots <= 0) {
          if ((mount.ammo ?? 0) <= 0) {
            break;
          }
          mount.ammo = Math.max(0, (mount.ammo ?? 0) - 1);
          mount.burstShots = 30;
        }
        mount.burstShots -= 1;
        fire(playerAngle, 0, 2.5, 0, null, 115, 2 + (mount.level - 1) * 22);
        mount.cooldown += cooldown;
        break;
      }
      case "orbit":
        fire(playerAngle + Math.sin(mount.phase * 1.7) * 0.3, Math.sin(mount.phase) * 4);
        mount.cooldown += cooldown;
        mount.phase += 0.43;
        break;
      case "drone": {
        const targetAngle = this.droneTargetAngle(origin, playerAngle);
        fire(targetAngle + Math.sin(mount.phase) * 0.025);
        mount.cooldown += cooldown;
        mount.phase += 0.7;
        break;
      }
      case "blade":
        fire(playerAngle, 0, 7, 1, null, 24, null, 0, 0.58);
        mount.cooldown += cooldown;
        mount.phase += 0.43;
        break;
      case "rail":
        fire(playerAngle, 0, 4, railPierce(mount.level));
        mount.cooldown += cooldown;
        mount.phase += 0.43;
        break;
      case "flak":
        fire(playerAngle, 0, 6, 0, null, 0, null, flakBlastRadius(mount.level));
        mount.cooldown += cooldown;
        mount.phase += 0.43;
        break;
      case "shell":
      case "shell2": {
        for (const angle of shellAngles(mount.id, mount.level)) {
          fire(playerAngle + angle, 0, 5);
        }
        mount.cooldown += cooldown;
        mount.phase += 0.43;
        break;
      }
    }
  }

  private createPlayerProjectile(
    angle: number,
    perpendicularOffset: number,
    damage: number,
    speed: number,
    color: string,
    radius = 3.5,
    pierce = 0,
    origin?: Point,
    turnTarget: number | null = null,
    beamLength = 0,
    penetration: number | null = null,
    blastRadius = 0,
    life = 2.4,
  ): void {
    const player = this.player;
    if (!player) {
      return;
    }
    const start = origin ? new Vector(origin.x, origin.y) : player.position.clone();
    const forward = Vector.fromAngle(angle, origin ? 4 : 26);
    const perpendicular = Vector.fromAngle(angle + Math.PI / 2, perpendicularOffset);
    this.projectiles.push({
      position: start.add(forward).add(perpendicular),
      velocity: Vector.fromAngle(angle, speed),
      radius,
      damage,
      life,
      color,
      friendly: true,
      pierce,
      hitEnemies: new Set(),
      turnTarget,
      beamLength,
      penetration,
      blastRadius,
    });
  }

  private detonateFlak(projectile: Projectile, primaryEnemyId: number): void {
    this.createBurst(projectile.position, projectile.color, 18);
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      if (!enemy || enemy.id === primaryEnemyId) {
        continue;
      }
      const surfaceDistance = Math.max(
        0,
        Vector.between(projectile.position, enemy.position).length - enemy.radius,
      );
      const damage = flakSplashDamage(projectile.damage, projectile.blastRadius, surfaceDistance);
      if (damage <= 0) {
        continue;
      }
      enemy.health -= damage;
      enemy.hitFlash = 1;
      if (enemy.health <= 0) {
        this.destroyEnemy(
          index,
          enemy,
          Vector.between(projectile.position, enemy.position).normalize().scale(420),
        );
      }
    }
  }

  private weaponPosition(mount: WeaponMount): Vector {
    const player = this.player;
    if (!player) {
      return new Vector();
    }
    const offset = player.ship.mounts[mount.id];
    if (!offset) {
      return player.position.clone();
    }
    const animatedOffset = animatedMountOffset(
      offset,
      WEAPONS[mount.id].movement,
      mount.motionPhase,
    );
    return this.playerOffsetPosition(player, animatedOffset);
  }

  private weaponMuzzlePosition(mount: WeaponMount): Vector {
    const player = this.player;
    if (!player) {
      return new Vector();
    }
    const definition = WEAPONS[mount.id];
    const position = this.weaponPosition(mount);
    const angle =
      mount.id === "drone" ? this.droneTargetAngle(position, player.angle) : player.angle;
    return position
      .add(Vector.fromAngle(angle, definition.muzzleOffset.x))
      .add(Vector.fromAngle(angle + Math.PI / 2, definition.muzzleOffset.y));
  }

  private playerOffsetPosition(player: Player, offset: Point): Vector {
    return transformLocalPoint(player.position, player.angle, offset);
  }

  private droneTargetAngle(origin: Point, fallbackAngle: number): number {
    let closestDistance = 720;
    let targetAngle = fallbackAngle;
    for (const enemy of this.enemies) {
      const direction = Vector.between(origin, enemy.position);
      const angleDifference = Math.abs(
        Math.atan2(
          Math.sin(direction.angle - fallbackAngle),
          Math.cos(direction.angle - fallbackAngle),
        ),
      );
      if (direction.length < closestDistance && angleDifference < 1.2) {
        closestDistance = direction.length;
        targetAngle = direction.angle;
      }
    }
    return targetAngle;
  }

  private clampPlayerToWorld(player: Player): void {
    const padding = 8;
    let minimumX = Number.POSITIVE_INFINITY;
    let maximumX = Number.NEGATIVE_INFINITY;
    let minimumY = Number.POSITIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;
    const includePoint = (point: Point, radius = 0): void => {
      minimumX = Math.min(minimumX, point.x - radius);
      maximumX = Math.max(maximumX, point.x + radius);
      minimumY = Math.min(minimumY, point.y - radius);
      maximumY = Math.max(maximumY, point.y + radius);
    };

    for (const point of player.ship.shape) {
      includePoint(transformLocalPoint({ x: 0, y: 0 }, player.angle, point));
    }
    for (const mount of player.weapons) {
      const offset = player.ship.mounts[mount.id];
      if (offset) {
        const definition = WEAPONS[mount.id];
        const bounds = mountMotionBounds(
          offset,
          definition.movement,
          definition.collisionRadius,
        );
        for (const corner of [
          bounds.minimum,
          { x: bounds.minimum.x, y: bounds.maximum.y },
          bounds.maximum,
          { x: bounds.maximum.x, y: bounds.minimum.y },
        ]) {
          includePoint(transformLocalPoint({ x: 0, y: 0 }, player.angle, corner));
        }
      }
    }

    const leftBoundary = Math.max(35, padding - minimumX);
    const rightBoundary = Math.min(WORLD_WIDTH * 0.62, WORLD_WIDTH - padding - maximumX);
    player.position.x = clamp(player.position.x, leftBoundary, rightBoundary);
    player.position.y = clamp(
      player.position.y,
      Math.max(35, padding - minimumY),
      Math.min(this.worldHeight - 35, this.worldHeight - padding - maximumY),
    );
  }

  private destroyEnemy(index: number, enemy: Enemy, impulse?: Point): void {
    this.enemies.splice(index, 1);
    this.score += Math.round(enemy.maxHealth);
    this.credits += enemy.reward;
    this.explodeEnemy(enemy, impulse);
  }

  private explodeEnemy(enemy: Enemy, impulse?: Point): void {
    const definition = ENEMIES[enemy.kind];
    const color = definition.color;
    this.explodeWireframe(
      enemy.position,
      enemy.kind === "eagle" ? enemy.velocity.angle : Math.PI,
      definition.shape,
      definition.details,
      color,
      enemy.velocity,
      impulse,
      enemy.kind === "boss" ? 185 : 135,
      enemy.kind === "boss" ? 1.65 : 1.18,
      enemy.kind === "boss" ? 2.5 : 1.5,
    );
    if (enemy.kind === "boss") {
      const ring = Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        return {
          x: Math.cos(angle) * enemy.radius * 0.55,
          y: Math.sin(angle) * enemy.radius * 0.55,
        };
      });
      this.explodeWireframe(
        enemy.position,
        Math.PI - enemy.age * 0.7,
        ring,
        [],
        color,
        enemy.velocity,
        impulse,
        210,
        1.75,
        2,
      );
    }
    this.createBurst(
      enemy.position,
      enemy.kind === "boss" ? "#ffc766" : "#ff5c75",
      enemy.kind === "boss" ? 55 : 14,
    );
  }

  private damagePlayer(damage: number): void {
    const player = this.player;
    if (!player || player.invulnerable > 0) {
      return;
    }
    player.health = Math.max(0, player.health - damage);
    player.invulnerable = 0.58;
    this.screenFlash = 0.5;
    this.createBurst(player.position, "#3de3ff", 12);
    if (player.health <= 0) {
      this.beginPlayerDestruction(player);
    }
  }

  private beginPlayerDestruction(player: Player): void {
    const impulse = player.velocity.clone();
    for (const mount of player.weapons) {
      const definition = WEAPONS[mount.id];
      const position = this.weaponPosition(mount);
      const angle =
        mount.id === "drone" ? this.droneTargetAngle(position, player.angle) : player.angle;
      this.explodeWireframe(
        position,
        angle,
        definition.shape,
        definition.details,
        definition.color,
        player.velocity,
        impulse,
        165,
        1.55,
        1.7,
      );
      this.createBurst(position, definition.color, 7);
    }
    this.explodeWireframe(
      player.position,
      player.angle,
      player.ship.shape,
      player.ship.details,
      "#3de3ff",
      player.velocity,
      impulse,
      185,
      1.75,
      2,
    );
    this.createBurst(player.position, "#3de3ff", 38);
    this.screenFlash = 1;
    this.destructionCountdown = DESTRUCTION_DURATION;
    this.pendingRespawn = this.credits >= RESPAWN_COST;
    this.setState("destroyed");
  }

  private damageWeapon(mount: WeaponMount, damage: number): void {
    const player = this.player;
    if (!player) {
      return;
    }
    const position = this.weaponPosition(mount);
    const definition = WEAPONS[mount.id];
    mount.health = Math.max(0, mount.health - damage);
    mount.hitFlash = 1;
    this.createBurst(position, definition.color, 5);
    if (mount.health <= 0) {
      const angle =
        mount.id === "drone" ? this.droneTargetAngle(position, player.angle) : player.angle;
      const index = player.weapons.indexOf(mount);
      if (index >= 0) {
        player.weapons.splice(index, 1);
      }
      this.explodeWireframe(
        position,
        angle,
        definition.shape,
        definition.details,
        definition.color,
        player.velocity,
        undefined,
        145,
        1.25,
        1.7,
      );
      this.createBurst(position, "#f7fbff", 18);
    }
  }

  private playerCollisionRadius(player: Player): number {
    return player.ship.collisionRadius;
  }

  private enemyOverlapsCircle(enemy: Enemy, center: Point, radius: number): boolean {
    const collision = ENEMIES[enemy.kind].collision;
    if (collision.type === "box") {
      return rectangleCircleOverlap(
        enemy.position,
        collision.halfWidth,
        collision.halfHeight,
        center,
        radius,
      );
    }
    return circlesOverlap(enemy.position, collision.radius, center, radius);
  }

  private enemyProjectileImpact(
    enemy: Enemy,
    start: Point,
    end: Point,
    projectileRadius: number,
  ): SegmentHit | null {
    const collision = ENEMIES[enemy.kind].collision;
    if (collision.type === "box") {
      return segmentRectangleHit(
        start,
        end,
        enemy.position,
        collision.halfWidth + projectileRadius,
        collision.halfHeight + projectileRadius,
      );
    }
    return segmentCircleHit(
      start,
      end,
      enemy.position,
      projectileRadius + collision.radius,
    );
  }

  private addParticle(particle: EffectParticle): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES + 1);
    }
    this.particles.push(particle);
  }

  private explodeWireframe(
    origin: Point,
    rotation: number,
    shape: readonly Point[],
    details: readonly WireframeSegment[],
    color: string,
    inheritedVelocity?: Point,
    impulse?: Point,
    outwardSpeed?: number,
    lifetime?: number,
    lineWidth?: number,
  ): void {
    const fragments = createWireExplosion({
      origin,
      rotation,
      shape,
      details,
      color,
      inheritedVelocity,
      impulse,
      outwardSpeed,
      lifetime,
      lineWidth,
    });
    const overflow = this.wireFragments.length + fragments.length - MAX_WIRE_FRAGMENTS;
    if (overflow > 0) {
      this.wireFragments.splice(0, overflow);
    }
    this.wireFragments.push(...fragments);
  }

  private createBurst(position: Point, color: string, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const smoke = index % 5 === 0;
      const life = smoke ? 0.55 + Math.random() * 0.5 : 0.25 + Math.random() * 0.6;
      this.addParticle({
        position: new Vector(position.x, position.y),
        velocity: Vector.fromAngle(
          Math.random() * Math.PI * 2,
          smoke ? 18 + Math.random() * 55 : 45 + Math.random() * 210,
        ),
        life,
        maxLife: life,
        color,
        kind: smoke ? "smoke" : "spark",
        size: smoke ? 3 + Math.random() * 4 : 1 + Math.random() * 2.2,
        growth: smoke ? 9 + Math.random() * 12 : -0.6,
        drag: smoke ? 0.35 : 0.16,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 9,
      });
    }
    if (count >= 10) {
      const ringLife = 0.38 + Math.min(0.3, count / 160);
      this.addParticle({
        position: new Vector(position.x, position.y),
        velocity: new Vector(),
        life: ringLife,
        maxLife: ringLife,
        color,
        kind: "ring",
        size: 4,
        growth: 72 + count * 1.7,
        drag: 1,
        rotation: 0,
        spin: 0,
      });
      this.addParticle({
        position: new Vector(position.x, position.y),
        velocity: new Vector(),
        life: 0.18,
        maxLife: 0.18,
        color,
        kind: "glow",
        size: 8 + Math.min(28, count * 0.6),
        growth: 34,
        drag: 1,
        rotation: 0,
        spin: 0,
      });
    }
  }

  private createImpact(
    position: Point,
    color: string,
    direction: Point,
    count: number,
  ): void {
    const baseAngle = Math.atan2(direction.y, direction.x);
    for (let index = 0; index < count; index += 1) {
      const life = 0.16 + Math.random() * 0.24;
      const angle = baseAngle + (Math.random() - 0.5) * 1.25;
      this.addParticle({
        position: new Vector(position.x, position.y),
        velocity: Vector.fromAngle(angle, 110 + Math.random() * 210),
        life,
        maxLife: life,
        color: index === 0 ? "#ffffff" : color,
        kind: "spark",
        size: 1 + Math.random() * 1.5,
        growth: -0.8,
        drag: 0.12,
        rotation: angle,
        spin: 0,
      });
    }
  }

  private createMuzzleEffect(
    position: Point,
    color: string,
    angle: number,
    recoilDistance: number,
    weaponId: WeaponId,
  ): void {
    if (weaponId === "laser" || Math.random() > 0.82) {
      return;
    }
    const heavy = recoilDistance >= 7;
    const life = heavy ? 0.3 + Math.random() * 0.2 : 0.12 + Math.random() * 0.12;
    this.addParticle({
      position: new Vector(position.x, position.y),
      velocity: Vector.fromAngle(
        angle + Math.PI + (Math.random() - 0.5) * 0.65,
        18 + recoilDistance * 5 + Math.random() * 35,
      ),
      life,
      maxLife: life,
      color,
      kind: heavy ? "smoke" : "glow",
      size: heavy ? 2.5 + recoilDistance * 0.18 : 2,
      growth: heavy ? 8 : 2,
      drag: 0.28,
      rotation: angle + Math.PI,
      spin: (Math.random() - 0.5) * 2,
    });
  }

  private render(time: number): void {
    const context = this.context;
    const scale = this.canvas.width / WORLD_WIDTH;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, WORLD_WIDTH, this.worldHeight);
    this.renderBackground(time);
    this.renderParticles(["smoke", "glow"]);

    for (const projectile of this.projectiles) {
      context.shadowColor = projectile.color;
      context.shadowBlur = projectile.friendly ? 12 : 8;
      if (projectile.beamLength > 0) {
        const trail = projectile.velocity.clone().normalize().scale(projectile.beamLength);
        context.beginPath();
        context.moveTo(projectile.position.x, projectile.position.y);
        context.lineTo(projectile.position.x - trail.x, projectile.position.y - trail.y);
        context.strokeStyle = projectile.color;
        context.lineWidth = projectile.radius;
        context.stroke();
      } else {
        context.beginPath();
        context.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
        context.fillStyle = projectile.color;
        context.fill();
      }
    }
    context.shadowBlur = 0;

    for (const enemy of this.enemies) {
      this.renderEnemy(enemy);
    }
    if (this.player && (this.state === "playing" || this.state === "paused")) {
      this.renderPlayer(this.player, time);
    }
    this.renderWireFragments();
    this.renderParticles(["spark", "ring"]);

    if (this.screenFlash > 0) {
      context.fillStyle = `rgba(255, 55, 88, ${this.screenFlash * 0.17})`;
      context.fillRect(0, 0, WORLD_WIDTH, this.worldHeight);
    }
  }

  private renderBackground(time: number): void {
    const context = this.context;
    const backgroundTime = this.player ? this.elapsed : time;
    const playerParallaxY = this.player
      ? this.player.position.y - this.worldHeight / 2
      : 0;
    const gradient = context.createLinearGradient(0, 0, WORLD_WIDTH, this.worldHeight);
    gradient.addColorStop(0, "#050d1b");
    gradient.addColorStop(0.55, "#030914");
    gradient.addColorStop(1, "#090713");
    context.fillStyle = gradient;
    context.fillRect(0, 0, WORLD_WIDTH, this.worldHeight);

    for (const nebula of this.nebulas) {
      const centerX = wrappedParallaxX(
        nebula.x,
        backgroundTime,
        2 + nebula.depth * 9,
        WORLD_WIDTH,
        nebula.radius,
      );
      const centerY =
        nebula.yRatio * this.worldHeight - playerParallaxY * nebula.depth * 0.08;
      const span = WORLD_WIDTH + nebula.radius * 2;
      for (const copyX of [centerX - span, centerX, centerX + span]) {
        if (copyX + nebula.radius < 0 || copyX - nebula.radius > WORLD_WIDTH) {
          continue;
        }
        const haze = context.createRadialGradient(
          copyX,
          centerY,
          0,
          copyX,
          centerY,
          nebula.radius,
        );
        haze.addColorStop(0, `rgba(${nebula.color}, ${0.08 + nebula.depth * 0.08})`);
        haze.addColorStop(0.45, `rgba(${nebula.color}, 0.035)`);
        haze.addColorStop(1, `rgba(${nebula.color}, 0)`);
        context.fillStyle = haze;
        context.fillRect(
          copyX - nebula.radius,
          centerY - nebula.radius,
          nebula.radius * 2,
          nebula.radius * 2,
        );
      }
    }

    this.renderStarLayer(backgroundTime, playerParallaxY, 0, 0.55);
    this.renderBackdropDebris(playerParallaxY);

    const moonX = wrappedParallaxX(980, backgroundTime, 3.2, WORLD_WIDTH, 190);
    context.save();
    context.strokeStyle = "rgba(133, 117, 188, 0.075)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(moonX, this.worldHeight * 0.2, 145, Math.PI * 0.72, Math.PI * 1.64);
    context.stroke();
    context.strokeStyle = "rgba(73, 128, 158, 0.045)";
    context.lineWidth = 8;
    context.beginPath();
    context.arc(moonX + 8, this.worldHeight * 0.2, 128, Math.PI * 0.72, Math.PI * 1.64);
    context.stroke();
    context.restore();

    context.strokeStyle = "rgba(61, 227, 255, 0.055)";
    context.lineWidth = 1;
    const drift = this.player ? this.elapsed * 38 : time * 8;
    const gridOffset = drift % 80;
    context.beginPath();
    for (let x = -gridOffset; x < WORLD_WIDTH; x += 80) {
      context.moveTo(x, 0);
      context.lineTo(x, this.worldHeight);
    }
    for (let y = 40; y < this.worldHeight; y += 80) {
      context.moveTo(0, y);
      context.lineTo(WORLD_WIDTH, y);
    }
    context.stroke();

    this.renderStarLayer(backgroundTime, playerParallaxY, 0.55, 1.01);
    context.globalAlpha = 1;
  }

  private renderStarLayer(
    time: number,
    playerParallaxY: number,
    minimumDepth: number,
    maximumDepth: number,
  ): void {
    const context = this.context;
    for (const star of this.stars) {
      if (star.depth < minimumDepth || star.depth >= maximumDepth) {
        continue;
      }
      const twinkle = 0.78 + Math.sin(time * (0.7 + star.depth) + star.twinkle) * 0.22;
      context.globalAlpha = (0.16 + star.depth * 0.68) * twinkle;
      context.fillStyle = star.depth > 0.75 ? "#9aefff" : "#b9c9da";
      const y = star.y - playerParallaxY * star.depth * 0.025;
      const streak =
        this.state === "playing" || this.state === "destroyed"
          ? 0.5 + star.depth * 3.5
          : star.size;
      context.fillRect(star.x - streak, y, streak + star.size, star.size);
    }
    context.globalAlpha = 1;
  }

  private renderBackdropDebris(playerParallaxY: number): void {
    const context = this.context;
    for (const debris of this.backdropDebris) {
      context.save();
      context.translate(
        debris.x,
        debris.y - playerParallaxY * debris.depth * 0.045,
      );
      context.rotate(debris.rotation);
      context.globalAlpha = 0.025 + debris.depth * 0.065;
      context.strokeStyle = "#8191b8";
      context.lineWidth = 1;
      context.beginPath();
      for (let point = 0; point < debris.sides; point += 1) {
        const angle = (point / debris.sides) * Math.PI * 2;
        const radius = debris.size * (0.72 + Math.sin(point * 2.37 + debris.sides) * 0.18);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (point === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
      context.stroke();
      context.beginPath();
      context.moveTo(-debris.size * 0.35, 0);
      context.lineTo(debris.size * 0.45, 0);
      context.stroke();
      context.restore();
    }
  }

  private renderParticles(kinds: readonly ParticleKind[]): void {
    const context = this.context;
    for (const particle of this.particles) {
      if (!kinds.includes(particle.kind)) {
        continue;
      }
      const opacity = effectOpacity(particle);
      if (opacity <= 0) {
        continue;
      }
      context.save();
      context.translate(particle.position.x, particle.position.y);
      context.rotate(particle.rotation);
      context.globalAlpha = opacity;
      context.fillStyle = particle.color;
      context.strokeStyle = particle.color;
      if (particle.kind === "spark") {
        const streak = Math.min(18, 3 + particle.velocity.length * 0.035);
        context.shadowColor = particle.color;
        context.shadowBlur = 5;
        context.lineWidth = Math.max(1, particle.size);
        context.beginPath();
        context.moveTo(-streak, 0);
        context.lineTo(particle.size, 0);
        context.stroke();
      } else if (particle.kind === "ring") {
        context.lineWidth = Math.max(1, 3 * opacity);
        context.beginPath();
        context.arc(0, 0, particle.size, 0, Math.PI * 2);
        context.stroke();
      } else {
        context.shadowColor = particle.color;
        context.shadowBlur = particle.kind === "glow" ? particle.size * 1.2 : 0;
        context.beginPath();
        context.arc(0, 0, particle.size, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  private renderWireFragments(): void {
    const context = this.context;
    for (const fragment of this.wireFragments) {
      const opacity = wireFragmentOpacity(fragment);
      if (opacity <= 0) {
        continue;
      }
      context.save();
      context.translate(fragment.position.x, fragment.position.y);
      context.rotate(fragment.rotation);
      context.globalAlpha = opacity;
      context.strokeStyle = fragment.color;
      context.shadowColor = fragment.color;
      context.shadowBlur = 4 + opacity * 7;
      context.lineWidth = fragment.lineWidth;
      context.beginPath();
      context.moveTo(fragment.start.x, fragment.start.y);
      context.lineTo(fragment.end.x, fragment.end.y);
      context.stroke();
      context.restore();
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  private renderPlayer(player: Player, time: number): void {
    const context = this.context;
    const blinking = player.invulnerable > 0 && Math.floor(time * 14) % 2 === 0;
    context.save();
    context.translate(player.position.x, player.position.y);
    context.rotate(player.angle);
    context.globalAlpha = blinking ? 0.42 : 1;
    context.strokeStyle = "#3de3ff";
    context.fillStyle = "rgba(61, 227, 255, 0.08)";
    context.shadowColor = "#3de3ff";
    context.shadowBlur = 15;
    context.lineWidth = 2;
    this.tracePolygon(player.ship.shape);
    context.fill();
    context.stroke();
    this.traceSegments(player.ship.details);

    const tail = Math.min(...player.ship.shape.map((point) => point.x));
    context.beginPath();
    context.moveTo(tail, -4);
    context.lineTo(tail - 10 - Math.random() * 8, 0);
    context.lineTo(tail, 4);
    context.strokeStyle = "#70f0b1";
    context.stroke();
    context.restore();

    for (const mount of player.weapons) {
      this.renderWeaponMount(player, mount, time);
    }

    context.strokeStyle = "rgba(61, 227, 255, 0.2)";
    context.lineWidth = 1;
    context.setLineDash([4, 8]);
    context.beginPath();
    context.moveTo(player.position.x, player.position.y);
    context.lineTo(this.input.aim.x, this.input.aim.y);
    context.stroke();
    context.setLineDash([]);

    context.beginPath();
    context.arc(this.input.aim.x, this.input.aim.y, 9, 0, Math.PI * 2);
    context.moveTo(this.input.aim.x - 14, this.input.aim.y);
    context.lineTo(this.input.aim.x - 5, this.input.aim.y);
    context.moveTo(this.input.aim.x + 5, this.input.aim.y);
    context.lineTo(this.input.aim.x + 14, this.input.aim.y);
    context.strokeStyle = "rgba(216, 251, 255, 0.72)";
    context.stroke();
  }

  private renderWeaponMount(player: Player, mount: WeaponMount, time: number): void {
    const context = this.context;
    const definition = WEAPONS[mount.id];
    const position = this.weaponPosition(mount);
    const maximum = weaponMaxDurability(definition, mount.level);
    const damaged = mount.health < maximum;
    const blinking = mount.hitFlash > 0 && Math.floor(time * 18) % 2 === 0;

    if (definition.movement) {
      context.save();
      context.strokeStyle = `${definition.color}2e`;
      context.lineWidth = 1;
      context.setLineDash([3, 6]);
      context.beginPath();
      context.moveTo(player.position.x, player.position.y);
      context.lineTo(position.x, position.y);
      context.stroke();
      context.restore();
    }

    context.save();
    context.translate(position.x, position.y);
    context.rotate(
      mount.id === "drone" ? this.droneTargetAngle(position, player.angle) : player.angle,
    );
    const recoilOffset =
      definition.recoilDistance * Math.sin((mount.feedback.recoil * Math.PI) / 2);
    context.translate(-recoilOffset, 0);
    context.strokeStyle = blinking ? "#ffffff" : definition.color;
    context.fillStyle = `${definition.color}18`;
    context.shadowColor = definition.color;
    context.shadowBlur = blinking ? 18 : 9;
    context.lineWidth = 1.7;
    this.tracePolygon(definition.shape);
    context.fill();
    context.stroke();
    this.traceSegments(definition.details);
    this.renderWeaponMechanism(mount, definition);
    this.renderMuzzleFlash(mount, definition);
    context.restore();

    if (damaged || mount.hitFlash > 0) {
      const width = definition.collisionRadius * 2;
      const ratio = clamp(mount.health / maximum, 0, 1);
      context.fillStyle = "rgba(255,255,255,0.12)";
      context.fillRect(position.x - width / 2, position.y - definition.collisionRadius - 8, width, 2);
      context.fillStyle = ratio < 0.3 ? "#ff5c75" : definition.color;
      context.fillRect(position.x - width / 2, position.y - definition.collisionRadius - 8, width * ratio, 2);
    }
  }

  private renderWeaponMechanism(
    mount: WeaponMount,
    definition: WeaponDefinition,
  ): void {
    const context = this.context;
    context.save();
    switch (mount.id) {
      case "rapid":
      case "rapid2": {
        const side = mount.id === "rapid" ? -1 : 1;
        const boltX = 5 - mount.feedback.recoil * 8;
        context.beginPath();
        context.moveTo(boltX - 5, side * 2.5);
        context.lineTo(boltX + 3, side * 2.5);
        context.lineWidth = 2.5;
        context.stroke();
        break;
      }
      case "fan": {
        const barrelAngle = Math.sin(mount.phase) * 0.68;
        context.beginPath();
        context.moveTo(-3, 0);
        context.lineTo(Math.cos(barrelAngle) * 17, Math.sin(barrelAngle) * 17);
        context.lineWidth = 1.5 + mount.feedback.activity;
        context.stroke();
        break;
      }
      case "pulse": {
        const clipCharge = (mount.clipAmmo ?? 0) / pulseClipSize(mount.level);
        const reloadRemaining = clamp(
          (mount.cooldown - definition.cooldown) / pulseReloadTime(mount.level),
          0,
          1,
        );
        const visibleCharge = clipCharge * (1 - reloadRemaining);
        context.beginPath();
        context.moveTo(-6, 0);
        context.lineTo(-6 + 22 * visibleCharge, 0);
        context.lineWidth = 3.5;
        context.stroke();
        context.beginPath();
        context.arc(4, 0, 3 + visibleCharge * 4, 0, Math.PI * 2);
        context.lineWidth = 1;
        context.stroke();
        break;
      }
      case "spray": {
        const barrelCount = 5 + mount.level * 2;
        const activeBarrel =
          ((Math.floor(mount.phase) - 1) % barrelCount + barrelCount) % barrelCount;
        for (let barrel = 0; barrel < barrelCount; barrel += 1) {
          const arc = barrelCount === 1 ? 0 : barrel / (barrelCount - 1) - 0.5;
          const angle = arc * (140 * Math.PI) / 180;
          context.globalAlpha = barrel === activeBarrel ? 1 : 0.4;
          context.lineWidth = barrel === activeBarrel ? 2.5 : 1;
          context.beginPath();
          context.moveTo(-2, 0);
          context.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
          context.stroke();
        }
        break;
      }
      case "laser": {
        const capacitor = mount.burstShots / 30;
        context.fillStyle = definition.color;
        context.globalAlpha = 0.25 + capacitor * 0.65;
        context.fillRect(-9, -3, 17 * capacitor, 6);
        context.beginPath();
        context.arc(4, 0, 4 + capacitor * 3, 0, Math.PI * 2);
        context.lineWidth = 1 + capacitor * 1.5;
        context.stroke();
        break;
      }
      case "orbit":
        context.rotate(mount.motionPhase * 1.8);
        context.beginPath();
        context.moveTo(-7, -7);
        context.lineTo(7, 7);
        context.moveTo(7, -7);
        context.lineTo(-7, 7);
        context.lineWidth = 1 + mount.feedback.activity;
        context.stroke();
        break;
      case "drone": {
        const wingFlex = Math.sin(mount.motionPhase * 2) * 2;
        context.beginPath();
        context.moveTo(-5, -4);
        context.lineTo(-9, -10 - wingFlex);
        context.moveTo(-5, 4);
        context.lineTo(-9, 10 + wingFlex);
        context.stroke();
        context.beginPath();
        context.arc(7, 0, 2.5 + mount.feedback.activity, 0, Math.PI * 2);
        context.fillStyle = definition.color;
        context.globalAlpha = 0.45 + mount.feedback.activity * 0.5;
        context.fill();
        break;
      }
      case "blade": {
        const sweepEnergy = 0.35 + Math.abs(Math.cos(mount.motionPhase)) * 0.65;
        context.beginPath();
        context.moveTo(-16, -2);
        context.lineTo(22, 0);
        context.lineTo(-16, 2);
        context.globalAlpha = sweepEnergy;
        context.lineWidth = 1.5 + mount.feedback.activity * 2;
        context.stroke();
        break;
      }
      case "rail": {
        const charge = clamp(
          1 - mount.cooldown / weaponCooldown(definition, mount.level),
          0,
          1,
        );
        const railSpread = 3 + charge * 2;
        context.beginPath();
        context.moveTo(-10, -railSpread);
        context.lineTo(18, -railSpread);
        context.moveTo(-10, railSpread);
        context.lineTo(18, railSpread);
        context.stroke();
        context.beginPath();
        context.moveTo(-10, 0);
        context.lineTo(-10 + 30 * charge, 0);
        context.lineWidth = 2.5;
        context.stroke();
        break;
      }
      case "flak": {
        const chamberRadius = 4 + mount.feedback.activity * 4;
        context.beginPath();
        context.arc(1, 0, chamberRadius, 0, Math.PI * 2);
        context.lineWidth = 1 + mount.feedback.activity * 1.5;
        context.stroke();
        break;
      }
      case "shell":
      case "shell2": {
        const barrelLength = 15 - mount.feedback.recoil * 3;
        for (const angle of shellAngles(mount.id, mount.level)) {
          context.beginPath();
          context.moveTo(Math.cos(angle) * 2, Math.sin(angle) * 2);
          context.lineTo(Math.cos(angle) * barrelLength, Math.sin(angle) * barrelLength);
          context.lineWidth = 1.5;
          context.stroke();
        }
        break;
      }
    }
    context.restore();
  }

  private renderMuzzleFlash(mount: WeaponMount, definition: WeaponDefinition): void {
    if (mount.feedback.muzzleFlashes.length === 0) {
      return;
    }
    const context = this.context;
    for (const flash of mount.feedback.muzzleFlashes) {
      const length = definition.muzzleFlashSize * (0.55 + flash.intensity * 0.45);
      const width = 2 + definition.muzzleFlashSize * 0.28 * flash.intensity;
      context.save();
      context.rotate(flash.angle);
      context.translate(definition.muzzleOffset.x, definition.muzzleOffset.y);
      context.globalAlpha = 0.35 + flash.intensity * 0.65;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(length, -width);
      context.lineTo(length * 0.65, 0);
      context.lineTo(length, width);
      context.closePath();
      context.fill();
      context.strokeStyle = definition.color;
      context.lineWidth = 1.25;
      context.stroke();
      context.restore();
    }
  }

  private renderEnemy(enemy: Enemy): void {
    const context = this.context;
    const color = enemy.hitFlash > 0 ? "#fff4f6" : ENEMIES[enemy.kind].color;
    context.save();
    context.translate(enemy.position.x, enemy.position.y);
    context.rotate(enemy.kind === "eagle" ? enemy.velocity.angle : Math.PI);
    context.strokeStyle = color;
    context.fillStyle = enemy.kind === "boss" ? "rgba(255, 199, 102, 0.06)" : "rgba(255, 92, 117, 0.055)";
    context.shadowColor = color;
    context.shadowBlur = enemy.kind === "boss" ? 20 : 9;
    context.lineWidth = enemy.kind === "boss" ? 2.5 : 1.5;

    const definition = ENEMIES[enemy.kind];
    this.tracePolygon(definition.shape);
    context.fill();
    context.stroke();
    this.traceSegments(definition.details);
    if (enemy.kind === "boss") {
      context.rotate(-enemy.age * 0.7);
      context.beginPath();
      context.arc(0, 0, enemy.radius * 0.55, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();

    if (enemy.kind === "boss") {
      const width = 300;
      const ratio = clamp(enemy.health / enemy.maxHealth, 0, 1);
      context.fillStyle = "rgba(255,255,255,0.09)";
      context.fillRect(WORLD_WIDTH / 2 - width / 2, 24, width, 5);
      context.fillStyle = "#ffc766";
      context.fillRect(WORLD_WIDTH / 2 - width / 2, 24, width * ratio, 5);
    }
  }

  private tracePolygon(points: readonly Point[]): void {
    const first = points[0];
    if (!first) {
      return;
    }
    this.context.beginPath();
    this.context.moveTo(first.x, first.y);
    for (let index = 1; index < points.length; index += 1) {
      const point = points[index];
      if (point) {
        this.context.lineTo(point.x, point.y);
      }
    }
    this.context.closePath();
  }

  private traceSegments(segments: readonly (readonly [Point, Point])[]): void {
    for (const [start, end] of segments) {
      this.context.beginPath();
      this.context.moveTo(start.x, start.y);
      this.context.lineTo(end.x, end.y);
      this.context.stroke();
    }
  }

  private getSnapshot(): GameSnapshot {
    return {
      state: this.state,
      health: this.player?.health ?? 0,
      maxHealth: this.player?.ship.hull ?? 0,
      credits: this.credits,
      wave: this.wave,
      score: this.score,
      elapsed: this.elapsed,
      highScore: this.highScore,
      quickAction: this.input.quickAction,
    };
  }

  private getShopItems(): readonly ShopItem[] {
    const player = this.player;
    if (!player) {
      return [];
    }
    return player.ship.armory.map((id, hotkeySlot) => {
      const definition = WEAPONS[id];
      const mount = player.weapons.find((weapon) => weapon.id === id);
      const level = mount?.level ?? null;
      const cost = mount ? weaponUpgradeCost(mount.level) : definition.price;
      const maxHealth = mount ? weaponMaxDurability(definition, mount.level) : null;
      const repairCost = mount
        ? calculateWeaponRepairCost(definition, mount.level, mount.health)
        : 0;
      const reloadCost =
        mount?.ammo !== null &&
        mount?.ammo !== undefined &&
        definition.ammoCapacity !== null
          ? (definition.ammoCapacity - mount.ammo) * definition.reloadPrice
          : 0;
      let disabledReason: string | null = null;
      if (!this.canManageLoadout) {
        disabledReason = "Flight unavailable";
      } else if (mount?.level === MAX_WEAPON_LEVEL) {
        disabledReason = "Max level";
      } else if (!mount && player.weapons.length >= MAX_WEAPONS) {
        disabledReason = "Slots full";
      }
      return {
        definition,
        level,
        hotkeySlot,
        cost,
        canAfford: disabledReason === null && this.credits >= cost,
        disabledReason,
        health: mount?.health ?? null,
        maxHealth,
        repairCost,
        canRepair: this.canManageLoadout && repairCost > 0 && this.credits >= repairCost,
        ammo: mount?.ammo ?? null,
        maxAmmo: mount ? definition.ammoCapacity : null,
        clipAmmo: mount?.clipAmmo ?? null,
        clipSize: mount?.id === "pulse" ? pulseClipSize(mount.level) : null,
        reloadCost,
        canReload: this.canManageLoadout && reloadCost > 0 && this.credits >= reloadCost,
      };
    });
  }

  private applyQuickAction(action: QuickAction, slot: number): void {
    const player = this.player;
    if (!this.canManageLoadout || !player) {
      return;
    }
    const resolved = resolveArmoryAction(
      player.ship.armory,
      player.weapons.map((weapon) => weapon.id),
      action,
      slot,
    );
    if (!resolved) {
      return;
    }
    if (resolved.operation === "purchase") {
      this.purchaseWeapon(resolved.id);
    } else if (resolved.operation === "upgrade") {
      this.upgradeWeapon(resolved.id);
    } else if (resolved.operation === "repair") {
      this.repairWeapon(resolved.id);
    } else {
      this.reloadWeapon(resolved.id);
    }
  }

  private setState(state: GameState): void {
    this.state = state;
    this.input.setEnabled(state === "playing");
    this.render(performance.now() / 1000);
    this.emitState();
  }

  private get canManageLoadout(): boolean {
    return this.state === "playing" || this.state === "paused";
  }

  private emitState(): void {
    const snapshot = this.getSnapshot();
    this.callbacks.onStateChange(this.state, snapshot);
    this.callbacks.onSnapshot(snapshot, this.getShopItems());
  }

  private emitSnapshot(): void {
    this.callbacks.onSnapshot(this.getSnapshot(), this.getShopItems());
  }

  private get highScore(): number {
    try {
      return Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? "0", 10) || 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(): void {
    if (this.score <= this.highScore) {
      return;
    }
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(this.score));
    } catch {
      // Storage can be unavailable in private browsing; the current flight still works.
    }
  }

  private readonly resizeCanvas = (): void => {
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return;
    }
    const nextWorldHeight = clamp(
      (WORLD_WIDTH * bounds.height) / bounds.width,
      WORLD_HEIGHT,
      WORLD_HEIGHT * 1.4,
    );
    if (Math.abs(nextWorldHeight - this.worldHeight) > 0.5) {
      const ratio = nextWorldHeight / this.worldHeight;
      if (this.player) {
        this.player.position.y *= ratio;
      }
      for (const enemy of this.enemies) enemy.position.y *= ratio;
      for (const projectile of this.projectiles) projectile.position.y *= ratio;
      for (const particle of this.particles) particle.position.y *= ratio;
      for (const fragment of this.wireFragments) fragment.position.y *= ratio;
      for (const star of this.stars) star.y *= ratio;
      for (const debris of this.backdropDebris) debris.y *= ratio;
      this.worldHeight = nextWorldHeight;
      this.input.setWorldHeight(nextWorldHeight);
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  };
}

export { SHIPS };
