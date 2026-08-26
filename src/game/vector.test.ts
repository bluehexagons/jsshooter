import { describe, expect, it } from "vitest";
import { circlesOverlap, clamp, Vector } from "./vector";

describe("Vector", () => {
  it("creates vectors from an angle and length", () => {
    const vector = Vector.fromAngle(Math.PI / 2, 12);
    expect(vector.x).toBeCloseTo(0);
    expect(vector.y).toBeCloseTo(12);
    expect(vector.length).toBeCloseTo(12);
  });

  it("limits magnitude without changing direction", () => {
    const vector = new Vector(30, 40).limit(10);
    expect(vector.length).toBeCloseTo(10);
    expect(vector.x).toBeCloseTo(6);
    expect(vector.y).toBeCloseTo(8);
  });
});

describe("geometry helpers", () => {
  it("clamps values to the inclusive range", () => {
    expect(clamp(-1, 0, 5)).toBe(0);
    expect(clamp(3, 0, 5)).toBe(3);
    expect(clamp(9, 0, 5)).toBe(5);
  });

  it("detects touching circles", () => {
    expect(circlesOverlap({ x: 0, y: 0 }, 5, { x: 10, y: 0 }, 5)).toBe(true);
    expect(circlesOverlap({ x: 0, y: 0 }, 5, { x: 11, y: 0 }, 5)).toBe(false);
  });
});
