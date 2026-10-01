import assert from 'node:assert/strict';
import pins from '../content/cranial-bone-quiz-pins.json' with {type:'json'};
import {build} from './workspace-test-build.mjs';
const result=await build({stdin:{contents:"export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));let rejected=0;
for(const e of pins.entries){
 const packet=await api.bodyReviewMaterial(e.identity.id);assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert.deepEqual(packet.source.structure,e.identity);
 assert.deepEqual(await api.parseBodyReviewResponse(packet,e.identity.id),packet);
 const index=packet.topics.findIndex(t=>t.tab==='quiz'),quiz=packet.topics[index];assert(index>=0);assert.equal(quiz.readiness,'draft');assert.equal(quiz.bullets.filter(c=>c===quiz.correctAnswer).length,1);assert(quiz.explanation);assert(quiz.citations.length);
 const context=await api.bodyReviewContext(e.identity.id);assert.equal(context.revisions.imaging,null);assert(context.teachingTabs.includes('quiz'));assert(context.checklists.teaching.some(c=>c.id==='drafts'));
 for(const mutate of [
  p=>p.topics[index].correctAnswer=p.topics[index].bullets.find(c=>c!==quiz.correctAnswer),
  p=>p.topics[index].bullets.reverse(),
  p=>p.topics[index].explanation+=' unreviewed change',
  p=>p.topics[index].citations=[],
  p=>p.topics[index].readiness='approved',
  p=>p.approval=true,
  p=>p.topics.splice(index,1),
 ]){const changed=structuredClone(packet);mutate(changed);assert.equal(await api.parseBodyReviewResponse(changed,e.identity.id),null);rejected++;}
}
console.log(JSON.stringify({reviewSelections:8,rejectedReviewPackets:rejected,clinicalApproval:false,imagingApproval:false}));
