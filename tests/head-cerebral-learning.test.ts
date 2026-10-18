import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {HEAD_LINK_REVISION,headConceptFromAtlasQuery} from '../lib/head-atlas-links.ts';
import {HEAD_LEARNING_REVISION,headLearningEntries,headLearningLinks,headLearningNavigation,headLearningPacket,headLearningSequences,headLearningSteps,parseHeadLearningIntent} from '../lib/head-atlas-learning.ts';
import {HEAD_TEACHING_REVISION} from '../lib/head-atlas-teaching.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

const lobes=['cortex-left-frontal-lobe','cortex-right-frontal-lobe','cortex-left-parietal-lobe','cortex-right-parietal-lobe',
  'cortex-left-temporal-lobe','cortex-right-temporal-lobe','cortex-left-occipital-lobe','cortex-right-occipital-lobe'];
const hippocampi=['limbic-left-hippocampus','limbic-right-hippocampus'];
const parent='vm:anatomy:body:head-neck:midline:organ:brain';
const parentHash='f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335';
const lobeHash='7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410';
const hippocampusHash='11cf97da7aa459f1181c79278b41c9c4369f8954eb5d4a00d1bc22b5cf28964e';
const entries:HeadEntry[]=[...lobes,...hippocampi].map(id=>{
  const [,side,name]=id.split('-'),lobe=id.startsWith('cortex-');
  return {id:`cth.${lobe?'ctx.'+name+'_lobe':'dgm.hippocampus'}.${side}`,
    label:`${side==='left'?'Left':'Right'} ${name}${lobe?' lobe':''} — regional mask`,
    family:lobe?'ctx':'dgm',laterality:side,representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1}};
});

test('original sequence order is retained and new source-backed slots are exact',()=>{
  assert.deepEqual(headLearningSequences.slice(0,3),[
    {id:'brainstem',label:'Brainstem orientation',concepts:['brainstem-midbrain','brainstem-pons','brainstem-medulla']},
    {id:'ventricles',label:'Ventricular spaces',concepts:['ventricle-left-lateral','ventricle-right-lateral','ventricle-third','ventricle-fourth']},
    {id:'deep-grey',label:'Paired deep grey structures',concepts:['deep-left-caudate','deep-right-caudate','deep-left-putamen','deep-right-putamen','deep-left-globus-pallidus','deep-right-globus-pallidus','deep-left-thalamus','deep-right-thalamus']},
  ]);
  assert.deepEqual(headLearningSequences.slice(3).map(({id,label,concepts})=>({id,label,concepts})),[
    {id:'cerebral-lobes',label:'Cerebral lobes',concepts:lobes},
    {id:'hippocampi',label:'Paired hippocampi',concepts:hippocampi},
  ]);
  assert.equal(headLearningSequences.flatMap(sequence=>sequence.concepts).length,25);
  assert.equal(new Set(headLearningSequences.flatMap(sequence=>sequence.concepts)).size,25);
  for(const [sequenceId,ids] of [['cerebral-lobes',lobes],['hippocampi',hippocampi]] as const)
    for(const [index,conceptId] of ids.entries()){
      const links=headLearningLinks({sequenceId,conceptId});assert(links?.atlasHref);
      const atlas=new URL(links.atlasHref,'https://example.invalid').searchParams;
      const [,side,name]=conceptId.split('-');
      assert.deepEqual(Object.fromEntries([...atlas].filter(([key])=>!key.startsWith('head'))),{
        study:'2',structure:parent,side,source:parentHash,detail:'cerebral',
        part:`vm:anatomy:body:head-neck:${side}:organ:${side}-${conceptId.startsWith('cortex-')?name+'-lobe':'hippocampus'}`,
        partSource:conceptId.startsWith('cortex-')?lobeHash:hippocampusHash,concept:conceptId,
      });
      assert.equal(atlas.get('headStep'),String(index));
      assert.equal(atlas.get('headRevision'),HEAD_LINK_REVISION);
      assert.deepEqual(parseHeadLearningIntent(atlas,'atlas'),{sequenceId,conceptId});
      assert.equal(headConceptFromAtlasQuery(atlas)?.conceptId,conceptId);
      const nav=headLearningNavigation({sequenceId,conceptId});assert(nav);
      assert.equal(nav.previous?.href??null,index?headLearningLinks({sequenceId,conceptId:ids[index-1]})?.atlasHref:null);
      assert.equal(nav.next?.href??null,index<ids.length-1?headLearningLinks({sequenceId,conceptId:ids[index+1]})?.atlasHref:null);
    }
});

