export function sceneLabelIds(
  selected: string | null,
  landmarks: string[],
  visibleIds: string[],
  focus: boolean,
): string[] {
  const ordered = focus && selected ? [selected] : [selected, ...landmarks];
  return [
    ...new Set(
      ordered.filter((id): id is string => !!id && visibleIds.includes(id)),
    ),
  ].slice(0, 8);
}

/** Resolve geometry only for requested labels. Hidden labels and exam mode must
 * not scan every source surface when a close-up bounds frame changes. */
export function sceneLabelAnchors<T extends { id: string }, A>(
  enabled: boolean,
  ids: string[],
  items: T[],
  resolve: (item: T) => A,
): Map<string, A> {
  const anchors = new Map<string, A>();
  if (!enabled || !ids.length) return anchors;
  const requested = new Set(ids);
  for (const item of items) {
    if (requested.has(item.id)) anchors.set(item.id, resolve(item));
  }
  return anchors;
}
