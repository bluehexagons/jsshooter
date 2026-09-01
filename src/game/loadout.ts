import type { WeaponId } from "./config";
import type { QuickAction } from "./input";

export type ArmoryOperation = "purchase" | "upgrade" | "repair" | "reload";

export interface ArmoryAction {
  id: WeaponId;
  operation: ArmoryOperation;
}

export function resolveArmoryAction(
  armory: readonly WeaponId[],
  installed: readonly WeaponId[],
  action: QuickAction,
  slot: number,
): ArmoryAction | null {
  const id = armory[slot];
  if (!id) {
    return null;
  }
  const isInstalled = installed.includes(id);
  if (action === "upgrade") {
    return { id, operation: isInstalled ? "upgrade" : "purchase" };
  }
  return isInstalled ? { id, operation: action } : null;
}
