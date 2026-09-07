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
