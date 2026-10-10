import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {contentContext} from './content-contract-tools.mjs';
import {authoringBeforeWristImagingCorrection as history} from './wrist-imaging-correction-history.mjs';
import {authoringBeforeToeBoneUltrasound} from './toe-bone-ultrasound-history.mjs';
import {authoringBeforeFootUltrasoundFollowup} from './foot-ultrasound-followup-history.mjs';
import {authoringBeforeShoulderGirdleArterialUltrasound} from './shoulder-girdle-arterial-ultrasound-history.mjs';
const {api: current, catalog} = await contentContext();
// Explicitly reverse the newer independent scope; never expand wrist history.
const beforeShoulder = authoringBeforeShoulderGirdleArterialUltrasound({api: current, catalog});
const beforeFoot = authoringBeforeFootUltrasoundFollowup({api: beforeShoulder, catalog});
const api = authoringBeforeToeBoneUltrasound({api: beforeFoot, catalog});
const pins = JSON.parse(readFileSync('content/wrist-imaging-correction-pins.json'));
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const display = api.bodyDisplayCatalog(catalog);
const snapshot = value => ({catalog: display, body: display.structures.map(s => ({id: s.id, topics: Object.fromEntries(value.contentTabs.map(t => [t, value.bodyLesson(s, t)]))})), shoulder: value.structures, recipes: value.dissectionProfiles});
const liveHash = hash(snapshot(api)), prior = history({api, catalog});
assert.equal(hash(snapshot(prior)), pins.beforeAllTeachingSnapshotHash);
assert.equal(history({api: prior, catalog}), prior);
for (const {identity, previous} of pins.entries) for (const [tab, lesson] of Object.entries(previous)) {
  assert.deepEqual(prior.bodyLesson(identity, tab), lesson);
  const foreign = structuredClone(identity); foreign.sources[0].sha256 += '-foreign';
  assert.throws(() => prior.bodyLesson(foreign, tab), /exact source identity/);
  const exposed = prior.bodyLesson(identity, tab); exposed.bullets.push('foreign'); exposed.citations.push('foreign');
  assert.deepEqual(prior.bodyLesson(identity, tab), lesson);
}
const first = pins.entries[0];
const mixed = {...api, bodyLesson(s, tab) {return s.id === first.identity.id && tab === 'ct' ? structuredClone(first.previous.ct) : api.bodyLesson(s, tab);}};
mixed.bodyContent = (s, tab) => {const {readiness, ...shown} = mixed.bodyLesson(s, tab); return shown;};
assert.throws(() => history({api: mixed, catalog}), /Mixed wrist correction history/);
assert.throws(() => history({api: {...api, bodyLesson(s, tab) {const value = api.bodyLesson(s, tab); return s.id === first.identity.id && tab === 'ct' ? {...value, body: 'foreign'} : value;}}, catalog}), /Unrecorded wrist correction history/);
const foreignCatalog = structuredClone(catalog); foreignCatalog.structures.find(s => s.id === first.identity.id).sources[0].sha256 += '-foreign';
assert.throws(() => history({api, catalog: foreignCatalog}), /Unrecorded wrist correction identity/);
assert.equal(hash(snapshot(api)), liveHash);
console.log(JSON.stringify({restoredTopics: 48, baselineSnapshotExact: true, mixedAndForeignRefused: true, liveTeachingUnchanged: true}));
