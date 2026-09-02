import { describe, expect, it } from "vitest";
import {
  advanceWeaponFeedback,
  createWeaponFeedback,
  triggerWeaponFeedback,
} from "./weapon-feedback";

describe("weapon feedback", () => {
  it("starts at rest and responds immediately to a shot", () => {
    const resting = createWeaponFeedback();
    expect(resting).toEqual({ recoil: 0, muzzleFlashes: [], activity: 0 });
    expect(triggerWeaponFeedback(resting, 0.4)).toEqual({
      recoil: 1,
      muzzleFlashes: [{ angle: 0.4, intensity: 1 }],
      activity: 1,
    });
  });

  it("lets light actions recover faster while keeping a longer activity pulse", () => {
    const fired = triggerWeaponFeedback(createWeaponFeedback());
    const light = advanceWeaponFeedback(fired, 0.1, 3);
    const heavy = advanceWeaponFeedback(fired, 0.1, 13);
    expect(light.recoil).toBeLessThan(heavy.recoil);
    expect(light.muzzleFlashes).toEqual([]);
    expect(heavy.activity).toBeGreaterThan(0);
  });

  it("clamps every channel back to its resting state", () => {
    expect(advanceWeaponFeedback(triggerWeaponFeedback(createWeaponFeedback()), 2, 10)).toEqual({
      recoil: 0,
      muzzleFlashes: [],
      activity: 0,
    });
  });

  it("can show simultaneous flashes for multi-barrel weapons", () => {
    let feedback = createWeaponFeedback();
    for (let barrel = 0; barrel < 12; barrel += 1) {
      feedback = triggerWeaponFeedback(feedback, barrel * 0.1);
    }
    expect(feedback.muzzleFlashes).toHaveLength(8);
    expect(feedback.muzzleFlashes[0]?.angle).toBeCloseTo(0.4);
  });
});
