import { describe, expect, it } from "vitest";
import {
  MAX_WEAPON_LEVEL,
  SHIPS,
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

describe("wireframe models", () => {
  it("defines a hardpoint for every compatible weapon", () => {
    for (const ship of SHIPS) {
      for (const weapon of ship.armory) {
        expect(ship.mounts[weapon], `${ship.id} is missing ${weapon}`).toBeDefined();
      }
    }
  });

  it("keeps multi-weapon hardpoints from stacking their physical bodies", () => {
    for (const ship of SHIPS) {
      for (let firstIndex = 0; firstIndex < ship.armory.length; firstIndex += 1) {
        const firstId = ship.armory[firstIndex];
        const first = firstId ? ship.mounts[firstId] : undefined;
        if (!firstId || !first) {
          continue;
        }
        for (let secondIndex = firstIndex + 1; secondIndex < ship.armory.length; secondIndex += 1) {
          const secondId = ship.armory[secondIndex];
          const second = secondId ? ship.mounts[secondId] : undefined;
          if (!secondId || !second) {
            continue;
          }
          const separation = Math.hypot(first.x - second.x, first.y - second.y);
          const combinedRadius =
            WEAPONS[firstId].collisionRadius + WEAPONS[secondId].collisionRadius;
          expect(separation, `${ship.name}: ${firstId} overlaps ${secondId}`).toBeGreaterThanOrEqual(
            combinedRadius,
          );
        }
      }
    }
  });

  it("keeps explicit collision cores smaller than extreme decorative points", () => {
    const needle = SHIPS.find((ship) => ship.id === "focus");
    expect(needle?.collisionRadius).toBeLessThan(20);
  });
});
