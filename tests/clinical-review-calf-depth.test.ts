import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import { calfDepthEpochRead as readFileSync, calfDepthEpochPlugin, calfDepthWebsiteEpoch } from './atlas-calf-depth-history.ts';

const oldSource = '4bb78ac5a29c88984a735523775ec69aeff942d6';
const newSource = '5acfa46b7fcef876fc2f55f8ed122de46b29bb03';
const oldWebsite = 'd52d75df84118f4a76783d04bfff3541380e7741';
const baselinePath = 'tests/atlas-calf-depth-baseline.json';
const baselineSha = '70a9a9cdd80d1d5bf01346b9c41925c7e795b51bb090c08ba8843466c3355cc8';
// Dynamic imported module exports and generated JSON have no local declarations.
type Imported = any;
const sha = (value: unknown): string => createHash('sha256').update(
  typeof value === 'string' ? value : Buffer.isBuffer(value) ? value as Buffer : JSON.stringify(value) ?? 'undefined',
).digest('hex');
const json = (path: string): Imported => JSON.parse(readFileSync(path, 'utf8'));
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

async function reviewApi(): Promise<Imported> {
  const built = await build({ stdin: { contents: [
    "export { specimenReviewRows, specimenReviewMaterial } from './atlas-review/lib/specimen-review-material';",
    "export { limbDefinitions } from './atlas-review/lib/um-limb-studies';",
    "export { specimenTeachingFor } from './atlas-review/lib/um-limb-teaching';",
    "export { umCalfDepth } from './atlas-review/content/um-calf-depth';",
    "export { blankSpecimenReview, parseSavedSpecimenReview, specimenReviewStale } from './atlas-review/lib/specimen-review';",
    "export { postSpecimenReview } from './atlas-review/lib/specimen-review-api';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm', plugins: [calfDepthEpochPlugin()] });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
}

if (process.argv.includes('--capture')) {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), oldWebsite, 'pre-import website HEAD');
  const manifestBytes = readFileSync('atlas-review/manifest.json');
  assert.equal(JSON.parse(manifestBytes.toString()).revision, oldSource, 'pre-import source revision');
  const api = await reviewApi();
  const specimenPackets: Imported[] = [];
  for (const row of api.specimenReviewRows) for (const surface of row.surfaces) {
    const packet = await api.specimenReviewMaterial(row.key, surface.id);
    assert.ok(packet, `${row.key}/${surface.id}`);
    specimenPackets.push({
      key: row.key + '|' + surface.id,
      context: clean(packet.context),
      sourceStructure: clean(packet.source.structure),
      sourceFrame: packet.source.catalogue.sourceFrame,
      sourcePacketSha: sha(packet.source),
      teaching: clean(packet.teaching),
      atlasLink: packet.atlasLink,
      atlasPath: packet.atlasPath,
    });
  }
  assert.equal(specimenPackets.length, 356);
  const pins = json('atlas-review/content/um-limb-teaching-bindings.v1.json');
  assert.equal(pins.bindings.length, 67);
  const baseline = {
    schema: 1,
    provenance: { atlasSourceCommit: oldSource, websiteCommit: oldWebsite,
      manifestSha: sha(manifestBytes), capture: 'Public source-only pre-import review packets and UM pins; no personal histories or patient content' },
    specimenPackets,
    umPins: pins.bindings,
    umPinsSha: sha(readFileSync('atlas-review/content/um-limb-teaching-bindings.v1.json')),
    modelInventorySha: sha(readFileSync('lib/atlas-model-inventory.json')),
    privatePlexusManifestSha: sha(readFileSync('lib/plexus-review-manifest.json')),
  };
  writeFileSync(baselinePath, JSON.stringify(baseline));
  console.log(JSON.stringify({ baselinePath, sha256: sha(readFileSync(baselinePath)), specimens: specimenPackets.length, umPins: pins.bindings.length, source: oldSource, website: oldWebsite }));
} else {
  test('saved calf-depth website epoch preserves source packets and scopes teaching revisions', { timeout: 120000 }, async () => {
    const baselineBytes = readFileSync(baselinePath);
    assert.equal(sha(baselineBytes), baselineSha, 'immutable public pre-import fixture');
    const baseline = JSON.parse(baselineBytes.toString());
    assert.deepEqual(baseline.provenance, { atlasSourceCommit: oldSource, websiteCommit: oldWebsite,
      manifestSha: 'e3e2824a6f6312390cc11157a85d6d00286595ec197cb8719596b15c3299d68a', capture: 'Public source-only pre-import review packets and UM pins; no personal histories or patient content' });
    assert.equal(baseline.specimenPackets.length, 356);
    assert.equal(baseline.umPins.length, 67);
    const review = json('atlas-review/manifest.json');
    const receipt = json('atlas-review/integration-inputs.json');
    assert.equal(review.revision, newSource);
    assert.equal(receipt.sourceCommit, newSource);
    const featurePaths = ['content/um-calf-depth.ts', 'content/um-limb-teaching-bindings.v1.json',
      'app/specimen-depth-notes.tsx', 'app/um-limb-learning.tsx', 'lib/specimen-review.ts',
      'lib/specimen-review-material.ts'];
    const sourceAt = (path: string): Buffer => execFileSync('git', ['show', `${newSource}:${path}`], {
      cwd: 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs',
      maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } });
    for (const path of featurePaths) {
      const entry = review.files.find((file: Imported) => file.path === path);
      assert.ok(entry, `protected source entry ${path}`);
      assert.equal(entry.sourceSha256, sha(sourceAt(path)), `${path}: exact Atlas source bytes`);
      assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)), `${path}: protected imported bytes`);
      assert.equal(receipt.inputs.find((input: Imported) => input.path === 'atlas-review/' + path)?.sha256, entry.importedSha256, `${path}: protected receipt`);
    }
    // Runtime bundles consume the pinned lesson JSON; the authoring TS is
    // protected Review input, not a direct learner-runtime source input.
    const expectedFeatureInputs = ['content/um-limb-teaching-bindings.v1.json',
      'app/specimen-depth-notes.tsx', 'app/um-limb-learning.tsx'];
    for (const folder of ['head-neck', 'lower-limb']) {
      const base = `public/atlas-runtime/${folder}/`;
      const manifest = json(base + 'manifest.json');
      const inputs = json(base + 'source-inputs.json');
      assert.equal(manifest.sourceCommit, newSource, folder);
      assert.equal(manifest.patientDataIncluded, false, folder);
      assert.equal(manifest.clinicalApproved, false, folder);
      for (const path of expectedFeatureInputs) {
        const input = inputs.find((item: Imported) => item.path === path);
        assert.equal(input?.sha256, sha(sourceAt(path)), `${folder}/${path}: exact input`);
      }
    }
    for (const folder of ['shoulder', 'female-pelvis']) {
      const manifest = json(`public/atlas-runtime/${folder}/manifest.json`);
      assert.equal(manifest.sourceCommit, newSource, folder);
      assert.equal(manifest.patientDataIncluded, false, folder);
      assert.equal(manifest.clinicalApproved, false, folder);
      assert.equal(manifest.region, folder === 'shoulder' ? 'shoulder-right' : 'independent-female-pelvis', folder);
    }
    const viewer = json('public/atlas-review-viewer/manifest.json');
    assert.equal(viewer.sourceCommit, newSource);
    assert.equal(viewer.websiteIntegrationSha256, receipt.sha256);
    assert.equal(viewer.personalRecordsIncluded, false);
    for (const base of ['public/atlas-runtime/head-neck/', 'public/atlas-runtime/shoulder/',
      'public/atlas-runtime/lower-limb/', 'public/atlas-runtime/female-pelvis/', 'public/atlas-review-viewer/']) {
      const manifest = json(base + 'manifest.json');
      for (const file of manifest.files) assert.equal(sha(readFileSync(base + file.path)), file.sha256, `${base}${file.path}: emitted byte hash`);
    }
    const privatePlexus = json('lib/plexus-review-manifest.json');
    assert.equal(sha(readFileSync('lib/plexus-review-manifest.json')), baseline.privatePlexusManifestSha);
    assert.equal(privatePlexus.context.sourceCommit, 'de82626457fb60c3b92b4e4d87a0016b6c3c09ce');
    assert.equal(privatePlexus.context.materialHash, 'b37a78363dd1a279530425312dc65f19523f4a4106c060aced579d9e981f8a6c');
    assert.equal(privatePlexus.admissions, 0);
    assert.equal(privatePlexus.context.learnerCatalogAdmission, false);
    const oldInventoryBytes = execFileSync('git', ['show', `${oldWebsite}:lib/atlas-model-inventory.json`]);
    assert.equal(sha(oldInventoryBytes), baseline.modelInventorySha, 'frozen model inventory baseline');
    assert.deepEqual(json('lib/atlas-model-inventory.json').models,
      JSON.parse(oldInventoryBytes.toString()).models, 'model payload inventory unchanged');
    assert.equal(sha(readFileSync('package-lock.json')), sha(execFileSync('git', ['show', `${oldWebsite}:package-lock.json`])));

    const api = await reviewApi();
    const prior = new Map<string, Imported>(baseline.specimenPackets.map((packet: Imported) => [packet.key, packet]));
    const targets = new Set(['tibialis-anterior', 'tibialis-posterior', 'flexor-digitorum-longus',
      'flexor-hallucis-longus', 'peroneus-longus', 'soleus', 'gastrocnemius-medial',
      'gastrocnemius-lateral', 'popliteus']);
    let changed = 0, unchanged = 0, staleRejected = 0;
    const forbidden = { prepare() { throw Error('Stale request reached storage'); } };
    for (const row of api.specimenReviewRows) for (const surface of row.surfaces) {
      const packet = await api.specimenReviewMaterial(row.key, surface.id);
      const before = prior.get(row.key + '|' + surface.id);
      assert.ok(packet && before, `${row.key}/${surface.id}`);
      const c = packet.context, old = before.context;
      assert.equal(sha(packet.source), before.sourcePacketSha, `${row.key}/${surface.id}: source packet`);
      assert.deepEqual(clean(packet.source.structure), before.sourceStructure);
      assert.equal(packet.source.catalogue.sourceFrame, before.sourceFrame);
      assert.equal(c.sourceHash, old.sourceHash);
      assert.equal(c.sourceFrame, old.sourceFrame);
      assert.equal(packet.atlasLink, before.atlasLink);
      assert.equal(packet.atlasPath, before.atlasPath);
      assert.deepEqual(c.blockers, old.blockers);
      assert.equal(c.revisions.imaging, null);
      assert.equal(c.rendererHash, json('atlas-review/content/body-renderer-revision.json').sha256);
      assert.notEqual(c.revisions.geometry, old.revisions.geometry, 'shared display revision advances');
      const affected = row.key.startsWith('um-5t6tz7-v1-2:') && targets.has(packet.source.structure.slug);
      if (affected) {
        changed++;
        assert.equal(packet.teaching.lesson.depth.status, 'draft');
        assert.equal(packet.teaching.lesson.depth.revision, 'um-calf-depth-20261005-v1');
        const retained = clean(packet.teaching); delete retained.lesson.depth;
        assert.deepEqual(retained, before.teaching, `${row.key}/${surface.id}: prior teaching exact`);
        assert.notEqual(c.teachingHash, old.teachingHash);
        assert.notEqual(c.revisions.teaching, old.revisions.teaching);
        assert.deepEqual(c.checklists.teaching.filter((item: Imported) => item.id !== 'calf-depth'), old.checklists.teaching);
        assert.equal(c.checklists.teaching.filter((item: Imported) => item.id === 'calf-depth').length, 1);
        assert.deepEqual(c.teachingTabs, [...old.teachingTabs, 'calf-depth']);
        assert.equal(c.teachingTabs.length, 11);
        assert.equal(api.blankSpecimenReview(c, 'teaching').checks['calf-depth'], false);
        const stale = new Request('https://review.test/api/specimen-review', { method: 'POST', headers: {
          origin: 'https://review.test', 'content-type': 'application/json',
          'oai-authenticated-user-id': 'SYNTHETIC_CALF_WEBSITE',
        }, body: JSON.stringify({ catalogScope: c.catalogScope, specimenKey: c.specimenKey,
          sourceFrame: c.sourceFrame, structureId: c.structureId, track: 'teaching',
          expectedVersion: 0, materialHash: old.materialHash,
          revisionHash: old.revisions.teaching, checklistVersion: c.checklistVersion,
          draft: api.blankSpecimenReview(c, 'teaching') }) });
        assert.equal((await api.postSpecimenReview(stale, forbidden)).status, 409, 'stale review rejected before storage');
        staleRejected++;
      } else {
        unchanged++;
        assert.deepEqual(clean(packet.teaching), before.teaching, `${row.key}/${surface.id}: unchanged teaching`);
        assert.equal(c.teachingHash, old.teachingHash);
        assert.equal(c.revisions.teaching, old.revisions.teaching);
        assert.deepEqual(c.checklists.teaching, old.checklists.teaching);
        assert.deepEqual(c.teachingTabs, old.teachingTabs);
      }
    }
    assert.deepEqual([changed, unchanged, staleRejected], [24, 332, 24]);
    assert.equal(prior.size, 356);
    const nowPins = json('atlas-review/content/um-limb-teaching-bindings.v1.json').bindings;
    const oldPins = new Map<string, Imported>(baseline.umPins.map((pin: Imported) => [pin.surface.id, pin]));
    const whole = api.limbDefinitions.whole;
    let changedPins = 0, unchangedPins = 0, foreignRejected = 0;
    for (const surface of whole.surfaces) {
      const old = oldPins.get(surface.id);
      const pin = nowPins.find((pin: Imported) => pin.surface.id === surface.id);
      assert.ok(old && pin, surface.id);
      assert.deepEqual(pin.surface, old.surface);
      assert.equal(pin.bundleSha256, old.bundleSha256);
      const lesson = api.specimenTeachingFor(whole, surface);
      assert.deepEqual(lesson, pin.lesson);
      if (targets.has(surface.slug)) {
        changedPins++;
        const retained = clean(lesson); delete retained.depth;
        assert.deepEqual(retained, old.lesson, `${surface.slug}: original fields exact`);
      } else { unchangedPins++; assert.deepEqual(lesson, old.lesson, surface.slug); }
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
    assert.deepEqual([changedPins, unchangedPins, foreignRejected], [9, 58, 402]);
    const sample = await api.specimenReviewMaterial(api.specimenReviewRows.find((row: Imported) => row.key === whole.key).key,
      whole.surfaces.find((surface: Imported) => surface.slug === 'soleus').id);
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
    assert.throws(() => api.parseSavedSpecimenReview({ ...event, material: { ...event.material,
      teachingTabs: [...c.teachingTabs, 'foreign-depth'] } }), /Invalid teaching scope/);
    assert.throws(() => api.parseSavedSpecimenReview({ ...event, material: { ...event.material,
      teachingTabs: ['anatomy', 'foreign-depth'] } }), /Invalid teaching scope/);
    assert.equal(api.specimenReviewStale(event, c), false, 'synthetic exact revision only');
    const rendered = await build({ entryPoints: ['atlas-review/app/specimen-depth-notes.tsx'],
      bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
      tsconfigRaw: { compilerOptions: { jsx: 'react-jsx' } }, plugins: [calfDepthEpochPlugin()] });
    const require = createRequire(join(process.cwd(), 'package.json'));
    const component: { exports: Imported } = { exports: {} };
    runInNewContext(rendered.outputFiles[0].text, { module: component, exports: component.exports, require });
    const React = require('react'), server = require('react-dom/server');
    const escape = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
    for (const slug of targets) for (const section of ['anatomy', 'clinical', 'review']) {
      const depth = api.umCalfDepth[slug];
      const html = server.renderToStaticMarkup(React.createElement(component.exports.SpecimenDepthNotes, { depth, section }));
      assert.ok(html.includes(escape(depth.modelLimit)), `${slug}/${section}: actual limit visible`);
      assert.ok(html.includes('specialist review pending'), `${slug}/${section}: draft state`);
      if (section === 'review') { assert.match(html, /<section aria-label="Calf depth to review">/); assert.doesNotMatch(html, /<details\b/); }
      else { assert.match(html, /^<details\b/); assert.doesNotMatch(html.match(/^<details[^>]*>/)?.[0] ?? '', /\bopen\b/); }
      for (const [topic, title] of [['relationships', 'Relationships'], ['arterialSupply', 'Typical arterial supply'], ['clinicalPitfall', 'Clinical pitfall']]) {
        const expected = section === 'review' || (section === 'anatomy' ? topic !== 'clinicalPitfall' : topic === 'clinicalPitfall');
        assert.equal(html.includes(`<h4>${title}</h4>`), expected, `${slug}/${section}/${topic}: heading`);
        assert.equal(html.includes(escape(depth[topic].body)), expected, `${slug}/${section}/${topic}: body`);
        for (const ref of depth[topic].references) if (expected) assert.ok(html.includes(escape(ref.title)), `${slug}/${section}: source title`);
      }
    }
    console.log(JSON.stringify({ historicalWebsiteEpoch: calfDepthWebsiteEpoch, affectedTeachingContexts: changed, unchangedTeachingContexts: unchanged,
      sourcePackets: prior.size, pinnedLessons: nowPins.length, foreignRejected, staleRejected,
      renderedDepthModes: 27, clinicalApproved: false }));
  });
}
