import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = 'b8ec59eeb0ec554b86d7ce01be992967e203b6a5';
const parent = 'F:/VisibleMedicine/staging/20261024-toolbar-button-contrast/atlas';
const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({stdin: {
  contents: "export {bodyPancreaticVenousUsLesson} from './lib/body-pancreatic-venous-us';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';",
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, write: false, platform: 'node', format: 'esm'});
const live = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = live.bodyDisplayCatalog(raw);
const targets = catalog.structures.filter(s => s.fmaId === 'FMA15398');
assert.equal(targets.length, 1);
const id = targets[0].id;

test('one of9936 root-body placements changes from pending to draft; every other placement and source stays exact', () => {
  assert.deepEqual(catalog, old.bodyDisplayCatalog(structuredClone(raw)));
  assert.equal(catalog.structures.length, 1104); assert.equal(live.contentTabs.length, 9);
  let changed = 0, preserved = 0;
  for (const s of catalog.structures) for (const tab of live.contentTabs) {
    if (s.id === id && tab === 'ultrasound') {
      const lesson = live.bodyPancreaticVenousUsLesson(s, tab);
      assert.equal(old.bodyLesson(s, tab).readiness, 'pending');
      assert.equal(lesson.readiness, 'draft'); assert.deepEqual(live.bodyLesson(s, tab), lesson);
      const {readiness, ...display} = lesson; assert.deepEqual(live.bodyContent(s, tab), display); changed++;
    } else {
      assert.equal(live.bodyPancreaticVenousUsLesson(s, tab), undefined);
      assert.deepEqual(live.bodyLesson(s, tab), old.bodyLesson(s, tab), s.id + ':' + tab);
      assert.deepEqual(live.bodyContent(s, tab), old.bodyContent(s, tab), s.id + ':' + tab + ':display'); preserved++;
    }
  }
  assert.equal(changed, 1); assert.equal(preserved, 9935);
  for (const key of ['structures', 'dissectionProfiles', 'regionalTours', 'contentTabs']) assert.deepEqual(live[key], old[key]);
});

test('only one teaching fingerprint changes; all1104 worksheet sources, checklists, reasoning, tours and approval states survive', async () => {
  let changed = 0;
  for (const s of catalog.structures) {
    const a = await old.bodyReviewMaterial(s.id), b = await live.bodyReviewMaterial(s.id);
    assert.equal(b.approval, false); assert.equal(b.status, 'worksheet-not-submitted');
    for (const key of ['source', 'checklist', 'reasoning', 'guidedTours']) assert.deepEqual(b[key], a[key], s.id + ':' + key);
    for (const key of ['source', 'checklist']) assert.equal(b.fingerprints[key], a.fingerprints[key]);
    if (s.id === id) {
      assert.notEqual(b.fingerprints.teaching, a.fingerprints.teaching); assert.notEqual(b.materialHash, a.materialHash);
      for (const topic of b.topics) {
        const before = a.topics.find(t => t.tab === topic.tab);
        if (topic.tab === 'ultrasound') assert.notDeepEqual(topic, before); else assert.deepEqual(topic, before);
      }
      changed++;
    } else assert.deepEqual(b, a, s.id);
  }
  assert.equal(changed, 1);
});

test('stale or forged pancreatic teaching packets cannot acquire current clinical evidence or reach decision storage', async () => {
  const a = await old.bodyReviewMaterial(id), b = await live.bodyReviewMaterial(id);
  assert(await live.parseBodyReviewResponse(b, id)); assert.equal(await live.parseBodyReviewResponse(a, id), null);
  for (const mutate of [
    p => p.topics.find(t => t.tab === 'ultrasound').body += ' foreign',
    p => p.topics.find(t => t.tab === 'ultrasound').readiness = 'approved',
    p => p.topics.find(t => t.tab === 'ultrasound').citations[0] = 'javascript:invalid',
  ]) {
    const value = structuredClone(b); mutate(value); assert.equal(await live.parseBodyReviewResponse(value, id), null);
  }
  const context = await old.bodyReviewContext(id);
  const body = {catalogScope: context.catalogScope, structureId: id, track: 'teaching', expectedVersion: 0,
    materialHash: context.materialHash, revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
    draft: live.blankBodyReview(context, 'teaching')};
  let calls = 0;
  const response = await live.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions', {
    method: 'POST', headers: {'content-type': 'application/json', 'oai-authenticated-user-id': 'synthetic-reviewer', origin: 'https://atlas.example'}, body: JSON.stringify(body),
  }), {prepare() {calls++; throw Error('Stale teaching reached storage');}});
  assert.equal(response.status, 409); assert.equal(calls, 0);
});

test('all prior dispatch/package/notice bytes reconstruct and existing model/dependency/source metadata stays unchanged', () => {
  let resolver = readFileSync('app/body-content.ts', 'utf8');
  for (const seam of ["import { bodyPancreaticVenousUsLesson } from '../lib/body-pancreatic-venous-us';\n", '  const pancreaticVenousUs = bodyPancreaticVenousUsLesson(s, tab);\n  if (pancreaticVenousUs) return pancreaticVenousUs;\n']) {
    assert.equal(resolver.split(seam).length, 2); resolver = resolver.replace(seam, '');
  }
  assert.equal(resolver, readFileSync(parent + '/app/body-content.ts', 'utf8'));
  const pkg = readFileSync('package.json', 'utf8');
  const seam = '    "pancreatic-venous-us:test": "node --test scripts/test-pancreatic-venous-us-unit.mjs && node scripts/test-body-pancreatic-venous-us.mjs && node --test scripts/test-pancreatic-venous-us-cohort.mjs",\n';
  assert.equal(pkg.split(seam).length, 2); assert.equal(pkg.replace(seam, ''), readFileSync(parent + '/package.json', 'utf8'));
  const notice = readFileSync('LICENSES/THIRD_PARTY_NOTICES.md'), priorNotice = readFileSync(parent + '/LICENSES/THIRD_PARTY_NOTICES.md');
  assert(notice.subarray(0, priorNotice.length).equals(priorNotice));
  assert.match(notice.subarray(priorNotice.length).toString(), /^\n## Pancreatic venous ultrasound orientation/);
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  for (const p of ['package-lock.json', 'content/abdominal-branch-imaging-pins.json', 'public/models/bodyparts3d/full-body/catalog.json', 'content/review-revisions.json'])
    assert.equal(sha(readFileSync(p)), sha(readFileSync(parent + '/' + p)), p);
});
