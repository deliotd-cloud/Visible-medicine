import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {moveHeadStudySet,type HeadStudySet} from '../lib/head-study-set.ts';
import {createHeadStudyPlan,resolveHeadStudyPlan} from '../lib/head-study-plan.ts';

const revision=HEAD_MANIFEST_SHA256;
const shape=[2,2,2],affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function entry(id:string,index:number):HeadEntry{
  return {id,label:id,family:'synthetic',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1},
    mask:{file:`synthetic-${index}.bin`,sha256:index.toString(16).padStart(64,'0'),dtype:'uint8',
      shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}};
}
function study(entries:HeadEntry[]):LoadedStudy{
  return {definition:{image:{file:'synthetic-image.bin',sha256:'f'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine},entries}} as LoadedStudy;
}
const selected=(active:LoadedStudy,entries:HeadEntry[]):HeadStudySet=>({study:active,revision,entries});

test('moves only adjacent exact entries, preserves inputs and allows repeated moves',()=>{
  const a=entry('a',1),b=entry('b',2),c=entry('c',3),active=study([a,b,c]);
  const before=selected(active,[a,b,c]);
  const first=moveHeadStudySet(before,active,revision,c,-1);
  const second=moveHeadStudySet(first,active,revision,c,-1);
  const third=moveHeadStudySet(second,active,revision,c,1);
  assert.deepEqual(first?.entries,[a,c,b]);
  assert.deepEqual(second?.entries,[c,a,b]);
  assert.deepEqual(third?.entries,[a,c,b]);
  assert.deepEqual(before?.entries,[a,b,c]);
  for(const moved of [first,second,third]){
    assert.equal(moved?.study,active);
    assert.equal(moved?.revision,revision);
    assert.deepEqual(new Set(moved?.entries),new Set([a,b,c]));
    assert.notEqual(moved?.entries,before?.entries);
  }
});

test('boundaries and rejected entries or directions are valid-state no-ops',()=>{
  const a=entry('a',1),b=entry('b',2),foreign=entry('foreign',3),alias={...entry('alias',4),source:{geometry_alias_of:'a'}};
  const active=study([a,b,foreign,alias]),before=selected(active,[a,b]);
  for(const [candidate,direction] of [[a,-1],[b,1],[foreign,-1],[{...a},1],[alias,1],[a,0],[a,2]] as const){
    const after=moveHeadStudySet(before,active,revision,candidate,direction as -1|1);
    assert.deepEqual(after?.entries,[a,b]);
    assert.notEqual(after?.entries,before?.entries);
  }
  assert.deepEqual(before?.entries,[a,b]);
});

test('stale or malformed shortlist fails closed instead of salvaging entries',()=>{
  const a=entry('a',1),b=entry('b',2),active=study([a,b]),other=study([a,b]);
  const valid=selected(active,[a,b]);
  assert.equal(moveHeadStudySet(valid,other,revision,a,1),null);
  assert.equal(moveHeadStudySet(valid,active,'stale',a,1),null);
  assert.equal(moveHeadStudySet(valid,null,revision,a,1),null);
  assert.equal(moveHeadStudySet(null,active,revision,a,1),null);
  assert.equal(moveHeadStudySet(selected(active,[]),active,revision,a,1),null);
  for(const entries of [[a,a],[a,{...b}],[a,entry('foreign',3)]]){
    const bad=selected(active,entries);
    assert.equal(moveHeadStudySet(bad,active,revision,a,1),null);
    assert.deepEqual(bad?.entries,entries);
  }
  assert.equal(moveHeadStudySet({study:active,revision,entries:Array.from({length:51},()=>a)},active,revision,a,1),null);
  const unreadable={study:active,revision,get entries():HeadEntry[]{throw Error('unreadable');}};
  assert.equal(moveHeadStudySet(unreadable,active,revision,a,1),null);
});

test('explicit concept plan follows the reordered exact shortlist',()=>{
  const pons={...entry('cth.bst.pons',1),label:'Pons — regional mask',representation:'partial-mask',laterality:'midline_or_unpaired'};
  const vermis={...entry('cth.cer.cerebellar_vermis',2),label:'Cerebellar vermis — regional mask',representation:'mask',laterality:'midline_or_unpaired'};
  const active=study([pons,vermis]);
  const before=selected(active,[pons,vermis]);
  const after=moveHeadStudySet(before,active,revision,vermis,-1);
  const plan=createHeadStudyPlan(after,active,revision,'CT');
  assert.deepEqual(plan?.conceptIds,['cerebellum-vermis','brainstem-pons']);
  assert.deepEqual(resolveHeadStudyPlan(plan,active,revision,'CT'),[vermis,pons]);
  assert.deepEqual(before?.entries,[pons,vermis]);
});
