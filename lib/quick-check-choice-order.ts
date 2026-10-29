/**
 * Produce a repeatable display order for a formative quick check.
 * The seed uses only the visible prompt and complete choice list, so grading
 * metadata cannot affect the order. This mixing is not an exam security feature.
 */
export function orderQuickCheckChoices(question: string, choices: readonly string[]): string[] {
  const ordered = [...choices];
  const seed = JSON.stringify([question, choices]);

  // FNV-1a over UTF-16 code units gives the same 32-bit seed in every JS runtime.
  let state = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    state = Math.imul(state ^ seed.charCodeAt(index), 0x01000193);
  }
  state = state >>> 0 || 0x9e3779b9;

  // Seeded Fisher-Yates. Always work on a copy; labels stay byte-for-byte intact.
  for (let index = ordered.length - 1; index > 0; index -= 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    const selected = state % (index + 1);
    [ordered[index], ordered[selected]] = [ordered[selected], ordered[index]];
  }
  return ordered;
}
