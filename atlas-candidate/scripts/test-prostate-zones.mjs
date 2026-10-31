import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {prostateRevision} from './pin-prostate-zones.mjs';
import {createProstateZoneGeometries, createProstateSectionGeometry, prostateFields, prostateZoneAt, PROSTATE_ZONE_KEYS} from '../lib/prostate-zone-geometry.ts';
import {prostateConceptSelection, prostateZones, prostateZonesAvailable, PROSTATE_PARENT_ID, PROSTATE_PARENT_SOURCE} from '../lib/prostate-zones.ts';

test('model identity binds the current original geometry, teaching and presentation',()=>{
  const root=fileURLToPath(new URL('..',import.meta.url));
  const recorded=JSON.parse(fs.readFileSync(new URL('../content/prostate-zones-revision.json',import.meta.url),'utf8'));
  assert.deepEqual(recorded,prostateRevision(root));
  assert.match(recorded.sha256,/^[a-f0-9]{64}$/);
  assert.equal(recorded.clinicalReview,'pending');assert.equal(recorded.patientSpaceRegistration,null);
});

test('schematic compartments have distinct anatomical identities and explicit non-patient mapping',()=>{
  assert.equal(prostateZones.length,4);assert.equal(new Set(prostateZones.map(z=>z.id)).size,4);
  for(const zone of prostateZones){const link=prostateConceptSelection(zone.key);assert.equal(link.conceptId,zone.id);assert.equal(link.parentId,PROSTATE_PARENT_ID);assert.equal(link.patientSpaceRegistration,null);assert.equal(link.representation,'original-schematic');assert(!('worldPoint' in link));}
  assert.throws(()=>prostateConceptSelection('unknown'));
});
test('only the exact outer-prostate source can launch this contextual study',()=>{
  const parent={id:PROSTATE_PARENT_ID,fmaId:'FMA9600',sourceTree:'partof',sources:[{file:PROSTATE_PARENT_SOURCE.file,sha256:PROSTATE_PARENT_SOURCE.sha256}]};
  assert(prostateZonesAvailable(parent));assert(!prostateZonesAvailable(null));
  for(const bad of [{...parent,id:'other'},{...parent,fmaId:'other'},{...parent,sourceTree:'isa'},{...parent,sources:[]},{...parent,sources:[{file:'FJ3139',sha256:'0'.repeat(64)}]},{...parent,sources:[...parent.sources,...parent.sources]}])assert(!prostateZonesAvailable(bad));
});
test('orientation landmarks and volumes form a non-overlapping teaching partition',()=>{
  assert.equal(prostateZoneAt(.65,0,-.2),'peripheral');assert.equal(prostateZoneAt(.2,.25,.15),'transition');assert.equal(prostateZoneAt(0,.65,-.27),'central');assert.equal(prostateZoneAt(0,.1,.55),'stroma');
  assert.equal(prostateZoneAt(0,0,.08),null);assert.equal(prostateZoneAt(NaN,0,0),null);
  const counts={peripheral:0,transition:0,central:0,stroma:0};
  for(let x=-1.2;x<1.2;x+=.08)for(let y=-1.2;y<1.2;y+=.08)for(let z=-1.2;z<1.2;z+=.08){
    const inside=PROSTATE_ZONE_KEYS.filter(k=>prostateFields(x,y,z)[k]>1e-9);assert(inside.length<=1,'No overlapping interiors');if(inside.length)counts[inside[0]]++;
    if(y<-.31)assert(!inside.includes('central'),'CZ tapers above the apex');
  }
  for(const key of PROSTATE_ZONE_KEYS)assert(counts[key]>25,key);assert(counts.peripheral>counts.transition);assert(counts.peripheral>counts.central);
});
test('each default mesh is finite, bounded, closed and has usable normals',()=>{
  const meshes=createProstateZoneGeometries();
  try{for(const key of PROSTATE_ZONE_KEYS){
    const g=meshes[key],p=g.getAttribute('position'),norm=g.getAttribute('normal'),indices=g.getIndex();assert(p.count>100,key);assert.equal(norm.count,p.count);assert(indices&&indices.count>300);
    assert([...p.array,...norm.array].every(Number.isFinite));assert([...p.array].every(v=>Math.abs(v)<1.31));
    const edges=new Map();for(let i=0;i<indices.count;i+=3){const f=[indices.getX(i),indices.getX(i+1),indices.getX(i+2)];for(let j=0;j<3;j++){const a=f[j],b=f[(j+1)%3],e=a<b?`${a}:${b}`:`${b}:${a}`;edges.set(e,(edges.get(e)??0)+1);}}
    assert([...edges.values()].every(count=>count===2),`${key}: every boundary edge shared twice`);
    assert.equal(g.userData.patientSpaceRegistration,null);
  }}finally{Object.values(meshes).forEach(g=>g.dispose());}
});
test('axial caps agree with the same scalar compartments and reject invalid input',()=>{
  for(const level of [-.7,0,.7])for(const key of PROSTATE_ZONE_KEYS){const g=createProstateSectionGeometry(key,level,32);try{const p=g.getAttribute('position');for(let i=0;i<p.count;i++){assert(Math.abs(p.getY(i)-level)<1e-6);assert(Number.isFinite(p.getX(i)));}}finally{g.dispose();}}
  assert.throws(()=>createProstateZoneGeometries(200));assert.throws(()=>createProstateSectionGeometry('central',NaN));assert.throws(()=>createProstateSectionGeometry('other',0));
});
