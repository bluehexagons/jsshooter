import { describe, expect, it } from "vitest";
import { WEAPONS } from "./config";
import {
  pulseClipSize,
  pulseReloadTime,
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
});
