import assert from 'node:assert/strict';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { beforeThoracicQuiz } from './thoracic-quiz-history.mjs';
import pins from '../content/thoracic-quiz-pins.json' with { type: 'json' };
const { api, catalog } = await contentContext();
const parent = await exactSourceHistoryApi(pins.parentCommit);
const prior = beforeThoracicQuiz(api);
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
assert.equal(restored, 7); assert.equal(unchanged, 9929);
assert.equal(beforeThoracicQuiz(prior), prior);
assert.equal(prior.structures, api.structures);
assert.equal(prior.dissectionProfiles, api.dissectionProfiles);
for (const entry of pins.entries) for (const field of ['body', 'correctAnswer', 'explanation', 'note']) {
  const altered = { ...api, bodyLesson(s, tab) {
    const lesson = api.bodyLesson(s, tab);
    return s.id === entry.identity.id && tab === 'quiz' ? { ...lesson, [field]: 'foreign' } : lesson;
  } };
  assert.throws(() => beforeThoracicQuiz(altered), /Unrecorded/); rejected++;
}
assert.throws(() => beforeThoracicQuiz({ ...api, bodyLesson(s, tab) {
  return s.id === pins.entries[0].identity.id && tab === 'quiz'
    ? structuredClone(pins.entries[0].previous.quiz) : api.bodyLesson(s, tab);
} }), /Mixed/); rejected++;
const other = display.structures.find(s => !ids.has(s.id));
const alteredOther = { ...api, bodyLesson(s, tab) {
  const lesson = api.bodyLesson(s, tab);
  return s.id === other.id && tab === 'quiz' ? { ...lesson, body: 'Unrelated change retained' } : lesson;
} };
assert.equal(beforeThoracicQuiz(alteredOther).bodyLesson(other, 'quiz').body, 'Unrelated change retained');

console.log(JSON.stringify({restored,unchanged,rejected,unrelatedChangeRetained:true,clinicalApproval:false}));
