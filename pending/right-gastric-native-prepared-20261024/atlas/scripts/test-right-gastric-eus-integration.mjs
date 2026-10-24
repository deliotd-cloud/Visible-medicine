import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = '6e810b188dde401f6c19a970928f316a479696df';
const old = await exactSourceHistoryApi(baseline, 'abdominal-eus-epoch');
const compiled = await build({
  stdin: {
    contents: "export {abdominalEusOrientationLesson} from './lib/abdominal-eus-orientation';export {abdominalEusTopics} from './content/abdominal-eus-orientation';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';",
    resolveDir: root, loader: 'ts',
  }, bundle: true, write: false, platform: 'node', format: 'esm',
});
const live = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(readFileSync(resolve(root, 'public/models/bodyparts3d/full-body/catalog.json'), 'utf8'));
const catalog = live.bodyDisplayCatalog(raw);
const targetId = 'vm:anatomy:body:abdomen:right:vessel:right-gastric-vein';
const targets = catalog.structures.filter(s => s.id === targetId && s.fmaId === 'FMA15400');
assert.equal(targets.length, 1);
const target = targets[0];
const gitBytes = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  cwd: root, windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});

test('one of 9936 root lessons changes pending to draft; geometry and all other display copy stay exact', () => {
  assert.deepEqual(catalog, old.bodyDisplayCatalog(structuredClone(raw)));
  assert.equal(catalog.structures.length, 1104);
  assert.equal(live.contentTabs.length, 9);
  for (const key of ['structures', 'dissectionProfiles', 'regionalTours', 'contentTabs'])
    assert.deepEqual(live[key], old[key], key);
  let changed = 0, preserved = 0;
  for (const s of catalog.structures) for (const tab of live.contentTabs) {
    if (s.id === targetId && tab === 'ultrasound') {
      assert.equal(old.bodyLesson(s, tab).readiness, 'pending');
      const lesson = live.abdominalEusOrientationLesson(s, tab);
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(live.bodyLesson(s, tab), lesson);
      const { readiness, ...display } = lesson;
      assert.deepEqual(live.bodyContent(s, tab), display);
      changed++;
    } else {
      if (!['FMA76574', 'FMA15391', 'FMA14768'].includes(s.fmaId))
        assert.equal(live.abdominalEusOrientationLesson(s, tab), undefined, s.id + ':' + tab);
      assert.deepEqual(live.bodyLesson(s, tab), old.bodyLesson(s, tab), s.id + ':' + tab);
      assert.deepEqual(live.bodyContent(s, tab), old.bodyContent(s, tab), s.id + ':' + tab + ':display');
      preserved++;
    }
  }
  assert.equal(changed, 1);
  assert.equal(preserved, 9935);
});

test('all three earlier EUS topic records and their lessons remain parent-identical', () => {
  for (const fmaId of ['FMA76574', 'FMA15391', 'FMA14768']) {
    assert.deepEqual(live.abdominalEusTopics[fmaId], old.abdominalEusTopics[fmaId]);
    const matches = catalog.structures.filter(s => s.fmaId === fmaId);
    assert.equal(matches.length, 1);
    for (const tab of live.contentTabs)
      assert.deepEqual(live.abdominalEusOrientationLesson(matches[0], tab), old.abdominalEusOrientationLesson(matches[0], tab), fmaId + ':' + tab);
  }
  assert.deepEqual(Object.keys(live.abdominalEusTopics).sort(), [...Object.keys(old.abdominalEusTopics), 'FMA15400'].sort());
});

test('only the intended worksheet teaching fingerprint, topic and material hash change among 1104', async () => {
  let changed = 0;
  for (const s of catalog.structures) {
    const a = await old.bodyReviewMaterial(s.id), b = await live.bodyReviewMaterial(s.id);
    assert.equal(b.approval, false);
    assert.equal(b.status, 'worksheet-not-submitted');
    for (const key of ['source', 'checklist', 'reasoning', 'guidedTours'])
      assert.deepEqual(b[key], a[key], s.id + ':' + key);
    for (const key of ['source', 'checklist'])
      assert.equal(b.fingerprints[key], a.fingerprints[key], s.id + ':fingerprint:' + key);
    if (s.id === targetId) {
      assert.notEqual(b.fingerprints.teaching, a.fingerprints.teaching);
      assert.notEqual(b.materialHash, a.materialHash);
      assert.equal(b.topics.length, a.topics.length);
      for (const topic of b.topics) {
        const previous = a.topics.find(t => t.tab === topic.tab);
        if (topic.tab === 'ultrasound') {
          assert.equal(previous.readiness, 'pending');
          assert.equal(topic.readiness, 'draft');
          assert.notDeepEqual(topic, previous);
        } else assert.deepEqual(topic, previous, topic.tab);
      }
      changed++;
    } else assert.deepEqual(b, a, s.id);
  }
  assert.equal(changed, 1);
});

