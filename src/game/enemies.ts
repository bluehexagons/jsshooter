import type { WireframeSegment } from "./config";
import type { Point } from "./vector";

export type EnemyKind = "scout" | "eagle" | "zipper" | "curve" | "wall" | "boss";

export type EnemyCollision =
  | { type: "circle"; radius: number }
  | { type: "box"; halfWidth: number; halfHeight: number };

export interface EnemyDefinition {
  radius: number;
  health: number;
  reward: number;
  speed: number;
  contactDamage: number;
  resistance: number;
  color: string;
  shape: readonly Point[];
  details: readonly WireframeSegment[];
  collision: EnemyCollision;
}

export interface FormationPlacement {
  kind: EnemyKind;
  x: number;
  y: number;
}

export interface FormationDefinition {
  height: number;
  speed: number;
  placements: readonly FormationPlacement[];
}

export type FormationId = "chevron" | "barricade" | "eagleWing" | "zipperGate";

const SCOUT_SHAPE: readonly Point[] = [
  { x: 16, y: 0 },
  { x: -12, y: 10 },
  { x: -7, y: 3 },
  { x: -14, y: 0 },
  { x: -7, y: -3 },
  { x: -12, y: -10 },
];

const EAGLE_SHAPE: readonly Point[] = [
  { x: 19, y: 0 },
  { x: 14, y: 17 },
  { x: -4, y: 17 },
  { x: 8, y: 11 },
  { x: -15, y: 0 },
  { x: 8, y: -11 },
  { x: -4, y: -17 },
  { x: 14, y: -17 },
];

const ZIPPER_SHAPE: readonly Point[] = [
  { x: 22, y: 0 },
  { x: 4, y: 4 },
  { x: -8, y: 10 },
  { x: -4, y: 2 },
  { x: -13, y: 0 },
  { x: -4, y: -2 },
  { x: -8, y: -10 },
  { x: 4, y: -4 },
];

const CURVE_SHAPE: readonly Point[] = [
  { x: 12, y: 6 },
  { x: 12, y: -6 },
  { x: 0, y: -12 },
  { x: -12, y: -6 },
  { x: -12, y: 6 },
  { x: 0, y: 12 },
];

const WALL_SHAPE: readonly Point[] = [
  { x: 3, y: -60 },
  { x: -3, y: -60 },
  { x: -6, y: -48 },
  { x: -6, y: 48 },
  { x: -3, y: 60 },
  { x: 3, y: 60 },
  { x: 6, y: 48 },
  { x: 6, y: -48 },
];

const BOSS_SHAPE: readonly Point[] = [
  { x: 92, y: -60 },
  { x: 22, y: -60 },
  { x: -24, y: -18 },
  { x: -12, y: 0 },
  { x: -24, y: 18 },
  { x: 22, y: 60 },
  { x: 92, y: 60 },
  { x: 72, y: 30 },
  { x: 38, y: 24 },
  { x: 8, y: 0 },
  { x: 38, y: -24 },
  { x: 72, y: -30 },
];

