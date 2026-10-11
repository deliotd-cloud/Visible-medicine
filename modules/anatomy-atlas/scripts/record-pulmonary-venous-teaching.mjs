// Immutable, offline record of twelve revisions on four existing pulmonary veins.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/pulmonary-venous-teaching-pins.json' with {type:'json'};

assert(process.argv.slice(2).every(arg=>arg==='--check'),'Unknown pulmonary venous transition argument');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pinsHash='3f35fb9b9be6cfc7379946607fe9232377cdbd3c7f67cd0e2ffcb143bc4be176';
const parentCommit='b3fa10a344a82c597377ec9a76c6cda8cd53a5be';
assert.equal(hash(pins),pinsHash,'Immutable pulmonary venous pins changed');
assert.equal(pins.parentCommit,parentCommit);
assert.deepEqual(pins.tabs,['ct','mri','quiz']);
assert.equal(pins.entries.length,4);
// This immutable transition describes its completed milestone, not later drafts.
const completedCommit='0b38b93e5626f34bf1a79a45734171371d52fb3d';
const api=await exactSourceHistoryApi(completedCommit,'pulmonary-venous-teaching');
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const parent=await exactSourceHistoryApi(parentCommit,'review-security');
const display=api.bodyDisplayCatalog(raw),oldDisplay=parent.bodyDisplayCatalog(raw);
assert.deepEqual(display,oldDisplay,'Source catalog changed');
assert.equal(hash(display),pins.catalogHash);
assert.deepEqual(api.structures,parent.structures,'Shoulder source changed');
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles,'Dissection recipes changed');
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(value.contentTabs.map(tab=>[tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
assert.equal(hash(snapshot(parent)),pins.previousSnapshotHash,'Pinned predecessor snapshot changed');
const concepts=api.pulmonaryVenousTeachingConcepts,references=api.pulmonaryVenousTeachingReferences;
assert(concepts&&typeof concepts==='object','Current concept data required');
assert(references&&typeof references==='object','Current references required');
assert.equal(typeof api.pulmonaryVenousTeachingLesson,'function','Current lesson helper required');
const targets=new Set(),entries=[];
for(const pinned of pins.entries){
  const {identity,group,previous}=pinned;
  assert.equal(display.structures.filter(s=>s.id===identity.id).length,1);
  assert.deepEqual(display.structures.find(s=>s.id===identity.id),identity);
  assert.equal(typeof group,'string');
  for(const tab of pins.tabs){
    const key=identity.id+'|'+tab;assert(!targets.has(key),'Duplicate transition');targets.add(key);
    const before=parent.bodyLesson(identity,tab),current=api.bodyLesson(identity,tab);
    assert.deepEqual(before,previous[tab],'Pinned predecessor lesson changed');
    assert.deepEqual(api.pulmonaryVenousTeachingLesson(identity,tab),current,'Helper/body mismatch');
    assert.equal(current.readiness,'draft');
    assert.equal(before.readiness,tab==='quiz'?'generated-identification':'draft');
    assert.notDeepEqual(current,before,'Target did not change');
    entries.push({identity,group,tab,previous:before,previousHash:hash(before),currentHash:hash(current)});
  }
}
assert.equal(targets.size,12);
let preserved=0;
for(const s of display.structures)for(const tab of api.contentTabs){
  if(targets.has(s.id+'|'+tab))continue;
  assert.deepEqual(api.bodyLesson(s,tab),parent.bodyLesson(s,tab),'Foreign teaching change '+s.id+'|'+tab);preserved++;
}
assert.equal(preserved,9924);
const record={schemaVersion:1,parentCommit,pinsHash,catalogHash:hash(display),previousSnapshotHash:hash(snapshot(parent)),currentSnapshotHash:hash(snapshot(api)),conceptsHash:hash(concepts),referencesHash:hash(references),entries};
const path='content/pulmonary-venous-teaching.transition.json',serialized=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),serialized,'Unrecorded pulmonary venous transition');
else await writeFile(path,serialized,{flag:'wx'});
console.log(JSON.stringify({changed:entries.length,preserved,transitionHash:hash(record),clinicalApproval:false}));
