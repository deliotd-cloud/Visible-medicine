import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('learner and review deliver Reset separation correction without restoring removed anatomy', () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));
  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));
  assert.equal(review.revision, '971f12ceedc8316904bdc7da810262bb993362f9');
  assert.equal(learner.sourceCommit,'971f12ceedc8316904bdc7da810262bb993362f9');
  const entry = review.files.find((f: any) => f.path === 'app/body-explorer.tsx');
  assert.equal(entry.sourceSha256, 'd6e7ebbe87a4325a84d3a0241b788edcf23e6dae7ec6e3c3f6c15875abf6ad57');
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
