import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/suprascapular-vessel-ultrasound-pins.json' with {type: 'json'};
import transition from '../content/suprascapular-vessel-ultrasound.transition.json' with {type: 'json'};
import {contentContext} from './content-contract-tools.mjs';
import {authoringBeforeSuprascapularVesselUltrasound as history} from './suprascapular-vessel-ultrasound-history.mjs';
import {authoringBeforeDeepBrainCore} from './deep-brain-core-teaching-history.mjs';
import {authoringBeforeFootSurfaceImaging} from './foot-surface-imaging-history.mjs';
const current = await contentContext(), catalog = current.catalog;
const api = authoringBeforeDeepBrainCore({api: authoringBeforeFootSurfaceImaging({api: current.api, catalog}), catalog});
const prior = history({api, catalog}), display = api.bodyDisplayCatalog(catalog);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = value => ({catalog: display, body: display.structures.map(s => ({id: s.id, topics: Object.fromEntries(value.contentTabs.map(t => [t, value.bodyLesson(s, t)]))})), shoulder: value.structures, recipes: value.dissectionProfiles});
const currentHash = hash(snapshot(api));
assert.equal(hash(snapshot(prior)), pins.beforeAllTeachingSnapshotHash);
for (const entry of pins.entries) {
  assert.deepEqual(prior.bodyLesson(entry.identity, 'ultrasound'), entry.previous);
  const lesson = prior.bodyLesson(entry.identity, 'ultrasound'); lesson.body += ' foreign';
  assert.deepEqual(prior.bodyLesson(entry.identity, 'ultrasound'), entry.previous);
  assert.deepEqual(prior.bodyLesson(entry.identity, 'mri'), api.bodyLesson(entry.identity, 'mri'));
  const foreign = structuredClone(entry.identity); foreign.sources[0].sha256 = 'foreign';
  assert.throws(() => prior.bodyLesson(foreign, 'ultrasound'), /exact source identity/);
}
assert.equal(history({api: prior, catalog}), prior);
const first = pins.entries[0];
const partial = {...api, bodyLesson(s, tab) {return s.id === first.identity.id && tab === 'ultrasound' ? structuredClone(first.previous) : api.bodyLesson(s, tab);}};
partial.bodyContent = (s, tab) => {const {readiness, ...shown} = partial.bodyLesson(s, tab); return shown;};
assert.throws(() => history({api: partial, catalog}), /Mixed suprascapular history/);
assert.throws(() => history({api: {...api, suprascapularVesselUltrasoundLesson() {return {body: 'foreign'};}}, catalog}), /Unrecorded suprascapular draft/);
const foreignCatalog = structuredClone(catalog);
foreignCatalog.structures.find(s => s.id === first.identity.id).sources[0].sha256 = 'foreign';
assert.throws(() => history({api, catalog: foreignCatalog}), /Unrecorded suprascapular source identity/);
const reason = transition.reason; transition.reason += ' foreign';
try {assert.throws(() => history({api, catalog}));} finally {transition.reason = reason;}
const baseline = pins.baseline; pins.baseline = 'foreign';
try {assert.throws(() => history({api, catalog}));} finally {pins.baseline = baseline;}
assert.equal(hash(snapshot(api)), currentHash);
console.log(JSON.stringify({previousLessonsReconstructed: 4, entireBaselineRestored: true, mixedAndForeignHistoryRefused: true, liveTeachingUnchanged: true}));