export const ENEMIES: Readonly<Record<EnemyKind, EnemyDefinition>> = {
  scout: {
    radius: 14,
    health: 22,
    reward: 12,
    speed: 175,
    contactDamage: 14,
    resistance: 2,
    color: "#ff5c75",
    shape: SCOUT_SHAPE,
    details: [
      [{ x: -11, y: 0 }, { x: 13, y: 0 }],
      [{ x: -8, y: 6 }, { x: 2, y: 0 }],
      [{ x: -8, y: -6 }, { x: 2, y: 0 }],
    ],
    collision: { type: "circle", radius: 15 },
  },
  eagle: {
    radius: 19,
    health: 55,
    reward: 32,
    speed: 155,
    contactDamage: 20,
    resistance: 10,
    color: "#ff5c75",
    shape: EAGLE_SHAPE,
    details: [
      [{ x: -12, y: 0 }, { x: 16, y: 0 }],
      [{ x: -3, y: 13 }, { x: 6, y: 0 }],
      [{ x: -3, y: -13 }, { x: 6, y: 0 }],
    ],
    collision: { type: "circle", radius: 20 },
  },
  zipper: {
    radius: 14,
    health: 28,
    reward: 18,
    speed: 105,
    contactDamage: 17,
    resistance: 15,
    color: "#ff795c",
    shape: ZIPPER_SHAPE,
    details: [
      [{ x: -10, y: 0 }, { x: 19, y: 0 }],
      [{ x: -5, y: 7 }, { x: 4, y: 2 }],
      [{ x: -5, y: -7 }, { x: 4, y: -2 }],
    ],
    collision: { type: "circle", radius: 19 },
  },
  curve: {
    radius: 12,
    health: 18,
    reward: 8,
    speed: 135,
    contactDamage: 11,
    resistance: 2,
    color: "#ff8aa0",
    shape: CURVE_SHAPE,
    details: [
      [{ x: -9, y: -5 }, { x: 9, y: 5 }],
      [{ x: -9, y: 5 }, { x: 9, y: -5 }],
    ],
    collision: { type: "circle", radius: 12 },
  },
  wall: {
    radius: 60,
    health: 175,
    reward: 85,
    speed: 72,
    contactDamage: 28,
    resistance: 50,
    color: "#718cff",
    shape: WALL_SHAPE,
    details: [
      [{ x: -6, y: -30 }, { x: 6, y: -30 }],
      [{ x: -6, y: 0 }, { x: 6, y: 0 }],
      [{ x: -6, y: 30 }, { x: 6, y: 30 }],
    ],
    collision: { type: "box", halfWidth: 6, halfHeight: 60 },
  },
  boss: {
    radius: 90,
    health: 820,
    reward: 900,
    speed: 75,
    contactDamage: 36,
    resistance: 15,
    color: "#ffc766",
    shape: BOSS_SHAPE,
    details: [
      [{ x: 20, y: -52 }, { x: 65, y: -28 }],
      [{ x: 20, y: 52 }, { x: 65, y: 28 }],
      [{ x: -10, y: 0 }, { x: 46, y: 0 }],
    ],
    collision: { type: "circle", radius: 90 },
  },
};

// These are direct typed translations of the two formation scripts in the
// original game. X is distance behind the formation leader and Y is local.
export const FORMATIONS: Readonly<Record<FormationId, FormationDefinition>> = {
  chevron: {
    height: 90,
    speed: 135,
    placements: [
      { kind: "scout", x: 0, y: 45 },
      { kind: "scout", x: 40, y: 25 },
      { kind: "scout", x: 40, y: 65 },
      { kind: "scout", x: 80, y: 5 },
      { kind: "scout", x: 80, y: 85 },
    ],
  },
  barricade: {
    height: 120,
    speed: 120,
    placements: [
      { kind: "wall", x: 0, y: 60 },
      { kind: "scout", x: 12, y: 5 },
      { kind: "scout", x: 12, y: 25 },
      { kind: "scout", x: 12, y: 45 },
      { kind: "scout", x: 24, y: 25 },
      { kind: "scout", x: 12, y: 75 },
      { kind: "scout", x: 12, y: 95 },
      { kind: "scout", x: 12, y: 115 },
      { kind: "scout", x: 24, y: 95 },
    ],
  },
  eagleWing: {
    height: 180,
    speed: 140,
    placements: [
      { kind: "eagle", x: 0, y: 90 },
      { kind: "eagle", x: 45, y: 45 },
      { kind: "eagle", x: 45, y: 135 },
      { kind: "scout", x: 85, y: 10 },
      { kind: "scout", x: 85, y: 90 },
      { kind: "scout", x: 85, y: 170 },
    ],
  },
  zipperGate: {
    height: 280,
    speed: 95,
    placements: [
      { kind: "zipper", x: 0, y: 25 },
      { kind: "zipper", x: 0, y: 255 },
      { kind: "zipper", x: 45, y: 85 },
      { kind: "zipper", x: 45, y: 195 },
      { kind: "scout", x: 90, y: 140 },
    ],
  },
};

export function formationTop(
  definition: FormationDefinition,
  preferredTop: number,
  worldHeight: number,
): number {
  const margin = 22;
  return Math.min(Math.max(preferredTop, margin), worldHeight - definition.height - margin);
}

export function centipedeLength(random: () => number): number {
  // The legacy loop always made at least two segments, then had an 80% chance
  // to add each following one. Cap it so an unlucky roll cannot hang a frame.
  let length = 2;
  while (length < 10 && random() < 0.8) {
    length += 1;
  }
  return length;
}
