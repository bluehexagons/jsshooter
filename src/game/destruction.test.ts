import { describe, expect, it } from "vitest";
import {
  advanceWireFragment,
  createWireExplosion,
  wireframeSegments,
  wireFragmentOpacity,
  wireFragmentWorldSegment,
} from "./destruction";

describe("procedural wireframe destruction", () => {
  const triangle = [
    { x: 4, y: 0 },
    { x: -2, y: 3 },
    { x: -2, y: -3 },
  ] as const;
  const detail = [[{ x: -2, y: 0 }, { x: 3, y: 0 }]] as const;

  it("includes the closing outline edge and every model detail", () => {
    const segments = wireframeSegments(triangle, detail);
    expect(segments).toHaveLength(4);
    expect(segments[2]).toEqual([triangle[2], triangle[0]]);
    expect(segments[3]).toEqual(detail[0]);
  });

  it("places every detached line at its original rotated world pose", () => {
    const fragments = createWireExplosion({
      origin: { x: 100, y: 50 },
      rotation: Math.PI / 2,
      shape: triangle,
      details: [],
      color: "#fff",
      outwardSpeed: 0,
      random: () => 0.5,
    });
    expect(wireFragmentWorldSegment(fragments[0]!)[0]).toEqual(
      expect.objectContaining({ x: expect.closeTo(100), y: expect.closeTo(54) }),
    );
    expect(wireFragmentWorldSegment(fragments[0]!)[1]).toEqual(
      expect.objectContaining({ x: expect.closeTo(97), y: expect.closeTo(48) }),
    );
  });

  it("moves, spins, slows, and fades fragments independently", () => {
    const fragment = createWireExplosion({
      origin: { x: 0, y: 0 },
      rotation: 0,
      shape: triangle,
      details: [],
      color: "#fff",
      inheritedVelocity: { x: 100, y: 0 },
      outwardSpeed: 0,
      lifetime: 1,
      random: () => 0.75,
    })[0]!;
    const initialOpacity = wireFragmentOpacity(fragment);
    const initialRotation = fragment.rotation;
    expect(advanceWireFragment(fragment, 0.5)).toBe(true);
    expect(fragment.position.x).toBeGreaterThan(30);
    expect(fragment.rotation).toBeGreaterThan(initialRotation);
    expect(wireFragmentOpacity(fragment)).toBeLessThan(initialOpacity);
    expect(advanceWireFragment(fragment, 1)).toBe(false);
  });
});
