import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {headLearningLinks,headLearningSequences} from '../lib/head-atlas-learning.ts';
import {headImageHref,parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';

const params=(href:string)=>new URL(href,'https://example.invalid').searchParams;
const empty=()=>new URLSearchParams();

test('empty route and all twenty-five exact concepts stay canonical across CT and MRI',()=>{
  assert.deepEqual(parseHeadImageNavigation(empty(),HEAD_LINK_REVISION),{conceptId:null,position:null,invalid:false});
  assert.equal(headImageHref('CT',null,null,HEAD_LINK_REVISION),'/atlas/ct-head');
  assert.equal(headImageHref('MRI',null,null,HEAD_LINK_REVISION),'/atlas/mri-head');
  const ids=headLearningSequences.flatMap(sequence=>sequence.concepts);
  assert.equal(ids.length,25);assert.equal(new Set(ids).size,25);
  for(const id of ids){
    const link=headConceptById(id);assert(link);
    assert.deepEqual(parseHeadImageNavigation(params(link.ctHref!),HEAD_LINK_REVISION),{conceptId:id,position:null,invalid:false});
    for(const modality of ['CT','MRI'] as const){
      const href=headImageHref(modality,id,null,HEAD_LINK_REVISION)!;
      assert.equal(href,`/atlas/${modality.toLowerCase()}-head?concept=${id}&headRevision=${HEAD_LINK_REVISION}`);
      assert.deepEqual([...params(href).keys()],['concept','headRevision']);
      assert.deepEqual(parseHeadImageNavigation(params(href),HEAD_LINK_REVISION,modality),{conceptId:id,position:null,invalid:false});
    }
  }
});

test('standalone concept pins reject altered, repeated and private fields while legacy concept links remain readable',()=>{
  const good=params(headImageHref('CT','brainstem-pons',null,HEAD_LINK_REVISION)!);
  const accepted={conceptId:'brainstem-pons',position:null,invalid:false};
  const invalid={conceptId:null,position:null,invalid:true};
  assert.deepEqual(parseHeadImageNavigation(good,HEAD_LINK_REVISION,'CT'),accepted);
  assert.deepEqual(parseHeadImageNavigation(new URLSearchParams('concept=brainstem-pons'),HEAD_LINK_REVISION,'CT'),accepted);
  for(const key of ['concept','headRevision']){
    const duplicate=new URLSearchParams(good);duplicate.append(key,good.get(key)!);
    assert.deepEqual(parseHeadImageNavigation(duplicate,HEAD_LINK_REVISION,'CT'),invalid);
  }
  for(const [key,value] of [['concept','unknown'],['headRevision','stale'],['file','private.nii'],['token','secret'],['source','private-hash']]){
    const altered=new URLSearchParams(good);altered.set(key,value);
    assert.deepEqual(parseHeadImageNavigation(altered,HEAD_LINK_REVISION,'CT'),invalid);
  }
  assert.deepEqual(parseHeadImageNavigation(good,'stale','CT'),invalid);
  assert.deepEqual(parseHeadImageNavigation(new URLSearchParams('concept=limbic-left-amygdala'),HEAD_LINK_REVISION,'CT'),invalid);
  assert.deepEqual(parseHeadImageNavigation(params(headImageHref('MRI','limbic-left-amygdala',null,HEAD_LINK_REVISION)!),HEAD_LINK_REVISION,'CT'),invalid);
});

test('all five tour sequences and boundaries preserve only exact revision-bound intent',()=>{
  assert.deepEqual(headLearningSequences.map(item=>item.id),['brainstem','ventricles','deep-grey','cerebral-lobes','hippocampi']);
  for(const sequence of headLearningSequences){
    for(const modality of ['CT','MRI'] as const){
      const position={sequenceId:sequence.id,conceptId:null};
      const href=headImageHref(modality,null,position,HEAD_LINK_REVISION)!;
      assert.equal(href,`/atlas/${modality.toLowerCase()}-head?headTour=${sequence.id}&headRevision=${HEAD_LINK_REVISION}`);
      assert.deepEqual(parseHeadImageNavigation(params(href),HEAD_LINK_REVISION,modality),{conceptId:null,position,invalid:false});
    }
    for(const [index,id] of sequence.concepts.entries()){
      const position={sequenceId:sequence.id,conceptId:id},links=headLearningLinks(position);assert(links);
      for(const modality of ['CT','MRI'] as const){
        const href=headImageHref(modality,id,position,HEAD_LINK_REVISION);
        assert.equal(href,modality==='CT'?links.ctHref:links.mriHref);
        assert.deepEqual(parseHeadImageNavigation(params(href!),HEAD_LINK_REVISION),{conceptId:id,position,invalid:false});
        const query=params(href!);
        assert.deepEqual([...query.keys()],['concept','headTour','headStep','headRevision']);
        assert.equal(query.get('headStep'),String(index));
      }
    }
  }
});

test('stale, extra, duplicate, unknown and private query metadata cannot become navigation',()=>{
  const valid=params(headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})!.ctHref!);
  const rejected=(query:URLSearchParams)=>assert.deepEqual(parseHeadImageNavigation(query,HEAD_LINK_REVISION),{conceptId:null,position:null,invalid:true});
  assert.deepEqual(parseHeadImageNavigation(empty(),'stale'),{conceptId:null,position:null,invalid:true});
  assert.deepEqual(parseHeadImageNavigation(valid,'stale'),{conceptId:null,position:null,invalid:true});
  rejected(new URLSearchParams('concept=unknown'));
  rejected(new URLSearchParams('concept=brainstem-pons&concept=brainstem-pons'));
  for(const key of ['concept','headTour','headStep','headRevision']){
    const missing=new URLSearchParams(valid);missing.delete(key);rejected(missing);
    const duplicate=new URLSearchParams(valid);duplicate.append(key,valid.get(key)!);rejected(duplicate);
  }
  for(const [key,value] of [['headTour','other'],['headStep','99'],['headStep','01'],['headRevision','stale'],['concept','brainstem-medulla']] as const){
    const changed=new URLSearchParams(valid);changed.set(key,value);rejected(changed);
  }
  for(const [key,value] of [['study','private-study'],['source','private-hash'],['file','scan.nii'],['x','123'],['quizAnswer','pons'],['userId','edu:a'],['token','secret'],['focus','atlas-only']] as const){
    const extra=new URLSearchParams(valid);extra.set(key,value);rejected(extra);
    rejected(new URLSearchParams('concept=brainstem-pons&'+encodeURIComponent(key)+'='+encodeURIComponent(value)));
  }
  for(const bad of ['?headTour=brainstem','?headStep=1','?headRevision='+HEAD_LINK_REVISION,'?concept=brainstem-pons&headTour=brainstem'])rejected(params(bad));
});

