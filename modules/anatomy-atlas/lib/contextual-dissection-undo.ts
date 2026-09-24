import type { DissectionState } from '@/app/dissection-data';

/** Describe only the removal that the existing history's next Undo reverses. */
export function lastSingleRemoval<T extends { id: string; name: string }>(
  state: DissectionState,
  structures: T[],
): T | null {
  const previous = state.history.at(-1);
  if (
    !previous ||
    previous.stageId !== state.stageId ||
    previous.focusId !== state.focusId
  ) return null;
  const sameIds = (a: string[], b: string[]) =>
    a.length === b.length &&
    new Set(a).size === a.length &&
    new Set(b).size === b.length &&
    a.every((id) => b.includes(id));
  const added = state.removed.filter((id) => !previous.removed.includes(id));
  if (added.length !== 1) return null;
  const id = added[0];
  if (
    !sameIds(state.removed, [...previous.removed, id]) ||
    !sameIds(state.restored, previous.restored.filter((item) => item !== id))
  ) return null;
  const matches = structures.filter((item) => item.id === id);
  return matches.length === 1 ? matches[0] : null;
}
