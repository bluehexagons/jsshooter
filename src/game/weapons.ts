import type { WeaponDefinition, WeaponId } from "./config";

export function pulseClipSize(level: number): number {
  return 15 + (level - 1) * 3;
}

export function pulseReloadTime(level: number): number {
  return Math.max(0.9, 2.25 - (level - 1) * 0.15);
}

export function weaponCooldown(definition: WeaponDefinition, level: number): number {
  const upgrades = level - 1;
  if (definition.id === "rapid" || definition.id === "rapid2" || definition.id === "fan") {
    return definition.cooldown / Math.pow(1.1, upgrades);
  }
  if (definition.id === "shell" || definition.id === "shell2") {
    return definition.cooldown / Math.pow(1.03, upgrades);
  }
  if (definition.id === "rail" || definition.id === "flak") {
    return definition.cooldown / Math.pow(1.05, upgrades);
  }
  return definition.cooldown;
}

export function weaponDamage(definition: WeaponDefinition, level: number): number {
  const upgrades = level - 1;
  if (
    definition.id === "rapid" ||
    definition.id === "rapid2" ||
    definition.id === "fan" ||
    definition.id === "pulse" ||
    definition.id === "rail" ||
    definition.id === "flak"
  ) {
    return definition.damage * (1 + upgrades * 0.18);
  }
  return definition.damage;
}

export function railPierce(level: number): number {
  return 2 + Math.floor((level - 1) / 3);
}

export function flakBlastRadius(level: number): number {
  return 58 + (level - 1) * 3;
}

export function flakSplashDamage(damage: number, radius: number, distance: number): number {
  if (radius <= 0 || distance >= radius) {
    return 0;
  }
  const falloff = 1 - Math.max(0, distance) / radius;
  return damage * (0.35 + falloff * 0.65);
}

export function shellAngles(id: Extract<WeaponId, "shell" | "shell2">, level: number): readonly number[] {
  const side = id === "shell" ? -1 : 1;
  const angles = [side];
  if (level >= 2) {
    angles.push(side * 10, side * 20);
  }
  if (level >= 5) {
    angles.unshift(side * -5);
  }
  if (level >= 9) {
    angles.push(side * 90, side * -130);
  }
  return angles.map((angle) => (angle * Math.PI) / 180);
}

export interface LaserImpact {
  reflects: boolean;
  remainingPenetration: number;
}

export function resolveLaserImpact(penetration: number, resistance: number): LaserImpact {
  const reflects = resistance >= 20 && resistance >= penetration * 1.25;
  return {
    reflects,
    remainingPenetration: reflects ? penetration - 1 : penetration - resistance,
  };
}
