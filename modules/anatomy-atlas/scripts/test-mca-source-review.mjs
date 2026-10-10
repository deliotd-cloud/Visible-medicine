import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, relative } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = 'bdc245713386d043aad45792a1476ab1af8955b0';
const replacementPaths = ['lib/nested-teaching.ts', 'content/nested-teaching.ts', 'content/body-renderer-revision.json'];
async function load(previous) {
  // Preserve the original MCA transition, not later PICA teaching; its live
  // transition is checked independently in test-pica-source-review.
  const epoch=previous?baseline:'55b0e548c6552de3ef6c4e8f432e71d60690e843';
  const oldFiles = new Map(replacementPaths.map(path => [path,
    execFileSync('git', ['show', `${epoch}:${path}`], {encoding: 'utf8'})]));
  const compiled = await build({stdin: {contents: "export * from './lib/nested-review-material';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: oldFiles ? [{name: 'exact-previous-teaching-and-renderer', setup(b) {
      b.onLoad({filter: /[\\/](?:lib[\\/]nested-teaching\.ts|content[\\/](?:nested-teaching\.ts|body-renderer-revision\.json))$/, namespace: 'workspace-test'}, args => {
        const path = relative(process.cwd(), args.path).replaceAll('\\', '/');
        const contents = oldFiles.get(path);
        assert(contents, 'Unknown historical replacement');
        return {contents, loader: path.endsWith('.json') ? 'json' : 'ts', resolveDir: dirname(args.path)};
      });
    }}] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
const before = await load(true), after = await load(false);
assert.deepEqual(after.nestedReviewRows, before.nestedReviewRows, 'No new selections or renamed source records');
let changed = 0, unchanged = 0, geometryExpired = 0;
for (const group of after.nestedReviewRows) for (const {id} of group.surfaces) {
  const a = await before.nestedReviewMaterial(group.key, id), b = await after.nestedReviewMaterial(group.key, id);
  assert.deepEqual(a.source, b.source, 'Source/provenance/parent/frame stays exact');
  assert.equal(a.atlasLink, b.atlasLink);
  assert.equal(a.context.sourceHash, b.context.sourceHash);
  assert.deepEqual(a.context.checklists, b.context.checklists);
  assert.deepEqual(a.context.blockers.geometry, b.context.blockers.geometry);
  assert.deepEqual(a.context.blockers.imaging, b.context.blockers.imaging);
  assert.equal(b.context.revisions.imaging, null);
  assert.equal(b.context.blockers.imaging.length, 1);
  assert.notEqual(a.context.rendererHash, b.context.rendererHash, 'Current teaching dependency is renderer-bound');
  assert.notEqual(a.context.revisions.geometry, b.context.revisions.geometry, 'Display decisions cannot migrate silently');
  geometryExpired++;
  if (['fma50082-fj1662', 'fma50082-fj1663', 'fma50082-fj1692'].includes(id.split(':').at(-1))) {
    assert.equal(a.teaching.concept, null);
    assert.equal(b.teaching.concept.id, 'mca-source-' + b.source.structure.sources[0].file.toLowerCase());
    assert.notEqual(a.context.teachingHash, b.context.teachingHash);
    assert.notEqual(a.context.revisions.teaching, b.context.revisions.teaching);
    assert.deepEqual(b.context.teachingTabs, ['anatomy', 'ct', 'mri', 'self-check']);
    assert.equal(b.context.blockers.teaching.length, 3, 'Pending component identity keeps teaching sign-off blocked');
    assert.deepEqual(a.context.blockers.teaching.slice(1), b.context.blockers.teaching, 'Only the newly authored Anatomy topic leaves pending');
    assert.deepEqual(b.teaching.topics.filter(t => t.readiness === 'pending').map(t => t.tab), ['function', 'xray', 'ultrasound', 'pathology', 'clinical']);
    changed++;
  } else {
    assert.deepEqual(a.context.blockers, b.context.blockers);
    assert.deepEqual(b.teaching, a.teaching);
    assert.equal(b.context.teachingHash, a.context.teachingHash);
    assert.equal(b.context.revisions.teaching, a.context.revisions.teaching);
    unchanged++;
  }
}
assert.equal(changed, 3); assert.equal(unchanged, 105); assert.equal(geometryExpired, 108);
assert.equal(execFileSync('git', ['diff', '--name-only', baseline, '--', 'public/models', 'content/sources', 'content/source-holds.json'], {encoding: 'utf8'}).trim(), '', 'No source assets, models or holds changed');
console.log(JSON.stringify({passed: true, changedTeaching: changed, unchangedTeaching: unchanged, unchangedSource: 108, conservativeDisplayRevisionsExpired: geometryExpired, imagingBlocked: true, clinicalDecisionsReadOrMigrated: false}));
