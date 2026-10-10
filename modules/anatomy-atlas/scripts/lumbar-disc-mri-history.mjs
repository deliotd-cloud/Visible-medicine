// Offline, exact lumbar MRI history; never runtime teaching or approval authority.
import assert from 'node:assert/strict';
import { beforeRenalUltrasound } from './renal-ultrasound-history.mjs';
import { beforeThoracicDiscMri } from './thoracic-disc-mri-history.mjs';
import { beforeSpinalDiscQuiz } from './spinal-disc-quiz-history.mjs';
import { createHash } from 'node:crypto';
import transition from '../content/lumbar-disc-mri-revision.transition.json' with { type: 'json' };
import pins from '../content/spine-imaging-pins.json' with { type: 'json' };
import before from '../content/spine-imaging.before.json' with { type: 'json' };
import renalPins from '../content/abdominal-organ-imaging-pins.json' with { type: 'json' };
const hash = (value) => createHash('sha256').update(value).digest('hex');
assert.equal(hash(JSON.stringify(transition)), '6e3531ebea4d280d54cb6d746fc8418883841f227853a4fddc304811c534e342', 'Unrecorded lumbar MRI transition');
assert.equal(hash(JSON.stringify(pins)), transition.originalPinsJsonSha256, 'Original spine pins changed');
assert.equal(hash(JSON.stringify(before)), transition.originalBeforeJsonSha256, 'Original pending spine lessons changed');
assert.equal(transition.baselineCommit, '44e3807503af91a2cc32c74651584eb2139dcfff');
assert.equal(transition.entries.length, 5);
const pinEntries = pins.entries.filter((entry) => entry.group === 'lumbarDisc');
assert.deepEqual(pinEntries.map((entry) => entry.identity), transition.entries.map((entry) => entry.identity));
const byId = new Map(transition.entries.map((entry) => [entry.identity.id, entry]));
assert.equal(byId.size, 5, 'Distinct lumbar-disc identities required');
const same = (a, b, label) => assert.deepEqual(a, b, label);
const content = (lesson) => { const { readiness: _readiness, ...shown } = lesson; return shown; };

