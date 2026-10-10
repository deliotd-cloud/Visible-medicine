// Intended destination: outputs/scripts/record-pancreatic-vessel-teaching.mjs.
// Mechanical transition from the immutable a2cd157 parent, never runtime code.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};

assert(process.argv.slice(2).every(arg=>arg==='--check'),'Unknown pancreatic transition argument');
const parentCommit='a2cd157a328ec69bb29ffa3aa3a7a4c84c53fe9c';
const bundle='abdomen-vessels-visceral-detail';
const tabs=['anatomy','function','quiz'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog:raw}=await contentContext();
const parent=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(raw);
assert.deepEqual(display,parent.bodyDisplayCatalog(raw));
assert.deepEqual(api.structures,parent.structures);
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
const selected=pins.entries.filter(entry=>entry.identity.bundle===bundle);
assert.equal(selected.length,11);
assert.equal(new Set(selected.map(entry=>entry.identity.id)).size,11);
assert.equal(new Set(selected.map(entry=>entry.identity.fmaId)).size,11);
assert.deepEqual(selected.map(entry=>entry.identity.id).sort(),display.structures.filter(s=>s.bundle===bundle).map(s=>s.id).sort());
for(const {identity}of selected)assert.deepEqual(display.structures.filter(s=>s.id===identity.id),[identity]);
const grouped=selected.find(entry=>entry.identity.fmaId==='FMA15398');
assert(grouped);assert.deepEqual(grouped.identity.sources.map(source=>source.file),['FJ3545','FJ3646','FJ3655']);
const gda=selected.find(entry=>entry.identity.fmaId==='FMA76574');
assert(gda);assert.deepEqual(gda.identity.sources.map(source=>source.file),['FJ3432']);
assert.match(gda.identity.name,/trunk of gastroduodenal artery/i);
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
const entries=selected.flatMap(({identity})=>tabs.map(tab=>{
 const previous=parent.bodyLesson(identity,tab),current=api.bodyLesson(identity,tab);
 assert.equal(current.readiness,'draft');assert.notDeepEqual(current,previous);
 assert.deepEqual(api.pancreaticVesselTeachingLesson(identity,tab),current);
 return {identity,tab,previous,previousHash:hash(previous),currentHash:hash(current)};
}));
const changed=new Set(entries.map(entry=>entry.identity.id+'|'+entry.tab));
let preserved=0;
for(const s of display.structures)for(const tab of api.contentTabs)if(!changed.has(s.id+'|'+tab)){
 assert.deepEqual(api.bodyLesson(s,tab),parent.bodyLesson(s,tab),'Unexpected topic change '+s.id+'|'+tab);preserved++;
}
assert.equal(entries.length,33);assert.equal(preserved,9903);
const record={parentCommit,catalogHash:hash(display),originalBranchPinsHash:hash(pins),previousSnapshotHash:hash(snapshot(parent)),currentSnapshotHash:hash(snapshot(api)),entries};
const path=new URL('../content/pancreatic-vessel-teaching.transition.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({changed:entries.length,preserved,structures:11,transitionHash:hash(record),clinicalApproval:false}));
