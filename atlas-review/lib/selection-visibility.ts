import {
  sectionAxes,
  sectionLevel,
  systemOpacity,
  type InspectionState,
} from './inspection-state';

export type SelectionBounds = { min: number[]; max: number[] };
export function selectionBounds(
  items: Array<{ bounds: SelectionBounds }>,
  inferiorCrop = -Infinity,
): SelectionBounds | null {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const { bounds } of items) {
    const low = [
      bounds.min[0],
      Math.max(inferiorCrop, bounds.min[1]),
      bounds.min[2],
    ];
    if (
      low.some(
        (v, i) =>
          !Number.isFinite(v) ||
          !Number.isFinite(bounds.max[i]) ||
          v > bounds.max[i],
      )
    )
      continue;
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], low[i]);
      max[i] = Math.max(max[i], bounds.max[i]);
    }
  }
  return min.every(Number.isFinite) ? { min, max } : null;
}
export type SelectionVisibility = {
  reasons: string[];
  uncut: boolean;
  clipped: boolean;
  opacity: number;
  systemOff: boolean;
  removed: boolean;
};
/** Source-space bounds only: no claim about screen occlusion or clinical anatomy.
 * Renderer cuts move with exploded structures, so offsets cancel here. */
export function selectionVisibility({
  system,
  enabled,
  removed = false,
  bounds,
  frame,
  inspection,
}: {
  system: string;
  enabled: boolean;
  removed?: boolean;
  bounds: SelectionBounds | null;
  frame: SelectionBounds | null;
  inspection: InspectionState;
}): SelectionVisibility {
  const reasons: string[] = [];
  if (!enabled) reasons.push('System switched off');
  if (removed) reasons.push('Removed from this dissection');
  const opacity = systemOpacity(inspection, system, true);
  if (opacity < 0.2) reasons.push('Too transparent to select on the model');
  else if (opacity < 1) reasons.push('Selection is translucent');
  const uncut =
    inspection.plane !== 'off' && inspection.keepSelectedUncut === true;
  let clipped = false;
  if (inspection.plane !== 'off' && !uncut && bounds && frame) {
    const axis = sectionAxes[inspection.plane].axis;
    const level = sectionLevel(
      frame.min[axis],
      frame.max[axis],
      inspection.position,
    );
    const minDistance = inspection.flipped
      ? level - bounds.max[axis]
      : bounds.min[axis] - level;
    const maxDistance = inspection.flipped
      ? level - bounds.min[axis]
      : bounds.max[axis] - level;
    clipped = minDistance < -1e-7;
    if (maxDistance < -1e-7) reasons.push('Selection clipped by cutaway');
    else if (clipped) reasons.push('Cutaway may hide part of the selection');
  }
  return { reasons, uncut, clipped, opacity, systemOff: !enabled, removed };
}
/** Change selected-surface exceptions, never the whole-view plane or system opacity. */
export function recoverSelectionInspection(
  inspection: InspectionState,
  report: SelectionVisibility,
): InspectionState {
  if (!report.clipped && report.opacity === 1) return inspection;
  return {
    ...inspection,
    ...(report.clipped ? { keepSelectedUncut: true } : {}),
    ...(report.opacity < 1 ? { keepSelectedSolid: true } : {}),
  };
}