/** Restore only the exact five lumbar-disc MRI lessons before older history. */
export function beforeLumbarDiscMri(api, catalog) {
  if (['abdominalOrganImagingLesson', 'abdominalOrganImagingTopics', 'abdominalOrganImagingReferences', 'bodyDisplayCatalog'].some((name) => api[name] !== undefined)) {
    // Older spine compositions may have projected the unrelated pancreas
    // display more than once. Do not run that correction again here: validate
    // both unchanged kidney identities, then replay their exact lesson epoch.
    if (catalog !== undefined) {
      const identities = renalPins.entries.filter((entry) => ['FMA7204', 'FMA7205'].includes(entry.identity.fmaId)).map((entry) => entry.identity);
      const ids = new Set(identities.map((identity) => identity.id));
      const byId = (a,b) => a.id.localeCompare(b.id);
      same(catalog.structures.filter((structure) => ids.has(structure.id) || ['FMA7204', 'FMA7205'].includes(structure.fmaId)).sort(byId), [...identities].sort(byId), 'Renal identities in spine history changed');
    }
    api = beforeRenalUltrasound(api);
  }
  // Legacy MRI-only synthetic APIs do not expose a Quiz contract. Keep their
  // original MRI guards below; real display APIs and partial Quiz contracts
  // must pass the separately pinned later-Quiz reversal first.
  if (['spinalDiscQuizLesson', 'spinalDiscQuizGroups', 'spinalDiscQuizQuestions', 'bodyDisplayCatalog'].some((name) => api[name] !== undefined)) {
    api = beforeSpinalDiscQuiz(api, catalog);
  }
  const names = ['spineImagingTopics', 'spineImagingReferences', 'spineImagingLesson'];
  const present = names.map((name) => api[name] !== undefined);
  assert(present.every(Boolean) || present.every((value) => !value), 'Partial spine imaging contract');
  if (present.every(Boolean)) api = beforeThoracicDiscMri(api, catalog);
  if (catalog !== undefined) {
    assert(Array.isArray(catalog?.structures), 'Source catalog required');
    for (const entry of transition.entries) {
      same(catalog.structures.filter((s) => s.id === entry.identity.id), [entry.identity], 'Lumbar MRI catalog identity changed');
    }
  }
  if (typeof api.bodyLesson !== 'function') {
    assert(catalog === undefined && present.every((value) => !value) && api.bodyContent === undefined && api.bodyDisplayCatalog === undefined,
      'Early synthetic undefined API only');
    return api;
  }

  if (present.every((value) => !value)) {
    // Exact older Git APIs may omit the spine exports. Accept only one whole
    // recorded epoch: post-spine drafts, pre-spine pending, or early undefined.
    if (api.bodyContent !== undefined) assert.equal(typeof api.bodyContent, 'function', 'Omitted learner content must be callable');
    const epochs = [];
    for (const entry of transition.entries) {
      const lesson = api.bodyLesson(entry.identity, 'mri');
      const epoch = lesson === undefined ? 'undefined' :
        JSON.stringify(lesson) === JSON.stringify(entry.oldLesson) ? 'old' :
        JSON.stringify(lesson) === JSON.stringify(entry.pendingLesson) ? 'pending' : 'foreign';
      assert.notEqual(epoch, 'foreign', 'Omitted-contract MRI lesson must match a recorded epoch');
      if (api.bodyContent !== undefined) {
        const expected = lesson === undefined ? undefined : content(lesson);
        same(api.bodyContent(entry.identity, 'mri'), expected, 'Omitted-contract learner content mismatch');
      }
      epochs.push(epoch);
    }
    assert(epochs.every((epoch) => epoch === epochs[0]), 'Mixed omitted-contract MRI epochs');
    if (epochs[0] === 'undefined') assert(catalog === undefined && api.bodyDisplayCatalog === undefined, 'Undefined synthetic epoch only');
    return api;
  }

  assert.equal(typeof api.spineImagingLesson, 'function');
  assert(api.spineImagingTopics && typeof api.spineImagingTopics === 'object');
  assert(api.spineImagingReferences && typeof api.spineImagingReferences === 'object');
  const oldTopic = JSON.stringify(api.spineImagingTopics.lumbarDisc?.mri) === JSON.stringify(transition.oldTopic);
  const newTopic = JSON.stringify(api.spineImagingTopics.lumbarDisc?.mri) === JSON.stringify(transition.newTopic);
  assert(oldTopic || newTopic, 'Unrecorded lumbar MRI topic');
  assert.equal(hash(JSON.stringify(api.spineImagingTopics)), newTopic ? transition.newTopicsSha256 : transition.oldTopicsSha256,
    'Unrecorded spine topic table');
  assert.equal(hash(JSON.stringify(api.spineImagingReferences)), newTopic ? transition.newReferencesSha256 : transition.oldReferencesSha256,
    'Unrecorded spine reference table');
  const refKey = transition.addedReference.key;
  const expectedRef = newTopic ? transition.addedReference.url : undefined;
  assert.equal(api.spineImagingReferences[refKey], expectedRef, 'Unrecorded lumbar MRI reading link');
  assert.equal(typeof api.bodyContent, 'function', 'Current MRI learner content required');
  for (const entry of transition.entries) {
    const expected = newTopic ? entry.newLesson : entry.oldLesson;
    assert.equal(hash(JSON.stringify(expected)), newTopic ? entry.newSha256 : entry.oldSha256, 'Recorded full MRI lesson changed');
    same(api.spineImagingLesson(entry.identity, 'mri'), expected, 'MRI helper mismatch');
    same(api.bodyLesson(entry.identity, 'mri'), expected, 'MRI body dispatch mismatch');
    same(api.bodyContent(entry.identity, 'mri'), content(expected), 'MRI learner content mismatch');
  }
  if (oldTopic) return api;

  const topics = structuredClone(api.spineImagingTopics);
  topics.lumbarDisc.mri = structuredClone(transition.oldTopic);
  const references = { ...api.spineImagingReferences };
  delete references[refKey];
  const originalHelper = api.spineImagingLesson;
  const originalBodyLesson = api.bodyLesson;
  const originalBodyContent = api.bodyContent;
  const oldFor = (s, tab) => {
    if (tab !== 'mri' || !byId.has(s?.id)) return undefined;
    const entry = byId.get(s.id);
    same(s, entry.identity, 'Historical MRI requires complete source identity');
    return structuredClone(entry.oldLesson);
  };
  return {
    ...api,
    spineImagingTopics: topics,
    spineImagingReferences: references,
    spineImagingLesson(s, tab) { return oldFor(s, tab) ?? originalHelper(s, tab); },
    bodyLesson(s, tab) { return oldFor(s, tab) ?? originalBodyLesson(s, tab); },
    bodyContent(s, tab) { const old = oldFor(s, tab); return old ? content(old) : originalBodyContent(s, tab); },
  };
}
