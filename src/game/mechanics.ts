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

export function segmentCircleHitFraction(
  start: Point,
  end: Point,
  center: Point,
  radius: number,
): number | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const offsetX = start.x - center.x;
  const offsetY = start.y - center.y;
  const a = dx * dx + dy * dy;

  if (a === 0) {
    return offsetX * offsetX + offsetY * offsetY <= radius * radius ? 0 : null;
  }

  const c = offsetX * offsetX + offsetY * offsetY - radius * radius;
  if (c <= 0) {
    return 0;
  }
  const b = 2 * (offsetX * dx + offsetY * dy);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return null;
  }
  const root = Math.sqrt(discriminant);
  const entry = (-b - root) / (2 * a);
  const exit = (-b + root) / (2 * a);
  if (entry >= 0 && entry <= 1) {
    return entry;
  }
  return exit >= 0 && exit <= 1 ? exit : null;
}

export function segmentRectangleHitFraction(
  start: Point,
  end: Point,
  center: Point,
  halfWidth: number,
  halfHeight: number,
): number | null {
  let entry = 0;
  let exit = 1;
  const axes = [
    { start: start.x, delta: end.x - start.x, minimum: center.x - halfWidth, maximum: center.x + halfWidth },
    {
      start: start.y,
      delta: end.y - start.y,
      minimum: center.y - halfHeight,
      maximum: center.y + halfHeight,
    },
  ];

  for (const axis of axes) {
    if (Math.abs(axis.delta) < Number.EPSILON) {
      if (axis.start < axis.minimum || axis.start > axis.maximum) {
        return null;
      }
      continue;
    }
    const first = (axis.minimum - axis.start) / axis.delta;
    const second = (axis.maximum - axis.start) / axis.delta;
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (entry > exit) {
      return null;
    }
  }
  return entry >= 0 && entry <= 1 ? entry : null;
}

export function rectangleCircleOverlap(
  rectangleCenter: Point,
  halfWidth: number,
  halfHeight: number,
  circleCenter: Point,
  radius: number,
): boolean {
  const closestX = Math.max(
    rectangleCenter.x - halfWidth,
    Math.min(circleCenter.x, rectangleCenter.x + halfWidth),
  );
  const closestY = Math.max(
    rectangleCenter.y - halfHeight,
    Math.min(circleCenter.y, rectangleCenter.y + halfHeight),
  );
  return Math.hypot(circleCenter.x - closestX, circleCenter.y - closestY) <= radius;
}
