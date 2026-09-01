import { describe, expect, it } from "vitest";
import { WEAPONS } from "./config";
import {
  flakBlastRadius,
  flakSplashDamage,
  pulseClipSize,
  pulseReloadTime,
  railPierce,
  resolveLaserImpact,
  shellAngles,
  weaponCooldown,
  weaponDamage,
} from "./weapons";

describe("legacy weapon upgrades", () => {
  it("adds three pulse rounds and shortens reloads per level", () => {
    expect(pulseClipSize(2)).toBe(18);
    expect(pulseReloadTime(2)).toBeLessThan(pulseReloadTime(1));
  });

  it("adds physical shell barrels at the original milestones", () => {
    expect(shellAngles("shell", 1)).toHaveLength(1);
    expect(shellAngles("shell", 2)).toHaveLength(3);
    expect(shellAngles("shell", 5)).toHaveLength(4);
    expect(shellAngles("shell", 9)).toHaveLength(6);
  });

  it("upgrades rapid cadence and damage", () => {
    expect(weaponCooldown(WEAPONS.rapid, 2)).toBeLessThan(weaponCooldown(WEAPONS.rapid, 1));
    expect(weaponDamage(WEAPONS.rapid, 2)).toBeGreaterThan(weaponDamage(WEAPONS.rapid, 1));
  });

  it("reflects an underpowered laser from the armored wall", () => {
    expect(resolveLaserImpact(24, 50).reflects).toBe(true);
    expect(resolveLaserImpact(46, 50).reflects).toBe(false);
  });

  it("gives the rail spike additional penetration at upgrade milestones", () => {
    expect(railPierce(1)).toBe(2);
    expect(railPierce(4)).toBe(3);
    expect(railPierce(10)).toBe(5);
  });

  it("grows flak reach while applying distance falloff", () => {
    expect(flakBlastRadius(2)).toBeGreaterThan(flakBlastRadius(1));
    expect(flakSplashDamage(30, 60, 0)).toBe(30);
    expect(flakSplashDamage(30, 60, 45)).toBeLessThan(20);
    expect(flakSplashDamage(30, 60, 60)).toBe(0);
  });
});
