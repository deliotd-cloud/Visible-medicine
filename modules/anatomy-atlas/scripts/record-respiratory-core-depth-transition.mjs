import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import pins from '../content/respiratory-core-depth-pins.json' with {type:'json'};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const{api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const entries=pins.entries.flatMap(e=>Object.entries(e.previous).map(([tab,previous])=>{
 const matches=display.structures.filter(s=>s.id===e.identity.id);assert.equal(matches.length,1);assert.deepEqual(matches[0],e.identity);
 const current=api.bodyLesson(e.identity,tab);assert.equal(current.readiness,'draft');assert.notDeepEqual(current,previous);
 return {id:e.identity.id,fmaId:e.identity.fmaId,tab,previousHash:hash(previous),currentHash:hash(current)};
}));
assert.equal(entries.length,8);
const result={baseline:pins.baseline,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles}),entries};
const path='content/respiratory-core-depth.transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),result);
else await writeFile(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({placements:8,pinsHash:hash(pins),transitionHash:hash(result),currentSnapshotHash:result.currentAllLessonsAndRecipesHash}));
