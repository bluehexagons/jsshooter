export interface WeaponFeedback {
  recoil: number;
  muzzleFlashes: readonly WeaponMuzzleFlash[];
  activity: number;
}

export interface WeaponMuzzleFlash {
  angle: number;
  intensity: number;
}

export function createWeaponFeedback(): WeaponFeedback {
  return { recoil: 0, muzzleFlashes: [], activity: 0 };
}

export function triggerWeaponFeedback(
  feedback: WeaponFeedback,
  muzzleAngle = 0,
): WeaponFeedback {
  return {
    recoil: 1,
    muzzleFlashes: [...feedback.muzzleFlashes, { angle: muzzleAngle, intensity: 1 }].slice(-8),
    activity: 1,
  };
}

export function advanceWeaponFeedback(
  feedback: WeaponFeedback,
  delta: number,
  recoilDistance: number,
): WeaponFeedback {
  const recoilRecovery = Math.max(5, 18 / Math.max(1, recoilDistance));
  return {
    recoil: Math.max(0, feedback.recoil - delta * recoilRecovery),
    muzzleFlashes: feedback.muzzleFlashes
      .map((flash) => ({ ...flash, intensity: flash.intensity - delta * 15 }))
      .filter((flash) => flash.intensity > 0),
    activity: Math.max(0, feedback.activity - delta * 2.2),
  };
}
