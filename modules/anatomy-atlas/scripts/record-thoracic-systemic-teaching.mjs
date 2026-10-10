// Mechanical transition from the immutable parent; never runtime code.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/thoracic-systemic-teaching-pins.json' with {type:'json'};

assert(process.argv.slice(2).every(arg=>arg==='--check'),'Unknown thoracic systemic transition argument');
const parentCommit='665e87ac91aea2d273d11562276b7be0f9aff567';
const fmaIds=['FMA10704','FMA4149','FMA68109','FMA71537'];
const sourceFiles={FMA4149:'FJ1934',FMA10704:'FJ3418',FMA68109:'FJ1933',FMA71537:'FJ3431'};
const tabs=['anatomy','function','quiz'];
const allTabs=['anatomy','function','ct','mri','xray','ultrasound','pathology','clinical','quiz'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog:raw}=await contentContext();
const parent=await exactSourceHistoryApi(parentCommit,'review-security');
const display=api.bodyDisplayCatalog(raw);
assert.deepEqual(display,parent.bodyDisplayCatalog(raw));
assert.deepEqual(api.structures,parent.structures);
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.equal(pins.sourceCommit,parentCommit);
assert.equal(pins.sourceVersion,'4.0');assert.equal(pins.license,'CC-BY-4.0');
assert.equal(pins.entries.length,4);
assert.deepEqual(pins.entries.map(entry=>entry.identity.fmaId).sort(),fmaIds);
assert.equal(new Set(pins.entries.map(entry=>entry.identity.id)).size,4);
const selectedIds=new Set(pins.entries.map(entry=>entry.identity.id));
assert.deepEqual([...selectedIds].sort(),display.structures.filter(s=>fmaIds.includes(s.fmaId)).map(s=>s.id).sort());
for(const {identity}of pins.entries){
 assert.deepEqual(display.structures.filter(s=>s.id===identity.id),[identity]);
 assert.equal(identity.bundle,'thorax-vessels-thoracic-detail');
 assert.equal(identity.region,'thorax');assert.equal(identity.laterality,'midline');
 assert.deepEqual(identity.sources.map(source=>source.file),[sourceFiles[identity.fmaId]]);
}
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
const entries=pins.entries.flatMap(({identity})=>tabs.map(tab=>{
 const previous=parent.bodyLesson(identity,tab),current=api.bodyLesson(identity,tab);
 assert.equal(current.readiness,'draft');assert.notDeepEqual(current,previous);
 assert.deepEqual(api.thoracicSystemicTeachingLesson(identity,tab),current);
 if(tab==='quiz'){
  assert.equal(current.bullets.length,4);
  assert.equal(new Set(current.bullets.map(choice=>choice.trim())).size,4);
  assert.equal(current.bullets.filter(choice=>choice===current.correctAnswer).length,1);
  assert(current.explanation?.trim());
 }
 return {identity,tab,previous,previousHash:hash(previous),currentHash:hash(current)};
}));
const changed=new Set(entries.map(entry=>entry.identity.id+'|'+entry.tab));let preserved=0;
assert.equal(display.structures.length,1104);assert.deepEqual(api.contentTabs,allTabs);
for(const s of display.structures)for(const tab of api.contentTabs)if(!changed.has(s.id+'|'+tab)){
 assert.deepEqual(api.bodyLesson(s,tab),parent.bodyLesson(s,tab),'Unexpected topic change '+s.id+'|'+tab);preserved++;
}
assert.equal(entries.length,12);assert.equal(preserved,9924);
const record={parentCommit,catalogHash:hash(display),originalPinsHash:hash(pins),previousSnapshotHash:hash(snapshot(parent)),currentSnapshotHash:hash(snapshot(api)),entries};
const path=new URL('../content/thoracic-systemic-teaching.transition.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({changed:entries.length,preserved,structures:4,transitionHash:hash(record),clinicalApproval:false}));
