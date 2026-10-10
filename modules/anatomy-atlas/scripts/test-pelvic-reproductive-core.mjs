import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { contentContext, contentValidator, recordKey } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/pelvic-reproductive-core-pins.json' with { type: 'json' };
import { pelvicReproductiveCoreGroups, pelvicReproductiveCoreTopics, pelvicReproductiveCoreReferences } from '../content/pelvic-reproductive-core.ts';

const sha = value => createHash('sha256').update(value).digest('hex');
const hash = value => sha(JSON.stringify(value));
const snapshot = (api, display) => ({
  body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })),
  shoulder: api.structures, recipes: api.dissectionProfiles,
});
assert.equal(pins.baseline, '3d1d0f862d2e7567d298bc89690b11bf38ca3326');
const { api, catalog, shoulder } = await contentContext();
const display = api.bodyDisplayCatalog(catalog);
const parent = await exactSourceHistoryApi(pins.baseline, 'review-security');
assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.equal(display.sourceVersion, pins.sourceVersion);
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.structures, parent.structures);
assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha(bytes), bundle.sha256);
}

const compiled = await build({ stdin: { contents: "export {pelvicReproductiveCoreLesson} from './lib/pelvic-reproductive-core'; export {regionalTours} from './lib/regional-tours';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { pelvicReproductiveCoreLesson: lessonFor, regionalTours } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(regionalTours, parent.regionalTours);
const expectedGroups = {
  prostate: ['FMA9600'], testis: ['FMA7211', 'FMA7212'],
  seminalVesicle: ['FMA19387', 'FMA19388'], epididymis: ['FMA18256', 'FMA18257'],
  urethra: ['FMA19667'],
};
assert.deepEqual(pelvicReproductiveCoreGroups, expectedGroups);
assert.equal(pins.entries.length, 8);
assert.deepEqual(pins.entries.map(e => e.group), Object.entries(expectedGroups).flatMap(([group, ids]) => ids.map(() => group)));
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), Object.values(expectedGroups).flat());
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
assert.equal(targets.size, 8);
const changedTabs = new Set(['anatomy', 'function']);
let changed = 0, unchanged = 0, rejected = 0, copied = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const entry = targets.get(structure.id);
  const before = parent.bodyLesson(structure, tab);
  const current = api.bodyLesson(structure, tab);
  const direct = lessonFor(structure, tab);
  if (!entry || !changedTabs.has(tab)) {
    assert.equal(direct, undefined, structure.id + '|' + tab);
    assert.deepEqual(current, before, structure.id + '|' + tab);
    unchanged++; continue;
  }
  assert.deepEqual(structure, entry.identity);
  assert.deepEqual(before, entry.previous[tab]);
  const topic = pelvicReproductiveCoreTopics[entry.group]?.[tab];
  assert(topic, entry.group + '|' + tab);
  assert(direct);
  assert.notDeepEqual(direct, before);
  assert.equal(direct.readiness, 'draft');
  assert.equal(direct.title, `${structure.name} · ${topic.title} · draft`);
  assert.equal(direct.body, topic.body);
  assert.deepEqual(direct.bullets, [
    ...topic.bullets, `Visible source limit: ${pelvicReproductiveCoreTopics[entry.group].limit}${structure.coverageNote ? ' ' + structure.coverageNote : ''}`,
  ]);
  assert.deepEqual(direct.citations, pelvicReproductiveCoreTopics[entry.group].references.map(key => pelvicReproductiveCoreReferences[key]));
  assert(direct.body.trim()); assert(direct.bullets.every(b => b.trim()));
  assert(direct.citations.every(url => /^https:\/\//.test(url)));
  assert.match(direct.note, /radiologist review pending/i);
  assert.deepEqual(current, direct);
  const { readiness: _readiness, ...shown } = direct;
  assert.deepEqual(api.bodyContent(structure, tab), shown);
  const pristine = structuredClone(direct);
  direct.bullets.push('foreign'); direct.citations.push('https://foreign.example');
  assert.deepEqual(lessonFor(structure, tab), pristine);
  copied++; changed++;
}
assert.equal(changed, 16); assert.equal(copied, 16);
assert.equal(unchanged, display.structures.length * api.contentTabs.length - 16);
assert.equal(unchanged, 9920);

// Validate every exported current record against baseline source bindings, not
// merely against a registry manufactured from the same edited content.
const parentRecords = parent.bodyContentRecords(parent.bodyDisplayCatalog(catalog));
const trusted = new Map(shoulder.map(record => [recordKey(record), record]));
for (const record of parentRecords) {
  if (targets.has(record.id)) assert.equal(record.validation.materialRevisions.teaching, null);
  assert(!trusted.has(recordKey(record)), 'Duplicate baseline source identity');
  trusted.set(recordKey(record), record);
}
const validate = await contentValidator(trusted);
const records = api.bodyContentRecords(display);
assert.equal(records.length, display.structures.length);
assert.equal(trusted.size, parentRecords.length + shoulder.length);
assert.equal(trusted.size, records.length + shoulder.length);
for (const record of [...shoulder, ...records]) assert(validate(record));
for (const entry of pins.entries) {
  const record = records.find(r => r.id === entry.identity.id);
  assert(record);
  assert.deepEqual(record.content.anatomy, api.bodyLesson(entry.identity, 'anatomy'));
  assert.deepEqual(record.content.function, api.bodyLesson(entry.identity, 'function'));
  assert.equal(record.validation.clinicalApproval, 'not-included');
  for (const tab of changedTabs) for (const mutate of [
    bad => { bad.content[tab].body = ''; },
    bad => { delete bad.content[tab].title; },
    bad => { bad.content[tab].readiness = 'approved'; },
    bad => { bad.content[tab].citations = 'https://foreign.example'; },
    bad => { bad.content[tab].unexpectedApproval = true; },
  ]) {
    const bad = structuredClone(record); mutate(bad);
    assert.throws(() => validate(bad), entry.identity.id + '|' + tab);
    rejected++;
  }
  for (const mutate of [
    bad => { bad.meshBindings[0].nodeName += '-foreign'; },
    bad => { bad.meshBindings[0].sources = []; },
    bad => { bad.provenance.citation += '-foreign'; },
  ]) {
    const bad = structuredClone(record); mutate(bad);
    assert.throws(() => validate(bad), entry.identity.id);
    rejected++;
  }
}

const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
for (const { identity } of pins.entries) {
  for (const path of leaves(identity)) {
    const bad = structuredClone(identity); let parentObject = bad;
    for (const key of path.slice(0, -1)) parentObject = parentObject[key];
    const key = path.at(-1), old = parentObject[key];
    parentObject[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';
    for (const tab of changedTabs) { assert.equal(lessonFor(bad, tab), undefined, path.join('.') + '|' + tab); rejected++; }
  }
  for (const key of Object.keys(identity)) {
    const bad = structuredClone(identity); delete bad[key];
    for (const tab of changedTabs) { assert.equal(lessonFor(bad, tab), undefined, 'missing ' + key); rejected++; }
  }
  for (const bad of [
    { ...identity, unexpectedSourceField: true },
    { ...identity, id: 'foreign' },
    { ...identity, sources: [] },
    { ...identity, sources: [...identity.sources, structuredClone(identity.sources[0])] },
    ...(identity.sources.length > 1 ? [{ ...identity, sources: [...identity.sources].reverse() }] : []),
  ]) for (const tab of changedTabs) { assert.equal(lessonFor(bad, tab), undefined); rejected++; }
}
assert.equal(lessonFor(pins.entries[0].identity, 'quiz'), undefined);
console.log(JSON.stringify({ changed, unchanged, rejected, copied, clinicalApproval: false }));
