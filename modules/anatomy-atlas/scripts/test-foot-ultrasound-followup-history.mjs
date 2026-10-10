import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {contentContext} from './content-contract-tools.mjs';
import {authoringBeforeFootUltrasoundFollowup as history} from './foot-ultrasound-followup-history.mjs';
import {authoringBeforeToeBoneUltrasound} from './toe-bone-ultrasound-history.mjs';
import {authoringBeforeShoulderGirdleArterialUltrasound} from './shoulder-girdle-arterial-ultrasound-history.mjs';

const REQUIRED_PIN_HASH = '87df5b06e49b9f5fa28dcaf226fd582fa5e9f7eb8b80a40301190906a811a48d';
const REQUIRED_TRANSITION_HASH = 'f0bf6ae655f55e959dd0a4ff38269232dccc7a6c32d0cbbc2369f9cdd88fe193';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pins = JSON.parse(readFileSync('content/foot-ultrasound-followup-pins.json'));
const transition = JSON.parse(readFileSync('content/foot-ultrasound-followup.transition.json'));
assert.equal(hash(pins), REQUIRED_PIN_HASH);
assert.equal(hash(transition), REQUIRED_TRANSITION_HASH);
assert.equal(transition.sourcePinsHash, hash(pins));
const {api: latest, catalog} = await contentContext();
const current = authoringBeforeShoulderGirdleArterialUltrasound({api: latest, catalog});
const display = current.bodyDisplayCatalog(catalog);
const snapshot = api => ({
  catalog: display,
  body: display.structures.map(s => ({
    id: s.id,
    topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(s, tab)])),
  })),
  shoulder: api.structures,
  recipes: api.dissectionProfiles,
});
const currentHash = hash(snapshot(current));
const prior = history({api: current, catalog});
assert.equal(hash(snapshot(prior)), pins.beforeAllTeachingSnapshotHash);
assert.equal(history({api: prior, catalog}), prior);
assert.equal(pins.entries.length, 12);
assert.equal(transition.entries.length, 12);
const familyCounts = {cuboid: 2, medialCuneiform: 2, intermediateCuneiform: 2, lateralCuneiform: 2, halluxNote: 4};
for (const [family, count] of Object.entries(familyCounts)) {
  assert.equal(pins.entries.filter(e => e.family === family).length, count);
}
for (const {identity, previous, family} of pins.entries) {
  assert.deepEqual(prior.bodyLesson(identity, 'ultrasound'), previous.ultrasound);
  assert.equal(previous.ultrasound.readiness, family === 'halluxNote' ? 'draft' : 'pending');
  const exposed = prior.bodyLesson(identity, 'ultrasound');
  exposed.body += ' foreign';
  if (Array.isArray(exposed.bullets)) exposed.bullets.push('foreign');
  else exposed.bullets = ['foreign'];
  assert.deepEqual(prior.bodyLesson(identity, 'ultrasound'), previous.ultrasound, 'Restored lessons are detached');
  const foreign = structuredClone(identity);
  foreign.sources[0].sha256 = 'foreign';
  assert.throws(() => prior.bodyLesson(foreign, 'ultrasound'), /exact source identity/i);
  for (const tab of current.contentTabs.filter(tab => tab !== 'ultrasound')) {
    assert.deepEqual(prior.bodyLesson(identity, tab), current.bodyLesson(identity, tab));
  }
}
// The original 28-selection toe admission must still be independently reversible.
const beforeToe = authoringBeforeToeBoneUltrasound({api: prior, catalog});
const toePins = JSON.parse(readFileSync('content/toe-bone-ultrasound-pins.json'));
assert.equal(toePins.entries.length, 28);
for (const {identity, previous} of toePins.entries) {
  assert.deepEqual(beforeToe.bodyLesson(identity, 'ultrasound'), previous.ultrasound);
}
const first = pins.entries[0];
const mixed = {
  ...current,
  bodyLesson(s, tab) {
    return s.id === first.identity.id && tab === 'ultrasound'
      ? structuredClone(first.previous.ultrasound) : current.bodyLesson(s, tab);
  },
};
mixed.bodyContent = (s, tab) => {
  const {readiness, ...shown} = mixed.bodyLesson(s, tab);
  return shown;
};
assert.throws(() => history({api: mixed, catalog}), /Mixed foot-ultrasound followup history/i);
assert.throws(() => history({
  api: {...current, footUltrasoundFollowupLesson() { return {body: 'foreign'}; }}, catalog,
}), /Unrecorded foot-ultrasound followup draft/i);
const foreignCatalog = structuredClone(catalog);
foreignCatalog.structures.find(s => s.id === first.identity.id).sources[0].sha256 = 'foreign';
assert.throws(() => history({api: current, catalog: foreignCatalog}), /Unrecorded foot-ultrasound followup identity/i);
const foreignDisplay = structuredClone(display);
foreignDisplay.structures.find(s => s.id === first.identity.id).sources[0].sha256 = 'foreign';
assert.throws(() => history({
  api: {...current, bodyDisplayCatalog() { return foreignDisplay; }}, catalog,
}), /Unrecorded foot-ultrasound followup identity/i);
assert.equal(hash(snapshot(current)), currentHash);
console.log(JSON.stringify({restoredTopics: 12, baselineSnapshotExact: true,
  originalToeAdmissionReversible: true, mixedAndForeignRefused: true, liveTeachingUnchanged: true}));
