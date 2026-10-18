import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {HEAD_STUDY_SET_LIMIT,headStudySetEntries,toggleHeadStudySet,appendHeadStudySet,type HeadStudySet} from '../lib/head-study-set.ts';

const shape=[2,2,2],affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function entry(id:string):HeadEntry{
  return {id,label:id,family:'test',representation:'partial_mask',color:[1,0,0],opacity:{fill:.2,outline:1},
    mask:{file:`${id}.bin`,sha256:id.padEnd(64,'a'),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}};
}
function study(entries:HeadEntry[]):LoadedStudy{
  return {definition:{image:{file:'image.bin',sha256:'f'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine},entries}} as LoadedStudy;
}
const revision=HEAD_MANIFEST_SHA256;

test('batch append preserves prior selections, display order and whole-study mask eligibility',()=>{
  const a=entry('a'),b=entry('b'),c=entry('c');
  const duplicate={...entry('duplicate'),mask:{...a.mask!,file:'copy.bin'}},alias={...entry('alias'),source:{geometry_alias_of:b.id}},point={...entry('point'),mask:undefined};
  const active=study([a,b,c,duplicate,alias,point]);
  const before=toggleHeadStudySet(null,active,revision,b),targets=[c,a,c,b,duplicate,alias,point,{...a}];
  const after=appendHeadStudySet(before,active,revision,targets);
  assert.deepEqual(headStudySetEntries(after,active,revision),[b,c,a]);
  assert.deepEqual(headStudySetEntries(before,active,revision),[b]);
  assert.deepEqual(headStudySetEntries(appendHeadStudySet(after,active,revision,targets),active,revision),[b,c,a]);
  assert.equal(targets.length,8);
  assert.equal(appendHeadStudySet(before,active,'stale',targets),null);
  assert.equal(appendHeadStudySet(before,null,revision,targets),null);
  const other=study([{...a}]);
  assert.equal(appendHeadStudySet(before,other,revision,targets),null);
});

test('batch append stops at capacity without evicting an existing selection',()=>{
  const entries=Array.from({length:55},(_,i)=>entry(`batch${i}`)),active=study(entries);
  const before=toggleHeadStudySet(null,active,revision,entries[54]);
  const after=appendHeadStudySet(before,active,revision,entries);
  assert.deepEqual(headStudySetEntries(after,active,revision),[entries[54],...entries.slice(0,49)]);
  assert.deepEqual(headStudySetEntries(appendHeadStudySet(after,active,revision,[entries[50]]),active,revision),after!.entries);
  assert.deepEqual(headStudySetEntries(before,active,revision),[entries[54]]);
});

test('toggle preserves order, removes and readds at the end, and returns a defensive array',()=>{
  const a=entry('a'),b=entry('b'),c=entry('c'),active=study([a,b,c]);
  const first=toggleHeadStudySet(null,active,revision,a);
  const second=toggleHeadStudySet(first,active,revision,b);
  assert.deepEqual(headStudySetEntries(first,active,revision),[a]);
  assert.deepEqual(headStudySetEntries(second,active,revision),[a,b]);
  const read=headStudySetEntries(second,active,revision);read.pop();
  assert.deepEqual(headStudySetEntries(second,active,revision),[a,b]);
  const removed=toggleHeadStudySet(second,active,revision,a);
  assert.deepEqual(headStudySetEntries(removed,active,revision),[b]);
  assert.deepEqual(headStudySetEntries(toggleHeadStudySet(removed,active,revision,a),active,revision),[b,a]);
  assert.equal(toggleHeadStudySet(first,active,revision,a),null);
  assert.deepEqual(headStudySetEntries(second,active,revision),[a,b],'previous state is unchanged');
});

