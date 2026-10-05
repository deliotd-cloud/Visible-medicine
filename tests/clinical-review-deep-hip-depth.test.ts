import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { deepHipDepthEpochRead as readFileSync, deepHipDepthEpochPlugin, deepHipDepthWebsiteEpoch } from './atlas-deep-hip-depth-history.ts';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

const oldSource = 'd5e5641e600eb6cfaf77ecde760cca81721e2c66';
const newSource = '05596d396d104a65cdd7a1fdf770505c3dfb3139';
const oldWebsite = 'ae2561a222e7c374a301fa364e75529f75400627';
const baselinePath = 'tests/atlas-deep-hip-depth-baseline.json';
const baselineSha = '289fe2a2abf46249a8e7a17f74bc9a8c6a00e09a0409fd1a932778a8191dffff';
const atlasRepo = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const captureDescription = 'Hash-only public source review metadata and UM pins; no prose, histories, scans or identifiers';
type Imported = any;
const sha = (value: unknown): string => createHash('sha256').update(
  typeof value === 'string' ? value : Buffer.isBuffer(value) ? value as Buffer : JSON.stringify(value) ?? 'undefined',
).digest('hex');
const json = (path: string): Imported => JSON.parse(readFileSync(path, 'utf8'));
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const atSource = (path: string): Buffer => execFileSync('git', ['show', `${newSource}:${path}`], {
  cwd: atlasRepo, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const noticePaths = (): string[] => execFileSync('git', ['ls-files', '-z']).toString().split('\0')
  .filter(path => /^(?:atlas-review|public\/atlas-runtime|public\/atlas-review-viewer|public\/media\/atlas)\//u.test(path)
    && /(?:NOTICE|LICENSE|LICENCE)/iu.test(path)).sort();

async function reviewApi(before = false): Promise<Imported> {
  const built = await build({ stdin: { contents: [
    "export { specimenReviewRows, specimenReviewMaterial } from './atlas-review/lib/specimen-review-material';",
    "export { limbDefinitions } from './atlas-review/lib/um-limb-studies';",
    "export { specimenTeachingFor } from './atlas-review/lib/um-limb-teaching';",
    ...(!before ? [
      "export { umDeepHipDepth } from './atlas-review/content/um-deep-hip-depth';",
      "export { specimenDepthReviewScope } from './atlas-review/lib/specimen-depth-scope';",
    ] : []),
    "export { blankSpecimenReview, parseSavedSpecimenReview, specimenReviewStale } from './atlas-review/lib/specimen-review';",
    "export { postSpecimenReview } from './atlas-review/lib/specimen-review-api';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false,
  platform: 'node', format: 'esm', plugins: [deepHipDepthEpochPlugin()] });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
}

if (process.argv.includes('--capture')) {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), oldWebsite, 'pre-import website HEAD');
  const manifestBytes = readFileSync('atlas-review/manifest.json');
  assert.equal(JSON.parse(manifestBytes.toString()).revision, oldSource, 'pre-import Atlas source');
  const api = await reviewApi(true);
  const specimenPackets: Imported[] = [];
  for (const row of api.specimenReviewRows) for (const surface of row.surfaces) {
    const packet = await api.specimenReviewMaterial(row.key, surface.id);
    assert.ok(packet, `${row.key}/${surface.id}`);
    const c = packet.context;
    specimenPackets.push({ key: `${row.key}|${surface.id}`, slug: packet.source.structure.slug,
      sourceSha: sha(packet.source), structureSha: sha(packet.source.structure),
      sourceHash: c.sourceHash, sourceFrame: c.sourceFrame, atlasLink: packet.atlasLink, atlasPath: packet.atlasPath,
      teachingSha: sha(packet.teaching), teachingHash: c.teachingHash, materialHash: c.materialHash,
      teachingRevision: c.revisions.teaching, geometryRevision: c.revisions.geometry,
      teachingTabs: clean(c.teachingTabs), teachingChecklistSha: sha(c.checklists.teaching),
      blockersSha: sha(c.blockers), imagingRevision: c.revisions.imaging });
  }
  assert.equal(specimenPackets.length, 356);
  const pins = json('atlas-review/content/um-limb-teaching-bindings.v1.json');
  assert.equal(pins.bindings.length, 67);
  const umPins = pins.bindings.map((pin: Imported) => ({ id: pin.surface.id, slug: pin.surface.slug,
    surfaceSha: sha(pin.surface), bundleSha: pin.bundleSha256, lessonSha: sha(pin.lesson) }));
  const notices = noticePaths().map(path => ({ path, sha256: sha(readFileSync(path)) }));
  const baseline = { schema: 1, provenance: { atlasSourceCommit: oldSource, websiteCommit: oldWebsite,
    manifestSha: sha(manifestBytes), capture: captureDescription }, specimenPackets, umPins,
    umPinsSha: sha(readFileSync('atlas-review/content/um-limb-teaching-bindings.v1.json')),
    modelRecordsSha: sha(json('lib/atlas-model-inventory.json').models),
    packages: ['package.json', 'package-lock.json'].map(path => ({ path, sha256: sha(readFileSync(path)) })),
    notices, privatePlexusManifestSha: sha(readFileSync('lib/plexus-review-manifest.json')) };
  writeFileSync(baselinePath, JSON.stringify(baseline));
  console.log(JSON.stringify({ baselinePath, sha256: sha(readFileSync(baselinePath)),
    specimens: specimenPackets.length, umPins: umPins.length, notices: notices.length,
    source: oldSource, website: oldWebsite }));
} else {
  test('deep hip depth import preserves source and isolates 12 teaching revisions', { timeout: 120000 }, async () => {
    const baselineBytes = readFileSync(baselinePath);
    assert.equal(sha(baselineBytes), baselineSha, 'immutable pre-import hash-only fixture');
    const baseline = JSON.parse(baselineBytes.toString());
    assert.equal(baseline.schema, 1);
    assert.equal(baseline.provenance.atlasSourceCommit, oldSource);
    assert.equal(baseline.provenance.websiteCommit, oldWebsite);
    assert.equal(baseline.provenance.manifestSha, '48a34561213659f5805f1e43834723c3ef0670ebe599c78d92a672ab1a12867a');
    assert.equal(baseline.provenance.capture, captureDescription);
    assert.equal(baseline.specimenPackets.length, 356);
    assert.equal(baseline.umPins.length, 67);

    const review = json('atlas-review/manifest.json');
    const receipt = json('atlas-review/integration-inputs.json');
    assert.equal(review.revision, newSource);
    assert.equal(receipt.sourceCommit, newSource);
    const featurePaths = [
      'content/um-deep-hip-depth.ts', 'content/um-thigh-depth.ts', 'content/um-calf-depth.ts', 'content/um-limb-teaching.ts',
      'content/um-limb-teaching-bindings.v1.json', 'content/body-renderer-revision.json',
      'lib/specimen-depth-scope.ts', 'lib/specimen-review-material.ts', 'lib/specimen-review.ts',
      'app/specimen-depth-notes.tsx', 'app/um-knee-study.css', 'app/um-limb-learning.tsx',
    ];
    for (const path of featurePaths) {
      const entry = review.files.find((file: Imported) => file.path === path);
      assert.ok(entry, `${path}: protected import entry`);
      assert.equal(entry.sourceSha256, sha(atSource(path)), `${path}: exact Atlas source`);
      assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)), `${path}: exact imported bytes`);
      // Renderer revision is a protected imported file but is not a receipt input.
      if (path !== 'content/body-renderer-revision.json') assert.equal(
        receipt.inputs.find((input: Imported) => input.path === 'atlas-review/' + path)?.sha256,
        entry.importedSha256, `${path}: current receipt`);
    }
    const runtimeInputs = ['app/specimen-depth-notes.tsx', 'app/um-knee-study.css',
      'app/um-limb-learning.tsx', 'content/um-limb-teaching-bindings.v1.json'];
    for (const folder of ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis']) {
      const base = `public/atlas-runtime/${folder}/`;
      const manifest = json(base + 'manifest.json');
      assert.equal(manifest.sourceCommit, newSource, folder);
      assert.equal(manifest.patientDataIncluded, false, folder);
      assert.equal(manifest.clinicalApproved, false, folder);
      const inputs = json(base + 'source-inputs.json');
      if (folder !== 'shoulder') for (const path of runtimeInputs) {
        assert.equal(inputs.find((input: Imported) => input.path === path)?.sha256,
          sha(atSource(path)), `${folder}/${path}: current source input`);
      }
      for (const file of manifest.files) {
        assert.equal(sha(readFileSync(base + file.path)), file.sha256, `${base}${file.path}: emitted byte hash`);
      }
    }
    const viewerBase = 'public/atlas-review-viewer/';
    const viewer = json(viewerBase + 'manifest.json');
    assert.equal(viewer.sourceCommit, newSource);
    assert.equal(viewer.websiteIntegrationSha256, receipt.sha256);
    assert.equal(viewer.personalRecordsIncluded, false);
    for (const file of viewer.files) assert.equal(sha(readFileSync(viewerBase + file.path)), file.sha256,
      `${viewerBase}${file.path}: emitted byte hash`);

    const privatePlexus = json('lib/plexus-review-manifest.json');
    assert.equal(sha(readFileSync('lib/plexus-review-manifest.json')), baseline.privatePlexusManifestSha);
    assert.equal(privatePlexus.context.sourceCommit, 'de82626457fb60c3b92b4e4d87a0016b6c3c09ce');
    assert.equal(privatePlexus.context.materialHash, 'b37a78363dd1a279530425312dc65f19523f4a4106c060aced579d9e981f8a6c');
    assert.equal(privatePlexus.admissions, 0);
    assert.equal(privatePlexus.context.learnerCatalogAdmission, false);
    const inventory = json('lib/atlas-model-inventory.json');
    assert.equal(inventory.models.length, 137);
    assert.equal(sha(inventory.models), baseline.modelRecordsSha, '137 model payload records exact');
    for (const item of baseline.packages) assert.equal(sha(readFileSync(item.path)), item.sha256, `${item.path}: exact package`);
    assert.deepEqual(noticePaths(), baseline.notices.map((item: Imported) => item.path), 'notice path set exact');
    for (const item of baseline.notices) {
      const bytes = readFileSync(item.path);
      if (item.path === 'public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt') {
        const text = bytes.toString();
        assert.match(text, new RegExp(`^Atlas source: ${newSource}$`, 'mu'), 'current review-viewer notice source');
        assert.equal(sha(text.replace(`Atlas source: ${newSource}`, `Atlas source: ${oldSource}`)),
          item.sha256, `${item.path}: only source provenance advances`);
      } else assert.equal(sha(bytes), item.sha256, `${item.path}: exact notice`);
    }

    const api = await reviewApi();
    const targets = new Set(Object.keys(api.umDeepHipDepth));
    assert.deepEqual([...targets].sort(), ['piriformis', 'superior-gemellus', 'inferior-gemellus',
      'obturator-internus', 'obturator-externus', 'quadratus-femoris'].sort());
    const prior = new Map<string, Imported>(baseline.specimenPackets.map((packet: Imported) => [packet.key, packet]));
    assert.equal(prior.size, 356);
    const renderer = json('atlas-review/content/body-renderer-revision.json');
    let changed = 0, unchanged = 0, calf = 0, earlierThigh = 0, staleRejected = 0;
    const forbidden = { prepare() { throw Error('Stale request reached storage'); } };
    for (const row of api.specimenReviewRows) for (const surface of row.surfaces) {
      const packet = await api.specimenReviewMaterial(row.key, surface.id);
      const before = prior.get(`${row.key}|${surface.id}`);
      assert.ok(packet && before, `${row.key}/${surface.id}`);
      const c = packet.context;
      assert.equal(sha(packet.source), before.sourceSha, `${row.key}/${surface.id}: source packet`);
      assert.equal(sha(packet.source.structure), before.structureSha);
      assert.equal(c.sourceHash, before.sourceHash);
      assert.equal(c.sourceFrame, before.sourceFrame);
      assert.equal(packet.atlasLink, before.atlasLink);
      assert.equal(packet.atlasPath, before.atlasPath);
      assert.equal(sha(c.blockers), before.blockersSha);
      assert.equal(c.revisions.imaging, before.imagingRevision);
      assert.equal(c.rendererHash, renderer.sha256);
      assert.notEqual(c.revisions.geometry, before.geometryRevision, 'shared display revision advances');
      const affected = ['hip-thigh', 'whole'].some(scope => row.key === api.limbDefinitions[scope].key)
        && targets.has(packet.source.structure.slug);
      if (c.teachingTabs.includes('calf-depth')) calf++;
      if (!affected && c.teachingTabs.includes('thigh-depth')) earlierThigh++;
      if (affected) {
        changed++;
        assert.equal(packet.teaching.lesson.depth.status, 'draft');
        assert.equal(packet.teaching.lesson.depth.revision, 'um-deep-hip-depth-20261005-v1');
        assert.equal(packet.teaching.lesson.depth.reviewScope, 'thigh-depth');
        assert.equal(api.specimenDepthReviewScope(packet.teaching.lesson.depth), 'thigh-depth');
        const retained = clean(packet.teaching); delete retained.lesson.depth;
        assert.equal(sha(retained), before.teachingSha, `${row.key}/${surface.id}: earlier teaching exact`);
        assert.notEqual(c.teachingHash, before.teachingHash);
        assert.notEqual(c.revisions.teaching, before.teachingRevision);
        assert.equal(sha(c.checklists.teaching.filter((item: Imported) => item.id !== 'thigh-depth')),
          before.teachingChecklistSha);
        assert.equal(c.checklists.teaching.filter((item: Imported) => item.id === 'thigh-depth').length, 1);
        assert.deepEqual(c.teachingTabs, [...before.teachingTabs, 'thigh-depth']);
        assert.equal(c.teachingTabs.length, 11);
        assert.equal(c.teachingTabs.includes('calf-depth'), false);
        assert.equal(api.blankSpecimenReview(c, 'teaching').checks['thigh-depth'], false);
        for (const patch of [{ materialHash: before.materialHash },
          { revisionHash: before.teachingRevision }, { sourceFrame: 'foreign-frame' }]) {
          const stale = new Request('https://review.test/api/specimen-review', { method: 'POST', headers: {
            origin: 'https://review.test', 'content-type': 'application/json',
            'oai-authenticated-user-id': 'SYNTHETIC_DEEP_HIP_WEBSITE',
          }, body: JSON.stringify({ catalogScope: c.catalogScope, specimenKey: c.specimenKey,
            sourceFrame: c.sourceFrame, structureId: c.structureId, track: 'teaching',
            expectedVersion: 0, materialHash: c.materialHash,
            revisionHash: c.revisions.teaching, checklistVersion: c.checklistVersion,
            draft: api.blankSpecimenReview(c, 'teaching'), ...patch }) });
          assert.equal((await api.postSpecimenReview(stale, forbidden)).status, 409, 'stale review refused before storage');
          staleRejected++;
        }
      } else {
        unchanged++;
        assert.equal(sha(packet.teaching), before.teachingSha, `${row.key}/${surface.id}: teaching exact`);
        assert.equal(c.teachingHash, before.teachingHash);
        assert.equal(c.revisions.teaching, before.teachingRevision);
        assert.equal(sha(c.checklists.teaching), before.teachingChecklistSha);
        assert.deepEqual(c.teachingTabs, before.teachingTabs);
      }
    }
    assert.deepEqual([changed, unchanged, calf, earlierThigh, staleRejected], [12, 344, 24, 20, 36]);

    const currentPins = json('atlas-review/content/um-limb-teaching-bindings.v1.json').bindings;
    assert.equal(currentPins.length, 67);
    const oldPins = new Map<string, Imported>(baseline.umPins.map((pin: Imported) => [pin.id, pin]));
    assert.equal(oldPins.size, 67);
    const whole = api.limbDefinitions.whole;
    let changedPins = 0, unchangedPins = 0, foreignRejected = 0;
    for (const surface of whole.surfaces) {
      const before = oldPins.get(surface.id);
      const pin = currentPins.find((item: Imported) => item.surface.id === surface.id);
      assert.ok(before && pin, surface.id);
      assert.equal(sha(pin.surface), before.surfaceSha);
      assert.equal(pin.bundleSha256, before.bundleSha);
      const lesson = api.specimenTeachingFor(whole, surface);
      assert.deepEqual(lesson, pin.lesson);
      if (targets.has(surface.slug)) {
        changedPins++;
        assert.equal(sha(lesson.depth), sha(api.umDeepHipDepth[surface.slug]));
        const retained = clean(lesson); delete retained.depth;
        assert.equal(sha(retained), before.lessonSha, `${surface.slug}: earlier lesson exact`);
      } else {
        unchangedPins++;
        assert.equal(sha(lesson), before.lessonSha, `${surface.slug}: lesson exact`);
      }
      for (const patch of [{ name: 'Foreign' }, { slug: surface.slug + '-foreign' },
        { laterality: 'left' }, { sources: surface.sources.map((source: Imported) => ({ ...source, sha256: 'foreign' })) },
        { bounds: { ...surface.bounds, min: [surface.bounds.min[0] + 1, ...surface.bounds.min.slice(1)] } }]) {
        assert.equal(api.specimenTeachingFor(whole, { ...surface, ...patch }), null);
        foreignRejected++;
      }
      const changedDefinition = clean(whole);
      changedDefinition.catalog.bundles.find((bundle: Imported) => bundle.id === surface.bundle).sha256 = 'foreign';
      assert.equal(api.specimenTeachingFor(changedDefinition, surface), null);
      foreignRejected++;
    }
    assert.deepEqual([changedPins, unchangedPins, foreignRejected], [6, 61, 402]);

    const sampleSurface = whole.surfaces.find((surface: Imported) => surface.slug === 'piriformis');
    const sample = await api.specimenReviewMaterial(whole.key, sampleSurface.id);
    const c = sample.context, synthetic = { ...api.blankSpecimenReview(c, 'teaching'),
      reviewer: 'SOFTWARE TEST ONLY', qualification: 'Not clinical sign-off',
      scope: 'Synthetic parser fixture for current exact source', attested: true,
      checks: Object.fromEntries(c.checklists.teaching.map((item: Imported) => [item.id, true])),
      evidence: [{ title: 'Synthetic fixture', url: 'https://example.test', note: 'Not clinical evidence' }],
      status: 'approved' };
    const event = { ...synthetic, eventSchema: 'vm-specimen-review-event-1',
      catalogScope: c.catalogScope, specimenKey: c.specimenKey, sourceFrame: c.sourceFrame,
      structureId: c.structureId, track: 'teaching', version: 1,
      savedAt: '2026-10-05T00:00:00.000Z', reviewedAt: '2026-10-05T00:00:00.000Z',
      revisionHash: c.revisions.teaching, checklistVersion: c.checklistVersion,
      checklist: c.checklists.teaching,
      material: { materialHash: c.materialHash, sourceHash: c.sourceHash,
        teachingHash: c.teachingHash, rendererHash: c.rendererHash, teachingTabs: c.teachingTabs } };
    assert.deepEqual(api.parseSavedSpecimenReview(event).material.teachingTabs, c.teachingTabs);
    assert.equal(api.specimenReviewStale(event, c), false, 'synthetic exact revision only');
    const mixedScopes = [...c.teachingTabs.slice(1), 'calf-depth'];
    assert.equal(mixedScopes.length, 11);
    assert.throws(() => api.parseSavedSpecimenReview({ ...event, material: { ...event.material,
      teachingTabs: mixedScopes } }), /Invalid teaching scope/);
    assert.throws(() => api.parseSavedSpecimenReview({ ...event, material: { ...event.material,
      teachingTabs: [...c.teachingTabs, 'foreign-depth'] } }), /Invalid teaching scope/);

    const rendered = await build({ entryPoints: ['atlas-review/app/specimen-depth-notes.tsx'],
      bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
      tsconfigRaw: { compilerOptions: { jsx: 'react-jsx', paths: { '@/*': ['./*'] } } }, plugins: [deepHipDepthEpochPlugin()] });
    const require = createRequire(join(process.cwd(), 'package.json'));
    const component: { exports: Imported } = { exports: {} };
    runInNewContext(rendered.outputFiles[0].text, { module: component, exports: component.exports, require });
    const React = require('react'), server = require('react-dom/server');
    const escape = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
    for (const slug of targets) for (const section of ['anatomy', 'clinical', 'review']) {
      const depth = api.umDeepHipDepth[slug];
      const html = server.renderToStaticMarkup(React.createElement(component.exports.SpecimenDepthNotes, { depth, section }));
      assert.ok(html.includes(escape(depth.modelLimit)), `${slug}/${section}: model limit visible`);
      assert.ok(html.includes('specialist review pending'), `${slug}/${section}: draft state`);
      if (section === 'review') { assert.match(html, /<section aria-label="Hip\/thigh depth to review">/); assert.doesNotMatch(html, /<details\b/); }
      else { assert.match(html, /^<details\b/); assert.doesNotMatch(html.match(/^<details[^>]*>/)?.[0] ?? '', /\bopen\b/); }
      for (const [topic, title] of [['relationships', 'Relationships'], ['arterialSupply', 'Typical arterial supply'], ['clinicalPitfall', 'Clinical pitfall']]) {
        const expected = section === 'review' || (section === 'anatomy' ? topic !== 'clinicalPitfall' : topic === 'clinicalPitfall');
        assert.equal(html.includes(`<h4>${title}</h4>`), expected, `${slug}/${section}/${topic}: heading`);
        assert.equal(html.includes(escape(depth[topic].body)), expected, `${slug}/${section}/${topic}: body`);
        for (const ref of depth[topic].references) if (expected) assert.ok(html.includes(escape(ref.title)), `${slug}/${section}: reference title`);
      }
    }
    const invalid = { ...api.umDeepHipDepth['piriformis'], revision: 'unbound-revision' };
    assert.equal(api.specimenDepthReviewScope(invalid), null);
    const invalidHtml = server.renderToStaticMarkup(React.createElement(component.exports.SpecimenDepthNotes,
      { depth: invalid, section: 'review' }));
    assert.match(invalidHtml, /Additional depth is unavailable for this source\/revision scope/);
    assert.doesNotMatch(invalidHtml, /Calf relationships|Hip\/thigh relationships/);
    console.log(JSON.stringify({ savedWebsiteEpoch: deepHipDepthWebsiteEpoch, affectedTeachingContexts: changed, unchangedTeachingContexts: unchanged,
      existingCalfContexts: calf, earlierThighContexts: earlierThigh, sourcePackets: prior.size, pinnedLessons: currentPins.length,
      foreignRejected, staleRejected, renderedDepthModes: 18, clinicalApproved: false }));
  });
}
