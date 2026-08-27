import { FORMATIONS, type EnemyKind, type FormationId } from "./enemies";

export type SpawnChoice = Exclude<EnemyKind, "boss" | "curve"> | "centipede";

export interface FormationCue {
  delay: number;
  id: FormationId;
}

interface WeightedChoice {
  choice: SpawnChoice;
  weight: number;
}

const FORMATION_ROTATION: readonly FormationId[] = [
  "barricade",
  "eagleWing",
  "zipperGate",
  "chevron",
];

export function randomSpawnInterval(wave: number, bossActive: boolean): number {
  const interval = Math.max(0.42, 1.22 - wave * 0.052);
  return bossActive ? interval * 1.9 : interval;
}

export function threatLimit(wave: number): number {
  return Math.min(24, 10 + wave * 1.2);
}

export function bossArrivalThreatLimit(wave: number): number {
  return threatLimit(wave) * 0.3;
}

export function enemyThreat(kind: EnemyKind): number {
  const threat: Readonly<Record<EnemyKind, number>> = {
    scout: 1,
    zipper: 1.1,
    eagle: 1.6,
    curve: 0.45,
    wall: 3.4,
    boss: 12,
  };
  return threat[kind];
}

export function formationThreat(id: FormationId): number {
  return FORMATIONS[id].placements.reduce(
    (total, placement) => total + enemyThreat(placement.kind),
    0,
  );
}

export function chooseSpawn(wave: number, roll: number, bossActive: boolean): SpawnChoice {
  const choices = spawnChoices(wave, bossActive);
  const totalWeight = choices.reduce((total, entry) => total + entry.weight, 0);
  let cursor = Math.min(Math.max(roll, 0), 0.999_999) * totalWeight;
  for (const entry of choices) {
    cursor -= entry.weight;
    if (cursor < 0) {
      return entry.choice;
    }
  }
  return choices.at(-1)?.choice ?? "scout";
}

export function formationCuesForWave(wave: number): readonly FormationCue[] {
  if (wave < 2 || wave % 5 === 0) {
    return [];
  }
  const primary = FORMATION_ROTATION[(wave - 2) % FORMATION_ROTATION.length] ?? "chevron";
  if (wave === 2) {
    return [{ delay: 0.7, id: primary }];
  }
  const secondary = FORMATION_ROTATION[wave % FORMATION_ROTATION.length] ?? "chevron";
  return [
    { delay: 0.7, id: primary },
    { delay: 9.2, id: secondary },
  ];
}

export function chooseOpenLaneY(
  minimum: number,
  maximum: number,
  occupied: readonly number[],
  random: () => number,
): number {
  if (maximum <= minimum) {
    return minimum;
  }
  let best = minimum + random() * (maximum - minimum);
  let bestClearance = laneClearance(best, occupied);
  for (let attempt = 1; attempt < 4; attempt += 1) {
    const candidate = minimum + random() * (maximum - minimum);
    const clearance = laneClearance(candidate, occupied);
    if (clearance > bestClearance) {
      best = candidate;
      bestClearance = clearance;
    }
  }
  return best;
}

function spawnChoices(wave: number, bossActive: boolean): readonly WeightedChoice[] {
  if (bossActive) {
    return [
      { choice: "scout", weight: 0.55 },
      { choice: "zipper", weight: 0.25 },
      { choice: "eagle", weight: 0.2 },
    ];
  }
  if (wave <= 1) {
    return [{ choice: "scout", weight: 1 }];
  }
  if (wave === 2) {
    return [
      { choice: "scout", weight: 0.62 },
      { choice: "zipper", weight: 0.38 },
    ];
  }
  if (wave === 3) {
    return [
      { choice: "scout", weight: 0.42 },
      { choice: "zipper", weight: 0.28 },
      { choice: "eagle", weight: 0.22 },
      { choice: "centipede", weight: 0.08 },
    ];
  }
  if (wave < 7) {
    return [
      { choice: "scout", weight: 0.35 },
      { choice: "zipper", weight: 0.26 },
      { choice: "eagle", weight: 0.22 },
      { choice: "centipede", weight: 0.11 },
      { choice: "wall", weight: 0.06 },
    ];
  }
  return [
    { choice: "scout", weight: 0.28 },
    { choice: "zipper", weight: 0.24 },
    { choice: "eagle", weight: 0.25 },
    { choice: "centipede", weight: 0.15 },
    { choice: "wall", weight: 0.08 },
  ];
}

function laneClearance(candidate: number, occupied: readonly number[]): number {
  if (occupied.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.min(...occupied.map((position) => Math.abs(position - candidate)));
}
