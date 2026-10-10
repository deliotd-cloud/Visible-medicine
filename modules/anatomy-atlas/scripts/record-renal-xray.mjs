// One-time, exact editorial transition for the two root-kidney X-ray lessons.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/abdominal-organ-imaging-pins.json' with {type:'json'};
import {abdominalOrganImagingGroups,abdominalOrganImagingTopics,abdominalOrganImagingReferences,abdominalOrganImagingLandmarks,abdominalOrganImagingScope} from '../content/abdominal-organ-imaging.ts';

assert(process.argv.slice(2).every(arg=>arg==='--check'),'Unknown renal X-ray transition argument');
const parentCommit='ce9dcce39fb088975bee2ec890730d1ee153d70f';
const originalPinsHash='4eaecd43646f4f7f2df08ee3dfb0846e3f372341009b4034b26695b38a5bfc69';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(hash(pins),originalPinsHash,'Original abdominal source pins changed');
const root=new URL('../',import.meta.url);
const source=execFileSync('git',['--no-replace-objects','show',parentCommit+':content/abdominal-organ-imaging.ts'],{cwd:new URL('.',root),encoding:'utf8',windowsHide:true,maxBuffer:16e6});
const previousExports={};
runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:previousExports});
const maps={groups:abdominalOrganImagingGroups,topics:abdominalOrganImagingTopics,references:abdominalOrganImagingReferences,landmarks:abdominalOrganImagingLandmarks,scope:abdominalOrganImagingScope};
const previousMaps={groups:previousExports.abdominalOrganImagingGroups,topics:previousExports.abdominalOrganImagingTopics,references:previousExports.abdominalOrganImagingReferences,landmarks:previousExports.abdominalOrganImagingLandmarks,scope:previousExports.abdominalOrganImagingScope};
const withoutXray=value=>{const topics=structuredClone(value.topics);delete topics.kidney.xray;return {groups:value.groups,topics,landmarks:value.landmarks,scope:value.scope};};
assert.equal(hash(withoutXray(maps)),hash(withoutXray(previousMaps)),'Unrelated abdominal editorial map changed');
for(const [key,url] of Object.entries(previousMaps.references))assert.equal(maps.references[key],url,'Existing reference changed: '+key);
const newReferences=Object.keys(maps.references).filter(key=>!Object.hasOwn(previousMaps.references,key));
assert.deepEqual(newReferences,['renalPlainFilm','renalIvp','renalStoneRadiopacity'],'Exactly three new renal X-ray references required');
for(const key of newReferences){assert.match(maps.references[key],/^https:\/\//);assert(maps.topics.kidney.xray.references.includes(key),'New reference unused by renal X-ray');}
assert.notEqual(hash(maps.topics.kidney.xray),hash(previousMaps.topics.kidney.xray),'Renal X-ray draft must change');
const focus=value=>({topic:value.topics.kidney.xray,groups:value.groups.kidney,landmark:value.landmarks.kidney,scope:value.scope.kidney,references:value.references});

const {api,catalog:raw}=await contentContext();
const parent=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(raw);
assert.equal(hash(display),hash(parent.bodyDisplayCatalog(raw)),'Root source catalog changed');
assert.deepEqual(api.structures,parent.structures,'Shoulder source changed');
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles,'Dissection recipes changed');
const selected=pins.entries.filter(entry=>['FMA7204','FMA7205'].includes(entry.identity.fmaId));
assert.equal(selected.length,2);assert.equal(new Set(selected.map(entry=>entry.identity.id)).size,2);
for(const entry of selected)assert.deepEqual(display.structures.filter(s=>s.id===entry.identity.id),[entry.identity]);
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
const entries=selected.map(entry=>{
 const previous=parent.bodyLesson(entry.identity,'xray'),current=api.bodyLesson(entry.identity,'xray');
 assert.equal(previous.readiness,'draft');assert.equal(current.readiness,'draft');
 assert.notDeepEqual(current,previous,'Both renal X-ray lessons must advance');
 assert.deepEqual(api.abdominalOrganImagingLesson(entry.identity,'xray'),current);
 return {identity:entry.identity,tab:'xray',previous,previousHash:hash(previous),currentHash:hash(current)};
});
const changed=new Set(entries.map(entry=>entry.identity.id+'|xray'));
let preserved=0;
for(const s of display.structures)for(const tab of api.contentTabs){
 if(changed.has(s.id+'|'+tab))continue;
 assert.deepEqual(api.bodyLesson(s,tab),parent.bodyLesson(s,tab),'Foreign teaching change: '+s.id+'|'+tab);
 preserved++;
}
assert.equal(preserved,display.structures.length*api.contentTabs.length-2);
const record={parentCommit,originalPinsHash,catalogHash:hash(display),previousSnapshotHash:hash(snapshot(parent)),currentSnapshotHash:hash(snapshot(api)),previousMetadataHash:hash(previousMaps),currentMetadataHash:hash(maps),newReferences,focus:{previous:focus(previousMaps),current:focus(maps)},entries};
const path=new URL('../content/renal-xray.transition.json',import.meta.url),text=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({changed:entries.length,preserved,transitionHash:hash(record),clinicalApproval:false}));
