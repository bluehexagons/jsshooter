import type { Point } from "./vector";

export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 600;
export const MAX_WEAPON_LEVEL = 10;
export const MAX_WEAPONS = 5;

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
  durability: number;
  collisionRadius: number;
  shape: readonly Point[];
  mountOffset: Point;
  muzzleOffset: Point;
  ammoCapacity: number | null;
  reloadPrice: number;
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
      { x: 20, y: 0 },
      { x: 0, y: 10 },
      { x: -8, y: 0 },
      { x: 0, y: -10 },
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
      { x: 20, y: 14 },
      { x: 20, y: 10 },
      { x: 2, y: 10 },
      { x: 4, y: 0 },
      { x: 2, y: -10 },
      { x: 20, y: -10 },
      { x: 20, y: -14 },
      { x: -2, y: -14 },
      { x: -2, y: 14 },
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
      { x: 28, y: 20 },
      { x: 35, y: 5 },
      { x: 30, y: 0 },
      { x: 35, y: -5 },
      { x: 28, y: -20 },
      { x: -15, y: -20 },
      { x: -20, y: -15 },
      { x: -20, y: 15 },
      { x: -15, y: 20 },
    ],
    armory: ["laser", "shell"],
  },
  {
    id: "focus",
    name: "Needle",
    role: "Precision",
    description: "A compact, responsive interceptor suited to focused fire and clean lanes.",
    hull: 80,
    speed: 350,
    shape: [
      { x: 40, y: 0 },
      { x: 10, y: -4 },
      { x: 0, y: -2 },
      { x: -10, y: -4 },
      { x: -5, y: 0 },
      { x: -10, y: 4 },
      { x: 0, y: 2 },
      { x: 10, y: 4 },
    ],
    armory: ["laser", "rapid"],
  },
  {
    id: "ghost",
    name: "Ghost",
    role: "Skirmisher",
    description: "The fastest frame in the fleet, trading hull strength for evasive speed.",
    hull: 72,
    speed: 405,
    shape: [
      { x: 17, y: 0 },
      { x: 8, y: 14 },
      { x: -13, y: 14 },
      { x: -17, y: 0 },
      { x: -13, y: -14 },
      { x: 8, y: -14 },
    ],
    armory: ["shell", "rapid"],
  },
  {
    id: "mastermind",
    name: "Oracle",
    role: "Artillery",
    description: "A measured long-range platform with high-output energy weapon access.",
    hull: 98,
    speed: 305,
    shape: [
      { x: 16, y: 0 },
      { x: 9, y: 13 },
      { x: -9, y: 13 },
      { x: -16, y: 0 },
      { x: -9, y: -13 },
      { x: 9, y: -13 },
    ],
    armory: ["laser"],
  },
  {
    id: "knight",
    name: "Lancer",
    role: "Brawler",
    description: "A durable close-range frame that excels with shells and sweeping fire.",
    hull: 140,
    speed: 290,
    shape: [
      { x: 20, y: 0 },
      { x: 6, y: 15 },
      { x: -8, y: 11 },
      { x: -16, y: 0 },
      { x: -8, y: -11 },
      { x: 6, y: -15 },
    ],
    armory: ["shell"],
  },
] as const;

