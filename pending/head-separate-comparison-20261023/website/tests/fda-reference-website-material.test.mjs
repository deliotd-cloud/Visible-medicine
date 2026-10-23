import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parent = 'F:/VisibleMedicine/staging/20261023-fda-private-delivery/website';
const atlas = 'F:/VisibleMedicine/staging/20261023-tour-replay-source/atlas';
const evidence = 'F:/VisibleMedicine/staging/20261023-head-separate-comparison/material-checks';
const sourceCommit = 'b0ad9e786f2f26727cd627ec028c0d3894048c72';
const parentCommit = 'b953ff3f5f1891599cb6e91cb91311d9d6006270';
const parentSource = '2ab63cbbc1c5e18a4d7b3a65f799e863f5be0491';
const parentReview = '4eda97496b9ca0a8497776394557936380081c19da7923c0912877e462777942';
const parentRenderer = '3970827f19b5594da44035bb54f8f063e5460b47208ffde085c16292cdb84bef';
const specimen = 'fda-shoulder-fc9f3e56';
const referenceRevision = '56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44';
const ids = ['ac-ligament', 'humeral-cartilage', 'labrum', 'clavicle', 'humerus-source', 'scapula'].map(s => `vm:reference:${specimen}:${s}`);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const git = dir => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8', windowsHide: true }).trim();
const repoFile = (base, rel) => path.join(base, 'atlas-review', rel);

function assertPinnedInputs() {
  assert.equal(git(atlas), sourceCommit, 'Atlas source checkout moved');
  assert.equal(git(parent), parentCommit, 'parent Website checkout moved');
  const oldIntegration = json(repoFile(parent, 'integration-inputs.json'));
  const oldManifest = json(repoFile(parent, 'manifest.json'));
  assert.equal(oldIntegration.sourceCommit, parentSource);
  assert.equal(oldIntegration.sha256, parentReview);
  assert.equal(oldManifest.websiteIntegrationSha256, parentReview);
  assert.equal(json(repoFile(parent, 'content/body-renderer-revision.json')).sha256, parentRenderer);
  assert.equal(json(repoFile(site, 'integration-inputs.json')).sourceCommit, sourceCommit);
  assert.equal(json(repoFile(site, 'manifest.json')).revision, sourceCommit);
  const manifest = json(repoFile(site, 'manifest.json'));
  const integration = json(repoFile(site, 'integration-inputs.json'));
  assert.equal(manifest.websiteIntegrationSha256, integration.sha256);
  const renderer = json(repoFile(site, 'content/fda-reference-renderer-revision.json'));
  assert.equal(renderer.schema, 'vm-fda-reference-renderer/1');
  assert.equal(renderer.sha256, sha(JSON.stringify(renderer.inputs)));
  assert.equal(new Set(renderer.inputs.map(i => i.path)).size, renderer.inputs.length);
  const pinnedRendererBytes = execFileSync('git', ['show', `${sourceCommit}:content/fda-reference-renderer-revision.json`], { cwd: atlas, windowsHide: true });
  assert.equal(sha(fs.readFileSync(repoFile(site, 'content/fda-reference-renderer-revision.json'))), sha(pinnedRendererBytes), 'native renderer pin changed during import');
  const required = [
    'app/fda-shoulder-reference.tsx', 'app/fda-shoulder-reference.css',
    'app/review/specimens/page.tsx', 'app/review/specimens/workspace.tsx',
    'app/specimens/fda-shoulder/page.tsx', 'lib/fda-reference-links.ts',
    'lib/fda-reference-model-loader.ts', 'lib/fda-reference-review.ts',
    'lib/fda-shoulder-reference.ts',
    'lib/fda-specimen-review-material.ts', 'lib/specimen-review-api.ts',
    'lib/specimen-review-client.ts', 'lib/specimen-review-material.ts',
    'lib/specimen-review.ts',
  ];
  for (const rel of required) {
    const input = renderer.inputs.find(i => i.path === rel);
    assert(input, `FDA renderer omits ${rel}`);
  }
  for (const input of renderer.inputs) {
    const rel = input.path;
    const native = execFileSync('git', ['show', `${sourceCommit}:${rel}`], { cwd: atlas, windowsHide: true });
    const imported = fs.readFileSync(repoFile(site, rel));
    const record = manifest.files.find(i => i.path === rel);
    assert(record, `Website manifest omits ${rel}`);
    assert.equal(input.sha256, sha(native), `native FDA renderer source mismatch ${rel}`);
    assert.equal(record.sourceSha256, input.sha256, `Website source pin mismatch ${rel}`);
    assert.equal(record.importedSha256, sha(imported), `Website adaptation mismatch ${rel}`);
    const bound = integration.inputs.find(i => i.path === `atlas-review/${rel}`);
    assert(bound, `Website binder omits ${rel}`);
    assert.equal(bound.sha256, sha(imported), `Website binder has stale imported input ${rel}`);
  }
  const websiteAdapters = [
    'app/api/atlas-review/specimen-review/route.ts',
    'app/api/atlas-delivery/references/[...asset]/route.ts',
    'app/workspace/atlas-review/model/model-view.tsx',
    'lib/clinical-review-server.ts',
    'lib/clinical-review-reference-selection.ts',
    'lib/clinical-review-reference-registry.ts',
    'lib/clinical-review-reference-delivery.ts',
    'lib/clinical-review-reference-assets.json',
    'lib/clinical-review-links.ts',
    'lib/clinical-review-return.ts',
    'scripts/clinical-review-viewer/main.tsx',
    'scripts/clinical-review-viewer/fda-reference-embedded.css',
    'scripts/local-atlas-development-plugin.mjs',
    'vite.config.ts',
    'worker/index.ts',
  ];
  for (const rel of websiteAdapters) {
    const bound = integration.inputs.find(i => i.path === rel);
    assert(bound, `Website binder omits adapter ${rel}`);
    assert.equal(bound.sha256, sha(fs.readFileSync(path.join(site, rel))), `Website binder has stale adapter ${rel}`);
  }
  return { renderer: renderer.sha256, websiteIntegration: integration.sha256, inputCount: renderer.inputs.length, websiteAdapterCount: websiteAdapters.length };
}

