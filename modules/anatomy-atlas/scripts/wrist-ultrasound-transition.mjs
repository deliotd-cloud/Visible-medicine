import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeCarpalBoneQuiz} from './carpal-bone-quiz-history.mjs';
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
export async function wristUltrasoundTransition(){
 const pins=JSON.parse(await readFile('content/wrist-ultrasound-pins.json'));
 assert.equal(pins.parentCommit,'ac88a3c72de1e69971321e00a883e4b88fc356ce');assert.equal(pins.entries.length,8);
 assert.equal(hash(pins),'4e447dda0e16ed3a9255c701240b1b65de5678493969ddc6d833142ad40dc426');
 const {api:current,catalog}=await contentContext(),display=current.bodyDisplayCatalog(catalog),api=beforeCarpalBoneQuiz(current,display),parent=await exactSourceHistoryApi(pins.parentCommit);
 assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));assert.deepEqual(api.structures,parent.structures);assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
 assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
 const targets=new Map(pins.entries.map(e=>[e.identity.id,e]));assert.equal(targets.size,8);
 const entries=[];let unchanged=0;
 for(const s of display.structures)for(const tab of api.contentTabs){
  const prior=parent.bodyLesson(s,tab),current=api.bodyLesson(s,tab),target=targets.get(s.id);
  if(tab!=='ultrasound'||!target){assert.deepEqual(current,prior,s.id+'|'+tab);unchanged++;continue;}
  assert.deepEqual(s,target.identity);assert.deepEqual(prior,target.previous.ultrasound);assert.equal(prior.readiness,'pending');assert.equal(current.readiness,'draft');assert.notDeepEqual(current,prior);
  entries.push({id:s.id,tab,previousHash:hash(prior),currentHash:hash(current)});
 }
 assert.equal(entries.length,8);assert.equal(unchanged,9928);
 return {parentCommit:pins.parentCommit,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/wrist-ultrasound-transition.mjs')){
 const result=await wristUltrasoundTransition(),output=JSON.stringify(result,null,2)+'\n',path='content/wrist-ultrasound-transition.json';
 if(process.argv.includes('--write'))await writeFile(path,output,{flag:'wx'});
 else assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
 console.log(JSON.stringify({changed:result.entries.length,unchanged:9928,transitionHash:hash(result),clinicalApproval:false}));
}
