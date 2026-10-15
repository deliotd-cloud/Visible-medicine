import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '0a267a65c3855b87d3d01d2ed28279de5415bc93';
const catalogPath = 'public/models/bodyparts3d/short-ciliary/catalog.json';
const fullCatalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const id = 'vm:anatomy:body:head-neck:unspecified:nerve:short-ciliary-nerve';
const git = (args, options = {}) => execFileSync('git', args, {
  encoding: 'utf8', windowsHide: true, maxBuffer: 64e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}, ...options,
});
const gitBytes = path => git(['show', `${baseline}:${path}`], {encoding: null});
const normalizedText = bytes => bytes.toString('utf8').replaceAll('\r\n', '\n');
const unchangedJson = path => {
  const bytes = readFileSync(path);
  assert.equal(normalizedText(bytes), normalizedText(gitBytes(path)), `${path}: baseline unchanged`);
  return JSON.parse(bytes.toString('utf8'));
};
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

assert.equal(git(['rev-parse', `${baseline}^{commit}`]).trim(), baseline);
const raw = unchangedJson(catalogPath);
const fullRaw = unchangedJson(fullCatalogPath);
assert.equal(raw.structures.length, 1);
const identity = raw.structures[0];
assert.equal(identity.id, id);
assert.equal(identity.fmaId, 'FMA7041');
assert.equal(identity.nodeName, 'FMA7041');
assert.equal(identity.laterality, 'unspecified');
assert.equal(identity.bundle, 'short-ciliary');
assert.equal(identity.sourceTree, 'isa');
assert.deepEqual(identity.sources.map(source => source.file), ['FJ1319', 'FJ1370']);
assert.deepEqual(identity.presentationParts.map(part => part.displaySide), ['left', 'right']);
assert.equal(identity.validation.status, 'unvalidated');
assert.equal(identity.validation.anatomicalReview, false);
assert.equal(raw.clinicalApproval, false);

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents: [
    "export {shortCiliaryQuizLesson} from './lib/short-ciliary-quiz';",
    "export {shortCiliaryQuizQuestions} from './content/short-ciliary-quiz';",
    "export {bodyLesson,bodyContent} from './app/body-content';",
    "export {bodyDisplayCatalog} from './lib/body-display-catalog';",
    "export {contentTabs} from './lib/content-types';",
    "export {structures} from './app/anatomy-data';",
    "export {dissectionProfiles} from './app/dissection-data';",
    "export {regionalTours} from './lib/regional-tours';",
    "export * from './lib/body-review-material';",
    "export * from './lib/body-review-context';",
    "export * from './lib/body-review-response';",
    "export * from './lib/body-review-api';",
    "export * from './lib/body-review-decisions';",
  ].join(''), resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm', metafile: true,
});
for (const path of ['lib/short-ciliary-quiz.ts', 'content/short-ciliary-quiz.ts',
  'app/body-content.ts', 'lib/body-review-api.ts'])
  assert(Object.keys(compiled.metafile.inputs).some(input => input.replaceAll('\\', '/').endsWith(path)),
    `Actual source missing from bundle: ${path}`);