async function bundle(base, name) {
  const outfile = path.join(evidence, `${name}.mjs`);
  await build({ stdin: { contents: [
    "export * from './lib/specimen-review-material';",
    "export * from './lib/specimen-review-api';",
    "export * from './lib/specimen-review';",
    "export * from './lib/clinical-review-index';",
    "export * from './lib/clinical-review-queue';",
    "export * from './lib/specimen-review-client';",
  ].join('\n'), resolveDir: path.join(base, 'atlas-review'), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'error' });
  return import(pathToFileURL(outfile).href);
}

fs.mkdirSync(evidence, { recursive: true });
const binding = assertPinnedInputs();
const current = await bundle(site, 'website-current-material');
const old = await bundle(parent, 'website-parent-material');
const catalogue = json(repoFile(site, 'public/models/fda-shoulder-draft/catalog.json'));
const row = current.specimenReviewRows.find(r => r.key === specimen);
const origin = 'https://synthetic-website.invalid';
const request = (id, user = 'TEST_A', track = 'geometry') => new Request(`${origin}/api/specimen-review?${new URLSearchParams({ specimenKey: specimen, structureId: id, track })}`, { headers: user ? { 'oai-authenticated-user-id': user } : {} });
const post = (payload, user = 'TEST_A', extra = {}) => new Request(`${origin}/api/specimen-review`, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...(user ? { 'oai-authenticated-user-id': user } : {}), ...extra }, body: JSON.stringify(payload) });
const envelope = (packet, draft, expectedVersion = 0, track = 'geometry') => ({ catalogScope: packet.context.catalogScope, specimenKey: specimen, sourceFrame: packet.context.sourceFrame, structureId: packet.context.structureId, track, expectedVersion, materialHash: packet.context.materialHash, revisionHash: packet.context.revisions[track], checklistVersion: packet.context.checklistVersion, draft });
const issue = { id: 'synthetic-source-question', title: 'Synthetic source question', severity: 'major', resolved: false, resolution: '' };

