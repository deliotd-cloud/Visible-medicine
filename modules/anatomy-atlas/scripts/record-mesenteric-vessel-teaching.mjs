// Mechanical, immutable-parent transition; never imported by the runtime.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import branchPins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import centralPins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
assert(process.argv.slice(2).every(arg=>arg==='--check'),'Unknown transition argument');
const parentCommit='72087cc2ece8f2715e2c7a552e9aed3e856c8c9a';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog:raw}=await contentContext();
const parent=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(raw);
assert.deepEqual(display,parent.bodyDisplayCatalog(raw));
assert.deepEqual(api.structures,parent.structures);
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
const selected=[...branchPins.entries,...centralPins.entries].filter(e=>e.identity.bundle==='abdomen-vessels-mesenteric');
assert.equal(selected.length,14);assert.equal(new Set(selected.map(e=>e.identity.id)).size,14);
assert.deepEqual(selected.map(e=>e.identity.id).sort(),display.structures.filter(s=>s.bundle==='abdomen-vessels-mesenteric').map(s=>s.id).sort());
for(const {identity}of selected)assert.deepEqual(display.structures.filter(s=>s.id===identity.id),[identity]);
const tabs=['anatomy','function','quiz'];
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
const entries=selected.flatMap(({identity})=>tabs.map(tab=>{
 const previous=parent.bodyLesson(identity,tab),current=api.bodyLesson(identity,tab);
 assert.equal(current.readiness,'draft');assert.notDeepEqual(current,previous);
 assert.deepEqual(api.mesentericVesselTeachingLesson(identity,tab),current);
 return{identity,tab,previous,previousHash:hash(previous),currentHash:hash(current)};
}));
const changed=new Set(entries.map(e=>e.identity.id+'|'+e.tab));let preserved=0;
for(const s of display.structures)for(const tab of api.contentTabs)if(!changed.has(s.id+'|'+tab)){
 assert.deepEqual(api.bodyLesson(s,tab),parent.bodyLesson(s,tab),'Unexpected topic change '+s.id+'|'+tab);preserved++;
}
assert.equal(preserved,9894);
const record={parentCommit,catalogHash:hash(display),originalBranchPinsHash:hash(branchPins),originalCentralPinsHash:hash(centralPins),previousSnapshotHash:hash(snapshot(parent)),currentSnapshotHash:hash(snapshot(api)),entries};
const path=new URL('../content/mesenteric-vessel-teaching.transition.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({changed:entries.length,preserved,structures:14,transitionHash:hash(record),clinicalApproval:false}));
