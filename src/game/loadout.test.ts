import { describe, expect, it } from "vitest";
import { resolveArmoryAction } from "./loadout";

const armory = ["rapid", "rail", "flak"] as const;

describe("armory hotkeys", () => {
  it("uses upgrade on an empty armory key to purchase that weapon", () => {
    expect(resolveArmoryAction(armory, [], "upgrade", 1)).toEqual({
      id: "rail",
      operation: "purchase",
    });
  });

  it("upgrades the same weapon after it is installed", () => {
    expect(resolveArmoryAction(armory, ["rail"], "upgrade", 1)).toEqual({
      id: "rail",
      operation: "upgrade",
    });
  });

  it("does not repair or reload an empty entry", () => {
    expect(resolveArmoryAction(armory, [], "repair", 1)).toBeNull();
    expect(resolveArmoryAction(armory, [], "reload", 1)).toBeNull();
  });

  it("ignores keys beyond a ship's armory", () => {
    expect(resolveArmoryAction(armory, [], "upgrade", 4)).toBeNull();
  });
});
