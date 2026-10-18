import assert from 'node:assert/strict';
import test from 'node:test';
import {createHeadViewHistory,HEAD_VIEW_ENTRY_KEY,HEAD_VIEW_EXTERNAL_HISTORY_KEY,type HeadHistoryScope} from '../lib/head-view-history.ts';

let serial=0;
const token=()=>`opaque-${++serial}`;
function scope(modality:'CT'|'MRI'='CT',shape=[80,120,150],revision='revision-1'){
  const definition={image:{shape_kji:shape,sha256:'a'.repeat(64),file:'CT/native.nii',dtype:'int16'},entries:[]};
  const pkg={manifest:{studies:{CT:definition,MRI:definition}},files:new Map()};
  const study={definition,geometry:{shapeKJI:[...shape]},data:new Int16Array(0),range:[0,100]};
  return {pkg,study,modality,revision} as unknown as HeadHistoryScope;
}
const view=(cursor:[number,number,number]=[67,60,40])=>({cursor,layout:'axial' as const,windowing:[40,80] as [number,number]});

test('two exact history entries restore independently across Back and Forward while preserving Next fields',()=>{
  const history=createHeadViewHistory(8,token),ct=scope(),href='/atlas/ct-head?concept=brainstem-pons&headRevision=revision-1';
  const base={__NA:true,tree:{parallelRouterKey:'children'},other:'kept'};
  const first=history.ensure(base,href)!;
  assert.notEqual(first.state,base);assert.deepEqual(first.state.tree,base.tree);assert.equal(first.state.__NA,true);
  assert(Object.keys(first.state).every(key=>key===HEAD_VIEW_ENTRY_KEY||key in base));
  assert(history.save(first.state,href,ct,view([67,60,40])));
  const second=history.ensure(history.freshExternalState(first.state),href)!;
  assert.notEqual(second.token,first.token,'same URL still has distinct history entries');
  assert(history.save(second.state,href,ct,{...view([68,60,40]),layout:'coronal',windowing:[500,2500]}));
  assert.deepEqual(history.read(first.state,href,ct),view([67,60,40]));
  assert.deepEqual(history.read(second.state,href,ct),{...view([68,60,40]),layout:'coronal',windowing:[500,2500]});
  assert.deepEqual(history.read(first.state,href,ct),view([67,60,40]));
  assert.deepEqual(history.freshExternalState(first.state),{...base,[HEAD_VIEW_EXTERNAL_HISTORY_KEY]:true});
});

test('source, package, study, modality, revision, dimensions and URL are all exact',()=>{
  const history=createHeadViewHistory(8,token),ct=scope(),href='/atlas/ct-head';
  const state=history.ensure({__NA:true},href)!.state;
  assert(history.save(state,href,ct,view()));
  assert.equal(history.read(state,'/atlas/mri-head',ct),null);
  assert.equal(history.read(state,href,{...ct,modality:'MRI'}),null);
  assert.equal(history.read(state,href,{...ct,revision:'revision-2'}),null);
  assert.equal(history.read(state,href,{...ct,pkg:scope().pkg}),null);
  assert.equal(history.read(state,href,{...ct,study:scope().study}),null);
  assert.equal(history.read(state,href,{...ct,study:{...ct.study,geometry:{...ct.study.geometry,shapeKJI:[81,120,150]}}}),null);
  const copied=history.ensure(state,'/atlas/mri-head')!;
  assert.notEqual(copied.token,state[HEAD_VIEW_ENTRY_KEY]);
  assert.equal(history.read(copied.state,'/atlas/mri-head',ct),null,'copied framework state cannot transfer a CT position');
});

test('reverified configured-local package may restore only the same pinned native source',()=>{
  const history=createHeadViewHistory(8,token),prior=scope(),href='/atlas/ct-head';
  prior.pkg.source='configured-local';
  const state=history.ensure({},href)!.state;assert(history.save(state,href,prior,view()));
  const reopened=scope();reopened.pkg.source='configured-local';
  assert.deepEqual(history.read(state,href,reopened),view(),'fresh verified package object retains exact release identity');
  reopened.study.definition.image.sha256='b'.repeat(64);
  assert.equal(history.read(state,href,reopened),null);
  reopened.study.definition.image.sha256='a'.repeat(64);
  assert.equal(history.read(state,href,{...reopened,revision:'other'}),null);
  history.clearPackage(reopened.pkg);assert.equal(history.read(state,href,prior),null,'close invalidates earlier configured package too');
});

test('malformed, oversized, nonfinite and out-of-native-bounds receipts refuse without replacing a valid one',()=>{
  const history=createHeadViewHistory(8,token),ct=scope(),href='/atlas/ct-head';
  const state=history.ensure({},href)!.state;assert(history.save(state,href,ct,view()));
  const bad=[
    {...view(),cursor:[150,60,40]}, {...view(),cursor:[67,-1,40]}, {...view(),cursor:[67.5,60,40]},
    {...view(),cursor:[NaN,60,40]}, {...view(),cursor:[Infinity,60,40]}, {...view(),cursor:[67,60]},
    {...view(),layout:'3d'}, {...view(),windowing:[40,0]}, {...view(),windowing:[Infinity,80]},
    {...view(),windowing:[1_000_001,80]}, {...view(),windowing:[40,Number.NaN]},
    {...view(),answer:'x'.repeat(10_000)},
  ];
  for(const candidate of bad)assert.equal(history.save(state,href,ct,candidate),false);
  assert.deepEqual(history.read(state,href,ct),view());
  assert.equal(history.ensure({},'x'.repeat(2049)),null);
  const absurd=scope('CT',[4097,120,150]);assert.equal(history.save(state,href,absurd,view()),false);
  assert.deepEqual(history.read(state,href,ct),view());
});

test('only native view fields are accepted; close, replacement and eviction invalidate receipts',()=>{
  const history=createHeadViewHistory(2,token),ct=scope(),href='/atlas/ct-head';
  const state=history.ensure({},href)!.state;
  assert.equal(history.save(state,href,ct,{...view(),answer:'private',tourStep:'midbrain'}),false);
  assert(history.save(state,href,ct,view()));
  assert.deepEqual(history.read(state,href,ct),view());
  const returned=history.read(state,href,ct)!;returned.cursor[0]=0;returned.windowing[0]=999;
  assert.deepEqual(history.read(state,href,ct),view(),'caller cannot mutate stored view');
  history.clearPackage(ct.pkg);assert.equal(history.read(state,href,ct),null);
  const replacement=history.ensure(state,href)!;assert.notEqual(replacement.token,state[HEAD_VIEW_ENTRY_KEY]);
  assert(history.save(replacement.state,href,ct,view()));
  history.ensure({},'/atlas/mri-head');history.ensure({},'/atlas/ct-head?concept=other');
  assert.equal(history.read(replacement.state,href,ct),null,'oldest receipt evicted');
  history.clear();assert.equal(history.size(),0);
});

test('unsupported history state and absent or stale token safely leave canonical focus',()=>{
  const history=createHeadViewHistory(8,token),ct=scope(),href='/atlas/ct-head';
  for(const state of [null,42,'text',[],{[HEAD_VIEW_ENTRY_KEY]:'forged-token'}]){
    assert.equal(history.read(state,href,ct),null);
    if(!state||typeof state!=='object'||Array.isArray(state))assert.equal(history.ensure(state,href),null);
  }
  const state=history.ensure({},href)!.state;assert(history.save(state,href,ct,view()));
  assert.equal(createHeadViewHistory(8,token).read(state,href,ct),null,'reload has no in-memory receipt');
});
