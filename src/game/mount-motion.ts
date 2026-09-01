import type { WeaponMovement } from "./config";
import type { Point } from "./vector";

const FULL_TURN = Math.PI * 2;

export interface MotionBounds {
  minimum: Point;
  maximum: Point;
}

export function advanceMountMotion(
  phase: number,
  movement: WeaponMovement | undefined,
  delta: number,
): number {
  if (!movement) {
    return phase;
  }
  return ((phase + movement.speed * delta) % FULL_TURN + FULL_TURN) % FULL_TURN;
}

export function animatedMountOffset(
  base: Point,
  movement: WeaponMovement | undefined,
  phase: number,
): Point {
  if (!movement) {
    return { x: base.x, y: base.y };
  }
  switch (movement.kind) {
    case "orbit": {
      const cosine = Math.cos(phase);
      const sine = Math.sin(phase);
      return {
        x: base.x * cosine - base.y * sine,
        y: base.x * sine + base.y * cosine,
      };
    }
    case "weave":
      return {
        x: base.x + Math.cos(phase) * movement.horizontal,
        y: base.y + Math.sin(phase * 2) * movement.vertical,
      };
    case "sweep":
      return { x: base.x, y: base.y + Math.sin(phase) * movement.amplitude };
  }
}

export function mountMotionBounds(
  base: Point,
  movement: WeaponMovement | undefined,
  radius: number,
): MotionBounds {
  if (!movement) {
    return {
      minimum: { x: base.x - radius, y: base.y - radius },
      maximum: { x: base.x + radius, y: base.y + radius },
    };
  }
  switch (movement.kind) {
    case "orbit": {
      const reach = Math.hypot(base.x, base.y) + radius;
      return {
        minimum: { x: -reach, y: -reach },
        maximum: { x: reach, y: reach },
      };
    }
    case "weave":
      return {
        minimum: {
          x: base.x - movement.horizontal - radius,
          y: base.y - movement.vertical - radius,
        },
        maximum: {
          x: base.x + movement.horizontal + radius,
          y: base.y + movement.vertical + radius,
        },
      };
    case "sweep":
      return {
        minimum: { x: base.x - radius, y: base.y - movement.amplitude - radius },
        maximum: { x: base.x + radius, y: base.y + movement.amplitude + radius },
      };
  }
}
