import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, relative } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import { preCoronaryTourPlugin } from './coronary-tour-history.mjs';

const root = process.cwd();
const baseline = '3acb1235e6ba58c5f6828e143a58edb90d76d82e';
const baselineMaterial = execFileSync('git', [
  'show', `${baseline}:lib/body-review-material.ts`,
], { encoding: 'utf8', maxBuffer: 32_000_000 });
const baselineContext = execFileSync('git', [
  'show', `${baseline}:lib/body-review-context.ts`,
], { encoding: 'utf8', maxBuffer: 32_000_000 });
const require = createRequire(root + '/package.json');
const plain = value => JSON.parse(JSON.stringify(value));
const same = (actual, expected, label) =>
  assert.deepEqual(plain(actual), plain(expected), label);

async function load(previous) {
  const compiled = await build({
    stdin: {
      contents: "export * from './lib/body-review-material'; export * from './lib/body-review-response'; export * from './lib/body-review-context'; export * from './lib/body-review-decisions'; export * from './lib/body-review-api'; export * from './lib/coronary-arterial-review'; export { bodyDisplayCatalog } from './lib/body-display-catalog';",
      resolveDir: root, loader: 'ts',
    },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    plugins: [preCoronaryTourPlugin(), ...(previous ? [{
      name: 'exact-material-baseline',
      setup(api) {
        api.onLoad({ filter: /body-review-(?:material|context)\.ts$/ }, args => {
          const path = relative(root, args.path).replaceAll('\\', '/');
          const contents = path === 'lib/body-review-material.ts' ? baselineMaterial
            : path === 'lib/body-review-context.ts' ? baselineContext : null;
          if (contents === null) return;
          return { contents, loader: 'ts', resolveDir: dirname(args.path) };
        });
      },
    }] : [])],
  });
  const scope = { exports: {} };
  runInNewContext(compiled.outputFiles[0].text, {
    module: scope, exports: scope.exports, require, crypto, TextEncoder,
    TextDecoder, structuredClone, URL, URLSearchParams, Request, Response, Headers,
  });
  return scope.exports;
}

const before = await load(true);
const actual = await load(false);
const catalog = actual.bodyDisplayCatalog(require(root + '/public/models/bodyparts3d/full-body/catalog.json'));
const expectedFmas = ['FMA3802', 'FMA3855', 'FMA3862', 'FMA3895', 'FMA7088'];
const participants = actual.bodyReviewSummaries.filter(s => expectedFmas.includes(s.fmaId));
same(participants.map(s => s.fmaId).sort(), [...expectedFmas].sort(), 'exact five participants');
assert.equal(actual.bodyReviewSummaries.length, 1104, 'full current body catalog');
same(actual.bodyReviewSummaries, before.bodyReviewSummaries, 'summary catalog unchanged');
const targetIds = new Set(participants.map(s => s.id));
assert.equal(targetIds.size, 5);
const inheritedGeometry = plain(before.bodyReviewChecks.geometry);
same(actual.bodyReviewChecks.geometry, inheritedGeometry, 'shared geometry defaults unchanged');
same(actual.bodyReviewChecks.teaching, before.bodyReviewChecks.teaching, 'shared teaching defaults unchanged');
same(actual.bodyReviewChecks.imaging, before.bodyReviewChecks.imaging, 'shared imaging defaults unchanged');

