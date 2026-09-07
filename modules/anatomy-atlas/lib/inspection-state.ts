export type SectionPlane = 'off' | 'axial' | 'coronal' | 'sagittal';
export type InspectionState = {
  plane: SectionPlane;
  position: number;
  flipped: boolean;
  opacity: Record<string, number>;
  keepSelectedSolid: boolean;
  /** Optional for legacy saved views. Does not bypass source crops. */
  keepSelectedUncut?: boolean;
};
export const initialInspection: InspectionState = {
  plane: 'off',
  position: 50,
  flipped: false,
  opacity: {},
  keepSelectedSolid: true,
};
export const sectionAxes = {
  axial: { axis: 1, low: 'Inferior', high: 'Superior' },
  coronal: { axis: 2, low: 'Posterior', high: 'Anterior' },
  sagittal: { axis: 0, low: 'Right', high: 'Left' },
} as const;
export function sectionLevel(low: number, high: number, position: number) {
  const percent =
    Math.max(0, Math.min(100, Number.isFinite(position) ? position : 50)) / 100;
  return low + (high - low) * percent;
}
export function systemOpacity(
  state: InspectionState,
  system: string,
  selected = false,
) {
  if (selected && state.keepSelectedSolid) return 1;
  const value = state.opacity[system] ?? 100;
  return Math.max(5, Math.min(100, Number.isFinite(value) ? value : 100)) / 100;
}
