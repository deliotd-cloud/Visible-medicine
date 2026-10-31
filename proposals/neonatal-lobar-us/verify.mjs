import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { build } from 'file:///F:/VisibleMedicine/atlas/scripts/workspace-test-build.mjs';
const root = 'F:/VisibleMedicine/atlas';
const out = 'G:/VisibleMedicine-temp/proposals/20261031-neonatal-lobar-us';
const file = 'content/cerebral-lobar-imaging.ts';
const hash = value => createHash('sha256').update(value).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const before = { head: git('rev-parse', 'HEAD'), status: git('status', '--porcelain') };
assert.equal(before.head, 'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
assert.equal(before.status, '');
const change = JSON.parse(await readFile(out + '/CHANGE.json'));
assert.equal(hash(await readFile(root + '/' + file)), change.beforeSha256);
assert.equal(hash(await readFile(out + '/' + file)), change.afterSha256);
const loaded = [];
async function load(candidate) {
  const built = await build({ stdin: { contents: "export {nestedStudyTargets} from './lib/nested-anatomy.ts'; export {nestedTeachingFor,nestedTopicLesson,nestedTeachingReferences} from './lib/nested-teaching.ts'; export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'; export {contentTabs} from './lib/content-types.ts'; export {nestedReviewMaterial,nestedReviewRows} from './lib/nested-review-material.ts';", loader: 'ts', resolveDir: root },
    bundle: true, write: false, format: 'esm', platform: 'node', metafile: true,
    plugins: candidate ? [{ name: 'one-reviewed-content-overlay', setup(api) {
      api.onLoad({ filter: /cerebral-lobar-imaging\.ts$/, namespace: 'workspace-test' }, async args => {
        assert.equal(args.path.replaceAll('\\', '/').toLowerCase(), (root + '/' + file).toLowerCase());
        return { contents: await readFile(out + '/' + file, 'utf8'), loader: 'ts', resolveDir: dirname(args.path) };
      });
    }}] : [] });
  loaded.push({ candidate, bundleSha256: hash(built.outputFiles[0].text), inputs: Object.keys(built.metafile.inputs) });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
}
const baseline = await load(false), candidate = await load(true);
const raw = JSON.parse(await readFile(root + '/public/models/bodyparts3d/full-body/catalog.json'));
const catalog = baseline.bodyDisplayCatalog(raw), targets = baseline.nestedStudyTargets(catalog);
assert.equal(targets.length, 108);
assert.deepEqual(candidate.nestedStudyTargets(candidate.bodyDisplayCatalog(raw)), targets);
const expected = new Set(['FMA72970', 'FMA72969', 'FMA72974', 'FMA72973']);
const changed = [], totals = { draft: 0, pending: 0 }, unchangedTopics = [];
const newRefs = ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'];
const priorRefs = Object.fromEntries(Object.entries(candidate.nestedTeachingReferences).filter(([key]) => !newRefs.includes(key)));
assert.deepEqual(priorRefs, baseline.nestedTeachingReferences);
for (const t of targets) {
  const parent = catalog.structures.find(s => s.id === t.parentId);
  const b = baseline.nestedTeachingFor(parent, t.study, t.structure);
  const c = candidate.nestedTeachingFor(parent, t.study, t.structure);
  assert(b && c);
  const isNew = expected.has(t.structure.fmaId) && t.study === 'cerebral';
  const withoutAddition = structuredClone(c);
  if (isNew) delete withoutAddition.imaging.ultrasound;
  assert.deepEqual(withoutAddition, b, 'All other concept fields unchanged: ' + t.structure.id);
  for (const topic of baseline.contentTabs) {
    const bl = baseline.nestedTopicLesson(b, topic), cl = candidate.nestedTopicLesson(c, topic);
    totals[cl.readiness] = (totals[cl.readiness] ?? 0) + 1;
    if (isNew && topic === 'ultrasound') {
      assert.equal(bl.readiness, 'pending'); assert.equal(cl.readiness, 'draft');
      assert.equal(cl.citations.length, 2);
      assert.match(cl.body, /^Neonatal orientation:/);
      assert.match(cl.body, /not a neonatal segmentation/);
      assert.match(cl.body, /anterior fontanelle/);
      assert.match(cl.note, /specialist review pending/);
      assert.match(cl.note, /No scan access or synchronization/);
      assert.deepEqual(cl.citations, newRefs.map(key => candidate.nestedTeachingReferences[key].url));
      changed.push({ id: t.structure.id, fmaId: t.structure.fmaId, sourceHash: t.sourceHash, concept: c.id, topic });
    } else {
      assert.deepEqual(cl, bl, t.structure.id + '/' + topic);
      unchangedTopics.push(t.structure.id + '/' + topic);
    }
  }
  if (isNew) {
    const group = candidate.nestedReviewRows.find(row => row.study === t.study && row.parentId === t.parentId);
    const bp = await baseline.nestedReviewMaterial(group.key, t.structure.id);
    const cp = await candidate.nestedReviewMaterial(group.key, t.structure.id);
    assert.notEqual(cp.context.teachingHash, bp.context.teachingHash, 'New teaching must invalidate old teaching sign-off');
    assert.equal(cp.context.sourceHash, bp.context.sourceHash, 'Geometry identity unchanged');
    assert.equal(cp.context.revisions.imaging, null, 'No scan correspondence invented');
    assert(cp.context.blockers.imaging.length > 0);
    for (const mutate of [s => { s.fmaId = 'FMA0'; }, s => { s.laterality = 'unspecified'; }, s => { s.sources[0].sha256 = '0'.repeat(64); }]) {
      const stale = structuredClone(t.structure); mutate(stale);
      assert.equal(candidate.nestedTeachingFor(parent, t.study, stale), null);
    }
  }
}
assert.equal(changed.length, 4); assert.equal(unchangedTopics.length, 968);
assert.deepEqual(totals, { draft: 725, pending: 247 });
const sourceHashes = {};
for (const input of new Set(loaded.flatMap(x => x.inputs))) {
  if (!input.startsWith('workspace-test:')) continue;
  // esbuild appends import-attribute metadata to JSON input keys; it is not
  // part of the source path. Preserve the complete key in the bundle metadata.
  const path = input.slice('workspace-test:'.length).replace(/ with \{ type: 'json' \}$/, '');
  sourceHashes[path.replaceAll('\\', '/')] = hash(await readFile(path));
}
const after = { head: git('rev-parse', 'HEAD'), status: git('status', '--porcelain') };
assert.deepEqual(after, before);
const result = { at: new Date().toISOString(), passed: true, before, after, content: change, sourceHashes, loaded: loaded.map(({ inputs, ...entry }) => entry),
  assertions: { changedPlacements: 4, unchangedPlacements: 968, sourceTargetsUnchanged: 108, staleIdentityRejections: 12, teachingRevisionChanges: 4, scanBindingsInvented: 0 },
  changed, candidateTotals: totals, installed: false, canonicalModified: false, clinicalApproval: false, fullSuitePassing: false };
await writeFile(out + '/VERIFIED.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ passed: result.passed, assertions: result.assertions, candidateTotals: totals, canonicalModified: false }));
