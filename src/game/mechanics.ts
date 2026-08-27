import { type Point, Vector } from "./vector";

export function advanceCooldown(current: number, delta: number): number {
  return Math.max(0, current - delta);
}

export function usesFallbackCannon(mountedWeaponCount: number): boolean {
  return mountedWeaponCount === 0;
}

export function transformLocalPoint(origin: Point, angle: number, offset: Point): Vector {
  return new Vector(origin.x, origin.y)
    .add(Vector.fromAngle(angle, offset.x))
    .add(Vector.fromAngle(angle + Math.PI / 2, offset.y));
}
