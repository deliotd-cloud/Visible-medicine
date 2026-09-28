// Generate identity evidence from an immutable parent; never overwrite a pin.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {brainConnectionsQuizGroups} from '../content/brain-connections-quiz.ts';
const parentCommit='46fde2b6fa76af9349bd582f5ed328305bb26291';
const {api,catalog}=await contentContext();
const parent=await exactSourceHistoryApi(parentCommit,'display-content');
const display=parent.bodyDisplayCatalog(catalog);
assert.deepEqual(api.bodyDisplayCatalog(catalog),display);
const entries=Object.entries(brainConnectionsQuizGroups).flatMap(([group,fmas])=>fmas.map(fma=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);
  assert.equal(matches.length,1,fma); const identity=matches[0];
  const quiz=parent.bodyLesson(identity,'quiz');
  assert.equal(quiz.readiness,'generated-identification');
  return {identity,group,topics:['quiz'],previous:{quiz}};
}));
const bundleIds=new Set(entries.map(e=>e.identity.bundle));
const snapshot={body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(parent.contentTabs.map(t=>[t,parent.bodyLesson(s,t)]))})),shoulder:parent.structures,recipes:parent.dissectionProfiles};
const pins={parentCommit,coordinateSystem:display.coordinateSystem,bundles:display.bundles.filter(b=>bundleIds.has(b.id)),previousAllLessonsAndRecipesHash:createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),entries};
const path='content/brain-connections-quiz-pins.json';
if(process.argv.includes('--record'))await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
else assert.deepEqual(JSON.parse(await readFile(path,'utf8')),pins);
console.log(JSON.stringify({identities:entries.map(e=>({fma:e.identity.fmaId,name:e.identity.name})),bundles:pins.bundles.length,clinicalApproval:false}));