let changed = 0;
let unchanged = 0;
let accepted = 0;
let forgedRejected = 0;
let geometryStale = 0;
let teachingPreserved = 0;
let unchangedGeometryPreserved = 0;
for (const summary of actual.bodyReviewSummaries) {
  const id = summary.id;
  const oldSnapshot = before.bodyReviewSnapshot(id);
  const newSnapshot = actual.bodyReviewSnapshot(id);
  const oldPacket = await before.bodyReviewMaterial(id);
  const newPacket = await actual.bodyReviewMaterial(id);
  const oldContext = await before.bodyReviewContext(id);
  const newContext = await actual.bodyReviewContext(id);
  assert(oldSnapshot && newSnapshot && oldPacket && newPacket && oldContext && newContext, id);
  const isTarget = targetIds.has(id);

  for (const field of ['source', 'topics', 'reasoning', 'guidedTours', 'atlasLink', 'limits']) {
    same(newSnapshot[field], oldSnapshot[field], `${id} snapshot ${field}`);
    same(newPacket[field], oldPacket[field], `${id} packet ${field}`);
  }
  same(Object.keys(newSnapshot).sort(), Object.keys(oldSnapshot).sort(), `${id} snapshot schema`);
  same(Object.keys(newPacket).sort(), Object.keys(oldPacket).sort(), `${id} packet schema`);
  same(newPacket.fingerprints.source, oldPacket.fingerprints.source, `${id} source fingerprint`);
  same(newPacket.fingerprints.teaching, oldPacket.fingerprints.teaching, `${id} teaching fingerprint`);
  same(newSnapshot.checklist.teaching, oldSnapshot.checklist.teaching, `${id} teaching checks`);
  same(newSnapshot.checklist.imaging, oldSnapshot.checklist.imaging, `${id} imaging checks`);
  same(newPacket.checklist, newSnapshot.checklist, `${id} packet/snapshot checklist`);
  same(newPacket.reviewerNotes, oldPacket.reviewerNotes, `${id} reviewer note defaults`);
  same(newContext.sourceHash, oldContext.sourceHash, `${id} decision source binding`);
  same(newContext.teachingHash, oldContext.teachingHash, `${id} decision teaching binding`);
  same(newContext.checklists.teaching, oldContext.checklists.teaching, `${id} decision teaching checks`);
  same(newContext.checklists.imaging, oldContext.checklists.imaging, `${id} decision imaging checks`);
  same(newContext.revisions.teaching, oldContext.revisions.teaching, `${id} teaching revision`);
  same(newContext.revisions.imaging, null, `${id} imaging unavailable`);
  same(oldContext.revisions.imaging, null, `${id} baseline imaging unavailable`);
  assert(newContext.checklists.geometry.length <= 30, `${id} stored geometry checklist capacity`);
  assert(newContext.checklists.geometry.every(check => check.id.length <= 80 && check.label.length <= 1000),
    `${id} stored geometry item limits`);
  const oldTeaching = { catalogScope: oldContext.catalogScope, structureId: id,
    checklistVersion: oldContext.checklistVersion, track: 'teaching',
    revisionHash: oldContext.revisions.teaching };
  assert.equal(actual.bodyReviewStale(oldTeaching, newContext), false,
    `${id} existing teaching review remains current`);
  teachingPreserved++;

  if (isTarget) {
    changed++;
    // The helper's exact source gate is exercised in its own suite; here the
    // produced worksheet must contain only its admitted extra checks.
    const extra = actual.coronaryArterialReviewChecks(catalog, id);
    assert(extra.length > 0, `${id} has source-bound review checks`);
    same(newSnapshot.checklist.geometry,
      [...oldSnapshot.checklist.geometry, ...extra], `${id} geometry suffix`);
    assert.notEqual(newPacket.fingerprints.checklist, oldPacket.fingerprints.checklist, `${id} checklist revision`);
    assert.notEqual(newPacket.materialHash, oldPacket.materialHash, `${id} material revision`);
    assert.equal(extra.length, 10, `${id} ten mandatory source-study checks`);
    same(newContext.checklists.geometry,
      [...oldContext.checklists.geometry,
        ...extra.map((label, index) => ({ id: `source-study-${index + 1}`, label }))],
      `${id} decision geometry checklist`);
    assert.notEqual(newContext.revisions.geometry, oldContext.revisions.geometry,
      `${id} geometry revision changes`);
    const oldGeometry = { catalogScope: oldContext.catalogScope, structureId: id,
      checklistVersion: oldContext.checklistVersion, track: 'geometry',
      revisionHash: oldContext.revisions.geometry };
    assert.equal(actual.bodyReviewStale(oldGeometry, newContext), true,
      `${id} prior geometry review becomes stale`);
    geometryStale++;
    const oldChecks = actual.blankBodyReview(oldContext, 'geometry');
    Object.keys(oldChecks.checks).forEach(key => { oldChecks.checks[key] = true; });
    Object.assign(oldChecks, { status: 'approved', reviewer: 'Synthetic reviewer',
      qualification: 'Synthetic role', scope: 'Synthetic review scope',
      evidence: [{ title: 'Synthetic source', url: 'https://example.invalid/source', note: '' }],
      attested: true });
    assert(actual.bodyApprovalProblems(oldChecks, newContext, 'geometry')
      .includes('Complete every checklist item.'), `${id} missing added checks blocks approval`);
    same(actual.validateBodyReviewDraft(actual.blankBodyReview(newContext, 'geometry'),
      newContext.checklists.geometry), actual.blankBodyReview(newContext, 'geometry'),
    `${id} expanded blank draft validates`);
    const complete = actual.blankBodyReview(newContext, 'geometry');
    Object.keys(complete.checks).forEach(key => { complete.checks[key] = true; });
    Object.assign(complete, { status: 'approved', reviewer: 'Synthetic reviewer',
      qualification: 'Synthetic role', scope: 'Synthetic review scope',
      evidence: [{ title: 'Synthetic source', url: 'https://example.invalid/source', note: '' }],
      attested: true });
    same(actual.validateBodyReviewDraft(complete, newContext.checklists.geometry), complete,
      `${id} complete expanded draft validates`);
    const timestamp = '2026-10-04T00:00:00.000Z';
    const saved = { ...plain(oldChecks), eventSchema: 'vm-body-review-event-1',
      catalogScope: oldContext.catalogScope, structureId: id, track: 'geometry',
      version: 1, savedAt: timestamp, reviewedAt: timestamp,
      revisionHash: oldContext.revisions.geometry,
      checklistVersion: oldContext.checklistVersion,
      checklist: oldContext.checklists.geometry,
      material: { sourceHash: oldContext.sourceHash,
        teachingHash: oldContext.teachingHash, rendererHash: oldContext.rendererHash,
        materialHash: oldContext.materialHash, teachingTabs: oldContext.teachingTabs } };
    const historical = actual.parseSavedBodyReview(saved);
    assert(actual.bodyReviewStale(historical, newContext),
      `${id} parsed historical geometry review is stale`);
  } else {
    unchanged++;
    same(newSnapshot, oldSnapshot, `${id} complete unchanged snapshot`);
    same(newPacket, oldPacket, `${id} complete unchanged packet`);
    same(newContext, oldContext, `${id} complete unchanged decision context`);
    const oldGeometry = { catalogScope: oldContext.catalogScope, structureId: id,
      checklistVersion: oldContext.checklistVersion, track: 'geometry',
      revisionHash: oldContext.revisions.geometry };
    assert.equal(actual.bodyReviewStale(oldGeometry, newContext), false,
      `${id} existing geometry review remains current`);
    unchangedGeometryPreserved++;
  }

  const wire = plain(newPacket);
  same(await actual.parseBodyReviewResponse(wire, id), wire, `${id} current transport accepted`);
  accepted++;
  if (isTarget) {
    const forged = plain(wire);
    forged.checklist.geometry[forged.checklist.geometry.length - 1] += ' forged';
    assert.equal(await actual.parseBodyReviewResponse(forged, id), null,
      `${id} forged checklist rejected`);
    forgedRejected++;
  }
}
assert.equal(changed, 5);
assert.equal(unchanged, 1099);
assert.equal(geometryStale, 5);
assert.equal(unchangedGeometryPreserved, 1099);
assert.equal(teachingPreserved, 1104);

