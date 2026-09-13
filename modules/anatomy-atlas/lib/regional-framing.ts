import { handFramingBounds } from './hand-framing';
import { selectionBounds } from './selection-visibility';

export function regionalFramingRegion(region: string, side: string) {
  if (region === 'hand' && ['left', 'right'].includes(side)) return 'hand';
  if (region === 'foot' && ['left', 'right', 'both'].includes(side)) return 'foot';
  return null;
}

/** Camera-only regional framing; never remove or reposition a source. */
export function regionalFramingBounds(input: Parameters<typeof handFramingBounds>[0]) {
  // Preserve the previously verified hand preset and unilateral landing policy.
  if (input.region === 'hand') return handFramingBounds(input);
  const { region, side, structures, visibleIds, selectedId, enabled } = input;
  if (!enabled || regionalFramingRegion(region, side) !== 'foot') return null;
  const visible = new Set(visibleIds);
  const selected = structures.find((s) => s.id === selectedId);
  // Calf vessels and the calcaneal tendon retain their full source extent when
  // selected. A foot-region membership does not turn those into cropped meshes.
  if (selected && (selected.region !== 'foot' || !visible.has(selected.id)))
    return null;
  return selectionBounds(structures.filter((s) =>
    s.region === 'foot' && (side === 'both' || s.laterality === side) && visible.has(s.id),
  ));
}
