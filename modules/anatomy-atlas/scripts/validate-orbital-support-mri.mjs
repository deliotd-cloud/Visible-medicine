import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import Ajv2020 from 'ajv/dist/2020.js';
import { bodyNoteRenderCallback } from './body-note-render-callback.mjs';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { exactOrbitalSupportHistory } from './exact-orbital-support-history.mjs';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import pins from '../content/orbital-support-mri-pins.json' with { type: 'json' };

const parent = '390fc0cec7249d49106cd2bebeeb17bee6989a12';
const introduction = '214cec89'; // Resolved and checked below, never treated as a synthetic override.
const prior = '509b01da5d72f33bd774e4a59d63e2406af1f2ff';
const originalValidatorSha = '1dcf8d6ab30924fa8dc1c6d076ac213dae337df9562c7552e90cabf4927d359b';
const specifications = [
  ['trochlea', 'FMA49067', 'FMA49068'], ['ring', 'FMA49072', 'FMA49073'],
  ['lateralCheck', 'FMA49144', 'FMA49145'], ['medialCheck', 'FMA49147', 'FMA49148'],
  ['upperTarsal', 'FMA59091', 'FMA59092'], ['lowerTarsal', 'FMA59089', 'FMA59090'],
];
const references = [
  'https://pubmed.ncbi.nlm.nih.gov/32241775/', 'https://pubmed.ncbi.nlm.nih.gov/32178233/',
  'https://pubmed.ncbi.nlm.nih.gov/15733302/', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8776787/',
  'https://pubmed.ncbi.nlm.nih.gov/31675425/', 'https://pubmed.ncbi.nlm.nih.gov/12506273/',
  'https://pubmed.ncbi.nlm.nih.gov/6695076/',
];
const evidenceUrl = 'https://pubmed.ncbi.nlm.nih.gov/9537133/';
const checkFamilies = new Set(['lateralCheck', 'medialCheck']);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (args, encoding) => execFileSync('git', args, {
  encoding, maxBuffer: 32e6, windowsHide: true,
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`]);
const introCommit = git(['rev-parse', `${introduction}^{commit}`], 'utf8').trim();
assert.match(introCommit, /^214cec89[a-f0-9]{32}$/);
assert.equal(git(['rev-parse', `${introCommit}^`], 'utf8').trim(), parent);
const fixture = await readFile('scripts/fixtures/validate-orbital-support-mri-original.mjs');
assert.equal(hash(fixture), originalValidatorSha);
assert.deepEqual(fixture, gitBytes(introCommit, 'scripts/validate-orbital-support-mri.mjs'));
assert.deepEqual(await readFile('content/orbital-support-mri-pins.json'),
  gitBytes(introCommit, 'content/orbital-support-mri-pins.json'));

// Historical introduction theorem: compare two real immutable Git application trees.
const old = await exactSourceHistoryApi(parent, 'display-review');
const introduced = await exactSourceHistoryApi(introCommit, 'display-review');
const historical = await exactOrbitalSupportHistory(introCommit);
const originalHelper = historical.helper;
assert.equal(typeof originalHelper.orbitalSupportMriLesson, 'function');
assert.equal(typeof originalHelper.parseBodyReviewResponse, 'function');
assert.deepEqual(originalHelper.orbitalSupportMriReferences, references);
assert.deepEqual(Object.keys(originalHelper.orbitalSupportMriFacts),
  specifications.map(([family]) => family));
assert.equal(originalHelper.orbitalSupportMriLimitations.length, 2);
for (const [family, facts] of Object.entries(originalHelper.orbitalSupportMriFacts)) {
  assert(typeof facts.body === 'string' && facts.body.length > 0, family + ' body');
  assert(typeof facts.distinction === 'string' && facts.distinction.length > 0,
    family + ' distinction');
}
const originalText = family => Object.values(originalHelper.orbitalSupportMriFacts[family]).join(' ');
assert.match(originalText('trochlea'), /microscopy-coil MRI/i);
assert.match(originalText('trochlea'), /routine/i);
assert.match(originalText('ring'), /disagree|disputed/i);
assert.match(originalText('ring'), /apex/i);
for (const family of ['lateralCheck', 'medialCheck']) {
  assert.match(originalText(family), /histology/i);
  assert.match(originalText(family), /not proof|not an MRI-validated/i);
}
for (const family of ['upperTarsal', 'lowerTarsal']) {
  assert.match(originalText(family), /eyelid MRI/i);
  assert.match(originalText(family), /T1- and T2-weighted/i);
}
assert.match(originalHelper.orbitalSupportMriLimitations.join(' '), /partial-volume/i);
assert.match(originalHelper.orbitalSupportMriLimitations.join(' '),
  /absence on a slice is not evidence of absence/i);
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const oldDisplay = old.bodyDisplayCatalog(JSON.parse(gitBytes(parent, catalogPath)));
const introDisplay = introduced.bodyDisplayCatalog(JSON.parse(gitBytes(introCommit, catalogPath)));
assert.deepEqual(introDisplay, oldDisplay);
assert.deepEqual(introduced.structures, old.structures);
assert.deepEqual(introduced.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(introduced.contentTabs, old.contentTabs);
assert.deepEqual(introduced.regionalTours, old.regionalTours);
assert.equal(introduced.regionalTours.length, 42);
assert.equal(introduced.regionalTours.reduce((n, t) => n + t.steps.length, 0), 250);
for (const path of [catalogPath, 'public/models/bodyparts3d/manifest.json',
  'app/anatomy-data.ts', 'app/dissection-data.ts', 'content/review-revisions.json',
  'lib/regional-tours.ts']) assert.deepEqual(gitBytes(introCommit, path), gitBytes(parent, path));

const expectedEntries = specifications.flatMap(([family, ...fmas]) => fmas.map(fma => {
  const matches = oldDisplay.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1, `Historical source identity ${fma}`);
  const identity = matches[0];
  assert.equal(identity.regions.includes('head-neck'), true);
  const previous = old.bodyLesson(identity, 'mri');
  assert.equal(previous.readiness, 'pending');
  return { family, identity, previous };
}));
assert.equal(expectedEntries.length, 12);
assert.equal(new Set(expectedEntries.map(e => e.identity.id)).size, 12);
for (const [family, right, left] of specifications) {
  const pair = expectedEntries.filter(e => e.family === family);
  assert.deepEqual(pair.map(e => e.identity.fmaId), [right, left]);
  assert.deepEqual(new Set(pair.map(e => e.identity.laterality)), new Set(['right', 'left']));
}
const bundles = oldDisplay.bundles.filter(b => expectedEntries.some(e => e.identity.bundle === b.id));
assert.deepEqual(pins, { baseline: parent, sourceVersion: oldDisplay.sourceVersion,
  license: oldDisplay.license, coordinateSystem: oldDisplay.coordinateSystem,
  bundles, entries: expectedEntries });
for (const bundle of bundles) {
  const path = 'public' + new URL(bundle.url, 'https://local.invalid').pathname;
  const bytes = await readFile(path);
  assert.deepEqual(bytes, gitBytes(parent, path));
  assert.deepEqual(bytes, gitBytes(introCommit, path));
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(hash(bytes), bundle.sha256);
}
assert.equal(oldDisplay.structures.length * old.contentTabs.length, 9936);
const historicalTargets = new Map(expectedEntries.map(e => [e.identity.id, e]));
const historicalRequire = createRequire(import.meta.url), historicalReact = historicalRequire('react');
const historicalRender = historicalRequire('react-dom/server').renderToStaticMarkup;
const historicalCallback = bodyNoteRenderCallback(historical.bodyExplorerSource);
const historicalCallbackJs = ts.transpile('const renderNote=' + historicalCallback,
  { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });
const { teachingHeading: historicalHeading,
  SourceDisplayNotes: HistoricalDisplayNotes } = historical.components;
assert.equal(typeof historicalHeading, 'function');
assert.equal(typeof HistoricalDisplayNotes, 'function');
let originalChanges = 0, originalUnchanged = 0, originalRendered = 0;
for (const structure of oldDisplay.structures) for (const tab of old.contentTabs) {
  const before = old.bodyLesson(structure, tab);
  const after = introduced.bodyLesson(structure, tab);
  const target = historicalTargets.get(structure.id);
  const taught = originalHelper.orbitalSupportMriLesson(structure, tab);
  if (target && tab === 'mri') {
    assert.deepEqual(structure, target.identity);
    assert.deepEqual(before, target.previous);
    assert.equal(after.readiness, 'draft');
    assert.deepEqual(after, taught);
    assert.equal(after.body, originalHelper.orbitalSupportMriFacts[target.family].body);
    assert.deepEqual(after.bullets,
      [originalHelper.orbitalSupportMriFacts[target.family].distinction,
        ...originalHelper.orbitalSupportMriLimitations]);
    assert.deepEqual(after.citations, references);
    assert.match(after.note, /Revision-bound radiologist review pending/);
    assert.match(after.note,
      /No scan, patient registration, diagnostic finding or clinical approval is supplied/);
    assert.match(after.note, /Atlas, imaging-case and lecture access remain independent/);
    const { readiness, ...learner } = after;
    assert.deepEqual(introduced.bodyContent(structure, tab), learner);
    const jsx = runInNewContext(historicalCallbackJs + ';renderNote(topic)', {
      React: historicalReact, topic: tab, bodyContent: introduced.bodyContent,
      selected: structure, teachingHeading: historicalHeading,
      SourceDisplayNotes: HistoricalDisplayNotes,
      WorkspaceModeButton: ({ children }) => historicalReact.createElement('button', null, children),
      ComponentImagingNotes: () => null, ScanLine: () => null,
      catalog: introDisplay, side: 'both', exam: false,
      openNested() { throw Error('No automatic specimen navigation'); },
    });
    const html = historicalRender(jsx);
    assert(html.includes(historicalRender(historicalReact.createElement('p', null, after.body))));
    for (const bullet of after.bullets)
      assert(html.includes(historicalRender(historicalReact.createElement('li', null, bullet))));
    for (const url of after.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
    assert(html.includes('No imaging study loaded'));
    assert(html.includes('review pending'));
    originalRendered++;
    originalChanges++;
  } else {
    assert.deepEqual(after, before, `Historical topic drift ${structure.id}|${tab}`);
    assert.equal(taught, undefined);
    originalUnchanged++;
  }
}
assert.equal(originalChanges, 12);
assert.equal(originalUnchanged, 9924);
assert.equal(originalRendered, 12);
const oldRecords = old.bodyContentRecords(oldDisplay);
const introducedRecords = introduced.bodyContentRecords(introDisplay);
assert.equal(oldRecords.length, 1104);
assert.equal(introducedRecords.length, 1104);
const oldById = new Map(oldRecords.map(r => [r.id, r]));
const introStructureById = new Map(introDisplay.structures.map(s => [s.id, s]));
assert.equal(oldById.size, 1104);
assert.equal(introStructureById.size, 1104);
// Preserve the original shape obligation using its actual introduction schema,
// in addition to the current stricter source/identity/teaching registry checks.
const validateHistoricalRecord = await contentValidator(new Map(introducedRecords.map(r =>
  [r.representationScope + '|' + r.id, r])));
const historicalShape = new Ajv2020({ strict: true, allErrors: true }).compile(
  JSON.parse(gitBytes(introCommit, 'content/schema/anatomy-structure.schema.json')));
let originalPackets = 0;
for (const record of introducedRecords) {
  assert(historicalShape(record), 'Original introduction schema: ' + record.id);
  assert(validateHistoricalRecord(record));
  assert.equal(record.validation.clinicalApproval, 'not-included');
  assert.equal(record.validation.materialRevisions.imaging, null);
  const previous = oldById.get(record.id);
  const structure = introStructureById.get(record.id);
  assert(structure, `Historical exported record lacks source ${record.id}`);
  for (const tab of introduced.contentTabs)
    assert.deepEqual(record.content[tab], introduced.bodyLesson(structure, tab),
      `Historical exported topic ${record.id}|${tab}`);
  assert(previous);
  const target = historicalTargets.get(record.id);
  if (!target) assert.deepEqual(record, previous, `Historical record drift ${record.id}`);
  else {
    const expected = structuredClone(previous);
    expected.content.mri = introduced.bodyLesson(target.identity, 'mri');
    assert.deepEqual(record, expected);
    assert.equal(record.validation.clinicalApproval, 'not-included');
    assert.equal(record.validation.materialRevisions.imaging, null);
    originalPackets++;
  }
}
assert.equal(originalPackets, 12);
let originalReviewChanges = 0;
for (const structure of oldDisplay.structures) {
  const before = await old.bodyReviewMaterial(structure.id);
  const after = await introduced.bodyReviewMaterial(structure.id);
  assert(before && after);
  assert.equal(after.approval, false);
  assert.equal(after.status, 'worksheet-not-submitted');
  if (!historicalTargets.has(structure.id)) assert.deepEqual(after, before);
  else {
    const expected = structuredClone(before);
    expected.topics = after.topics;
    expected.fingerprints.teaching = after.fingerprints.teaching;
    expected.materialHash = after.materialHash;
    assert.notEqual(after.fingerprints.teaching, before.fingerprints.teaching);
    assert.notEqual(after.materialHash, before.materialHash);
    assert.deepEqual(after, expected);
    assert.deepEqual(after.topics.find(t => t.tab === 'mri'),
      { tab: 'mri', ...introduced.bodyLesson(structure, 'mri') });
    assert.deepEqual(await originalHelper.parseBodyReviewResponse(after, structure.id), after);
    assert.equal(await originalHelper.parseBodyReviewResponse(before, structure.id), null);
    const tampered = structuredClone(after);
    tampered.topics.find(t => t.tab === 'mri').body += ' foreign';
    assert.equal(await originalHelper.parseBodyReviewResponse(tampered, structure.id), null);
    originalReviewChanges++;
  }
}
assert.equal(originalReviewChanges, 12);

// Enhancement theorem: the already-drafted 509b source is the actual predecessor.
const previous = await exactSourceHistoryApi(prior, 'display-review');
for (const [path, beforeSha, candidateSha] of [
  ['content/orbital-support-mri.ts',
    '4bd812f1ef86e43ebbe219568fe019f0d878102495902028f6e38a5c26e9e8a8',
    '1f83b660c407eda46403a51b321cf2701b9ad1137237753f25b057348d8aa78f'],
  ['lib/orbital-support-mri.ts',
    '2aacd786b9d964a2ba713722f19c81b2cc37460cafcf2f2bdc72181d42366b62',
    '002160fb862a38496a0df3e0184625d4744324ab617250b88d266113ec93db1d'],
]) {
  assert.equal(hash(gitBytes(prior, path)), beforeSha, `Wrong predecessor ${path}`);
  assert.equal(hash(await readFile(path)), candidateSha, `Unreviewed candidate ${path}`);
}
const context = await contentContext(), api = context.api;
const display = api.bodyDisplayCatalog(context.catalog);
const priorDisplay = previous.bodyDisplayCatalog(JSON.parse(gitBytes(prior, catalogPath)));
assert.deepEqual(display, priorDisplay);
assert.deepEqual(api.structures, previous.structures);
assert.deepEqual(api.dissectionProfiles, previous.dissectionProfiles);
assert.deepEqual(api.contentTabs, previous.contentTabs);
for (const path of [catalogPath, 'public/models/bodyparts3d/manifest.json',
  'app/anatomy-data.ts', 'app/dissection-data.ts', 'content/review-revisions.json'])
  assert.deepEqual(await readFile(path), gitBytes(prior, path));
for (const bundle of bundles) {
  const path = 'public' + new URL(bundle.url, 'https://local.invalid').pathname;
  assert.deepEqual(await readFile(path), gitBytes(prior, path));
}
const compiled = await build({ stdin: { contents:
  "export {orbitalSupportMriLesson} from './lib/orbital-support-mri.ts';export {orbitalSupportMriFacts,orbitalSupportMriLimitations,orbitalSupportMriReferences,orbitalSupportMriCheckEvidence} from './content/orbital-support-mri.ts';export {parseBodyReviewResponse} from './lib/body-review-response.ts';",
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false,
  platform: 'node', format: 'esm' });
const helper = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(helper.orbitalSupportMriReferences, references);
assert.deepEqual(helper.orbitalSupportMriFacts, originalHelper.orbitalSupportMriFacts);
assert.deepEqual(helper.orbitalSupportMriLimitations, originalHelper.orbitalSupportMriLimitations);
assert.deepEqual(Object.keys(helper.orbitalSupportMriFacts), specifications.map(([family]) => family));
assert.equal(helper.orbitalSupportMriLimitations.length, 2);
assert.match(helper.orbitalSupportMriLimitations.join(' '), /partial-volume/i);
assert.match(helper.orbitalSupportMriLimitations.join(' '), /absence on a slice is not evidence of absence/i);
assert.equal(helper.orbitalSupportMriCheckEvidence.reference, evidenceUrl);
const evidence = helper.orbitalSupportMriCheckEvidence.note;
for (const pattern of [/four normal volunteers/i, /1 T/i, /surface coil/i,
  /check ligaments/i, /medial or lateral/i, /routine-protocol visibility/i,
  /diagnostic accuracy/i]) assert.match(evidence, pattern);
for (const [family, facts] of Object.entries(helper.orbitalSupportMriFacts)) {
  assert(facts.body && facts.distinction, family);
  const text = `${facts.body} ${facts.distinction}`;
  if (family === 'trochlea') assert.match(text, /microscopy-coil MRI/i);
  if (family === 'ring') assert.match(text, /disagree|disputed/i);
  if (checkFamilies.has(family)) assert.match(text, /histology/i);
  if (family.endsWith('Tarsal')) assert.match(text, /T1- and T2-weighted/i);
}

const currentRecords = api.bodyContentRecords(display);
const priorRecords = previous.bodyContentRecords(priorDisplay);
assert.equal(currentRecords.length, priorRecords.length);
const currentById = new Map(currentRecords.map(r => [r.id, r]));
const priorById = new Map(priorRecords.map(r => [r.id, r]));
assert.equal(currentById.size, currentRecords.length);
assert.equal(priorById.size, priorRecords.length);
const registry = new Map([...context.shoulder, ...currentRecords].map(r =>
  [r.representationScope + '|' + r.id, r]));
const validate = await contentValidator(registry);
const require = createRequire(import.meta.url), React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const presentation = await componentBuild({ stdin: { contents:
  "export {teachingHeading} from './lib/teaching-heading.ts';export {SourceDisplayNotes} from './app/source-display-notes.tsx';",
  resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false,
  platform: 'node', format: 'cjs' });
const scope = { exports: {} };
runInNewContext(presentation.outputFiles[0].text,
  { module: scope, exports: scope.exports, require });
const { teachingHeading, SourceDisplayNotes } = scope.exports;
const callback = bodyNoteRenderCallback(await readFile('app/body-explorer.tsx', 'utf8'));
const callbackJs = ts.transpile('const renderNote=' + callback,
  { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });
let enhancementChanges = 0, enhancementUnchanged = 0, rendered = 0;
for (const structure of display.structures) {
  const record = currentById.get(structure.id), oldRecord = priorById.get(structure.id);
  assert(record && oldRecord && validate(record));
  const expectedRecord = structuredClone(oldRecord);
  const target = historicalTargets.get(structure.id);
  for (const tab of api.contentTabs) {
    const before = previous.bodyLesson(structure, tab);
    const now = api.bodyLesson(structure, tab);
    const taught = helper.orbitalSupportMriLesson(structure, tab);
    if (!target || tab !== 'mri') {
      assert.deepEqual(now, before, `${structure.id}|${tab}`);
      if (tab !== 'mri' || !target) assert.equal(taught, undefined);
      enhancementUnchanged++;
      continue;
    }
    assert.deepEqual(structure, target.identity);
    assert.equal(before.readiness, 'draft');
    assert.equal(now.readiness, 'draft');
    assert.deepEqual(now, taught);
    assert.deepEqual(record.content.mri, now);
    const { readiness, ...learner } = now;
    assert.deepEqual(api.bodyContent(structure, tab), learner);
    assert.equal(now.body, helper.orbitalSupportMriFacts[target.family].body);
    assert.match(now.note, /Revision-bound radiologist review pending/);
    assert.match(now.note, /No scan, patient registration, diagnostic finding or clinical approval is supplied/);
    assert.match(now.note, /Atlas, imaging-case and lecture access remain independent/);
    if (checkFamilies.has(target.family)) {
      assert.deepEqual(now.bullets, [...before.bullets, evidence]);
      assert.deepEqual(now.citations, [...before.citations, evidenceUrl]);
      expectedRecord.content.mri = now;
      enhancementChanges++;
    } else {
      assert.deepEqual(now, before, `${target.family} unexpectedly changed`);
      enhancementUnchanged++;
    }
    const jsx = runInNewContext(callbackJs + ';renderNote(topic)', {
      React, topic: tab, bodyContent: api.bodyContent, selected: structure,
      teachingHeading, SourceDisplayNotes,
      WorkspaceModeButton: ({ children }) => React.createElement('button', null, children),
      ComponentImagingNotes: () => null, ScanLine: () => null,
      catalog: display, side: 'both', exam: false,
      openNested() { throw Error('No automatic specimen navigation'); },
    });
    const html = render(jsx);
    assert(html.includes(render(React.createElement('p', null, now.body))));
    for (const bullet of now.bullets)
      assert(html.includes(render(React.createElement('li', null, bullet))));
    for (const url of now.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
    assert(html.includes('No imaging study loaded'));
    assert(html.includes('review pending'));
    rendered++;
  }
  assert.deepEqual(record, expectedRecord, `${structure.id} exported record drift`);
  assert.equal(record.validation.clinicalApproval, 'not-included');
  assert.equal(record.validation.materialRevisions.imaging, null);
}
assert.equal(enhancementChanges, 4);
assert.equal(enhancementUnchanged, display.structures.length * api.contentTabs.length - 4);
assert.equal(rendered, 12);

// Exact source identity and mutable-result refusals retain the original breadth.
const nodes = (value, path = []) => value === null || typeof value !== 'object'
  ? [{ path, value }]
  : [{ path, value }, ...Object.entries(value).flatMap(([key, part]) =>
    nodes(part, [...path, key]))];
const at = (root, path) => path.reduce((part, key) => part[key], root);
const refuseAtBothEpochs = bad => {
  assert.equal(originalHelper.orbitalSupportMriLesson(bad, 'mri'), undefined);
  assert.equal(helper.orbitalSupportMriLesson(bad, 'mri'), undefined);
};
let identityRejections = 0;
for (const { identity } of expectedEntries) {
  for (const { path, value } of nodes(identity).slice(1)) {
    if (path.length && !(value && typeof value === 'object')) {
      const bad = structuredClone(identity), container = at(bad, path.slice(0, -1));
      container[path.at(-1)] = typeof value === 'number' ? value + .01 :
        typeof value === 'boolean' ? !value : String(value) + '-foreign';
      refuseAtBothEpochs(bad);
      identityRejections++;
    }
    const absent = structuredClone(identity), container = at(absent, path.slice(0, -1));
    if (Array.isArray(container)) container.splice(Number(path.at(-1)), 1);
    else delete container[path.at(-1)];
    refuseAtBothEpochs(absent);
    identityRejections++;
    if (Array.isArray(value)) {
      const extra = structuredClone(identity), array = at(extra, path);
      array.push(array.length ? structuredClone(array[0]) : 'foreign');
      refuseAtBothEpochs(extra);
      identityRejections++;
      if (value.length > 1) {
        const reordered = structuredClone(identity); at(reordered, path).reverse();
        refuseAtBothEpochs(reordered);
        identityRejections++;
      }
    }
  }
  const lesson = helper.orbitalSupportMriLesson(identity, 'mri');
  const pristine = structuredClone(lesson);
  lesson.bullets.push('foreign'); lesson.citations.length = 0;
  assert.deepEqual(helper.orbitalSupportMriLesson(identity, 'mri'), pristine);
  const originalLesson = originalHelper.orbitalSupportMriLesson(identity, 'mri');
  const originalPristine = structuredClone(originalLesson);
  originalLesson.bullets.push('foreign'); originalLesson.citations.length = 0;
  assert.deepEqual(originalHelper.orbitalSupportMriLesson(identity, 'mri'), originalPristine);
}
let reviewChanges = 0, reviewUnchanged = 0, staleRefusals = 0, tamperedRefusals = 0;
for (const structure of display.structures) {
  const before = await previous.bodyReviewMaterial(structure.id);
  const now = await api.bodyReviewMaterial(structure.id);
  assert(before && now);
  assert.equal(now.approval, false);
  assert.equal(now.status, 'worksheet-not-submitted');
  const target = historicalTargets.get(structure.id);
  if (!target || !checkFamilies.has(target.family)) {
    assert.deepEqual(now, before, `Unrelated review packet drift ${structure.id}`);
    reviewUnchanged++;
    continue;
  }
  const expected = structuredClone(before);
  expected.topics = now.topics;
  expected.fingerprints.teaching = now.fingerprints.teaching;
  expected.materialHash = now.materialHash;
  assert.notEqual(now.fingerprints.teaching, before.fingerprints.teaching);
  assert.notEqual(now.materialHash, before.materialHash);
  assert.deepEqual(now, expected);
  assert.deepEqual(now.topics.find(t => t.tab === 'mri'),
    { tab: 'mri', ...api.bodyLesson(structure, 'mri') });
  assert.deepEqual(await helper.parseBodyReviewResponse(now, structure.id), now);
  assert.equal(await helper.parseBodyReviewResponse(before, structure.id), null);
  staleRefusals++;
  const tampered = structuredClone(now);
  tampered.topics.find(t => t.tab === 'mri').body += ' foreign';
  assert.equal(await helper.parseBodyReviewResponse(tampered, structure.id), null);
  tamperedRefusals++; reviewChanges++;
}
assert.equal(reviewChanges, 4);
assert.equal(reviewUnchanged, display.structures.length - 4);
assert.equal(staleRefusals, 4);
assert.equal(tamperedRefusals, 4);
console.log(JSON.stringify({ parent, introduction: introCommit, prior,
  originalChanges, originalUnchanged, originalPackets, originalReviewChanges,
  originalRendered,
  enhancementChanges, enhancementUnchanged, rendered, identityRejections,
  reviewChanges, reviewUnchanged, staleRefusals, tamperedRefusals,
  sourceGeometryChanged: false, clinicalApproval: false, imagesImported: false,
  imagingRegistered: false }));
