// Historical comparison only. No private review records are read or modified.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { quizQuestions } from '../app/anatomy-data.ts';
import { shoulderBeforeSoftTissueXray } from './shoulder-soft-tissue-xray-history.mjs';
import snapshot from './fixtures/review-display-before-website-pilot.json' with { type: 'json' };
import {
  currentReviewDocument,
  reviewDocumentForDisplay,
} from './review-revision-evidence.mjs';
const hash = (value) => createHash('sha256').update(value).digest('hex');

export async function reviewDocumentBeforeWebsitePilot(
  revisions,
  manifest,
  structures,
) {
  // Recompute every current display-source, mesh, identity and teaching digest.
  // Comparing the complete document also rejects missing paths and extra fields.
  assert.deepEqual(
    revisions,
    await currentReviewDocument(manifest, structures, quizQuestions),
    'Stale or altered current review evidence',
  );
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(
    snapshot.sourceCommit,
    '925056d1681b0a6668d34cb9584cf565bbbc3a97',
  );
  assert.equal(
    snapshot.reviewDocumentSha256,
    '5365d114752b157338dc9ebcf9e58dabe56be2d4d35296e717845bce939dfd05',
  );
  // Read the exact historical content, never rebuild old teaching with today's data.
  const previous = JSON.parse(execFileSync('git', [
    'show', `${snapshot.sourceCommit}:content/review-revisions.json`,
  ], {cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8'}));
  assert.deepEqual(previous.display, snapshot.display);
  // Explicit migration: only the newly keyed quick-check fields may differ.
  // Every older prompt, option, teaching field, mesh and identity stays pinned.
  const priorStructures = shoulderBeforeSoftTissueXray(structures);
  for (const structure of priorStructures) {
    const quiz = structure.sections.quiz;
    assert.equal(quiz.bullets?.filter(choice => choice === quiz.correctAnswer).length, 1);
    assert.equal(typeof quiz.explanation, 'string');
    assert(quiz.explanation.trim());
    delete quiz.correctAnswer;
    delete quiz.explanation;
  }
  assert.deepEqual(reviewDocumentForDisplay(manifest, priorStructures, quizQuestions,
    structuredClone(snapshot.display)), previous, 'Only explicit quick-check keys may extend the historical teaching');
  assert.equal(
    hash(JSON.stringify(previous, null, 2) + '\n'),
    snapshot.reviewDocumentSha256,
    'Exact historical document; changed teaching or source must not be hidden',
  );
  return previous;
}
