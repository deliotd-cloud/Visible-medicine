/** Presentation only: source lesson titles and revision-bound review data stay intact. */
export function teachingHeading(title: string, structureName: string): string {
  if (!structureName) return title;
  const prefix = `${structureName} · `;
  if (!title.startsWith(prefix)) return title;
  let remainder = title.slice(prefix.length);
  while (remainder.startsWith(prefix)) remainder = remainder.slice(prefix.length);
  return prefix + remainder;
}
