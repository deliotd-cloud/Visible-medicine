import assert from 'node:assert/strict';
import { contentContext } from './content-contract-tools.mjs';
import { beforeRegionalQuickCheckKeys } from './regional-quick-check-history.mjs';
import { beforeFootVascularQuiz } from './foot-vascular-quiz-history.mjs';
const {api: currentApi,catalog} = await contentContext();
const api = beforeFootVascularQuiz(currentApi);
const before = beforeRegionalQuickCheckKeys(api,catalog);
const keyed = catalog.structures.filter(s=>api.bodyLesson(s,'quiz').correctAnswer !== undefined);
assert.equal(keyed.length,11);
let changed=0, preserved=0;
for (const s of catalog.structures) for (const tab of api.contentTabs) {
  const now=api.bodyLesson(s,tab), old=before.bodyLesson(s,tab);
  if (tab==='quiz' && keyed.some(k=>k.id===s.id)) {
    const {correctAnswer,explanation,...prior}=now;
    assert.deepEqual(old,prior); changed++;
  } else { assert.deepEqual(old,now); preserved++; }
  const {readiness,...shown}=old;
  assert.deepEqual(before.bodyContent(s,tab),shown);
}
assert.equal(beforeRegionalQuickCheckKeys(before,catalog),before);
assert.equal(before.structures,api.structures);
assert.equal(before.dissectionProfiles,api.dissectionProfiles);
let rejected=0;
const altered = mutate => ({...api,bodyLesson(s,tab) {
  const lesson=structuredClone(api.bodyLesson(s,tab));
  if(s.id===keyed[0].id && tab==='quiz') mutate(lesson);
  return lesson;
}});
for(const mutate of [q=>q.correctAnswer='foreign',q=>q.explanation='foreign',
  q=>delete q.correctAnswer,q=>delete q.explanation,
  q=>{delete q.correctAnswer;delete q.explanation;}]) {
  assert.throws(()=>beforeRegionalQuickCheckKeys(altered(mutate),catalog),/quick-check/);
  rejected++;
}
// The adapter cannot conceal unrelated prompt/options/copy changes.
for(const mutate of [q=>q.body='foreign prompt',q=>q.bullets.push('foreign choice')]) {
  const input=altered(mutate), replay=beforeRegionalQuickCheckKeys(input,catalog);
  const {correctAnswer,explanation,...expected}=input.bodyLesson(keyed[0],'quiz');
  assert.deepEqual(replay.bodyLesson(keyed[0],'quiz'),expected);
  assert.notDeepEqual(replay.bodyLesson(keyed[0],'quiz'),before.bodyLesson(keyed[0],'quiz'));
}
console.log(JSON.stringify({changed,preserved,rejected,unrelatedChangesRetained:2,
  idempotent:true,productionChanges:false,clinicalApproval:false}));