test('pinned Website renderer includes current source and every transport/worksheet/viewer input', () => {
  assert.match(binding.renderer, /^[a-f0-9]{64}$/);
  assert.match(binding.websiteIntegration, /^[a-f0-9]{64}$/);
  assert(binding.inputCount >= 14);
  assert.equal(binding.websiteAdapterCount, 15);
  assert.equal(catalogue.source.anatomicalSideIndependentlyVerified, false);
  assert.equal(catalogue.display.unitsPerMillimetre, null);
  assert.equal(catalogue.display.anatomicalAxesVerified, false);
  assert.deepEqual(catalogue.structures.map(s => s.id), ids);
  assert.deepEqual(catalogue.held.map(s => s.sourcePart), ['Gcart']);
  assert.equal(catalogue.clinicalApproval, false);
});

test('all 356 parent specimen payloads and index entries survive with exact source/teaching identity', async () => {
  assert.deepEqual(current.specimenReviewRows.filter(r => r.key !== specimen), old.specimenReviewRows);
  assert.deepEqual(current.clinicalReviewEntries.filter(e => !e.context.includes(specimen)), old.clinicalReviewEntries);
  const proofs = [];
  for (const group of old.specimenReviewRows) for (const surface of group.surfaces) {
    const before = await old.specimenReviewMaterial(group.key, surface.id);
    const after = await current.specimenReviewMaterial(group.key, surface.id);
    assert(before && after, `${group.key}/${surface.id}: missing material`);
    assert.deepEqual(after.source, before.source, `${group.key}/${surface.id}: source payload changed`);
    assert.deepEqual(after.teaching, before.teaching, `${group.key}/${surface.id}: teaching payload changed`);
    assert.equal(after.context.sourceHash, before.context.sourceHash, `${group.key}/${surface.id}: source hash changed`);
    assert.equal(after.context.teachingHash, before.context.teachingHash, `${group.key}/${surface.id}: teaching hash changed`);
    assert.equal(after.atlasPath, before.atlasPath);
    assert.equal(after.atlasLink, before.atlasLink);
    assert.equal(after.context.catalogScope, before.context.catalogScope);
    assert.equal(after.context.sourceFrame, before.context.sourceFrame);
    assert.equal(after.context.checklistVersion, before.context.checklistVersion);
    assert.notEqual(after.context.materialHash, before.context.materialHash, `${group.key}/${surface.id}: material revision did not change`);
    assert.notEqual(after.context.revisions.geometry, before.context.revisions.geometry, `${group.key}/${surface.id}: geometry revision did not change`);
    proofs.push({ specimen: group.key, structure: surface.id, sourceHash: after.context.sourceHash, teachingHash: after.context.teachingHash, oldMaterialHash: before.context.materialHash, newMaterialHash: after.context.materialHash });
  }
  assert.equal(proofs.length, 356);
  fs.writeFileSync(path.join(evidence, 'legacy-356-materials.json'), JSON.stringify({ atlasSource: sourceCommit, parentWebsite: parentCommit, parentAtlasSource: parentSource, parentReview, oldRenderer: parentRenderer, newRenderer: binding.renderer, count: proofs.length, proofs }, null, 2) + '\n');
});

