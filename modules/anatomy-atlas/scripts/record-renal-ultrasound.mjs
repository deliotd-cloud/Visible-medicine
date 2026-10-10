// One-time immutable editorial transition for the two root-kidney US lessons.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/abdominal-organ-imaging-pins.json' with {type:'json'};
import {
  abdominalOrganImagingGroups,abdominalOrganImagingTopics,
  abdominalOrganImagingReferences,abdominalOrganImagingLandmarks,abdominalOrganImagingScope,
} from '../content/abdominal-organ-imaging.ts';

assert(process.argv.slice(2).every(arg=>arg==='--check'),'Unknown renal transition argument');
const parentCommit='d517b77d2df2feb465b4d557e4446ef2451cbaa2';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const originalPinsHash='4eaecd43646f4f7f2df08ee3dfb0846e3f372341009b4034b26695b38a5bfc69';
assert.equal(hash(pins),originalPinsHash,'Original eight-organ pins changed');
const source=execFileSync('git',['show',parentCommit+':content/abdominal-organ-imaging.ts'],{encoding:'utf8',maxBuffer:16e6});
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const oldExports={};runInNewContext(compiled,{exports:oldExports});
const currentMaps={groups:abdominalOrganImagingGroups,topics:abdominalOrganImagingTopics,references:abdominalOrganImagingReferences,landmarks:abdominalOrganImagingLandmarks,scope:abdominalOrganImagingScope};
const oldMaps={groups:oldExports.abdominalOrganImagingGroups,topics:oldExports.abdominalOrganImagingTopics,references:oldExports.abdominalOrganImagingReferences,landmarks:oldExports.abdominalOrganImagingLandmarks,scope:oldExports.abdominalOrganImagingScope};
const ordinary=maps=>{const topics=structuredClone(maps.topics);delete topics.kidney.ultrasound;return {groups:maps.groups,topics,landmarks:maps.landmarks,scope:maps.scope};};
assert.equal(hash(ordinary(currentMaps)),hash(ordinary(oldMaps)),'Unrelated abdominal imaging editorial map changed');
for(const [key,value] of Object.entries(oldMaps.references))assert.equal(currentMaps.references[key],value,'Previous reading link changed: '+key);
const focus=maps=>({topic:maps.topics.kidney.ultrasound,groups:maps.groups.kidney,landmark:maps.landmarks.kidney,scope:maps.scope.kidney,references:maps.references});
const {api,catalog:raw}=await contentContext();
const parent=await exactSourceHistoryApi(parentCommit);
const catalog=api.bodyDisplayCatalog(raw),oldCatalog=parent.bodyDisplayCatalog(raw);
assert.equal(hash(catalog),hash(oldCatalog),'Root source catalog changed');
assert.deepEqual(api.structures,parent.structures,'Shoulder source changed');
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles,'Dissection recipes changed');
const sourceEntries=pins.entries.filter(e=>['FMA7204','FMA7205'].includes(e.identity.fmaId));
assert.equal(sourceEntries.length,2,'Exactly two root-kidney pins required');
assert.equal(new Set(sourceEntries.map(e=>e.identity.id)).size,2);
for(const e of sourceEntries)assert.deepEqual(catalog.structures.find(s=>s.id===e.identity.id),e.identity);
const snapshot=value=>({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
const entries=sourceEntries.map(e=>{
  const previous=parent.bodyLesson(e.identity,'ultrasound'),current=api.bodyLesson(e.identity,'ultrasound');
  assert.equal(previous.readiness,'draft');assert.equal(current.readiness,'draft');
  assert.notDeepEqual(previous,current,'Renal Ultrasound revision must change each side');
  assert.deepEqual(api.abdominalOrganImagingLesson(e.identity,'ultrasound'),current);
  return {identity:e.identity,tab:'ultrasound',previous,previousHash:hash(previous),currentHash:hash(current)};
});
const changed=new Set(entries.map(e=>e.identity.id+'|ultrasound'));
let preserved=0;
for(const s of catalog.structures)for(const tab of api.contentTabs){
  if(changed.has(s.id+'|'+tab))continue;
  assert.deepEqual(api.bodyLesson(s,tab),parent.bodyLesson(s,tab),'Foreign teaching change: '+s.id+'|'+tab);
  preserved++;
}
assert.equal(preserved,catalog.structures.length*api.contentTabs.length-2);
const record={parentCommit,originalPinsHash,catalogHash:hash(catalog),previousSnapshotHash:hash(snapshot(parent)),currentSnapshotHash:hash(snapshot(api)),previousMetadataHash:hash(oldMaps),currentMetadataHash:hash(currentMaps),focus:{previous:focus(oldMaps),current:focus(currentMaps)},entries};
const path='content/renal-ultrasound.transition.json',text=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({changed:entries.length,preserved,transitionHash:hash(record),clinicalApproval:false}));
