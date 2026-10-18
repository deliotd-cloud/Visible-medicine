import assert from 'node:assert/strict';
import { test } from 'node:test';
import { candidateDigest } from '../lib/clinical-review-candidate.ts';
import { decodeFrozenWorksheet } from '../lib/frozen-candidate-worksheet.ts';

const hash='a'.repeat(64), id='vm:anatomy:body:foot:right:vessel:synthetic';
const reference='https://example.org/reference';
const sourcePart={file:'FJ1',sha256:hash};
const structure={id,fmaId:'FMA1',name:'Synthetic artery',sourceName:'Synthetic artery',system:'vessels',category:'artery',laterality:'right',region:'foot',regions:['foot'],bundle:'foot-bundle',nodeName:'Synthetic',bounds:{min:[0,0,0],max:[1,1,1]},center:[0.5,0.5,0.5],anchor:[0.5,0.5,0.5],sourceTree:'isa',sources:[sourcePart],coverageNote:'Partial teaching surface.'};
const bundle={id:'foot-bundle',url:'/atlas-runtime/foot/model.glb',bytes:100,sha256:hash,structures:1};
const tabs=['anatomy','function','ct','mri','xray','ultrasound','pathology','clinical','quiz'];
const review={checklistVersion:'body-review-1',checklists:{geometry:[{id:'g',label:'Geometry'}],teaching:[{id:'t',label:'Teaching'}],imaging:[{id:'i',label:'Imaging'}]},blockers:{geometry:[],teaching:[],imaging:['No registered image.']},teachingTabs:['anatomy']};

test('frozen canonical source-domain vector',async()=>{
  assert.equal(await candidateDigest({scope:{schema:'vm-body-review-worksheet-1',kind:'body-display-catalog',structureId:'synthetic'},source:{credit:'Fixture'}}),
    'b9c4cfb8b123aba0b720ca931f58266cc7e72ff515195ca04aac56cf5fd44345');
});

async function fixture(copy:string, mode:'inspection-only'|'personal-review'='inspection-only') {
  const scope={schema:'vm-body-review-worksheet-3',kind:'body-display-catalog',structureId:id};
  const source={structure,bundle,coordinateSystem:{up:'z'},sourceVersion:'1',licence:'CC BY',credit:'Synthetic source'};
  const topics=tabs.map(tab=>({tab,readiness:tab==='anatomy'?'draft':'pending',title:`${tab} topic`,body:tab==='anatomy'?copy:'Pending.',citations:[reference]}));
  const tour={id:'synthetic-tour',title:'Synthetic tour',description:copy,region:'foot',revision:'tour-v1',status:'draft',contextIds:[],steps:[{id:'one',title:'First stop',caption:copy,selectedId:id,view:'anterior',durationMs:24000,fadeOthers:true,references:[reference]}]};
  const guidedTours=[{tour,structures:[structure],bundles:[bundle],coordinateSystem:{up:'z'},sourceVersion:'1',frame:{min:[0,0,0],max:[1,1,1]},transitionMs:1800,transition:'quintic-orbit',separation:0,continuousPlayback:{version:1},limitations:'Draft teaching only.'}];
  const checklist={geometry:['Inspect source.'],teaching:['Inspect teaching.'],imaging:['No images.']};
  const fingerprints={source:await candidateDigest({scope:{...scope,schema:'vm-body-review-worksheet-1'},source}),teaching:await candidateDigest({scope:{...scope,schema:'vm-body-review-worksheet-2'},topics,reasoning:null,guidedTours}),checklist:await candidateDigest({scope:{...scope,schema:'vm-body-review-worksheet-2'},checks:checklist})};
  const material={...scope,status:'worksheet-not-submitted',approval:false,source,topics,reasoning:null,guidedTours,fingerprints,materialHash:await candidateDigest({scope,fingerprints}),atlasLink:`/regions/foot?study=1&structure=${encodeURIComponent(id)}&side=both&source=${hash}`,checklist,reviewerNotes:{reviewer:'',qualification:'',date:'',evidence:[],corrections:[]},limits:['Inspection only.']};
  const context={catalogScope:'body-display-catalog',structureId:id,structureName:structure.name,materialHash:material.materialHash,sourceHash:fingerprints.source,teachingHash:fingerprints.teaching,rendererHash:hash,...review,revisions:{geometry:hash,teaching:hash,imaging:null}};
  const modelQuery=new URLSearchParams({kind:'body',region:'foot',study:'1',structure:id,side:'both',source:hash}).toString();
  const packet={schema:`visible-medicine.frozen-body-inspection/${mode==='personal-review'?2:1}`,decisionMode:mode,selections:[{material,context,modelQuery}]};
  const bytes=new TextEncoder().encode(JSON.stringify(packet));
  const fileHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  const descriptorMaterial={schema:`visible-medicine.clinical-review-candidate/${mode==='personal-review'?2:1}`,kind:mode==='personal-review'?'root-body-review':'root-body-inspection',label:'Synthetic',createdAt:'2026-10-18T00:00:00.000Z',atlasRevision:'b'.repeat(40),reviewRevision:hash,rendererRevision:hash,decisionMode:mode,...(mode==='personal-review'?{supersedes:null}:{}),selections:[{structureId:id,structureName:structure.name,region:'foot',materialHash:material.materialHash,sourceHash:fingerprints.source,teachingHash:fingerprints.teaching,...(mode==='personal-review'?{review}:{})}],files:[{path:'index.html',sha256:hash,bytes:1,contentType:'text/html',storage:'candidate'},{path:'viewer/index.html',sha256:hash,bytes:1,contentType:'text/html',storage:'candidate'},{path:'worksheet.json',sha256:fileHash,bytes:bytes.length,contentType:'application/json',storage:'candidate'}]};
  const candidate={...descriptorMaterial,id:await candidateDigest(descriptorMaterial)};
  return {candidate,bytes,packet,material};
}

