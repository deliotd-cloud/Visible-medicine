import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {contentContext} from './content-contract-tools.mjs';
import {authoringBeforeDeepBrainCore as history} from './deep-brain-core-teaching-history.mjs';
import {authoringBeforeFootSurfaceImaging} from './foot-surface-imaging-history.mjs';
const current = await contentContext(), catalog = current.catalog;
const api = authoringBeforeFootSurfaceImaging({api: current.api, catalog});
const pins = JSON.parse(readFileSync('content/deep-brain-core-teaching-pins.json'));
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const display = api.bodyDisplayCatalog(catalog);
const snapshot = value => ({catalog: display, body: display.structures.map(s => ({id: s.id, topics: Object.fromEntries(value.contentTabs.map(t => [t, value.bodyLesson(s, t)]))})), shoulder: value.structures, recipes: value.dissectionProfiles});
const liveHash = hash(snapshot(api)), prior = history({api, catalog});
assert.equal(hash(snapshot(prior)), pins.beforeAllTeachingSnapshotHash);
assert.equal(history({api: prior, catalog}), prior);
for (const {identity, previous} of pins.entries) for (const [tab, lesson] of Object.entries(previous)) {
  assert.deepEqual(prior.bodyLesson(identity, tab), lesson);
  const exposed = prior.bodyLesson(identity, tab); exposed.body += ' foreign';
  assert.deepEqual(prior.bodyLesson(identity, tab), lesson);
  const foreign = structuredClone(identity); foreign.sources[0].sha256 = 'foreign';
  assert.throws(() => prior.bodyLesson(foreign, tab), /exact source identity/);
}
const first = pins.entries[0], tab = Object.keys(first.previous)[0];
const mixed = {...api, bodyLesson(s, t) {return s.id === first.identity.id && t === tab ? structuredClone(first.previous[t]) : api.bodyLesson(s, t);}};
mixed.bodyContent = (s, t) => {const {readiness, ...shown} = mixed.bodyLesson(s, t); return shown;};
assert.throws(() => history({api: mixed, catalog}), /Mixed deep-brain history/);
assert.throws(() => history({api: {...api, deepBrainCoreLesson() {return {body: 'foreign'};}}, catalog}), /Unrecorded deep-brain draft/);
const foreignCatalog = structuredClone(catalog);
foreignCatalog.structures.find(s => s.id === first.identity.id).sources[0].sha256 = 'foreign';
// The display resolver rejects the corrupt raw source before this adapter runs.
assert.throws(() => history({api, catalog: foreignCatalog}), /^Error: Additional anatomy source binding changed; review required$/);
const foreignDisplay = structuredClone(display);
foreignDisplay.structures.find(s => s.id === first.identity.id).sources[0].sha256 = 'foreign';
assert.throws(() => history({api: {...api, bodyDisplayCatalog() {return foreignDisplay;}}, catalog}), /Unrecorded deep-brain identity/);
assert.equal(hash(snapshot(api)), liveHash);
console.log(JSON.stringify({restoredTopics: 10, baselineSnapshotExact: true, mixedAndForeignRefused: true, liveTeachingUnchanged: true}));
