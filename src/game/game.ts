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
  weaponMaxDurability,
  weaponRepairCost as calculateWeaponRepairCost,
  weaponUpgradeCost,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./config";
import { InputController, type QuickAction } from "./input";
import { advanceCooldown, transformLocalPoint, usesFallbackCannon } from "./mechanics";
import { circlesOverlap, clamp, type Point, Vector } from "./vector";

export type GameState = "menu" | "playing" | "paused" | "gameover";

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
  slot: number | null;
  cost: number;
  canAfford: boolean;
  disabledReason: string | null;
  health: number | null;
  maxHealth: number | null;
  repairCost: number;
  canRepair: boolean;
  ammo: number | null;
  maxAmmo: number | null;
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
  health: number;
  ammo: number | null;
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
}

type EnemyKind = "scout" | "hunter" | "wall" | "spinner" | "boss";

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
  seed: number;
  shootCooldown: number;
  hitFlash: number;
}

interface Particle {
  position: Vector;
  velocity: Vector;
  life: number;
  maxLife: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  depth: number;
  size: number;
}

const REPAIR_RATE = 1.5;
const BASE_FIRE_COOLDOWN = 0.5;
const HIGH_SCORE_KEY = "corvus-high-score";
const RESPAWN_COST = 2500;

export class Game {
  private readonly context: CanvasRenderingContext2D;
  private readonly input: InputController;
  private readonly stars: Star[];
  private readonly projectiles: Projectile[] = [];
  private readonly enemies: Enemy[] = [];
  private readonly particles: Particle[] = [];
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
    this.stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * this.worldHeight,
      depth: Math.random() * 0.8 + 0.2,
      size: Math.random() * 1.4 + 0.4,
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
    this.credits = 150;
    this.score = 0;
    this.elapsed = 0;
    this.wave = 1;
    this.spawnCooldown = 0.6;
    this.lastBossWave = 0;
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
    this.credits = 0;
    this.score = 0;
    this.elapsed = 0;
    this.wave = 1;
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
      health: weaponMaxDurability(definition, 1),
      ammo: definition.ammoCapacity,
      contactCooldown: 0,
      hitFlash: 0,
    });
    this.render(performance.now() / 1000);
    this.emitSnapshot();
    return true;
  }

  public upgradeWeapon(id: WeaponId): boolean {
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
    this.render(performance.now() / 1000);
    this.emitSnapshot();
    return true;
  }

  public repairWeapon(id: WeaponId): boolean {
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
    if (!player || cost <= 0 || this.credits < cost) {
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
    }

    this.updateStars(delta);
    this.updatePlayer(player, delta);
    this.updateSpawning(delta);
    this.updateEnemies(player, delta);
    this.updateProjectiles(player, delta);
    this.updateParticles(delta);
    this.screenFlash = Math.max(0, this.screenFlash - delta * 2.4);
  }

  private updateStars(delta: number): void {
    for (const star of this.stars) {
      star.x -= (24 + star.depth * 76) * delta;
      if (star.x < -4) {
        star.x = WORLD_WIDTH + 4;
        star.y = Math.random() * this.worldHeight;
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
    player.invulnerable = Math.max(0, player.invulnerable - delta);
    player.baseCooldown = advanceCooldown(player.baseCooldown, delta);

    for (const weapon of player.weapons) {
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
      if (weapon.cooldown <= 0 && weapon.ammo !== 0) {
        this.fireWeapon(weapon, player.angle);
      }
    }
  }

  private updateSpawning(delta: number): void {
    this.spawnCooldown -= delta;
    const bossWave = this.wave >= 5 && this.wave % 5 === 0;
    if (bossWave && this.lastBossWave !== this.wave) {
      this.lastBossWave = this.wave;
      this.spawnEnemy("boss");
      this.spawnCooldown = 2.5;
      return;
    }

    if (this.spawnCooldown > 0) {
      return;
    }

    const interval = Math.max(0.34, 1.18 - this.wave * 0.055);
    this.spawnCooldown += interval * (0.78 + Math.random() * 0.5);
    const roll = Math.random();
    let kind: EnemyKind = "scout";
    if (this.wave >= 2 && roll > 0.67) {
      kind = "hunter";
    }
    if (this.wave >= 3 && roll > 0.84) {
      kind = "spinner";
    }
    if (this.wave >= 4 && roll > 0.94) {
      kind = "wall";
    }
    this.spawnEnemy(kind);
  }

  private spawnEnemy(kind: EnemyKind): void {
    const y = 55 + Math.random() * (this.worldHeight - 110);
    const healthScale = 1 + (this.wave - 1) * 0.12;
    const defaults = {
      scout: { radius: 14, health: 22, reward: 12, speed: 175, damage: 14, cooldown: 99 },
      hunter: { radius: 19, health: 55, reward: 32, speed: 125, damage: 20, cooldown: 1.5 },
      spinner: { radius: 17, health: 38, reward: 22, speed: 145, damage: 16, cooldown: 2.5 },
      wall: { radius: 34, health: 175, reward: 85, speed: 72, damage: 28, cooldown: 1.15 },
      boss: {
        radius: 68,
        health: 820 + this.wave * 105,
        reward: 900 + this.wave * 40,
        speed: 75,
        damage: 36,
        cooldown: 0.35,
      },
    }[kind];
    const health = kind === "boss" ? defaults.health : defaults.health * healthScale;
    this.enemies.push({
      id: this.nextEnemyId++,
      kind,
      position: new Vector(WORLD_WIDTH + defaults.radius + 10, kind === "boss" ? this.worldHeight / 2 : y),
      velocity: new Vector(-defaults.speed, 0),
      radius: defaults.radius,
      health,
      maxHealth: health,
      reward: Math.round(defaults.reward * (1 + this.wave * 0.035)),
      contactDamage: defaults.damage,
      age: 0,
      seed: Math.random() * Math.PI * 2,
      shootCooldown: defaults.cooldown + Math.random(),
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

      if (enemy.kind === "scout") {
        enemy.position.y += Math.sin(enemy.age * 4.2 + enemy.seed) * 45 * delta;
      } else if (enemy.kind === "hunter") {
        const desired = Vector.between(enemy.position, player.position).normalize().scale(150 + this.wave * 2);
        enemy.velocity.add(desired.scale(delta * 0.85)).limit(185 + this.wave * 3);
      } else if (enemy.kind === "spinner") {
        enemy.position.y += Math.cos(enemy.age * 3.4 + enemy.seed) * 125 * delta;
      } else if (enemy.kind === "wall") {
        enemy.position.y += Math.sign(player.position.y - enemy.position.y) * 42 * delta;
      } else if (enemy.kind === "boss") {
        if (enemy.position.x < WORLD_WIDTH * 0.8) {
          enemy.velocity.x = 0;
        }
        enemy.position.y = this.worldHeight / 2 + Math.sin(enemy.age * 0.85) * this.worldHeight * 0.29;
      }

      enemy.position.add(enemy.velocity.clone().scale(delta));
      enemy.position.y = clamp(enemy.position.y, enemy.radius, this.worldHeight - enemy.radius);

      if (enemy.shootCooldown <= 0 && enemy.kind !== "scout") {
        this.enemyFire(enemy, player);
      }

      const blockingMount = player.weapons.find((mount) => {
        const definition = WEAPONS[mount.id];
        return circlesOverlap(
          enemy.position,
          enemy.radius,
          this.weaponPosition(mount),
          definition.collisionRadius,
        );
      });
      if (blockingMount) {
        if (blockingMount.contactCooldown <= 0) {
          blockingMount.contactCooldown = 0.22;
          this.damageWeapon(blockingMount, enemy.contactDamage * 0.48);
          enemy.health -= 16;
        }
        enemy.velocity.x = Math.max(150, Math.abs(enemy.velocity.x) * 0.7);
        enemy.position.x += 4;
        if (enemy.health <= 0) {
          this.destroyEnemy(index, enemy);
          continue;
        }
      } else if (
        circlesOverlap(
          enemy.position,
          enemy.radius,
          player.position,
          this.playerCollisionRadius(player),
        )
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

  private enemyFire(enemy: Enemy, player: Player): void {
    const baseCooldown = enemy.kind === "boss" ? 0.48 : enemy.kind === "wall" ? 1.7 : 2.35;
    enemy.shootCooldown += Math.max(0.28, baseCooldown - this.wave * 0.025);
    const direction = Vector.between(enemy.position, player.position).normalize();
    const count = enemy.kind === "boss" ? 3 : 1;
    for (let shot = 0; shot < count; shot += 1) {
      const spread = count === 1 ? 0 : (shot - 1) * 0.16;
      const velocity = Vector.fromAngle(direction.angle + spread, enemy.kind === "boss" ? 390 : 315);
      this.projectiles.push({
        position: enemy.position.clone().add(Vector.fromAngle(direction.angle, enemy.radius * 0.8)),
        velocity,
        radius: enemy.kind === "boss" ? 5 : 4,
        damage: enemy.kind === "boss" ? 13 : 9,
        life: 5,
        color: enemy.kind === "boss" ? "#ffbf66" : "#ff5c75",
        friendly: false,
        pierce: 0,
        hitEnemies: new Set(),
      });
    }
  }

  private updateProjectiles(player: Player, delta: number): void {
    for (let projectileIndex = this.projectiles.length - 1; projectileIndex >= 0; projectileIndex -= 1) {
      const projectile = this.projectiles[projectileIndex];
      if (!projectile) {
        continue;
      }
      projectile.position.add(projectile.velocity.clone().scale(delta));
      projectile.life -= delta;
      let removeProjectile =
        projectile.life <= 0 ||
        projectile.position.x < -50 ||
        projectile.position.x > WORLD_WIDTH + 50 ||
        projectile.position.y < -50 ||
        projectile.position.y > this.worldHeight + 50;

      if (projectile.friendly) {
        for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
          const enemy = this.enemies[enemyIndex];
          if (
            !enemy ||
            projectile.hitEnemies.has(enemy.id) ||
            !circlesOverlap(projectile.position, projectile.radius, enemy.position, enemy.radius)
          ) {
            continue;
          }
          projectile.hitEnemies.add(enemy.id);
          enemy.health -= projectile.damage;
          enemy.hitFlash = 1;
          this.createBurst(projectile.position, projectile.color, 2);
          if (enemy.health <= 0) {
            this.destroyEnemy(enemyIndex, enemy);
          }
          if (projectile.pierce <= 0) {
            removeProjectile = true;
            break;
          }
          projectile.pierce -= 1;
        }
      } else {
        const blockingMount = player.weapons.find((mount) => {
          const definition = WEAPONS[mount.id];
          return circlesOverlap(
            projectile.position,
            projectile.radius,
            this.weaponPosition(mount),
            definition.collisionRadius,
          );
        });
        if (blockingMount) {
          this.damageWeapon(blockingMount, projectile.damage);
          removeProjectile = true;
        } else if (
          circlesOverlap(
            projectile.position,
            projectile.radius,
            player.position,
            this.playerCollisionRadius(player),
          )
        ) {
          this.damagePlayer(projectile.damage);
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
      particle.life -= delta;
      particle.position.add(particle.velocity.clone().scale(delta));
      particle.velocity.scale(Math.pow(0.2, delta));
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
      }
    }
  }

  private fireWeapon(mount: WeaponMount, playerAngle: number): void {
    const definition = WEAPONS[mount.id];
    const cooldown = definition.cooldown / (1 + (mount.level - 1) * 0.12);
    const damage = definition.damage * (1 + (mount.level - 1) * 0.28);
    const origin = this.weaponMuzzlePosition(mount);
    const fire = (angle: number, offset = 0, radius = 3.5, pierce = 0): void => {
      this.createPlayerProjectile(
        angle,
        offset,
        damage,
        definition.projectileSpeed,
        definition.color,
        radius,
        pierce,
        origin,
      );
    };
    mount.cooldown += cooldown;
    mount.phase += 0.43;
    if (mount.ammo !== null) {
      mount.ammo = Math.max(0, mount.ammo - 1);
    }

    switch (mount.id) {
      case "rapid":
        fire(playerAngle - 0.018);
        break;
      case "rapid2":
        fire(playerAngle + 0.018);
        break;
      case "fan":
        fire(playerAngle + Math.sin(mount.phase) * 0.68);
        break;
      case "pulse":
        fire(playerAngle, 0, 8, 1);
        break;
      case "spray":
        fire(playerAngle + Math.sin(mount.phase * 0.72) * 1.05);
        break;
      case "laser":
        fire(playerAngle, 0, 2.5, 1 + Math.floor(mount.level / 2));
        break;
      case "orbit":
        fire(playerAngle + Math.sin(mount.phase * 1.7) * 0.3, Math.sin(mount.phase) * 4);
        break;
      case "shell":
      case "shell2": {
        const side = mount.id === "shell" ? -1 : 1;
        fire(playerAngle - 0.035 * side, -4, 5);
        fire(playerAngle + 0.035 * side, 4, 5);
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
      life: 2.4,
      color,
      friendly: true,
      pierce,
      hitEnemies: new Set(),
    });
  }

  private weaponPosition(mount: WeaponMount): Vector {
    const player = this.player;
    if (!player) {
      return new Vector();
    }
    return this.playerOffsetPosition(player, WEAPONS[mount.id].mountOffset);
  }

  private weaponMuzzlePosition(mount: WeaponMount): Vector {
    const player = this.player;
    if (!player) {
      return new Vector();
    }
    const definition = WEAPONS[mount.id];
    if (mount.id === "orbit") {
      const position = this.playerOffsetPosition(player, definition.mountOffset);
      const relative = new Vector(
        definition.muzzleOffset.x - definition.mountOffset.x,
        definition.muzzleOffset.y - definition.mountOffset.y,
      );
      const angle = player.angle + mount.phase * 0.18;
      return position
        .add(Vector.fromAngle(angle, relative.x))
        .add(Vector.fromAngle(angle + Math.PI / 2, relative.y));
    }
    return this.playerOffsetPosition(player, definition.muzzleOffset);
  }

  private playerOffsetPosition(player: Player, offset: Point): Vector {
    return transformLocalPoint(player.position, player.angle, offset);
  }

  private destroyEnemy(index: number, enemy: Enemy): void {
    this.enemies.splice(index, 1);
    this.score += Math.round(enemy.maxHealth);
    this.credits += enemy.reward;
    this.createBurst(enemy.position, enemy.kind === "boss" ? "#ffc766" : "#ff5c75", enemy.kind === "boss" ? 55 : 14);
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
      if (this.credits >= RESPAWN_COST) {
        this.credits -= RESPAWN_COST;
        this.player = this.createPlayer(player.ship);
        this.player.invulnerable = 2;
        for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
          const enemy = this.enemies[index];
          if (!enemy) {
            continue;
          }
          enemy.health -= 80;
          if (enemy.health <= 0) {
            this.enemies.splice(index, 1);
            this.createBurst(enemy.position, "#ff5c75", 10);
          }
        }
        for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
          if (!this.projectiles[index]?.friendly) {
            this.projectiles.splice(index, 1);
          }
        }
      } else {
        this.saveHighScore();
        this.setState("gameover");
      }
    }
  }

  private damageWeapon(mount: WeaponMount, damage: number): void {
    const player = this.player;
    if (!player) {
      return;
    }
    const position = this.weaponPosition(mount);
    mount.health = Math.max(0, mount.health - damage);
    mount.hitFlash = 1;
    this.createBurst(position, WEAPONS[mount.id].color, 5);
    if (mount.health <= 0) {
      const index = player.weapons.indexOf(mount);
      if (index >= 0) {
        player.weapons.splice(index, 1);
      }
      this.createBurst(position, "#f7fbff", 18);
    }
  }

  private playerCollisionRadius(player: Player): number {
    const visualRadius = Math.max(...player.ship.shape.map((point) => Math.hypot(point.x, point.y)));
    return clamp(visualRadius * 0.5, 10, 18);
  }

  private createBurst(position: Point, color: string, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const life = 0.25 + Math.random() * 0.6;
      this.particles.push({
        position: new Vector(position.x, position.y),
        velocity: Vector.fromAngle(Math.random() * Math.PI * 2, 35 + Math.random() * 180),
        life,
        maxLife: life,
        color,
      });
    }
  }

  private render(time: number): void {
    const context = this.context;
    const scale = this.canvas.width / WORLD_WIDTH;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, WORLD_WIDTH, this.worldHeight);
    this.renderBackground(time);

    for (const particle of this.particles) {
      context.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      context.fillStyle = particle.color;
      context.fillRect(particle.position.x - 1.5, particle.position.y - 1.5, 3, 3);
    }
    context.globalAlpha = 1;

    for (const projectile of this.projectiles) {
      context.beginPath();
      context.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
      context.fillStyle = projectile.color;
      context.shadowColor = projectile.color;
      context.shadowBlur = projectile.friendly ? 12 : 8;
      context.fill();
    }
    context.shadowBlur = 0;

    for (const enemy of this.enemies) {
      this.renderEnemy(enemy);
    }
    if (this.player) {
      this.renderPlayer(this.player, time);
    }

    if (this.screenFlash > 0) {
      context.fillStyle = `rgba(255, 55, 88, ${this.screenFlash * 0.17})`;
      context.fillRect(0, 0, WORLD_WIDTH, this.worldHeight);
    }
  }

  private renderBackground(time: number): void {
    const context = this.context;
    const gradient = context.createLinearGradient(0, 0, WORLD_WIDTH, this.worldHeight);
    gradient.addColorStop(0, "#050d1b");
    gradient.addColorStop(0.55, "#030914");
    gradient.addColorStop(1, "#090713");
    context.fillStyle = gradient;
    context.fillRect(0, 0, WORLD_WIDTH, this.worldHeight);

    context.strokeStyle = "rgba(61, 227, 255, 0.055)";
    context.lineWidth = 1;
    const drift = this.state === "playing" ? this.elapsed * 38 : time * 8;
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

    for (const star of this.stars) {
      context.globalAlpha = 0.25 + star.depth * 0.7;
      context.fillStyle = star.depth > 0.75 ? "#9aefff" : "#b9c9da";
      context.fillRect(star.x, star.y, star.size, star.size);
    }
    context.globalAlpha = 1;
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

    context.save();
    context.translate(position.x, position.y);
    context.rotate(player.angle + (mount.id === "orbit" ? mount.phase * 0.18 : 0));
    context.strokeStyle = blinking ? "#ffffff" : definition.color;
    context.fillStyle = `${definition.color}18`;
    context.shadowColor = definition.color;
    context.shadowBlur = blinking ? 18 : 9;
    context.lineWidth = 1.7;
    this.tracePolygon(definition.shape);
    context.fill();
    context.stroke();
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

  private renderEnemy(enemy: Enemy): void {
    const context = this.context;
    const color = enemy.hitFlash > 0 ? "#fff4f6" : enemy.kind === "boss" ? "#ffc766" : "#ff5c75";
    context.save();
    context.translate(enemy.position.x, enemy.position.y);
    context.rotate(enemy.kind === "spinner" ? enemy.age * 3 : Math.PI);
    context.strokeStyle = color;
    context.fillStyle = enemy.kind === "boss" ? "rgba(255, 199, 102, 0.06)" : "rgba(255, 92, 117, 0.055)";
    context.shadowColor = color;
    context.shadowBlur = enemy.kind === "boss" ? 20 : 9;
    context.lineWidth = enemy.kind === "boss" ? 2.5 : 1.5;

    const shape = this.enemyShape(enemy);
    this.tracePolygon(shape);
    context.fill();
    context.stroke();
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

  private enemyShape(enemy: Enemy): readonly Point[] {
    const radius = enemy.radius;
    switch (enemy.kind) {
      case "scout":
        return [
          { x: radius, y: 0 },
          { x: -radius, y: radius * 0.72 },
          { x: -radius * 0.55, y: 0 },
          { x: -radius, y: -radius * 0.72 },
        ];
      case "hunter":
        return [
          { x: radius, y: 0 },
          { x: 0, y: radius },
          { x: -radius, y: radius * 0.45 },
          { x: -radius * 0.6, y: 0 },
          { x: -radius, y: -radius * 0.45 },
          { x: 0, y: -radius },
        ];
      case "spinner":
        return [
          { x: radius, y: 0 },
          { x: radius * 0.28, y: radius * 0.28 },
          { x: 0, y: radius },
          { x: -radius * 0.28, y: radius * 0.28 },
          { x: -radius, y: 0 },
          { x: -radius * 0.28, y: -radius * 0.28 },
          { x: 0, y: -radius },
          { x: radius * 0.28, y: -radius * 0.28 },
        ];
      case "wall":
        return [
          { x: radius * 0.75, y: radius },
          { x: -radius * 0.75, y: radius },
          { x: -radius, y: 0 },
          { x: -radius * 0.75, y: -radius },
          { x: radius * 0.75, y: -radius },
          { x: radius, y: 0 },
        ];
      case "boss":
        return Array.from({ length: 10 }, (_, index) => {
          const angle = (index / 10) * Math.PI * 2;
          const pointRadius = index % 2 === 0 ? radius : radius * 0.66;
          return { x: Math.cos(angle) * pointRadius, y: Math.sin(angle) * pointRadius };
        });
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
    return player.ship.armory.map((id) => {
      const definition = WEAPONS[id];
      const mount = player.weapons.find((weapon) => weapon.id === id);
      const level = mount?.level ?? null;
      const slot = mount ? player.weapons.indexOf(mount) : null;
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
      if (mount?.level === MAX_WEAPON_LEVEL) {
        disabledReason = "Max level";
      } else if (!mount && player.weapons.length >= MAX_WEAPONS) {
        disabledReason = "Slots full";
      }
      return {
        definition,
        level,
        slot,
        cost,
        canAfford: disabledReason === null && this.credits >= cost,
        disabledReason,
        health: mount?.health ?? null,
        maxHealth,
        repairCost,
        canRepair: repairCost > 0 && this.credits >= repairCost,
        ammo: mount?.ammo ?? null,
        maxAmmo: mount ? definition.ammoCapacity : null,
        reloadCost,
        canReload: reloadCost > 0 && this.credits >= reloadCost,
      };
    });
  }

  private applyQuickAction(action: QuickAction, slot: number): void {
    const mount = this.player?.weapons[slot];
    if (!mount) {
      return;
    }
    if (action === "upgrade") {
      this.upgradeWeapon(mount.id);
    } else if (action === "repair") {
      this.repairWeapon(mount.id);
    } else {
      this.reloadWeapon(mount.id);
    }
  }

  private setState(state: GameState): void {
    this.state = state;
    this.input.setEnabled(state === "playing");
    this.render(performance.now() / 1000);
    this.emitState();
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
      for (const star of this.stars) star.y *= ratio;
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
