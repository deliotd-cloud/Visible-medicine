import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { contentContext, contentValidator, recordKey } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/respiratory-core-depth-pins.json' with { type: 'json' };
import { respiratoryCoreDepthGroups, respiratoryCoreDepthTopics, respiratoryCoreDepthReferences } from '../content/respiratory-core-depth.ts';

const sha = value => createHash('sha256').update(value).digest('hex');
const hash = value => sha(JSON.stringify(value));
const snapshot = (api, display) => ({
  body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })),
  shoulder: api.structures, recipes: api.dissectionProfiles,
});
const expectedGroups = {
  rightLung: ['FMA7309'], leftLung: ['FMA7310'], trachea: ['FMA7394'],
  rightBronchus: ['FMA7395'], leftBronchus: ['FMA7396'],
};
const expectedTabs = { rightLung: ['anatomy'], leftLung: ['anatomy'], trachea: ['anatomy', 'function'],
  rightBronchus: ['anatomy', 'function'], leftBronchus: ['anatomy', 'function'] };
assert.equal(pins.baseline, 'ae13b8de049671e2cac8dd789a6bfb385f147769');
assert.deepEqual(respiratoryCoreDepthGroups, expectedGroups);
assert.equal(pins.entries.length, 5);
assert.deepEqual(pins.entries.map(e => e.group), Object.keys(expectedGroups));
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), Object.values(expectedGroups).flat());
for (const entry of pins.entries) assert.deepEqual(Object.keys(entry.previous), expectedTabs[entry.group]);

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

const compiled = await build({ stdin: { contents: "export {respiratoryCoreDepthLesson} from './lib/respiratory-core-depth'; export {regionalTours} from './lib/regional-tours'; export {sourceCanonical} from './lib/body-source-additions';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { respiratoryCoreDepthLesson: lessonFor, regionalTours, sourceCanonical } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(regionalTours, parent.regionalTours);
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
assert.equal(targets.size, 5);
let changed = 0, unchanged = 0, rejected = 0, copied = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const entry = targets.get(structure.id);
  const before = parent.bodyLesson(structure, tab);
  const current = api.bodyLesson(structure, tab);
  const direct = lessonFor(structure, tab);
  if (!entry || !Object.hasOwn(entry.previous, tab)) {
    assert.equal(direct, undefined, structure.id + '|' + tab);
    assert.deepEqual(current, before, structure.id + '|' + tab);
    unchanged++; continue;
  }
  assert.deepEqual(structure, entry.identity);
  assert.equal(sourceCanonical(structure), sourceCanonical(entry.identity));
  assert.deepEqual(before, entry.previous[tab]);
  const topic = respiratoryCoreDepthTopics[entry.group]?.[tab];
  assert(topic, entry.group + '|' + tab);
  assert(direct);
  assert.notDeepEqual(direct, before);
  assert.equal(direct.readiness, 'draft');
  assert.equal(direct.title, `${structure.name} · ${topic.title} · draft`);
  assert.equal(direct.body, topic.body);
  assert.deepEqual(direct.bullets, [
    ...topic.bullets, `Visible source limit: ${respiratoryCoreDepthTopics[entry.group].limit}${structure.coverageNote ? ' ' + structure.coverageNote : ''}`,
  ]);
  assert.deepEqual(direct.citations, respiratoryCoreDepthTopics[entry.group].references.map(key => respiratoryCoreDepthReferences[key]));
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
assert.equal(changed, 8); assert.equal(copied, 8);
assert.equal(unchanged, 9928);
assert.equal(display.structures.length * api.contentTabs.length, 9936);

// Shape validation is bound to the baseline source registry, never a registry
// manufactured from the edited draft or its source identity.
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
  assert.equal(record.validation.clinicalApproval, 'not-included');
  for (const tab of Object.keys(entry.previous)) {
    assert.deepEqual(record.content[tab], api.bodyLesson(entry.identity, tab));
    for (const mutate of [
      bad => { bad.content[tab].body = ''; },
      bad => { delete bad.content[tab].title; },
      bad => { bad.content[tab].readiness = 'approved'; },
      bad => { bad.content[tab].citations = 'https://foreign.example'; },
      bad => { bad.content[tab].unexpectedApproval = true; },
    ]) { const bad = structuredClone(record); mutate(bad); assert.throws(() => validate(bad), entry.identity.id + '|' + tab); rejected++; }
  }
  for (const mutate of [
    bad => { bad.meshBindings[0].nodeName += '-foreign'; },
    bad => { bad.meshBindings[0].sources = []; },
    bad => { bad.provenance.citation += '-foreign'; },
  ]) { const bad = structuredClone(record); mutate(bad); assert.throws(() => validate(bad), entry.identity.id); rejected++; }
}

const refuse = (identity, label) => {
  for (const tab of ['anatomy', 'function']) {
    assert.equal(lessonFor(identity, tab), undefined, label + '|' + tab);
    rejected++;
  }
};
for (const { identity } of pins.entries) {
  for (const field of Object.keys(identity)) {
    const missing = structuredClone(identity); delete missing[field]; refuse(missing, 'missing ' + field);
    if (field === 'sources') continue;
    const changedSource = structuredClone(identity);
    const old = changedSource[field];
    changedSource[field] = typeof old === 'string' ? old + '-foreign' : Array.isArray(old) ? [...old, 'foreign'] : { ...old, unexpected: true };
    refuse(changedSource, 'changed ' + field);
  }
  for (const [label, mutate] of [
    ['foreign field', bad => { bad.unexpectedSourceField = true; }],
    ['nested region', bad => { bad.regions[0] = 'foreign'; }],
    ['nested bound', bad => { bad.bounds.min[0] += .01; }],
    ['nested provenance', bad => { bad.provenance.unexpected = true; }],
    ['nested validation', bad => { bad.validation.unexpected = true; }],
    ['source file', bad => { bad.sources[0].file += 'M'; }],
    ['source sha', bad => { bad.sources[0].sha256 = '0'.repeat(64); }],
    ['source extra', bad => { bad.sources[0].unexpected = true; }],
    ['source missing field', bad => { delete bad.sources[0].sha256; }],
    ['source appended', bad => { bad.sources.push(structuredClone(bad.sources[0])); }],
    ...(identity.sources.length > 1 ? [['source reordered', bad => { bad.sources.reverse(); }]] : []),
  ]) { const bad = structuredClone(identity); mutate(bad); refuse(bad, label); }
}
assert.equal(lessonFor(pins.entries[0].identity, 'quiz'), undefined);
assert.equal(lessonFor({ ...pins.entries[0].identity, id: 'foreign' }, 'anatomy'), undefined);
console.log(JSON.stringify({ changed, unchanged, rejected, copied, clinicalApproval: false }));
