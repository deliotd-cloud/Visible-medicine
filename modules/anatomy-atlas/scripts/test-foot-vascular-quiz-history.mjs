import assert from 'node:assert/strict';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { beforeFootVascularQuiz } from './foot-vascular-quiz-history.mjs';
import { beforeCircleWillisImaging } from './circle-willis-imaging-history.mjs';
import pins from '../content/foot-vascular-quiz-pins.json' with { type: 'json' };
import circlePins from '../content/circle-willis-imaging-pins.json' with { type: 'json' };
const { api: currentApi, catalog } = await contentContext();
// Historical foot counts/hashes exclude the independently verified later batch.
const api = beforeCircleWillisImaging(currentApi);
const parent = await exactSourceHistoryApi(pins.parentCommit);
const prior = beforeFootVascularQuiz(api);
const display = api.bodyDisplayCatalog(catalog);
let unchanged = 0, restored = 0, rejected = 0;
const ids = new Set(pins.entries.map(e => e.identity.id));
for (const structure of display.structures) for (const tab of api.contentTabs) {
  assert.deepEqual(prior.bodyLesson(structure, tab), parent.bodyLesson(structure, tab));
  const { readiness, ...shown } = prior.bodyLesson(structure, tab);
  assert.deepEqual(prior.bodyContent(structure, tab), shown);
  if (tab === 'quiz' && ids.has(structure.id)) restored++;
  else { assert.deepEqual(prior.bodyLesson(structure, tab), api.bodyLesson(structure, tab)); unchanged++; }
}
assert.equal(restored, 8); assert.equal(unchanged, 9928);
assert.equal(beforeFootVascularQuiz(prior), prior);
assert.equal(prior.structures, api.structures);
assert.equal(prior.dissectionProfiles, api.dissectionProfiles);
for (const entry of pins.entries) for (const field of ['body', 'correctAnswer', 'explanation', 'note']) {
  const altered = { ...api, bodyLesson(s, tab) {
    const lesson = api.bodyLesson(s, tab);
    return s.id === entry.identity.id && tab === 'quiz' ? { ...lesson, [field]: 'foreign' } : lesson;
  } };
  assert.throws(() => beforeFootVascularQuiz(altered), /Unrecorded/); rejected++;
}
assert.throws(() => beforeFootVascularQuiz({ ...api, bodyLesson(s, tab) {
  return s.id === pins.entries[0].identity.id && tab === 'quiz'
    ? structuredClone(pins.entries[0].previous.quiz) : api.bodyLesson(s, tab);
} }), /Mixed/); rejected++;
const other = display.structures.find(s => !ids.has(s.id));
const alteredOther = { ...api, bodyLesson(s, tab) {
  const lesson = api.bodyLesson(s, tab);
  return s.id === other.id && tab === 'quiz' ? { ...lesson, body: 'Unrelated change retained' } : lesson;
} };
assert.equal(beforeFootVascularQuiz(alteredOther).bodyLesson(other, 'quiz').body, 'Unrelated change retained');
// Normalization must reject corruption instead of masking an unknown later state.
assert.throws(() => beforeCircleWillisImaging({ ...currentApi, bodyLesson(s, tab) {
  const lesson = currentApi.bodyLesson(s, tab);
  return s.id === circlePins.entries[0].identity.id && tab === 'ct' ? { ...lesson, body: 'foreign' } : lesson;
} }), /Unrecorded/);
assert.throws(() => beforeCircleWillisImaging({ ...currentApi, bodyLesson(s, tab) {
  return s.id === circlePins.entries[0].identity.id && tab === 'ct'
    ? structuredClone(circlePins.entries[0].previous.ct) : currentApi.bodyLesson(s, tab);
} }), /Mixed/);
console.log(JSON.stringify({ restored, unchanged, rejected, laterHistoryRejected: 2, unrelatedChangeRetained: true, clinicalApproval: false }));
