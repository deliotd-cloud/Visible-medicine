/** Exact parent/study tuple, never a name or a root/specimen review identity. */
export function nestedReviewKey(parentId: string, study: string): string {
  return JSON.stringify([parentId, study]);
}
export function parseNestedReviewKey(value: unknown) {
  if (typeof value !== 'string' || value.length > 256) throw Error('Invalid nested review key.');
  let tuple: unknown;
  try { tuple = JSON.parse(value); } catch { throw Error('Invalid nested review key.'); }
  if (!Array.isArray(tuple) || tuple.length !== 2 ||
      tuple.some(v => typeof v !== 'string' || !v || v.length > 220) ||
      JSON.stringify(tuple) !== value) throw Error('Invalid nested review key.');
  return {key:value, parentId:tuple[0] as string, study:tuple[1] as string};
}
