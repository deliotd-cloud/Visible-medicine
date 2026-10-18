import assert from 'node:assert/strict';
import type {HeadPractice} from '../components/HeadAtlasPractice';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as navigation from '../lib/head-atlas-navigation.ts';
import * as imageLinks from '../lib/head-image-only-links.ts';
import {headLearningSequencesForModality,headLearningLinks} from '../lib/head-atlas-learning.ts';
import * as viewport from '../lib/head-slice-viewport.ts';
import {headIndexKey} from '../lib/head-index-keyboard.ts';
import {headMaskHits} from '../lib/head-mask-picking.ts';
import {createHeadFolderSession} from '../lib/head-folder-session.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(process.env.HEAD_VIEWER_BASELINE_SOURCE??new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
type Effect={deps:unknown[];cleanup?:()=>void};
const entry=(id:string,label:string)=>({id,label,family:'bst',color:[1,0,0],representation:'partial-mask',laterality:'midline_or_unpaired',opacity:{fill:.3,outline:1}});
const pons=entry('cth.bst.pons','Pons — regional mask'),midbrain=entry('cth.bst.midbrain','Midbrain — regional mask'),medulla=entry('cth.bst.medulla','Medulla oblongata — regional mask'),unmapped=entry('local.unmapped','Unmapped source');
const leftThalamus={...entry('cth.dgm.thalamus.left','Left thalamus — regional mask'),family:'dgm',representation:'mask',laterality:'left'},rightThalamus={...entry('cth.dgm.thalamus.right','Right thalamus — regional mask'),family:'dgm',representation:'mask',laterality:'right'};
const study={definition:{entries:[pons,midbrain,medulla,unmapped,leftThalamus,rightThalamus]},geometry:{shapeKJI:[2,2,2],views:{axial:{fixedAxisIJK:2},coronal:{fixedAxisIJK:1},sagittal:{fixedAxisIJK:0}},rasToIjk:(point:number[])=>point},range:[0,100],data:new Int16Array(8)};
const practiceMask=(target:typeof pons)=>({...target,mask:{sha256:`synthetic-${target.id}`,dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}});

