import assert from 'node:assert/strict';
import test from 'node:test';
import {createRegionalMriBodyFocus,isCurrentRegionalMriBodySelection,publicBodyTarget} from '../lib/regional-mri-body-focus.ts';
import {regionalMriInlineInspection,type RegionalMriInlineInspection} from '../lib/regional-mri-inline-inspection.ts';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {kneeReferencePin,kneeBodyReferenceId,kneeReferenceSpecs} from '../lib/regional-knee-3d-mappings.ts';
import type {Regional3dCatalogue} from '../lib/regional-mri-3d-comparison.ts';

const atlasRevision='a'.repeat(40),mappingRevision='b'.repeat(64),session='session_123456789012345678901234';
const enc=new TextEncoder(),sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const asset=(bytes:ArrayBuffer):RegionalAsset=>({size:bytes.byteLength,async arrayBuffer(){return bytes.slice(0)}});
async function fixture(scope:'leg'|'thigh',side:'left'|'right'='left'){
 const spec=kneeReferenceSpecs.find(s=>s.kind==='body'&&s.region===scope&&s.idRegion===scope)!;
 const pin=kneeReferencePin(spec,side),id=kneeBodyReferenceId(spec,side)!;
 const image=enc.encode('AB').buffer as ArrayBuffer,mask=new Uint8Array([1,0]).buffer as ArrayBuffer;
 const imageHash=await sha(image),maskHash=await sha(mask);
 const grid={shape_kji:[1,1,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'bilateral',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{
  id:'axial',label:'Synthetic MRI',image:{...grid,file:'axial/image.raw',sha256:imageHash,dtype:'uint8'},annotations:[{
   id:'structure',anatomyId:spec.anatomyId,label:'Synthetic structure',seriesId:'axial',sourceImageSha256:imageHash,laterality:side,coverage:'partial',
   review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Synthetic only'},geometry:{kind:'mask',file:'axial/mask.raw',sha256:maskHash,shape_kji:[1,1,2],offset_kji:[0,0,0],grid,gridKind:'source-native',mappingRevision:'d'.repeat(64)}
  }]}]};
 const bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=await sha(bytes);
 const pkg=await openRegionalMriPackage(bytes,new Map([['manifest.json',asset(bytes)],['axial/image.raw',asset(image)],['axial/mask.raw',asset(mask)]]),revision);
 const study=await loadRegionalMriSeries(pkg,'axial'),overlay=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[0]);
 const target={kind:'body' as const,id,label:pin.label,side,region:scope,sourceHash:pin.sourceHash,runtimeRevision:atlasRevision,specimenRevision:null,relation:spec.relation,
  href:'/atlas/3d?'+new URLSearchParams({region:scope,study:'1',structure:id,side,source:pin.sourceHash,atlasRevision})};
 const catalogue:Regional3dCatalogue={schema:'visible-medicine.regional-mri-3d/1',mriRevision:revision,atlasRevision,mappingRevision,
  entries:[{anatomyId:spec.anatomyId,sourceSide:side,targets:[target]}]};
 const inspection=regionalMriInlineInspection({revision,region:'knee'},catalogue,pkg,study,overlay,id)!;
 assert(inspection);return {inspection,target:publicBodyTarget(inspection)!,scope};
}
const host=(inspection:RegionalMriInlineInspection)=>{
 const sent:any[]=[],states:string[]=[],selections:unknown[]=[];
 const controller=createRegionalMriBodyFocus(m=>sent.push(m),s=>states.push(s),()=>session,s=>selections.push(s));
 controller.begin(inspection,true);
 const revision=inspection.atlasRevision,region=new URL(inspection.target.href,'https://visible-medicine.invalid').searchParams.get('region');
 const selection=(sequence:number,status:'selected'|'empty'|'blocked',value?:unknown)=>({type:'vm-body-semantic-selection',version:1,revision,region,session,sequence,status,
  ...(status==='selected'?{selection:value}:status==='blocked'?{reason:value}:{})});
 const result=(status:'accepted'|'refused',command=1)=>({type:'vm-body-semantic-focus-result',version:1,revision,region,session,command,status});
 return {controller,sent,states,selections,selection,result,revision,region};
};

