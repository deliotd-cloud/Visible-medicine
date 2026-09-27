import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('learner and review deliver Reset separation correction without restoring removed anatomy', () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));
  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));
  assert.equal(review.revision, '5ef14b7fc7d06d998884b6e027e60f3349113acc');
  assert.equal(learner.sourceCommit, review.revision);
  const entry = review.files.find((f: any) => f.path === 'app/body-explorer.tsx');
  assert.equal(entry.sourceSha256, 'd48fba0a93e73bd9362cecb26c95a5ef8e3d21babdd20fcac622cca7e735c325');
  assert.equal(inputs.find((f: any) => f.path === entry.path)?.sha256, entry.sourceSha256);
  const source = readFileSync('atlas-review/' + entry.path, 'utf8');
  assert.equal(createHash('sha256').update(source).digest('hex'), entry.importedSha256);
  const handler = source.match(/function resetView\(\) \{([\s\S]*?)\n  \}/)?.[1];
  assert(handler);
  for (const setter of ['setShowOrigins', 'setAnchorSkeleton']) assert(handler.includes(setter + '(false)'));
  assert(handler.includes('setRegionalFraming(true)'));
  assert(handler.includes('setExplode(0)'));
  assert.doesNotMatch(handler, /\b(?:setSystems|setDissection|setSelected|setSide|setIllustrated|dispatchDissection)\(/);
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'imagingConnection', 'standaloneReviewConnection']) assert.equal(learner[flag], false);
});