for(const modality of ['CT','MRI'] as const)test(`${modality} comparison entry points discover links without selecting or upgrading stale anatomy`,async()=>{
 const first={...pons,id:`${modality==='CT'?'cth':'mrb'}.bst.pons`};
 const h=harness(`/atlas/${modality.toLowerCase()}-head?headTour=brainstem&headRevision=${'0'.repeat(64)}`,{modality,entries:[first,unmapped]});
 const inline=()=>h.walk(h.tree.props.comparison,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasInlineComparison');
 try{
  h.flush();assert(h.find('p',`The embedded ${modality} viewer is still available`));
  assert.equal(h.find('button','Find linked structures'),undefined);
  await h.choosePackage('synthetic-discovery');await h.settle();await h.settle();
  const search=()=>h.walk(h.find('label','Find a structure'),n=>n.type==='input')!;
  const focused:unknown[]=[];search().props.ref.current={focus:(value:unknown)=>focused.push(value)};
  search().props.onChange({target:{value:'no match'}});h.flush();
  const find=h.find('button','Find linked structures (1)')!;assert(find);
  const priorUrl=h.browser.location.search;
  h.act('Find linked structures');assert.equal(search().props.value,'');assert.equal(focused.length,1);
  assert.equal(h.walk(h.find('label','3D Atlas-linked only'),n=>n.type==='input')?.props.checked,true);
  assert(h.find('button',first.label));assert.equal(h.find('button',unmapped.label),undefined);
  assert.equal(h.browser.location.search,priorUrl,'discovery must not silently upgrade an invalid revision');
  assert.equal(inline(),undefined);assert.equal(h.find('button','Show beside 3D Atlas'),undefined);
  h.act(first.label);await h.settle();await h.settle();
  assert(h.find('a','Full 3D Atlas'));assert(h.find('p','side-by-side comparison stays here'));
  const open=h.find('button','Show beside 3D Atlas')!.props.onClick;
  const scanUrl=h.browser.location.search;h.act('Show beside 3D Atlas');
  assert.equal(inline()?.props.conceptId,'brainstem-pons');assert.equal(h.browser.location.search,scanUrl);
  h.act('Close side-by-side comparison');assert.equal(inline(),undefined);
  open();h.flush();assert.equal(inline(),undefined,'retired panel callback cannot reopen comparison');
  h.setPractice(true);h.flush();find.props.onClick();open();h.flush();
  assert.equal(h.find('button','Find linked structures'),undefined);assert.equal(inline(),undefined);
  h.setPractice(false);h.flush();h.act('Close atlas');find.props.onClick();open();h.flush();
  assert.equal(inline(),undefined);assert.equal(h.find('button','Find linked structures'),undefined);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)for(const missing of [false,true])test(`${modality} guided inline comparison navigates canonical steps, missing=${missing}, and retires callbacks`,async()=>{
 const prefix=modality==='CT'?'cth':'mrb';
 const first={...midbrain,id:`${prefix}.bst.midbrain`},middle={...pons,id:`${prefix}.bst.pons`},last={...medulla,id:`${prefix}.bst.medulla_oblongata`};
 const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-midbrain&headTour=brainstem&headStep=0&headRevision=${HEAD_LINK_REVISION}`;
 const h=harness(url,{modality,entries:missing?[first,last]:[first,middle,last]});
 const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning')!;
 const tour=()=>h.walk(h.tree.props.toolbar,n=>typeof n.type==='function'&&n.type.name==='HeadComparisonTour')!;
 const inline=()=>h.walk(h.tree.props.comparison,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasInlineComparison');
 try{
  h.flush();await h.choosePackage('synthetic-tour');await h.settle();await h.settle();
  guided().props.onSelect(first);h.flush();await h.settle();await h.settle();
  assert.equal(guided().props.comparisonReady,true);
  const oldOpen=guided().props.onCompare;
  oldOpen(last);h.flush();assert.equal(h.tree.props.comparison,undefined);
  guided().props.onCompare(first);h.flush();assert.equal(inline()?.props.conceptId,'brainstem-midbrain');assert(tour());
  const retired=tour().props.onNavigate;
  retired({sequenceId:'wrong',conceptId:'brainstem-pons'});h.flush();assert.equal(inline()?.props.conceptId,'brainstem-midbrain');
  tour().props.onNavigate({sequenceId:'brainstem',conceptId:'brainstem-pons'});h.flush();await h.settle();await h.settle();
  assert.equal(tour().props.position.conceptId,'brainstem-pons');
  assert.equal(inline()?.props.conceptId,missing?undefined:'brainstem-pons');
  retired({sequenceId:'brainstem',conceptId:'brainstem-midbrain'});oldOpen(first);h.flush();assert.equal(tour().props.position.conceptId,'brainstem-pons');
  tour().props.onNavigate({sequenceId:'brainstem',conceptId:'brainstem-medulla'});h.flush();await h.settle();await h.settle();
  assert.equal(inline()?.props.conceptId,'brainstem-medulla');
  const finish=tour().props.onFinish;finish();h.flush();assert.equal(h.tree.props.comparison,undefined);assert.equal(tour(),undefined);
  assert.doesNotMatch(h.browser.location.search,/headTour=/);assert.match(h.browser.location.search,/concept=brainstem-medulla/);
  finish();retired({sequenceId:'brainstem',conceptId:'brainstem-midbrain'});h.flush();assert.match(h.browser.location.search,/concept=brainstem-medulla/);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} pending scan annotation retains comparison mount without confirming a stale mask`,async()=>{
 const prefix=modality==='CT'?'cth':'mrb',first={...pons,id:`${prefix}.bst.pons`},second={...midbrain,id:`${prefix}.bst.midbrain`};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first,second],deferEntry:true});
 const inline=()=>h.walk(h.tree.props.comparison,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasInlineComparison');
 try{
  h.flush();await h.choosePackage('synthetic-pending-model');await h.settle();await h.settle();h.act(first.label);
  h.entryRequests.at(-1)!.resolve({entry:first,mask:new Uint8Array(8),focus:null});await h.settle();h.act('Compare beside 3D Atlas');
  const mounted=inline();assert(mounted);assert.equal(mounted.props.selectionReady,true);
  h.act(second.label);h.flush();assert.equal(inline()?.type,mounted.type);assert.equal(inline()?.props.conceptId,'brainstem-midbrain');assert.equal(inline()?.props.selectionReady,false);
  h.entryRequests.at(-1)!.resolve({entry:second,mask:new Uint8Array(8),focus:null});await h.settle();assert.equal(inline()?.props.selectionReady,true);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} inline reference comparison preserves the scan and follows only current exact selections`,async()=>{
 const prefix=modality==='CT'?'cth':'mrb';
 const first={...pons,id:`${prefix}.bst.pons`},second={...midbrain,id:`${prefix}.bst.midbrain`};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first,second,unmapped]});
 const inline=()=>h.walk(h.tree.props.comparison,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasInlineComparison');
 const slice=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!;
 try{
  h.flush();await h.choosePackage('synthetic-inline');await h.settle();await h.settle();
  assert.equal(h.find('button','Compare beside 3D Atlas')?.props.disabled,true);
  h.act(first.label);await h.settle();await h.settle();
  const originalStudy=slice().props.study;
  slice().props.onCursor([1,0,1]);h.flush();const position=slice().props.cursor;
  const originalLocation=h.browser.location.pathname+h.browser.location.search;
  h.act('Compare beside 3D Atlas');
  assert.equal(inline()?.props.conceptId,'brainstem-pons');
  assert.equal(inline()?.props.revision,HEAD_LINK_REVISION);
  assert.equal(slice().props.study,originalStudy);assert.deepEqual(slice().props.cursor,position);
  assert.equal(h.browser.location.pathname+h.browser.location.search,originalLocation,'opening inline comparison never leaves the scan route');
  const retired=inline()!.props.onSelectConcept;
  retired('brainstem-midbrain');h.flush();await h.settle();await h.settle();
  assert.equal(inline()?.props.conceptId,'brainstem-midbrain');assert.equal(slice().props.selected.entry,second);
  retired('brainstem-pons');h.flush();assert.equal(slice().props.selected.entry,second,'retired selection callback cannot override the new selection');
  const current=inline()!.props.onSelectConcept;
  current('not-a-mapped-concept');h.flush();assert.equal(slice().props.selected.entry,second);
  h.act(unmapped.label);await h.settle();await h.settle();
  assert.equal(inline(),undefined);assert(h.find('p','No model is substituted'));
  h.act(first.label);await h.settle();await h.settle();assert.equal(inline()?.props.conceptId,'brainstem-pons');
  const closed=inline()!.props.onSelectConcept;
  h.act('Close 3D comparison');assert.equal(h.tree.props.comparison,undefined);
  closed('brainstem-midbrain');h.flush();assert.equal(slice().props.selected.entry,first,'closing retires reverse actions');
  h.act('Compare beside 3D Atlas');h.setPractice(true);h.flush();assert.equal(h.tree.props.comparison,undefined,'practice must not expose model answers');
  h.setPractice(false);h.flush();assert.equal(h.tree.props.comparison,undefined,'practice does not auto-reopen comparison');
  h.act(first.label);await h.settle();await h.settle();h.act('Compare beside 3D Atlas');
  const previousPackage=inline()!.props.onSelectConcept;
  await h.choosePackage('synthetic-replacement');await h.settle();await h.settle();
  previousPackage('brainstem-midbrain');h.flush();assert.equal(h.tree.props.comparison,undefined);
  h.act('Close atlas');assert.equal(h.tree.props.comparison,undefined);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`head inline close focus: ${modality} returns to an enabled control after an unmapped selection`,async()=>{
 const first={...pons,id:`${modality==='CT'?'cth':'mrb'}.bst.pons`};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first,unmapped]});
 try{
  h.flush();await h.choosePackage('synthetic-close-focus');await h.settle();await h.settle();
  const search=h.walk(h.find('label','Find a structure'),node=>node.type==='input')!;
  const focus:Array<{target:string;options:unknown}>=[];
  search.props.ref.current={focus:(options:unknown)=>focus.push({target:'search',options})};
  h.act(first.label);await h.settle();await h.settle();
  const toolbar=h.find('button','Compare beside 3D Atlas')!;
  toolbar.props.ref.current={focus:(options:unknown)=>focus.push({target:'toolbar',options})};
  h.act('Compare beside 3D Atlas');focus.length=0;
  h.act('Close 3D comparison');
  assert.deepEqual(focus,[{target:'toolbar',options:{preventScroll:true}}],'mapped close returns to the enabled toolbar button');
  assert.equal(h.find('button','Compare beside 3D Atlas')?.props.disabled,false);

  h.act('Compare beside 3D Atlas');h.act(unmapped.label);await h.settle();await h.settle();
  assert(h.find('p','No model is substituted'));
  assert.equal(h.find('button','Close 3D comparison')?.props.disabled,false);
  focus.length=0;h.act('Close comparison');
  assert.equal(h.tree.props.comparison,undefined);
  assert.equal(h.find('button','Compare beside 3D Atlas')?.props.disabled,true);
  assert.deepEqual(focus,[{target:'search',options:{preventScroll:true}}],
    'closing the fallback must not focus the toolbar control that becomes disabled');
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`head inline close focus: ${modality} retires old fallback close callbacks`,async()=>{
 const first={...pons,id:`${modality==='CT'?'cth':'mrb'}.bst.pons`};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first,unmapped]});
 try{
  h.flush();await h.choosePackage('synthetic-retired-close');await h.settle();await h.settle();
  const focus:string[]=[];
  h.walk(h.find('label','Find a structure'),node=>node.type==='input')!.props.ref.current={focus:()=>focus.push('search')};
  h.act(first.label);await h.settle();await h.settle();
  h.find('button','Compare beside 3D Atlas')!.props.ref.current={focus:()=>focus.push('toolbar')};
  h.act('Compare beside 3D Atlas');h.act(unmapped.label);await h.settle();await h.settle();
  const staleSelectionClose=h.find('button','Close comparison')!.props.onClick;
  h.act(first.label);await h.settle();await h.settle();focus.length=0;
  staleSelectionClose();h.flush();
  assert.equal(h.tree.props.comparison?.type.name,'HeadAtlasInlineComparison','a retired selection cannot close the current comparison');
  assert.deepEqual(focus,[],'a retired selection cannot steal focus');

  h.act(unmapped.label);await h.settle();await h.settle();
  const stalePackageClose=h.find('button','Close comparison')!.props.onClick;
  await h.choosePackage('synthetic-replacement-close');await h.settle();await h.settle();
  h.act(first.label);await h.settle();await h.settle();h.act('Compare beside 3D Atlas');focus.length=0;
  stalePackageClose();h.flush();
  assert.equal(h.tree.props.comparison?.type.name,'HeadAtlasInlineComparison','a prior package cannot close the current comparison');
  assert.deepEqual(focus,[],'a prior package cannot steal focus');

  h.act(unmapped.label);await h.settle();await h.settle();
  const stalePracticeClose=h.find('button','Close comparison')!.props.onClick;
  h.setPractice(true);h.flush();focus.length=0;stalePracticeClose();h.flush();
  assert.equal(h.tree.props.comparison,undefined);assert.deepEqual(focus,[],'practice retires the fallback close callback');
  h.setPractice(false);h.flush();h.act(first.label);await h.settle();await h.settle();h.act('Compare beside 3D Atlas');
  h.act(unmapped.label);await h.settle();await h.settle();
  const staleUnmountClose=h.find('button','Close comparison')!.props.onClick;
  h.dispose();focus.length=0;staleUnmountClose();
  assert.deepEqual(focus,[],'an unmounted viewer cannot steal focus');
  assert.equal(h.writesAfterDispose,0,'an unmounted close callback cannot write state');
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`head inline close focus: ${modality} pending mapped annotation keeps its scan and history after close`,async()=>{
 const prefix=modality==='CT'?'cth':'mrb',first={...pons,id:`${prefix}.bst.pons`},second={...midbrain,id:`${prefix}.bst.midbrain`};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first,second],deferEntry:true});
 try{
  h.flush();await h.choosePackage('synthetic-pending-close');await h.settle();await h.settle();
  const focus:Array<{target:string;options:unknown}>=[];
  h.walk(h.find('label','Find a structure'),node=>node.type==='input')!.props.ref.current={focus:(options:unknown)=>focus.push({target:'search',options})};
  h.act(first.label);h.entryRequests.at(-1)!.resolve({entry:first,mask:new Uint8Array(8),focus:null});await h.settle();
  h.find('button','Compare beside 3D Atlas')!.props.ref.current={focus:(options:unknown)=>focus.push({target:'toolbar',options})};
  h.act('Compare beside 3D Atlas');h.act(second.label);h.flush();
  const pending=h.entryRequests.at(-1)!;
  assert.equal(pending.entry,second);assert.equal(pending.signal.aborted,false);
  assert.equal(h.tree.props.comparison?.type.name,'HeadAtlasInlineComparison');
  assert.equal(h.tree.props.comparison?.props.selectionReady,false);
  const history=[...h.browser.stack],slice=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')!;
  const cursor=slice().props.cursor;
  focus.length=0;h.act('Close 3D comparison');
  assert.deepEqual(focus,[{target:'search',options:{preventScroll:true}}]);
  assert.equal(h.find('button','Compare beside 3D Atlas')?.props.disabled,true);
  assert.equal(h.tree.props.comparison,undefined);assert.deepEqual(h.browser.stack,history);assert.deepEqual(slice().props.cursor,cursor);
  assert.equal(pending.signal.aborted,false,'closing the model does not cancel the current scan annotation');
  pending.resolve({entry:second,mask:new Uint8Array(8),focus:null});await h.settle();
  assert.equal(slice().props.selected?.entry,second);assert.equal(h.tree.props.comparison,undefined);
  assert.deepEqual(h.browser.stack,history);assert.deepEqual(slice().props.cursor,cursor);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`head inline close focus: ${modality} failed mapped annotation returns to search without changing scan history`,async()=>{
 const prefix=modality==='CT'?'cth':'mrb',first={...pons,id:`${prefix}.bst.pons`},second={...midbrain,id:`${prefix}.bst.midbrain`};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first,second],deferEntry:true});
 try{
  h.flush();await h.choosePackage('synthetic-failed-close');await h.settle();await h.settle();
  const focus:Array<{target:string;options:unknown}>=[];
  h.walk(h.find('label','Find a structure'),node=>node.type==='input')!.props.ref.current={focus:(options:unknown)=>focus.push({target:'search',options})};
  h.act(first.label);h.entryRequests.at(-1)!.resolve({entry:first,mask:new Uint8Array(8),focus:null});await h.settle();
  h.find('button','Compare beside 3D Atlas')!.props.ref.current={focus:(options:unknown)=>focus.push({target:'toolbar',options})};
  h.act('Compare beside 3D Atlas');h.act(second.label);h.flush();
  h.entryRequests.at(-1)!.reject(Error('Synthetic mapped annotation failure'));await h.settle();
  assert(h.find('button','Retry opening structure'));
  assert.equal(h.tree.props.comparison?.type.name,'HeadAtlasInlineComparison');
  assert.equal(h.tree.props.comparison?.props.selectionReady,false);
  const history=[...h.browser.stack],slice=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')!;
  const cursor=slice().props.cursor;
  focus.length=0;h.act('Close 3D comparison');
  assert.deepEqual(focus,[{target:'search',options:{preventScroll:true}}]);
  assert.equal(h.find('button','Compare beside 3D Atlas')?.props.disabled,true);
  assert.equal(h.tree.props.comparison,undefined);assert.equal(slice().props.selected,null);
  assert(h.find('button','Retry opening structure'),'closing comparison leaves exact scan retry available');
  assert.deepEqual(h.browser.stack,history);assert.deepEqual(slice().props.cursor,cursor);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`head inline close focus: ${modality} cleared selection returns to search without changing scan history`,async()=>{
 const first={...pons,id:`${modality==='CT'?'cth':'mrb'}.bst.pons`};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first]});
 try{
  h.flush();await h.choosePackage('synthetic-cleared-close');await h.settle();await h.settle();
  const focus:Array<{target:string;options:unknown}>=[];
  h.walk(h.find('label','Find a structure'),node=>node.type==='input')!.props.ref.current={focus:(options:unknown)=>focus.push({target:'search',options})};
  h.act(first.label);await h.settle();await h.settle();
  h.find('button','Compare beside 3D Atlas')!.props.ref.current={focus:(options:unknown)=>focus.push({target:'toolbar',options})};
  h.act('Compare beside 3D Atlas');h.act('Clear selection');await h.settle();
  assert(h.find('p','No model is substituted'));
  const history=[...h.browser.stack],slice=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')!;
  const cursor=slice().props.cursor;
  focus.length=0;h.act('Close comparison');
  assert.deepEqual(focus,[{target:'search',options:{preventScroll:true}}]);
  assert.equal(h.find('button','Compare beside 3D Atlas')?.props.disabled,true);
  assert.equal(h.tree.props.comparison,undefined);assert.equal(slice().props.selected,null);
  assert.deepEqual(h.browser.stack,history);assert.deepEqual(slice().props.cursor,cursor);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)for(const side of ['left','right','vermis'] as const)test(`${modality} ${side} cerebellar comparison preserves image focus without claiming a 3D target`,async()=>{
 const prefix=modality==='CT'?'cth':'mrb',label=side==='vermis'?'Cerebellar vermis':`${side==='left'?'Left':'Right'} cerebellar hemisphere`;
 const target={...entry(`${prefix}.cer.${side==='vermis'?'cerebellar_vermis':'cerebellar_hemisphere.'+side}`,label+' — regional mask'),family:'cer',laterality:side==='vermis'?'midline_or_unpaired':side,representation:side==='vermis'&&modality==='MRI'?'partial-mask':'mask'};
 const conceptId=side==='vermis'?'cerebellum-vermis':`cerebellum-${side}-hemisphere`,route=`/atlas/${modality.toLowerCase()}-head`;
 const h=harness(route,{modality,entries:[target]});
 try{
  h.flush();await h.choosePackage('synthetic-cerebellar-links');await h.settle();await h.settle();
  const search=h.walk(h.tree,n=>n.type==='input'&&n.props.type==='search');assert(search);
  search.props.onChange({target:{value:conceptId}});h.flush();
  assert(h.find('button',label),'canonical image-only concept is discoverable in the native index');
  const linked=h.walk(h.find('label','3D Atlas-linked only'),n=>n.type==='input');assert(linked);
  assert.equal(linked.props.disabled,true,'image-only discovery must not increase the 3D-linked count');
  h.act(label);await h.settle();await h.settle();
  assert.equal(h.browser.location.search,`?concept=${conceptId}&headRevision=${HEAD_LINK_REVISION}`);
  const selected=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')?.props.selected;
  assert.equal(selected()?.entry,target);
  const other=modality==='CT'?'MRI':'CT';
  assert.equal((h.tree.props.actions as Node).props.children[0].props.href,`/atlas/${other.toLowerCase()}-head?concept=${conceptId}&headRevision=${HEAD_LINK_REVISION}`);
  assert(h.find('p','No exact 3D part is mapped'));
  assert(!h.walk(h.tree.props.info,n=>n.type==='a'&&String(n.props.href).startsWith('/atlas/head-neck-3d?')));
  h.browser.history.back();h.flush();await h.settle();assert.equal(selected(),null);
  h.browser.history.forward();h.flush();await h.settle();await h.settle();assert.equal(selected()?.entry,target);
  h.setPractice(true);h.flush();assert.equal(h.tree.props.headNavigation.conceptId,null);
 }finally{h.dispose();}
 const reload=harness(`${route}?concept=${conceptId}`,{modality,entries:[target]});
 try{reload.flush();await reload.choosePackage('synthetic-cerebellar-reload');await reload.settle();await reload.settle();await reload.settle();assert.equal(reload.walk(reload.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')?.props.selected?.entry,target);}finally{reload.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} playback is offered only for one expanded exploration plane, never active quiz feedback`,async()=>{
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality});
 try{
  h.flush();await h.choosePackage('synthetic-playback-scope');await h.settle();await h.settle();
  const slice=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!;
  assert.equal(slice().props.allowPlayback,true);assert.equal(slice().props.expanded,true);
  slice().props.onExpand();h.flush();assert.equal(slice().props.expanded,false);assert.equal(slice().props.allowPlayback,false);
  slice().props.onExpand();h.flush();assert.equal(slice().props.allowPlayback,true);
  h.setPractice(true);h.flush();assert.equal(slice().props.allowPlayback,false);
  Object.assign(h.practice,{outcome:'correct'});h.flush();assert.equal(slice().props.allowPlayback,false,'graded feedback remains an active quiz');
  h.setPractice(false);h.flush();assert.equal(slice().props.allowPlayback,true);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} sequence choice survives Back, Forward and reload without selecting anatomy`,async()=>{
 const path=`/atlas/${modality.toLowerCase()}-head`,choice={sequenceId:'ventricles',conceptId:null};
 const href=navigation.headImageHref(modality,null,choice,HEAD_LINK_REVISION)!;
 const h=harness(path,{modality});
 try{
  h.flush();await h.choosePackage('synthetic-choice');await h.settle();await h.settle();
  h.act('Guided learning');
  const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning')!;
  guided().props.onPositionChange(choice);h.flush();await h.settle();
  assert.equal(h.browser.location.pathname+h.browser.location.search,href);
  assert.deepEqual(guided().props.position,choice);
  const stackLength=h.browser.stack.length;
  guided().props.onPositionChange(choice);h.flush();assert.equal(h.browser.stack.length,stackLength,'same choice must not duplicate history');
  h.browser.history.back();h.flush();await h.settle();assert.deepEqual(guided().props.position,{sequenceId:'brainstem',conceptId:null});
  h.browser.history.forward();h.flush();await h.settle();assert.deepEqual(guided().props.position,choice);
  assert.equal(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!.props.selected,null);
  const other=modality==='CT'?'MRI':'CT';
  assert.equal((h.tree.props.actions as Node).props.children[0].props.href,navigation.headImageHref(other,null,choice,HEAD_LINK_REVISION));
 }finally{h.dispose();}
 const reload=harness(href,{modality});
 try{
  reload.flush();
  const guided=()=>reload.walk(reload.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning')!;
  assert.deepEqual(guided().props.position,choice,'URL restores choice before a folder is opened');
  await reload.choosePackage('synthetic-reload');await reload.settle();await reload.settle();
  assert.deepEqual(guided().props.position,choice);
  assert.equal(reload.walk(reload.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!.props.selected,null);
 }finally{reload.dispose();}
});

test('manual scan keeps same-tab CT/MRI but opens reference Atlas separately without prefetch',async()=>{
 const h=harness('/atlas/ct-head');try{
  h.flush();await h.choosePackage('synthetic-handoff');await h.settle();await h.settle();
  h.act('Pons — regional mask');await h.settle();
  const concept=links.headAtlasConcept(pons as any,'CT')!;
  const next=h.walk(h.tree,n=>n.props.href===navigation.headImageHref('MRI',concept.conceptId,null,HEAD_LINK_REVISION))!;
  assert(next);assert.equal(next.props.prefetch,false);assert.equal(next.props.target,undefined);
  const atlas=h.walk(h.tree,n=>n.props.href===concept.atlasHref)!;
  assert.equal(atlas.props.target,'_blank');assert.equal(atlas.props.rel,'noopener noreferrer');assert.equal(atlas.props.prefetch,undefined);assert.equal(atlas.type,'a');assert.equal(atlas.props.onClick,undefined,'native document navigation has no client-router interception');
  h.setPractice(true);h.flush();assert.equal(h.walk(h.tree,n=>n.props.href===navigation.headImageHref('MRI',concept.conceptId,null,HEAD_LINK_REVISION)),undefined);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)for(const source of ['manual','configured-local'] as const)test(`${modality} ${source} reference comparison uses source-appropriate navigation without transferring files`,async()=>{
 const target={...pons,id:modality==='CT'?pons.id:'mrb.bst.pons'};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,localSource:source==='configured-local',entries:[target]});
 try{
  h.flush();await h.settle();
  if(source==='configured-local'){h.configuredRequests[0].resolve({source});await h.settle();}
  else await h.choosePackage('synthetic-manual');
  await h.settle();await h.settle();h.act('Pons — regional mask');await h.settle();await h.settle();
  const expected=source==='manual'?'_blank':undefined;
  const model=h.walk(h.tree,n=>n.type==='a'&&String(n.props.href).startsWith('/atlas/head-neck-3d?'))!;assert(model);
  assert.equal(model.props.target,expected);assert.equal(model.props.prefetch,undefined);assert.equal(model.props.onClick,undefined,'native anchor cannot start client routing');assert.equal(model.props.onMouseEnter,undefined,'native anchor cannot prefetch on hover');assert.equal(model.props.onFocus,undefined,'native anchor cannot prefetch on focus');
  assert.equal(model.props.rel,expected?'noopener noreferrer':undefined);
  assert.equal(model.props['aria-label'],`Open Pons in the 3D Atlas${expected?' (new tab)':''}`);
  const generic=h.walk(h.tree,n=>n.type==='a'&&n.props.href==='/atlas/head-neck-3d')!;
  assert.equal(generic.props.target,expected);assert.equal(generic.props.prefetch,false);
  const concept=links.headAtlasConcept(target as any,modality)!;
  assert.equal(model.props.href,concept.atlasHref,'only canonical anatomy metadata, never files or scan bytes');
  const other=modality==='CT'?'MRI':'CT';
  const comparison=h.walk(h.tree,n=>n.props.href===navigation.headImageHref(other,concept.conceptId,null,HEAD_LINK_REVISION))!;
  assert.equal(comparison.props.target,undefined,'CT/MRI sharing remains its separate opt-in behavior');
  const selected=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')?.props.selected;
  assert.equal(selected()?.entry,target);
  h.setPractice(true);h.flush();assert.equal(h.walk(h.tree,n=>n.type==='a'&&n.props.href===concept.atlasHref),undefined);
  h.setPractice(false);h.flush();h.act('Close atlas');
  assert.equal(h.walk(h.tree,n=>n.type==='a'&&n.props.href==='/atlas/head-neck-3d')?.props.target,undefined,'retired manual package cannot leave a new-tab policy behind');
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)for(const mode of ['locate','label','recall'] as const)test(`${modality} filtered ${mode} sets have an explicit bounded size and exact eligible membership`,async()=>{
  const entries=Array.from({length:12},(_,i)=>({...pons,id:`local.bounded.${i}`,label:`Filtered mask ${i}`,mask:{sha256:`mask-${i}`}}));
  const alias={...entries[0],id:'local.alias',source:{geometry_alias_of:entries[0].id}};
  const duplicate={...entries[0],id:'local.duplicate'};
  const point={...entries[0],id:'local.point',mask:undefined};
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[...entries,alias,duplicate,point]});
  const control=(label:string)=>h.walk(h.find('label',label),node=>node.type==='select');
  try{
    h.flush();assert.equal(control('Filtered set size'),undefined);
    await h.choosePackage('synthetic-bounded');await h.settle();await h.settle();
    h.walk(h.tree,n=>n.type==='input'&&n.props.type==='search')!.props.onChange({target:{value:'Filtered'}});h.flush();
    assert.equal(control('Filtered set size')?.props.value,'5');
    const history=[...h.browser.stack],original=[...entries];
    control('Filtered question style')!.props.onChange({target:{value:mode}});h.flush();
    for(const value of ['0','-1','6','5.0','Infinity','bad']){control('Filtered set size')!.props.onChange({target:{value}});h.flush();assert.equal(control('Filtered set size')?.props.value,'5');}
    for(const [size,count] of [['5',5],['1',1],['10',10],['all',12]] as const){
      control('Filtered set size')!.props.onChange({target:{value:size}});h.flush();
      assert.equal(h.practice.active,false);assert.deepEqual(h.browser.stack,history,'size selection does not navigate');
      const label=`${mode==='locate'?'Find':mode==='recall'?'Name':'Label'} filtered masks (${count===12?'12':`${count} of 12`})`;
      const button=h.find('button',label);assert(button);button.props.onClick();h.flush();
      assert.equal(h.practice.targets.length,count);assert.equal(new Set(h.practice.targets).size,count);
      assert(h.practice.targets.every((item:unknown)=>entries.includes(item as typeof entries[number])),'only exact distinct eligible masks');
      assert.equal(h.practice.mode,mode);assert.equal(control('Filtered set size'),undefined,'no setup controls during questions');
      const before=[...h.practice.targets];button.props.onClick();h.flush();assert.deepEqual(h.practice.targets,before,'stale start cannot replace active set');
      h.practice.finish();h.flush();
    }
    assert.deepEqual(entries,original,'sampling never reorders the index');
    h.walk(h.tree,n=>n.type==='input'&&n.props.type==='search')!.props.onChange({target:{value:'No match'}});h.flush();
    assert.equal(control('Filtered set size')?.props.disabled,true);
    assert.equal(h.find('button',`${mode==='locate'?'Find':mode==='recall'?'Name':'Label'} filtered masks (0)`)?.props.disabled,true);
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} compact detail filters intersect, preserve selection and bound filtered practice`,async()=>{
  const entries=[leftThalamus,rightThalamus].map(item=>({...item,id:item.id.replace('cth.',modality==='CT'?'cth.':'mrb.'),mask:{sha256:item.id}}));
  const point={...entries[0],id:'local.point',label:'Left point',representation:'point',mask:undefined};
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[...entries,point]});
  const control=(label:string)=>h.walk(h.find('label',label),node=>node.type==='select')!;
  const change=(label:string,value:string)=>{control(label).props.onChange({target:{value}});h.flush();};
  try{
    h.flush();assert.equal(control('Anatomical side').props.disabled,true);
    await h.choosePackage('synthetic-details');await h.settle();await h.settle();
    const details=h.walk(h.tree,node=>node.type==='details'&&h.walk(node,n=>n.type==='summary'&&n.props.children?.[0]==='More filters')!==undefined);
    assert(details);assert.equal(details.props.open,undefined,'extra controls are collapsed by default');
    const history=[...h.browser.stack],ends=h.endCount;
    change('Anatomical side','side:left');assert(h.find('button','Left thalamus'));assert(h.find('button','Left point'));assert.equal(h.find('button','Right thalamus'),undefined);
    change('Annotation type','type:mask');assert.equal(h.find('button','Left point'),undefined);
    change('Anatomical side','side:invalid');change('Annotation type','type:invalid');
    assert.equal(control('Anatomical side').props.value,'side:left');assert.equal(control('Annotation type').props.value,'type:mask');
    assert.deepEqual(h.browser.stack,history);assert.equal(h.endCount,ends);assert.equal(h.practice.active,false);
    change('Annotation type','type:point');assert.equal(h.find('button','Find filtered masks (0)')?.props.disabled,true);
    change('Annotation type','type:mask');h.act('Find filtered masks (1)');assert.deepEqual(h.practice.targets,[entries[0]]);
    assert.equal(h.find('label','Anatomical side'),undefined);assert.equal(h.find('label','Annotation type'),undefined);
    h.practice.finish();h.flush();h.act('Reset filters');assert.equal(control('Anatomical side').props.value,'all');assert.equal(control('Annotation type').props.value,'all');
    h.act('Left thalamus');await h.settle();change('Anatomical side','side:left');change('Annotation type','type:point');
    assert(h.find('button','Show Right thalamus'),'filtering does not clear selected anatomy');
    h.act('Show Right thalamus');await h.settle();assert.equal(control('Anatomical side').props.value,'all');assert.equal(control('Annotation type').props.value,'all');
    assert.equal(h.find('button','Right thalamus')?.props['aria-pressed'],true);
    change('Anatomical side','side:right');h.act('Close atlas');assert.equal(control('Anatomical side').props.value,'all');
    await h.choosePackage('synthetic-details-reopened');await h.settle();await h.settle();assert(h.find('button','Left thalamus'));assert(h.find('button','Right thalamus'));
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} Reset window restores opening contrast without changing selection, cursor, history or practice`,async()=>{
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality});
  const originalData=study.data.slice();
  try{
    h.flush();assert(!h.find('button','Reset window')||h.find('button','Reset window')?.props.disabled);
    await h.choosePackage('synthetic-window');await h.settle();await h.settle();
    const native=()=>{const node=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice');assert(node);return node;};
    const opening=modality==='CT'?[40,80]:[50,100];assert.deepEqual(native().props.windowing,opening);
    h.act('Pons — regional mask');await h.settle();native().props.onCursor([1,0,1]);h.flush();
    const selected=native().props.selected,cursor=native().props.cursor,history=[...h.browser.stack],ends=h.endCount;
    const edit=(label:string,value:number)=>{const input=h.walk(h.tree,n=>n.type==='input'&&n.props['aria-label']===label);assert(input);input.props.onChange({target:{valueAsNumber:value}});h.flush();};
    edit(modality==='CT'?'CT native window level':'MRI display level (not HU)',-20);
    edit(modality==='CT'?'CT native window width':'MRI display width (not HU)',12);
    assert.deepEqual(native().props.windowing,[-20,12]);h.act('Reset window');
    assert.deepEqual(native().props.windowing,opening);assert.equal(native().props.selected,selected);assert.equal(native().props.cursor,cursor);
    assert.deepEqual(h.browser.stack,history);assert.equal(h.endCount,ends);
    h.setPractice(true);h.flush();edit(modality==='CT'?'CT native window width':'MRI display width (not HU)',1);h.act('Reset window');
    assert.deepEqual(native().props.windowing,opening);assert.equal(h.practice.active,true);assert.equal(h.endCount,ends);
    assert.deepEqual(study.data,originalData);assert.deepEqual(study.range,[0,100]);
    h.act('Close atlas');assert(!h.find('button','Reset window')||h.find('button','Reset window')?.props.disabled);
  }finally{h.dispose();}
});
type Deferred<T>={signal:AbortSignal;resolve:(value:T)=>void;reject:(reason:Error)=>void};

for(const modality of ['CT','MRI'] as const)test(`${modality} multiword search filters the displayed index without selecting or leaking active answers`,async()=>{
  const entries=[leftThalamus,rightThalamus].map(item=>({...item,id:item.id.replace('cth.',modality==='CT'?'cth.':'mrb.')}));
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries});
  try{
    h.flush();await h.choosePackage('synthetic-search');await h.settle();await h.settle();
    const search=()=>h.walk(h.tree,node=>node.type==='input'&&node.props.type==='search');
    const before=[...h.browser.stack],ends=h.endCount;
    assert.equal(search()?.props.placeholder,'Name, side or anatomical ID');
    search()!.props.onChange({target:{value:'thalamus   LEFT'}});h.flush();
    assert(h.find('button','Left thalamus'));assert.equal(h.find('button','Right thalamus'),undefined);
    assert.equal(h.find('h2','Choose a structure')?.props.children,'Choose a structure');
    assert.deepEqual(h.browser.stack,before);assert.equal(h.endCount,ends);
    search()!.props.onChange({target:{value:'right left'}});h.flush();
    assert.equal(h.find('button','Left thalamus'),undefined);assert.equal(h.find('button','Right thalamus'),undefined);
    search()!.props.onChange({target:{value:' \t '}});h.flush();
    assert(h.find('button','Left thalamus'));assert(h.find('button','Right thalamus'));
    h.setPractice(true);h.flush();assert.equal(search(),undefined);
    assert.equal(h.find('button','Left thalamus'),undefined);assert.equal(h.find('button','Right thalamus'),undefined);
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)for(const mode of ['locate','label','recall'] as const)test(`${modality} filtered ${mode} practice uses only exact eligible index results and hides answers after explicit start`,async()=>{
  const mapped=(item:typeof pons,hash:string)=>({...item,id:item.id.replace('cth.',modality==='CT'?'cth.':'mrb.'),mask:{sha256:hash}});
  const first=mapped(pons,'pons'),second=mapped(midbrain,'midbrain');
  const alias={...mapped(medulla,'alias'),source:{geometry_alias_of:first.id}};
  const point={...mapped(medulla,'point'),id:'local.point',mask:undefined};
  const other={...mapped(unmapped,'other'),label:'Unmapped source'};
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first,second,alias,point,other]});
  try{
    h.flush();assert.equal(h.find('button','Find filtered masks'),undefined);
    await h.choosePackage('synthetic-filter-practice');await h.settle();await h.settle();
    assert.equal(h.find('button','Find filtered masks'),undefined,'ordinary unfiltered index has no extra action');
    const linked=h.walk(h.find('label','3D Atlas-linked only'),n=>n.type==='input');
    assert(linked);linked.props.onChange({target:{checked:true}});h.flush();
    const action=h.find('button','Find filtered masks (2)');assert(action);assert.equal(action.props.disabled,false);
    const style=h.walk(h.find('label','Filtered question style'),n=>n.type==='select');assert(style);
    assert.equal(style.props.value,'locate');
    style.props.onChange({target:{value:mode}});h.flush();
    // Reject invalid DOM values without changing the chosen style or starting a set.
    style.props.onChange({target:{value:'invalid'}});h.flush();
    assert.equal(h.walk(h.find('label','Filtered question style'),n=>n.type==='select')?.props.value,mode);
    const actionLabel=`${mode==='locate'?'Find':mode==='recall'?'Name':'Label'} filtered masks (2)`;
    const chosenAction=h.find('button',actionLabel);assert(chosenAction);
    const start=h.practice.startTargets.bind(h.practice);let starts=0;
    h.practice.startTargets=(targets:unknown[],mode='locate')=>{starts++;return start(targets,mode);};
    const history=[...h.browser.stack];assert.equal(h.practice.active,false,'filtering never starts practice');
    h.practice.acceptTargets=false;chosenAction.props.onClick();h.flush();
    assert.deepEqual(h.browser.stack,history);assert.equal(h.practice.active,false);
    h.practice.acceptTargets=true;h.act(actionLabel);
    assert.deepEqual(h.practice.targets,[first,second]);assert.equal(h.practice.mode,mode);
    assert.equal(h.practice.active,true);assert.equal(h.find('button','Find filtered masks'),undefined);
    assert.equal(h.find('button','Label filtered masks'),undefined);
    assert.equal(h.find('button','Name filtered masks'),undefined);
    assert.equal(h.find('label','Filtered question style'),undefined);
    assert.equal(h.find('button','Pons — regional mask'),undefined);
    assert.equal(h.browser.location.search,'');
    const active=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice');assert(active);
    assert.equal(active.props.onReturnToLearning,undefined,'ordinary index practice does not inherit a tour origin');
    assert.equal(starts,2,'one rejected and one accepted start');
    chosenAction.props.onClick();h.flush();assert.equal(starts,2,'stale action cannot restart active practice');
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} search and system practice exclude missing masks, aliases and hidden duplicate-mask representatives`,async()=>{
  const first={...pons,id:pons.id.replace('cth.',modality==='CT'?'cth.':'mrb.'),mask:{sha256:'shared'}};
  const duplicate={...first,id:'local.duplicate',label:'Duplicate only'};
  const distinct={...leftThalamus,id:leftThalamus.id.replace('cth.',modality==='CT'?'cth.':'mrb.'),mask:{sha256:'distinct'}};
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first,duplicate,distinct]});
  try{
    h.flush();await h.choosePackage('synthetic-filter-exclusions');await h.settle();await h.settle();
    const search=h.walk(h.tree,n=>n.type==='input'&&n.props.type==='search');assert(search);
    search.props.onChange({target:{value:'Duplicate only'}});h.flush();
    const none=h.find('button','Find filtered masks (0)');assert(none);assert.equal(none.props.disabled,true);
    const history=[...h.browser.stack];none.props.onClick();h.flush();assert.equal(h.practice.active,false);assert.deepEqual(h.browser.stack,history);
    search.props.onChange({target:{value:'thalamus left'}});h.flush();
    const system=h.walk(h.find('label','System'),n=>n.type==='select');assert(system);
    system.props.onChange({target:{value:'bst'}});h.flush();assert.equal(h.find('button','Find filtered masks (0)')?.props.disabled,true);
    system.props.onChange({target:{value:'dgm'}});h.flush();h.act('Find filtered masks (1)');
    assert.deepEqual(h.practice.targets,[distinct]);assert.equal(h.practice.mode,'locate');
  }finally{h.dispose();}
});

