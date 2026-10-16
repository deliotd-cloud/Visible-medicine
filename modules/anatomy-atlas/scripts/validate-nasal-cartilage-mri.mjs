import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/nasal-cartilage-quiz-pins.json' with { type: 'json' };

// Validate the exact admission epoch and the five current production MRI slots.
const parentCommit = '9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
assert.equal(process.argv.length, 2, 'No record, override or mutation mode');
const gitCommand = (args, options = {}) => execFileSync('git', args, {
  maxBuffer: 16e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' }, windowsHide: true,
  ...options,
});
const git = (commit, path) => gitCommand(['show', `${commit}:${path}`]);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (actual, expected, message) => assert.deepEqual(actual, expected, message);
const head = gitCommand(['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const admissions = gitCommand(['log', '--diff-filter=A', '--format=%H', '--', 'lib/nasal-cartilage-mri.ts'],
  { encoding: 'utf8' }).trim().split(/\s+/).filter(Boolean);
assert(admissions.length <= 1, 'Ambiguous nasal MRI admission history');
const epochCommit = admissions[0];
if (epochCommit) {
  assert.equal(gitCommand(['rev-parse', `${epochCommit}^`], { encoding: 'utf8' }).trim(),
    parentCommit, 'Nasal MRI admission must have the exact 9f parent');
  const added = gitCommand(['diff-tree', '--no-commit-id', '--name-status', '-r', epochCommit,
    '--', 'lib/nasal-cartilage-mri.ts', 'content/nasal-cartilage-mri.ts'], { encoding: 'utf8' });
  same(added.trim().split(/\r?\n/).sort(), [
    'A\tcontent/nasal-cartilage-mri.ts', 'A\tlib/nasal-cartilage-mri.ts',
  ], 'Both MRI files must be added by one admission commit');
} else {
  assert.equal(head, parentCommit, 'Uncommitted candidate requires exact 9f HEAD');
  const approved = new Set([
    'LICENSES/THIRD_PARTY_NOTICES.md', 'app/body-content.ts',
    'content/body-renderer-revision.json', 'content/body-review-display-pins.json',
    'content/regional-teaching/head-neck.json', 'content/nasal-cartilage-mri.ts',
    'lib/nasal-cartilage-mri.ts', 'docs/NASAL_CARTILAGE_MRI.md',
    'package.json', 'docs/CURRENT_STATUS.md', 'docs/requirement-audit.json',
    'docs/content-contract-validation.json',
    'content/review-revisions.json', 'content/exports/shoulder.v2.json',
    'scripts/exact-source-history-api.mjs', 'scripts/validate-nasal-cartilage-mri.mjs',
  ]);
  const changedPaths = gitCommand(['status', '--porcelain', '-z', '--untracked-files=all'],
    { encoding: 'utf8' }).split('\0').filter(Boolean).map(row => row.slice(3).replaceAll('\\', '/'));
  for (const path of changedPaths) assert(approved.has(path), 'Unapproved pre-admission source: ' + path);
}
const epoch = epochCommit || parentCommit;
const moduleHashes = {
  'lib/nasal-cartilage-mri.ts': '23e03af5ebbb2847ebf33ac73dea9dd7b0719edd672465018be98030c4574f35',
  'content/nasal-cartilage-mri.ts': 'b68c27f4edec041a1a9c73973616d9509c8abbc06910203cf1ec59ba8141b46f',
};
for (const [path, expected] of Object.entries(moduleHashes)) {
  const bytes = epochCommit ? git(epochCommit, path) : await readFile(path);
  assert.equal(digest(bytes), expected, path + ' differs from reviewed admission bytes');
}
const noticeInsertion = `## Nasal cartilage MRI orientation — 16 October 2026

Five existing source selections receive original project-MIT educational notes,
not new geometry, scans or image correspondence. Factual reading includes
Visscher et al., *MRI and Additive Manufacturing of Nasal Alar Constructs for
Patient-specific Reconstruction* (2017), DOI10.1038/s41598-017-10602-9,
https://pmc.ncbi.nlm.nih.gov/articles/PMC5577227/ (article CC BY4.0,
https://creativecommons.org/licenses/by/4.0/), and Varoquier et al. (2021),
DOI10.1016/j.anorl.2020.06.017, https://pubmed.ncbi.nlm.nih.gov/33144032/ .
The latter publisher's Elsevier user licence is not a permissive media/data
grant. Research citations do not import or relicense article text, tables,
figures, scans, meshes, measurement datasets or patient examples; none are
copied or adapted here. No endorsement is implied. Existing BodyParts3D CC BY4.0
attribution and unvalidated-boundary restrictions remain. No new dependency,
font, asset, service or mandatory fee. Scope: docs/NASAL_CARTILAGE_MRI.md.


`;
const oldNotices = git(parentCommit, 'LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8');
const admittedNotices = epochCommit ? git(epochCommit, 'LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8') :
  await readFile('LICENSES/THIRD_PARTY_NOTICES.md', 'utf8');
const header = '# Third-party notices\n\n';
assert(oldNotices.startsWith(header));
assert.equal(admittedNotices, header + noticeInsertion + oldNotices.slice(header.length),
  'Only the exact nasal teaching notice may change licence text');
const modelDiff = gitCommand(['diff', '--name-only', parentCommit, epochCommit || 'HEAD', '--', 'public/models'],
  { encoding: 'utf8' });
assert.equal(modelDiff, '', 'Admission changed model files');
if (epochCommit) {
  const licenceDiff = gitCommand(['diff', '--name-only', parentCommit, epochCommit, '--', 'LICENSES'],
    { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  same(licenceDiff, ['LICENSES/THIRD_PARTY_NOTICES.md'], 'Admission changed other licence files');
}
if (!epochCommit) {
  assert.equal(gitCommand(['status', '--porcelain', '--', 'public/models'], { encoding: 'utf8' }), '',
    'Uncommitted candidate changed model files');
  const licenceStatus = gitCommand(['status', '--porcelain', '--untracked-files=all', '--', 'LICENSES'],
    { encoding: 'utf8' }).trimEnd().split(/\r?\n/).filter(Boolean);
  assert.equal(licenceStatus.length, 1, 'Uncommitted candidate changed other licence files');
  assert.equal(licenceStatus[0].slice(3), 'LICENSES/THIRD_PARTY_NOTICES.md');
}
const expectedGroups = {
  septal: ['FMA59503'],
  alar: ['FMA59505', 'FMA59506'],
  lateral: ['FMA59512', 'FMA59513'],
};

const pinBytes = await readFile('content/nasal-cartilage-quiz-pins.json');
same(pinBytes, git(parentCommit, 'content/nasal-cartilage-quiz-pins.json'), 'Existing nasal source pins changed');
if (epochCommit) same(git(epochCommit, 'content/nasal-cartilage-quiz-pins.json'), pinBytes);
const pinsHash = digest(pinBytes);
assert.equal(pins.entries.length, 5);
const targets = Object.entries(expectedGroups).flatMap(([group, fmas]) => fmas.map(fma => {
  const matches = pins.entries.filter(entry => entry.group === group && entry.identity.fmaId === fma);
  assert.equal(matches.length, 1, group + '|' + fma);
  return matches[0];
}));
assert.equal(targets.length, 5);
assert.equal(new Set(targets.map(entry => entry.identity.id)).size, 5);
const targetById = new Map(targets.map(entry => [entry.identity.id, entry]));
same(git(epoch, 'public/models/bodyparts3d/full-body/catalog.json'),
  git(parentCommit, 'public/models/bodyparts3d/full-body/catalog.json'), 'Geometry catalog changed');
const context = epochCommit ? null : await contentContext();
const parent = await exactSourceHistoryApi(parentCommit, 'review-security');
const precommitCompiled = epochCommit ? null : await build({ stdin: { contents:
  "export {nasalCartilageMriLesson} from './lib/nasal-cartilage-mri.ts';" +
  "export {nasalCartilageMriGroups,nasalCartilageMriTopics} from './content/nasal-cartilage-mri.ts';" +
  "export {regionalTours} from './lib/regional-tours.ts';" +
  "export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching.ts';" +
  "export {parseBodyReviewResponse} from './lib/body-review-response.ts';" +
  "export {bodyReviewContext} from './lib/body-review-context.ts';" +
  "export {postBodyDecision} from './lib/body-review-api.ts';",
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const precommit = precommitCompiled && await import('data:text/javascript;base64,' +
  Buffer.from(precommitCompiled.outputFiles[0].text).toString('base64'));
const api = epochCommit ? await exactSourceHistoryApi(epochCommit, 'nasal-mri-epoch') :
  { ...context.api, ...precommit, catalog: context.catalog };
const display = api.bodyDisplayCatalog(api.catalog);
const oldDisplay = parent.bodyDisplayCatalog(api.catalog);
same(display, oldDisplay, 'Display geometry/source changed');
same(api.structures, parent.structures, 'Shoulder changed');
same(api.dissectionProfiles, parent.dissectionProfiles, 'Profiles changed');
same(api.contentTabs, parent.contentTabs, 'Topic tabs changed');
same(display.coordinateSystem, pins.coordinateSystem);
for (const bundle of pins.bundles) {
  same(display.bundles.filter(item => item.id === bundle.id), [bundle], bundle.id + ' catalog changed');
  const path = 'public' + new URL(bundle.url, 'https://local.invalid').pathname;
  const bytes = await readFile(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(digest(bytes), bundle.sha256);
  same(bytes, git(parentCommit, path), bundle.id + ' current source bundle changed');
  if (epochCommit) same(git(epochCommit, path), git(parentCommit, path), bundle.id + ' admission source bundle changed');
}
for (const entry of pins.entries)
  same(display.structures.filter(s => s.id === entry.identity.id), [entry.identity], entry.identity.id + ' source changed');

same(api.regionalTours, parent.regionalTours, 'Regional tours changed');
const oldNested = await exactSourceHistoryApi(parentCommit, 'nested-teaching');
same(api.nestedConcepts, oldNested.nestedConcepts, 'Nested concepts changed');
same(api.nestedTeachingReferences, oldNested.nestedTeachingReferences, 'Nested references changed');
same(api.nasalCartilageMriGroups, expectedGroups, 'Explicit target groups changed');
same(Object.keys(api.nasalCartilageMriTopics).sort(), Object.keys(expectedGroups).sort());
for (const topic of Object.values(api.nasalCartilageMriTopics)) {
  assert.equal(typeof topic.body, 'string'); assert(topic.body.trim());
  assert(Array.isArray(topic.bullets) && topic.bullets.length > 0);
  assert(Array.isArray(topic.citations) && topic.citations.length > 0);
  for (const url of topic.citations) assert.equal(new URL(url).protocol, 'https:');
}

const records = api.bodyContentRecords(display), oldRecords = parent.bodyContentRecords(oldDisplay);
assert.equal(records.length, display.structures.length);
assert.equal(oldRecords.length, records.length);
const currentById = new Map(records.map(record => [record.id, record]));
const oldById = new Map(oldRecords.map(record => [record.id, record]));
assert.equal(currentById.size, records.length); assert.equal(oldById.size, oldRecords.length);
const registry = context && new Map([...context.shoulder, ...records].map(record => [record.representationScope + '|' + record.id, record]));
const validate = registry && await contentValidator(registry);
let changed = 0, unchanged = 0, rejected = 0, reviewBindings = 0, staleSaves = 0, storageCalls = 0;
for (const structure of display.structures) {
  const current = currentById.get(structure.id), old = oldById.get(structure.id);
  assert(current && old); if (validate) assert(validate(current));
  const expected = structuredClone(old), bound = targetById.get(structure.id);
  for (const tab of api.contentTabs) {
    const before = parent.bodyLesson(structure, tab), now = api.bodyLesson(structure, tab);
    const direct = api.nasalCartilageMriLesson(structure, tab);
    if (!bound || tab !== 'mri') {
      same(now, before, structure.id + '|' + tab + ' changed');
      assert.equal(direct, undefined, structure.id + '|' + tab + ' incorrectly targeted');
      unchanged++; continue;
    }
    assert.equal(before.readiness, 'pending', structure.id);
    assert.equal(now.readiness, 'draft', structure.id);
    same(now, direct, structure.id + ' dispatch mismatch');
    same(current.content[tab], now, structure.id + ' export mismatch');
    const { readiness, ...learner } = now;
    same(api.bodyContent(structure, tab), learner, structure.id + ' display mismatch');
    const topic = api.nasalCartilageMriTopics[bound.group];
    assert.equal(now.body, topic.body);
    same(now.citations, [...topic.citations]);
    for (const bullet of topic.bullets) assert(now.bullets.includes(bullet));
    assert.match(now.bullets.join(' '), /does not establish visibility on routine brain MRI/i);
    assert.match(now.note, /revision-bound radiologist review/i);
    assert.match(now.note, /No scan.*patient example.*registration/i);
    assert.match(now.note, /Atlas, imaging-case and paid-lecture access remain independent/i);
    expected.content[tab] = now; changed++;
  }
  same(current, expected, structure.id + ' exported record changed elsewhere');
  assert.equal(current.validation.clinicalApproval, 'not-included');
  assert.equal(current.validation.materialRevisions.imaging, null);
}
assert.equal(changed, 5); assert.equal(unchanged, 9931);
assert.equal(changed + unchanged, 9936);

for (const entry of targets) {
  const id = entry.identity.id, old = await parent.bodyReviewMaterial(id), now = await api.bodyReviewMaterial(id);
  assert(old && now); assert.equal(now.approval, false);
  assert.equal(now.status, 'worksheet-not-submitted');
  const expected = structuredClone(old);
  expected.topics = now.topics;
  expected.fingerprints.teaching = now.fingerprints.teaching;
  expected.materialHash = now.materialHash;
  assert.notEqual(now.fingerprints.teaching, old.fingerprints.teaching);
  assert.notEqual(now.materialHash, old.materialHash);
  same(now, expected, id + ' review binding changed outside teaching');
  same(await api.parseBodyReviewResponse(now, id), now);
  assert.equal(await api.parseBodyReviewResponse(old, id), null, id + ' stale worksheet accepted');
  for (const mutate of [
    packet => { packet.topics.find(topic => topic.tab === 'mri').body += ' foreign'; },
    packet => { packet.source.structure.fmaId = 'FMA0'; },
    packet => { packet.topics.find(topic => topic.tab === 'mri').citations = ['https://foreign.example']; },
    packet => { packet.topics.find(topic => topic.tab === 'mri').readiness = 'approved'; },
  ]) {
    const forged = structuredClone(now); mutate(forged);
    assert.equal(await api.parseBodyReviewResponse(forged, id), null, id + ' forged worksheet accepted');
  }
  for (const item of now.topics) { const { tab, ...lesson } = item; same(lesson, api.bodyLesson(entry.identity, tab)); }
  // Display pins bind visible evidence; save-time hashes are separately recomputed
  // by the actual API. Test each gate at its own production boundary.
  const priorContext = await parent.bodyReviewContext(id), currentContext = await api.bodyReviewContext(id);
  assert(priorContext && currentContext);
  assert.equal(currentContext.sourceHash, priorContext.sourceHash);
  assert.equal(currentContext.teachingHash, now.fingerprints.teaching);
  assert.notEqual(currentContext.revisions.teaching, priorContext.revisions.teaching);
  assert.equal(currentContext.revisions.imaging, null);
  const packet = context => ({catalogScope:context.catalogScope,structureId:id,track:'teaching',
    expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:null});
  for (const input of [packet(priorContext),
    {...packet(currentContext),revisionHash:'0'.repeat(64)},
    {...packet(currentContext),materialHash:'0'.repeat(64)}]) {
    const response = await api.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json',
        'oai-authenticated-user-id':'SYNTHETIC_NASAL_MRI'},body:JSON.stringify(input)}),
      {prepare(){storageCalls++;throw Error('Stale review reached synthetic storage');}});
    assert.equal(response.status,409,id+' stale/forged save was not rejected'); staleSaves++;
  }
  reviewBindings++;
  const reject = bad => {
    assert.equal(api.nasalCartilageMriLesson(bad, 'mri'), undefined, id + ' accepted foreign source');
    rejected++;
  };
  const paths = (value, path = []) => value === null || typeof value !== 'object' ? [path] :
    Object.entries(value).flatMap(([key, item]) => [ [...path, key], ...paths(item, [...path, key]) ]);
  for (const path of paths(entry.identity)) {
    const bad = structuredClone(entry.identity); let parentValue = bad;
    for (const key of path.slice(0, -1)) parentValue = parentValue[key];
    const key = path.at(-1), original = parentValue[key];
    if (original === null || typeof original !== 'object') {
      parentValue[key] = typeof original === 'number' ? original + 0.01 :
        typeof original === 'boolean' ? !original : String(original) + '-foreign';
      reject(bad);
    }
    const removed = structuredClone(entry.identity); let owner = removed;
    for (const segment of path.slice(0, -1)) owner = owner[segment];
    if (Array.isArray(owner)) owner.splice(Number(key), 1); else delete owner[key];
    reject(removed);
  }
  for (const mutate of [
    s => { s.laterality = s.laterality === 'left' ? 'right' : 'left'; },
    s => { s.regions.push('foreign'); },
    s => { s.sources.push(s.sources[0]); },
    s => { s.foreign = true; },
    s => { s.provenance.foreign = true; },
  ]) { const bad = structuredClone(entry.identity); mutate(bad); reject(bad); }
  const counterpart = targets.find(other => other.group === entry.group && other.identity.id !== id);
  if (counterpart) reject({ ...entry.identity, sources: counterpart.identity.sources });
  const direct = api.nasalCartilageMriLesson(entry.identity, 'mri');
  const pristine = structuredClone(direct);
  direct.bullets.push('foreign'); direct.citations.length = 0;
  same(api.nasalCartilageMriLesson(entry.identity, 'mri'), pristine, 'Return fresh arrays');
}
if (epochCommit) {
  // Forward delivery: future independent lessons may change other placements.
  // Only the five admitted MRI slots and their exact source identities remain bound.
  const live = await contentContext(), current = live.api;
  const currentDisplay = current.bodyDisplayCatalog(live.catalog);
  const currentRecords = new Map(current.bodyContentRecords(currentDisplay).map(r => [r.id, r]));
  const parserBuild = await build({ stdin: { contents:
    "export {parseBodyReviewResponse} from './lib/body-review-response.ts';",
    resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
  const currentParser = await import('data:text/javascript;base64,' +
    Buffer.from(parserBuild.outputFiles[0].text).toString('base64'));
  for (const entry of targets) {
    same(currentDisplay.structures.filter(s => s.id === entry.identity.id), [entry.identity],
      entry.identity.id + ' current source changed');
    same(current.bodyLesson(entry.identity, 'mri'), api.bodyLesson(entry.identity, 'mri'),
      entry.identity.id + ' current MRI lesson changed');
    const record = currentRecords.get(entry.identity.id);
    assert(record); same(record.content.mri, api.bodyLesson(entry.identity, 'mri'));
    const currentReview = await current.bodyReviewMaterial(entry.identity.id);
    assert(currentReview); assert.equal(currentReview.approval, false);
    assert.equal(currentReview.status, 'worksheet-not-submitted');
    same(await currentParser.parseBodyReviewResponse(currentReview, entry.identity.id), currentReview);
    same(currentReview.topics.find(topic => topic.tab === 'mri'),
      { tab: 'mri', ...api.bodyLesson(entry.identity, 'mri') });
  }
}
assert.equal(storageCalls,0); assert.equal(staleSaves,15);
console.log(JSON.stringify({ changed, unchanged, rejected, reviewBindings, staleSaves, storageCalls, pinsHash,
  epoch: epochCommit || 'uncommitted-9f-candidate', currentDeliverySlots: epochCommit ? 5 : 0,
  sourceGeometryChanged: false, clinicalApproval: false, patientRegistration: false }));
