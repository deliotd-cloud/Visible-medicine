import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { structures } from '../app/anatomy-data.ts';
import { shoulderSoftTissueXrayLesson } from '../lib/shoulder-soft-tissue-xray.ts';
import { shoulderBeforeSoftTissueXray } from './shoulder-soft-tissue-xray-history.mjs';
import { currentReviewDocument } from './review-revision-evidence.mjs';
import { quizQuestions } from '../app/anatomy-data.ts';
import manifest from '../public/models/bodyparts3d/manifest.json' with { type: 'json' };
import transition from '../content/shoulder-soft-tissue-xray-transition.json' with { type: 'json' };
test('exact parent comparison preserves every other shoulder field', () => {
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/record-shoulder-soft-tissue-xray.mjs', '--check']);
});
test('all six lessons are distinct, draft, referenced, and detached', () => {
  const bodies = new Set();
  for (const entry of transition.entries) {
    const structure = structures.find(s => s.id === entry.id);
    const key = structure.id.split(':').at(-1);
    const lesson = shoulderSoftTissueXrayLesson(key);
    assert.deepEqual(lesson, structure.sections.xray);
    assert.equal(lesson.readiness, 'draft');
    assert.match(lesson.title, /X-ray/);
    assert.match(lesson.note, /sign-off pending/);
    assert.match(lesson.note, /access remain independent/);
    assert(lesson.citations.every(url => url.startsWith('https://')));
    assert(lesson.citations.length >= 2);
    assert.equal(lesson.bullets.length, 3);
    bodies.add(lesson.body);
    lesson.bullets[0] = 'mutated'; lesson.citations.length = 0;
    assert.deepEqual(shoulderSoftTissueXrayLesson(key), structure.sections.xray);
  }
  assert.equal(bodies.size, 6);
});
test('history rejects unrecorded and mixed edits, without mutating current teaching', () => {
  const saved = JSON.stringify(structures);
  const before = shoulderBeforeSoftTissueXray(structures);
  assert.deepEqual(shoulderBeforeSoftTissueXray(before), before);
  const altered = structuredClone(structures);
  altered[3].sections.xray.body += ' Unreviewed';
  assert.throws(() => shoulderBeforeSoftTissueXray(altered), /Unrecorded/);
  const mixed = structuredClone(structures);
  mixed[3].sections.xray = before[3].sections.xray;
  assert.throws(() => shoulderBeforeSoftTissueXray(mixed), /Mixed/);
  assert.equal(JSON.stringify(structures), saved);
});
test('only six teaching fingerprints change; geometry and imaging remain unchanged', async () => {
  const old = JSON.parse(execFileSync('git', ['show', `${transition.parentCommit}:content/review-revisions.json`], {encoding:'utf8'}));
  const now = await currentReviewDocument(manifest, structures, quizQuestions);
  const changed = new Set(transition.entries.map(e => e.id));
  assert.deepEqual(now.display, old.display);
  for (const s of structures) {
    assert.equal(now.revisions[s.id].geometry, old.revisions[s.id].geometry);
    assert.equal(now.revisions[s.id].imaging, old.revisions[s.id].imaging);
    if(changed.has(s.id)) assert.notEqual(now.revisions[s.id].teaching, old.revisions[s.id].teaching);
    else assert.equal(now.revisions[s.id].teaching, old.revisions[s.id].teaching);
  }
});