// All refusals happen before private storage is touched. Synthetic headers and
// drafts cannot create a review record or claim a clinical decision.
const targetId = participants[0].id;
const prior = await before.bodyReviewContext(targetId);
const current = await actual.bodyReviewContext(targetId);
const storage = new Proxy({}, { get() { throw Error('Rejected request touched private storage'); } });
const requestFor = (delta = {}) => new Request('https://review.test/api/body-decisions', {
  method: 'POST',
  headers: { origin: 'https://review.test', 'content-type': 'application/json',
    'oai-authenticated-user-id': 'SYNTHETIC_CORONARY_REVIEW' },
  body: JSON.stringify({ catalogScope: current.catalogScope, structureId: targetId,
    track: 'geometry', expectedVersion: 0, materialHash: current.materialHash,
    revisionHash: current.revisions.geometry, checklistVersion: current.checklistVersion,
    draft: actual.blankBodyReview(current, 'geometry'), ...delta }),
});
const staleMaterial = await actual.postBodyDecision(requestFor({ materialHash: prior.materialHash }), storage);
assert.equal(staleMaterial.status, 409, 'prior material rejected before storage');
const staleGeometry = await actual.postBodyDecision(requestFor({ revisionHash: prior.revisions.geometry }), storage);
assert.equal(staleGeometry.status, 409, 'prior geometry revision rejected before storage');
const incomplete = actual.blankBodyReview(current, 'geometry');
Object.keys(incomplete.checks).forEach(key => { if (!key.startsWith('source-study-')) incomplete.checks[key] = true; });
Object.assign(incomplete, { status: 'approved', reviewer: 'Synthetic reviewer',
  qualification: 'Synthetic role', scope: 'Synthetic review scope',
  evidence: [{ title: 'Synthetic source', url: 'https://example.invalid/source', note: '' }],
  attested: true });
const missingChecks = await actual.postBodyDecision(requestFor({ draft: incomplete }), storage);
assert.equal(missingChecks.status, 422, 'current revision requires new checks before approval');
const forged = actual.blankBodyReview(current, 'geometry');
forged.checks['source-study-forged'] = true;
const forgedChecks = await actual.postBodyDecision(requestFor({ draft: forged }), storage);
assert.equal(forgedChecks.status, 422, 'forged checklist rejected before storage');

// Caller changes to one worksheet must not alter a subsequent worksheet or
// the shared defaults, including the five newly appended strings.
const firstId = participants[0].id;
const secondId = participants[1].id;
const independent = actual.bodyReviewSnapshot(firstId);
const secondBefore = actual.bodyReviewSnapshot(secondId);
independent.checklist.geometry.push('caller addition');
independent.checklist.geometry[0] = 'caller replacement';
same(actual.bodyReviewSnapshot(firstId).checklist.geometry,
  (await actual.bodyReviewMaterial(firstId)).checklist.geometry,
  'first worksheet detached from caller mutation');
same(actual.bodyReviewSnapshot(secondId), secondBefore,
  'second participant detached from first mutation');
same(actual.bodyReviewChecks.geometry, inheritedGeometry,
  'shared geometry array remains unchanged');

console.log(JSON.stringify({ passed: true, baseline, worksheets: 1104,
  changedGeometry: changed, exactUnchanged: unchanged, transportAccepted: accepted,
  forgedChecklistRejected: forgedRejected, staleGeometry: geometryStale,
  preservedGeometry: unchangedGeometryPreserved, preservedTeaching: teachingPreserved,
  postRefusalsBeforeStorage: 4, clinicalApproval: false }));