test('two historically different lessons and tours authenticate independently',async()=>{
  const earlier=await fixture('Original lesson and tour.');
  const later=await fixture('Corrected lesson and tour.','personal-review');
  const a=await decodeFrozenWorksheet(earlier.candidate as never,earlier.bytes);
  const b=await decodeFrozenWorksheet(later.candidate as never,later.bytes);
  assert.equal(a.selections[0].material.topics[0].body,'Original lesson and tour.');
  assert.equal(b.selections[0].material.topics[0].body,'Corrected lesson and tour.');
  assert.equal(earlier.material.fingerprints.source,later.material.fingerprints.source);
  assert.equal(earlier.material.fingerprints.checklist,later.material.fingerprints.checklist);
  assert.notEqual(earlier.material.fingerprints.teaching,later.material.fingerprints.teaching);
  assert.notEqual(earlier.material.materialHash,later.material.materialHash);
});
test('rejects exact byte, identity, mode and nested URL tampering',async()=>{
  const f=await fixture('Original.');
  await assert.rejects(decodeFrozenWorksheet(f.candidate as never,new Uint8Array([...f.bytes,32])));
  await assert.rejects(decodeFrozenWorksheet(f.candidate as never,f.bytes.subarray(0,f.bytes.length-1)));
  await assert.rejects(decodeFrozenWorksheet({...f.candidate,decisionMode:'personal-review'} as never,f.bytes));
  const invalid=structuredClone(f.packet);
  invalid.selections[0].material.topics[0].citations=['http://example.org/reference'];
  const changed=new TextEncoder().encode(JSON.stringify(invalid));
  const fileHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',changed)),x=>x.toString(16).padStart(2,'0')).join('');
  const descriptor={...f.candidate,files:f.candidate.files.map(file=>file.path==='worksheet.json'?{...file,sha256:fileHash,bytes:changed.length}:file)};
  descriptor.id=await candidateDigest(Object.fromEntries(Object.entries(descriptor).filter(([k])=>k!=='id')));
  await assert.rejects(decodeFrozenWorksheet(descriptor as never,changed));
  await assert.rejects(decodeFrozenWorksheet(f.candidate as never,new Uint8Array(2*1024*1024+1)));
});
test('rejects descriptor-authenticated mixed claims and private worksheet fields',async()=>{
  const f=await fixture('Original.','personal-review');
  const resign=async (packet:unknown)=>{
    const bytes=new TextEncoder().encode(JSON.stringify(packet));
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
    const material={...f.candidate,files:f.candidate.files.map(file=>file.path==='worksheet.json'?{...file,sha256:digest,bytes:bytes.length}:file)};
    return {candidate:{...material,id:await candidateDigest(Object.fromEntries(Object.entries(material).filter(([k])=>k!=='id')))},bytes};
  };
  const cases=[
    (p:typeof f.packet)=>{p.selections[0].context.structureName='Foreign name';},
    (p:typeof f.packet)=>{p.selections[0].modelQuery+='&region=foreign';},
    (p:typeof f.packet)=>{p.selections[0].modelQuery=p.selections[0].modelQuery.replace('&side=both','');},
    (p:typeof f.packet)=>{p.selections[0].modelQuery=p.selections[0].modelQuery.replace('side=both','side=left');},
    (p:typeof f.packet)=>{p.selections[0].material.reviewerNotes.reviewer='Private person';},
    (p:typeof f.packet)=>{p.selections[0].material.fingerprints.source='b'.repeat(64);},
    (p:typeof f.packet)=>{p.selections[0].material.topics[0].body='Mixed historical body';},
    (p:typeof f.packet)=>{(p.selections[0].material as unknown as Record<string,unknown>).attestation='approved';},
  ];
  for(const mutate of cases){const p=structuredClone(f.packet);mutate(p);const signed=await resign(p);await assert.rejects(decodeFrozenWorksheet(signed.candidate as never,signed.bytes));}
});
