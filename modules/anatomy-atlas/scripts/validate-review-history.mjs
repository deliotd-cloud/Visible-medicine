import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { structures, quizQuestions } from '../app/anatomy-data.ts';
import { currentReviewDocument } from './review-revision-evidence.mjs';
import { reviewDocumentBeforeWebsitePilot } from './review-website-history.mjs';
import snapshot from './fixtures/review-display-before-website-pilot.json' with { type: 'json' };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(
  await readFile(
    new URL('public/models/bodyparts3d/manifest.json', root),
    'utf8',
  ),
);
const current = JSON.parse(
  await readFile(new URL('content/review-revisions.json', root), 'utf8'),
);
const encoded = JSON.stringify(current);
assert.deepEqual(
  await currentReviewDocument(manifest, structures, quizQuestions),
  current,
);
const historical = await reviewDocumentBeforeWebsitePilot(
  current,
  manifest,
  structures,
);
assert.equal(
  hash(JSON.stringify(historical, null, 2) + '\n'),
  snapshot.reviewDocumentSha256,
);
for (const s of structures) {
  assert.notEqual(
    historical.revisions[s.id].geometry,
    current.revisions[s.id].geometry,
  );
  assert.equal(
    historical.revisions[s.id].teaching,
    current.revisions[s.id].teaching,
  );
  assert.equal(historical.revisions[s.id].imaging, null);
}
let rejections = 0;
const id = structures[0].id;
for (const mutate of [
  (r) => {
    r.schemaVersion = 0;
  },
  (r) => {
    r.modelHash = '0'.repeat(64);
  },
  (r) => {
    r.display.pop();
  },
  (r) => {
    r.display.push(r.display[0]);
  },
  (r) => {
    r.display.reverse();
  },
  (r) => {
    r.display[0][1] = '0'.repeat(64);
  },
  (r) => {
    r.display[0][0] = 'app/unknown-display.tsx';
  },
  (r) => {
    r.revisions[id].geometry = historical.revisions[id].geometry;
  },
  (r) => {
    r.revisions[id].teaching = '0'.repeat(64);
  },
  (r) => {
    r.revisions[id].imaging = '0'.repeat(64);
  },
  (r) => {
    delete r.revisions[id];
  },
  (r) => {
    r.revisions[id].approved = true;
  },
]) {
  const changed = structuredClone(current);
  mutate(changed);
  await assert.rejects(
    reviewDocumentBeforeWebsitePilot(changed, manifest, structures),
  );
  rejections++;
}
// Even internally consistent new evidence must not be rewritten as old teaching.
for (const field of ['name', 'latinName', 'sections']) {
  const changed = structuredClone(structures);
  if (field === 'sections')
    changed[0].sections.anatomy = {
      ...changed[0].sections.anatomy,
      title: 'Changed teaching',
    };
  else changed[0][field] += ' changed';
  const recomputed = await currentReviewDocument(
    manifest,
    changed,
    quizQuestions,
  );
  await assert.rejects(
    reviewDocumentBeforeWebsitePilot(recomputed, manifest, changed),
  );
  rejections++;
}
const changedManifest = { ...manifest, unreviewedMetadata: true };
const recomputed = await currentReviewDocument(
  changedManifest,
  structures,
  quizQuestions,
);
await assert.rejects(
  reviewDocumentBeforeWebsitePilot(recomputed, changedManifest, structures),
);
rejections++;
historical.display[0][1] = 'modified caller copy';
assert.equal(
  hash(
    JSON.stringify(
      await reviewDocumentBeforeWebsitePilot(current, manifest, structures),
      null,
      2,
    ) + '\n',
  ),
  snapshot.reviewDocumentSha256,
);
assert.equal(
  JSON.stringify(current),
  encoded,
  'No mutation of current evidence',
);
if (process.argv.includes('--verify-source')) {
  const original = JSON.parse(
    execFileSync(
      'git',
      ['show', snapshot.sourceCommit + ':content/review-revisions.json'],
      { encoding: 'utf8' },
    ),
  );
  assert.deepEqual(original.display, snapshot.display);
  assert.equal(
    hash(JSON.stringify(original, null, 2) + '\n'),
    snapshot.reviewDocumentSha256,
  );
}
console.log(
  JSON.stringify({
    currentDisplayInputs: current.display.length,
    historicalDisplayInputs: snapshot.display.length,
    structures: structures.length,
    rejectedMutations: rejections,
    currentEvidenceUnchanged: true,
    privateReviewsTouched: false,
  }),
);
