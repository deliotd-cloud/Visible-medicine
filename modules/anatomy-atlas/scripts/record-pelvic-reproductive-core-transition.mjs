import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import pins from '../content/pelvic-reproductive-core-pins.json' with {type:'json'};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const entries=pins.entries.flatMap(e=>Object.entries(e.previous).map(([tab,previous])=>{
 const matches=display.structures.filter(s=>s.id===e.identity.id);assert.equal(matches.length,1);assert.deepEqual(matches[0],e.identity);
 const current=api.bodyLesson(e.identity,tab);assert.equal(current.readiness,'draft');assert.notDeepEqual(current,previous);
 return {id:e.identity.id,fmaId:e.identity.fmaId,tab,previousHash:hash(previous),currentHash:hash(current)};
}));
assert.equal(entries.length,16);
const result={baseline:pins.baseline,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles}),entries};
const path='content/pelvic-reproductive-core.transition.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),result);
else if(process.argv.includes('--finalize-draft')){
 const old=JSON.parse(await readFile(path));
 assert.equal(old.baseline,result.baseline);assert.equal(old.pinsHash,result.pinsHash);
 assert.equal(old.previousAllLessonsAndRecipesHash,result.previousAllLessonsAndRecipesHash);
 assert.deepEqual(old.entries.map(({currentHash,...rest})=>rest),result.entries.map(({currentHash,...rest})=>rest));
 // Pre-commit editorial replacement only; retain exact initial evidence outside source.
 const {execFileSync}=await import('node:child_process');
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),pins.baseline);
 const preservedPath=process.argv.find(arg=>arg.startsWith('--preserved-draft='))?.slice('--preserved-draft='.length);
 assert(preservedPath,'Supply --preserved-draft=<path> to the exact pre-edit transition evidence');
 const preserved=await readFile(preservedPath,'utf8');
 assert.deepEqual(JSON.parse(preserved),old);
 await writeFile(path,JSON.stringify(result,null,2)+'\n');
}else await writeFile(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({placements:16,pinsHash:hash(pins),transitionHash:hash(result),currentSnapshotHash:result.currentAllLessonsAndRecipesHash}));