test('six exact FDA packets and public index entries remain draft and source scoped', async () => {
  assert(row);
  assert.deepEqual(row.surfaces.map(s => s.id), ids);
  assert(row.surfaces.every(s => s.laterality === 'unverified'));
  const entries = current.clinicalReviewEntries.filter(e => e.context.includes(specimen));
  assert.equal(entries.length, 6);
  assert.equal(current.findClinicalReviewEntries({ scope: 'specimens', q: specimen }).total, 6);
  const materials = [], geometries = [];
  for (const [index, id] of ids.entries()) {
    const packet = await current.specimenReviewMaterial(specimen, id);
    assert(packet, id);
    const c = packet.context;
    assert.equal(c.structureId, id);
    assert.equal(c.sourceFrame, `${specimen}:unitless-normalized-source-assembly`);
    assert.equal(c.checklistVersion, 'fda-unitless-specimen-review-1');
    assert.equal(c.revisions.teaching, null);
    assert.equal(c.revisions.imaging, null);
    assert.match(c.revisions.geometry, /^[a-f0-9]{64}$/);
    assert(c.blockers.geometry.length >= 2);
    assert(c.blockers.teaching.length > 0 && c.blockers.imaging.length > 0);
    assert.equal(c.teachingTabs.length, 0);
    assert(packet.teaching.topics.every(t => t.body === null && t.references.length === 0));
    assert.equal(packet.teaching.lesson, null);
    assert.equal(packet.teaching.guidedDissection, null);
    assert.deepEqual(packet.source.studies, []);
    assert.equal(packet.source.structure.fmaId, null);
    assert.equal(packet.source.structure.laterality, null);
    assert.equal(packet.source.structure.coverage, 'source-part-only');
    assert.equal(packet.source.catalogue.display.unitsPerMillimetre, null);
    assert.equal(packet.source.catalogue.source.anatomicalSideIndependentlyVerified, false);
    assert.equal(packet.source.catalogue.structures.length, 6);
    assert.deepEqual(packet.source.catalogue.held.map(h => h.sourcePart), ['Gcart']);
    assert.equal(packet.atlasPath, '/specimens/fda-shoulder');
    assert.equal(packet.atlasLink, `/specimens/fda-shoulder?referenceRevision=${referenceRevision}&structure=${encodeURIComponent(id)}`);
    assert.deepEqual(entries.find(e => e.id === id), { key: `specimens:${JSON.stringify([specimen, id])}`, scope: 'specimens', name: row.surfaces[index].name, context: `${row.name} · ${specimen}`, id, laterality: 'unverified', href: `/workspace/atlas-review/specimens?${new URLSearchParams({ specimen, structure: id })}` });
    materials.push(c.materialHash);
    geometries.push(c.revisions.geometry);
  }
  assert.equal(new Set(materials).size, 6);
  assert.equal(new Set(geometries).size, 6);
  for (const invalid of ['vm:reference:fda-shoulder-fc9f3e56:Gcart', 'foreign', 'vm:reference:another-source:clavicle']) assert.equal(await current.specimenReviewMaterial(specimen, invalid), null);
});

test('native API refuses unauthenticated, forged, stale, held, foreign and approval before storage', async () => {
  const packet = await current.specimenReviewMaterial(specimen, ids[0]);
  const draft = current.blankSpecimenReview(packet.context, 'geometry');
  const payload = envelope(packet, draft);
  let touched = 0;
  const never = { prepare() { touched++; throw Error('Storage must not be reached'); } };
  assert.equal((await current.getSpecimenReviews(request(ids[0], ''), never)).status, 401);
  assert.equal((await current.postSpecimenReview(post(payload, ''), never)).status, 401);
  assert.equal((await current.postSpecimenReview(post(payload, 'TEST_A', { origin: 'https://foreign.invalid' }), never)).status, 403);
  for (const [patch, status] of [
    [{ catalogScope: 'body-display-catalog' }, 400], [{ sourceFrame: 'source-lps' }, 409],
    [{ materialHash: '0'.repeat(64) }, 409], [{ revisionHash: '0'.repeat(64) }, 409],
    [{ checklistVersion: 'specimen-review-1' }, 409], [{ structureId: 'foreign' }, 404],
    [{ structureId: `vm:reference:${specimen}:Gcart` }, 404], [{ specimenKey: 'hra-united-female-v1.10-kidneys' }, 404],
  ]) assert.equal((await current.postSpecimenReview(post({ ...payload, ...patch }), never)).status, status);
  const legacyRow = old.specimenReviewRows[0];
  const legacyId = legacyRow.surfaces[0].id;
  const oldPacket = await old.specimenReviewMaterial(legacyRow.key, legacyId);
  const newPacket = await current.specimenReviewMaterial(legacyRow.key, legacyId);
  assert.notEqual(oldPacket.context.revisions.geometry, newPacket.context.revisions.geometry);
  const oldContextPayload = {
    catalogScope: oldPacket.context.catalogScope, specimenKey: legacyRow.key,
    sourceFrame: oldPacket.context.sourceFrame, structureId: legacyId, track: 'geometry',
    expectedVersion: 0, materialHash: oldPacket.context.materialHash,
    revisionHash: oldPacket.context.revisions.geometry,
    checklistVersion: oldPacket.context.checklistVersion,
    draft: current.blankSpecimenReview(newPacket.context, 'geometry'),
  };
  assert.equal((await current.postSpecimenReview(post(oldContextPayload), never)).status, 409, 'old parent geometry context must be refused before storage');
  for (const track of ['geometry', 'teaching', 'imaging']) {
    const approved = { ...current.blankSpecimenReview(packet.context, track), status: 'approved', reviewer: 'SOFTWARE TEST ONLY', qualification: 'No clinical sign-off', scope: 'Synthetic validation only', attested: true, evidence: [{ title: 'Software fixture', url: 'https://example.invalid/', note: 'Not clinical evidence' }], checks: Object.fromEntries(packet.context.checklists[track].map(c => [c.id, true])) };
    assert.equal((await current.postSpecimenReview(post(envelope(packet, approved, 0, track)), never)).status, 422);
  }
  assert.equal(touched, 0);
});

