import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';
const own='G:/VisibleMedicine-temp/proposals/20261101-renal-venous-xray';
const before=JSON.parse(fs.readFileSync(own+'/evidence/before.json'));
const after=JSON.parse(fs.readFileSync(own+'/evidence/after.json'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const selected=new Set(['renal-veins','renal-suprarenal-veins']);
const refKeys=['renalContrastVenography','renalAdrenalContrastVenography'];

test('tested module inputs still match their exact original or overlay files',()=>{
  for(const data of [before,after])for(const row of data.inputs)assert.equal(hash(fs.readFileSync(row.location)),row.sha256,row.path);
  assert.deepEqual(after.inputs.filter(row=>row.origin==='overlay').map(row=>row.path),[
    'content/renal-teaching.ts','content/renal-venous-xray.ts']);
  const old=new Map(before.inputs.map(row=>[row.path,row]));
  for(const row of after.inputs.filter(row=>row.origin==='native'))assert.equal(row.sha256,old.get(row.path)?.sha256,row.path);
});

test('only two explicitly scoped reading references are added',()=>{
  const current=structuredClone(after.nestedTeachingReferences);
  for(const key of refKeys){
    assert(!Object.hasOwn(before.nestedTeachingReferences,key));
    assert.equal(current[key].scopedToConcept,true);
    assert.match(current[key].url,/^https:\/\//);delete current[key];
  }
  assert.deepEqual(current,before.nestedTeachingReferences);
});

test('two X-ray drafts preserve every other concept and lesson placement',()=>{
  assert.equal(after.nestedConcepts.length,76);
  const old=new Map(before.nestedConcepts.map(c=>[c.id,c]));
  const changed=[];
  for(const concept of after.nestedConcepts){
    const prior=old.get(concept.id),projected=structuredClone(concept);assert(prior);
    if(selected.has(concept.id)){
      assert.equal(prior.imaging?.xray,undefined);assert.equal(concept.imaging.xray.readiness,'draft');
      assert(concept.imaging.xray.body.trim().split(/\s+/).length<200);
      delete projected.imaging.xray;changed.push(concept.id);
    }
    assert.deepEqual(projected,prior,concept.id);
  }
  assert.deepEqual(changed.sort(),[...selected].sort());
  let preserved=0,newDrafts=0;
  const oldLessons=new Map(before.conceptLessons.map(c=>[c.id,c.lessons]));
  for(const row of after.conceptLessons)for(const[topic,lesson]of Object.entries(row.lessons)){
    const prior=oldLessons.get(row.id)[topic];
    if(selected.has(row.id)&&topic==='xray'){assert.equal(prior.readiness,'pending');assert.equal(lesson.readiness,'draft');newDrafts++;}
    else{assert.deepEqual(lesson,prior);preserved++;}
  }
  assert.equal(newDrafts,2);assert.equal(preserved,682);
});

test('actual identity-checked resolver resolves exactly four intended source selections',()=>{
  assert.deepEqual(after.actual.map(row=>row.fmaId).sort(),['FMA14335','FMA14336','FMA14343','FMA14349']);
  const old=new Map(before.actual.map(row=>[row.id,row]));
  for(const row of after.actual){
    const prior=old.get(row.id);assert(prior);
    assert.equal(prior.lesson.readiness,'pending');assert.equal(row.lesson.readiness,'draft');
    const expected=row.conceptId==='renal-veins'?refKeys[0]:refKeys[1];
    assert.deepEqual(row.lesson.citations,[after.nestedTeachingReferences[expected].url,...(row.conceptId==='renal-suprarenal-veins'?[after.nestedTeachingReferences.renalReuseLicense.url]:[])]);
    assert.match(row.lesson.note,/specialist review pending/);
    assert.match(row.lesson.note,/No scan access or synchronization/);
    assert.deepEqual({...row,lesson:null},{...prior,lesson:null});
  }
  assert.equal(before.mutationsRejected,12);assert.equal(after.mutationsRejected,12);
});

test('native checkout is unchanged and the pending website source manifest keeps its seal',()=>{
  assert.equal(hash(fs.readFileSync('G:/VisibleMedicine-temp/staging/20261101-hepatic-website/WEBSITE_SOURCE.json')),'9412dcb2aa53e4732138b622a74a8fe6f14fa0e9a90a03f05ab773cf41829bf7');
  for(const row of before.inputs)assert.equal(hash(fs.readFileSync(row.location)),row.sha256);
  const native='G:/VisibleMedicine-temp/staging/20261101-hepatic-native-integration/atlas';
  const git=args=>execFileSync('git',args,{cwd:native,encoding:'utf8',windowsHide:true}).trim();
  assert.equal(git(['rev-parse','HEAD']),'b688ddd0c1fb6392ba8e8d7890142d750c8100f1');
  assert.equal(git(['status','--porcelain']),'');
});