const now = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = now.bodyDisplayCatalog(fullRaw);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(fullCatalogPath))));
assert.deepEqual(catalog.structures.find(structure => structure.id === id), identity);
assert.deepEqual(now.structures, old.structures);
assert.deepEqual(now.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(now.regionalTours, old.regionalTours);
assert.deepEqual(now.contentTabs, old.contentTabs);
assert.equal(catalog.structures.length, 1104);
assert.equal(now.contentTabs.length, 9);
assert.equal(catalog.structures.length * now.contentTabs.length, 9936);

const authored = now.shortCiliaryQuizQuestions;
assert.equal(authored.length, 4);
assert.deepEqual(authored.map(question => question.key),
  ['mixed-fibres', 'sensory-synapse', 'accommodation', 'source-components']);
const questions = Object.fromEntries(authored.map(question => [question.key, question]));
for (const [key, question] of Object.entries(questions)) {
  assert.equal(typeof question.body, 'string', key);
  assert(question.body.trim(), key);
  assert.equal(question.choices.length, 4, key);
  assert.equal(new Set(question.choices).size, 4, key);
  assert(question.choices.every(choice => typeof choice === 'string' && choice.trim()), key);
  assert.equal(question.choices.filter(choice => choice === question.correctAnswer).length, 1, key);
  assert.equal(typeof question.explanation, 'string', key);
  assert(question.explanation.trim(), key);
  assert(question.references.length > 0, key);
  assert(question.references.every(url => /^https:\/\//.test(url)), key);
}

assert.equal(old.bodyLesson(identity, 'quiz').readiness, 'pending');
const selected = now.shortCiliaryQuizLesson(structuredClone(identity), 'quiz');
assert(selected, 'Exactly cloned source identity resolves');
assert.equal(selected.readiness, 'draft');
assert.deepEqual(now.bodyLesson(identity, 'quiz'), selected);
assert.deepEqual(selected.bullets, [...questions['mixed-fibres'].choices]);
assert.equal(selected.body, questions['mixed-fibres'].body);
assert.equal(selected.correctAnswer, questions['mixed-fibres'].correctAnswer);
assert.equal(selected.explanation, questions['mixed-fibres'].explanation);
assert.deepEqual(selected.citations, [...questions['mixed-fibres'].references]);
assert.deepEqual(selected.additionalChecks.map(check => check.key),
  ['sensory-synapse', 'accommodation', 'source-components']);
for (const check of selected.additionalChecks) {
  const q = questions[check.key];
  assert.equal(check.body, q.body);
  assert.deepEqual(check.bullets, [...q.choices]);
  assert.equal(check.correctAnswer, q.correctAnswer);
  assert.equal(check.explanation, q.explanation);
  assert.deepEqual(check.citations, [...q.references]);
  assert(check.note && check.note.trim());
}
assert.match(selected.note, /(?:exact.revision|revision.bound) radiologist review pending/i);
assert.match(selected.note, /Atlas/i);
assert.match(selected.note, /case/i);
assert.match(selected.note, /lecture/i);
assert.match(selected.note, /independent/i);
assert.doesNotMatch(JSON.stringify(selected), /approved for clinical use|diagnostic threshold|verified continuity/i);
const {readiness, ...displayed} = selected;
assert.deepEqual(now.bodyContent(identity, 'quiz'), displayed);
const cleanLesson = structuredClone(selected);
selected.bullets.push('foreign');
selected.citations.push('https://foreign.example');
selected.additionalChecks[0].bullets.push('foreign');
selected.additionalChecks[0].citations.push('https://foreign.example');
assert.deepEqual(now.shortCiliaryQuizLesson(identity, 'quiz'), cleanLesson, 'Fresh lesson and check arrays');
for (const tab of now.contentTabs) if (tab !== 'quiz')
  assert.equal(now.shortCiliaryQuizLesson(identity, tab), undefined);
for (const structure of catalog.structures) if (structure.id !== id)
  assert.equal(now.shortCiliaryQuizLesson(structure, 'quiz'), undefined, structure.id);
assert.equal(now.shortCiliaryQuizLesson({id}, 'quiz'), undefined, 'ID alone cannot authorize quiz');

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const refuse = (bad, label) => {
  assert.equal(now.shortCiliaryQuizLesson(bad, 'quiz'), undefined, label);
  refusedIdentities++;
};
for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
  const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
  const key = path.at(-1), original = parent[key];
  parent[key] = typeof original === 'string' ? original + '-foreign'
    : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
  refuse(bad, path.join('.'));
}
for (const path of pathsWhere(identity, Array.isArray)) {
  const bad = structuredClone(identity); at(bad, path).push('foreign');
  refuse(bad, path.join('.') + ': appended array item');
  if (at(identity, path).length > 1) {
    const reordered = structuredClone(identity); at(reordered, path).reverse();
    if (JSON.stringify(at(reordered, path)) !== JSON.stringify(at(identity, path)))
      refuse(reordered, path.join('.') + ': reordered array');
  }
}
for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
  const bad = structuredClone(identity); at(bad, path).unexpected = true;
  refuse(bad, (path.join('.') || '<root>') + ': extra field');
  for (const key of Object.keys(at(identity, path))) {
    const omitted = structuredClone(identity); delete at(omitted, path)[key];
    refuse(omitted, [...path, key].join('.') + ': omitted');
  }
}
assert(refusedIdentities > 100);

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = now.bodyLesson(structure, tab);
    if (structure.id === id && tab === 'quiz') {
      assert.deepEqual(lesson, cleanLesson); changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`); preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await now.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (structure.id === id) {
    assert.deepEqual(packet.topics.filter(topic => topic.tab !== 'quiz'),
      previousPacket.topics.filter(topic => topic.tab !== 'quiz'));
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], key);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'), {tab: 'quiz', ...cleanLesson});
    assert.deepEqual(await now.parseBodyReviewResponse(packet, id), packet);
    assert.equal(await now.parseBodyReviewResponse(previousPacket, id), null);
    for (const edit of [
      value => { value.topics.find(topic => topic.tab === 'quiz').correctAnswer = 'foreign'; },
      value => { value.topics.find(topic => topic.tab === 'quiz').additionalChecks[0].correctAnswer = 'foreign'; },
      value => { value.topics.find(topic => topic.tab === 'quiz').additionalChecks[0].citations = ['https://foreign.example']; },
      value => { value.topics.find(topic => topic.tab === 'quiz').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(topic => topic.tab === 'quiz'), 1); },
      value => { value.source.structure.sources[0].sha256 = '0'.repeat(64); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await now.parseBodyReviewResponse(forged, id), null); malformed++;
    }
    const priorContext = await old.bodyReviewContext(id), context = await now.bodyReviewContext(id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {catalogScope: context.catalogScope, structureId: id,
      track: 'teaching', expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: now.blankBodyReview(context, 'teaching')};
    const save = async input => now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_SHORT_CILIARY_QUIZ'}, body: JSON.stringify(input),
    }), {prepare() { storageCalls++; throw Error('Invalid decision reached storage'); }});
    for (const hashes of [
      {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
      {materialHash: priorContext.materialHash}, {revisionHash: priorContext.revisions.teaching},
    ]) { assert.equal((await save({...decision, ...hashes})).status, 409); stale++; }
    const forged = structuredClone(decision); forged.draft.checks.foreign = true;
    assert.equal((await save(forged)).status, 422); forgedSaves++;
    const approval = structuredClone(decision); approval.draft.status = 'approved';
    assert.equal((await save(approval)).status, 422); forgedApprovals++;
    changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [1, 9935, 1, 1103]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [6, 3, 1, 1, 0]);

for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts', 'lib/regional-tours.ts'])
  assert.equal(normalizedText(readFileSync(path)), normalizedText(gitBytes(path)),
    `${path}: historical anatomy/dissection/tours unchanged`);
const nestedPaths = git(['ls-tree', '-r', '--name-only', baseline, '--', 'app', 'lib', 'content'])
  .split(/\r?\n/).filter(path => /(?:nested|specimen)/i.test(path));
assert(nestedPaths.length > 0);
for (const path of nestedPaths)
  assert.equal(normalizedText(readFileSync(path)), normalizedText(gitBytes(path)),
    `${path}: nested/specimen unchanged`);
for (const bundle of raw.bundles) {
  const path = 'public' + bundle.url.split('?')[0], bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(path), `${path}: source geometry unchanged`);
}
console.log(JSON.stringify({baseline, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves,
  forgedApprovalsRefusedBeforeStorage: forgedApprovals, storageCalls,
  sourceBundlesUnchanged: raw.bundles.length, clinicalApproval: false,
  limitations: 'Educational quiz and source/review regression only; no scans, registration, radiologist sign-off or clinical validation.'}));
