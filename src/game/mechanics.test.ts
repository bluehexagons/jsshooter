import { describe, expect, it } from "vitest";
import {
  advanceCooldown,
  rectangleCircleOverlap,
  segmentCircleHitFraction,
  segmentRectangleHitFraction,
  transformLocalPoint,
  usesFallbackCannon,
} from "./mechanics";

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

describe("swept projectile collisions", () => {
  it("finds a target crossed between animation frames", () => {
    expect(segmentCircleHitFraction({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 0 }, 5)).toBeCloseTo(0.45);
  });

  it("does not report a target outside the shot path", () => {
    expect(segmentCircleHitFraction({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 10 }, 5)).toBeNull();
  });

  it("crosses a tall, narrow wall without giving it a circular hitbox", () => {
    expect(
      segmentRectangleHitFraction({ x: 0, y: 50 }, { x: 100, y: 50 }, { x: 50, y: 0 }, 4, 60),
    ).toBeCloseTo(0.46);
    expect(
      segmentRectangleHitFraction({ x: 0, y: 70 }, { x: 100, y: 70 }, { x: 50, y: 0 }, 4, 60),
    ).toBeNull();
  });

  it("checks circular mounts against the wall slab", () => {
    expect(rectangleCircleOverlap({ x: 50, y: 50 }, 4, 60, { x: 58, y: 50 }, 5)).toBe(true);
    expect(rectangleCircleOverlap({ x: 50, y: 50 }, 4, 60, { x: 65, y: 50 }, 5)).toBe(false);
  });
});
