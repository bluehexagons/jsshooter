import { describe, expect, it } from "vitest";
import {
  advanceEffectParticle,
  effectOpacity,
  type EffectParticle,
  wrappedParallaxX,
} from "./effects";
import { Vector } from "./vector";

function particle(kind: EffectParticle["kind"]): EffectParticle {
  return {
    position: new Vector(),
    velocity: new Vector(100, 0),
    life: 1,
    maxLife: 1,
    color: "#fff",
    kind,
    size: 2,
    growth: 4,
    drag: 0.25,
    rotation: 0,
    spin: 2,
  };
}

describe("effect particles", () => {
  it("advances motion, growth, drag, and spin together", () => {
    const effect = particle("spark");
    expect(advanceEffectParticle(effect, 0.5)).toBe(true);
    expect(effect.position.x).toBeCloseTo(50);
    expect(effect.velocity.x).toBeCloseTo(50);
    expect(effect.size).toBeCloseTo(4);
    expect(effect.rotation).toBeCloseTo(1);
  });

  it("removes expired particles and fades different materials appropriately", () => {
    const spark = particle("spark");
    spark.life = 0.5;
    const smoke = particle("smoke");
    smoke.life = 0.5;
    expect(effectOpacity(smoke)).toBeLessThan(effectOpacity(spark));
    expect(advanceEffectParticle(spark, 0.6)).toBe(false);
  });

  it("wraps slow scenery with its offscreen margin intact", () => {
    expect(wrappedParallaxX(10, 2, 10, 100, 20)).toBeCloseTo(-10);
    expect(wrappedParallaxX(10, 20, 10, 100, 20)).toBeCloseTo(90);
  });
});
