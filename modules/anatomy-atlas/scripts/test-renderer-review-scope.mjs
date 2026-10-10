import assert from 'node:assert/strict';
import { dirname } from 'node:path';
import { build } from './workspace-test-build.mjs';

// Compare actual public review contexts with only their renderer revision
// substituted. No patient material, decisions, accounts or stores are loaded.
async function load(previous) {
  const result = await build({
    stdin: {
      contents: `export * from './lib/body-review-material';
        export * from './lib/body-review-context';
        export * from './lib/nested-review-material';
        export * from './lib/specimen-review-material';`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: previous ? [{
      name: 'previous-renderer-only',
      setup(api) {
        api.onLoad({ filter: /[\\/]content[\\/]body-renderer-revision\.json$/, namespace: 'workspace-test' },
          args => ({ contents: JSON.stringify({ sha256: '0'.repeat(64) }),
            loader: 'json', resolveDir: dirname(args.path) }));
      },
    }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const before = await load(true), after = await load(false);
let root = 0, nested = 0, specimen = 0;
function compareContext(a, b, boundMaterial) {
  assert.notEqual(a.rendererHash, b.rendererHash);
  assert.notEqual(a.revisions.geometry, b.revisions.geometry,
    'previous geometry/display approval must not accept a changed renderer');
  assert.equal(a.sourceHash, b.sourceHash);
  assert.equal(a.teachingHash, b.teachingHash);
  assert.equal(a.revisions.teaching, b.revisions.teaching);
  assert.equal(a.revisions.imaging, null);
  assert.equal(b.revisions.imaging, null);
  assert.deepEqual(a.blockers, b.blockers);
  assert.deepEqual(a.checklists, b.checklists);
  if (boundMaterial) assert.notEqual(a.materialHash, b.materialHash);
  else assert.equal(a.materialHash, b.materialHash);
}
assert.deepEqual(before.bodyReviewSummaries, after.bodyReviewSummaries);
for (const { id } of after.bodyReviewSummaries) {
  const a = await before.bodyReviewMaterial(id), b = await after.bodyReviewMaterial(id);
  assert.deepEqual(a, b, 'renderer changes do not rewrite public source/teaching worksheets');
  compareContext(await before.bodyReviewContext(id), await after.bodyReviewContext(id), false);
  root++;
}
for (const [rows, material, kind] of [
  ['nestedReviewRows', 'nestedReviewMaterial', 'nested'],
  ['specimenReviewRows', 'specimenReviewMaterial', 'specimen'],
]) {
  assert.deepEqual(before[rows], after[rows]);
  for (const group of after[rows]) for (const { id } of group.surfaces) {
    const a = await before[material](group.key, id), b = await after[material](group.key, id);
    assert(a && b);
    compareContext(a.context, b.context, true);
    assert.deepEqual(a.source, b.source);
    assert.deepEqual(a.teaching, b.teaching);
    assert.equal(a.atlasLink, b.atlasLink);
    if (kind === 'nested') nested++; else specimen++;
  }
}
assert(root && nested && specimen);
console.log(JSON.stringify({ passed: true, root, nested, specimen,
  geometryDisplayRevisionsChange: true, teachingAndSourcePreserved: true,
  imagingStillBlocked: true, privateDecisionsReadOrMigrated: false }));
