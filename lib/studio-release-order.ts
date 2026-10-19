export function normalizeStudioReleaseOrder(availableIds: readonly string[], requested: readonly string[]): string[] {
  const available = new Set(availableIds);
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const id of [...requested, ...availableIds]) {
    if (available.has(id) && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  return ordered;
}

export function moveStudioReleaseItem(order: readonly string[], id: string, direction: "up" | "down"): string[] {
  const moved = [...order];
  const index = moved.indexOf(id);
  const next = index + (direction === "up" ? -1 : 1);
  if (index < 0 || next < 0 || next >= moved.length) return moved;
  [moved[index], moved[next]] = [moved[next], moved[index]];
  return moved;
}

export function studioSelectedReleaseOrder(order: readonly string[], selected: readonly string[]): string[] {
  const selectedIds = new Set(selected);
  const seen = new Set<string>();
  return order.filter((id) => {
    if (!selectedIds.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
