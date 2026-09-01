import { describe, expect, it } from "vitest";
import {
  MAX_WEAPONS,
  MAX_WEAPON_LEVEL,
  SHIPS,
  WEAPONS,
  weaponMaxDurability,
  weaponRepairCost,
  weaponUpgradeCost,
} from "./config";
import { animatedMountOffset } from "./mount-motion";

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

  it("keeps each mobile mount's full path clear of the hull and other weapons", () => {
    for (const ship of SHIPS) {
      for (const movingId of ship.armory) {
        const movement = WEAPONS[movingId].movement;
        const base = ship.mounts[movingId];
        if (!movement || !base) {
          continue;
        }
        for (let sample = 0; sample < 96; sample += 1) {
          const phase = (sample / 96) * Math.PI * 2;
          const position = animatedMountOffset(base, movement, phase);
          expect(
            Math.hypot(position.x, position.y),
            `${ship.name}: ${movingId} clips the hull`,
          ).toBeGreaterThanOrEqual(
            WEAPONS[movingId].collisionRadius + ship.collisionRadius,
          );
          for (const otherId of ship.armory) {
            if (otherId === movingId) {
              continue;
            }
            const other = ship.mounts[otherId];
            if (!other) {
              continue;
            }
            expect(
              Math.hypot(position.x - other.x, position.y - other.y),
              `${ship.name}: moving ${movingId} clips ${otherId}`,
            ).toBeGreaterThanOrEqual(
              WEAPONS[movingId].collisionRadius + WEAPONS[otherId].collisionRadius,
            );
          }
        }
      }
    }
  });

  it("keeps explicit collision cores smaller than extreme decorative points", () => {
    const needle = SHIPS.find((ship) => ship.id === "focus");
    expect(needle?.collisionRadius).toBeLessThan(20);
  });

  it("keeps every weapon available without exceeding the five armory hotkeys", () => {
    const availableWeapons = new Set(SHIPS.flatMap((ship) => ship.armory));
    expect([...availableWeapons].sort()).toEqual(Object.keys(WEAPONS).sort());
    for (const ship of SHIPS) {
      expect(ship.armory.length, `${ship.name} has too many armory entries`).toBeLessThanOrEqual(
        MAX_WEAPONS,
      );
    }
  });

  it("gives every ship a mobile defensive or escort option", () => {
    for (const ship of SHIPS) {
      expect(
        ship.armory.some((id) => WEAPONS[id].movement !== undefined),
        `${ship.name} has no mobile mount`,
      ).toBe(true);
    }
  });
});
