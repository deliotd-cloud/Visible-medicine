import type {HeadEntry} from './head-atlas-import';
import {practiceEntries, type HeadPracticeReviewItem, type PracticeMode} from './head-atlas-practice.ts';
import {HEAD_LINK_REVISION, type HeadModality} from './head-atlas-links.ts';
import {headImageConcept, resolveHeadImageConcept} from './head-image-only-links.ts';

const MAX_QUESTIONS = 10000;
const UNLINKED = 'Unlinked structure (source label withheld)';
const WARNING = 'Private local session summary only. Not certified, clinically approved, or a radiologist sign-off.';

export type HeadPracticeSummaryQuestion = Readonly<{
  ordinal: number;
  label: string;
  conceptId: string | null;
  outcome: HeadPracticeReviewItem['outcome'];
}>;
export type HeadPracticeSummarySet = Readonly<{
  questions: readonly HeadPracticeSummaryQuestion[];
  total: number;
  correct: number;
  incorrect: number;
  revealed: number;
  unanswered: number;
  attempted: number;
}>;
export type HeadPracticeSummary = Readonly<{
  modality: HeadModality;
  mode: PracticeMode;
  headLinkRevision: string | null;
  warning: string;
  current: HeadPracticeSummarySet;
  original: HeadPracticeSummarySet | null;
}>;

function invalid(): never { throw new Error('Invalid completed practice results.'); }

/** Accept only exact, eligible objects from this study; source fields never enter the result. */
export function createHeadPracticeSummary({items, originalItems, entries, modality, revision, mode}: {
  items: HeadPracticeReviewItem[];
  originalItems?: HeadPracticeReviewItem[];
  entries: HeadEntry[];
  modality: HeadModality;
  revision: string;
  mode: PracticeMode;
}): HeadPracticeSummary {
  if ((modality !== 'CT' && modality !== 'MRI') || (mode !== 'locate' && mode !== 'label' && mode !== 'recall') ||
    typeof revision !== 'string' || !Array.isArray(entries) || !entries.length || entries.length > MAX_QUESTIONS ||
    !Array.isArray(items) || !items.length || items.length > MAX_QUESTIONS ||
    (originalItems !== undefined && (!Array.isArray(originalItems) || !originalItems.length || originalItems.length > MAX_QUESTIONS))) invalid();
  const references = new Set<HeadEntry>(), ids = new Set<string>();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || !entry.id ||
      references.has(entry) || ids.has(entry.id)) invalid();
    references.add(entry); ids.add(entry.id);
  }
  let eligible: Set<HeadEntry>;
  try { eligible = new Set(practiceEntries(entries)); } catch { invalid(); }
  const pinned = revision === HEAD_LINK_REVISION;
  const makeSet = (results: HeadPracticeReviewItem[]): HeadPracticeSummarySet => {
    const seen = new Set<HeadEntry>();
    const counts = {correct: 0, incorrect: 0, revealed: 0, unanswered: 0};
    const questions = results.map((item, index): HeadPracticeSummaryQuestion => {
      if (!item || typeof item !== 'object' || !eligible.has(item.entry) || seen.has(item.entry) ||
        typeof item.outcome !== 'string' || !Object.hasOwn(counts, item.outcome)) invalid();
      seen.add(item.entry);
      counts[item.outcome as keyof typeof counts]++;
      const candidate = pinned ? headImageConcept(item.entry, modality) : null;
      const concept = candidate && resolveHeadImageConcept(entries, candidate.conceptId, modality) === item.entry
        ? candidate : null;
      return Object.freeze({ordinal: index + 1, label: concept?.label ?? UNLINKED,
        conceptId: concept?.conceptId ?? null, outcome: item.outcome});
    });
    return Object.freeze({questions: Object.freeze(questions), total: questions.length, ...counts,
      attempted: counts.correct + counts.incorrect});
  };
  return Object.freeze({modality, mode, headLinkRevision: pinned ? HEAD_LINK_REVISION : null,
    warning: WARNING, current: makeSet(items), original: originalItems ? makeSet(originalItems) : null});
}

export function formatHeadPracticeSummary(summary: HeadPracticeSummary): string {
  const lines = ['Head anatomy practice · private session summary', summary.warning,
    `Modality: ${summary.modality} · Mode: ${summary.mode}`,
    `Head concept link revision: ${summary.headLinkRevision ?? 'unavailable'}`];
  const addSet = (title: string, set: HeadPracticeSummarySet) => {
    lines.push('', title,
      `Questions: ${set.total} · Correct first attempts: ${set.correct} · Incorrect first attempts: ${set.incorrect} · Revealed: ${set.revealed} · Unanswered: ${set.unanswered}`,
      `Attempted score: ${set.correct}/${set.attempted} (revealed and unanswered excluded)`);
    for (const question of set.questions) lines.push(`${question.ordinal}. ${question.label} — ${question.outcome}`);
  };
  if (summary.original) addSet('Original set · first attempts preserved', summary.original);
  addSet(summary.original ? 'Follow-up set · separate attempts' : 'Current set · first attempts', summary.current);
  return lines.join('\n') + '\n';
}

/** User-triggered download only. No network or persistent browser storage. */
export function downloadHeadPracticeSummary(summary: HeadPracticeSummary): void {
  const text = formatHeadPracticeSummary(summary);
  const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
  let url: string | undefined;
  let anchor: HTMLAnchorElement | undefined;
  try {
    url = URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'head-practice-summary.txt';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    throw error;
  } finally {
    anchor?.remove();
  }
  const objectUrl = url;
  if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