export const WEAPONS: Readonly<Record<WeaponId, WeaponDefinition>> = {
  rapid: {
    id: "rapid",
    name: "Rapid port",
    description: "Fast, accurate supporting fire.",
    price: 25,
    cooldown: 0.26,
    damage: 8,
    projectileSpeed: 920,
    color: "#79eaff",
    durability: 38,
    collisionRadius: 10,
    shape: [
      { x: 13, y: 0 },
      { x: -9, y: 6 },
      { x: -4, y: 0 },
      { x: -9, y: -6 },
    ],
    mountOffset: { x: 22, y: 8 },
    muzzleOffset: { x: 31, y: 5 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  rapid2: {
    id: "rapid2",
    name: "Rapid starboard",
    description: "A mirrored rapid-fire mount.",
    price: 25,
    cooldown: 0.26,
    damage: 8,
    projectileSpeed: 920,
    color: "#79eaff",
    durability: 38,
    collisionRadius: 10,
    shape: [
      { x: 13, y: 0 },
      { x: -9, y: 6 },
      { x: -4, y: 0 },
      { x: -9, y: -6 },
    ],
    mountOffset: { x: 22, y: -8 },
    muzzleOffset: { x: 31, y: -5 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  fan: {
    id: "fan",
    name: "Fan cannon",
    description: "Sweeps shots across a wide arc.",
    price: 25,
    cooldown: 0.14,
    damage: 6,
    projectileSpeed: 760,
    color: "#b9f6ff",
    durability: 42,
    collisionRadius: 12,
    shape: [
      { x: 12, y: 0 },
      { x: 1, y: 5 },
      { x: -10, y: 10 },
      { x: -5, y: 0 },
      { x: -10, y: -10 },
      { x: 1, y: -5 },
    ],
    mountOffset: { x: -11, y: 0 },
    muzzleOffset: { x: -1, y: 0 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  pulse: {
    id: "pulse",
    name: "Pulse driver",
    description: "Slow, heavy energy bolts that pierce armor.",
    price: 25,
    cooldown: 0.42,
    damage: 34,
    projectileSpeed: 680,
    color: "#c594ff",
    durability: 48,
    collisionRadius: 13,
    shape: [
      { x: 16, y: 0 },
      { x: 0, y: 10 },
      { x: -11, y: 0 },
      { x: 0, y: -10 },
    ],
    mountOffset: { x: 19, y: 0 },
    muzzleOffset: { x: 32, y: 0 },
    ammoCapacity: 25,
    reloadPrice: 10,
  },
  spray: {
    id: "spray",
    name: "Arc sprayer",
    description: "Cycles a stream of shots across a wide arc.",
    price: 25,
    cooldown: 0.13,
    damage: 5,
    projectileSpeed: 720,
    color: "#93a7ff",
    durability: 40,
    collisionRadius: 14,
    shape: [
      { x: 14, y: 0 },
      { x: -7, y: 13 },
      { x: -2, y: 3 },
      { x: -10, y: 0 },
      { x: -2, y: -3 },
      { x: -7, y: -13 },
    ],
    mountOffset: { x: -14, y: 0 },
    muzzleOffset: { x: -2, y: 0 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  laser: {
    id: "laser",
    name: "Beam lance",
    description: "High-velocity rounds with innate penetration.",
    price: 25,
    cooldown: 0.22,
    damage: 18,
    projectileSpeed: 1500,
    color: "#ff5f84",
    durability: 32,
    collisionRadius: 9,
    shape: [
      { x: 18, y: 0 },
      { x: -8, y: 4 },
      { x: -12, y: 0 },
      { x: -8, y: -4 },
    ],
    mountOffset: { x: 17, y: 0 },
    muzzleOffset: { x: 23, y: 0 },
    ammoCapacity: 25,
    reloadPrice: 10,
  },
  orbit: {
    id: "orbit",
    name: "Orbit repeater",
    description: "Rotating twin emitters weave a dense pattern.",
    price: 25,
    cooldown: 0.26,
    damage: 7,
    projectileSpeed: 820,
    color: "#80a6ff",
    durability: 35,
    collisionRadius: 12,
    shape: [
      { x: 12, y: 0 },
      { x: 0, y: 12 },
      { x: -12, y: 0 },
      { x: 0, y: -12 },
    ],
    mountOffset: { x: 52, y: 0 },
    muzzleOffset: { x: 64, y: 0 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  shell: {
    id: "shell",
    name: "Shell rack port",
    description: "A paired kinetic broadside.",
    price: 25,
    cooldown: 0.34,
    damage: 15,
    projectileSpeed: 800,
    color: "#ffd284",
    durability: 72,
    collisionRadius: 14,
    shape: [
      { x: 14, y: 0 },
      { x: 7, y: 11 },
      { x: -9, y: 9 },
      { x: -13, y: 0 },
      { x: -9, y: -9 },
      { x: 7, y: -11 },
    ],
    mountOffset: { x: 21, y: -14 },
    muzzleOffset: { x: 34, y: -14 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  shell2: {
    id: "shell2",
    name: "Shell rack starboard",
    description: "A mirrored kinetic broadside.",
    price: 25,
    cooldown: 0.34,
    damage: 15,
    projectileSpeed: 800,
    color: "#ffd284",
    durability: 72,
    collisionRadius: 14,
    shape: [
      { x: 14, y: 0 },
      { x: 7, y: 11 },
      { x: -9, y: 9 },
      { x: -13, y: 0 },
      { x: -9, y: -9 },
      { x: 7, y: -11 },
    ],
    mountOffset: { x: 21, y: 14 },
    muzzleOffset: { x: 34, y: 14 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
};

export function getShip(id: ShipId): ShipDefinition {
  const ship = SHIPS.find((candidate) => candidate.id === id);
  if (!ship) {
    throw new Error(`Unknown ship: ${id}`);
  }
  return ship;
}

export function weaponUpgradeCost(level: number): number {
  if (level >= MAX_WEAPON_LEVEL) {
    return 0;
  }
  if (level === 1) {
    return 50;
  }
  if (level === 2) {
    return 100;
  }
  return 500;
}

export function weaponMaxDurability(weapon: WeaponDefinition, level: number): number {
  return Math.round(weapon.durability * (1 + (level - 1) * 0.4));
}

export function weaponRepairCost(weapon: WeaponDefinition, level: number, health: number): number {
  const missingDurability = Math.max(0, weaponMaxDurability(weapon, level) - health);
  return Math.ceil(missingDurability * 1.25);
}
