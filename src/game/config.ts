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
  | "drone"
  | "blade"
  | "rail"
  | "flak"
  | "shell"
  | "shell2";

export type WireframeSegment = readonly [Point, Point];

export type WeaponMovement =
  | { readonly kind: "orbit"; readonly speed: number }
  | {
      readonly kind: "weave";
      readonly horizontal: number;
      readonly vertical: number;
      readonly speed: number;
    }
  | { readonly kind: "sweep"; readonly amplitude: number; readonly speed: number };

export interface ShipDefinition {
  id: ShipId;
  name: string;
  role: string;
  description: string;
  hull: number;
  speed: number;
  collisionRadius: number;
  shape: readonly Point[];
  details: readonly WireframeSegment[];
  armory: readonly WeaponId[];
  mounts: Readonly<Partial<Record<WeaponId, Point>>>;
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
  recoilDistance: number;
  muzzleFlashSize: number;
  shape: readonly Point[];
  details: readonly WireframeSegment[];
  muzzleOffset: Point;
  movement?: WeaponMovement;
  contactDamage?: number;
  contactDamageTakenScale?: number;
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
    collisionRadius: 13,
    shape: [
      { x: 20, y: 0 },
      { x: 3, y: 11 },
      { x: -5, y: 9 },
      { x: -11, y: 0 },
      { x: -5, y: -9 },
      { x: 3, y: -11 },
    ],
    details: [
      [{ x: -8, y: 0 }, { x: 15, y: 0 }],
      [{ x: 3, y: 11 }, { x: 8, y: 0 }],
      [{ x: 3, y: -11 }, { x: 8, y: 0 }],
    ],
    armory: ["rapid", "fan", "pulse", "rail", "drone"],
    mounts: {
      rapid: { x: 8, y: -30 },
      fan: { x: -31, y: 15 },
      pulse: { x: 38, y: 0 },
      rail: { x: -28, y: -23 },
      drone: { x: 5, y: 44 },
    },
  },
  {
    id: "sprayer",
    name: "Scatter",
    role: "Area control",
    description: "An agile frame built for wide projectile patterns and mobile defense.",
    hull: 90,
    speed: 365,
    collisionRadius: 15,
    shape: [
      { x: 24, y: 14 },
      { x: 24, y: 9 },
      { x: 6, y: 9 },
      { x: 3, y: 0 },
      { x: 6, y: -9 },
      { x: 24, y: -9 },
      { x: 24, y: -14 },
      { x: -8, y: -14 },
      { x: -14, y: -7 },
      { x: -14, y: 7 },
      { x: -8, y: 14 },
    ],
    details: [
      [{ x: -11, y: 0 }, { x: 3, y: 0 }],
      [{ x: -8, y: 11 }, { x: 6, y: 9 }],
      [{ x: -8, y: -11 }, { x: 6, y: -9 }],
    ],
    armory: ["fan", "spray", "orbit", "flak", "shell2"],
    mounts: {
      fan: { x: 5, y: -27 },
      shell2: { x: 5, y: 27 },
      spray: { x: -27, y: 0 },
      orbit: { x: 76, y: 0 },
      flak: { x: -24, y: 36 },
    },
  },
  {
    id: "tank",
    name: "Bulwark",
    role: "Heavy",
    description: "Slower to reposition, but its reinforced hull can absorb sustained pressure.",
    hull: 165,
    speed: 265,
    collisionRadius: 21,
    shape: [
      { x: 31, y: 19 },
      { x: 38, y: 7 },
      { x: 33, y: 3 },
      { x: 39, y: 0 },
      { x: 33, y: -3 },
      { x: 38, y: -7 },
      { x: 31, y: -19 },
      { x: -14, y: -19 },
      { x: -22, y: -11 },
      { x: -22, y: 11 },
      { x: -14, y: 19 },
    ],
    details: [
      [{ x: -18, y: 0 }, { x: 31, y: 0 }],
      [{ x: -10, y: 15 }, { x: 22, y: 15 }],
      [{ x: -10, y: -15 }, { x: 22, y: -15 }],
      [{ x: 22, y: 15 }, { x: 31, y: 0 }],
      [{ x: 22, y: -15 }, { x: 31, y: 0 }],
    ],
    armory: ["shell", "shell2", "flak", "blade"],
    mounts: {
      shell: { x: 6, y: -34 },
      shell2: { x: 8, y: 34 },
      flak: { x: -30, y: 0 },
      blade: { x: 49, y: 0 },
    },
  },
  {
    id: "focus",
    name: "Needle",
    role: "Precision",
    description: "A compact, responsive interceptor suited to focused fire and clean lanes.",
    hull: 80,
    speed: 350,
    collisionRadius: 10,
    shape: [
      { x: 40, y: 0 },
      { x: 13, y: 5 },
      { x: 3, y: 3 },
      { x: -9, y: 6 },
      { x: -5, y: 0 },
      { x: -9, y: -6 },
      { x: 3, y: -3 },
      { x: 13, y: -5 },
    ],
    details: [
      [{ x: -5, y: 0 }, { x: 34, y: 0 }],
      [{ x: 3, y: 3 }, { x: 13, y: 0 }],
      [{ x: 3, y: -3 }, { x: 13, y: 0 }],
    ],
    armory: ["laser", "rapid", "rail", "drone"],
    mounts: {
      laser: { x: 8, y: -23 },
      rapid: { x: 8, y: 23 },
      rail: { x: 45, y: 0 },
      drone: { x: -25, y: 52 },
    },
  },
  {
    id: "ghost",
    name: "Ghost",
    role: "Skirmisher",
    description: "The fastest frame in the fleet, trading hull strength for evasive speed.",
    hull: 72,
    speed: 405,
    collisionRadius: 14,
    shape: [
      { x: 20, y: 0 },
      { x: 8, y: 13 },
      { x: -2, y: 8 },
      { x: -16, y: 15 },
      { x: -10, y: 0 },
      { x: -16, y: -15 },
      { x: -2, y: -8 },
      { x: 8, y: -13 },
    ],
    details: [
      [{ x: -10, y: 0 }, { x: 16, y: 0 }],
      [{ x: -10, y: 0 }, { x: 4, y: 8 }],
      [{ x: -10, y: 0 }, { x: 4, y: -8 }],
    ],
    armory: ["rapid", "rapid2", "orbit", "fan"],
    mounts: {
      rapid: { x: 0, y: -27 },
      rapid2: { x: 0, y: 27 },
      orbit: { x: 58, y: 0 },
      fan: { x: -27, y: 0 },
    },
  },
  {
    id: "mastermind",
    name: "Oracle",
    role: "Artillery",
    description: "A measured long-range platform with high-output energy weapon access.",
    hull: 98,
    speed: 305,
    collisionRadius: 16,
    shape: [
      { x: 19, y: 0 },
      { x: 11, y: 12 },
      { x: 0, y: 17 },
      { x: -11, y: 12 },
      { x: -19, y: 0 },
      { x: -11, y: -12 },
      { x: 0, y: -17 },
      { x: 11, y: -12 },
    ],
    details: [
      [{ x: 19, y: 0 }, { x: 0, y: 9 }],
      [{ x: 0, y: 9 }, { x: -10, y: 0 }],
      [{ x: -10, y: 0 }, { x: 0, y: -9 }],
      [{ x: 0, y: -9 }, { x: 19, y: 0 }],
    ],
    armory: ["laser", "rail", "flak", "drone"],
    mounts: {
      laser: { x: 30, y: 0 },
      rail: { x: -18, y: -28 },
      flak: { x: -18, y: 28 },
      drone: { x: 34, y: 54 },
    },
  },
  {
    id: "knight",
    name: "Lancer",
    role: "Brawler",
    description: "A durable close-range frame that excels with shells and sweeping fire.",
    hull: 140,
    speed: 290,
    collisionRadius: 17,
    shape: [
      { x: 30, y: 0 },
      { x: 8, y: 13 },
      { x: 0, y: 10 },
      { x: -12, y: 16 },
      { x: -18, y: 0 },
      { x: -12, y: -16 },
      { x: 0, y: -10 },
      { x: 8, y: -13 },
    ],
    details: [
      [{ x: -14, y: 0 }, { x: 26, y: 0 }],
      [{ x: -7, y: 11 }, { x: 8, y: 0 }],
      [{ x: -7, y: -11 }, { x: 8, y: 0 }],
    ],
    armory: ["shell", "shell2", "blade", "fan"],
    mounts: {
      shell: { x: 2, y: -28 },
      shell2: { x: 2, y: 28 },
      blade: { x: 51, y: 0 },
      fan: { x: -32, y: 0 },
    },
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
    collisionRadius: 14,
    recoilDistance: 4,
    muzzleFlashSize: 8,
    shape: [
      { x: 14, y: 0 },
      { x: 5, y: 4 },
      { x: -7, y: 7 },
      { x: -11, y: 3 },
      { x: -7, y: 0 },
      { x: -11, y: -3 },
      { x: 5, y: -4 },
    ],
    details: [
      [{ x: -7, y: 0 }, { x: 12, y: 0 }],
      [{ x: -6, y: 4 }, { x: 5, y: 1 }],
    ],
    muzzleOffset: { x: 14, y: 0 },
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
    collisionRadius: 14,
    recoilDistance: 4,
    muzzleFlashSize: 8,
    shape: [
      { x: 14, y: 0 },
      { x: 5, y: 4 },
      { x: -11, y: 3 },
      { x: -7, y: 0 },
      { x: -11, y: -3 },
      { x: -7, y: -7 },
      { x: 5, y: -4 },
    ],
    details: [
      [{ x: -7, y: 0 }, { x: 12, y: 0 }],
      [{ x: -6, y: -4 }, { x: 5, y: -1 }],
    ],
    muzzleOffset: { x: 14, y: 0 },
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
    collisionRadius: 14,
    recoilDistance: 3,
    muzzleFlashSize: 7,
    shape: [
      { x: 14, y: 0 },
      { x: 3, y: 5 },
      { x: -9, y: 11 },
      { x: -12, y: 7 },
      { x: -6, y: 0 },
      { x: -12, y: -7 },
      { x: -9, y: -11 },
      { x: 3, y: -5 },
    ],
    details: [
      [{ x: -6, y: 0 }, { x: 12, y: 0 }],
      [{ x: -8, y: 7 }, { x: 3, y: 2 }],
      [{ x: -8, y: -7 }, { x: 3, y: -2 }],
    ],
    muzzleOffset: { x: 14, y: 0 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  pulse: {
    id: "pulse",
    name: "Pulse driver",
    description: "Fires a rapid heavy-bolt magazine, then cycles in a fresh charge.",
    price: 25,
    cooldown: 0.055,
    damage: 34,
    projectileSpeed: 680,
    color: "#c594ff",
    durability: 48,
    collisionRadius: 17,
    recoilDistance: 9,
    muzzleFlashSize: 14,
    shape: [
      { x: 18, y: 0 },
      { x: 8, y: 8 },
      { x: 0, y: 11 },
      { x: -10, y: 7 },
      { x: -13, y: 0 },
      { x: -10, y: -7 },
      { x: 0, y: -11 },
      { x: 8, y: -8 },
    ],
    details: [
      [{ x: -10, y: 0 }, { x: 16, y: 0 }],
      [{ x: 0, y: -8 }, { x: 0, y: 8 }],
      [{ x: 8, y: -6 }, { x: 8, y: 6 }],
    ],
    muzzleOffset: { x: 18, y: 0 },
    ammoCapacity: 25,
    reloadPrice: 10,
  },
  spray: {
    id: "spray",
    name: "Arc sprayer",
    description: "Cycles curving shots across a wide arc; upgrades add more barrels.",
    price: 25,
    cooldown: 0.13,
    damage: 5,
    projectileSpeed: 720,
    color: "#93a7ff",
    durability: 40,
    collisionRadius: 15,
    recoilDistance: 3,
    muzzleFlashSize: 6,
    shape: [
      { x: 14, y: 0 },
      { x: -7, y: 13 },
      { x: -2, y: 3 },
      { x: -10, y: 0 },
      { x: -2, y: -3 },
      { x: -7, y: -13 },
    ],
    details: [
      [{ x: -8, y: 0 }, { x: 12, y: 0 }],
      [{ x: -4, y: 6 }, { x: 5, y: 2 }],
      [{ x: -4, y: -6 }, { x: 5, y: -2 }],
    ],
    muzzleOffset: { x: 14, y: 0 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  laser: {
    id: "laser",
    name: "Beam lance",
    description: "Each energy cell powers a sustained, penetrating beam burst.",
    price: 25,
    cooldown: 0.05,
    damage: 5,
    projectileSpeed: 2400,
    color: "#ff5f84",
    durability: 32,
    collisionRadius: 18,
    recoilDistance: 1.5,
    muzzleFlashSize: 11,
    shape: [
      { x: 20, y: 0 },
      { x: 8, y: 4 },
      { x: -8, y: 6 },
      { x: -13, y: 2 },
      { x: -13, y: -2 },
      { x: -8, y: -6 },
      { x: 8, y: -4 },
    ],
    details: [
      [{ x: -11, y: 0 }, { x: 19, y: 0 }],
      [{ x: -6, y: -4 }, { x: 8, y: -2 }],
      [{ x: -6, y: 4 }, { x: 8, y: 2 }],
    ],
    muzzleOffset: { x: 20, y: 0 },
    ammoCapacity: 25,
    reloadPrice: 10,
  },
  orbit: {
    id: "orbit",
    name: "Orbit repeater",
    description: "A gyrostabilized repeater that circles the hull while firing downrange.",
    price: 25,
    cooldown: 0.26,
    damage: 7,
    projectileSpeed: 820,
    color: "#80a6ff",
    durability: 35,
    collisionRadius: 14,
    recoilDistance: 4,
    muzzleFlashSize: 8,
    shape: [
      { x: 14, y: 0 },
      { x: 5, y: 5 },
      { x: 0, y: 14 },
      { x: -5, y: 5 },
      { x: -14, y: 0 },
      { x: -5, y: -5 },
      { x: 0, y: -14 },
      { x: 5, y: -5 },
    ],
    details: [
      [{ x: -12, y: 0 }, { x: 12, y: 0 }],
      [{ x: 0, y: -12 }, { x: 0, y: 12 }],
    ],
    muzzleOffset: { x: 14, y: 0 },
    movement: { kind: "orbit", speed: 4.2 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  drone: {
    id: "drone",
    name: "Hunter drone",
    description: "A weaving escort that acquires a nearby target and fires from its own position.",
    price: 30,
    cooldown: 0.32,
    damage: 11,
    projectileSpeed: 880,
    color: "#63f3c3",
    durability: 42,
    collisionRadius: 13,
    recoilDistance: 5,
    muzzleFlashSize: 8,
    shape: [
      { x: 15, y: 0 },
      { x: 4, y: 5 },
      { x: -5, y: 12 },
      { x: -10, y: 4 },
      { x: -7, y: 0 },
      { x: -10, y: -4 },
      { x: -5, y: -12 },
      { x: 4, y: -5 },
    ],
    details: [
      [{ x: -8, y: 0 }, { x: 13, y: 0 }],
      [{ x: -5, y: 9 }, { x: 2, y: 3 }],
      [{ x: -5, y: -9 }, { x: 2, y: -3 }],
    ],
    muzzleOffset: { x: 15, y: 0 },
    movement: { kind: "weave", horizontal: 20, vertical: 8, speed: 2.35 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  blade: {
    id: "blade",
    name: "Guard blade",
    description: "A sweeping armored interceptor that cuts attackers and casts short shock waves.",
    price: 35,
    cooldown: 0.48,
    damage: 22,
    projectileSpeed: 680,
    color: "#fff18a",
    durability: 88,
    collisionRadius: 18,
    recoilDistance: 10,
    muzzleFlashSize: 15,
    shape: [
      { x: 24, y: 0 },
      { x: 8, y: 5 },
      { x: -15, y: 9 },
      { x: -20, y: 3 },
      { x: -14, y: 0 },
      { x: -20, y: -3 },
      { x: -15, y: -9 },
      { x: 8, y: -5 },
    ],
    details: [
      [{ x: -17, y: 0 }, { x: 22, y: 0 }],
      [{ x: -12, y: -6 }, { x: 8, y: -3 }],
      [{ x: -12, y: 6 }, { x: 8, y: 3 }],
    ],
    muzzleOffset: { x: 24, y: 0 },
    movement: { kind: "sweep", amplitude: 32, speed: 2.8 },
    contactDamage: 48,
    contactDamageTakenScale: 0.22,
    ammoCapacity: null,
    reloadPrice: 0,
  },
  rail: {
    id: "rail",
    name: "Rail spike",
    description: "Launches a slow-cycling kinetic spike through several aligned targets.",
    price: 35,
    cooldown: 0.78,
    damage: 48,
    projectileSpeed: 1500,
    color: "#70f0b1",
    durability: 46,
    collisionRadius: 15,
    recoilDistance: 13,
    muzzleFlashSize: 17,
    shape: [
      { x: 22, y: 0 },
      { x: 8, y: 5 },
      { x: -10, y: 5 },
      { x: -16, y: 2 },
      { x: -16, y: -2 },
      { x: -10, y: -5 },
      { x: 8, y: -5 },
    ],
    details: [
      [{ x: -14, y: 0 }, { x: 21, y: 0 }],
      [{ x: -8, y: -4 }, { x: 7, y: -2 }],
      [{ x: -8, y: 4 }, { x: 7, y: 2 }],
    ],
    muzzleOffset: { x: 22, y: 0 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  flak: {
    id: "flak",
    name: "Flak charge",
    description: "Detonates on impact and damages enemies clustered around the target.",
    price: 30,
    cooldown: 0.72,
    damage: 26,
    projectileSpeed: 590,
    color: "#ffb66e",
    durability: 55,
    collisionRadius: 16,
    recoilDistance: 10,
    muzzleFlashSize: 14,
    shape: [
      { x: 17, y: 0 },
      { x: 8, y: 9 },
      { x: -3, y: 13 },
      { x: -14, y: 7 },
      { x: -14, y: -7 },
      { x: -3, y: -13 },
      { x: 8, y: -9 },
    ],
    details: [
      [{ x: -12, y: 0 }, { x: 15, y: 0 }],
      [{ x: -5, y: -10 }, { x: 4, y: 0 }],
      [{ x: -5, y: 10 }, { x: 4, y: 0 }],
    ],
    muzzleOffset: { x: 17, y: 0 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  shell: {
    id: "shell",
    name: "Shell rack port",
    description: "An armored rack that gains additional firing barrels as it is upgraded.",
    price: 25,
    cooldown: 0.34,
    damage: 15,
    projectileSpeed: 800,
    color: "#ffd284",
    durability: 72,
    collisionRadius: 14,
    recoilDistance: 7,
    muzzleFlashSize: 11,
    shape: [
      { x: 16, y: 0 },
      { x: 10, y: 10 },
      { x: 2, y: 13 },
      { x: -11, y: 10 },
      { x: -15, y: 0 },
      { x: -11, y: -10 },
      { x: 2, y: -13 },
      { x: 10, y: -10 },
    ],
    details: [
      [{ x: -12, y: 0 }, { x: 14, y: 0 }],
      [{ x: -7, y: 8 }, { x: 8, y: 8 }],
      [{ x: -7, y: -8 }, { x: 8, y: -8 }],
    ],
    muzzleOffset: { x: 16, y: 0 },
    ammoCapacity: null,
    reloadPrice: 0,
  },
  shell2: {
    id: "shell2",
    name: "Shell rack starboard",
    description: "A mirrored armored rack that gains barrels as it is upgraded.",
    price: 25,
    cooldown: 0.34,
    damage: 15,
    projectileSpeed: 800,
    color: "#ffd284",
    durability: 72,
    collisionRadius: 14,
    recoilDistance: 7,
    muzzleFlashSize: 11,
    shape: [
      { x: 16, y: 0 },
      { x: 10, y: 10 },
      { x: 2, y: 13 },
      { x: -11, y: 10 },
      { x: -15, y: 0 },
      { x: -11, y: -10 },
      { x: 2, y: -13 },
      { x: 10, y: -10 },
    ],
    details: [
      [{ x: -12, y: 0 }, { x: 14, y: 0 }],
      [{ x: -7, y: 8 }, { x: 8, y: 8 }],
      [{ x: -7, y: -8 }, { x: 8, y: -8 }],
    ],
    muzzleOffset: { x: 16, y: 0 },
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
