import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const own='G:/VisibleMedicine-temp/proposals/20261101-facial-bone-ultrasound';
const manifest=JSON.parse(fs.readFileSync(own+'/MANIFEST.json'));
const {source,overlay}=manifest;
// Use the actual existing source-identity comparator and its dependency unchanged.
const hooks=registerHooks({resolve(specifier,context,next){
  if(specifier==='./body-source-additions.ts' && context.parentURL===pathToFileURL(overlay+'/lib/facial-bone-ultrasound.ts').href)
    return next(pathToFileURL(source+'/lib/body-source-additions.ts').href,context);
  return next(specifier,context);
}});
const {facialBoneUltrasoundLesson:lesson}=await import(pathToFileURL(overlay+'/lib/facial-bone-ultrasound.ts'));
hooks.deregister();
const pins=JSON.parse(fs.readFileSync(overlay+'/content/facial-bone-ultrasound-pins.json'));
const snapshot=JSON.parse(fs.readFileSync(source+'/content/regional-teaching/head-neck.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');

test('each draft is bound to one of five unchanged current sources and prior pending lessons',()=>{
  assert.equal(pins.entries.length,5);
  assert.equal(sha(fs.readFileSync(source+'/content/regional-teaching/head-neck.json')),pins.regionalSnapshotSha256);
  const sides={};
  for(const e of pins.entries){
    const row=snapshot.entries.find(x=>JSON.parse(x.identity).id===e.identity.id);
    assert.deepEqual(JSON.parse(row.identity),e.identity);
    assert.deepEqual(row.lessons.ultrasound,e.previous);
    assert.equal(e.previous.readiness,'pending');
    const draft=lesson(e.identity,'ultrasound');
    assert.equal(draft.readiness,'draft');assert.equal(e.identity.validation.anatomicalReview,false);
    assert(draft.title.startsWith(e.identity.name+' ·'));
    assert.match(draft.note,/radiologist review/);assert.match(draft.note,/remain independent/);
    sides[e.family]=(sides[e.family]||[]).concat(e.identity.laterality);
  }
  assert.deepEqual(sides.mandible,['midline']);
  assert.deepEqual(sides.maxilla.sort(),['left','right']);assert.deepEqual(sides.zygoma.sort(),['left','right']);
});

test('only the intended five ultrasound cells change across the frozen head/neck catalogue',()=>{
  let changed=0,preserved=0;
  for(const row of snapshot.entries){
    const s=JSON.parse(row.identity);
    for(const [tab,prior] of Object.entries(row.lessons)){
      const result=lesson(s,tab);
      if(result){assert.equal(tab,'ultrasound');assert(pins.entries.some(e=>e.identity.id===s.id));changed++;}
      else{assert.deepEqual(result??prior,prior);preserved++;}
    }
  }
  assert.equal(changed,5);assert(preserved>2000);
});

test('stale geometry, identity, laterality, source hashes and review assertions are refused',()=>{
  for(const e of pins.entries){
    const changes=[s=>s.id+='-other',s=>s.fmaId='FMA0',s=>s.name+=' changed',s=>s.laterality='unspecified',
      s=>s.bounds.min[0]+=0.01,s=>s.anchor[0]+=0.01,s=>s.sources[0].sha256='0'.repeat(64),
      s=>s.sources.push({...s.sources[0]}),s=>s.validation.anatomicalReview=true,
      s=>s.provenance.license='unknown',s=>s.bundle='other',s=>s.sourceTree='partof'];
    for(const change of changes){const s=structuredClone(e.identity);change(s);assert.equal(lesson(s,'ultrasound'),undefined);}
  }
});

test('property insertion order does not alter identity; returned arrays cannot mutate later calls',()=>{
  for(const e of pins.entries){
    const reorder=v=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([k,x])=>[k,reorder(x)])):v;
    const expected=lesson(e.identity,'ultrasound');assert.deepEqual(lesson(reorder(e.identity),'ultrasound'),expected);
    const modified=lesson(e.identity,'ultrasound');modified.bullets.push('foreign');modified.citations.push('foreign');
    assert.deepEqual(lesson(e.identity,'ultrasound'),expected);
  }
});

test('neighbouring sources and other modalities remain unavailable to this resolver',()=>{
  for(const e of pins.entries)for(const tab of ['anatomy','function','ct','mri','xray','pathology','clinical','quiz','unknown'])assert.equal(lesson(e.identity,tab),undefined);
  for(const row of snapshot.entries){const s=JSON.parse(row.identity);if(!pins.entries.some(e=>e.identity.id===s.id))assert.equal(lesson(s,'ultrasound'),undefined);}
});

test('dispatch addition is exactly reversible and complete prior teaching source is preserved',()=>{
  const old=fs.readFileSync(source+'/app/body-content.ts','utf8');
  const current=fs.readFileSync(overlay+'/app/body-content.ts','utf8');
  const importLine="import {facialBoneUltrasoundLesson} from '../lib/facial-bone-ultrasound';\n";
  const seam='\n  const facialBoneUltrasound = facialBoneUltrasoundLesson(s, tab);\n  if (facialBoneUltrasound) return facialBoneUltrasound;';
  assert.equal(current.split(importLine).length,2);assert.equal(current.split(seam).length,2);
  assert.equal(current.replace(importLine,'').replace(seam,''),old);
  assert.equal(sha(Buffer.from(old)),manifest.sourceBefore['app/body-content.ts']);
});

test('saved overlay matches its exact source receipt',()=>{
  for(const row of manifest.files)assert.equal(sha(fs.readFileSync(path.join(overlay,row.path))),row.sha256,row.path);
  assert.equal(manifest.integrated,false);assert.equal(manifest.clinicalApproval,false);assert.equal(manifest.patientRegistration,false);
});
