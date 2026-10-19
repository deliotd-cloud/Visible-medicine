export type BodyReviewSummary = {
  id: string;
  name: string;
  fmaId: string;
  system: string;
  laterality: string;
  regions: string[];
};
export function bodyReviewQueue(
  rows: readonly BodyReviewSummary[],
  region: string,
  system: string,
  query: string,
) {
  const terms = query
    .slice(0, 256)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return rows
    .filter(
      (s) =>
        (region === 'all' || s.regions.includes(region)) &&
        (system === 'all' || s.system === system) &&
        terms.every((term) =>
          `${s.name} ${s.fmaId} ${s.laterality} ${s.id}`
            .toLowerCase()
            .includes(term),
        ),
    )
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}
