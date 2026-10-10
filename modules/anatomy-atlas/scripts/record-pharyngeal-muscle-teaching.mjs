// Mechanical transition from the immutable parent; never runtime code.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/pharyngeal-muscle-teaching-pins.json' with {type:'json'};

assert(process.argv.slice(2).every(arg=>arg==='--check'),'Unknown pharyngeal transition argument');
const parentCommit='ff8f76a80ad0b73a93421dac5431759ab96ea187';
const fmaIds=['FMA46631','FMA46632','FMA46635','FMA46636','FMA46667','FMA46668','FMA46669','FMA46670','FMA46671','FMA46672'];
const tabs=['anatomy','function','quiz'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog:raw}=await contentContext();
const parent=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(raw);
assert.deepEqual(display,parent.bodyDisplayCatalog(raw));
assert.deepEqual(api.structures,parent.structures);
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.equal(pins.entries.length,10);
assert.deepEqual(pins.entries.map(entry=>entry.identity.fmaId).sort(),fmaIds);
assert.equal(new Set(pins.entries.map(entry=>entry.identity.id)).size,10);
const families=new Map();
for(const {identity,family}of pins.entries){
 assert.deepEqual(display.structures.filter(s=>s.id===identity.id),[identity]);
 assert.equal(identity.region,'head-neck');assert.equal(identity.system,'muscles');assert.equal(identity.category,'muscle');
 assert(['left','right'].includes(identity.laterality));
 assert(typeof family==='string'&&family.length>0);
 const sides=families.get(family)??new Set();sides.add(identity.laterality);families.set(family,sides);
}
assert.equal(families.size,5);
for(const sides of families.values())assert.deepEqual([...sides].sort(),['left','right']);
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
const entries=pins.entries.flatMap(({identity})=>tabs.map(tab=>{
 const previous=parent.bodyLesson(identity,tab),current=api.bodyLesson(identity,tab);
 assert.equal(current.readiness,'draft');assert.notDeepEqual(current,previous);
 assert.deepEqual(api.pharyngealMuscleTeachingLesson(identity,tab),current);
 return {identity,tab,previous,previousHash:hash(previous),currentHash:hash(current)};
}));
const changed=new Set(entries.map(entry=>entry.identity.id+'|'+entry.tab));let preserved=0;
for(const s of display.structures)for(const tab of api.contentTabs)if(!changed.has(s.id+'|'+tab)){
 assert.deepEqual(api.bodyLesson(s,tab),parent.bodyLesson(s,tab),'Unexpected topic change '+s.id+'|'+tab);preserved++;
}
assert.equal(entries.length,30);assert.equal(preserved,9906);
const record={parentCommit,catalogHash:hash(display),originalPinsHash:hash(pins),previousSnapshotHash:hash(snapshot(parent)),currentSnapshotHash:hash(snapshot(api)),entries};
const path=new URL('../content/pharyngeal-muscle-teaching.transition.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({changed:entries.length,preserved,structures:10,families:families.size,transitionHash:hash(record),clinicalApproval:false}));
