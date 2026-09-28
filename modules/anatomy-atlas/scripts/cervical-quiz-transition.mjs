import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/cervical-quiz-pins.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
const {api,catalog}=await contentContext();
const parent=await exactSourceHistoryApi(pins.parentCommit),display=api.bodyDisplayCatalog(catalog);
assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));
assert.deepEqual(api.structures,parent.structures);assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
const targets=new Map(pins.entries.map(e=>[e.identity.id,e]));
let unchanged=0;const entries=[];
for(const s of display.structures)for(const tab of api.contentTabs){
 const before=parent.bodyLesson(s,tab),after=api.bodyLesson(s,tab),target=targets.get(s.id);
 if(!target||tab!=='quiz'){assert.deepEqual(after,before,s.id+'|'+tab);unchanged++;continue;}
 assert.deepEqual(s,target.identity);assert.deepEqual(before,target.previous.quiz);assert.notDeepEqual(after,before);
 assert.equal(after.readiness,'draft');assert.equal(after.bullets.filter(c=>c===after.correctAnswer).length,1);
 entries.push({id:s.id,tab,previousHash:hash(before),currentHash:hash(after)});
}
assert.equal(entries.length,5);assert.equal(unchanged,9931);
const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
if(process.argv.includes('--record'))await writeFile('content/cervical-quiz-transition.json',JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
else assert.deepEqual(JSON.parse(await readFile('content/cervical-quiz-transition.json')),transition);
console.log(JSON.stringify({changed:entries.length,unchanged,pinsHash:hash(pins),transitionHash:hash(transition),geometryUnchanged:true,clinicalApproval:false}));
