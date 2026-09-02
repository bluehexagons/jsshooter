import type { WireframeSegment } from "./config";
import { clamp, type Point, Vector } from "./vector";

export interface WireFragment {
  position: Vector;
  velocity: Vector;
  start: Point;
  end: Point;
  rotation: number;
  spin: number;
  life: number;
  maxLife: number;
  color: string;
  lineWidth: number;
  drag: number;
}

export interface WireExplosionOptions {
  origin: Point;
  rotation: number;
  shape: readonly Point[];
  details: readonly WireframeSegment[];
  color: string;
  inheritedVelocity?: Point;
  impulse?: Point;
  outwardSpeed?: number;
  lifetime?: number;
  lineWidth?: number;
  random?: () => number;
}

function isVisibleSegment([start, end]: WireframeSegment): boolean {
  return start.x !== end.x || start.y !== end.y;
}

/** Splits a complete model into its outline edges and internal detail lines. */
export function wireframeSegments(
  shape: readonly Point[],
  details: readonly WireframeSegment[],
): readonly WireframeSegment[] {
  const segments: WireframeSegment[] = [];
  for (let index = 0; index < shape.length; index += 1) {
    const start = shape[index];
    const end = shape[(index + 1) % shape.length];
    if (start && end && isVisibleSegment([start, end])) {
      segments.push([start, end]);
    }
  }
  segments.push(...details.filter(isVisibleSegment));
  return segments;
}

/** Creates one independently moving fragment for every line in a wireframe model. */
export function createWireExplosion(options: WireExplosionOptions): WireFragment[] {
  const random = options.random ?? Math.random;
  const inherited = options.inheritedVelocity ?? { x: 0, y: 0 };
  const impulse = options.impulse ?? { x: 0, y: 0 };
  const impulseDirection = new Vector(impulse.x, impulse.y);
  const impulseStrength = Math.min(110, impulseDirection.length * 0.16);
  impulseDirection.normalize();

  const cosine = Math.cos(options.rotation);
  const sine = Math.sin(options.rotation);
  const rotate = (point: Point): Vector =>
    new Vector(point.x * cosine - point.y * sine, point.x * sine + point.y * cosine);

  return wireframeSegments(options.shape, options.details).map(([start, end]) => {
    const midpoint = new Vector((start.x + end.x) / 2, (start.y + end.y) / 2);
    const worldOffset = rotate(midpoint);
    const outward = worldOffset.clone();
    if (outward.length < 0.01) {
      const fallbackAngle = options.rotation + random() * Math.PI * 2;
      outward.x = Math.cos(fallbackAngle);
      outward.y = Math.sin(fallbackAngle);
    } else {
      outward.normalize();
    }

    const spreadAngle = (random() - 0.5) * 0.9;
    const spreadCosine = Math.cos(spreadAngle);
    const spreadSine = Math.sin(spreadAngle);
    const spreadX = outward.x * spreadCosine - outward.y * spreadSine;
    const spreadY = outward.x * spreadSine + outward.y * spreadCosine;
    const speed = (options.outwardSpeed ?? 130) * (0.62 + random() * 0.76);
    const velocity = new Vector(
      inherited.x * 0.72 + spreadX * speed + impulseDirection.x * impulseStrength,
      inherited.y * 0.72 + spreadY * speed + impulseDirection.y * impulseStrength,
    );
    const life = (options.lifetime ?? 1.15) * (0.82 + random() * 0.36);

    return {
      position: new Vector(options.origin.x + worldOffset.x, options.origin.y + worldOffset.y),
      velocity,
      start: { x: start.x - midpoint.x, y: start.y - midpoint.y },
      end: { x: end.x - midpoint.x, y: end.y - midpoint.y },
      rotation: options.rotation,
      spin: (random() - 0.5) * 7,
      life,
      maxLife: life,
      color: options.color,
      lineWidth: options.lineWidth ?? 1.6,
      drag: 0.72 + random() * 0.12,
    };
  });
}

export function advanceWireFragment(fragment: WireFragment, delta: number): boolean {
  fragment.life -= delta;
  fragment.position.add(fragment.velocity.clone().scale(delta));
  fragment.velocity.scale(Math.pow(fragment.drag, delta));
  fragment.rotation += fragment.spin * delta;
  return fragment.life > 0;
}

export function wireFragmentOpacity(fragment: WireFragment): number {
  const remaining = clamp(fragment.life / fragment.maxLife, 0, 1);
  return remaining * remaining;
}

export function wireFragmentWorldSegment(fragment: WireFragment): WireframeSegment {
  const cosine = Math.cos(fragment.rotation);
  const sine = Math.sin(fragment.rotation);
  const transform = (point: Point): Point => ({
    x: fragment.position.x + point.x * cosine - point.y * sine,
    y: fragment.position.y + point.x * sine + point.y * cosine,
  });
  return [transform(fragment.start), transform(fragment.end)];
}
