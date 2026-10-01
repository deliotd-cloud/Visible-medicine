import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
export async function cranialBoneQuizTransition(){
 const pins=JSON.parse(await readFile('content/cranial-bone-quiz-pins.json'));
 assert.equal(pins.parentCommit,'bc03ed3f7324819f4bfa3e7cd0afb7203cc8e3b8');assert.equal(pins.entries.length,8);
 const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog),parent=await exactSourceHistoryApi(pins.parentCommit);
 assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));assert.deepEqual(api.structures,parent.structures);assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
 assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
 const targets=new Map(pins.entries.map(e=>[e.identity.id,e]));assert.equal(targets.size,8);
 const entries=[];let unchanged=0;
 for(const s of display.structures)for(const tab of api.contentTabs){
  const prior=parent.bodyLesson(s,tab),current=api.bodyLesson(s,tab),target=targets.get(s.id);
  if(tab!=='quiz'||!target){assert.deepEqual(current,prior,s.id+'|'+tab);unchanged++;continue;}
  assert.deepEqual(s,target.identity);assert.deepEqual(prior,target.previous.quiz);assert.equal(current.readiness,'draft');assert.notDeepEqual(current,prior);assert.equal(current.bullets.filter(c=>c===current.correctAnswer).length,1);
  entries.push({id:s.id,tab,previousHash:hash(prior),currentHash:hash(current)});
 }
 assert.equal(entries.length,8);assert.equal(unchanged,9928);
 return {parentCommit:pins.parentCommit,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/cranial-bone-quiz-transition.mjs')){
 const transition=await cranialBoneQuizTransition(),path='content/cranial-bone-quiz-transition.json';
 if(process.argv.includes('--record'))await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
 else assert.deepEqual(JSON.parse(await readFile(path)),transition);
 console.log(JSON.stringify({changed:8,unchanged:9928,pinsHash:transition.pinsHash,transitionHash:hash(transition),clinicalApproval:false}));
}
