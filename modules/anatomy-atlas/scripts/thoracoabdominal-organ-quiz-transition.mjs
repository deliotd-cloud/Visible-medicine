import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/thoracoabdominal-organ-quiz-pins.json' with {type:'json'};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const{api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const parent=await exactSourceHistoryApi(pins.baseline,'display-content');
assert.equal(pins.baseline,'fae8cf6abbfffe304d5190e44f53affa883a96a3');
assert.equal(hash(pins),'cdbf0d312e3c4ba410048e165b145c141cc4ee533dd0903d21b0c8967525bb62');
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,value.bodyLesson(s,t)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));assert.deepEqual(api.structures,parent.structures);assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.equal(hash(snapshot(parent)),pins.previousAllLessonsAndRecipesHash);
const targets=new Map(pins.entries.map(e=>[e.identity.id,e])),entries=[];let unchanged=0;
for(const s of display.structures)for(const tab of api.contentTabs){
 const before=parent.bodyLesson(s,tab),after=api.bodyLesson(s,tab),target=targets.get(s.id);
 if(!target||tab!=='quiz'){assert.deepEqual(after,before,s.id+'|'+tab);unchanged++;continue;}
 assert.deepEqual(s,target.identity);assert.deepEqual(before,target.previous.quiz);assert.equal(before.readiness,'generated-identification');assert.equal(after.readiness,'draft');assert.notDeepEqual(after,before);
 entries.push({id:s.id,fmaId:s.fmaId,tab,previousHash:hash(before),currentHash:hash(after)});
}
assert.equal(entries.length,8);assert.equal(unchanged,9928);
const transition={baseline:pins.baseline,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api)),entries};
const path='content/thoracoabdominal-organ-quiz.transition.json';
if(process.argv.includes('--record'))await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
else assert.deepEqual(JSON.parse(await readFile(path)),transition);
console.log(JSON.stringify({changed:8,unchanged,transitionHash:hash(transition),geometryUnchanged:true,clinicalApproval:false}));
