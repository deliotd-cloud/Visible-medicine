/** Positive steps enlarge the anatomy. Apply to the live camera scale, not the
 * last toolbar value, so wheel/pinch gestures and buttons compose predictably.
 * Legacy saved-view scale and absolute zoom values keep their existing meaning. */
export function steppedCameraScale(current: number, steps: number): number {
  const scale = Number.isFinite(current) && current > 0 ? current : 1;
  if (!Number.isSafeInteger(steps) || steps === 0) return scale;
  const next = scale * Math.pow(0.85, Math.max(-100, Math.min(100, steps)));
  // Never reverse the requested direction if a gesture is already beyond a
  // button limit. The opposite direction can still move back towards the model.
  return steps > 0 ? Math.max(Math.min(scale, 0.05), next)
    : Math.min(Math.max(scale, 20), next);
}
