// Mechanical transition from the immutable parent; never runtime code.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/vocal-tissue-teaching-pins.json' with {type:'json'};

assert(process.argv.slice(2).every(arg=>arg==='--check'),'Unknown vocal tissue transition argument');
const parentCommit='169e3aef92e866dd98e97f5394c1d2c908268547';
const fmaIds=['FMA46592','FMA46593','FMA55245','FMA55246'];
const sourceFiles={FMA55245:'FJ2805',FMA55246:'FJ2787',FMA46592:'FJ2806',FMA46593:'FJ2788'};
const tabs=['anatomy','function'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog:raw}=await contentContext();
const parent=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(raw);
assert.deepEqual(display,parent.bodyDisplayCatalog(raw));
assert.deepEqual(api.structures,parent.structures);
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.equal(pins.sourceCommit,parentCommit);
assert.equal(pins.sourceVersion,'4.0');assert.equal(pins.license,'CC-BY-4.0');
assert.equal(pins.entries.length,4);
assert.deepEqual(pins.entries.map(entry=>entry.identity.fmaId).sort(),fmaIds);
assert.equal(new Set(pins.entries.map(entry=>entry.identity.id)).size,4);
const families=new Map();
for(const {identity,family}of pins.entries){
 assert.deepEqual(display.structures.filter(s=>s.id===identity.id),[identity]);
 assert.equal(identity.region,'head-neck');
 assert.deepEqual(identity.sources.map(source=>source.file),[sourceFiles[identity.fmaId]]);
 assert(['left','right'].includes(identity.laterality));
 assert(['ligament','vocalis'].includes(family));
 const sides=families.get(family)??new Set();sides.add(identity.laterality);families.set(family,sides);
 assert.deepEqual(api.bodyLesson(identity,'quiz'),parent.bodyLesson(identity,'quiz'),'Existing quiz changed '+identity.id);
}
assert.equal(families.size,2);
for(const sides of families.values())assert.deepEqual([...sides].sort(),['left','right']);
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
const entries=pins.entries.flatMap(({identity})=>tabs.map(tab=>{
 const previous=parent.bodyLesson(identity,tab),current=api.bodyLesson(identity,tab);
 assert.equal(current.readiness,'draft');assert.notDeepEqual(current,previous);
 assert.deepEqual(api.vocalTissueTeachingLesson(identity,tab),current);
 return {identity,tab,previous,previousHash:hash(previous),currentHash:hash(current)};
}));
const changed=new Set(entries.map(entry=>entry.identity.id+'|'+entry.tab));let preserved=0;
for(const s of display.structures)for(const tab of api.contentTabs)if(!changed.has(s.id+'|'+tab)){
 assert.deepEqual(api.bodyLesson(s,tab),parent.bodyLesson(s,tab),'Unexpected topic change '+s.id+'|'+tab);preserved++;
}
assert.equal(entries.length,8);assert.equal(preserved,9928);
const record={parentCommit,catalogHash:hash(display),originalPinsHash:hash(pins),previousSnapshotHash:hash(snapshot(parent)),currentSnapshotHash:hash(snapshot(api)),entries};
const path=new URL('../content/vocal-tissue-teaching.transition.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({changed:entries.length,preserved,structures:4,families:families.size,existingQuizTopicsExact:4,transitionHash:hash(record),clinicalApproval:false}));
