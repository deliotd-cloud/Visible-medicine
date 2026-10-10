// Exact offline predecessor only. Never runtime teaching or approval authority.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import transition from '../content/spinal-disc-quiz.transition.json' with {type:'json'};
import pins from '../content/spine-imaging-pins.json' with {type:'json'};
export const hashDiscQuiz=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(hashDiscQuiz(transition),'5ae2b41c4ede59eb796c7e30b79b0c3c86d182e593e581252dda13ac421e5fc2');
assert.equal(transition.baselineCommit,'2f21cc4522ccd27756220c63b98e1a2de122ef36');
assert.equal(hashDiscQuiz(pins),transition.originalSpinePinsJsonSha256);
assert.equal(transition.entries.length,22);
assert.deepEqual(pins.entries.filter(e=>['cervicalDisc','thoracicDisc','lumbarDisc'].includes(e.group)).map(e=>e.identity),transition.entries.map(e=>e.identity));
const targets=new Map(transition.entries.map(e=>[e.identity.id,e]));assert.equal(targets.size,22);
const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};
for(const e of transition.entries){assert.equal(hashDiscQuiz(e.oldLesson),e.oldSha256);assert.equal(hashDiscQuiz(e.newLesson),e.newSha256);}

/** Restore precisely this later Quiz epoch before earlier immutable snapshots. */
export function beforeSpinalDiscQuiz(api,catalog){
  const present=['spinalDiscQuizLesson','spinalDiscQuizGroups','spinalDiscQuizQuestions'].map(k=>api[k]!==undefined);
  assert(present.every(Boolean)||present.every(v=>!v),'Partial disc quiz contract');
  if(present.every(Boolean)){
    assert.equal(typeof api.spinalDiscQuizLesson,'function');
    assert.equal(hashDiscQuiz(api.spinalDiscQuizGroups),transition.groupsSha256,'Unrecorded disc quiz grouping');
    assert.equal(hashDiscQuiz(api.spinalDiscQuizQuestions),transition.questionsSha256,'Unrecorded disc quiz questions');
  }
  if(catalog!==undefined){assert(Array.isArray(catalog?.structures));for(const e of transition.entries)assert.deepEqual(catalog.structures.filter(s=>s.id===e.identity.id),[e.identity],'Exact disc quiz catalog identity');}
  if(typeof api.bodyLesson!=='function'){
    assert(catalog===undefined&&present.every(v=>!v)&&api.bodyContent===undefined&&api.bodyDisplayCatalog===undefined,'Early synthetic API only');return api;
  }
  if(api.bodyContent!==undefined)assert.equal(typeof api.bodyContent,'function');
  const epochs=transition.entries.map(e=>{
    const lesson=api.bodyLesson(e.identity,'quiz');
    const epoch=lesson===undefined?'undefined':JSON.stringify(lesson)===JSON.stringify(e.oldLesson)?'old':JSON.stringify(lesson)===JSON.stringify(e.newLesson)?'new':'foreign';
    assert.notEqual(epoch,'foreign','Unrecorded disc quiz lesson');
    if(api.bodyContent!==undefined)assert.deepEqual(api.bodyContent(e.identity,'quiz'),lesson===undefined?undefined:shown(lesson),'Disc quiz learner mismatch');
    if(present.every(Boolean))assert.deepEqual(api.spinalDiscQuizLesson(e.identity,'quiz'),epoch==='new'?e.newLesson:undefined,'Disc quiz helper mismatch');
    return epoch;
  });
  assert(epochs.every(e=>e===epochs[0]),'Mixed disc quiz epochs');
  if(epochs[0]==='undefined')assert(present.every(v=>!v)&&api.bodyDisplayCatalog===undefined,'Undefined synthetic quiz epoch only');
  if(epochs[0]!=='new')return api;
  const oldFor=(s,t)=>{if(t!=='quiz'||!targets.has(s?.id))return undefined;const e=targets.get(s.id);assert.deepEqual(s,e.identity,'Complete historical disc quiz source identity');return structuredClone(e.oldLesson);};
  return {...api,
    ...(present.every(Boolean)?{spinalDiscQuizLesson(s,t){return oldFor(s,t)?undefined:api.spinalDiscQuizLesson(s,t);}}:{}),
    bodyLesson(s,t){return oldFor(s,t)??api.bodyLesson(s,t);},
    ...(api.bodyContent?{bodyContent(s,t){const old=oldFor(s,t);return old?shown(old):api.bodyContent(s,t);}}:{}),
  };
}
