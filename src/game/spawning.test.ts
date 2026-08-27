import { describe, expect, it } from "vitest";
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

describe("spawn director", () => {
  it("unlocks enemy families over several waves", () => {
    expect(chooseSpawn(1, 0.9, false)).toBe("scout");
    expect(chooseSpawn(2, 0.9, false)).toBe("zipper");
    expect(chooseSpawn(3, 0.95, false)).toBe("centipede");
    expect(chooseSpawn(7, 0.99, false)).toBe("wall");
  });

  it("uses lighter escorts and slower pacing while a boss is alive", () => {
    expect(chooseSpawn(8, 0.99, true)).toBe("eagle");
    expect(randomSpawnInterval(8, true)).toBeGreaterThan(randomSpawnInterval(8, false));
    expect(bossArrivalThreatLimit(5) + enemyThreat("boss")).toBeLessThanOrEqual(
      threatLimit(5) * 1.1,
    );
  });

  it("rotates authored formations but leaves boss waves clear", () => {
    expect(formationCuesForWave(2)).toEqual([{ delay: 0.7, id: "barricade" }]);
    expect(formationCuesForWave(3)).toHaveLength(2);
    expect(formationCuesForWave(5)).toEqual([]);
    expect(formationThreat("barricade")).toBeGreaterThan(formationThreat("chevron"));
  });

  it("selects the clearest sampled entry lane", () => {
    const rolls = [0.5, 0.1, 0.9, 0.55];
    const y = chooseOpenLaneY(50, 550, [275, 300, 325], () => rolls.shift() ?? 0.5);
    expect(y).toBe(100);
  });

  it("grows the threat ceiling while bounding late-game density", () => {
    expect(threatLimit(5)).toBeGreaterThan(threatLimit(1));
    expect(threatLimit(100)).toBe(24);
    expect(enemyThreat("boss")).toBeGreaterThan(enemyThreat("scout"));
  });
});