test('only current target packet parses; historical and forged packets are refused', async () => {
  const previous = await old.bodyReviewMaterial(targetId);
  const current = await live.bodyReviewMaterial(targetId);
  assert(await live.parseBodyReviewResponse(current, targetId));
  assert.equal(await live.parseBodyReviewResponse(previous, targetId), null);
  for (const mutate of [
    p => p.topics.find(t => t.tab === 'ultrasound').body += ' foreign',
    p => p.topics.find(t => t.tab === 'ultrasound').readiness = 'approved',
    p => p.topics.find(t => t.tab === 'ultrasound').citations[0] = 'javascript:invalid',
    p => p.materialHash = previous.materialHash,
    p => p.fingerprints.source = 'forged-source',
  ]) {
    const forged = structuredClone(current);
    mutate(forged);
    assert.equal(await live.parseBodyReviewResponse(forged, targetId), null);
  }
});

test('foreign-source geometry or stale teaching/material hashes return 409 before storage', async () => {
  const previous = await old.bodyReviewContext(targetId);
  const current = await live.bodyReviewContext(targetId);
  assert.equal(current.sourceHash, previous.sourceHash);
  assert.notEqual(current.teachingHash, previous.teachingHash);
  assert.notEqual(current.materialHash, previous.materialHash);
  const renderer = JSON.parse(readFileSync(resolve(root, 'content/body-renderer-revision.json'), 'utf8'));
  assert.equal(current.rendererHash, renderer.sha256);
  const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const expectedGeometry = context => hash({
    catalogScope: context.catalogScope, structureId: context.structureId,
    checklistVersion: context.checklistVersion, source: context.sourceHash,
    renderer: context.rendererHash, checks: context.checklists.geometry,
  });
  assert.equal(current.revisions.geometry, expectedGeometry(current));
  assert.equal(previous.revisions.geometry, expectedGeometry(previous));
  if (current.rendererHash !== previous.rendererHash)
    assert.notEqual(current.revisions.geometry, previous.revisions.geometry, 'Fresh renderer cannot inherit old display approval');
  else assert.equal(current.revisions.geometry, previous.revisions.geometry);
  const foreign = await live.bodyReviewContext(catalog.structures.find(s => s.id !== targetId).id);
  assert.notEqual(foreign.sourceHash, current.sourceHash);
  assert.match(foreign.revisions.geometry, /^[a-f0-9]{64}$/);
  assert.notEqual(foreign.revisions.geometry, current.revisions.geometry);
  assert.notEqual(current.revisions.teaching, previous.revisions.teaching);
  const base = {
    catalogScope: current.catalogScope, structureId: targetId, track: 'teaching',
    expectedVersion: 0, materialHash: current.materialHash,
    revisionHash: current.revisions.teaching, checklistVersion: current.checklistVersion,
    draft: live.blankBodyReview(current, 'teaching'),
  };
  let calls = 0;
  const db = { prepare() { calls++; throw Error('Stale request reached storage'); } };
  for (const [label, change] of [
    ['foreign-source-geometry', b => {
      b.track = 'geometry'; b.revisionHash = foreign.revisions.geometry;
      b.draft = live.blankBodyReview(current, 'geometry');
    }],
    ['teaching', b => b.revisionHash = previous.revisions.teaching],
    ['material', b => b.materialHash = previous.materialHash],
  ]) {
    const body = structuredClone(base); change(body);
    const response = await live.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions', {
      method: 'POST', headers: {
        'content-type': 'application/json',
        'oai-authenticated-user-id': 'synthetic-reviewer', origin: 'https://atlas.example',
      }, body: JSON.stringify(body),
    }), db);
    assert.equal(response.status, 409, label);
    assert.equal(calls, 0, label);
  }
});

test('source-only dependency, dispatch, pin, catalog and previous notice bytes stay unchanged', () => {
  for (const path of [
    'app/body-content.ts', 'package-lock.json',
    'content/abdominal-branch-imaging-pins.json',
    'content/central-vessel-imaging-pins.json',
    'public/models/bodyparts3d/full-body/catalog.json',
  ]) assert(readFileSync(resolve(root, path)).equals(gitBytes(path)), path);
  const notice = readFileSync(resolve(root, 'LICENSES/THIRD_PARTY_NOTICES.md'));
  const before = gitBytes('LICENSES/THIRD_PARTY_NOTICES.md');
  assert(notice.subarray(0, before.length).equals(before));
});
