import { describe, expect, it } from "vitest";
import { MAX_WEAPON_LEVEL, WEAPONS, weaponUpgradeCost } from "./config";

describe("weaponUpgradeCost", () => {
  it("increases the price at each level", () => {
    const weapon = WEAPONS.rapid;
    expect(weaponUpgradeCost(weapon, 2)).toBeGreaterThan(weaponUpgradeCost(weapon, 1));
  });

  it("returns zero once a weapon is fully upgraded", () => {
    expect(weaponUpgradeCost(WEAPONS.laser, MAX_WEAPON_LEVEL)).toBe(0);
  });
});
