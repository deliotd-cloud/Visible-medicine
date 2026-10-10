import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
export async function thoracicBoneQuizTransition(){
 const pins=JSON.parse(await readFile('content/thoracic-bone-quiz-pins.json'));
 assert.equal(pins.parentCommit,'d9cd141f1fefae6842754e134a1ef18d5661c727');assert.equal(pins.entries.length,27);
 const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog),parent=await exactSourceHistoryApi(pins.parentCommit);
 assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));assert.deepEqual(api.structures,parent.structures);assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
 assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
 const targets=new Map(pins.entries.map(e=>[e.identity.id,e]));assert.equal(targets.size,27);
 const entries=[];let unchanged=0;
 for(const s of display.structures)for(const tab of api.contentTabs){
  const prior=parent.bodyLesson(s,tab),current=api.bodyLesson(s,tab),target=targets.get(s.id);
  if(tab!=='quiz'||!target){assert.deepEqual(current,prior,s.id+'|'+tab);unchanged++;continue;}
  assert.deepEqual(s,target.identity);assert.deepEqual(prior,target.previous.quiz);assert.equal(current.readiness,'draft');assert.notDeepEqual(current,prior);assert.equal(current.bullets.filter(c=>c===current.correctAnswer).length,1);
  entries.push({id:s.id,tab,previousHash:hash(prior),currentHash:hash(current)});
 }
 assert.equal(entries.length,27);assert.equal(unchanged,9909);
 return {parentCommit:pins.parentCommit,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/thoracic-bone-quiz-transition.mjs')){
 const transition=await thoracicBoneQuizTransition(),path='content/thoracic-bone-quiz-transition.json';
 if(process.argv.includes('--record'))await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
 else assert.deepEqual(JSON.parse(await readFile(path)),transition);
 console.log(JSON.stringify({changed:27,unchanged:9909,pinsHash:transition.pinsHash,transitionHash:hash(transition),clinicalApproval:false}));
}
