import { describe, expect, it } from "vitest";
import { advanceMountMotion, animatedMountOffset, mountMotionBounds } from "./mount-motion";

describe("autonomous mount movement", () => {
  it("moves an orbiting hardpoint around the ship instead of only spinning its model", () => {
    expect(
      animatedMountOffset({ x: 50, y: 0 }, { kind: "orbit", speed: 4 }, Math.PI / 2),
    ).toEqual(expect.objectContaining({ x: expect.closeTo(0), y: expect.closeTo(50) }));
  });

  it("advances independently from firing and wraps cleanly", () => {
    expect(advanceMountMotion(0, { kind: "orbit", speed: 4 }, 0.25)).toBeCloseTo(1);
    expect(advanceMountMotion(Math.PI * 2 - 0.1, { kind: "orbit", speed: 2 }, 0.1)).toBeCloseTo(
      0.1,
    );
  });

  it("supports escort weaves and guard sweeps", () => {
    expect(
      animatedMountOffset(
        { x: 10, y: 20 },
        { kind: "weave", horizontal: 8, vertical: 3, speed: 1 },
        0,
      ),
    ).toEqual({ x: 18, y: 20 });
    expect(
      animatedMountOffset(
        { x: 40, y: 0 },
        { kind: "sweep", amplitude: 25, speed: 1 },
        Math.PI / 2,
      ),
    ).toEqual(expect.objectContaining({ x: 40, y: expect.closeTo(25) }));
  });

  it("reserves the complete moving envelope at world edges", () => {
    expect(mountMotionBounds({ x: 30, y: 40 }, { kind: "orbit", speed: 1 }, 10)).toEqual({
      minimum: { x: -60, y: -60 },
      maximum: { x: 60, y: 60 },
    });
    expect(
      mountMotionBounds(
        { x: 10, y: 20 },
        { kind: "weave", horizontal: 8, vertical: 3, speed: 1 },
        5,
      ),
    ).toEqual({ minimum: { x: -3, y: 12 }, maximum: { x: 23, y: 28 } });
  });
});
