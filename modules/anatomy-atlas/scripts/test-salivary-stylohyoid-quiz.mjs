import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const working = process.argv.length === 3 && process.argv[2] === '--working-transition';
assert(working || process.argv.length === 2, 'Only --working-transition is accepted');
const baseline = '325fc6aa50c4221691a1ee87de0d0ca91264ff04';
const helperPath = 'lib/salivary-stylohyoid-quiz.ts';
const questionsPath = 'content/salivary-stylohyoid-quiz.ts';
const pinsPath = 'content/salivary-stylohyoid-quiz-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const git = args => execFileSync('git', args, { windowsHide: true, maxBuffer: 32e6,
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } });
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`]);
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);
const head = git(['rev-parse', 'HEAD']).toString().trim();
let introduction;
if (working) {
  assert.equal(head, baseline, 'Working transition requires exact baseline HEAD');
  for (const path of [helperPath, questionsPath, pinsPath])
    assert.equal(git(['ls-files', '--others', '--exclude-standard', '--', path]).toString().trim(), path,
      `Working transition requires untracked ${path}`);
} else {
  introduction = git(['log', '--diff-filter=A', '--format=%H', '--', helperPath])
    .toString().trim().split(/\r?\n/).filter(Boolean).at(-1);
  assert.match(introduction ?? '', /^[a-f0-9]{40}$/, 'Immutable helper introduction commit');
  assert.equal(git(['merge-base', baseline, introduction]).toString().trim(), baseline);
  assert.equal(git(['merge-base', introduction, head]).toString().trim(), introduction);
  for (const path of [helperPath, questionsPath, pinsPath])
    assert.deepEqual(readFileSync(path), gitBytes(introduction, path), `${path}: immutable introduced teaching`);
}

const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
assert.equal(pins.parentCommit, baseline);
assert.equal(sha256(JSON.stringify(pins)), '1a46ee2826bb961d0f856568af823f8dd2fd18c19e920b63f7f40697db7de643');
assert.deepEqual(readFileSync(catalogPath), gitBytes(baseline, catalogPath), 'Baseline catalog bytes');
assert.equal(pins.entries.length, 6);
const expected = new Map([
  ['FMA59802', ['submandibular', 'right', 'organ', 'head-neck-organs-gaps', 'FJ2768']],
  ['FMA59803', ['submandibular', 'left', 'organ', 'head-neck-organs-gaps', 'FJ2766']],
  ['FMA59804', ['sublingual', 'right', 'organ', 'head-neck-organs-gaps', 'FJ2767']],
  ['FMA59805', ['sublingual', 'left', 'organ', 'head-neck-organs-gaps', 'FJ2765']],
  ['FMA72309', ['stylohyoid', 'right', 'ligament', 'head-neck-connective-gaps', 'FJ2764']],
  ['FMA72311', ['stylohyoid', 'left', 'ligament', 'head-neck-connective-gaps', 'FJ2763']],
]);
assert.deepEqual(new Set(pins.entries.map(e => e.identity.fmaId)), new Set(expected.keys()));
const identities = new Map(pins.entries.map(e => [e.identity.id, e]));
assert.equal(identities.size, 6);
for (const { group, identity, previous } of pins.entries) {
  const [expectedGroup, side, category, bundle, file] = expected.get(identity.fmaId);
  assert.equal(group, expectedGroup);
  assert.equal(identity.laterality, side);
  assert.equal(identity.region, 'head-neck');
  assert.equal(identity.category, category);
  assert.equal(identity.system, category === 'organ' ? 'organs' : 'connective');
  assert.equal(identity.bundle, bundle);
  assert.equal(identity.nodeName, identity.fmaId);
  assert.equal(identity.sourceTree, 'isa');
  assert.deepEqual(identity.sources.map(source => source.file), [file]);
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
  assert.equal(previous.readiness, 'generated-identification');
}
assert.deepEqual(Object.fromEntries(['submandibular', 'sublingual', 'stylohyoid']
  .map(group => [group, pins.entries.filter(e => e.group === group).length])),
  { submandibular: 2, sublingual: 2, stylohyoid: 2 });
for (const descriptor of pins.bundles) {
  const path = 'public' + descriptor.url.split('?')[0];
  const bytes = readFileSync(path);
  assert.deepEqual(bytes, gitBytes(baseline, path), `${descriptor.id}: geometry unchanged`);
  assert.equal(bytes.length, descriptor.bytes);
  assert.equal(sha256(bytes), descriptor.sha256);
}

const compiled = await build({ stdin: { contents:
  "export {salivaryStylohyoidQuizLesson} from './lib/salivary-stylohyoid-quiz';" +
  "export {salivaryStylohyoidQuizQuestions} from './content/salivary-stylohyoid-quiz';" +
  "export {bodyLesson,bodyContent} from './app/body-content';" +
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';" +
  "export {contentTabs} from './lib/content-types';" +
  "export {structures} from './app/anatomy-data';" +
  "export {dissectionProfiles} from './app/dissection-data';" +
  "export {regionalTours} from './lib/regional-tours';" +
  "export * from './lib/body-review-material';" +
  "export * from './lib/body-review-context';" +
  "export * from './lib/body-review-response';" +
  "export * from './lib/body-review-api';" +
  "export * from './lib/body-review-decisions';",
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const live = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = await exactSourceHistoryApi(baseline, 'review-security');
const feature = working ? live : await exactSourceHistoryApi(introduction, 'review-security');
const wholeEpoch = working || head === introduction;
const rawCatalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const catalog = feature.bodyDisplayCatalog(rawCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.structures.length * feature.contentTabs.length, 9936);
assert.equal(sha256(JSON.stringify(catalog)), pins.catalogHash);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(baseline, catalogPath))));
for (const name of ['contentTabs', 'structures', 'dissectionProfiles', 'regionalTours'])
  assert.deepEqual(feature[name], old[name], `${name}: introduction preserves baseline`);
if (wholeEpoch) {
  assert.deepEqual(live.bodyDisplayCatalog(rawCatalog), catalog);
  for (const name of ['contentTabs', 'structures', 'dissectionProfiles', 'regionalTours'])
    assert.deepEqual(live[name], feature[name], `${name}: current introduction`);
}
assert.deepEqual(catalog.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(catalog.structures.filter(s => identities.has(s.id)).sort((a, b) => a.id.localeCompare(b.id)),
  pins.entries.map(e => e.identity).sort((a, b) => a.id.localeCompare(b.id)));

const questions = live.salivaryStylohyoidQuizQuestions;
assert.deepEqual(Object.keys(questions).sort(), ['stylohyoid', 'sublingual', 'submandibular']);
const references = new Set(['https://anatomy.ttuhscep.edu/nervous_system/infratemp.html',
  'https://anatomy.ttuhscep.edu/anatomytables/joints_alpha.html']);
const expectedAnswers = {
  submandibular: ['Sublingual caruncle', 'https://anatomy.ttuhscep.edu/nervous_system/infratemp.html'],
  sublingual: ['Medial', 'https://anatomy.ttuhscep.edu/nervous_system/infratemp.html'],
  stylohyoid: ['Temporal styloid — lesser hyoid horn', 'https://anatomy.ttuhscep.edu/anatomytables/joints_alpha.html'],
};
const wordsByPage = {};
for (const [group, q] of Object.entries(questions)) {
  assert.equal(q.correctAnswer, expectedAnswers[group][0], `${group}: factual answer`);
  assert.deepEqual(q.references, [expectedAnswers[group][1]], `${group}: primary reading`);
  for (const key of ['body', 'correctAnswer', 'explanation'])
    assert(typeof q[key] === 'string' && q[key].trim().length > 0, `${group}: ${key}`);
  assert.equal(q.choices.length, 4, group);
  assert(q.choices.every(choice => typeof choice === 'string' && choice.trim().length > 0));
  assert.equal(new Set(q.choices).size, 4, group);
  assert.equal(q.choices.filter(choice => choice === q.correctAnswer).length, 1, group);
  assert.equal(q.references.length, 1, group);
  assert(references.has(q.references[0]), group);
  wordsByPage[q.references[0]] = (wordsByPage[q.references[0]] ?? 0) +
    [q.body, ...q.choices, q.explanation].join(' ').trim().split(/\s+/).length;
}
for (const [page, words] of Object.entries(wordsByPage))
  assert(words <= 200, `${page}: ${words} derived words`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const { identity } of pins.entries) {
  assert.equal(live.salivaryStylohyoidQuizLesson(identity, 'quiz')?.readiness, 'draft');
  for (const tab of feature.contentTabs.filter(tab => tab !== 'quiz'))
    assert.equal(live.salivaryStylohyoidQuizLesson(identity, tab), undefined);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
    assert.equal(live.salivaryStylohyoidQuizLesson(bad, 'quiz'), undefined, `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(live.salivaryStylohyoidQuizLesson(bad, 'quiz'), undefined, `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
    if (at(identity, path).length > 0) {
      const omitted = structuredClone(identity); at(omitted, path).pop();
      assert.equal(live.salivaryStylohyoidQuizLesson(omitted, 'quiz'), undefined,
        `${identity.id}:${path.join('.')} array element omitted`);
      refusedIdentities++;
    }
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(live.salivaryStylohyoidQuizLesson(bad, 'quiz'), undefined, `${identity.id}:${path.join('.') || '<root>'}`);
    refusedIdentities++;
    for (const key of Object.keys(at(identity, path))) {
      const omitted = structuredClone(identity); delete at(omitted, path)[key];
      assert.equal(live.salivaryStylohyoidQuizLesson(omitted, 'quiz'), undefined,
        `${identity.id}:${[...path, key].join('.')} omitted`);
      refusedIdentities++;
    }
  }
  for (const path of pathsWhere(identity, value => Array.isArray(value) && value.length > 1)) {
    const original = at(identity, path);
    const second = original.findIndex((item, index) => index > 0 && JSON.stringify(item) !== JSON.stringify(original[0]));
    if (second < 0) continue;
    const bad = structuredClone(identity), array = at(bad, path);
    [array[0], array[second]] = [array[second], array[0]];
    assert.equal(live.salivaryStylohyoidQuizLesson(bad, 'quiz'), undefined,
      `${identity.id}:${path.join('.')} reordered`);
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSave = 0, forgedApproval = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of feature.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if (wholeEpoch) assert.deepEqual(live.bodyLesson(structure, tab), lesson,
      `${structure.id}:${tab}: whole-current introduction epoch`);
    if (identities.has(structure.id) && tab === 'quiz') {
      const entry = identities.get(structure.id), q = questions[entry.group];
      assert.deepEqual(previous, entry.previous);
      assert.equal(previous.readiness, 'generated-identification');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, feature.bodyLesson(structure, 'quiz'));
      assert.deepEqual(lesson, live.salivaryStylohyoidQuizLesson(structure, 'quiz'));
      assert.deepEqual(live.bodyLesson(structure, 'quiz'), live.salivaryStylohyoidQuizLesson(structure, 'quiz'),
        `${structure.id}: live dispatch`);
      assert.equal(lesson.body, q.body);
      assert.deepEqual(lesson.bullets, [...q.choices]);
      assert.equal(lesson.correctAnswer, q.correctAnswer);
      assert.equal(lesson.explanation, q.explanation);
      assert.deepEqual(lesson.citations, [...q.references]);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      assert.doesNotMatch([lesson.body, lesson.note].join(' '), /approved for clinical use|registered to a patient/i);
      const { readiness, ...content } = lesson;
      assert.deepEqual(feature.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(live.salivaryStylohyoidQuizLesson(structure, tab), copy, 'Fresh lesson arrays');
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      assert.equal(live.salivaryStylohyoidQuizLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await feature.bodyReviewMaterial(structure.id);
  if (wholeEpoch && !working) assert.deepEqual(await live.bodyReviewMaterial(structure.id), packet,
    `${structure.id}: whole-current Review epoch`);
  assert.equal(packet.approval, false);
  if (identities.has(structure.id)) {
    const currentPacket = await live.bodyReviewMaterial(structure.id);
    const context = await live.bodyReviewContext(structure.id);
    const featureContext = await feature.bodyReviewContext(structure.id);
    const priorContext = await old.bodyReviewContext(structure.id);
    const stable = ({ rendererHash, revisions: { geometry, ...revisions }, ...rest }) => ({ ...rest, revisions });
    assert.deepEqual(stable(context), stable(featureContext), `${structure.id}: selected context retained`);
    for (const key of ['source', 'topics', 'reasoning', 'guidedTours', 'checklist', 'atlasLink',
      'limits', 'fingerprints', 'materialHash'])
      assert.deepEqual(currentPacket[key], packet[key], `${structure.id}: current ${key} retained`);
    assert.deepEqual(currentPacket.topics.find(row => row.tab === 'quiz'),
      { tab: 'quiz', ...live.salivaryStylohyoidQuizLesson(structure, 'quiz') });
    assert.equal(currentPacket.approval, false);
    assert.equal(context.rendererHash,
      JSON.parse(readFileSync('content/body-renderer-revision.json', 'utf8')).sha256);
    const geometryInput = { catalogScope: context.catalogScope, structureId: structure.id,
      checklistVersion: context.checklistVersion, source: context.sourceHash,
      renderer: context.rendererHash, checks: context.checklists.geometry };
    assert.equal(context.revisions.geometry, sha256(JSON.stringify(geometryInput)));
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'quiz'),
      previousPacket.topics.filter(row => row.tab !== 'quiz'));
    const withoutTransition = value => {
      const copy = structuredClone(value);
      delete copy.topics;
      delete copy.fingerprints.teaching;
      delete copy.materialHash;
      return copy;
    };
    assert.deepEqual(withoutTransition(packet), withoutTransition(previousPacket),
      `${structure.id}: all other Review fields retained`);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    assert.deepEqual(await feature.parseBodyReviewResponse(packet, structure.id), packet);
    assert.deepEqual(await live.parseBodyReviewResponse(currentPacket, structure.id), currentPacket);
    assert.equal(await live.parseBodyReviewResponse(previousPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'quiz').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'quiz').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'quiz').readiness = 'approved'; },
      value => { value.source.structure.sources = []; },
    ]) {
      const forged = structuredClone(currentPacket); edit(forged);
      assert.equal(await live.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const decision = { catalogScope: context.catalogScope, structureId: structure.id,
      track: 'teaching', expectedVersion: 0, materialHash: priorContext.materialHash,
      revisionHash: priorContext.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: live.blankBodyReview(context, 'teaching') };
    const request = value => new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_SALIVARY_STYLOHYOID_QUIZ' }, body: JSON.stringify(value) });
    const db = { prepare() { storageCalls++; throw Error('Rejected decision reached storage'); } };
    assert.equal((await live.postBodyDecision(request(decision), db)).status, 409);
    stale++;
    const forged = structuredClone(decision);
    forged.materialHash = context.materialHash;
    forged.revisionHash = context.revisions.teaching;
    const foreignCheck = structuredClone(forged);
    foreignCheck.draft.checks.foreign = true;
    assert.equal((await live.postBodyDecision(request(foreignCheck), db)).status, 422);
    forgedSave++;
    forged.draft.status = 'approved';
    assert.equal((await live.postBodyDecision(request(forged), db)).status, 422);
    forgedApproval++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet at introduction`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [6, 9930, 6, 1098]);
assert.deepEqual([malformed, stale, forgedSave, forgedApproval, storageCalls], [24, 6, 6, 6, 0]);
console.log(JSON.stringify({ baseline, introduction, working, wholeEpoch, changed, preserved,
  changedPackets, preservedPackets, refusedIdentities, malformedPacketsRefused: malformed,
  staleRefusalsBeforeStorage: stale, forgedSaveRefusalsBeforeStorage: forgedSave,
  forgedApprovalRefusalsBeforeStorage: forgedApproval, storageCalls, wordsByPage, clinicalApproval: false }));