test('MRI-only tour header explicitly leaves the tour; linked CT/MRI steps retain exact destinations',()=>{
 for(const sequence of headLearningSequencesForModality('MRI'))for(const conceptId of sequence.concepts){
  const position={sequenceId:sequence.id,conceptId},destinations=headLearningLinks(position);assert(destinations);
  const h=harness(destinations.mriHref,{modality:'MRI'});
  try{
   h.flush();
   const label=destinations.ctHref?'Continue this step on CT':'Browse CT head · leave tour';
   const action=h.find('a',label);assert(action,label);
   assert.equal(action.props.href,destinations.ctHref??'/atlas/ct-head');
   assert.deepEqual(h.tree.props.headNavigation.position,position);
   assert.equal(h.find('a','Switch to CT head'),undefined);
   if(!destinations.ctHref)assert.match(action.props.title,/No verified comparison/);
   assert.equal(h.browser.stack.length,1,'rendering the action must not navigate');
  }finally{h.dispose();}
 }
});

test('MRI-only anatomy focus is explicitly abandoned while ordinary and practice switching stays generic',()=>{
 const h=harness('/atlas/mri-head?concept=limbic-left-amygdala',{modality:'MRI'});
 try{
  h.flush();assert.equal(h.find('a','Browse CT head · leave anatomy focus')?.props.href,'/atlas/ct-head');
  h.setPractice(true);h.flush();
  assert.equal(h.find('a','Browse CT head'),undefined);
  assert.equal(h.find('a','Switch to CT head')?.props.href,'/atlas/ct-head');
  assert.deepEqual(h.tree.props.headNavigation,{conceptId:null,position:null,revision:HEAD_LINK_REVISION});
 }finally{h.dispose();}
 for(const url of ['/atlas/mri-head','/atlas/mri-head?concept=unknown','/atlas/mri-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=stale']){
  const ordinary=harness(url,{modality:'MRI'});try{
   ordinary.flush();assert.equal(ordinary.find('a','Switch to CT head')?.props.href,'/atlas/ct-head');
   assert.equal(ordinary.find('a','Continue this step'),undefined);
  }finally{ordinary.dispose();}
 }
});

test('folder sharing is opt-in, transfers only the checked package to a fresh viewer, and closes explicitly',async()=>{
 const session=createHeadFolderSession(HEAD_LINK_REVISION);
 const ct=harness('/atlas/ct-head',{folderSession:session});
 let retained:unknown;
 try{
  ct.flush();await ct.choosePackage('synthetic-shared-folder');await ct.settle();await ct.settle();
  assert.equal(session.read(HEAD_LINK_REVISION),null,'import alone is not consent');
  const control=()=>ct.walk(ct.tree,n=>typeof n.type==='function'&&n.type.name==='HeadFolderSharing');
  assert.equal(control()?.props.enabled,false);
  control()!.props.onChange(true);ct.flush();
  retained=session.read(HEAD_LINK_REVISION);assert.deepEqual(retained,{synthetic:'synthetic-shared-folder'});
  assert.equal(ct.find('a','Switch to MRI head')?.props.prefetch,false);
  ct.setPractice(true);ct.flush();assert.equal(session.read(HEAD_LINK_REVISION),retained,'no quiz state enters shared package');
 }finally{ct.dispose();}
 const mri=harness('/atlas/mri-head?concept=brainstem-pons',{folderSession:session,modality:'MRI',deferStudy:true});
 try{
  mri.flush();assert.equal(mri.studyRequests.length,1,'fresh MRI study load still occurs');
  assert.equal(mri.packageRequests.length,0,'no folder re-import');
  assert.equal(mri.practice.active,false);assert.deepEqual(mri.practice.results,[]);
  assert.equal(mri.walk(mri.tree,n=>typeof n.type==='function'&&n.type.name==='HeadFolderSharing')?.props.enabled,true);
  mri.act('Close atlas');assert.equal(session.read(HEAD_LINK_REVISION),null);assert(mri.studyRequests[0].signal.aborted);
  assert.equal(mri.walk(mri.tree,n=>typeof n.type==='function'&&n.type.name==='HeadFolderSharing'),undefined);
 }finally{mri.dispose();}
 const fresh=harness('/atlas/ct-head',{folderSession:session,deferStudy:true});try{fresh.flush();assert.equal(fresh.studyRequests.length,0);}finally{fresh.dispose();}
});

