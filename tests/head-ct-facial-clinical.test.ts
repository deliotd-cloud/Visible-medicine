import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {headCtFacialClinicalContent as content,headCtFacialClinicalPacket as packet,headCtFacialClinicalForConcept as resolve,headCtFacialClinicalForReference as reference,verifiedHeadCtFacialClinicalRevision as verify,HEAD_CT_FACIAL_CLINICAL_REVISION as revision} from '../lib/head-ct-facial-clinical.ts';

test('three exact facial targets have an independent draft clinical packet with factual-only references',async()=>{
  assert.equal(createHash('sha256').update(JSON.stringify(packet())).digest('hex'),revision);
  assert.equal(await verify(HEAD_LINK_REVISION),revision);assert.equal(content.status,'draft');assert.equal(content.reviewedAt,null);
  for(const flag of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[flag],false);
  assert.deepEqual(content.notes.map(n=>n.conceptId),['bone-left-zygomatic','bone-right-zygomatic','bone-mandible']);
  for(const note of content.notes){const value=resolve(note.conceptId,'CT',HEAD_LINK_REVISION);assert(value);assert.deepEqual(value.binding,headConceptById(note.conceptId));assert.equal(value.revision,revision);assert(note.sources.every(id=>content.sources.some(s=>s.id===id)));assert(value.sources.length>0);assert.match(value.scope,/unregistered/);assert.match(value.scope,/not findings/);}
  assert(content.sources.every(s=>new URL(s.url).hostname==='surgeryreference.aofoundation.org'));
  assert.match(content.reuse,/not image.*reuse permission/);
  for(const note of content.notes){const value=reference(note.conceptId,HEAD_LINK_REVISION);assert(value);assert.equal(Object.hasOwn(value,'imaging'),false);assert.equal(Object.hasOwn(value,'task'),false);assert.deepEqual(value.note,note);assert(value.sources.every(s=>note.sources.includes(s.id as never)));}
});

test('foreign, shifted, malformed and unavailable modality/revision requests cannot resolve a clinical note',async()=>{
  for(const id of ['unknown','bone-left-zygomatic-extra','Mandible','javascript:alert(1)',''])assert.equal(resolve(id,'CT',HEAD_LINK_REVISION),null);
  for(const id of content.notes.map(n=>n.conceptId)){
    assert.equal(resolve(id,'MRI',HEAD_LINK_REVISION),null);
    for(const rev of ['','0'.repeat(64),HEAD_LINK_REVISION+'0']){assert.equal(resolve(id,'CT',rev),null);assert.equal(await verify(rev),null);}
  }
});

test('altered content, source identity, order, approval flags and packet shape are refused',async()=>{
  const mutations:Array<(p:any)=>void>=[
    p=>p.content.notes[0].text+=' changed',p=>p.content.notes.reverse(),p=>p.bindings.reverse(),
    p=>p.bindings[0].headRevision='0'.repeat(64),p=>p.bindings[0].conceptId='bone-right-zygomatic',
    p=>p.bindings[0].atlasHref=p.bindings[1].atlasHref,p=>p.bindings[0].mriHref='/atlas/mri-head',
    p=>p.content.clinicalApproval=true,p=>p.content.publicationApproval=true,p=>p.content.patientRegistration=true,
    p=>p.content.reviewedAt='2026-10-16',p=>p.content.status='approved',p=>p.content.scope='Complete bones',
    p=>p.content.sources[0].url='https://invalid.test',p=>p.content.comparisonRevision='0'.repeat(64),
    p=>p.content.notes.push(p.content.notes[0]),p=>delete p.content.notes[0].caution,p=>p.extra='unknown',
  ];
  for(const mutate of mutations){const changed=structuredClone(packet());mutate(changed);assert.equal(await verify(HEAD_LINK_REVISION,changed),null);}
  for(const malformed of [null,[],{},true,'packet'])assert.equal(await verify(HEAD_LINK_REVISION,malformed),null);
  const cyclic:any={};cyclic.self=cyclic;assert.equal(await verify(HEAD_LINK_REVISION,cyclic),null);
  assert.equal(await verify(HEAD_LINK_REVISION,{number:BigInt(1)}),null);
});
