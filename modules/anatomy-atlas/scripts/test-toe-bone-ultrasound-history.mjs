import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {contentContext} from './content-contract-tools.mjs';
import {authoringBeforeToeBoneUltrasound as history} from './toe-bone-ultrasound-history.mjs';
import {authoringBeforeFootUltrasoundFollowup} from './foot-ultrasound-followup-history.mjs';
import {authoringBeforeShoulderGirdleArterialUltrasound} from './shoulder-girdle-arterial-ultrasound-history.mjs';
const {api: current, catalog} = await contentContext();
const beforeShoulder=authoringBeforeShoulderGirdleArterialUltrasound({api:current,catalog});
const api=authoringBeforeFootUltrasoundFollowup({api:beforeShoulder,catalog});
const pins = JSON.parse(readFileSync('content/toe-bone-ultrasound-pins.json'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const display = api.bodyDisplayCatalog(catalog);
const snapshot = value => ({
  catalog: display,
  body: display.structures.map(s => ({
    id: s.id,
    topics: Object.fromEntries(value.contentTabs.map(t => [t, value.bodyLesson(s, t)])),
  })),
  shoulder: value.structures,
  recipes: value.dissectionProfiles,
});
const currentHash = hash(snapshot(current));
const liveHash = hash(snapshot(api));
const prior = history({api, catalog});
assert.equal(hash(snapshot(prior)), pins.beforeAllTeachingSnapshotHash);
assert.equal(history({api: prior, catalog}), prior);
assert.equal(pins.entries.length, 28);
for (const {identity, previous} of pins.entries) {
  const lesson = previous.ultrasound;
  assert.equal(lesson.readiness, 'pending');
  assert.deepEqual(prior.bodyLesson(identity, 'ultrasound'), lesson);
  const exposed = prior.bodyLesson(identity, 'ultrasound');
  exposed.body += ' foreign';
  if (Array.isArray(exposed.bullets)) exposed.bullets.push('foreign');
  else exposed.bullets = ['foreign']; // Pending lessons may have no bullet array.
  assert.deepEqual(prior.bodyLesson(identity, 'ultrasound'), lesson);
  const foreign = structuredClone(identity);
  foreign.sources[0].sha256 = 'foreign';
  assert.throws(() => prior.bodyLesson(foreign, 'ultrasound'), /exact source identity/);
  for (const tab of api.contentTabs.filter(t => t !== 'ultrasound')) {
    assert.deepEqual(prior.bodyLesson(identity, tab), api.bodyLesson(identity, tab));
  }
}
const first = pins.entries[0];
const mixed = {
  ...api,
  bodyLesson(s, tab) {
    return s.id === first.identity.id && tab === 'ultrasound'
      ? structuredClone(first.previous.ultrasound) : api.bodyLesson(s, tab);
  },
};
mixed.bodyContent = (s, tab) => {
  const {readiness, ...shown} = mixed.bodyLesson(s, tab);
  return shown;
};
assert.throws(() => history({api: mixed, catalog}), /Mixed toe-bone ultrasound history/);
assert.throws(() => history({
  api: {...api, toeBoneUltrasoundLesson() { return {body: 'foreign'}; }}, catalog,
}), /Unrecorded toe-bone ultrasound draft/);
const foreignCatalog = structuredClone(catalog);
foreignCatalog.structures.find(s => s.id === first.identity.id).sources[0].sha256 = 'foreign';
assert.throws(() => history({api, catalog: foreignCatalog}), /Unrecorded toe-bone ultrasound identity/);
const foreignDisplay = structuredClone(display);
foreignDisplay.structures.find(s => s.id === first.identity.id).sources[0].sha256 = 'foreign';
assert.throws(() => history({
  api: {...api, bodyDisplayCatalog() { return foreignDisplay; }}, catalog,
}), /Unrecorded toe-bone ultrasound identity/);
assert.equal(hash(snapshot(api)), liveHash);
assert.equal(hash(snapshot(current)), currentHash);
console.log(JSON.stringify({
  restoredTopics: 28,
  baselineSnapshotExact: true,
  mixedAndForeignRefused: true,
  liveTeachingUnchanged: true,
}));
