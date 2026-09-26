import type { BodyStructure } from '../app/body-types';
import { selectionBounds } from './selection-visibility';

/** A regional landing preference, never a source-geometry transformation. */
export function initialBodySide(region: string): 'right' | 'both' {
  return region === 'hand' ? 'right' : 'both';
}

/** Camera preset only. All visible sources remain loaded at their source positions. */
export function handFramingBounds({
  region, side, structures, visibleIds, selectedId, enabled,
}: {
  region: string;
  side: string;
  structures: BodyStructure[];
  visibleIds: string[];
  selectedId: string | null;
  enabled: boolean;
}) {
  if (!enabled || region !== 'hand' || !['right', 'left'].includes(side))
    return null;
  const visible = new Set(visibleIds);
  const selected = structures.find((s) => s.id === selectedId);
  // Selecting a long proximal vessel must reveal its whole source, not frame
  // just the hand because the vessel also participates in that region.
  if (selected && (selected.region !== 'hand' || !visible.has(selected.id)))
    return null;
  const core = structures.filter((s) =>
    s.region === 'hand' && s.laterality === side && visible.has(s.id),
  );
  return selectionBounds(core);
}
