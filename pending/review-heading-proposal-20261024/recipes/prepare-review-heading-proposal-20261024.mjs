import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { read, json, sha } from './source-only-backup-20261019.mjs';
import { nativeAtlasEnvironment } from './native-atlas-environment-20261022.mjs';
const stage = 'F:/VisibleMedicine/staging/20261024-review-heading-proposal';
const parentReceipt = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/SOURCE_BOUND.json';
assert.equal(sha(read(parentReceipt)), 'b7f04acd1800aa5a01712923159ea26638bdd63f35cb2c9f29ba8ac3ba120c71');
const parent = json(parentReceipt); nativeAtlasEnvironment({ atlas: parent.atlas, revision: parent.atlasHead, tree: parent.atlasTree });
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted, false);
assert(!fs.existsSync(stage));
const files = ['lib/teaching-heading.ts', 'app/body-explorer.tsx', 'app/review/body/review-dashboard.tsx', 'scripts/test-teaching-heading.mjs'];
const rows = [];
for (const file of files) {
  const bytes = read(parent.atlas + '/' + file); assert.equal(sha(bytes), parent.sourceRows.find(row => row.path === file).sha256);
  for (const target of [stage + '/atlas/' + file, stage + '/preimages/' + file + '.raw']) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes, { flag: 'wx' }); }
  rows.push({ path: file, bytes: bytes.length, sha256: sha(bytes) });
}
const state = { at: new Date().toISOString(), kind: 'partial-presentation-only-proposal', stage, atlas: stage + '/atlas', parentReceipt, parentReceiptSha256: sha(read(parentReceipt)), parentAtlas: parent.atlas, parentHead: parent.atlasHead, parentTree: parent.atlasTree, rows, observed: 'Learner formats its visible heading with the existing teachingHeading; BodyReviewDetails currently renders raw topic.title. Reuse the same formatter in Review only; canonical teaching/worksheets remain unchanged.', noNewDependencyOrAsset: true, previewChanged: false, installed: false, clinicalApproval: false };
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify(state, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ preparation: stage + '/PREPARATION.json', sha256: sha(read(stage + '/PREPARATION.json')), paths: rows.length, parent: parent.atlasHead }));
