export interface Point {
  x: number;
  y: number;
}

export class Vector implements Point {
  public constructor(
    public x = 0,
    public y = 0,
  ) {}

  public static fromAngle(angle: number, length = 1): Vector {
    return new Vector(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  public static between(from: Point, to: Point): Vector {
    return new Vector(to.x - from.x, to.y - from.y);
  }

  public get length(): number {
    return Math.hypot(this.x, this.y);
  }

  public get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  public clone(): Vector {
    return new Vector(this.x, this.y);
  }

  public add(other: Point): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  public scale(factor: number): this {
    this.x *= factor;
    this.y *= factor;
    return this;
  }

  public normalize(): this {
    const currentLength = this.length;
    if (currentLength > 0) {
      this.scale(1 / currentLength);
    }
    return this;
  }

  public limit(maxLength: number): this {
    const currentLength = this.length;
    if (currentLength > maxLength) {
      this.scale(maxLength / currentLength);
    }
    return this;
  }
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function circlesOverlap(a: Point, aRadius: number, b: Point, bRadius: number): boolean {
  const x = a.x - b.x;
  const y = a.y - b.y;
  const radius = aRadius + bRadius;
  return x * x + y * y <= radius * radius;
}
