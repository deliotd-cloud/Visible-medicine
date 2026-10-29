import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const source='G:/VisibleMedicine-temp/staging/20261029-combined-native-successor/atlas';
const proposal='G:/VisibleMedicine-temp/staging/20261029-quick-check-order';
const outputRoot=proposal+'-verification';
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map();
function read(file,digest){const b=fs.readFileSync(file),actual=sha(b);if(digest)assert.equal(actual,digest,file);inputs.set(file,actual);return b;}
const prior=JSON.parse(read('F:/VisibleMedicine/recovery/checkpoints/20261029-quiz-successor/validation/SNAPSHOT_COMPARISON.json','5f94906d8f0ae44ac8563013cd7c6f89530c50f193d93927b2e89302ace5601d'));
const limbicCheckpoint=JSON.parse(read('F:/VisibleMedicine/recovery/checkpoints/20261029-limbic-quiz/checkpoint.json','2879168a836e33b355dbbc7c6ae886b01e182e63777f6c20996479ec38de0af9'));
const limbic=JSON.parse(read(limbicCheckpoint.comparison.path,limbicCheckpoint.comparison.sha256));
const questions=[...prior.reviewQuestions.map(q=>({id:q.id,lesson:q.question})),...limbic.questions.map(q=>({id:q.id,lesson:q.proposedQuiz}))];
assert.equal(questions.length,45);assert.equal(new Set(questions.map(q=>q.id)).size,45);
const req=createRequire(source+'/package.json'),tsFile=req.resolve('typescript');
const deps=JSON.parse(read('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json','cbda14f0489c2c66474f1d8b47b7171aab52130ca68749fe78219773cf650f56'));
for(const file of [process.execPath,tsFile]){const actual=fs.realpathSync.native(file),pin=deps.dependencyFiles.find(d=>d.path===actual);assert(pin);read(actual,pin.sha256);}
const ts=req('typescript'),helper=read(proposal+'/lib/quick-check-choice-order.ts');
const code=ts.transpileModule(helper.toString(),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {orderQuickCheckChoices}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const placementCounts=[0,0,0,0],rows=[];
for(const q of questions){
  const before=structuredClone(q.lesson);assert.equal(before.readiness,'draft');assert.equal(before.bullets.length,4);
  Object.freeze(q.lesson.bullets);
  const ordered=orderQuickCheckChoices(q.lesson.body,q.lesson.bullets);
  assert.deepEqual([...ordered].sort(),[...q.lesson.bullets].sort());
  assert.deepEqual(q.lesson,before,'No teaching text, answer or explanation mutation');
  assert.equal(ordered.filter(label=>label===q.lesson.correctAnswer).length,1);
  assert.deepEqual(orderQuickCheckChoices(q.lesson.body,q.lesson.bullets),ordered);
  const correctIndex=ordered.indexOf(q.lesson.correctAnswer);placementCounts[correctIndex]++;
  rows.push({id:q.id,authoredCorrectIndex:q.lesson.bullets.indexOf(q.lesson.correctAnswer),displayedCorrectIndex:correctIndex});
}
assert(placementCounts.every(count=>count>0),'Real draft bank should use every answer position');
for(const[file,digest]of inputs)assert.equal(sha(fs.readFileSync(file)),digest);
const result={schema:'vm-quick-check-order-corpus/1',at:new Date().toISOString(),placements:45,displayedCorrectPositionCounts:placementCounts,exactLabelsAndKeysPreserved:true,stableOrder:true,rows,inputs:[...inputs].map(([path,sha256])=>({path,sha256})),limits:['Exact saved draft proposals only, not a full current teaching-resolver audit.','Deterministic formative choice presentation; not random exam security, clinical review or browser acceptance.','No authored lesson, review pin, generated snapshot or installed source is changed.'],installed:false,clinicalApproval:false};
fs.writeFileSync(outputRoot+'/CORPUS_RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({placements:45,displayedCorrectPositionCounts:placementCounts,labelsAndKeysUnchanged:true,installed:false}));