test('revision and loaded-study identity fail closed, including a clone with matching IDs',()=>{
  const a=entry('a'),active=study([a]),set=toggleHeadStudySet(null,active,revision,a);
  const clone=study([{...a}]);
  assert.deepEqual(headStudySetEntries(set,clone,revision),[]);
  assert.deepEqual(headStudySetEntries(set,active,'stale'),[]);
  assert.deepEqual(headStudySetEntries(set,null,revision),[]);
  assert.equal(toggleHeadStudySet(set,active,'stale',a),null);
  assert.equal(toggleHeadStudySet(set,null,revision,a),null);
  assert.equal(toggleHeadStudySet(set,clone,revision,a),null,'old entry cannot enter cloned study');
  const newSet=toggleHeadStudySet(set,clone,revision,clone.definition.entries[0]);
  assert.deepEqual(headStudySetEntries(newSet,clone,revision),[clone.definition.entries[0]]);
  assert.deepEqual(headStudySetEntries(set,active,revision),[a]);
});

test('a mismatched prior study is never inspected or carried into the current one',()=>{
  const old=entry('old'),next=entry('next'),previous=study([old]),current=study([next]);
  const unreadable:HeadStudySet={study:previous,revision,get entries():HeadEntry[]{throw Error('old shortlist read');}};
  assert.deepEqual(headStudySetEntries(unreadable,current,revision),[]);
  assert.deepEqual(headStudySetEntries(toggleHeadStudySet(unreadable,current,revision,next),current,revision),[next]);
});

test('only exact canonical whole-study mask entries are eligible',()=>{
  const a=entry('a'),b=entry('b');
  const duplicate={...entry('duplicate'),mask:{...a.mask!,file:'renamed.bin'}};
  const alias={...entry('alias'),source:{geometry_alias_of:a.id}};
  const point={...entry('point'),mask:undefined,points_ras_mm:[[0,0,0]]};
  const clone={...a};
  const active=study([a,duplicate,alias,point,b]);
  let set=toggleHeadStudySet(null,active,revision,a);
  for(const rejected of [duplicate,alias,point,clone]){
    const next=toggleHeadStudySet(set,active,revision,rejected);
    assert.deepEqual(headStudySetEntries(next,active,revision),[a]);
    assert.notEqual(next,set,'caller never receives the original mutable array');
    set=next;
  }
  assert.deepEqual(headStudySetEntries(toggleHeadStudySet(set,active,revision,b),active,revision),[a,b]);
  assert.equal(toggleHeadStudySet(null,active,revision,duplicate),null);
});

test('replaced definition entries invalidate saved identities even on the same LoadedStudy object',()=>{
  const a=entry('a'),active=study([a]),saved=toggleHeadStudySet(null,active,revision,a);
  const replacement={...a};active.definition.entries=[replacement];
  assert.deepEqual(headStudySetEntries(saved,active,revision),[]);
  assert.equal(toggleHeadStudySet(saved,active,revision,a),null);
  assert.deepEqual(headStudySetEntries(toggleHeadStudySet(saved,active,revision,replacement),active,revision),[replacement]);
});

test('at fifty entries, another add does not evict or mutate the prior set',()=>{
  const entries=Array.from({length:HEAD_STUDY_SET_LIMIT+1},(_,i)=>entry(`item${i}`)),active=study(entries);
  let set:HeadStudySet=null;
  for(const item of entries.slice(0,HEAD_STUDY_SET_LIMIT))set=toggleHeadStudySet(set,active,revision,item);
  const before=headStudySetEntries(set,active,revision);
  assert.equal(before.length,50);
  const full=toggleHeadStudySet(set,active,revision,entries[50]);
  assert.deepEqual(headStudySetEntries(full,active,revision),before);
  assert.deepEqual(headStudySetEntries(set,active,revision),before);
  const afterRemoval=toggleHeadStudySet(full,active,revision,entries[0]);
  assert.deepEqual(headStudySetEntries(toggleHeadStudySet(afterRemoval,active,revision,entries[50]),active,revision),[...before.slice(1),entries[50]]);
});

test('malformed duplicate or foreign saved entries fail closed without mutating inputs',()=>{
  const a=entry('a'),b=entry('b'),active=study([a,b]);
  const entries=[a,a],bad={study:active,revision,entries};
  assert.deepEqual(headStudySetEntries(bad,active,revision),[]);
  assert.deepEqual(headStudySetEntries(toggleHeadStudySet(bad,active,revision,b),active,revision),[b]);
  assert.deepEqual(entries,[a,a]);
  const foreign={study:active,revision,entries:[{...a}]};
  assert.deepEqual(headStudySetEntries(foreign,active,revision),[]);
});