test('MRI-only concepts and tours refuse CT but preserve exact MRI navigation',()=>{
  for(const sequenceId of ['mri-amygdalae','mri-midline-landmarks']){
    const concepts=sequenceId==='mri-amygdalae'?['limbic-left-amygdala','limbic-right-amygdala']:['commissure-corpus-callosum','endocrine-pituitary-gland'];
    for(const conceptId of concepts){
      const position={sequenceId,conceptId},links=headLearningLinks(position);assert(links);
      assert.equal(links.ctHref,undefined);
      assert(links.mriHref);
      assert.equal(headImageHref('CT',conceptId,null,HEAD_LINK_REVISION),null);
      assert.equal(headImageHref('CT',conceptId,position,HEAD_LINK_REVISION),null);
      assert.deepEqual(parseHeadImageNavigation(params(links.mriHref),HEAD_LINK_REVISION,'MRI'),{conceptId,position,invalid:false});
      assert.deepEqual(parseHeadImageNavigation(params(links.mriHref),HEAD_LINK_REVISION,'CT'),{conceptId:null,position:null,invalid:true});
      assert.equal(headImageHref('MRI',conceptId,position,HEAD_LINK_REVISION),links.mriHref);
      assert.deepEqual(parseHeadImageNavigation(params(`/atlas/ct-head?concept=${conceptId}`),HEAD_LINK_REVISION,'CT'),{conceptId:null,position:null,invalid:true});
    }
    assert.equal(headImageHref('CT',null,{sequenceId,conceptId:null},HEAD_LINK_REVISION),null);
    const choice=headImageHref('MRI',null,{sequenceId,conceptId:null},HEAD_LINK_REVISION)!;
    assert.deepEqual(parseHeadImageNavigation(params(choice),HEAD_LINK_REVISION,'MRI'),{conceptId:null,position:{sequenceId,conceptId:null},invalid:false});
    assert.equal(parseHeadImageNavigation(params(choice),HEAD_LINK_REVISION,'CT').invalid,true);
  }
});

test('sequence choices reject incomplete, duplicate, stale and private metadata without a substitute',()=>{
  const valid=new URLSearchParams({headTour:'ventricles',headRevision:HEAD_LINK_REVISION});
  for(const key of ['headTour','headRevision']){
    const missing=new URLSearchParams(valid);missing.delete(key);
    assert.equal(parseHeadImageNavigation(missing,HEAD_LINK_REVISION,'CT').invalid,true);
    const duplicate=new URLSearchParams(valid);duplicate.append(key,valid.get(key)!);
    assert.equal(parseHeadImageNavigation(duplicate,HEAD_LINK_REVISION,'CT').invalid,true);
  }
  for(const [key,value] of [['headTour','unknown'],['headRevision','stale'],['concept','brainstem-pons'],['headStep','0'],['file','private.nii'],['quizAnswer','pons'],['token','secret']]){
    const altered=new URLSearchParams(valid);altered.set(key,value);
    assert.deepEqual(parseHeadImageNavigation(altered,HEAD_LINK_REVISION,'MRI'),{conceptId:null,position:null,invalid:true});
  }
  assert.equal(parseHeadImageNavigation(valid,'stale','CT').invalid,true);
});

test('href builder refuses mismatched concepts, invalid tours and modalities without leaking fields',()=>{
  const current={sequenceId:'brainstem',conceptId:'brainstem-pons'};
  for(const modality of ['CT','MRI'] as const){
    assert.equal(headImageHref(modality,'brainstem-pons',current,'stale'),null);
    assert.equal(headImageHref(modality,'brainstem-pons',current,HEAD_LINK_REVISION+'0'),null);
    assert.equal(headImageHref(modality,'brainstem-medulla',current,HEAD_LINK_REVISION),null);
    assert.equal(headImageHref(modality,null,current,HEAD_LINK_REVISION),null);
    assert.equal(headImageHref(modality,'unknown',null,HEAD_LINK_REVISION),null);
    assert.equal(headImageHref(modality,'brainstem-pons',{sequenceId:'ventricles',conceptId:'brainstem-pons'},HEAD_LINK_REVISION),null);
    assert.equal(headImageHref(modality,null,{sequenceId:'unknown',conceptId:null},HEAD_LINK_REVISION),null);
    assert.equal(headImageHref(modality,'brainstem-pons',{sequenceId:'brainstem',conceptId:null},HEAD_LINK_REVISION),null);
  }
  assert.equal(headImageHref('PET' as 'CT',null,null,HEAD_LINK_REVISION),null);
  assert.equal(headImageHref('PET' as 'CT','brainstem-pons',current,HEAD_LINK_REVISION),null);
});
