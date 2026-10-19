// Introduction evidence only. Future unrelated authoring is covered by current contracts,
// not required to reproduce this whole-curriculum introduction snapshot.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {snapshot,hash} from './pin-pica-clinical.mjs';
import pins from '../content/foot-venous-arch-xray-pins.json' with {type:'json'};

assert(process.argv.length===2||(process.argv.length===3&&process.argv[2]==='--record'));
const parentCommit='f5052a1906bf9b87e5235bda57d367b1103729db';
assert.equal(pins.parentCommit,parentCommit);
assert.equal(hash(pins),'56d9bec622a97998cc01238ec81e4719b23ff65cc4b180971e189528965781c5');
const original=path=>execFileSync('git',['show',`${parentCommit}:${path}`],{
  maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(await readFile(catalogPath),original(catalogPath));
for(const path of ['content/foot-venous-arch-imaging.ts','lib/foot-venous-arch-imaging.ts',
  'content/foot-venous-arch-imaging-pins.json','content/foot-venous-arch-imaging-transition.json',
  'scripts/validate-foot-venous-arch-imaging.mjs','scripts/test-foot-arterial-projection-xray-current.mjs'])
  assert.deepEqual(await readFile(path),original(path),`${path}: original evidence unchanged`);
const ctx=await contentContext(),api=ctx.api,display=api.bodyDisplayCatalog(ctx.catalog);
const parent=await exactSourceHistoryApi(parentCommit,'display-review');
assert.deepEqual(display,parent.bodyDisplayCatalog(ctx.catalog));
assert.deepEqual(api.structures,parent.structures);
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.deepEqual(api.contentTabs,parent.contentTabs);
assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
const beforeRecords=parent.bodyContentRecords(display),records=api.bodyContentRecords(display);
const old=new Map(beforeRecords.map(r=>[r.id,r]));
assert.equal(records.length,1104);assert.equal(old.size,records.length);
const registry=new Map([...ctx.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);
const target=new Map(pins.entries.map(e=>[e.identity.id,e]));
const changes=[];let unchanged=0,teachingChanged=0;
for(const structure of display.structures){
  const prior=old.get(structure.id),record=records.find(r=>r.id===structure.id);
  assert(prior&&record);assert(validate(record),structure.id);
  const expected=structuredClone(prior);
  for(const tab of api.contentTabs){
    const before=parent.bodyLesson(structure,tab),after=api.bodyLesson(structure,tab);
    if(target.has(structure.id)&&tab==='xray'){
      assert.deepEqual(before,target.get(structure.id).previous.xray);
      assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
      expected.content.xray=after;changes.push({id:structure.id,tab,previousHash:hash(before),currentHash:hash(after)});
    }else{assert.deepEqual(after,before,structure.id+'|'+tab);unchanged++;}
  }
  assert.deepEqual(record,expected,structure.id+' unrelated exported fields');
  assert.equal(record.validation.clinicalApproval,'not-included');
  const a=await parent.bodyReviewMaterial(structure.id),b=await api.bodyReviewMaterial(structure.id);
  if(target.has(structure.id)){
    assert.notEqual(a.fingerprints.teaching,b.fingerprints.teaching);
    const expectedReview=structuredClone(a);expectedReview.topics=b.topics;
    expectedReview.fingerprints.teaching=b.fingerprints.teaching;expectedReview.materialHash=b.materialHash;
    assert.deepEqual(b,expectedReview);teachingChanged++;
  }else assert.deepEqual(b,a,structure.id+' unrelated review material');
  assert.equal(b.approval,false);
}
assert.equal(changes.length,2);assert.equal(unchanged,9934);assert.equal(teachingChanged,2);
const transition={parentCommit,pinsHash:hash(pins),
  previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,
  currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),
  changed:2,unchanged,teachingChanged,entries:changes,clinicalApproval:false,imagesImported:false};
const path='content/foot-venous-arch-xray-transition.json';
if(process.argv.includes('--record'))await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
else assert.deepEqual(JSON.parse(await readFile(path,'utf8')),transition);
console.log(JSON.stringify({changed:2,unchanged,teachingChanged,transitionHash:hash(transition),clinicalApproval:false}));