test('revoking sharing keeps this viewer open, and replacement/failed/late imports cannot revive the old folder',async()=>{
 const session=createHeadFolderSession(HEAD_LINK_REVISION),h=harness('/atlas/ct-head',{folderSession:session,deferPackage:true});
 try{
  h.flush();let pending=h.choosePackage('first');h.flush();h.packageRequests[0].resolve({synthetic:'first'});await pending;await h.settle();await h.settle();
  const toggle=(enabled:boolean)=>{const control=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadFolderSharing');assert(control);control.props.onChange(enabled);h.flush();};
  toggle(true);assert(session.read(HEAD_LINK_REVISION));toggle(false);assert.equal(session.read(HEAD_LINK_REVISION),null);assert(h.find('button','Close atlas'));
  toggle(true);pending=h.choosePackage('bad');h.flush();assert.equal(session.read(HEAD_LINK_REVISION),null);
  h.packageRequests[1].reject(new Error('Rejected synthetic folder'));await pending;await h.settle();assert.equal(session.read(HEAD_LINK_REVISION),null);
  pending=h.choosePackage('late');h.flush();h.act('Close atlas');h.packageRequests[2].resolve({synthetic:'late'});await pending;await h.settle();assert.equal(session.read(HEAD_LINK_REVISION),null);
  pending=h.choosePackage('unmounted');h.flush();h.dispose();h.packageRequests[3].resolve({synthetic:'unmounted'});await pending;assert.equal(session.read(HEAD_LINK_REVISION),null);assert.equal(h.writesAfterDispose,0);
 }finally{h.dispose();}
});

test('CT/MRI switches restore only each exact study contrast while sharing is enabled',async()=>{
 const session=createHeadFolderSession(HEAD_LINK_REVISION);
 const pkg={manifest:{studies:{CT:{...study.definition},MRI:{...study.definition}}}};
 const native=(h:ReturnType<typeof harness>)=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!;
 const share=(h:ReturnType<typeof harness>,enabled:boolean)=>{h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadFolderSharing')!.props.onChange(enabled);h.flush();};
 const ct=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 try{
  ct.flush();await ct.choosePackage('synthetic');await ct.settle();await ct.settle();ct.act('Bone window');
  assert.equal(session.read(HEAD_LINK_REVISION),null);share(ct,true);
  assert.deepEqual(native(ct).props.windowing,[500,2500]);
  native(ct).props.onCursor([1,1,1]);ct.setPractice(true);ct.flush();
 }finally{ct.dispose();}
 const mri=harness('/atlas/mri-head',{modality:'MRI',folderSession:session,checkedPackage:pkg});
 try{
  mri.flush();await mri.settle();assert.deepEqual(native(mri).props.windowing,[50,100],'MRI uses its default, never the CT bone window');
  assert.equal(mri.practice.active,false);assert.deepEqual(mri.practice.results,[]);
  native(mri).props.onWindowing([70,140]);mri.flush();
 }finally{mri.dispose();}
 const back=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 try{
  back.flush();await back.settle();assert.deepEqual(native(back).props.windowing,[500,2500]);
  assert.equal(back.practice.active,false);assert.equal(native(back).props.selected,null);
  back.act('Reset window');assert.deepEqual(native(back).props.windowing,[40,80]);
 }finally{back.dispose();}
 const again=harness('/atlas/mri-head',{modality:'MRI',folderSession:session,checkedPackage:pkg});
 try{
  again.flush();await again.settle();assert.deepEqual(native(again).props.windowing,[70,140]);
  share(again,false);assert.equal(session.read(HEAD_LINK_REVISION),null);
  assert.deepEqual(native(again).props.windowing,[70,140],'revocation does not disrupt the current view');
  share(again,true);
 }finally{again.dispose();}
 const reset=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 try{reset.flush();await reset.settle();assert.deepEqual(native(reset).props.windowing,[40,80]);reset.act('Close atlas');assert.equal(session.read(HEAD_LINK_REVISION),null);}finally{reset.dispose();}
});

function browser(initial='/atlas/ct-head',loopback=false){
  const stack=[initial],listeners=new Set<()=>void>();let index=0;
  const location={origin:loopback?'http://127.0.0.1:3000':'https://example.test',hostname:loopback?'127.0.0.1':'example.test',pathname:'',search:'',hash:''};
  const set=(href:string)=>{const url=new URL(href,location.origin);location.pathname=url.pathname;location.search=url.search;location.hash=url.hash;};set(initial);
  const history={state:null,pushState(_state:unknown,_unused:string,href:string){stack.splice(++index);stack.push(href);set(href);},back(){if(index>0){set(stack[--index]);listeners.forEach(listener=>listener());}},forward(){if(index<stack.length-1){set(stack[++index]);listeners.forEach(listener=>listener());}}};
  const window={location,history,addEventListener(name:string,listener:()=>void){if(name==='popstate')listeners.add(listener);},removeEventListener(name:string,listener:()=>void){if(name==='popstate')listeners.delete(listener);}};
  return {window,history,stack,location};
}

function harness(initial='/atlas/ct-head',options:{folderSession?:ReturnType<typeof createHeadFolderSession>;checkedPackage?:{manifest:{studies:{CT:typeof study.definition;MRI:typeof study.definition}}};deferStudy?:boolean;deferEntry?:boolean;deferPackage?:boolean;localSource?:boolean;withGroups?:boolean;surface?:boolean;modality?:'CT'|'MRI';entries?:typeof study.definition.entries}={}){
  const fixtureStudy=options.checkedPackage?{...study,definition:options.checkedPackage.manifest.studies[options.modality??'CT']}:options.entries?{...study,definition:{entries:options.entries}}:study;
  const browserState=browser(initial,options.localSource),priorWindow=(globalThis as any).window;
  (globalThis as any).window=browserState.window;
  const slots:unknown[]=[],effects=new Map<number,Effect>(),layouts=new Map<number,Effect>(),studyRequests:Deferred<typeof study>[]=[],entryRequests:Array<Deferred<{entry:unknown;mask:Uint8Array;focus:number[]|null}>&{entry:unknown}>=[];
  const packageRequests:Array<{resolve:(value:{synthetic:string})=>void;reject:(reason:Error)=>void}>=[];
  const configuredRequests:Array<Deferred<unknown>>=[];
  const visibleLayerCalls:unknown[][]=[],clearedPickPoints:number[][]=[];
  let cursor=0,dirty=true,pending:Array<()=>void>=[],pendingLayout:Array<()=>void>=[],tree:Node,practiceActive=false,endCount=0,disposed=false,writesAfterDispose=0;
  const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const hooks={
    useState(initial:unknown){const slot=cursor++;if(!(slot in slots))slots[slot]=typeof initial==='function'?(initial as ()=>unknown)():initial;return [slots[slot],(value:unknown)=>{if(disposed){writesAfterDispose++;return;}const next=typeof value==='function'?(value as (old:unknown)=>unknown)(slots[slot]):value;if(!Object.is(next,slots[slot])){slots[slot]=next;dirty=true;}}];},
    useRef(initial:unknown){const slot=cursor++;if(!(slot in slots))slots[slot]={current:initial};return slots[slot];},
    useMemo(create:()=>unknown,deps:unknown[]){const slot=cursor++,old=slots[slot] as {deps:unknown[];value:unknown}|undefined;if(!equal(old?.deps,deps))slots[slot]={deps,value:create()};return (slots[slot] as {value:unknown}).value;},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const slot=cursor++,old=effects.get(slot);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(slot,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const slot=cursor++,old=layouts.get(slot);if(!equal(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();const cleanup=create();layouts.set(slot,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
const practice={get active(){return practiceActive;},finished:false,results:[] as Array<{entry:unknown;outcome:string}>,mode:'locate',outcome:null as HeadPractice['outcome'],target:null,pick:null,clearPendingPick(point:number[]){clearedPickPoints.push(point);},end(){endCount++;practiceActive=false;this.finished=false;this.results=[];dirty=true;},finish(){practiceActive=false;this.finished=true;dirty=true;},targets:[] as unknown[],acceptTargets:true,startTargets(targets:unknown[],mode='locate'){if(!this.acceptTargets)return false;this.targets=targets;practiceActive=true;this.finished=false;this.results=[];this.mode=mode;dirty=true;return true;},startTarget(target?:unknown){return this.startTargets([target]);}};
  const imports={HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION,openLocalHeadPackage:async(files:Array<{name:string}>)=>options.deferPackage?new Promise<{synthetic:string}>((resolve,reject)=>packageRequests.push({resolve,reject})):(options.checkedPackage??{synthetic:files[0]?.name}),
    // Existing navigation fixtures do not manufacture verified mask provenance.
    // Real reuse/budget behavior is exercised with native bytes separately.
    canReuseHeadMask:()=>false,
    loadHeadStudy:(_pkg:unknown,_modality:unknown,signal:AbortSignal)=>options.deferStudy?new Promise<typeof study>((resolve,reject)=>studyRequests.push({signal,resolve,reject})):Promise.resolve(fixtureStudy),
    loadHeadEntry:(_pkg:unknown,_study:unknown,item:unknown,signal:AbortSignal)=>options.deferEntry?new Promise<{entry:unknown;mask:Uint8Array;focus:number[]|null}>((resolve,reject)=>entryRequests.push({entry:item,signal,resolve,reject})):Promise.resolve({entry:item,mask:new Uint8Array(8),focus:null,...(options.surface?{positions:new Float32Array([0,0,0])}:{})})};
  const overlays={groupHeadOverlays:()=>options.withGroups?[{id:'bst',label:'Brainstem',entries:[pons]}]:[],headOverlayBytes:()=>0,HEAD_OVERLAY_BYTE_LIMIT:268435456,layoutHeadLabels:()=>({labels:[],omitted:0}),visibleHeadOverlays:(layers:unknown[])=>{visibleLayerCalls.push(layers);return[];}};
  const load=(name:string):unknown=>name==='react'?hooks:name==='next/link'?{default:'a'}:name==='./HeadFolderSessionContext'?{useHeadFolderSession:()=>options.folderSession??null}:name==='@react-three/fiber'?{Canvas:()=>null}:name==='@react-three/drei'?{Bounds:()=>null,OrbitControls:()=>null}:name==='three'?{}:
    name==='../lib/head-overlay-loading'?{loadHeadOverlayMasks:async(pkg:unknown,study:unknown,entries:unknown[],_selected:unknown,signal:AbortSignal)=>{const result=[];for(const item of entries)result.push(await imports.loadHeadEntry(pkg,study,item,signal));return result;}}:
    name==='../lib/head-atlas-import'?imports:name==='../lib/head-local-source'?{openConfiguredHeadPackage:(signal:AbortSignal)=>new Promise((resolve,reject)=>configuredRequests.push({signal,resolve,reject}))}:name==='../lib/head-atlas-links'?links:name==='../lib/head-atlas-navigation'?navigation:name==='../lib/head-atlas-index'?require('../lib/head-atlas-index.ts'):name==='../lib/head-atlas-pairs'?require('../lib/head-atlas-pairs.ts'):name==='../lib/head-atlas-overlays'?overlays:
    name==='../lib/head-atlas-display'?{headLabel:(item:any)=>item.label,annotationInk:()=>''}:name==='../lib/head-atlas-practice'?{...require('../lib/head-atlas-practice.ts'),canvasVoxel:()=>null}:name==='../lib/head-mask-picking'?{headMaskHits}:name==='../lib/head-slice-viewport'?viewport:name==='../lib/head-atlas-focus'?require('../lib/head-atlas-focus.ts'):name==='../lib/head-index-keyboard'?{headIndexKey}:name==='../lib/head-atlas-slice-controls'?require('../lib/head-atlas-slice-controls.ts'):name==='../lib/slice-wheel.mjs'?{bindSliceWheel:()=>()=>{}}:
    name==='./ImagingAtlasShell'?{ImagingAtlasShell:function ImagingAtlasShell(){}}:name==='./HeadAtlasPractice'?{HeadAtlasPractice:function HeadAtlasPractice(){},useHeadAtlasPractice:()=>practice}:
    name==='./HeadAtlasGuidedLearning'?{HeadAtlasGuidedLearning:function HeadAtlasGuidedLearning(){}}:name==='./HeadAtlasTeaching'?{HeadAtlasTeaching:function HeadAtlasTeaching(){}}:
    name==='./LearningResourceStatus.ts'?require('../components/LearningResourceStatus.ts'):
    name==='./HeadAtlasSurfaceLoader'?{HeadAtlasSurfaceLoader:function HeadAtlasSurfaceLoader(){}}:
    name==='./HeadAtlasInlineComparison'?{HeadAtlasInlineComparison:function HeadAtlasInlineComparison(){}}:
    name==='./HeadAtlasInlineComparisonLoader'?{HeadAtlasInlineComparisonLoader:function HeadAtlasInlineComparison(){}}:
    name==='./HeadComparisonTour'?{HeadComparisonTour:function HeadComparisonTour(){}}:
    name==='./HeadTourPlayback'?{HeadTourPlayback:function HeadTourPlayback(){}}:
    name==='../lib/head-atlas-learning'?require('../lib/head-atlas-learning.ts'):
    name==='./HeadSlicePlayback'?{default:function HeadSlicePlayback(){}}:
    name==='./HeadFolderSharing'?{HeadFolderSharing:function HeadFolderSharing(){}}:
    name==='./HeadAtlasRelatedLearning'?{HeadAtlasRelatedLearning:function HeadAtlasRelatedLearning(){}}:
    name==='./HeadAtlasStudySet'?{HeadAtlasStudySet:function HeadAtlasStudySet(){}}:
    name==='./HeadAtlasSavedStudyPlan'?{HeadAtlasSavedStudyPlan:function HeadAtlasSavedStudyPlan(){}}:
    name==='../lib/head-study-plan'?require('../lib/head-study-plan.ts'):
    name==='../lib/head-study-set'?require('../lib/head-study-set.ts'):
    name==='../lib/head-review-study-set'?require('../lib/head-review-study-set.ts'):
    name==='../lib/head-tour-study-set'?require('../lib/head-tour-study-set.ts'):
    name==='../lib/head-study-comparison'?require('../lib/head-study-comparison.ts'):
    name==='../lib/head-related-learning'?require('../lib/head-related-learning.ts'):
    name==='../lib/head-window-drag'?require('../lib/head-window-drag.ts'):
    name==='../lib/head-load-progress'?require('../lib/head-load-progress.ts'):
    name==='../lib/head-image-only-links'?imageLinks:
    name.endsWith('.css')?{}:require(name);
  const mod={exports:{} as {HeadAtlasViewer:(props:{modality:'CT'|'MRI'})=>Node}};
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  function flush(){let passes=0;do{assert(++passes<30,'viewer hook effects settle');dirty=false;cursor=0;pending=[];pendingLayout=[];tree=mod.exports.HeadAtlasViewer({modality:options.modality??'CT'});for(const effect of pendingLayout)effect();for(const effect of pending)effect();}while(dirty);return tree!;}
  async function settle(){await Promise.resolve();await Promise.resolve();return flush();}
  function walk(value:unknown,visit:(node:Node)=>boolean):Node|undefined{
    if(Array.isArray(value)){for(const child of value){const found=walk(child,visit);if(found)return found;}return;}
    if(!value||typeof value!=='object'||!('props' in value))return;
    const node=value as Node;if(visit(node))return node;
    for(const key of ['children','sidebar','info','actions','toolbar','comparison']){const found=walk(node.props[key],visit);if(found)return found;}
  }
  const content=(value:unknown):string=>Array.isArray(value)?value.map(content).join(''):value&&typeof value==='object'&&'props'in value?content((value as Node).props.children):typeof value==='string'||typeof value==='number'?String(value):'';
  const find=(kind:string,text:string)=>walk(tree,node=>node.type===kind&&content(node.props.children).includes(text));
  function act(text:string){const button=find('button',text);assert(button,`rendered button ${text}`);assert.notEqual(button.props.disabled,true,`enabled ${text}`);button.props.onClick();return flush();}
  function choosePackage(name:string){const input=walk(tree,node=>node.type==='input'&&node.props.type==='file');assert(input);return input.props.onChange({target:{files:[{name}],value:name}}) as Promise<void>;}
  function dispose(){if(disposed)return;disposed=true;for(const effect of layouts.values())effect.cleanup?.();for(const effect of effects.values())effect.cleanup?.();(globalThis as any).window=priorWindow;}
  return {flush,settle,find,act,walk,dispose,choosePackage,packageRequests,configuredRequests,studyRequests,entryRequests,visibleLayerCalls,clearedPickPoints,browser:browserState,practice,get tree(){return tree!;},get endCount(){return endCount;},get writesAfterDispose(){return writesAfterDispose;},setPractice(active:boolean){practiceActive=active;dirty=true;}};
}

test('loopback preview opens the configured local atlas once and loads its scan',async()=>{
  const h=harness('/atlas/ct-head',{localSource:true});
  try{
    h.flush();await h.settle();assert.equal(h.configuredRequests.length,1);
    const pkg={source:'configured-local',synthetic:'ssd'};
    h.configuredRequests[0].resolve(pkg);await h.settle();await h.settle();
    assert.equal(h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')?.props.study,study);
    assert(h.find('button','Close atlas'));assert.equal(h.find('button','Reopen local atlas'),undefined);
    assert(String(h.tree.props.notice).includes('Read-only SSD source'));
    h.act('Close atlas');
    assert(h.find('button','Reopen local atlas'));
    assert(h.walk(h.tree,node=>node.type==='p'&&String(node.props.children).includes('Use Reopen local atlas above')));
    assert.equal(h.configuredRequests.length,1,'closing must not silently restart local loading');
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} failed configured scan reacquires the manifest before retrying native data`,async()=>{
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{localSource:true,modality,deferStudy:true});
  try{
    h.flush();await h.settle();h.configuredRequests[0].resolve({source:'configured-local',synthetic:'expired'});
    await h.settle();await h.settle();assert.equal(h.studyRequests.length,1);
    h.studyRequests[0].reject(new DOMException('Import cancelled','AbortError'));await h.settle();
    const retry=h.find('button','Retry opening scan');assert(retry);
    retry.props.onClick();retry.props.onClick();h.flush();await h.settle();
    assert.equal(h.configuredRequests.length,2,'one fresh package request, including duplicate clicks');
    assert.equal(h.configuredRequests[0].signal.aborted,true);
    assert.equal(h.studyRequests[0].signal.aborted,true);
    assert.equal(h.studyRequests.length,1,'do not reuse lazy assets from the cancelled package');
    assert.equal(h.find('button','Retry opening scan'),undefined);
    h.configuredRequests[1].resolve({source:'configured-local',synthetic:'fresh'});
    await h.settle();await h.settle();assert.equal(h.studyRequests.length,2);
    h.studyRequests[1].resolve(study);await h.settle();await h.settle();
    assert.equal(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')?.props.study,study);
    assert.equal(h.find('button','Retry local atlas'),undefined);
    retry.props.onClick();h.flush();await h.settle();assert.equal(h.configuredRequests.length,2);
  }finally{h.dispose();}
});

for(const action of ['fail','close','replace','unmount'] as const)test(`configured scan retry handles ${action} without reviving the retired package`,async()=>{
  const h=harness('/atlas/ct-head',{localSource:true,deferStudy:true});
  try{
    h.flush();await h.settle();h.configuredRequests[0].resolve({source:'configured-local',synthetic:'old'});
    await h.settle();await h.settle();h.studyRequests[0].reject(Error('Interrupted native load'));await h.settle();
    h.act('Retry opening scan');await h.settle();const request=h.configuredRequests[1];assert(request);
    if(action==='fail'){
      request.reject(Error('Source unavailable'));await h.settle();await h.settle();
      assert(h.find('button','Retry local atlas'));
      assert.equal(h.find('button','Retry opening scan'),undefined);
      assert.equal(h.find('button','Close atlas'),undefined,'cancelled package is not retained');
      assert.equal(h.studyRequests.length,1);
    }else{
      if(action==='close')h.act('Close atlas');
      else if(action==='replace'){await h.choosePackage('manual-wins');await h.settle();}
      else h.dispose();
      assert.equal(request.signal.aborted,true);
      request.resolve({source:'configured-local',synthetic:'late'});await h.settle();
      assert.equal(h.studyRequests.length,action==='replace'?2:1);
      if(action==='unmount')assert.equal(h.writesAfterDispose,0);
      else assert.equal(h.tree.props.notice.includes('Read-only SSD source'),false);
    }
  }finally{h.dispose();}
});

test('local source 404 keeps the manual folder choice available',async()=>{
  const h=harness('/atlas/ct-head',{localSource:true});
  try{
    h.flush();await h.settle();assert.equal(h.configuredRequests.length,1);
    h.configuredRequests[0].resolve(null);await h.settle();await h.settle();
    assert.equal(h.find('button','Retry local atlas'),undefined);
    assert.equal(h.find('button','Reopen local atlas'),undefined);
    assert(h.walk(h.tree,node=>node.type==='p'&&String(node.props.children).includes('Hosted scan delivery is not yet enabled')));
    await h.choosePackage('manual-after-404');await h.settle();await h.settle();
    assert(h.find('button','Close atlas'));
  }finally{h.dispose();}
});

test('closing an automatic open aborts it and rejects a late package',async()=>{
  const h=harness('/atlas/ct-head',{localSource:true});
  try{
    h.flush();await h.settle();assert.equal(h.configuredRequests.length,1);
    h.act('Close atlas');assert.equal(h.configuredRequests[0].signal.aborted,true);
    h.configuredRequests[0].resolve({source:'configured-local',synthetic:'late'});await h.settle();await h.settle();
    assert.equal(h.configuredRequests.length,1);assert.equal(h.find('button','Close atlas'),undefined);
    assert.equal(h.find('button','Reopen local atlas'),undefined);
  }finally{h.dispose();}
});

test('manual folder replacement retires a late automatic package',async()=>{
  const h=harness('/atlas/ct-head',{localSource:true});
  try{
    h.flush();await h.settle();assert.equal(h.configuredRequests.length,1);
    await h.choosePackage('manual-wins');await h.settle();await h.settle();
    assert.equal(h.configuredRequests[0].signal.aborted,true);
    h.configuredRequests[0].resolve({source:'configured-local',synthetic:'late'});await h.settle();
    assert.equal(h.configuredRequests.length,1);assert.equal(h.tree.props.notice.includes('Read-only SSD source'),false);
    assert(h.find('button','Close atlas'));
  }finally{h.dispose();}
});

test('failed local open offers one explicit retry',async()=>{
  const h=harness('/atlas/ct-head',{localSource:true});
  try{
    h.flush();await h.settle();h.configuredRequests[0].reject(Error('Local preview unavailable'));await h.settle();await h.settle();
    assert(h.find('button','Retry local atlas'));assert.equal(h.configuredRequests.length,1);
    assert(h.walk(h.tree,node=>node.type==='p'&&String(node.props.children).includes('Use Retry local atlas above')));
    h.act('Retry local atlas');await h.settle();assert.equal(h.configuredRequests.length,2);
    h.configuredRequests[1].resolve({source:'configured-local',synthetic:'retry'});await h.settle();await h.settle();
    assert(h.find('button','Close atlas'));assert.equal(h.find('button','Retry local atlas'),undefined);
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} rendered index keyboard moves focus without selecting anatomy`,async()=>{
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality});
  try{
    h.flush();await h.choosePackage('synthetic-index-keys');await h.settle();await h.settle();
    const sidebar=h.tree.props.sidebar as Node;
    assert.equal(sidebar.props.onKeyDown,headIndexKey,'real viewer binds the shared focus-only handler');
    const search=h.walk(sidebar,node=>node.type==='input'&&node.props.type==='search')!;
    const list=h.walk(sidebar,node=>node.type==='div'&&node.props['data-head-index-list']!==undefined)!;
    const buttons=(list.props.children as unknown[]).flat(Infinity).filter((node):node is Node=>!!node&&typeof node==='object'&&'type'in node&&node.type==='button');
    assert(search&&list&&buttons.length>=3);
    assert.equal(search.props['data-head-index-search'],true);
    assert.equal(search.props['aria-describedby'],'head-index-keyboard-help');
    assert(buttons.every(button=>button.props['data-head-index-entry']===true));
    const focus:string[]=[],searchElement={disabled:false,focus:()=>focus.push('search')};
    const buttonElements=buttons.map((_,index)=>({disabled:false,focus:()=>focus.push(`result-${index}`),getBoundingClientRect:()=>({top:10+index*20,bottom:25+index*20})}));
    const listElement={clientTop:0,clientHeight:100,scrollTop:0,getBoundingClientRect:()=>({top:0}),querySelectorAll:(selector:string)=>{assert.equal(selector,'[data-head-index-entry]');return buttonElements;}};
    const root={querySelector:(selector:string)=>selector==='[data-head-index-search]'?searchElement:selector==='[data-head-index-list]'?listElement:null};
    const key=(name:string,target:unknown)=>{let prevented=0,stopped=0;sidebar.props.onKeyDown({key:name,target,currentTarget:root,preventDefault(){prevented++;},stopPropagation(){stopped++;}});return {prevented,stopped};};
    const history=[...h.browser.stack],native=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')!;
    const cursor=native.props.cursor,selected=native.props.selected,endCount=h.endCount;
    assert.deepEqual(key('ArrowDown',searchElement),{prevented:1,stopped:1});
    assert.deepEqual(focus,['result-0']);
    assert.deepEqual(key('Escape',buttonElements[0]),{prevented:1,stopped:1});
    assert.deepEqual(focus,['result-0','search']);
    assert.deepEqual(key('Enter',buttonElements[0]),{prevented:0,stopped:0},'native activation remains available');
    assert.deepEqual(h.browser.stack,history);assert.equal(h.endCount,endCount);
    assert.equal(h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')?.props.cursor,cursor);
    assert.equal(h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')?.props.selected,selected);
    buttons[0].props.onClick();h.flush();await h.settle();
    assert.equal(h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')?.props.selected?.entry,study.definition.entries[0],
      'existing button activation still selects the exact entry');
    assert.equal(h.find('button',study.definition.entries[0].label)?.props['aria-pressed'],true);
    if(modality==='CT')assert.notDeepEqual(h.browser.stack,history,'mapped CT entry writes its concept URL');
    h.setPractice(true);h.flush();
    const paused=h.tree.props.sidebar as Node;
    assert.equal(paused.props.onKeyDown,undefined);
    assert.equal(h.walk(paused,node=>node.props['data-head-index-search']!==undefined),undefined);
    assert.equal(h.walk(paused,node=>node.props['data-head-index-list']!==undefined),undefined);
    assert.equal(h.walk(paused,node=>node.props['data-head-index-entry']!==undefined),undefined);
  }finally{h.dispose();}
});

test('actual viewer gives mask selection only to exploration, never locate, label or recall practice',async()=>{
  const h=harness('/atlas/ct-head');
  try{
    h.flush();await h.choosePackage('synthetic-mask-selection');await h.settle();await h.settle();
    const native=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')!;
    assert.equal(typeof native().props.onSelectMask,'function');
    Object.assign(h.practice,{target:{entry:pons,focus:[0,0,0]},mode:'locate',outcome:null,acceptPick:()=>{}});
    h.setPractice(true);h.flush();assert.equal(native().props.onSelectMask,undefined);assert.equal(typeof native().props.onAnswer,'function');
    h.practice.mode='label';h.flush();assert.equal(native().props.onSelectMask,undefined);assert.equal(native().props.onAnswer,undefined);
    h.practice.mode='recall';h.flush();assert.equal(native().props.onSelectMask,undefined);assert.equal(native().props.onAnswer,undefined);
    assert.equal(native().props.selected,h.practice.target,'recall displays the target mask');
    assert.equal(native().props.showName,false,'recall never reveals the name before feedback');
    h.practice.outcome='incorrect';h.flush();assert.equal(native().props.showName,true,'feedback reveals the source name');
    Object.assign(h.practice,{mode:'locate',outcome:'correct'});h.flush();assert.equal(native().props.onSelectMask,undefined);assert.equal(native().props.onAnswer,undefined);
    h.setPractice(false);h.flush();assert.equal(typeof native().props.onSelectMask,'function');
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} native plane changes invalidate pending picks using the new voxel`,async()=>{
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality});try{
    h.flush();await h.choosePackage('synthetic-plane');await h.settle();await h.settle();
    Object.assign(h.practice,{target:{entry:pons,focus:[0,0,0]},pick:[1,1,1]});
    h.setPractice(true);h.flush();
    const native=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice');
    const originalHistory=[...h.browser.stack],originalTarget=h.practice.target;
    for(const [label,axis]of [['Coronal',1],['Sagittal',0],['Axial',2]] as const){
      native()!.props.onCursor([1,1,1]);h.flush();h.clearedPickPoints.length=0;
      const expected=[1,1,1];expected[axis]=0;h.act(label);
      assert.deepEqual(native()!.props.cursor,expected);
      assert.deepEqual(h.clearedPickPoints,[expected],'plane navigation must use the existing pending-pick guard');
      assert.equal(h.practice.active,true);assert.equal(h.practice.target,originalTarget);
      assert.deepEqual(h.browser.stack,originalHistory);
    }
    for(const label of ['3D scan view','Multiplanar']){
      const action=h.find('button',label);assert(action);assert.equal(action.props.disabled,true);
      const point=native()!.props.cursor;h.clearedPickPoints.length=0;
      action.props.onClick();h.flush();assert.deepEqual(native()!.props.cursor,point);
      assert.deepEqual(h.clearedPickPoints,[]);assert.equal(native()!.props.plane,'axial');
    }
    h.setPractice(false);h.flush();await h.settle();
    native()!.props.onCursor([1,0,1]);h.flush();h.clearedPickPoints.length=0;
    h.act('Coronal');assert.deepEqual(native()!.props.cursor,[1,0,1]);assert.deepEqual(h.clearedPickPoints,[],'free exploration must not recenter to a quiz target');
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} native image cursor forwards navigation to pending-pick invalidation`,async()=>{
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality});try{
    h.flush();await h.choosePackage('synthetic-cursor');await h.settle();await h.settle();
    h.setPractice(true);h.flush();
    const native=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice');
    const first=native();assert(first);
    const onCursor=first.props.onCursor,point=[1,0,1];onCursor(point);h.flush();
    assert.deepEqual(h.clearedPickPoints,[point]);
    assert.deepEqual(native()?.props.cursor,point);
    assert.equal(native()?.props.onCursor,onCursor,'cursor forwarding remains stable across renders');
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} selected-structure practice starts one exact question and clears completed/tour context only after success`,async()=>{
 const selected={...pons,id:modality==='CT'?pons.id:'mrb.bst.pons',mask:{sha256:'a'.repeat(64)}};
 const path=`/atlas/${modality.toLowerCase()}-head`,url=path+'?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision='+HEAD_LINK_REVISION;
 const h=harness(url,{modality,entries:[selected]});try{
  h.flush();await h.choosePackage('synthetic-selected');await h.settle();await h.settle();h.act('Structure');
  assert.equal(h.find('button','Practise this structure')?.props.disabled,false);
  h.practice.finished=true;h.practice.results=[{entry:selected,outcome:'incorrect'}];h.flush();
  const history=[...h.browser.stack],results=h.practice.results;
  h.practice.acceptTargets=false;h.act('Practise this structure');
  assert.equal(h.practice.active,false);assert.equal(h.practice.results,results);assert.deepEqual(h.browser.stack,history);
  assert(h.find('h2','Pons — regional mask'));
  h.practice.acceptTargets=true;h.act('Practise this structure');
  assert.equal(h.practice.active,true);assert.equal(h.practice.finished,false);assert.deepEqual(h.practice.results,[]);
  assert.deepEqual(h.practice.targets,[selected]);assert.equal(h.practice.targets[0],selected);
  assert.equal(h.practice.mode,'locate');assert.equal(h.browser.location.search,'');
  const panel=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice');assert(panel);
  assert.equal(panel.props.onReturnToLearning,undefined);assert.equal(h.find('button','Practise this structure'),undefined);
  const slice=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice');assert(slice);
  assert.equal(slice.props.selected,null,'locate question conceals saved mask before feedback');
  assert.deepEqual(h.tree.props.headNavigation,{conceptId:null,position:null,revision:HEAD_LINK_REVISION},'no comparison target or tour intent during question');
 }finally{h.dispose();}
});

test('selected-structure practice excludes points, shared aliases and duplicate masks without resetting results',async()=>{
 const canonical={...pons,mask:{sha256:'a'.repeat(64)}},point={...unmapped},alias={...midbrain,mask:canonical.mask,source:{geometry_alias_of:canonical.id}},duplicate={...medulla,mask:canonical.mask};
 const h=harness('/atlas/ct-head',{entries:[canonical,point,alias,duplicate]});try{
  h.flush();await h.choosePackage('synthetic-exclusions');await h.settle();await h.settle();
  for(const excluded of [point,alias,duplicate]){
   h.act(excluded.label);await h.settle();
   const button=h.find('button','Practise this structure');assert(button);assert.equal(button.props.disabled,true);
   h.practice.finished=true;h.practice.results=[{entry:canonical,outcome:'correct'}];h.flush();
   const results=h.practice.results,history=[...h.browser.stack];button.props.onClick();h.flush();
   assert.equal(h.practice.active,false);assert.equal(h.practice.results,results);assert.deepEqual(h.browser.stack,history);
  }
 }finally{h.dispose();}
});

test('a selection still opening does not offer a stale structure quick check',async()=>{
 const canonical={...pons,mask:{sha256:'a'.repeat(64)}},h=harness('/atlas/ct-head',{entries:[canonical],deferEntry:true});try{
  h.flush();await h.choosePackage('synthetic-pending');await h.settle();await h.settle();h.act(canonical.label);
  assert.equal(h.find('button','Practise this structure'),undefined);
  h.entryRequests.at(-1)!.resolve({entry:canonical,mask:new Uint8Array(8),focus:null});await h.settle();
  assert.equal(h.find('button','Practise this structure')?.props.disabled,false);
  h.act('Close atlas');assert.equal(h.find('button','Practise this structure'),undefined);
 }finally{h.dispose();}
});

test('guided sequence practice conceals navigation and returns to the exact prior tour step',async()=>{
 const pons=practiceMask(entry('cth.bst.pons','Pons — regional mask')),midbrain=practiceMask(entry('cth.bst.midbrain','Midbrain — regional mask'));
 const url='/atlas/ct-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision='+HEAD_LINK_REVISION;
 const h=harness(url,{entries:[pons,midbrain]});try{
  h.flush();await h.choosePackage('synthetic-sequence');await h.settle();await h.settle();
  const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning');
  const initial=guided();assert(initial);const position=initial.props.position;
  h.practice.acceptTargets=false;initial.props.onPracticeSequence([midbrain,pons],'locate');h.flush();
  assert.equal(h.practice.active,false);assert.equal(h.browser.location.search,new URL(url,'https://example.test').search);
  h.practice.acceptTargets=true;guided()!.props.onPracticeSequence([midbrain,pons],'locate');h.flush();
  assert.deepEqual(h.practice.targets,[midbrain,pons]);assert.equal(h.practice.active,true);
  assert.equal(h.browser.location.search,'');assert.equal(guided(),undefined);
  h.practice.finish();h.flush();
  const panel=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice');assert(panel);
  assert.equal(typeof panel.props.onReturnToLearning,'function');panel.props.onReturnToLearning();h.flush();
  assert.equal(h.practice.active,false);assert.deepEqual(guided()?.props.position,position);
  assert.equal(h.browser.location.search,new URL(url,'https://example.test').search);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)for(const retirement of ['step','sequence','panel','study','generation','unmount'] as const)
test(`${modality} captured parent guided practice rejects ${retirement} retirement`,async()=>{
 const prefix=modality==='CT'?'cth':'mrb',target=practiceMask(entry(`${prefix}.bst.pons`,'Pons — regional mask')),first=practiceMask(entry(`${prefix}.bst.midbrain`,'Midbrain — regional mask'));
 const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
 const h=harness(url,{modality,entries:[target,first]});
 const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning')!;
 try{
  h.flush();await h.choosePackage('synthetic-retired-guide');await h.settle();await h.settle();
  const old=guided().props;let starts=0;
  const start=h.practice.startTargets.bind(h.practice);h.practice.startTargets=(targets:unknown[],mode='locate')=>{starts++;return start(targets,mode);};
  if(retirement==='step')old.onPositionChange({sequenceId:'brainstem',conceptId:'brainstem-midbrain'});
  else if(retirement==='sequence')old.onPositionChange({sequenceId:'ventricles',conceptId:null});
  else if(retirement==='panel')h.act('Structure');
  else if(retirement==='study'){await h.choosePackage('synthetic-retired-guide-replacement');await h.settle();await h.settle();}
  else if(retirement==='generation'){
   // No render/effect cleanup yet: package generation retires callbacks inside
   // the replacement event, even when the test reuses exact entry objects.
   const replacing=h.choosePackage('synthetic-generation');old.onPractice(target);old.onPracticeSequence([first,target],'recall');await replacing;
  }else h.dispose();
  if(retirement!=='generation'&&retirement!=='unmount')h.flush();
  const history=[...h.browser.stack],results=h.practice.results;
  assert.doesNotThrow(()=>{old.onPractice(target);old.onPracticeSequence([first,target],'label');});
  assert.equal(starts,0,'retired parent callbacks never reach the practice hook');
  assert.equal(h.practice.active,false);assert.equal(h.practice.results,results);assert.deepEqual(h.browser.stack,history);
  assert.equal(h.writesAfterDispose,0);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)for(const startKind of ['single','tour'] as const)
test(`${modality} parent ${startKind} practice consumes a rejected launch before queued duplicates`,async()=>{
 const target=practiceMask({...pons,id:modality==='CT'?pons.id:'mrb.bst.pons'});
 const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
 const h=harness(url,{modality,entries:[target]});
 const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning')!;
 try{
  h.flush();await h.choosePackage('synthetic-duplicate-guide');await h.settle();await h.settle();
  const old=guided().props,invoke=()=>startKind==='single'?old.onPractice(target):old.onPracticeSequence([target],'recall');
  const original=h.practice.startTargets.bind(h.practice);let starts=0;h.practice.startTargets=(targets:unknown[],mode='locate')=>{starts++;return original(targets,mode);};
  h.practice.finished=true;const results=[{entry:target,outcome:'incorrect'}];h.practice.results=results;
  const history=[...h.browser.stack];h.practice.acceptTargets=false;invoke();h.practice.acceptTargets=true;invoke();
  assert.equal(starts,1);assert.equal(h.practice.active,false);assert.equal(h.practice.finished,true);assert.equal(h.practice.results,results);assert.deepEqual(h.browser.stack,history);
  h.flush();const fresh=guided().props;startKind==='single'?fresh.onPractice(target):fresh.onPracticeSequence([target],'recall');h.flush();
  assert.equal(starts,2);assert.equal(h.practice.active,true);assert.equal(h.browser.location.search,'');
  assert.equal(h.practice.mode,startKind==='single'?'locate':'recall');assert.deepEqual(h.practice.targets,[target]);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} parent guide rejects noncanonical practice requests without consuming a valid launch`,async()=>{
 const prefix=modality==='CT'?'cth':'mrb',target=practiceMask(entry(`${prefix}.bst.pons`,'Pons — regional mask')),first=practiceMask(entry(`${prefix}.bst.midbrain`,'Midbrain — regional mask'));
 const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
 const h=harness(url,{modality,entries:[target,first]});
 try{
  h.flush();await h.choosePackage('synthetic-canonical-guide');await h.settle();await h.settle();
  const guided=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning')!;
  const history=[...h.browser.stack];let starts=0;const start=h.practice.startTargets.bind(h.practice);h.practice.startTargets=(targets:unknown[],mode='locate')=>{starts++;return start(targets,mode);};
  guided.props.onPractice(first);guided.props.onPractice({...target});
  for(const [targets,mode] of [[[target],'locate'],[[target,first],'label'],[[first,target,target],'recall'],[[first,target],undefined],[[first,target],'invalid']] as const)guided.props.onPracticeSequence(targets,mode);
  assert.equal(starts,0);assert.deepEqual(h.browser.stack,history);assert.equal(h.practice.active,false);
  guided.props.onPracticeSequence([first,target],'label');h.flush();assert.equal(starts,1);assert.equal(h.practice.mode,'label');assert.deepEqual(h.practice.targets,[first,target]);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} guided practice origin survives browsing another tour before returning`,async()=>{
 const target=practiceMask(modality==='CT'?pons:{...pons,id:'mrb.bst.pons'});
 const position={sequenceId:'brainstem',conceptId:'brainstem-pons'};
 const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
 for(const start of ['single','sequence'] as const){
  const h=harness(url,{modality,entries:[target]});try{
   h.flush();await h.choosePackage('synthetic-origin');await h.settle();await h.settle();
   const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning')!;
   const panel=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice')!;
   if(start==='single')guided().props.onPractice(target);else guided().props.onPracticeSequence([target],'label');
   h.flush();h.practice.finish();h.flush();
   h.act('Guided learning');
   const other={sequenceId:'ventricles',conceptId:'ventricle-third'};
   guided().props.onPositionChange(other);h.flush();
   assert.deepEqual(guided().props.position,other,'browsing stays explicit until Return');
   assert.equal(h.practice.finished,true,'browsing another tour retains completed practice');
   const browsingUrl=h.browser.location.search;
   h.act('Results');
   assert.notEqual(h.browser.location.search,browsingUrl);
   assert.deepEqual(h.tree.props.headNavigation.position,position,'result comparison keeps the original tour');
   panel().props.onReturnToLearning();h.flush();
   assert.deepEqual(guided().props.position,position);
   assert.equal(h.browser.location.search,new URL(url,'https://example.test').search);
   assert.equal(h.practice.finished,true,'return keeps the completed set available in Results');
  }finally{h.dispose();}
 }
});

for(const modality of ['CT','MRI'] as const)test(`${modality} guided label practice forwards the selected mode and returns to its exact tour`,async()=>{
 const target=practiceMask(modality==='CT'?pons:{...pons,id:'mrb.bst.pons'});
 const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
 const h=harness(url,{modality,entries:[target]});try{
  h.flush();await h.choosePackage('synthetic-label-tour');await h.settle();await h.settle();
  const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning');
  const position=guided()!.props.position;
  guided()!.props.onPracticeSequence([target],'label');h.flush();
  assert.equal(h.practice.mode,'label');assert.deepEqual(h.practice.targets,[target]);
  Object.assign(h.practice,{target:{entry:target,mask:new Uint8Array(8),focus:[0,0,0]}});h.flush();
  const native=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!;
  assert.equal(native.props.selected,h.practice.target);assert.equal(native.props.showName,false);
  assert.equal(native.props.onAnswer,undefined);assert.equal(h.browser.location.search,'');assert.equal(guided(),undefined);
  h.practice.finish();h.flush();
  const panel=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice')!;
  panel.props.onReturnToLearning();h.flush();
  assert.deepEqual(guided()!.props.position,position);
  assert.equal(h.browser.location.search,new URL(url,'https://example.test').search);
 }finally{h.dispose();}
});

test('Show this guided step recentres the exact loaded CT/MRI entry without altering tour history or contrast',async()=>{
 for(const modality of ['CT','MRI'] as const){
  const target=practiceMask(modality==='CT'?pons:{...pons,id:'mrb.bst.pons'});
  const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
  const h=harness(url,{modality,entries:[target],deferEntry:true});try{
   h.flush();await h.choosePackage('synthetic-guided-focus');await h.settle();await h.settle();
   assert.equal(h.entryRequests.length,1);
   h.entryRequests[0].resolve({entry:target,mask:new Uint8Array(8),focus:[1,0,1]});await h.settle();
   const native=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!;
   const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning')!;
   native().props.onCursor([0,1,0]);h.flush();
   const history=[...h.browser.stack],position=guided().props.position,windowing=native().props.windowing,version=native().props.viewResetVersion;
   guided().props.onSelect({...target});h.flush();
   assert.deepEqual(native().props.cursor,[0,1,0]);assert.equal(native().props.viewResetVersion,version,'foreign same-ID object cannot reset the study');
   guided().props.onSelect(target);h.flush();
   assert.deepEqual(native().props.cursor,[1,0,1]);assert.equal(native().props.viewResetVersion,version+1);
   assert.equal(h.entryRequests.length,1,'same entry does not reread mask bytes');
   assert.deepEqual(h.browser.stack,history);assert.deepEqual(guided().props.position,position);assert.deepEqual(native().props.windowing,windowing);
   assert.equal(native().props.selected.entry,target);
  }finally{h.dispose();}
 }
});

test('rejected individual guided practice preserves position, results and navigation',async()=>{
 const pons=practiceMask(entry('cth.bst.pons','Pons — regional mask'));
 const url='/atlas/ct-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision='+HEAD_LINK_REVISION;
 const h=harness(url,{entries:[pons]});try{
  h.flush();await h.choosePackage('synthetic-rejected-guided-practice');await h.settle();await h.settle();
  const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning');
  const before=guided();assert(before);const history=[...h.browser.stack],position=before.props.position;
  h.practice.finished=true;h.practice.results=[{entry:pons,outcome:'correct'}];h.practice.acceptTargets=false;h.flush();
  const results=h.practice.results;
  guided()!.props.onPractice(pons);h.flush();
  assert.equal(h.practice.active,false);assert.equal(h.practice.finished,true);assert.equal(h.practice.results,results);
  assert.deepEqual(h.browser.stack,history);assert.deepEqual(guided()?.props.position,position);
  h.practice.acceptTargets=true;guided()!.props.onPractice(pons);h.flush();
  assert.equal(h.practice.active,true);assert.equal(h.browser.location.search,'');assert.equal(guided(),undefined);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)for(const originalOnly of [false,true])test(`${modality} completed ${originalOnly?'original':'current'} result opens same-scan guided learning without clearing results`,async()=>{
 const target=practiceMask(modality==='CT'?pons:{...pons,id:'mrb.bst.pons'});
 const other=modality==='CT'?midbrain:{...midbrain,id:'mrb.bst.midbrain'};
 const position={sequenceId:'brainstem',conceptId:'brainstem-pons'};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[target,other]});
 const panel=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice')!;
 try{
  h.flush();await h.choosePackage('synthetic-review-guide');await h.settle();await h.settle();h.act('Practice');
  panel().props.reviewContext.onReviewGuide(position,target);h.flush();assert.equal(h.browser.location.search,'','unfinished review rejected');
  h.practice.finished=true;h.practice.results=[{entry:originalOnly?other:target,outcome:'incorrect'}];
  Object.assign(h.practice,{originalResults:originalOnly?[{entry:target,outcome:'revealed'}]:null});h.flush();
  const results=h.practice.results,originals=(h.practice as any).originalResults,ends=h.endCount;
  const review=panel().props.reviewContext.onReviewGuide;
  for(const [pos,item] of [[position,{...target}],[position,other],[{sequenceId:'ventricles',conceptId:'brainstem-pons'},target],[{sequenceId:'brainstem',conceptId:'brainstem-midbrain'},target]] as const){
   review(pos,item);h.flush();assert.equal(h.browser.location.search,'','foreign entry or mismatched tour rejected');
  }
  review(position,target);h.flush();await h.settle();await h.settle();
  const guided=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning');assert(guided);
  assert.deepEqual(guided.props.position,position);
  assert.equal(h.browser.location.pathname+h.browser.location.search,navigation.headImageHref(modality,position.conceptId,position,HEAD_LINK_REVISION));
  assert.equal(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')?.props.selected.entry,target);
  assert.equal(h.practice.results,results);assert.equal((h.practice as any).originalResults,originals);assert.equal(h.practice.finished,true);assert.equal(h.endCount,ends);
  h.act('Results');assert.equal(h.browser.location.search,'');assert.equal(panel().props.practice.results,results);assert.equal(h.endCount,ends);
  const stale=panel().props.reviewContext.onReviewGuide;
  h.setPractice(true);h.flush();stale(position,target);h.flush();assert.equal(h.browser.location.search,'','active quiz rejects old review');
  h.setPractice(false);h.practice.results=[{entry:target,outcome:'correct'}];h.flush();
  stale(position,target);h.flush();assert.equal(h.browser.location.search,'','replaced result set rejects old review even for same entry');
  const beforeClose=panel().props.reviewContext.onReviewGuide;
  h.act('Close atlas');beforeClose(position,target);h.flush();assert.equal(h.browser.location.search,'','closed study rejects retired review');
 }finally{h.dispose();}
});

test('completed review callback opens only a current exact result and writes canonical comparison history',async()=>{
  const h=harness();try{
    h.flush();const input=h.walk(h.tree,node=>node.type==='input'&&node.props.type==='file');assert(input);
    await input.props.onChange({target:{files:[{name:'synthetic'}],value:'synthetic'}});await h.settle();await h.settle();
    h.act('Practice');let panel=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(panel);
    const startEnds=h.endCount;panel.props.reviewContext.onSelect(pons);h.flush();assert.equal(h.endCount,startEnds,'unfinished callbacks do nothing');
    h.practice.finished=true;h.practice.results=[{entry:pons,outcome:'incorrect'}];h.flush();
    panel=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(panel);
    assert.equal(panel.props.reviewContext.revision,HEAD_LINK_REVISION);
    const review=panel.props.reviewContext.onSelect;
    review({...pons});h.flush();assert.equal(h.endCount,startEnds,'matching ID/label is not result identity');
    h.setPractice(true);review(pons);h.flush();assert.equal(h.endCount,startEnds,'active practice cannot invoke completed review');
    h.setPractice(false);h.flush();panel=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(panel);
    panel.props.reviewContext.onSelect(pons);h.flush();await h.settle();
     assert.equal(h.endCount,startEnds);assert.equal(h.browser.location.search,`?concept=brainstem-pons&headRevision=${HEAD_LINK_REVISION}`);
    assert.equal(h.practice.finished,true);assert.deepEqual(h.practice.results,[{entry:pons,outcome:'incorrect'}]);
    assert.equal(h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice'),undefined);
    const heading=h.find('h2','Pons — regional mask');assert(heading);assert.equal(heading.props.tabIndex,-1);
     assert.equal((h.tree.props.actions as Node).props.children[0].props.href,`/atlas/mri-head?concept=brainstem-pons&headRevision=${HEAD_LINK_REVISION}`);
    h.act('Results');assert.equal(h.browser.location.search,'');
    panel=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(panel);
    assert.equal(panel.props.practice.finished,true);assert.deepEqual(panel.props.practice.results,[{entry:pons,outcome:'incorrect'}]);
    assert.equal(h.endCount,startEnds);
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} original-only result remains reviewable after follow-up without accepting foreign entries`,async()=>{
 const original=modality==='CT'?pons:{...pons,id:'mrb.bst.pons'};
 const followup=modality==='CT'?midbrain:{...midbrain,id:'mrb.bst.midbrain'};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[original,followup]});
 try{
  h.flush();await h.choosePackage('synthetic-original-review');await h.settle();await h.settle();h.act('Practice');
  h.practice.finished=true;h.practice.results=[{entry:followup,outcome:'correct'}];
  Object.assign(h.practice,{originalResults:[{entry:original,outcome:'correct'}]});h.flush();
  const panel=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice')!;
  const review=panel().props.reviewContext.onSelect;
  review({...original});h.flush();assert.equal(h.browser.location.search,'','same ID is not exact source identity');
  Object.assign(h.practice,{originalResults:[{entry:unmapped,outcome:'correct'}]});h.flush();
  panel().props.reviewContext.onSelect(unmapped);h.flush();assert.equal(h.browser.location.search,'');assert(panel(),'foreign original result stays rejected');
  Object.assign(h.practice,{originalResults:[{entry:original,outcome:'correct'}]});h.flush();
  h.setPractice(true);panel().props.reviewContext.onSelect(original);h.flush();assert.equal(h.browser.location.search,'','active questions conceal original results');
  h.setPractice(false);h.flush();panel().props.reviewContext.onSelect(original);h.flush();await h.settle();
   assert.equal(h.browser.location.search,`?concept=brainstem-pons&headRevision=${HEAD_LINK_REVISION}`);
  assert.equal(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')?.props.selected.entry,original);
  assert.deepEqual(h.practice.results,[{entry:followup,outcome:'correct'}]);assert.equal(h.practice.finished,true);
  h.act('Results');assert.equal(panel().props.practice.originalResults[0].entry,original);
  assert.equal(h.browser.location.search,'');
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} completed review preserves results and the originating tour`,async()=>{
 const origin=practiceMask(modality==='CT'?pons:{...pons,id:'mrb.bst.pons'});
 const reviewed=practiceMask(modality==='CT'?midbrain:{...midbrain,id:'mrb.bst.midbrain'});
 const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
 const h=harness(url,{modality,entries:[origin,reviewed]});try{
  h.flush();await h.choosePackage('synthetic-results-return');await h.settle();await h.settle();
  const guided=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning');assert(guided);
  guided.props.onPracticeSequence([reviewed,origin],'locate');h.flush();
  h.practice.finish();h.practice.results=[{entry:reviewed,outcome:'revealed'},{entry:origin,outcome:'unanswered'}];
  const originals=[{entry:origin,outcome:'incorrect'}];Object.assign(h.practice,{originalResults:originals});h.flush();
  const results=h.practice.results,ends=h.endCount;
  let panel=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice');assert(panel);
  panel.props.reviewContext.onSelect(reviewed);h.flush();await h.settle();
  assert.equal(h.practice.results,results);assert.equal(h.endCount,ends);
   assert.equal(h.browser.location.search,`?concept=brainstem-midbrain&headRevision=${HEAD_LINK_REVISION}`);
  assert.deepEqual(h.tree.props.headNavigation,{conceptId:'brainstem-midbrain',position:null,revision:HEAD_LINK_REVISION});
   assert.equal((h.tree.props.actions as Node).props.children[0].props.href,`/atlas/${modality==='CT'?'mri':'ct'}-head?concept=brainstem-midbrain&headRevision=${HEAD_LINK_REVISION}`);
  h.act('Results');assert.equal(h.browser.location.search,'');
  panel=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice');assert(panel);
  assert.equal(panel.props.practice.results,results);assert.equal(panel.props.practice.originalResults,originals);
  assert.equal(typeof panel.props.onReturnToLearning,'function');
  panel.props.onReturnToLearning();h.flush();assert.equal(h.endCount,ends);
  assert.equal(h.browser.location.search,new URL(url,'https://example.test').search);
  assert.deepEqual(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning')?.props.position,{sequenceId:'brainstem',conceptId:'brainstem-pons'});
  assert.equal(h.practice.finished,true);assert.equal(h.practice.results,results);assert.equal((h.practice as any).originalResults,originals);
  h.act('Results');panel=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice');assert(panel);
  assert.equal(panel.props.practice.results,results);assert.equal(panel.props.practice.originalResults,originals);
  assert.equal(panel.props.study.definition.entries[0],origin,'same loaded study remains available for result review and download');
  assert.equal(typeof panel.props.reviewContext.onSelect,'function');
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} deferred result review and tour return restore exact masks and focus without stale loads`,async()=>{
 const origin=practiceMask(modality==='CT'?pons:{...pons,id:'mrb.bst.pons'});
 const reviewed=practiceMask(modality==='CT'?midbrain:{...midbrain,id:'mrb.bst.midbrain'});
 const path=`/atlas/${modality.toLowerCase()}-head`;
 const url=path+'?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision='+HEAD_LINK_REVISION;
 const h=harness(url,{modality,entries:[origin,reviewed],deferEntry:true});try{
  const child=(name:string)=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name===name)!;
  h.flush();await h.choosePackage('synthetic-deferred-return');await h.settle();await h.settle();
  h.entryRequests.at(-1)!.resolve({entry:origin,mask:new Uint8Array(8),focus:[1,0,1]});await h.settle();
  child('HeadAtlasGuidedLearning').props.onPracticeSequence([reviewed,origin],'locate');h.flush();
  h.practice.finish();h.practice.results=[{entry:reviewed,outcome:'incorrect'},{entry:origin,outcome:'correct'}];h.flush();
  const results=h.practice.results,ends=h.endCount;
  child('HeadAtlasPractice').props.reviewContext.onSelect(reviewed);h.flush();
  const firstReview=h.entryRequests.at(-1)!;assert.equal(firstReview.entry,reviewed);
  assert.equal(child('NativeSlice').props.selected,null,'pending result must not display the previous mask');
  firstReview.resolve({entry:reviewed,mask:new Uint8Array(8),focus:[0,1,0]});await h.settle();
  assert.equal(child('NativeSlice').props.selected.entry,reviewed);
  assert.deepEqual(child('NativeSlice').props.cursor,[0,1,0],'async review centres the loaded result');
  assert.equal(h.practice.results,results);assert.equal(h.endCount,ends);
  h.act('Results');child('HeadAtlasPractice').props.onReturnToLearning();h.flush();
  const returning=h.entryRequests.at(-1)!;assert.equal(returning.entry,origin);
  assert.equal(child('NativeSlice').props.selected,null);
  returning.resolve({entry:origin,mask:new Uint8Array(8),focus:[1,0,1]});await h.settle();
  assert.equal(child('NativeSlice').props.selected.entry,origin);
  assert.deepEqual(child('NativeSlice').props.cursor,[1,0,1]);
  assert.equal(h.browser.location.pathname+h.browser.location.search,url);
  assert.deepEqual(child('HeadAtlasGuidedLearning').props.position,{sequenceId:'brainstem',conceptId:'brainstem-pons'});
  assert.equal(h.endCount,ends);assert.equal(h.practice.active,false);assert.equal(h.practice.finished,true);
  assert.equal(h.practice.results,results);

  // A pending result response must not override a subsequent Return action.
  child('HeadAtlasGuidedLearning').props.onPracticeSequence([reviewed,origin],'locate');h.flush();
  h.practice.finish();h.practice.results=[{entry:reviewed,outcome:'revealed'}];h.flush();
  child('HeadAtlasPractice').props.reviewContext.onSelect(reviewed);h.flush();
  const stale=h.entryRequests.at(-1)!;assert.equal(stale.entry,reviewed);
  h.act('Results');child('HeadAtlasPractice').props.onReturnToLearning();h.flush();
  const latest=h.entryRequests.at(-1)!;assert.equal(latest.entry,origin);assert(stale.signal.aborted);
  latest.resolve({entry:origin,mask:new Uint8Array(8),focus:[1,0,1]});await h.settle();
  stale.resolve({entry:reviewed,mask:new Uint8Array(8),focus:[0,1,0]});await h.settle();
  assert.equal(child('NativeSlice').props.selected.entry,origin);
  assert.deepEqual(child('NativeSlice').props.cursor,[1,0,1]);
  assert.equal(h.browser.location.pathname+h.browser.location.search,url);
  // Replacement clears the origin even if the practice stub still exposes old results.
  child('HeadAtlasGuidedLearning').props.onPracticeSequence([reviewed,origin],'locate');h.flush();h.practice.finish();h.flush();
  await h.choosePackage('synthetic-replacement');await h.settle();await h.settle();
  assert.equal(child('HeadAtlasPractice').props.onReturnToLearning,undefined);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)for(const retirement of ['close','replace','new quiz'] as const)
test(`${modality} completed tour Return callback cannot revive results after ${retirement}`,async()=>{
 const origin=practiceMask(modality==='CT'?pons:{...pons,id:'mrb.bst.pons'});
 const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
 const h=harness(url,{modality,entries:[origin]});try{
  const child=(name:string)=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name===name)!;
  h.flush();await h.choosePackage('synthetic-return-callback');await h.settle();await h.settle();
  child('HeadAtlasGuidedLearning').props.onPractice(origin);h.flush();
  h.practice.finish();h.practice.results=[{entry:origin,outcome:'incorrect'}];h.flush();
  const retired=child('HeadAtlasPractice').props.onReturnToLearning;assert.equal(typeof retired,'function');
  retired();h.flush();assert.equal(h.practice.finished,true);
  if(retirement==='close')h.act('Close atlas');
  else if(retirement==='replace'){await h.choosePackage('synthetic-replacement');await h.settle();await h.settle();}
  else {child('HeadAtlasGuidedLearning').props.onPractice(origin);h.flush();}
  const before=h.browser.location.pathname+h.browser.location.search,ends=h.endCount;
  const active=h.practice.active,finished=h.practice.finished,results=h.practice.results;
  retired();h.flush();
  assert.equal(h.browser.location.pathname+h.browser.location.search,before,'retired Return cannot navigate');
  assert.equal(h.endCount,ends);assert.equal(h.practice.active,active);assert.equal(h.practice.finished,finished);
  assert.equal(h.practice.results,results,'retired Return cannot change the current set');
 }finally{h.dispose();}
});

test('actual viewer callbacks keep mapped clicks, guided steps, modality link and history canonical',async()=>{
  const pons=practiceMask(entry('cth.bst.pons','Pons — regional mask')),midbrain=practiceMask(entry('cth.bst.midbrain','Midbrain — regional mask')),medulla=practiceMask(entry('cth.bst.medulla_oblongata','Medulla oblongata — regional mask'));
  const h=harness('/atlas/ct-head',{entries:[pons,midbrain,medulla,unmapped,leftThalamus,rightThalamus]});try{
    h.flush();const input=h.find('input','');assert(input); // the only file input in the shell
    const fileInput=(function scan(value:unknown):Node|undefined{if(Array.isArray(value)){for(const item of value){const found=scan(item);if(found)return found;}return;}if(!value||typeof value!=='object'||!('props'in value))return;const node=value as Node;if(node.type==='input'&&node.props.type==='file')return node;return scan(node.props.children);})(h.tree);
    assert(fileInput);await fileInput.props.onChange({target:{files:[{name:'synthetic'}],value:'synthetic'}});await h.settle();await h.settle();
     h.act('Pons — regional mask');assert.equal(h.browser.location.search,`?concept=brainstem-pons&headRevision=${HEAD_LINK_REVISION}`);
     const shell=h.tree;assert.equal((shell.props.actions as Node).props.children[0].props.href,`/atlas/mri-head?concept=brainstem-pons&headRevision=${HEAD_LINK_REVISION}`);
    assert.deepEqual(shell.props.headNavigation,{conceptId:'brainstem-pons',position:null,revision:HEAD_LINK_REVISION});
    h.act('Unmapped source');assert.equal(h.browser.location.search,'');
    assert.deepEqual(h.tree.props.headNavigation,{conceptId:null,position:null,revision:HEAD_LINK_REVISION});
    h.act('Guided learning');assert.equal(h.browser.location.search,`?headTour=brainstem&headRevision=${HEAD_LINK_REVISION}`);
    let guided=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasGuidedLearning');
    assert(guided);guided.props.onPositionChange({sequenceId:'brainstem',conceptId:'brainstem-pons'});guided.props.onSelect(pons);h.flush();
    assert.equal(h.browser.location.search,`?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`);
    assert.equal((h.tree.props.actions as Node).props.children[0].props.href,`/atlas/mri-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`);
    assert.deepEqual(h.tree.props.headNavigation,{conceptId:'brainstem-pons',position:{sequenceId:'brainstem',conceptId:'brainstem-pons'},revision:HEAD_LINK_REVISION});
    guided=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasGuidedLearning');assert(guided);
    guided.props.onPositionChange({sequenceId:'brainstem',conceptId:'brainstem-medulla'});guided.props.onSelect(medulla);h.flush();
    assert.equal(h.browser.location.search,`?concept=brainstem-medulla&headTour=brainstem&headStep=2&headRevision=${HEAD_LINK_REVISION}`);
    h.browser.history.back();h.flush();assert.equal(h.browser.location.search,`?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`);
    guided=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasGuidedLearning');assert.deepEqual(guided?.props.position,{sequenceId:'brainstem',conceptId:'brainstem-pons'});
    assert.equal(h.find('button','Pons — regional mask')?.props['aria-pressed'],true);
    h.browser.history.forward();h.flush();assert.equal(h.browser.location.search,`?concept=brainstem-medulla&headTour=brainstem&headStep=2&headRevision=${HEAD_LINK_REVISION}`);
    guided=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasGuidedLearning');assert.deepEqual(guided?.props.position,{sequenceId:'brainstem',conceptId:'brainstem-medulla'});
    guided!.props.onPractice(medulla);h.flush();
    assert.equal(h.browser.location.search,'','active practice must not leave its target readable in the URL');
    assert.equal((h.tree.props.actions as Node).props.children[0].props.href,'/atlas/mri-head','active practice has only generic modality link');
    assert.deepEqual(h.tree.props.headNavigation,{conceptId:null,position:null,revision:HEAD_LINK_REVISION},'active practice cannot leak target into shell tabs');
    const endedBefore=h.endCount;h.browser.history.back();h.flush();assert(h.endCount>endedBefore,'popstate ends active practice');
    guided=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasGuidedLearning');assert.deepEqual(guided?.props.position,{sequenceId:'brainstem',conceptId:'brainstem-medulla'});
    guided!.props.onPractice(medulla);h.flush();assert.equal(h.browser.location.search,'');
    const practicePanel=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(practicePanel?.props.onReturnToLearning);
    practicePanel.props.onReturnToLearning();h.flush();
    assert.equal(h.browser.location.search,'','a hidden Return callback cannot abandon an active question');
    h.practice.finish();h.flush();
    const resultPanel=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(resultPanel?.props.onReturnToLearning);
    resultPanel.props.onReturnToLearning();h.flush();
    assert.equal(h.browser.location.search,`?concept=brainstem-medulla&headTour=brainstem&headStep=2&headRevision=${HEAD_LINK_REVISION}`,'return to tour restores remembered canonical step');
    assert.deepEqual(h.tree.props.headNavigation,{conceptId:'brainstem-medulla',position:{sequenceId:'brainstem',conceptId:'brainstem-medulla'},revision:HEAD_LINK_REVISION});
    // Explicitly choose another set before starting ordinary practice.
    h.practice.end();h.flush();h.act('Practice');
    const generalPractice=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(generalPractice);
    generalPractice.props.onStart();h.practice.startTarget(pons);h.flush();
    assert.equal(h.browser.location.search,'','general practice also clears target intent');
    assert.equal((h.tree.props.actions as Node).props.children[0].props.href,'/atlas/mri-head');
    assert.deepEqual(h.tree.props.headNavigation,{conceptId:null,position:null,revision:HEAD_LINK_REVISION});
    h.browser.history.back();h.flush();
    h.browser.history.pushState(null,'','/atlas/ct-head?concept=brainstem-pons&file=private.nii');
    h.browser.history.back();h.flush();h.browser.history.forward();h.flush();
    assert.equal(h.find('button','Pons — regional mask')?.props['aria-pressed'],false,'invalid history clears exact target');
    assert.equal((h.tree.props.actions as Node).props.children[0].props.href,'/atlas/mri-head','invalid URL falls back to generic route');
    assert.deepEqual(h.tree.props.headNavigation,{conceptId:null,position:null,revision:HEAD_LINK_REVISION},'invalid URL cannot reach shell tabs');
    assert(h.walk(h.tree,node=>node.props.role==='status'&&String(node.props.children).includes('invalid or belongs to another source revision')),'invalid link is visibly explained');
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} saved-step handoff through guided callbacks retains scan and study set`,async()=>{
 const prefix=modality==='CT'?'cth':'mrb';
 const first={...midbrain,id:`${prefix}.bst.midbrain`,mask:{sha256:'bookmark-midbrain'}};
 const second={...pons,id:`${prefix}.bst.pons`,mask:{sha256:'bookmark-pons'}};
 const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[first,second]});
 const guided=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasGuidedLearning')!;
 const slice=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice')!;
 const set=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasStudySet')!;
 try{
  h.flush();await h.choosePackage('synthetic-saved-handoff');await h.settle();await h.settle();
  h.act(second.label);await h.settle();h.act('Add to study set');assert.deepEqual(set().props.entries,[second]);
  h.act('Guided learning');guided().props.onPositionChange({sequenceId:'brainstem',conceptId:'brainstem-pons'});guided().props.onSelect(second);h.flush();await h.settle();
  const scan=slice().props.study;
  const saved={sequenceId:'brainstem',conceptId:'brainstem-midbrain'};
  guided().props.onPositionChange(saved);guided().props.onSelect(first);h.flush();await h.settle();
  assert.deepEqual(guided().props.position,saved);
  assert.equal(slice().props.selected?.entry,first);assert.equal(slice().props.study,scan);
  assert.deepEqual(set().props.entries,[second]);assert.equal(h.practice.active,false);
  assert.equal(h.browser.location.pathname+h.browser.location.search,navigation.headImageHref(modality,saved.conceptId,saved,HEAD_LINK_REVISION));
  h.browser.history.back();h.flush();await h.settle();assert.equal(slice().props.selected?.entry,second);
  h.browser.history.forward();h.flush();await h.settle();assert.equal(slice().props.selected?.entry,first);
  assert.deepEqual(set().props.entries,[second]);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} invalid saved links recover explicitly without replacing the loaded scan or guessing anatomy`,async()=>{
 for(const query of ['headTour=brainstem&headRevision='+'0'.repeat(64),'concept=unknown','concept=brainstem-pons&file=private.nii']){
  const route=`/atlas/${modality.toLowerCase()}-head`,h=harness(`${route}?${query}`,{modality});
  try{
   h.flush();assert(h.find('button',`Browse current ${modality} atlas`),'recovery is available before import');
   await h.choosePackage('synthetic-link-recovery');await h.settle();await h.settle();
   const native=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!;
   const loadedStudy=native().props.study,stackLength=h.browser.stack.length;
   assert.equal(native().props.selected,null,'invalid target stays unselected');
   const recovery=h.find('button',`Browse current ${modality} atlas`)!;
   const search=h.walk(h.tree,n=>n.type==='input'&&n.props.type==='search')!;
   let focusCount=0;
   search.props.ref.current={focus:(options:unknown)=>{focusCount++;assert.deepEqual(options,{preventScroll:true});}};
   recovery.props.onClick();h.flush();await h.settle();
   assert.equal(focusCount,1,'keyboard focus moves to the enabled structure search');
   assert.equal(h.browser.location.pathname+h.browser.location.search,route);
   assert.equal(h.browser.stack.length,stackLength+1,'explicit recovery remains reversible');
   assert.equal(native().props.study,loadedStudy,'loaded study is retained without reimport');
   assert.equal(native().props.selected,null,'recovery does not guess a structure');
   assert.equal(h.find('button',`Browse current ${modality} atlas`),undefined);
   recovery.props.onClick();h.flush();assert.equal(h.browser.stack.length,stackLength+1,'retired recovery callback is inert');
   assert.equal(focusCount,1,'retired callback cannot steal focus');
   h.browser.history.back();h.flush();await h.settle();
   assert.equal(h.browser.location.search,`?${query}`);assert(h.find('button',`Browse current ${modality} atlas`));
   assert.equal(native().props.selected,null);
   h.browser.history.forward();h.flush();await h.settle();assert.equal(h.browser.location.search,'');
   assert.equal(h.find('button',`Browse current ${modality} atlas`),undefined);
  }finally{h.dispose();}
 }
});

for(const modality of ['CT','MRI'] as const)test(`${modality} recovery before import focuses the package opener, never disabled search`,()=>{
 const route=`/atlas/${modality.toLowerCase()}-head`,h=harness(`${route}?concept=unknown`,{modality});
 try{
  h.flush();let openFocus=0,searchFocus=0;
  const opener=h.find('button','Open approved atlas')!;
  opener.props.ref.current={focus:(options:unknown)=>{openFocus++;assert.deepEqual(options,{preventScroll:true});}};
  const search=h.walk(h.tree,n=>n.type==='input'&&n.props.type==='search')!;
  assert.equal(search.props.disabled,true);
  search.props.ref.current={focus:()=>searchFocus++};
  h.act(`Browse current ${modality} atlas`);
  assert.equal(openFocus,1);assert.equal(searchFocus,0);
  assert.equal(h.browser.location.pathname+h.browser.location.search,route);
 }finally{h.dispose();}
});

test('before local import, modality link preserves only a valid URL intent',()=>{
  const valid=`/atlas/ct-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
  for(const [url,expected] of [
    [valid,`/atlas/mri-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`],
    ['/atlas/ct-head?concept=brainstem-pons',`/atlas/mri-head?concept=brainstem-pons&headRevision=${HEAD_LINK_REVISION}`],
    ['/atlas/ct-head?concept=brainstem-pons&file=private.nii','/atlas/mri-head'],
    ['/atlas/ct-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=stale','/atlas/mri-head'],
  ]){
    const h=harness(url);try{
      h.flush();assert.equal((h.tree.props.actions as Node).props.children[0].props.href,expected);
      const query=new URL(url,'https://example.test').searchParams;
      const parsed=navigation.parseHeadImageNavigation(query,HEAD_LINK_REVISION);
      assert.deepEqual(h.tree.props.headNavigation,{conceptId:parsed.conceptId,position:parsed.position,revision:HEAD_LINK_REVISION});
      assert.equal(h.browser.location.pathname+h.browser.location.search,url,'reading URL never mutates history');
    }finally{h.dispose();}
  }
});

test('source-bound index filters only displayed anatomy and stays hidden throughout active practice',async()=>{
  const h=harness();try{
    h.flush();const input=h.walk(h.tree,node=>node.type==='input'&&node.props.type==='file');assert(input);
    await input.props.onChange({target:{files:[{name:'synthetic'}],value:'synthetic'}});await h.settle();await h.settle();
    const linkedLabel=()=>h.find('label','3D Atlas-linked only');
    let label=linkedLabel();assert(label,'linked-only filter is visible after import');
    let checkbox=h.walk(label,node=>node.type==='input'&&node.props.type==='checkbox');assert(checkbox);assert.equal(checkbox.props.disabled,false);
    checkbox.props.onChange({target:{checked:true}});h.flush();
    assert.equal(h.find('button','Unmapped source'),undefined,'unmapped annotation is hidden by filter');
    assert(h.find('button','Pons — regional mask'),'exact link remains in index');
    const search=h.walk(h.tree,node=>node.type==='input'&&node.props.type==='search');assert(search);
    search.props.onChange({target:{value:' PONS '}});h.flush();
    assert(h.find('button','Pons — regional mask'));assert.equal(h.find('button','Midbrain — regional mask'),undefined);
    const family=h.find('label','System');assert(family);
    const select=h.walk(family,node=>node.type==='select');assert(select);
    select.props.onChange({target:{value:'bst'}});h.flush();
    assert(h.find('button','Pons — regional mask'),'family, search and linked filters intersect');
    h.act('Reset filters');
    assert(h.find('button','Unmapped source'),'reset restores imported unlinked entries');
    label=linkedLabel();assert(label);checkbox=h.walk(label,node=>node.type==='input'&&node.props.type==='checkbox');assert.equal(checkbox?.props.checked,false);
     h.act('Pons — regional mask');assert.equal(h.browser.location.search,`?concept=brainstem-pons&headRevision=${HEAD_LINK_REVISION}`);
    h.act('Practice');const practice=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(practice);
    practice.props.onStart();h.practice.startTarget(pons);h.flush();
    assert.equal(linkedLabel(),undefined,'index filters are not exposed during practice');
    assert.equal(h.find('button','Pons — regional mask'),undefined,'active practice hides the anatomy index');
    assert.equal(h.browser.location.search,'','practice target is absent from URL');
    h.practice.finish();h.flush();
    assert(linkedLabel(),'index returns after practice');
    assert(h.find('button','Unmapped source'),'practice does not permanently filter the source inventory');
  }finally{h.dispose();}
});

test('a late aborted structure load cannot replace the current selection or cursor',async()=>{
  const h=harness('/atlas/ct-head',{deferEntry:true});try{
    h.flush();await h.choosePackage('first');await h.settle();await h.settle();
    h.act('Pons — regional mask');const old=h.entryRequests[0];assert.equal(old.entry,pons);
    h.act('Midbrain — regional mask');const current=h.entryRequests[1];assert.equal(old.signal.aborted,true);
    current.resolve({entry:midbrain,mask:new Uint8Array(8),focus:[1,0,0]});await h.settle();
    const slice=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice');
    assert.equal(slice()?.props.selected?.entry,midbrain);assert.deepEqual(slice()?.props.cursor,[1,0,0]);
    old.resolve({entry:pons,mask:new Uint8Array(8),focus:[0,1,0]});await h.settle();
    assert.equal(slice()?.props.selected?.entry,midbrain);assert.deepEqual(slice()?.props.cursor,[1,0,0]);
  }finally{h.dispose();}
});

test('starting practice ignores an aborted structure success',async()=>{
  const h=harness('/atlas/ct-head',{deferEntry:true});try{
    h.flush();await h.choosePackage('first');await h.settle();await h.settle();
    h.act('Pons — regional mask');const old=h.entryRequests[0];
    h.act('Practice');const panel=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(panel);
    panel.props.onStart();h.practice.startTarget(midbrain);h.flush();assert.equal(old.signal.aborted,true);
    const slice=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice');
    const before=slice()?.props.cursor;
    old.resolve({entry:pons,mask:new Uint8Array(8),focus:[1,1,1]});await h.settle();
    assert.deepEqual(slice()?.props.cursor,before,'late anatomy must not relocate the practice cursor');
    assert.equal(slice()?.props.selected,null,'quiz remains concealed');
    assert.equal(h.walk(h.tree,node=>node.props.role==='status'&&node.props.children==='Opening Pons — regional mask…'),undefined);
  }finally{h.dispose();}
});

test('a replaced package ignores an old native-study success',async()=>{
  const h=harness('/atlas/ct-head',{deferStudy:true});try{
    h.flush();await h.choosePackage('first');h.flush();const old=h.studyRequests[0];assert(old);
    await h.choosePackage('second');h.flush();const current=h.studyRequests[1];assert(current);assert.equal(old.signal.aborted,true);
    const currentStudy={...study,definition:{entries:[midbrain]}};
    current.resolve(currentStudy);await h.settle();
    assert(h.find('button','Midbrain — regional mask'));assert.equal(h.find('button','Pons — regional mask'),undefined);
    old.resolve(study);await h.settle();
    assert(h.find('button','Midbrain — regional mask'));assert.equal(h.find('button','Pons — regional mask'),undefined,'old package cannot restore its index');
  }finally{h.dispose();}
});


test('unmount aborts pending native-study and structure successes without state writes',async()=>{
  const pendingStudy=harness('/atlas/ct-head',{deferStudy:true});
  pendingStudy.flush();await pendingStudy.choosePackage('first');pendingStudy.flush();
  const requestStudy=pendingStudy.studyRequests[0];assert(requestStudy);pendingStudy.dispose();assert.equal(requestStudy.signal.aborted,true);
  requestStudy.resolve(study);await Promise.resolve();await Promise.resolve();assert.equal(pendingStudy.writesAfterDispose,0);

  const pendingEntry=harness('/atlas/ct-head',{deferEntry:true});
  pendingEntry.flush();await pendingEntry.choosePackage('second');await pendingEntry.settle();await pendingEntry.settle();pendingEntry.act('Pons — regional mask');
  const requestEntry=pendingEntry.entryRequests[0];assert(requestEntry);pendingEntry.dispose();assert.equal(requestEntry.signal.aborted,true);
  requestEntry.resolve({entry:pons,mask:new Uint8Array(8),focus:[1,1,1]});await Promise.resolve();await Promise.resolve();assert.equal(pendingEntry.writesAfterDispose,0);
});

test('a missing exact entry keeps only validated comparison intent without selecting a substitute',async()=>{
  for(const [query,expected] of [
    ['?concept=brainstem-pons',`/atlas/mri-head?concept=brainstem-pons&headRevision=${HEAD_LINK_REVISION}`],
    ['?concept=brainstem-pons&file=private.nii','/atlas/mri-head'],
    ['?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=stale','/atlas/mri-head'],
  ]){
    const h=harness('/atlas/ct-head'+query,{deferStudy:true});try{
      h.flush();await h.choosePackage('missing-pons');h.flush();
      h.studyRequests[0].resolve({...study,definition:{entries:[midbrain,unmapped]}});await h.settle();
      assert.equal((h.tree.props.actions as Node).props.children[0].props.href,expected);
      assert.equal(h.tree.props.headNavigation.conceptId,query==='?concept=brainstem-pons'?'brainstem-pons':null);
      assert.equal(h.find('button','Pons — regional mask'),undefined);
      assert.equal(h.find('button','Midbrain — regional mask')?.props['aria-pressed'],false);
      if(query==='?concept=brainstem-pons'){
        assert(h.walk(h.tree,node=>node.props.role==='status'&&String(node.props.children).includes('exact linked structure is unavailable')));
        assert(h.find('a','Try requested anatomy on MRI'));
      }
      h.act('Midbrain — regional mask');assert.equal(h.browser.location.search,`?concept=brainstem-midbrain&headRevision=${HEAD_LINK_REVISION}`);
      h.act('Unmapped source');assert.equal(h.browser.location.search,'');
      assert.equal((h.tree.props.actions as Node).props.children[0].props.href,'/atlas/mri-head');
    }finally{h.dispose();}
  }
});

test('closing a loaded atlas clears local views and filters, restores focus and permits reopening',async()=>{
  const h=harness();try{
    h.flush();let focused=0;h.find('button','Open approved atlas')!.props.ref.current={focus(){focused++;}};
    await h.choosePackage('first');await h.settle();await h.settle();
    h.act('Pons — regional mask');await h.settle();
    assert(h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice'));
    h.walk(h.tree,node=>node.type==='input'&&node.props.type==='search')!.props.onChange({target:{value:'Pons'}});h.flush();
    const stack=[...h.browser.stack];h.act('Close atlas');
    assert.equal(focused,1);assert.deepEqual(h.browser.stack,stack,'close does not rewrite comparison history');
    assert.equal(h.find('button','Close atlas'),undefined);assert(h.find('button','Open approved atlas'));
    assert.equal(h.find('button','Choose atlas folder')?.props.disabled,false);
    assert.equal(h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice'),undefined);
    assert.equal(h.find('button','Pons — regional mask'),undefined);
    assert.equal((h.tree.props.actions as Node).props.children[0].props.href,`/atlas/mri-head?concept=brainstem-pons&headRevision=${HEAD_LINK_REVISION}`);
    await h.choosePackage('second');await h.settle();await h.settle();
    assert(h.find('button','Close atlas'));assert(h.find('button','Midbrain — regional mask'),'filters reset after reopening');
    assert.equal(h.find('button','Pons — regional mask')?.props['aria-pressed'],true,'valid semantic intent reapplied to new exact source');
  }finally{h.dispose();}
});

test('closing package verification invalidates late success and failure, even after a newer import',async()=>{
  for(const rejectOld of [false,true]){
    const h=harness('/atlas/ct-head',{deferPackage:true});try{
      h.flush();const old=h.choosePackage('first');h.flush();assert(h.find('button','Close atlas'));
      h.act('Close atlas');assert.equal(h.find('button','Close atlas'),undefined);
      const current=h.choosePackage('second');h.flush();
      if(rejectOld)h.packageRequests[0].reject(new Error('stale private package failure'));
      else h.packageRequests[0].resolve({synthetic:'first'});
      await old;await h.settle();
      assert(h.find('button','Close atlas'),'new verification is still pending');
      assert.equal(h.find('button','Change package'),undefined);
      assert.equal(h.walk(h.tree,node=>node.props.role==='alert'),undefined,'old failure cannot surface');
      h.packageRequests[1].resolve({synthetic:'second'});await current;await h.settle();await h.settle();
      assert(h.find('button','Change package'));assert(h.find('button','Pons — regional mask'));
      h.act('Close atlas');
    }finally{h.dispose();}
  }
});

for(const modality of ['CT','MRI'] as const)for(const action of ['close','replace'] as const)for(const kind of ['study','entry','group'] as const)
test(`${modality} ${action} synchronously aborts ${kind} loads before effect cleanup`,async()=>{
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,deferStudy:kind==='study',deferEntry:kind!=='study',withGroups:kind==='group'});
  try{
    h.flush();await h.choosePackage('first');await h.settle();await h.settle();
    if(kind==='entry')h.act('Pons — regional mask');
    if(kind==='group'){
      const group=h.find('label','Show masks');assert(group);
      h.walk(group,n=>n.type==='select')!.props.onChange({target:{value:'bst'}});h.flush();
    }
    const request=kind==='study'?h.studyRequests[0]:h.entryRequests[0];assert(request);
    assert.equal(request.signal.aborted,false);
    // Intentionally do not flush: native promises can settle before passive
    // effect cleanup. The user action itself must retire the former package.
    const replacement=action==='replace'?h.choosePackage('second'):null;
    if(action==='close')h.find('button','Close atlas')!.props.onClick();
    assert.equal(request.signal.aborted,true,'cancel inside the event, not a later effect');
    if(kind==='study')h.studyRequests[0].resolve(study);
    else h.entryRequests[0].resolve({entry:pons,mask:new Uint8Array(8),focus:[1,1,1]});
    await Promise.resolve();await Promise.resolve();if(replacement)await replacement;
    await h.settle();await h.settle();
    const slice=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice');
    assert.equal(slice?.props.selected??null,null,'retired mask cannot return');
    assert(h.visibleLayerCalls.at(-1)?.length===0,'retired group cannot return');
    if(action==='close'){assert.equal(slice,undefined);assert.equal(h.find('button','Close atlas'),undefined);}
    else assert(h.find('button','Change package'));
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} cancelling the file picker preserves the current pending read`,async()=>{
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,deferEntry:true});
  try{
    h.flush();await h.choosePackage('first');await h.settle();await h.settle();h.act('Pons — regional mask');
    const request=h.entryRequests[0];assert(request);
    const input=h.walk(h.tree,n=>n.type==='input'&&n.props.type==='file');assert(input);
    await input.props.onChange({target:{files:[],value:''}});
    assert.equal(request.signal.aborted,false,'cancelled picker is not package replacement');
    request.resolve({entry:pons,mask:new Uint8Array(8),focus:[1,1,1]});await h.settle();
    assert.equal(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')?.props.selected?.entry,pons);
  }finally{h.dispose();}
});

test('close aborts pending study and structure loads and ignores late completion',async()=>{
  for(const kind of ['study','entry'] as const){
    const h=harness('/atlas/ct-head',kind==='study'?{deferStudy:true}:{deferEntry:true});try{
      h.flush();await h.choosePackage('first');await h.settle();await h.settle();
      if(kind==='entry')h.act('Pons — regional mask');
      const request=kind==='study'?h.studyRequests[0]:h.entryRequests[0];assert(request);
      h.act('Close atlas');assert.equal(request.signal.aborted,true);
      if(kind==='study')h.studyRequests[0].resolve(study);
      else h.entryRequests[0].resolve({entry:pons,mask:new Uint8Array(8),focus:[1,1,1]});
      await h.settle();assert.equal(h.find('button','Close atlas'),undefined);
      assert.equal(h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice'),undefined);
      assert.equal(h.find('button','Pons — regional mask'),undefined);
    }finally{h.dispose();}
  }
});

test('close ends practice without restoring its target; closing a tour retains validated step intent',async()=>{
  const tour=`?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
  const h=harness('/atlas/ct-head'+tour);try{
    h.flush();await h.choosePackage('first');await h.settle();await h.settle();
    h.act('Close atlas');
    assert.equal(h.browser.location.search,tour);
    assert.equal((h.tree.props.actions as Node).props.children[0].props.href,'/atlas/mri-head'+tour);
    const guided=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasGuidedLearning');
    assert.deepEqual(guided?.props.position,{sequenceId:'brainstem',conceptId:'brainstem-pons'});
    await h.choosePackage('second');await h.settle();await h.settle();
    h.act('Practice');const panel=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasPractice');assert(panel);
    panel.props.onStart();h.practice.startTarget(pons);h.flush();
    h.practice.results=[{entry:pons,outcome:'incorrect'}];
    const ended=h.endCount;h.act('Close atlas');assert.equal(h.endCount,ended+1);
    assert.equal(h.practice.active,false);assert.deepEqual(h.practice.results,[]);
    assert.equal(h.browser.location.search,'');assert.equal((h.tree.props.actions as Node).props.children[0].props.href,'/atlas/mri-head');
    assert.deepEqual(h.tree.props.headNavigation,{conceptId:null,position:null,revision:HEAD_LINK_REVISION});
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} returning to an unavailable tour step clears ordinary anatomy without substituting it`,async()=>{
  const target={...pons,id:modality==='CT'?pons.id:'mrb.bst.pons'};
  const position={sequenceId:'brainstem',conceptId:'brainstem-midbrain'};
  const href=navigation.headImageHref(modality,position.conceptId,position,HEAD_LINK_REVISION)!;
  const h=harness(href,{modality,entries:[target],withGroups:true});
  try{
    h.flush();await h.choosePackage('synthetic-gap-return');await h.settle();await h.settle();
    const native=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!;
    assert.equal(native().props.selected,null);
    h.act('Pons — regional mask');await h.settle();assert.equal(native().props.selected?.entry,target);
    const group=h.find('label','Show masks');assert(group);h.walk(group,n=>n.type==='select')!.props.onChange({target:{value:'bst'}});h.flush();await h.settle();
    assert(h.visibleLayerCalls.at(-1)!.length>0);
    const calls=h.visibleLayerCalls.length;
    h.act('Guided learning');await h.settle();
    assert.equal(native().props.selected,null,'ordinary anatomy must not impersonate the unavailable tour step');
    assert(h.visibleLayerCalls.slice(calls).every(layers=>layers.length===0),'no stale group in the first returning render');
    assert.equal(h.find('button','Pons — regional mask')?.props['aria-pressed'],false);
    assert.deepEqual(h.tree.props.headNavigation.position,position);
    assert.equal(h.browser.location.pathname+h.browser.location.search,href);
    h.browser.history.back();h.flush();await h.settle();
    assert.equal(native().props.selected?.entry,target,'Back restores the actual prior anatomy selection');
  }finally{h.dispose();}
});

test('an unavailable guided position clears the prior native selection without substituting a source entry',async()=>{
  const h=harness('/atlas/ct-head',{deferStudy:true,withGroups:true});try{
    h.flush();await h.choosePackage('only-pons');h.flush();h.studyRequests[0].resolve({...study,definition:{entries:[pons]}});await h.settle();
    h.act('Pons — regional mask');await h.settle();h.act('Guided learning');
    const guided=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasGuidedLearning');assert(guided);
    const group=h.find('label','Show masks');assert(group);h.walk(group,node=>node.type==='select')!.props.onChange({target:{value:'bst'}});h.flush();await h.settle();
    assert(h.visibleLayerCalls.at(-1)!.length>0,'synthetic grouped masks loaded before navigating to gap');
    const callCount=h.visibleLayerCalls.length;
    guided.props.onPositionChange({sequenceId:'brainstem',conceptId:'brainstem-midbrain'});h.flush();await h.settle();
    assert(h.visibleLayerCalls.slice(callCount).every(layers=>layers.length===0),'group data cleared in first render, not only after effect cleanup');
    const slice=h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='NativeSlice');assert(slice);
    assert.equal(slice.props.selected,null);assert.equal(h.find('button','Pons — regional mask')?.props['aria-pressed'],false);
    assert.equal(h.browser.location.search,`?concept=brainstem-midbrain&headTour=brainstem&headStep=0&headRevision=${HEAD_LINK_REVISION}`);
    assert.deepEqual(h.tree.props.headNavigation.position,{sequenceId:'brainstem',conceptId:'brainstem-midbrain'});
    h.browser.history.back();h.flush();await h.settle();assert.equal(h.browser.location.search,`?headTour=brainstem&headRevision=${HEAD_LINK_REVISION}`,'first Back restores the sequence chooser');
    assert.equal(h.find('button','Pons — regional mask')?.props['aria-pressed'],false);
    h.browser.history.back();h.flush();await h.settle();assert.equal(h.find('button','Pons — regional mask')?.props['aria-pressed'],true,'second Back restores the earlier exact anatomy');
  }finally{h.dispose();}
});

test('Other side selects exact same-study anatomy, resets filters and overlays, and updates canonical history and focus',async()=>{
  const h=harness('/atlas/ct-head',{withGroups:true});try{
    h.flush();await h.choosePackage('synthetic-paired');await h.settle();await h.settle();
    assert.equal(h.find('h3','Other side'),undefined,'no structure means no extra control');
    h.act('Left thalamus — regional mask');await h.settle();assert(h.find('button','Show Right thalamus'));
    const search=h.walk(h.tree,node=>node.type==='input'&&node.props.type==='search');assert(search);
    search.props.onChange({target:{value:'Left'}});h.flush();
    const group=h.find('label','Show masks');assert(group);h.walk(group,node=>node.type==='select')!.props.onChange({target:{value:'bst'}});h.flush();await h.settle();
    let focused=0;h.find('h2','Left thalamus — regional mask')!.props.ref.current={focus(){focused++;},closest(){return{scrollTo(){}};}};
    h.act('Show Right thalamus');await h.settle();
    assert.equal(h.browser.location.search,`?concept=deep-right-thalamus&headRevision=${HEAD_LINK_REVISION}`);assert.equal(h.find('button','Right thalamus — regional mask')?.props['aria-pressed'],true);
    assert.equal(h.walk(h.tree,node=>node.type==='input'&&node.props.type==='search')?.props.value,'');
    assert.equal(h.walk(h.find('label','Show masks'),node=>node.type==='select')?.props.value,'selected');
    assert.equal(h.visibleLayerCalls.at(-1)?.length,0);assert.equal(focused,1);
    assert(h.find('button','Show Left thalamus'));assert.equal((h.tree.props.actions as Node).props.children[0].props.href,`/atlas/mri-head?concept=deep-right-thalamus&headRevision=${HEAD_LINK_REVISION}`);
    h.browser.history.back();h.flush();await h.settle();assert.equal(h.find('button','Left thalamus — regional mask')?.props['aria-pressed'],true);
    h.setPractice(true);h.flush();assert.equal(h.find('h3','Other side'),undefined);assert.equal(h.find('button','Show Right thalamus'),undefined,'practice cannot expose paired anatomy');
  }finally{h.dispose();}
});

test('paired action is absent while its exact load is pending and cannot resurrect a cleared selection',async()=>{
  const h=harness('/atlas/ct-head',{deferEntry:true});try{
    h.flush();await h.choosePackage('synthetic-paired');await h.settle();await h.settle();
    h.act('Left thalamus — regional mask');assert.equal(h.find('h3','Other side'),undefined);
    h.entryRequests[0].resolve({entry:leftThalamus,mask:new Uint8Array(8),focus:null});await h.settle();assert(h.find('button','Show Right thalamus'));
    h.act('Show Right thalamus');assert.equal(h.find('h3','Other side'),undefined);assert.equal(h.entryRequests[1].entry,rightThalamus);
    h.act('Clear selection');assert.equal(h.entryRequests[1].signal.aborted,true);
    h.entryRequests[1].resolve({entry:rightThalamus,mask:new Uint8Array(8),focus:null});await h.settle();
    assert.equal(h.find('h3','Other side'),undefined);assert.equal(h.browser.location.search,'');
    assert.equal((h.tree.props.actions as Node).props.children[0].props.href,'/atlas/mri-head');
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} failed native scan retries the same package without folder reselection or navigation changes`,async()=>{
 const url=`/atlas/${modality.toLowerCase()}-head?concept=brainstem-pons`;
 const h=harness(url,{modality,deferStudy:true});try{
  h.flush();assert.equal(h.find('button','Retry opening scan'),undefined);
  await h.choosePackage('synthetic-scan-retry');await h.settle();
  assert.equal(h.studyRequests.length,1);assert.equal(h.find('button','Retry opening scan'),undefined);
  h.studyRequests[0].reject(Error('Synthetic image read failure'));await h.settle();
  const button=h.find('button','Retry opening scan');assert(button);
  const history=[...h.browser.stack];let focused=0;
  const packageAction=h.find('button','Change package');assert(packageAction);
  packageAction.props.ref.current={focus(){focused++;}};
  button.props.onClick();button.props.onClick();h.flush();
  assert.equal(h.studyRequests.length,2,'duplicate activation cannot enqueue extra retries');assert.equal(focused,1);
  assert.equal(h.studyRequests[0].signal.aborted,true);assert.equal(h.find('button','Retry opening scan'),undefined);
  assert.deepEqual(h.browser.stack,history);
  h.studyRequests[1].resolve(study);await h.settle();await h.settle();
  const native=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice');assert(native);
  assert.equal(native.props.study,study);assert.equal(h.find('button','Retry opening scan'),undefined);
  button.props.onClick();h.flush();assert.equal(h.studyRequests.length,2,'stale retry after success is inert');
  assert.deepEqual(h.browser.stack,history);
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} pending native scan retry cannot survive close, replacement or unmount`,async()=>{
 for(const action of ['close','replace','unmount']){
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,deferStudy:true});let disposed=false;
  try{
   h.flush();await h.choosePackage('synthetic-old');await h.settle();
   h.studyRequests[0].reject(Error('Synthetic failure'));await h.settle();
   const button=h.find('button','Retry opening scan');assert(button);h.act('Retry opening scan');const request=h.studyRequests[1];
   if(action==='close')h.act('Close atlas');
   else if(action==='replace'){await h.choosePackage('synthetic-new');await h.settle();}
   else{h.dispose();disposed=true;}
   assert.equal(request.signal.aborted,true);
   request.resolve(study);await Promise.resolve();await Promise.resolve();
   if(disposed){assert.equal(h.writesAfterDispose,0);continue;}
   h.flush();assert.equal(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice'),undefined);
   button.props.onClick();h.flush();assert.equal(h.studyRequests.length,action==='replace'?3:2);
   assert.equal(h.find('button','Retry opening scan'),undefined);
   if(action==='replace'){h.studyRequests[2].reject(Error('New image failed'));await h.settle();assert(h.find('button','Retry opening scan'));}
  }finally{if(!disposed)h.dispose();}
 }
});

test('native retry repeated failure remains recoverable and changing modality invalidates the old attempt',async()=>{
 const options:{modality:'CT'|'MRI';deferStudy:boolean}={modality:'CT',deferStudy:true};
 const h=harness('/atlas/ct-head',options);try{
  h.flush();await h.choosePackage('synthetic-modality');await h.settle();
  h.studyRequests[0].reject(Error('First failure'));await h.settle();h.act('Retry opening scan');
  h.studyRequests[1].reject(Error('Second failure'));await h.settle();
  assert(h.find('button','Retry opening scan'));h.act('Retry opening scan');const old=h.studyRequests[2];
  options.modality='MRI';h.flush();assert.equal(old.signal.aborted,true);assert.equal(h.studyRequests.length,4);
  old.reject(Error('Late old modality failure'));await h.settle();
  assert.equal(h.find('button','Retry opening scan'),undefined);
  h.studyRequests[3].resolve(study);await h.settle();
  assert(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice'));
 }finally{h.dispose();}
});

test('package verification failure does not offer native scan retry',async()=>{
 const h=harness('/atlas/ct-head',{deferPackage:true,deferStudy:true});try{
  h.flush();const choosing=h.choosePackage('invalid-package');h.flush();
  h.packageRequests[0].reject(Error('Synthetic manifest mismatch'));await choosing;await h.settle();
  assert.equal(h.studyRequests.length,0);assert.equal(h.find('button','Retry opening scan'),undefined);
 }finally{h.dispose();}
});

test('failed guided structure retries its exact source while preserving URL, window and tour position',async()=>{
  const tour=`?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
  for(const modality of ['CT','MRI'] as const){
    const h=harness(`/atlas/${modality.toLowerCase()}-head`,{deferEntry:true,modality});try{
      h.flush();await h.choosePackage('synthetic-retry');await h.settle();await h.settle();
      h.act('Pons — regional mask');h.entryRequests[0].reject(Error('Synthetic temporary read failure'));await h.settle();
      assert(h.find('button','Retry opening structure'));
      const history=[...h.browser.stack],navigation=h.tree.props.headNavigation;
      const native=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice');
      const windowing=native()?.props.windowing;
      h.act('Retry opening structure');assert.equal(h.entryRequests.length,2);assert.equal(h.entryRequests[0].signal.aborted,true);
      assert.equal(h.entryRequests[1].entry,pons);assert.equal(h.find('button','Retry opening structure'),undefined);
      assert.deepEqual(h.browser.stack,history);assert.deepEqual(h.tree.props.headNavigation,navigation);assert.deepEqual(native()?.props.windowing,windowing);
      h.entryRequests[1].resolve({entry:pons,mask:new Uint8Array(8),focus:[1,1,1]});await h.settle();
      assert.equal(h.find('button','Retry opening structure'),undefined);
      assert.equal(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')?.props.selected?.entry,pons);
    }finally{h.dispose();}
  }
  const h=harness('/atlas/ct-head'+tour,{deferEntry:true});try{
    h.flush();await h.choosePackage('synthetic-tour-retry');await h.settle();await h.settle();
    h.entryRequests[0].reject(Error('Synthetic temporary read failure'));await h.settle();
    const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning');
    const position=guided()?.props.position,history=[...h.browser.stack];
    h.act('Retry opening structure');assert.deepEqual(guided()?.props.position,position);assert.deepEqual(h.browser.stack,history);
    h.entryRequests[1].resolve({entry:pons,mask:new Uint8Array(8),focus:[1,1,1]});await h.settle();
    assert.deepEqual(guided()?.props.position,position);assert.equal(h.browser.location.search,tour);
  }finally{h.dispose();}
});

test('native retry cancels on clear, package close, other selection or practice without stale anatomy',async()=>{
  for(const action of ['Clear selection','Close atlas','Midbrain — regional mask','practice']){
    const h=harness('/atlas/ct-head',{deferEntry:true});try{
      h.flush();await h.choosePackage('synthetic-retry');await h.settle();await h.settle();
      h.act('Pons — regional mask');h.entryRequests[0].reject(Error('Synthetic failure'));await h.settle();
      h.act('Retry opening structure');const retry=h.entryRequests[1];
      if(action==='practice'){h.setPractice(true);h.flush();}else h.act(action);
      assert.equal(retry.signal.aborted,true);retry.resolve({entry:pons,mask:new Uint8Array(8),focus:[1,1,1]});await h.settle();
      assert.equal(h.find('button','Retry opening structure'),undefined);
      assert.notEqual(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')?.props.selected?.entry,pons);
      if(action==='Midbrain — regional mask')assert.equal(h.entryRequests[2].entry,midbrain);
    }finally{h.dispose();}
  }
});

test('deferred 3D view mounts only for visible native geometry outside a question',async()=>{
  const h=harness('/atlas/ct-head',{surface:true});try{
    const surface=()=>h.walk(h.tree,node=>typeof node.type==='function'&&node.type.name==='HeadAtlasSurfaceLoader');
    h.flush();assert.equal(surface(),undefined,'closed package does not mount renderer');
    await h.choosePackage('synthetic-surface');await h.settle();await h.settle();
    assert.equal(surface(),undefined,'open package without selection does not mount renderer');
    h.act('Pons — regional mask');await h.settle();
    assert.equal(surface(),undefined,'default axial layout remains slice-only');
    const scanButton=h.walk(h.tree,node=>node.type==='button'&&node.props.children==='Open selected structure in 3D scan view');
    assert(scanButton,'selected native geometry is explicitly labelled as a scan view');
    scanButton.props.onClick();h.flush();
    assert.equal(surface()?.props.selected?.entry,pons,'scan action uses the selected study geometry, not a reference Atlas');
    const caption=h.walk(h.tree,node=>node.props.className==='head-surface-caption');
    assert.match(JSON.stringify(caption?.props.children),/geometry from this scan, not the reference 3D Atlas/);
    const atlasLink=h.walk(h.tree,node=>node.type==='a'&&String(node.props.href).includes('/atlas/head-neck-3d'));
    assert(atlasLink,'separate source-matched anatomical Atlas link remains available');
    assert.equal(atlasLink.props.target,'_blank','manual scan stays open while reference Atlas opens separately');
    assert.equal(atlasLink.type,'a');assert.equal(atlasLink.props.prefetch,undefined,'native document link does not prefetch reference geometry');assert.equal(atlasLink.props.onClick,undefined,'document entry is not intercepted by client routing');
    h.act('Multiplanar');
    assert.equal(surface()?.props.selected?.entry,pons,'visible native geometry mounts the deferred view');
    h.act('Axial');assert.equal(surface(),undefined,'slice-only layout removes the 3D view');
    h.act('Multiplanar');assert(surface(),'returning to the shared layout restores the 3D view');
    h.setPractice(true);h.flush();assert.equal(surface(),undefined,'active question conceals the 3D view');
    h.setPractice(false);h.flush();await h.settle();assert(surface(),'returning to exploration reloads the selected geometry');
    h.act('Clear selection');assert.equal(surface(),undefined,'cleared selection unloads the view');
    h.act('Close atlas');assert.equal(surface(),undefined,'closing the package leaves no 3D view');
  }finally{h.dispose();}
});

test('generic CT/MRI remounts remember independent native positions and layouts only after sharing',async()=>{
 const session=createHeadFolderSession(HEAD_LINK_REVISION);
 const definition={...study.definition,image:{shape_kji:[2,2,2]}};
 const pkg={manifest:{studies:{CT:{...definition},MRI:{...definition}}}};
 const slice=(h:ReturnType<typeof harness>)=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!;
 const share=(h:ReturnType<typeof harness>)=>{h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadFolderSharing')!.props.onChange(true);h.flush();};
 const ct=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 try{
  ct.flush();await ct.choosePackage('synthetic-memory');await ct.settle();await ct.settle();
  slice(ct).props.onCursor([0,1,0]);ct.act('Coronal');
  assert.equal(session.read(HEAD_LINK_REVISION),null);
  share(ct);assert.deepEqual(session.readView(pkg as any,'CT',pkg.manifest.studies.CT as any,HEAD_LINK_REVISION),{cursor:[0,1,0],layout:'coronal'});
 }finally{ct.dispose();}
 const mri=harness('/atlas/mri-head',{folderSession:session,checkedPackage:pkg,modality:'MRI'});
 try{
  mri.flush();await mri.settle();await mri.settle();
  assert.deepEqual(slice(mri).props.cursor,[1,1,1]);assert(mri.find('button','Axial')?.props['aria-pressed']);
  slice(mri).props.onCursor([1,0,0]);mri.act('Sagittal');
  assert.deepEqual(session.readView(pkg as any,'MRI',pkg.manifest.studies.MRI as any,HEAD_LINK_REVISION),{cursor:[1,0,0],layout:'sagittal'});
 }finally{mri.dispose();}
 const back=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 try{
  back.flush();await back.settle();await back.settle();
  assert.deepEqual(slice(back).props.cursor,[0,1,0]);assert(back.find('button','Coronal')?.props['aria-pressed']);
  back.act('Multiplanar');
  assert.deepEqual(session.readView(pkg as any,'CT',pkg.manifest.studies.CT as any,HEAD_LINK_REVISION),{cursor:[0,1,0],layout:'multiplanar'});
 }finally{back.dispose();}
 const again=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 try{again.flush();await again.settle();await again.settle();assert.deepEqual(slice(again).props.cursor,[0,1,0]);assert(again.find('button','Multiplanar')?.props['aria-pressed']);}
 finally{again.dispose();}
});

test('linked and invalid routes never restore a generic saved view',async()=>{
 const session=createHeadFolderSession(HEAD_LINK_REVISION);
 const definition={...study.definition,image:{shape_kji:[2,2,2]}};
 const pkg={manifest:{studies:{CT:{...definition},MRI:{...definition}}}};
 session.keep(pkg as any,HEAD_LINK_REVISION);
 assert(session.keepView(pkg as any,'CT',pkg.manifest.studies.CT as any,HEAD_LINK_REVISION,{cursor:[0,0,0],layout:'sagittal'}));
 for(const route of ['/atlas/ct-head?concept=brainstem-pons',`/atlas/ct-head?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`,`/atlas/ct-head?headTour=brainstem&headRevision=${HEAD_LINK_REVISION}`,'/atlas/ct-head?concept=not-a-concept','/atlas/ct-head?headTour=brainstem&headRevision=stale']){
  const h=harness(route,{folderSession:session,checkedPackage:pkg});
  try{
   h.flush();await h.settle();await h.settle();
   const slice=h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice');assert(slice);
   assert.deepEqual(slice.props.cursor,[1,1,1],route);
   assert(h.find('button','Axial')?.props['aria-pressed'],route);
   assert.deepEqual(session.readView(pkg as any,'CT',pkg.manifest.studies.CT as any,HEAD_LINK_REVISION),{cursor:[0,0,0],layout:'sagittal'});
  }finally{h.dispose();}
 }
});

test('deferred linked entry uses its exact loaded focus instead of center or a saved generic cursor',async()=>{
 const session=createHeadFolderSession(HEAD_LINK_REVISION);
 const definition={...study.definition,image:{shape_kji:[2,2,2]}};
 const pkg={manifest:{studies:{CT:{...definition},MRI:{...definition}}}};
 session.keep(pkg as any,HEAD_LINK_REVISION);
 assert(session.keepView(pkg as any,'CT',pkg.manifest.studies.CT as any,HEAD_LINK_REVISION,{cursor:[0,0,0],layout:'sagittal'}));
 const h=harness('/atlas/ct-head?concept=brainstem-pons',{folderSession:session,checkedPackage:pkg,deferEntry:true});
 try{
  h.flush();await h.settle();await h.settle();
  assert.equal(h.entryRequests.length,1);assert.equal(h.entryRequests[0].entry,pons);
  const slice=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!;
  assert.deepEqual(slice().props.cursor,[1,1,1]);assert(h.find('button','Axial')?.props['aria-pressed']);
  h.entryRequests[0].resolve({entry:pons,mask:new Uint8Array(8),focus:[0,1,1]});await h.settle();
  assert.equal(slice().props.selected?.entry,pons);
  assert.deepEqual(slice().props.cursor,[0,1,1]);assert(h.find('button','Axial')?.props['aria-pressed']);
 }finally{h.dispose();}
});

test('question focus and feedback do not replace saved ordinary browsing; close and replacement clear it',async()=>{
 const session=createHeadFolderSession(HEAD_LINK_REVISION);
 const definition={...study.definition,image:{shape_kji:[2,2,2]}};
 const pkg={manifest:{studies:{CT:{...definition},MRI:{...definition}}}};
 const h=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 const saved=()=>session.readView(pkg as any,'CT',pkg.manifest.studies.CT as any,HEAD_LINK_REVISION);
 try{
  h.flush();await h.choosePackage('synthetic-memory');await h.settle();await h.settle();
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadFolderSharing')!.props.onChange(true);h.flush();
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!.props.onCursor([0,0,0]);h.flush();
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
  Object.assign(h.practice,{target:{entry:pons,focus:[1,1,1]},mode:'locate',outcome:null});
  h.setPractice(true);h.flush();
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!.props.onCursor([1,0,1]);h.flush();
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'},'pending question movement is not remembered');
  h.practice.outcome='correct';h.flush();
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
  h.setPractice(false);h.flush();
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'},'ending a question must not persist its former focus');
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!.props.onCursor([1,0,0]);h.flush();
  assert.deepEqual(saved(),{cursor:[1,0,0],layout:'axial'},'new ordinary interaction resumes saving');
  await h.choosePackage('replacement');await h.settle();await h.settle();
  assert.equal(saved(),null);
  h.act('Close atlas');assert.equal(session.read(HEAD_LINK_REVISION),null);
 }finally{h.dispose();}
});

test('guided panel and 3D-only layout never save a browsing view',async()=>{
 const session=createHeadFolderSession(HEAD_LINK_REVISION);
 const definition={...study.definition,image:{shape_kji:[2,2,2]}};
 const pkg={manifest:{studies:{CT:{...definition},MRI:{...definition}}}};
 const h=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 const saved=()=>session.readView(pkg as any,'CT',pkg.manifest.studies.CT as any,HEAD_LINK_REVISION);
 try{
  h.flush();await h.choosePackage('synthetic-memory');await h.settle();await h.settle();
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadFolderSharing')!.props.onChange(true);h.flush();
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!.props.onCursor([0,0,0]);h.flush();
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
  h.act('Guided learning');
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!.props.onCursor([1,0,0]);h.flush();
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
 }finally{h.dispose();}
 const surface=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 try{
  surface.flush();await surface.settle();await surface.settle();
  const layout=surface.walk(surface.tree.props.toolbar,n=>n.type==='button'&&n.props.children==='3D scan view');assert(layout);
  layout.props.onClick();surface.flush();
  assert(surface.walk(surface.tree.props.toolbar,n=>n.type==='button'&&n.props.children==='3D scan view')?.props['aria-pressed']);
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
 }finally{surface.dispose();}
});

test('guided cursor followed by 3D layout does not save guided position',async()=>{
 const session=createHeadFolderSession(HEAD_LINK_REVISION);
 const definition={...study.definition,image:{shape_kji:[2,2,2]}};
 const pkg={manifest:{studies:{CT:{...definition},MRI:{...definition}}}};
 const h=harness('/atlas/ct-head',{folderSession:session,checkedPackage:pkg});
 const saved=()=>session.readView(pkg as any,'CT',pkg.manifest.studies.CT as any,HEAD_LINK_REVISION);
 const guided=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasGuidedLearning');
 try{
  h.flush();await h.choosePackage('synthetic-memory');await h.settle();await h.settle();
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadFolderSharing')!.props.onChange(true);h.flush();
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!.props.onCursor([0,0,0]);h.flush();
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
  h.act('Guided learning');assert(guided());
  h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='NativeSlice')!.props.onCursor([1,0,0]);h.flush();
  assert(guided());assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
  const layout=h.walk(h.tree.props.toolbar,n=>n.type==='button'&&n.props.children==='3D scan view');assert(layout);
  layout.props.onClick();h.flush();
  assert(guided());assert(h.walk(h.tree.props.toolbar,n=>n.type==='button'&&n.props.children==='3D scan view')?.props['aria-pressed']);
  assert.deepEqual(saved(),{cursor:[0,0,0],layout:'axial'});
 }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} filtered batch adds exact masks without starting practice and rejects retired handlers`,async()=>{
  const a={...pons,id:'local.batch.a',label:'Batch A',mask:{sha256:'batch-a'}},b={...midbrain,id:'local.batch.b',label:'Batch B',mask:{sha256:'batch-b'}},other={...unmapped,id:'local.other',label:'Other',mask:{sha256:'other'}};
  const alias={...a,id:'local.alias',label:'Batch alias',source:{geometry_alias_of:a.id}};
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[a,b,alias,other]});
  const set=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasStudySet')!;
  const query=(value:string)=>{h.walk(h.find('label','Find a structure'),n=>n.type==='input')!.props.onChange({target:{value}});h.flush();};
  try{
    h.flush();await h.choosePackage('synthetic-batch');await h.settle();await h.settle();
    assert.equal(set().props.filteredAdd,undefined);
    query('Batch');const retiredFilter=set().props.filteredAdd;assert.equal(retiredFilter.count,2);
    query('Other');retiredFilter.onAdd();h.flush();assert.deepEqual(set().props.entries,[],'changed filters retire the prior add action');
    const history=[...h.browser.stack];set().props.filteredAdd.onAdd();h.flush();assert.deepEqual(set().props.entries,[other]);
    query('Batch');assert.equal(set().props.filteredAdd.total,2);set().props.filteredAdd.onAdd();h.flush();
    assert.deepEqual(set().props.entries,[other,a,b]);assert.equal(set().props.filteredAdd.count,0);
    assert.equal(h.practice.active,false);assert.deepEqual(h.browser.stack,history);
    query('Other');const retiredSet=set().props.filteredAdd;set().props.onClear();h.flush();retiredSet.onAdd();h.flush();assert.deepEqual(set().props.entries,[]);
    query('Batch');const beforePractice=set().props.filteredAdd;h.setPractice(true);h.flush();beforePractice.onAdd();h.flush();h.setPractice(false);h.flush();assert.deepEqual(set().props.entries,[]);
    query('Other');const beforeImport=set().props.filteredAdd;await h.choosePackage('synthetic-batch-new');await h.settle();await h.settle();beforeImport.onAdd();h.flush();assert.deepEqual(set().props.entries,[]);
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} saved concept plans append without navigation and reject retired restore handlers`,async()=>{
  const a={...pons,id:modality==='CT'?'cth.bst.pons':'mrb.bst.pons',mask:{sha256:'saved-pons'}},
    other={...unmapped,mask:{sha256:'saved-other'}};
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[a,other]});
  const set=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasStudySet')!;
  const saved=()=>set().props.savedPlan.props;
  const plan={schema:1,headRevision:HEAD_LINK_REVISION,conceptIds:['brainstem-pons']};
  try{
    h.flush();await h.choosePackage('synthetic-saved-plan');await h.settle();await h.settle();
    assert.equal(saved().plan,null);const history=[...h.browser.stack];saved().onRestore(plan);h.flush();
    assert.deepEqual(set().props.entries,[a]);assert.deepEqual(saved().plan,plan);
    assert.equal(h.practice.active,false);assert.deepEqual(h.browser.stack,history);
    saved().onRestore({...plan,headRevision:'stale'});h.flush();assert.deepEqual(set().props.entries,[a]);
    const cleared=saved();set().props.onClear();h.flush();cleared.onRestore(plan);h.flush();assert.deepEqual(set().props.entries,[]);
    const beforePractice=saved();h.setPractice(true);h.flush();assert.equal(beforePractice.canUse(),false);beforePractice.onRestore(plan);h.flush();
    h.setPractice(false);h.flush();assert.deepEqual(set().props.entries,[]);
    const beforeImport=saved();await h.choosePackage('synthetic-new-plan');await h.settle();await h.settle();beforeImport.onRestore(plan);h.flush();assert.deepEqual(set().props.entries,[]);
    h.act(other.label);await h.settle();await h.settle();h.act('Add to study set');
    saved().onRestore(plan);h.flush();assert.deepEqual(set().props.entries,[other,a]);assert.deepEqual(saved().plan,plan,'unmapped native entry is not saved');
    const beforeClose=saved();h.act('Close atlas');beforeClose.onRestore(plan);h.flush();assert.equal(beforeClose.canUse(),false);
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} missed-result handoff appends only current eligible masks without changing scores or navigation`,async()=>{
  const a={...pons,id:'miss.a',mask:{sha256:'miss-a'}},b={...midbrain,id:'miss.b',mask:{sha256:'miss-b'}},c={...medulla,id:'miss.c',mask:{sha256:'miss-c'}},correct={...unmapped,id:'miss.correct',mask:{sha256:'miss-correct'}};
  const alias={...a,id:'miss.alias',source:{geometry_alias_of:a.id}},point={...a,id:'miss.point',representation:'point'};
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[a,b,c,correct,alias,point]});
  const set=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasStudySet')!;
  const action=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice')!.props.reviewContext.missedStudySet;
  try{
    h.flush();await h.choosePackage('synthetic-missed');await h.settle();await h.settle();h.act('Practice');
    assert.equal(action(),undefined);
    h.practice.results=[{entry:a,outcome:'incorrect'},{entry:b,outcome:'revealed'},{entry:c,outcome:'unanswered'},{entry:correct,outcome:'correct'},{entry:alias,outcome:'incorrect'},{entry:point,outcome:'incorrect'},{entry:{...a},outcome:'incorrect'},{entry:a,outcome:'incorrect'}];
    h.practice.finish();h.flush();const original=h.practice.results,history=[...h.browser.stack];
    assert.equal(action().count,3);action().onAdd();h.flush();
    assert.deepEqual(set().props.entries,[a,b,c]);assert.equal(action().count,0);assert.equal(action().total,0);
    action().onAdd();h.flush();assert.deepEqual(set().props.entries,[a,b,c]);assert.equal(h.practice.results,original);
    assert.equal(h.practice.active,false);assert.equal(h.practice.finished,true);assert.deepEqual(h.browser.stack,history);
    set().props.onClear();h.flush();const beforeReplacement=action();
    h.practice.results=[{entry:correct,outcome:'incorrect'}];beforeReplacement.onAdd();h.flush();assert.deepEqual(set().props.entries,[],'retired attempt refuses before rerender');
    action().onAdd();h.flush();assert.deepEqual(set().props.entries,[correct]);
    set().props.onClear();h.flush();const beforeQuiz=action();h.practice.startTargets([a]);h.flush();beforeQuiz.onAdd();h.flush();
    h.practice.finish();h.flush();assert.deepEqual(set().props.entries,[]);
    h.practice.results=[{entry:a,outcome:'incorrect'}];h.flush();const beforeImport=action();
    const opening=h.choosePackage('replacement');beforeImport.onAdd();await opening;await h.settle();await h.settle();assert.deepEqual(set().props.entries,[]);
    h.practice.results=[{entry:a,outcome:'incorrect'}];h.practice.finish();h.flush();h.act('Results');const beforeClose=action();
    h.act('Close atlas');beforeClose.onAdd();h.flush();assert.equal(h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasStudySet'),undefined);
  }finally{h.dispose();}
});

test('missed-result handoff preserves existing order and reports the 50-entry limit',async()=>{
  const stored=Array.from({length:49},(_,i)=>({...pons,id:`stored.${i}`,label:`Stored ${i}`,mask:{sha256:`stored-${i}`}}));
  const a={...pons,id:'miss.cap.a',mask:{sha256:'cap-a'}},b={...midbrain,id:'miss.cap.b',mask:{sha256:'cap-b'}};
  const h=harness('/atlas/ct-head',{entries:[...stored,a,b]});
  const set=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasStudySet')!;
  const action=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasPractice')!.props.reviewContext.missedStudySet;
  try{
    h.flush();await h.choosePackage('synthetic-cap');await h.settle();await h.settle();
    h.walk(h.find('label','Find a structure'),n=>n.type==='input')!.props.onChange({target:{value:'Stored'}});h.flush();
    set().props.filteredAdd.onAdd();h.flush();assert.deepEqual(set().props.entries,stored);
    h.act('Practice');h.practice.results=[{entry:a,outcome:'incorrect'},{entry:b,outcome:'unanswered'}];h.practice.finish();h.flush();
    assert.equal(action().count,1);assert.equal(action().total,2);action().onAdd();h.flush();
    assert.deepEqual(set().props.entries,[...stored,a]);assert.equal(action().count,0);assert.equal(action().total,1);
    const beforeClear=action();set().props.onClear();h.flush();beforeClear.onAdd();h.flush();assert.deepEqual(set().props.entries,[]);
  }finally{h.dispose();}
});

for(const modality of ['CT','MRI'] as const)test(`${modality} custom study set survives practice but clears on package change and close`,async()=>{
  const a={...pons,id:'local.set.a',label:'Set A',mask:{sha256:'set-a'}},b={...midbrain,id:'local.set.b',label:'Set B',mask:{sha256:'set-b'}};
  const h=harness(`/atlas/${modality.toLowerCase()}-head`,{modality,entries:[a,b]});
  const set=()=>h.walk(h.tree,n=>typeof n.type==='function'&&n.type.name==='HeadAtlasStudySet');
  try{
    h.flush();assert.equal(set(),undefined);
    await h.choosePackage('synthetic-shortlist');await h.settle();await h.settle();
    assert.deepEqual(set()?.props.entries,[]);
    for(const entry of [a,b]){h.act(entry.label);await h.settle();await h.settle();h.act('Add to study set');}
    assert.deepEqual(set()?.props.entries,[a,b]);
    const stale=set()!.props;
    stale.onPractice('recall');h.flush();
    assert.equal(h.practice.mode,'recall');assert.equal(h.practice.targets.length,2);
    assert(h.practice.targets.every(target=>target===a||target===b));
    assert.equal(set(),undefined);assert.equal(h.find('button','Add to study set'),undefined);
    stale.onRemove(a);stale.onClear();stale.onPractice('label');h.flush();
    assert.equal(h.practice.mode,'recall','stale controls cannot alter active practice');
    h.practice.finish();h.flush();assert.deepEqual(set()?.props.entries,[a,b]);
    await h.choosePackage('synthetic-shortlist-new');await h.settle();await h.settle();
    assert.deepEqual(set()?.props.entries,[],'package change clears even matching fixture entries');
    stale.onPractice('locate');h.flush();assert.equal(h.practice.active,false,'retired study handler cannot start');
    h.act('Set A');await h.settle();await h.settle();h.act('Add to study set');
    assert.deepEqual(set()?.props.entries,[a]);
    const beforeClear=set()!.props;beforeClear.onClear();h.flush();
    assert.deepEqual(set()?.props.entries,[]);
    beforeClear.onPractice('locate');beforeClear.onSelect(a);beforeClear.onRemove(a);h.flush();
    assert.equal(h.practice.active,false,'cleared set cannot be resurrected by old controls');
    assert.deepEqual(set()?.props.entries,[]);
    h.act('Close atlas');assert.equal(set(),undefined);
  }finally{h.dispose();}
});
