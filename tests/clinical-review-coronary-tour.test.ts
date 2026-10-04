import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { atlasExactGitApi } from './atlas-exact-git-api.mjs';

const sourceDir = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const sourceCommit = 'c52c9c690d790e4e921bde7ed5a943ef30a95001';
const previousWebsite = '77ac93cd45a6b7195f37b9122e7a526f6d547acd';
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const source = (path: string) => execFileSync('git', ['show', `${sourceCommit}:${path}`], {
  cwd: sourceDir, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
  maxBuffer: 32e6,
});
const entry = `
export * from './atlas-review/lib/regional-tours';
export * from './atlas-review/lib/body-review-material';
export * from './atlas-review/lib/body-review-context';
export * from './atlas-review/lib/body-review-response';
export * from './atlas-review/lib/body-review-decisions';
export * from './atlas-review/lib/body-review-api';
import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
import { bodyDisplayCatalog } from './atlas-review/lib/body-display-catalog';
export const catalog = bodyDisplayCatalog(raw as any);
`;

test('saved coronary tour reaches all five revision-bound Clinical Review materials', async () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  assert.equal(review.revision, sourceCommit);
  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));
  const learnerSources = new Map(inputs.map((row: any) => [row.path, row.sha256]));
  for (const path of [
    'content/coronary-arterial-study-pins.json', 'lib/coronary-arterial-tour.ts',
    'lib/regional-tours.ts', 'lib/body-review-material.ts', 'lib/body-review-context.ts',
  ]) {
    const imported = review.files.find((row: any) => row.path === path);
    assert.ok(imported, `Review import: ${path}`);
    assert.equal(imported.sourceSha256, sha256(source(path)), `saved source: ${path}`);
    assert.equal(imported.importedSha256, sha256(readFileSync(`atlas-review/${path}`)), `imported bytes: ${path}`);
    if (['content/coronary-arterial-study-pins.json', 'lib/coronary-arterial-tour.ts', 'lib/regional-tours.ts'].includes(path))
      assert.equal(learnerSources.get(path), imported.sourceSha256, `learner source: ${path}`);
  }
  for (const module of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
    const learner = JSON.parse(readFileSync(`public/atlas-runtime/${module}/manifest.json`, 'utf8'));
    assert.equal(learner.sourceCommit, sourceCommit, module);
    assert.equal(learner.patientDataIncluded, false, module);
    assert.equal(learner.clinicalApproved, false, module);
  }
  const viewer = JSON.parse(readFileSync('public/atlas-review-viewer/manifest.json', 'utf8'));
  assert.equal(viewer.sourceCommit, sourceCommit);
  assert.equal(viewer.personalRecordsIncluded, false);

  const previous = await atlasExactGitApi(previousWebsite, entry);
  const compiled = await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', write: false });
  const current = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const pins = JSON.parse(readFileSync('atlas-review/content/coronary-arterial-study-pins.json', 'utf8'));
  assert.deepEqual(pins.entries.map((row: any) => row.fmaId),
    ['FMA3802', 'FMA3855', 'FMA3862', 'FMA3895', 'FMA7088']);
  const [right, left, lad, circumflex, heart] = pins.entries.map((row: any) => row.id);
  const participants = new Set([right, left, lad, circumflex, heart]);
  const tour = current.coronaryArterialTour;
  assert.equal(tour.id, 'coronary-arterial-orientation');
  assert.equal(tour.revision, 'coronary-arterial-orientation-v1');
  assert.equal(tour.region, 'thorax');
  assert.equal(tour.status, 'draft');
  assert.deepEqual(tour.contextIds, [heart]);
  assert.deepEqual(tour.steps.map((step: any) => [step.id, step.selectedId, step.view, step.frameIds]), [
    ['right-coronary', right, 'anterior', [right, heart]],
    ['left-coronary', left, 'left', [left, lad, circumflex]],
    ['anterior-interventricular', lad, 'anterior', [lad, left]],
    ['circumflex-left', circumflex, 'left', [circumflex, left, heart]],
    ['circumflex-posterior', circumflex, 'posterior', [circumflex, heart]],
    ['coronary-comparison', right, 'anterior', [right, left, lad, circumflex, heart]],
  ]);
  assert(tour.steps.every((step: any) => step.durationMs === 14000 && step.fadeOthers === true));
  assert.deepEqual(tour.requiredDisplayBundles,
    Object.fromEntries(pins.entries.map((row: any) => [row.id, row.bundle])));
  assert.equal(previous.regionalTours.length, 30);
  assert.equal(previous.regionalTours.reduce((n: number, item: any) => n + item.steps.length, 0), 177);
  assert.equal(current.regionalTours.length, 31);
  assert.equal(current.regionalTours.reduce((n: number, item: any) => n + item.steps.length, 0), 183);
  assert.deepEqual(current.regionalTours.filter((item: any) => item.id !== tour.id), previous.regionalTours);
  assert.deepEqual(current.regionalToursFor('thorax').at(-1), tour);
  assert.equal(current.catalog.structures.length, 1104);
  assert.deepEqual(current.catalog, previous.catalog);
  const selected = current.regionalTourStructures(current.catalog, tour);
  assert.deepEqual(selected.map((row: any) => row.id), [heart, right, left, lad, circumflex]);
  assert.deepEqual(selected, [pins.entries[4], ...pins.entries.slice(0, 4)]);
  const frames = current.regionalTourStepFrames(current.catalog, tour);
  assert.equal(frames.length, 6);
  for (let index = 0; index < frames.length; index++) {
    assert.deepEqual(current.regionalTourFrame(current.catalog, tour, index), frames[index]);
  }

  let topics = 0, changed = 0, unchanged = 0, refusedPackets = 0, stale = 0, storageCalls = 0;
  const storage = { prepare() { storageCalls++; throw Error('Rejected review reached storage'); } };
  for (const structure of current.catalog.structures) {
    const id = structure.id;
    const [material, oldMaterial, context, oldContext] = await Promise.all([
      current.bodyReviewMaterial(id), previous.bodyReviewMaterial(id),
      current.bodyReviewContext(id), previous.bodyReviewContext(id),
    ]);
    assert(material && oldMaterial && context && oldContext, id);
    assert.equal(material.approval, false);
    assert(await current.parseBodyReviewResponse(material, id), `current transport: ${id}`);
    assert.deepEqual(material.source, oldMaterial.source);
    assert.deepEqual(material.topics, oldMaterial.topics);
    assert.deepEqual(material.reasoning, oldMaterial.reasoning);
    assert.equal(context.sourceHash, oldContext.sourceHash);
    assert.equal(context.revisions.imaging, null);
    topics += material.topics.length;
    if (!participants.has(id)) {
      assert.deepEqual(material, oldMaterial, `unrelated worksheet: ${id}`);
      assert.equal(context.teachingHash, oldContext.teachingHash);
      assert.equal(context.revisions.teaching, oldContext.revisions.teaching);
      unchanged++;
      continue;
    }
    changed++;
    assert.notEqual(context.teachingHash, oldContext.teachingHash);
    assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
    assert.deepEqual(material.guidedTours.filter((row: any) => row.tour.id !== tour.id), oldMaterial.guidedTours);
    assert.equal(material.guidedTours.length, oldMaterial.guidedTours.length + 1);
    const index = material.guidedTours.findIndex((row: any) => row.tour.id === tour.id);
    assert(index >= 0);
    const evidence = material.guidedTours[index];
    assert.deepEqual(evidence.tour, tour);
    assert.deepEqual(evidence.structures, selected);
    assert.deepEqual(Object.fromEntries(evidence.bundles.map((row: any) => [row.id, row])),
      Object.fromEntries(pins.bundles.map((row: any) => [row.id, row])));
    assert.deepEqual(evidence.stepFrames, frames);
    assert.equal(evidence.transitionMs, 1800);
    assert.equal(evidence.transition, 'quintic-orbit');
    assert.equal(evidence.separation, 0);
    for (const mutate of [
      (packet: any) => packet.guidedTours.splice(index, 1),
      (packet: any) => packet.guidedTours.push(structuredClone(evidence)),
      (packet: any) => packet.guidedTours[index].tour.steps.reverse(),
      (packet: any) => { packet.guidedTours[index].tour.steps[0].caption += ' forged'; },
      (packet: any) => { packet.guidedTours[index].tour.steps[0].frameIds = [left]; },
      (packet: any) => { packet.guidedTours[index].structures[0].sources[0].sha256 = '0'.repeat(64); },
      (packet: any) => { packet.guidedTours[index].stepFrames[0].min[0] -= 1; },
      (packet: any) => { packet.guidedTours[index].transition = 'linear'; },
    ]) {
      const forged = structuredClone(material);
      mutate(forged);
      assert.equal(await current.parseBodyReviewResponse(forged, id), null);
      refusedPackets++;
    }
    const payload = { catalogScope: context.catalogScope, structureId: id, track: 'teaching',
      expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: oldContext.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: current.blankBodyReview(context, 'teaching') };
    const response = await current.postBodyDecision(new Request('https://review.test/api/atlas-review/body-review/decisions', {
      method: 'POST', headers: { origin: 'https://review.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_CORONARY_TOUR' }, body: JSON.stringify(payload),
    }), storage);
    assert.equal(response.status, 409, id);
    stale++;
  }
  assert.deepEqual({ topics, changed, unchanged, refusedPackets, stale, storageCalls },
    { topics: 9936, changed: 5, unchanged: 1099, refusedPackets: 40, stale: 5, storageCalls: 0 });
});
