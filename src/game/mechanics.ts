import { type Point, Vector } from "./vector";

export interface SegmentHit {
  fraction: number;
  normal: Vector;
}

const HIT_EPSILON = 1e-9;

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

export function segmentCircleHit(
  start: Point,
  end: Point,
  center: Point,
  radius: number,
): SegmentHit | null {
  const fraction = segmentCircleHitFraction(start, end, center, radius);
  if (fraction === null) {
    return null;
  }
  const hitPoint = new Vector(
    start.x + (end.x - start.x) * fraction,
    start.y + (end.y - start.y) * fraction,
  );
  const normal = Vector.between(center, hitPoint).normalize();
  if (normal.length === 0) {
    normal.x = start.x - end.x;
    normal.y = start.y - end.y;
    normal.normalize();
  }
  return { fraction, normal };
}

export function segmentRectangleHitFraction(
  start: Point,
  end: Point,
  center: Point,
  halfWidth: number,
  halfHeight: number,
): number | null {
  return segmentRectangleHit(start, end, center, halfWidth, halfHeight)?.fraction ?? null;
}

export function segmentRectangleHit(
  start: Point,
  end: Point,
  center: Point,
  halfWidth: number,
  halfHeight: number,
): SegmentHit | null {
  let entry = 0;
  let exit = 1;
  let normal = new Vector();
  const axes = [
    {
      start: start.x,
      delta: end.x - start.x,
      minimum: center.x - halfWidth,
      maximum: center.x + halfWidth,
      negativeNormal: new Vector(-1, 0),
      positiveNormal: new Vector(1, 0),
    },
    {
      start: start.y,
      delta: end.y - start.y,
      minimum: center.y - halfHeight,
      maximum: center.y + halfHeight,
      negativeNormal: new Vector(0, -1),
      positiveNormal: new Vector(0, 1),
    },
  ];

  for (const axis of axes) {
    if (Math.abs(axis.delta) < Number.EPSILON) {
      if (axis.start < axis.minimum || axis.start > axis.maximum) {
        return null;
      }
      continue;
    }
    const minimumFraction = (axis.minimum - axis.start) / axis.delta;
    const maximumFraction = (axis.maximum - axis.start) / axis.delta;
    const nearFraction = Math.min(minimumFraction, maximumFraction);
    const farFraction = Math.max(minimumFraction, maximumFraction);
    const nearNormal = axis.delta > 0 ? axis.negativeNormal : axis.positiveNormal;
    if (nearFraction > entry + HIT_EPSILON) {
      entry = nearFraction;
      normal = nearNormal.clone();
    } else if (
      nearFraction >= 0 &&
      Math.abs(nearFraction - entry) <= HIT_EPSILON
    ) {
      normal.add(nearNormal).normalize();
    }
    exit = Math.min(exit, farFraction);
    if (entry > exit) {
      return null;
    }
  }
  if (entry < 0 || entry > 1) {
    return null;
  }
  if (normal.length === 0) {
    normal = new Vector(start.x - end.x, start.y - end.y).normalize();
  }
  return { fraction: entry, normal };
}

export function reflectVector(velocity: Point, normal: Point): Vector {
  const unitNormal = new Vector(normal.x, normal.y).normalize();
  const projection = velocity.x * unitNormal.x + velocity.y * unitNormal.y;
  return new Vector(
    velocity.x - 2 * projection * unitNormal.x,
    velocity.y - 2 * projection * unitNormal.y,
  );
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
