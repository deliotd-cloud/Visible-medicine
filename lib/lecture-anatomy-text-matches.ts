import {
  createLectureAnatomyReference,
  lectureAnatomyOptions,
  resolveLectureAnatomyReference,
} from './lecture-anatomy-reference.ts';

export const LECTURE_ANATOMY_MATCH_LIMIT = 6;

type AnatomyTextMatch = {conceptId: string; label: string};

const words = /[\p{L}\p{N}]+/gu;

function tokens(value: string): string[] {
  return value.normalize('NFKC').toLowerCase().match(words) ?? [];
}

function containsPhrase(haystack: readonly string[], phrase: readonly string[]): boolean {
  if (phrase.length === 0 || phrase.length > haystack.length) return false;
  for (let start = 0; start <= haystack.length - phrase.length; start++) {
    if (phrase.every((word, offset) => haystack[start + offset] === word)) return true;
  }
  return false;
}

/** Literal current-label suggestions only; callers must require an explicit selection. */
export function lectureAnatomyTextMatches(
  title: unknown,
  body: unknown,
): {matches: AnatomyTextMatch[]; total: number} {
  if (typeof title !== 'string' || typeof body !== 'string' ||
      title.length > 160 || body.length > 5000) return {matches: [], total: 0};

  const titleWords = tokens(title);
  const bodyWords = tokens(body);
  const matches: AnatomyTextMatch[] = [];
  const seen = new Set<string>();
  let total = 0;

  for (const option of lectureAnatomyOptions()) {
    if (seen.has(option.conceptId)) continue;
    const labelWords = tokens(option.label);
    if (!containsPhrase(titleWords, labelWords) && !containsPhrase(bodyWords, labelWords)) continue;
    const reference = createLectureAnatomyReference(option.conceptId);
    if (!reference || !resolveLectureAnatomyReference(reference)) continue;
    seen.add(option.conceptId);
    total++;
    if (matches.length < LECTURE_ANATOMY_MATCH_LIMIT) {
      matches.push({conceptId: option.conceptId, label: option.label});
    }
  }
  return {matches, total};
}
