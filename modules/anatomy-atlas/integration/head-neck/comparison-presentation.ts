/** Opt-in layout for the website's embedded, source-pinned head/neck comparison. */
export function comparisonPresentationEnabled(
  query: URLSearchParams,
  region: string | null,
  embedded: boolean,
  specimenStatus: string,
): boolean {
  const values = query.getAll('presentation');
  return embedded && region === 'head-neck' && specimenStatus === 'none' &&
    values.length === 1 && values[0] === 'compare';
}
