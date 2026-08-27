import { describe, expect, it } from "vitest";
import {
  MAX_WEAPON_LEVEL,
  WEAPONS,
  weaponMaxDurability,
  weaponRepairCost,
  weaponUpgradeCost,
} from "./config";

describe("weaponUpgradeCost", () => {
  it("increases the price at each level", () => {
    expect(weaponUpgradeCost(2)).toBeGreaterThan(weaponUpgradeCost(1));
  });

  it("returns zero once a weapon is fully upgraded", () => {
    expect(weaponUpgradeCost(MAX_WEAPON_LEVEL)).toBe(0);
  });
});

describe("weapon durability", () => {
  it("increases with each upgrade", () => {
    expect(weaponMaxDurability(WEAPONS.shell, 3)).toBeGreaterThan(
      weaponMaxDurability(WEAPONS.shell, 2),
    );
  });

  it("charges only for missing durability", () => {
    const maximum = weaponMaxDurability(WEAPONS.rapid, 1);
    expect(weaponRepairCost(WEAPONS.rapid, 1, maximum)).toBe(0);
    expect(weaponRepairCost(WEAPONS.rapid, 1, maximum - 10)).toBe(13);
  });
});
