import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { kneeStabilityGuideEpochRead as readFileSync, kneeStabilityGuideEpochPlugin } from './atlas-knee-stability-guide-history.ts';
import { build } from 'esbuild';

const oldSource = '05596d396d104a65cdd7a1fdf770505c3dfb3139';
const newSource = '19f9a7fa02b98b3df8a71a645fe68d3894094178';
const oldWebsite = 'd48b32c8341cec0618678c6e81945cadd7cf4840';
const fixturePath = 'tests/atlas-knee-stability-guide-baseline.json';
const fixtureSha = 'c17ead0a414883aeb57130411e92b9d31aed1203612294b3ab3b59432c9af905';
const atlasRepo = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
type Any = any;
const sha = (value: unknown): string => createHash('sha256').update(
  typeof value === 'string' || Buffer.isBuffer(value) ? value as string | Buffer : JSON.stringify(value) ?? 'undefined',
).digest('hex');
const json = (path: string): Any => JSON.parse(readFileSync(path, 'utf8'));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const source = (path: string): Buffer => execFileSync('git', ['show', `${newSource}:${path}`], {
  cwd: atlasRepo, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const noticePaths = (): string[] => execFileSync('git', ['ls-files', '-z']).toString().split('\0')
  .filter(path => /^(?:atlas-review|public\/atlas-runtime|public\/atlas-review-viewer|public\/media\/atlas)\//u.test(path)
    && /(?:NOTICE|LICENSE|LICENCE)/iu.test(path)).sort();

async function api(): Promise<Any> {
  const bundled = await build({ stdin: { contents: [
    "export { specimenReviewRows, specimenReviewMaterial } from './atlas-review/lib/specimen-review-material';",
    "export { limbDefinitions } from './atlas-review/lib/um-limb-studies';",
    "export { specimenTeachingFor } from './atlas-review/lib/um-limb-teaching';",
    "export { umLimbGuidedDissection } from './atlas-review/lib/um-limb-guided-dissection';",
    "export { blankSpecimenReview, specimenApprovalProblems } from './atlas-review/lib/specimen-review';",
    "export { postSpecimenReview } from './atlas-review/lib/specimen-review-api';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false,
    platform: 'node', format: 'esm', plugins:[kneeStabilityGuideEpochPlugin()] });
  return import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
}

if (process.argv.includes('--capture')) {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), oldWebsite);
  const manifestBytes = readFileSync('atlas-review/manifest.json');
  assert.equal(JSON.parse(manifestBytes.toString()).revision, oldSource);
  const current = await api();
  const packets: Any[] = [];
  for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
    const packet = await current.specimenReviewMaterial(row.key, surface.id);
    assert.ok(packet);
    const c = packet.context;
    packets.push({ key: `${row.key}|${surface.id}`, slug: packet.source.structure.slug,
      sourceSha: sha(packet.source), structureSha: sha(packet.source.structure), sourceHash: c.sourceHash,
      sourceFrame: c.sourceFrame, atlasLink: packet.atlasLink, atlasPath: packet.atlasPath,
      teachingSha: sha(packet.teaching), teachingHash: c.teachingHash, materialHash: c.materialHash,
      teachingRevision: c.revisions.teaching, geometryRevision: c.revisions.geometry,
      imagingRevision: c.revisions.imaging, teachingTabs: clone(c.teachingTabs),
      teachingChecklistSha: sha(c.checklists.teaching), blockersSha: sha(c.blockers) });
  }
  assert.equal(packets.length, 356);
  const bindingsBytes = readFileSync('atlas-review/content/um-limb-teaching-bindings.v1.json');
  const bindings = JSON.parse(bindingsBytes.toString()).bindings;
  assert.equal(bindings.length, 67);
  const pins = bindings.map((pin: Any) => ({ id: pin.surface.id, slug: pin.surface.slug,
    surfaceSha: sha(pin.surface), bundleSha: pin.bundleSha256, lessonSha: sha(pin.lesson) }));
  const guides = Object.fromEntries(Object.entries(current.limbDefinitions).map(([scope, definition]) =>
    [scope, current.umLimbGuidedDissection(definition)]));
  assert.equal(guides.knee.steps.length, 6);
  const baseline = { schema: 1, provenance: { atlasSourceCommit: oldSource, websiteCommit: oldWebsite,
    manifestSha: sha(manifestBytes), capture: 'Hash-only public source/review metadata; no histories, scans or identifiers' },
    packets, pins, bindingsSha: sha(bindingsBytes), guides: clone(guides),
    modelRecordsSha: sha(json('lib/atlas-model-inventory.json').models),
    packages: ['package.json', 'package-lock.json'].map(path => ({ path, sha256: sha(readFileSync(path)) })),
    notices: noticePaths().map(path => ({ path, sha256: sha(readFileSync(path)) })),
    privatePlexusManifestSha: sha(readFileSync('lib/plexus-review-manifest.json')) };
  writeFileSync(fixturePath, JSON.stringify(baseline));
  console.log(JSON.stringify({ fixturePath, sha256: sha(readFileSync(fixturePath)), packets: packets.length,
    pins: pins.length, guides: Object.keys(guides).length, notices: baseline.notices.length,
    source: oldSource, website: oldWebsite }));
} else {
  test('knee guide import adds one source-bound comparison and preserves other review material',
    { timeout: 120000 }, async () => {
    const fixtureBytes = readFileSync(fixturePath);
    assert.equal(sha(fixtureBytes), fixtureSha, 'immutable pre-import fixture');
    const before = JSON.parse(fixtureBytes.toString());
    assert.equal(before.schema, 1);
    assert.equal(before.provenance.atlasSourceCommit, oldSource);
    assert.equal(before.provenance.websiteCommit, oldWebsite);
    assert.equal(before.provenance.capture,
      'Hash-only public source/review metadata; no histories, scans or identifiers');
    assert.equal(before.packets.length, 356);
    assert.equal(before.pins.length, 67);

    const review = json('atlas-review/manifest.json');
    const receipt = json('atlas-review/integration-inputs.json');
    assert.equal(review.revision, newSource);
    assert.equal(receipt.sourceCommit, newSource);
    for (const path of ['lib/um-proximal-guided-dissection.ts', 'lib/um-limb-guided-dissection.ts',
      'lib/specimen-review-material.ts', 'content/body-renderer-revision.json',
      'content/um-limb-teaching-bindings.v1.json']) {
      const entry = review.files.find((item: Any) => item.path === path);
      assert.ok(entry, `${path}: protected import entry`);
      assert.equal(entry.sourceSha256, sha(source(path)), `${path}: source blob`);
      assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)), `${path}: imported bytes`);
      if (path !== 'content/body-renderer-revision.json') assert.equal(
        receipt.inputs.find((item: Any) => item.path === 'atlas-review/' + path)?.sha256,
        entry.importedSha256, `${path}: receipt input`);
    }
    const runtimeInputs = ['lib/um-proximal-guided-dissection.ts', 'lib/um-limb-guided-dissection.ts',
      'content/um-limb-teaching-bindings.v1.json'];
    for (const folder of ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis']) {
      const base = `public/atlas-runtime/${folder}/`;
      const manifest = json(base + 'manifest.json');
      assert.equal(manifest.sourceCommit, newSource, folder);
      assert.equal(manifest.patientDataIncluded, false);
      assert.equal(manifest.clinicalApproved, false);
      const inputs = json(base + 'source-inputs.json');
      if (folder !== 'shoulder') for (const path of runtimeInputs) assert.equal(
        inputs.find((item: Any) => item.path === path)?.sha256, sha(source(path)), `${folder}/${path}`);
      for (const file of manifest.files) assert.equal(sha(readFileSync(base + file.path)), file.sha256);
    }
    const viewerBase = 'public/atlas-review-viewer/';
    const viewer = json(viewerBase + 'manifest.json');
    assert.equal(viewer.sourceCommit, newSource);
    assert.equal(viewer.websiteIntegrationSha256, receipt.sha256);
    assert.equal(viewer.personalRecordsIncluded, false);
    for (const file of viewer.files) assert.equal(sha(readFileSync(viewerBase + file.path)), file.sha256);

    assert.equal(sha(readFileSync('lib/plexus-review-manifest.json')), before.privatePlexusManifestSha);
    const inventory = json('lib/atlas-model-inventory.json');
    assert.equal(inventory.models.length, 137);
    assert.equal(sha(inventory.models), before.modelRecordsSha);
    for (const item of before.packages) assert.equal(sha(readFileSync(item.path)), item.sha256);
    assert.deepEqual(noticePaths(), before.notices.map((item: Any) => item.path));
    for (const item of before.notices) {
      const bytes = readFileSync(item.path);
      if (item.path === 'public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt') {
        const current = bytes.toString();
        assert.match(current, new RegExp(`^Atlas source: ${newSource}$`, 'mu'));
        assert.equal(sha(current.replace(`Atlas source: ${newSource}`, `Atlas source: ${oldSource}`)), item.sha256);
      } else assert.equal(sha(bytes), item.sha256, item.path);
    }

    const current = await api();
    const knee = current.umLimbGuidedDissection(current.limbDefinitions.knee);
    assert.ok(knee);
    assert.equal(knee.status, 'draft');
    assert.equal(before.guides.knee.steps.length, 6);
    assert.equal(knee.steps.length, 7);
    assert.deepEqual(knee.steps.filter((step: Any) => step.id !== 'um-knee-stability-compare'), before.guides.knee.steps);
    const step = knee.steps[5];
    assert.equal(step.id, 'um-knee-stability-compare');
    assert.equal(step.title, 'Compare knee stabilizers');
    assert.deepEqual(step.ids, ['tibia', 'fibula', 'acl', 'pcl', 'mcl', 'lcl']
      .map(slug => `vm:reference:um-5t6tz7-v1-2:knee:${slug}`));
    assert.equal(step.selectedId, 'vm:reference:um-5t6tz7-v1-2:knee:acl');
    assert.equal(step.view, 'anterior');
    assert.ok(!step.ids.some((id: string) => /:(?:femur|meniscus-group)$/.test(id)));
    assert.match(step.caption, /femur is hidden for visibility only/iu);
    assert.match(step.caption, /ACL and PCL help limit anterior and posterior tibial translation respectively/iu);
    assert.match(step.caption, /MCL and LCL help resist valgus and varus opening/iu);
    assert.match(step.caption, /static surfaces do not simulate loading, injury or measured attachment footprints/iu);
    assert.match(knee.limitation, /Radiologist review remains required/);
    for (const scope of ['hip-thigh', 'calf', 'foot', 'whole'])
      assert.deepEqual(current.umLimbGuidedDissection(current.limbDefinitions[scope]), before.guides[scope]);

    const oldPackets = new Map<string, Any>(before.packets.map((item: Any) => [item.key, item]));
    assert.equal(oldPackets.size, 356);
    const renderer = json('atlas-review/content/body-renderer-revision.json');
    const forbidden = { prepare() { throw Error('Stale review reached storage'); } };
    let changed = 0, unchanged = 0, staleRejected = 0, calf = 0, thigh = 0;
    for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
      const packet = await current.specimenReviewMaterial(row.key, surface.id);
      const previous = oldPackets.get(`${row.key}|${surface.id}`);
      assert.ok(packet && previous);
      const c = packet.context;
      assert.equal(sha(packet.source), previous.sourceSha);
      assert.equal(sha(packet.source.structure), previous.structureSha);
      assert.equal(c.sourceHash, previous.sourceHash);
      assert.equal(c.sourceFrame, previous.sourceFrame);
      assert.equal(packet.atlasLink, previous.atlasLink);
      assert.equal(packet.atlasPath, previous.atlasPath);
      assert.equal(sha(c.blockers), previous.blockersSha);
      assert.equal(c.revisions.imaging, previous.imagingRevision);
      assert.equal(c.rendererHash, renderer.sha256);
      assert.notEqual(c.revisions.geometry, previous.geometryRevision);
      assert.deepEqual(c.teachingTabs, previous.teachingTabs);
      assert.equal(sha(c.checklists.teaching), previous.teachingChecklistSha);
      if (c.teachingTabs.includes('calf-depth')) calf++;
      if (c.teachingTabs.includes('thigh-depth')) thigh++;
      const affected = row.key === current.limbDefinitions.knee.key;
      if (affected) {
        changed++;
        assert.deepEqual(packet.teaching.guidedDissection, knee);
        const retained = clone(packet.teaching);
        retained.guidedDissection = before.guides.knee;
        assert.equal(sha(retained), previous.teachingSha, `${row.key}/${surface.id}: prior teaching`);
        assert.notEqual(c.teachingHash, previous.teachingHash);
        assert.notEqual(c.revisions.teaching, previous.teachingRevision);
        assert.equal(current.blankSpecimenReview(c, 'teaching').checks['guided-dissection'], false);
        const detached = clone(packet);
        packet.teaching.guidedDissection.steps[5].caption = 'Changed';
        assert.deepEqual(await current.specimenReviewMaterial(row.key, surface.id), detached);
      } else {
        unchanged++;
        assert.equal(sha(packet.teaching), previous.teachingSha);
        assert.equal(c.teachingHash, previous.teachingHash);
        assert.equal(c.revisions.teaching, previous.teachingRevision);
      }
      const patches = affected
        ? [{ revisionHash: previous.teachingRevision }, { materialHash: previous.materialHash }, { sourceFrame: 'foreign-frame' }]
        : [{ revisionHash: previous.geometryRevision }];
      for (const patch of patches) {
        const track = affected ? 'teaching' : 'geometry';
        const request = new Request('https://review.test/api/specimen-review', { method: 'POST', headers: {
          origin: 'https://review.test', 'content-type': 'application/json',
          'oai-authenticated-user-id': 'SYNTHETIC_KNEE_GUIDE_WEBSITE',
        }, body: JSON.stringify({ catalogScope: c.catalogScope, specimenKey: c.specimenKey,
          structureId: c.structureId, sourceFrame: c.sourceFrame, materialHash: c.materialHash,
          revisionHash: c.revisions[track], checklistVersion: c.checklistVersion,
          track, expectedVersion: 0, draft: current.blankSpecimenReview(c, track), ...patch }) });
        assert.equal((await current.postSpecimenReview(request, forbidden)).status, 409);
        staleRejected++;
      }
    }
    assert.deepEqual([changed, unchanged, staleRejected, calf, thigh], [15, 341, 386, 24, 32]);

    const bindingBytes = readFileSync('atlas-review/content/um-limb-teaching-bindings.v1.json');
    assert.equal(sha(bindingBytes), before.bindingsSha);
    const bindings = JSON.parse(bindingBytes.toString()).bindings;
    assert.equal(bindings.length, 67);
    const oldPins = new Map<string, Any>(before.pins.map((item: Any) => [item.id, item]));
    for (const pin of bindings) {
      const old = oldPins.get(pin.surface.id);
      assert.ok(old);
      assert.equal(sha(pin.surface), old.surfaceSha);
      assert.equal(pin.bundleSha256, old.bundleSha);
      assert.equal(sha(pin.lesson), old.lessonSha);
    }
    const definition = current.limbDefinitions.knee;
    assert.equal(current.umLimbGuidedDissection({ ...definition, label: 'Foreign' }), null);
    assert.equal(current.umLimbGuidedDissection({ ...definition, surfaces: definition.surfaces.map(
      (item: Any, index: number) => index === 0 ? { ...item, name: 'Foreign' } : item) }), null);
    console.log(JSON.stringify({ sourcePackets: 356, changedTeachingContexts: changed,
      unchangedTeachingContexts: unchanged, lessonPins: bindings.length, calfDepthContexts: calf,
      thighDepthContexts: thigh, staleOrForeignRejectedBeforeStorage: staleRejected,
      otherGuidesExact: 4, clinicalApproved: false }));
  });

}