test('draft sequence packet pins all ordered bindings and teaching revision without approval',()=>{
  const packet=headLearningPacket();
  assert.equal(packet.schema,'vm-head-learning-sequences-1');
  assert.equal(packet.headRevision,HEAD_LINK_REVISION);
  assert.equal(packet.teachingRevision,HEAD_TEACHING_REVISION);
  assert.equal(packet.status,'draft');
  assert.equal(packet.patientRegistration,false);
  assert.equal(packet.clinicalApproval,false);
  assert.equal(packet.publicationApproval,false);
  assert.equal(packet.sequences.length,5);
  assert.equal(packet.sequences.flatMap(sequence=>sequence.bindings).length,25);
  for(const sequence of packet.sequences){
    assert.deepEqual(sequence.bindings.map(binding=>binding?.conceptId),sequence.concepts);
    for(const binding of sequence.bindings)assert.equal(binding?.headRevision,HEAD_LINK_REVISION);
  }
  assert.equal(HEAD_LEARNING_REVISION,'47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052');
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),HEAD_LEARNING_REVISION);
});

test('new cerebral intents reject wrong, stale, duplicate, missing and mismatched source fields',()=>{
  for(const sequence of headLearningSequences.slice(3))for(const conceptId of sequence.concepts){
    const links=headLearningLinks({sequenceId:sequence.id,conceptId});assert(links?.atlasHref);
    const valid=new URL(links.atlasHref,'https://example.invalid').searchParams;
    for(const key of ['study','structure','side','source','detail','part','partSource','concept','headTour','headStep','headRevision']){
      const stale=new URLSearchParams(valid);stale.set(key,'stale');assert.equal(parseHeadLearningIntent(stale,'atlas'),null,key);
      const missing=new URLSearchParams(valid);missing.delete(key);assert.equal(parseHeadLearningIntent(missing,'atlas'),null,key);
      const duplicate=new URLSearchParams(valid);duplicate.append(key,valid.get(key)!);assert.equal(parseHeadLearningIntent(duplicate,'atlas'),null,key);
    }
    const swapped=new URLSearchParams(valid);
    swapped.set('partSource',conceptId.startsWith('cortex-')?hippocampusHash:lobeHash);
    assert.equal(parseHeadLearningIntent(swapped,'atlas'),null);
  }
});

test('missing cerebral slots remain in place without substitution or renumbering',()=>{
  for(const [sequenceId,ids,positions] of [['cerebral-lobes',lobes,[0,3,7]],['hippocampi',hippocampi,[0,1]]] as const){
    const available=entries.filter(entry=>ids.some(id=>entry.id.includes(id.startsWith('cortex-')?'ctx.':'dgm.hippocampus.')));
    for(const index of positions){
      const missing=available[index],remainder=available.filter(entry=>entry!==missing);
      const slots=headLearningSteps(remainder,sequenceId,'CT',HEAD_LINK_REVISION);
      assert.deepEqual(slots.map(slot=>[slot.index,slot.conceptId]),ids.map((id,slot)=>[slot,id]));
      assert.equal(slots[index].entry,null);
      assert.deepEqual(slots.map(slot=>slot.entry),available.map((entry,slot)=>slot===index?null:entry));
      assert.deepEqual(headLearningEntries(remainder,sequenceId,'CT',HEAD_LINK_REVISION),remainder);
    }
    assert.deepEqual(headLearningSteps(available,sequenceId,'CT','stale'),[]);
  }
});
