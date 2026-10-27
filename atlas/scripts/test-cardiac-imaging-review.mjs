import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { build } from './workspace-test-build.mjs';

const root = new URL('../', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, '');
const baseline = '7181b153132b55a682ddbe6558f5dca181643bf0';
const old = path => execFileSync('git', ['--no-replace-objects', 'show', `${baseline}:${path}`],
  { cwd: root, maxBuffer: 32e6, windowsHide: true }).toString('utf8');
async function load(previous) {
  const contents = "export * from './lib/nested-review-material'; export * from './lib/nested-review-api'; export * from './lib/nested-review';";
  const built = await build({ stdin: { contents, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: previous ? [{ name: 'exact-parent-cardiac-teaching', setup(api) {
      api.onLoad({ filter: /cardiac-teaching\.ts$/ }, args => ({
        contents: old('content/cardiac-teaching.ts'), loader: 'ts', resolveDir: dirname(args.path),
      }));
    } }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
}
const [now, before] = await Promise.all([load(false), load(true)]);
assert.deepEqual(now.nestedReviewRows, before.nestedReviewRows);
const plain = value => JSON.parse(JSON.stringify(value));
const newUrl = 'https://www.asecho.org/wp-content/uploads/2026/08/ASE-Right-Heart-Guidelines-May-2025.pdf';
const rejectedStorage = new Proxy({}, { get() { throw Error('Stale request reached storage'); } });
const request = payload => new Request('https://review.test/api/nested-review', {
  method: 'POST', headers: { origin: 'https://review.test', 'content-type': 'application/json',
    'oai-authenticated-user-id': 'SYNTHETIC_CARDIAC_IMAGING_TEST' }, body: JSON.stringify(payload),
});
let contexts = 0, changed = 0, unchanged = 0, refusals = 0;
for (const group of now.nestedReviewRows) for (const row of group.surfaces) {
  const current = await now.nestedReviewMaterial(group.key, row.id);
  const previous = await before.nestedReviewMaterial(group.key, row.id);
  assert(current && previous);
  contexts++;
  const c = current.context, p = previous.context;
  assert.deepEqual(current.source, previous.source);
  assert.deepEqual(current.atlasLink, previous.atlasLink);
  assert.equal(c.sourceHash, p.sourceHash);
  assert.equal(c.sourceFrame, p.sourceFrame);
  assert.equal(c.revisions.imaging, null);
  assert.deepEqual(c.checklists, p.checklists);
  assert.deepEqual(c.blockers, p.blockers);
  assert.deepEqual(c.teachingTabs, p.teachingTabs);
  if (group.study !== 'cardiac') {
    unchanged++;
    assert.deepEqual(current.teaching, previous.teaching, `${group.key}/${row.id} other teaching exact`);
    assert.equal(c.teachingHash, p.teachingHash);
    assert.equal(c.revisions.teaching, p.revisions.teaching);
    continue;
  }
  changed++;
  assert.notEqual(c.teachingHash, p.teachingHash);
  assert.notEqual(c.revisions.teaching, p.revisions.teaching);
  assert.notEqual(c.materialHash, p.materialHash);
  assert.equal(c.revisions.geometry, p.revisions.geometry);
  const projected = plain(current.teaching);
  const prior = plain(previous.teaching);
  for (const tab of ['mri', 'ultrasound']) {
    const actual = projected.topics.find(t => t.tab === tab);
    const original = prior.topics.find(t => t.tab === tab);
    if (tab === 'mri' || current.teaching.concept.id.startsWith('cardiac-right-')) {
      assert.equal(actual.readiness, 'draft');
      assert.notEqual(actual.body, original.body);
      Object.assign(actual, original);
    }
  }
  for (const modality of ['mri', 'ultrasound']) {
    const oldSection = prior.concept.imaging?.[modality];
    const newSection = projected.concept.imaging?.[modality];
    if (oldSection && newSection && JSON.stringify(oldSection) !== JSON.stringify(newSection))
      projected.concept.imaging[modality] = oldSection;
  }
  delete projected.referenceTitles[newUrl];
  assert.deepEqual(projected, prior, 'Only selected MRI and right-heart ultrasound teaching changes');
  const isRight = current.teaching.concept.id.startsWith('cardiac-right-');
  assert.equal(Object.hasOwn(current.teaching.referenceTitles, newUrl), isRight);
  const draft = now.blankNestedReview(c, 'teaching');
  assert.equal(draft.status, 'draft');
  assert.equal(draft.attested, false);
  const payload = { catalogScope: c.catalogScope, nestedKey: c.nestedKey, structureId: row.id,
    sourceFrame: c.sourceFrame, materialHash: c.materialHash,
    revisionHash: p.revisions.teaching, checklistVersion: c.checklistVersion,
    track: 'teaching', expectedVersion: 0, draft };
  const response = await now.postNestedReview(request(payload), rejectedStorage);
  assert.equal(response.status, 409, 'old teaching revision rejected before storage');
  refusals++;
}
assert.deepEqual({ changed, refusals }, { changed: 4, refusals: 4 });
assert.equal(contexts, changed + unchanged);
console.log(JSON.stringify({ baseline, contexts, changed, unchanged, staleRefusals: refusals, approval: false }));