test('real owned leg and thigh loader proofs bind exact root focus and post-ACK selection',async()=>{
 for(const scope of ['leg','thigh'] as const){
  const f=await fixture(scope),h=host(f.inspection),t=f.target;
  const currentSelection=()=>h.controller.selection;
  assert.deepEqual(t,{kind:'root',id:f.inspection.target.id,source:f.inspection.target.sourceHash,laterality:'left'});
  assert.equal(h.controller.state,'requesting');
  assert.deepEqual(h.sent[0],{type:'vm-body-semantic-selection-request',version:1,revision:h.revision,region:scope,session});
  assert.equal(h.controller.receive(h.selection(1,'selected',t)),'available');
  assert.deepEqual(h.sent[1],{type:'vm-body-semantic-focus',version:1,revision:h.revision,region:scope,session,command:1,target:t});
  assert.equal(h.controller.selection,null);
  h.controller.receive(h.result('accepted'));
  assert.equal(h.controller.state,'focusing');
  h.controller.receive(h.selection(2,'selected',{...t,id:t.id.replace(/:[^:]+$/,':different')}));
  assert.equal(h.controller.state,'focusing','old selection after ACK is transient');
  assert.equal(h.controller.selection,null);
  h.controller.receive(h.selection(3,'selected',t));
  const proof=h.controller.selection!;
  assert.equal(h.controller.state,'confirmed');assert(isCurrentRegionalMriBodySelection(proof));assert(Object.isFrozen(proof));assert(Object.isFrozen(proof.target));
  assert.equal(proof.region,scope);assert.equal(proof.sequence,3);
  assert.equal(isCurrentRegionalMriBodySelection({...proof}),false);
  h.controller.receive(h.selection(4,'selected',{...t,source:'d'.repeat(64)}));
  assert.equal(h.controller.state,'failed');assert.equal(isCurrentRegionalMriBodySelection(proof),false);
  assert.equal(currentSelection()?.target.source,'d'.repeat(64));
  h.controller.receive(h.selection(5,'selected',t));
  assert.equal(h.controller.state,'failed','fresh return names the requested root without a new camera ACK');
  const returned=currentSelection();assert(returned);assert.equal(returned.target.id,t.id);assert(isCurrentRegionalMriBodySelection(returned));
  h.controller.receive(h.selection(6,'selected',{...t,laterality:'right',id:t.id.replace(':left:',':right:')}));
  assert.equal(h.controller.selection,null);assert(!isCurrentRegionalMriBodySelection(returned));
  h.controller.close();assert.equal(h.controller.selection,null);
 }
});

test('copied, noncanonical, specimen and cross-region inspections cannot start',async()=>{
 const f=await fixture('leg'),i=f.inspection;
 for(const borrowed of [{...i},{...i,target:{...i.target}},
  {...i,target:{...i.target,kind:'specimen'}},
  {...i,target:{...i.target,href:i.target.href+'&private=1'}},
  {...i,target:{...i.target,href:i.target.href.replace('region=leg','region=thigh')}}] as RegionalMriInlineInspection[]){
  assert.equal(publicBodyTarget(borrowed),null);
  const sent:object[]=[],c=createRegionalMriBodyFocus(m=>sent.push(m),()=>{},()=>session);
  c.begin(borrowed,true);assert.equal(c.state,'failed');assert.deepEqual(sent,[]);
 }
 assert.equal(publicBodyTarget(i)?.id,f.target.id);
});

test('strict envelopes, sequence, session, source, laterality and lifecycle revoke reports',async()=>{
 const f=await fixture('leg'),h=host(f.inspection),t=f.target,c=h.controller;
 const first=h.selection(1,'selected',t);
 for(const bad of [{...first,region:'thigh'},{...first,revision:'0'.repeat(40)},{...first,session:'foreign_123456789012345678901'},
  {...first,private:'secret'},{...first,selection:{...t,private:'secret'}},{...first,selection:{...t,source:'BAD'}},
  {...first,selection:{...t,laterality:'right'}},{...first,selection:{...t,id:'vm:anatomy:head:left:bone:test'}},
  {...first,selection:{...t,kind:'nested'}},{...first,selection:{...t,kind:'specimen'}}]){
  assert.equal(c.receive(bad),undefined);assert.equal(c.state,'requesting');
 }
 c.receive(first);assert.equal(c.state,'focusing');
 c.receive(h.result('accepted',2));c.receive({...h.result('accepted'),private:true});assert.equal(c.state,'focusing');
 c.receive(h.selection(2,'selected',t));assert.equal(c.selection,null,'snapshot before ACK is insufficient');
 c.receive(h.result('accepted'));c.receive(h.result('refused'));
 c.receive(h.selection(2,'selected',t));assert.equal(c.selection,null,'replay refused');
 c.receive(h.selection(3,'selected',t));const proof=c.selection!;assert(isCurrentRegionalMriBodySelection(proof));
 assert.equal(c.receive(h.selection(4,'blocked','practice')),'available');assert.equal(c.state,'blocked');assert(!isCurrentRegionalMriBodySelection(proof));
 c.retry();assert.equal(c.state,'requesting');assert.equal(c.receive(h.selection(1,'empty')),'available');assert.equal(c.state,'focusing');
 c.receive(h.result('refused'));assert.equal(c.state,'failed');
 c.retry();c.receive(h.selection(1,'blocked','unavailable'));assert.equal(c.state,'blocked');
 c.retry();c.receive(h.selection(1,'selected',t));c.fail();assert.equal(c.state,'failed');assert.equal(c.selection,null);
 c.retry();c.retire();assert.equal(c.state,'waiting');assert.equal(c.selection,null);
 c.begin(f.inspection,true);c.receive({type:'vm-body-semantic-selection-ready',version:1,revision:h.revision,region:'leg'});
 assert.equal(c.state,'requesting');c.close();assert.equal(c.state,'waiting');
});
