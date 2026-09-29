import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';

// Generate public-source review pointers, never reviewer records or approvals.
const root = fileURLToPath(new URL('../', import.meta.url));
const destination = new URL('../docs/first-release-review-pilot.json', import.meta.url);
const mode = process.argv[2];
assert(process.argv.length === 3 && ['--write', '--check'].includes(mode),
  'Use --write to refresh the unsigned worksheet index or --check to detect drift.');
const compiled = await build({ stdin: { contents: `
  export { bodyReviewSummaries, bodyReviewMaterial } from './lib/body-review-material';
  export { bodyReviewContext } from './lib/body-review-context';
  export { nestedReviewMaterial } from './lib/nested-review-material';
  export { nestedStudyTargets } from './lib/nested-anatomy';
  export { nestedReviewKey } from './lib/nested-review-key';
  export { bodyDisplayCatalog } from './lib/body-display-catalog';
  export { default as raw } from './public/models/bodyparts3d/full-body/catalog.json';
  export { reviewPilotRoots, reviewPilotNested } from './lib/clinical-review-pilot';
`, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const entries = [];
for (const [fmaId, expectedId] of api.reviewPilotRoots) {
  const matches = api.bodyReviewSummaries.filter(s => s.fmaId === fmaId);
  assert.equal(matches.length, 1, 'Pilot identity must resolve exactly: ' + fmaId);
  const [row] = matches;
  assert.equal(row.id, expectedId);
  const material = await api.bodyReviewMaterial(row.id);
  const context = await api.bodyReviewContext(row.id);
  assert(material && context && material.approval === false);
  assert.equal(material.status, 'worksheet-not-submitted');
  entries.push({ kind: 'root', fmaId, name: row.name, laterality: row.laterality,
    structureId: row.id, regions: row.regions, context,
    topicReadiness: material.topics.map(({ tab, readiness }) => ({ tab, readiness })),
    atlasLink: material.atlasLink,
    reviewPath: '/review/body?' + new URLSearchParams({ structure: row.id }),
    decision: 'not-recorded-in-this-index' });
}
const targets = api.nestedStudyTargets(api.bodyDisplayCatalog(api.raw));
for (const [study, fmaId, parentId, structureId] of api.reviewPilotNested) {
  const matches = targets.filter(t => t.study === study && t.structure.fmaId === fmaId);
  assert.equal(matches.length, 1, 'Nested pilot identity must resolve exactly: ' + fmaId);
  const [target] = matches;
  assert.equal(target.parentId, parentId);
  assert.equal(target.structureId, structureId);
  const packet = await api.nestedReviewMaterial(api.nestedReviewKey(target.parentId, study), target.structureId);
  assert(packet && packet.atlasLink);
  entries.push({ kind: 'nested', fmaId, name: target.structure.name,
    laterality: target.structure.laterality, parentId: target.parentId, study,
    structureId: target.structureId, context: packet.context,
    topicReadiness: packet.teaching.topics.map(({ tab, readiness }) => ({ tab, readiness })),
    atlasLink: packet.atlasLink,
    reviewPath: '/review/nested?' + new URLSearchParams({ parent: target.parentId, study,
      structure: target.structureId, source: packet.context.sourceHash }),
    decision: 'not-recorded-in-this-index' });
}
assert.equal(entries.length, 11);
assert.equal(new Set(entries.map(e => e.structureId)).size, 11);
assert.equal(new Set(entries.map(e => e.context.rendererHash)).size, 1);
for (const entry of entries) {
  assert(entry.atlasLink && entry.atlasLink.startsWith('/'));
  assert.equal(entry.context.revisions.imaging, null);
  assert(entry.context.blockers.imaging.length > 0);
  for (const hash of [entry.context.sourceHash, entry.context.teachingHash,
    entry.context.rendererHash, entry.context.revisions.geometry, entry.context.revisions.teaching])
    assert(/^[a-f0-9]{64}$/.test(hash));
  const link = new URL(entry.reviewPath, 'https://atlas.invalid');
  assert.equal(link.searchParams.get('structure'), entry.structureId);
  if (entry.kind === 'nested') assert.equal(link.searchParams.get('source'), entry.context.sourceHash);
}
const snapshot = { schemaVersion: 1, purpose: 'First-release review pilot; not a release allowlist',
  approval: false, clinicalRecordsRead: false,
  limits: [
    'This index reads public source material only; it does not inspect, replace or submit private clinical decisions.',
    'Readiness describes authored drafts, not clinically approved teaching. A pilot pass never approves an entire region.',
    'Review paths target the standalone Atlas source app; hosted website routes and displayed revisions must be verified separately.',
    'Root shoulder selections are not the dedicated shoulder-pilot review scope. Internal space surfaces are not tissue walls.',
    'Imaging wording can be reviewed, but acquired-image approval remains unavailable until cleared mappings exist.',
    'Re-run --check before review; changes require a regenerated index and the existing revision-aware review workflow.'
  ], entries };
const serialized = JSON.stringify(snapshot, null, 2) + '\n';
if (mode === '--write') await writeFile(destination, serialized);
else assert.equal(await readFile(destination, 'utf8'), serialized, 'Pilot index is stale; regenerate and re-review changed material.');
console.log(JSON.stringify({ mode, entries: entries.length, approval: false,
  rendererHash: entries[0].context.rendererHash,
  teachingBlocked: entries.filter(e => e.context.blockers.teaching.length).map(e => e.name),
  imagingBlocked: entries.length }));
