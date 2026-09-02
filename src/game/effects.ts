import { clamp, Vector } from "./vector";

export type ParticleKind = "spark" | "smoke" | "glow" | "ring";

export interface EffectParticle {
  position: Vector;
  velocity: Vector;
  life: number;
  maxLife: number;
  color: string;
  kind: ParticleKind;
  size: number;
  growth: number;
  drag: number;
  rotation: number;
  spin: number;
}

export function advanceEffectParticle(particle: EffectParticle, delta: number): boolean {
  particle.life -= delta;
  particle.position.add(particle.velocity.clone().scale(delta));
  particle.velocity.scale(Math.pow(particle.drag, delta));
  particle.size = Math.max(0, particle.size + particle.growth * delta);
  particle.rotation += particle.spin * delta;
  return particle.life > 0;
}

export function effectOpacity(particle: EffectParticle): number {
  const remaining = clamp(particle.life / particle.maxLife, 0, 1);
  if (particle.kind === "smoke") {
    const fadeIn = Math.min(1, (1 - remaining) * 6);
    return remaining * fadeIn * 0.3;
  }
  if (particle.kind === "glow") {
    return remaining * 0.42;
  }
  if (particle.kind === "ring") {
    return remaining * remaining * 0.7;
  }
  return remaining * remaining;
}

export function wrappedParallaxX(
  origin: number,
  elapsed: number,
  speed: number,
  width: number,
  margin: number,
): number {
  const span = width + margin * 2;
  return ((origin - elapsed * speed + margin) % span + span) % span - margin;
}
