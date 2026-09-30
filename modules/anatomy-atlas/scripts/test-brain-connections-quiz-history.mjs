import assert from 'node:assert/strict';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { beforeBrainConnectionsQuiz } from './brain-connections-quiz-history.mjs';
import { beforeFootSesamoidTeaching } from './foot-sesamoid-teaching-history.mjs';
import pins from '../content/brain-connections-quiz-pins.json' with { type: 'json' };
const { api: currentApi, catalog } = await contentContext();
// Replay the later recorded foot transition first, so unchanged assertions below
// compare the brain transition with its own input, not a later editorial state.
const api = beforeFootSesamoidTeaching(currentApi);
const parent = await exactSourceHistoryApi(pins.parentCommit);
const prior = beforeBrainConnectionsQuiz(api);
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
assert.equal(beforeBrainConnectionsQuiz(prior), prior);
assert.equal(prior.structures, api.structures);
assert.equal(prior.dissectionProfiles, api.dissectionProfiles);
for (const entry of pins.entries) for (const field of ['body', 'correctAnswer', 'explanation', 'note']) {
  const altered = { ...api, bodyLesson(s, tab) {
    const lesson = api.bodyLesson(s, tab);
    return s.id === entry.identity.id && tab === 'quiz' ? { ...lesson, [field]: 'foreign' } : lesson;
  } };
  assert.throws(() => beforeBrainConnectionsQuiz(altered), /Unrecorded/); rejected++;
}
assert.throws(() => beforeBrainConnectionsQuiz({ ...api, bodyLesson(s, tab) {
  return s.id === pins.entries[0].identity.id && tab === 'quiz'
    ? structuredClone(pins.entries[0].previous.quiz) : api.bodyLesson(s, tab);
} }), /Mixed/); rejected++;
const other = display.structures.find(s => !ids.has(s.id));
const alteredOther = { ...api, bodyLesson(s, tab) {
  const lesson = api.bodyLesson(s, tab);
  return s.id === other.id && tab === 'quiz' ? { ...lesson, body: 'Unrelated change retained' } : lesson;
} };
assert.equal(beforeBrainConnectionsQuiz(alteredOther).bodyLesson(other, 'quiz').body, 'Unrelated change retained');

console.log(JSON.stringify({restored,unchanged,rejected,unrelatedChangeRetained:true,clinicalApproval:false}));
