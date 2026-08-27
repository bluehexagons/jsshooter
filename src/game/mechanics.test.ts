import { describe, expect, it } from "vitest";
import { advanceCooldown, transformLocalPoint, usesFallbackCannon } from "./mechanics";

describe("weapon cadence", () => {
  it("does not bank negative cooldown while the trigger is released", () => {
    expect(advanceCooldown(0, 12)).toBe(0);
    expect(advanceCooldown(0.2, 0.05)).toBeCloseTo(0.15);
  });

  it("uses the fallback cannon only while no physical weapons remain", () => {
    expect(usesFallbackCannon(0)).toBe(true);
    expect(usesFallbackCannon(1)).toBe(false);
    expect(usesFallbackCannon(5)).toBe(false);
  });
});

describe("physical mount positions", () => {
  it("rotates a weapon offset with its player ship", () => {
    const position = transformLocalPoint({ x: 100, y: 100 }, Math.PI / 2, { x: 20, y: 5 });
    expect(position.x).toBeCloseTo(95);
    expect(position.y).toBeCloseTo(120);
  });
});
