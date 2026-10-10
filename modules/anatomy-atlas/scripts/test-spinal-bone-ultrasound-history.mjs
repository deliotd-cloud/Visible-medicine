import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/spinal-bone-ultrasound-pins.json' with { type: 'json' };
import transition from '../content/spinal-bone-ultrasound.transition.json' with { type: 'json' };
import { contentContext } from './content-contract-tools.mjs';
import { authoringBeforeSpinalBoneUltrasound } from './spinal-bone-ultrasound-history.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const { api, catalog } = await contentContext();
const targetIds = new Set(pins.entries.map(entry => entry.identity.id));
assert.equal(targetIds.size, 13);
const history = authoringBeforeSpinalBoneUltrasound({ api, catalog });

for (const [index, entry] of pins.entries.entries()) {
  const s = catalog.structures.find(item => item.id === entry.identity.id);
  const current = api.bodyLesson(s, 'ultrasound');
  assert.equal(hash(current), transition.entries[index].draftHash);
  assert.deepEqual(history.bodyLesson(s, 'ultrasound'), entry.previous);
  const { readiness: _readiness, ...shown } = entry.previous;
  assert.deepEqual(history.bodyContent(s, 'ultrasound'), shown);
  const first = history.bodyLesson(s, 'ultrasound');
  first.body += ' local mutation';
  assert.deepEqual(history.bodyLesson(s, 'ultrasound'), entry.previous,
    'History must return a fresh pending lesson');
  const foreign = structuredClone(s);
  foreign.sources[0].sha256 = 'foreign';
  assert.throws(() => history.bodyLesson(foreign, 'ultrasound'), /exact source identity/);
  assert.throws(() => history.bodyContent(foreign, 'ultrasound'), /exact source identity/);
  assert.deepEqual(history.bodyLesson(s, 'ct'), api.bodyLesson(s, 'ct'));
}

const unrelated = catalog.structures.find(s => !targetIds.has(s.id));
assert.deepEqual(history.bodyLesson(unrelated, 'ultrasound'), api.bodyLesson(unrelated, 'ultrasound'));
assert.deepEqual(history.bodyContent(unrelated, 'ultrasound'), api.bodyContent(unrelated, 'ultrasound'));

function withLessons(replacements) {
  const altered = {
    ...api,
    bodyLesson(s, tab) {
      if (tab === 'ultrasound' && replacements.has(s.id)) return structuredClone(replacements.get(s.id));
      return api.bodyLesson(s, tab);
    },
  };
  altered.bodyContent = (s, tab) => {
    const { readiness: _readiness, ...shown } = altered.bodyLesson(s, tab);
    return shown;
  };
  return altered;
}

const previous = new Map(pins.entries.map(entry => [entry.identity.id, entry.previous]));
const alreadyPrevious = withLessons(previous);
assert.equal(authoringBeforeSpinalBoneUltrasound({ api: alreadyPrevious, catalog }), alreadyPrevious);

const first = pins.entries[0];
assert.throws(() => authoringBeforeSpinalBoneUltrasound({
  api: withLessons(new Map([[first.identity.id, first.previous]])), catalog,
}), /Mixed spinal-bone ultrasound history/);

for (const edited of [
  { ...api.bodyLesson(first.identity, 'ultrasound'), body: 'unrecorded edit' },
  { ...first.previous, note: 'unrecorded edit' },
]) assert.throws(() => authoringBeforeSpinalBoneUltrasound({
  api: withLessons(new Map([[first.identity.id, edited]])), catalog,
}), /Unrecorded spinal-bone ultrasound history/);

const alteredResolver = {
  ...api,
  spinalBoneUltrasoundLesson(s, tab) {
    const lesson = api.spinalBoneUltrasoundLesson(s, tab);
    return s.id === first.identity.id && tab === 'ultrasound'
      ? { ...lesson, body: 'unrecorded resolver edit' } : lesson;
  },
};
assert.throws(() => authoringBeforeSpinalBoneUltrasound({ api: alteredResolver, catalog }),
  /Unrecorded spinal-bone ultrasound draft/);

const alteredCatalog = structuredClone(catalog);
alteredCatalog.structures.find(s => s.id === first.identity.id).sources[0].sha256 = 'foreign';
assert.throws(() => authoringBeforeSpinalBoneUltrasound({ api, catalog: alteredCatalog }),
  /Unrecorded spinal-bone ultrasound source identity/);

const originalReason = transition.reason;
transition.reason += ' foreign';
try {
  assert.throws(() => authoringBeforeSpinalBoneUltrasound({ api, catalog }));
} finally { transition.reason = originalReason; }

const originalBaseline = pins.baseline;
pins.baseline = 'foreign';
try {
  assert.throws(() => authoringBeforeSpinalBoneUltrasound({ api, catalog }));
} finally { pins.baseline = originalBaseline; }

assert.equal(hash(pins), transition.sourcePinsHash);
console.log(JSON.stringify({ reconstructedPendingLessons: 13, acceptedRecordedPrevious: true,
  mixedAndEditedHistoryRefused: true, resolverAndSourceEditsRefused: true,
  tamperedTransitionAndPinsRefused: true }));
