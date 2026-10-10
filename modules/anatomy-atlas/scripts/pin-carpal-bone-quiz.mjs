import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {carpalBoneQuizGroups} from '../content/carpal-bone-quiz.ts';
const parentCommit='acd99b11e279a0525f1488456c0a8adf2abb2cf7';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog),parent=await exactSourceHistoryApi(parentCommit);
assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));assert.deepEqual(snapshot(api,display),snapshot(parent,display));
const entries=Object.entries(carpalBoneQuizGroups).flatMap(([group,ids])=>ids.map(fma=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1,fma);const identity=matches[0];
 assert.equal(identity.system,'skeleton');assert.equal(identity.region,'hand');assert(['left','right'].includes(identity.laterality));
 const quiz=api.bodyLesson(identity,'quiz');assert.equal(quiz.readiness,'generated-identification');assert(!quiz.correctAnswer);
 return {identity,group,topics:['quiz'],previous:{quiz}};
}));assert.equal(entries.length,16);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const pins={parentCommit,coordinateSystem:display.coordinateSystem,bundles,previousAllLessonsAndRecipesHash:hash(snapshot(parent,display)),entries};
await writeFile('content/carpal-bone-quiz-pins.json',JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash,placements:16}));