test('native API stores independent synthetic drafts and changes-required notes; queue stays private', async () => {
  const dbFile = path.join(site, 'drizzle/0008_solid_infant_terrible.sql');
  const schema = fs.readFileSync(dbFile, 'utf8');
  const create = schema.match(/CREATE TABLE `atlas_personal_specimen_review_events` \([\s\S]*?\n\);/);
  assert(create, 'Exact Website event table migration missing');
  const native = new DatabaseSync(':memory:');
  native.exec(create[0]);
  const db = { prepare(sql) { return { bind(...values) { return {
    async all() { return { success: true, results: native.prepare(sql).all(...values) }; },
    async run() { return { success: true, meta: { changes: Number(native.prepare(sql).run(...values).changes) } }; },
  }; } }; } };
  for (const [index, id] of ids.entries()) {
    const packet = await current.specimenReviewMaterial(specimen, id);
    const draft = { ...current.blankSpecimenReview(packet.context, 'geometry'), notes: `SOFTWARE TEST ONLY: source ${index}` };
    const payload = envelope(packet, draft);
    const response = await current.postSpecimenReview(post(payload), db);
    assert.equal(response.status, 201);
    assert.match(response.headers.get('cache-control'), /private, no-store/);
    const saved = (await response.json()).review;
    assert.equal(saved.status, 'draft');
    assert.equal(saved.reviewedAt, null);
    assert.equal(saved.version, 1);
    const history = await current.getSpecimenReviews(request(id), db).then(r => r.json());
    assert.equal(current.parseSpecimenHistory(history, packet.context, 'geometry').history[0].notes, draft.notes);
    assert.equal((await current.getSpecimenReviews(request(id, 'TEST_B'), db).then(r => r.json())).history.length, 0);
    assert.equal((await current.postSpecimenReview(post(payload), db)).status, 409);
    assert.equal((await current.postSpecimenReview(post(envelope(packet, { ...draft, status: 'changes-required', issues: [issue] }, 1)), db)).status, 201);
    assert.equal((await current.postSpecimenReview(post(envelope(packet, draft, 2)), db)).status, 422);
  }
  const queueRequest = new Request(`${origin}/api/clinical-review-queue?${new URLSearchParams({ q: specimen, scope: 'specimens' })}`, { headers: { 'oai-authenticated-user-id': 'TEST_A' } });
  const queue = await current.getClinicalReviewQueue(queueRequest, db);
  assert.equal(queue.status, 200);
  const result = await queue.json();
  assert.equal(result.items.length, 6);
  assert(result.items.every(i => i.geometry === 'changes-required' && i.teaching === 'not-started'));
  assert.equal(native.prepare('SELECT COUNT(*) AS count FROM atlas_personal_specimen_review_events').get().count, 12);
  native.close();
});
