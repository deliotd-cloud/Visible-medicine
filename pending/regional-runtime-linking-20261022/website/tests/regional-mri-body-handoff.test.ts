import assert from 'node:assert/strict';
import test from 'node:test';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {regionalMriInlineInspection,regionalMriInlineContextCurrent} from '../lib/regional-mri-inline-inspection.ts';
import {createRegionalMriBodyFocus,isCurrentRegionalMriBodySelection} from '../lib/regional-mri-body-focus.ts';
import {regionalMriBodyHandoff} from '../lib/regional-mri-body-handoff.ts';
import {kneeReferenceSpecs,kneeReferencePin,kneeBodyReferenceId,type KneeReferenceSpec} from '../lib/regional-knee-3d-mappings.ts';
import type {Regional3dCatalogue,Regional3dTarget} from '../lib/regional-mri-3d-comparison.ts';

const sha=async(bytes:ArrayBuffer)=>Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
const asset=(bytes:ArrayBuffer):RegionalAsset=>({size:bytes.byteLength,arrayBuffer:async()=>bytes.slice(0)});
const atlas='a'.repeat(40),mapping='b'.repeat(64),encoder=new TextEncoder();
const specs=(region:'leg'|'thigh')=>region==='leg'?
 kneeReferenceSpecs.filter(s=>s.kind==='body'&&['popliteus','popliteal-artery','popliteal-vein'].includes(s.slug)):
 kneeReferenceSpecs.filter(s=>s.kind==='body'&&['vastus-medialis','vastus-lateralis'].includes(s.slug));
function target(spec:KneeReferenceSpec,side:'left'|'right'='left'):Regional3dTarget{
 const pin=kneeReferencePin(spec,side),id=kneeBodyReferenceId(spec,side)!;
 return {id,label:pin.label,kind:'body',side,region:spec.region,sourceHash:pin.sourceHash,runtimeRevision:atlas,specimenRevision:null,relation:spec.relation,
  href:'/atlas/3d?'+new URLSearchParams({region:spec.region,study:'1',structure:id,side,source:pin.sourceHash,atlasRevision:atlas})};
}
async function fixture(region:'leg'|'thigh'='leg',options:{candidateStatus?:'accepted-scoped'|'provisional'|'deferred';
 candidateSide?:'left'|'right';duplicate?:boolean;otherSequenceOnly?:boolean;currentProvisional?:boolean}={}){
 const chosen=specs(region),image=new Uint8Array([1,2,3,4]).buffer as ArrayBuffer,mask=new Uint8Array([1,0,0,0]).buffer as ArrayBuffer;
 const imageSha=await sha(image),maskSha=await sha(mask),grid={shape_kji:[1,2,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const annotation=(spec:KneeReferenceSpec,index:number)=>({id:'synthetic-'+index,anatomyId:spec.anatomyId,label:'Synthetic '+spec.slug,
  seriesId:'native',sourceImageSha256:imageSha,laterality:'left' as 'left'|'right',coverage:'partial' as const,
  review:{status:'accepted-scoped' as 'accepted-scoped'|'provisional'|'deferred',revision:'c'.repeat(64),scope:'Synthetic native sequence only'},
  geometry:{kind:'points' as const,points_ras_mm:[[1,1,0]]}});
 const first={...annotation(chosen[0],0),review:{...annotation(chosen[0],0).review,status:options.currentProvisional?'provisional' as const:'accepted-scoped' as const},
  geometry:{kind:'mask' as const,file:'native/first.raw',sha256:maskSha,shape_kji:[1,2,2],offset_kji:[0,0,0],grid,
   gridKind:'source-native' as const,mappingRevision:'d'.repeat(64)}};
 const second={...annotation(chosen[1],1),laterality:options.candidateSide??'left',
  review:{...annotation(chosen[1],1).review,status:options.candidateStatus??'accepted-scoped'},
  geometry:options.candidateStatus==='deferred'?{kind:'none' as const}:annotation(chosen[1],1).geometry};
 const entries=[first,...options.otherSequenceOnly?[]:[second],...chosen.slice(2).map((s,i)=>annotation(s,i+2))];
 if(options.duplicate)entries.push({...second,id:'synthetic-held-duplicate',review:{...second.review,status:'provisional'}});
 const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'bilateral',
  coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
   {id:'native',label:'Synthetic native sequence',image:{...grid,file:'native/image.raw',sha256:imageSha,dtype:'uint8'},annotations:entries},
   {id:'other',label:'Synthetic other sequence',image:{...grid,file:'other/image.raw',sha256:imageSha,dtype:'uint8'},annotations:[{...second,seriesId:'other'}]},
  ]};
 const bytes=encoder.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=await sha(bytes);
 const pkg=await openRegionalMriPackage(bytes,new Map([['manifest.json',asset(bytes)],['native/image.raw',asset(image)],
  ['native/first.raw',asset(mask)],['other/image.raw',asset(image)]]),revision);
 const study=await loadRegionalMriSeries(pkg,'native'),overlay=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[0],undefined,
  options.currentProvisional?{inspectProvisional:true}:undefined);
 const catalogue:Regional3dCatalogue={schema:'visible-medicine.regional-mri-3d/1',mriRevision:revision,atlasRevision:atlas,mappingRevision:mapping,
  entries:chosen.map(spec=>({anatomyId:spec.anatomyId,sourceSide:'left',targets:[target(spec)]}))};
 const source={revision,region:'knee'},inspection=regionalMriInlineInspection(source,catalogue,pkg,study,overlay,target(chosen[0]).id)!;
 assert(inspection);
 const sent:Record<string,any>[]=[],changed:string[]=[],selections:unknown[]=[];
 const channel=createRegionalMriBodyFocus(message=>sent.push(message),state=>changed.push(state),()=> 'synthetic-session-123456789',value=>selections.push(value));
 channel.begin(inspection,true);const session=sent[0].session;
 const report=(sequence:number,index:number)=>channel.receive({type:'vm-body-semantic-selection',version:1,revision:atlas,region,session,sequence,status:'selected',selection:{
  kind:'root',id:target(chosen[index]).id,source:target(chosen[index]).sourceHash,laterality:'left'}});
 report(1,0);channel.receive({type:'vm-body-semantic-focus-result',version:1,revision:atlas,region,session,command:1,status:'accepted'});report(2,0);
 const resolve=(selection=channel.selection)=>selection?regionalMriBodyHandoff(source,catalogue,pkg,study,overlay,inspection,selection):null;
 return {source,pkg,study,overlay,catalogue,inspection,channel,report,resolve,sent,session,chosen,region,changed,selections};
}

test('actual package and owned root report hand off to unique current-sequence anatomy with its own bundle pin',async()=>{
 for(const region of ['leg','thigh'] as const){
  const f=await fixture(region);assert.equal(f.resolve(),null,'current overlay is not an action');
  f.report(3,1);const selected=f.channel.selection!;assert(isCurrentRegionalMriBodySelection(selected));
  if(region==='leg')assert.notEqual(target(f.chosen[0]).sourceHash,target(f.chosen[1]).sourceHash,
   'popliteus and vessel use separate authored bundles');
  const handoff=f.resolve()!;assert(handoff);assert.strictEqual(handoff.annotation,f.study.series.annotations[1]);
  assert.equal(handoff.targetId,target(f.chosen[1]).id);assert.equal(handoff.label,'Synthetic '+f.chosen[1].slug);
  assert.equal(handoff.annotation.laterality,'left');assert.equal(selected.region,region);
  for(const message of f.sent){const payload=JSON.stringify(message);assert(!payload.includes(f.source.revision));assert(!payload.includes(f.study.series.image.sha256));
   assert.doesNotMatch(payload,/Synthetic|annotationId|points_ras_mm|ijk_to_ras/);}
  f.channel.close();assert.equal(f.resolve(selected),null);
 }
});

test('actual leg loader offers artery and vein separately in the same native sequence',async()=>{
 const f=await fixture();for(const [sequence,index] of [[3,1],[4,2]]){f.report(sequence,index);assert.strictEqual(f.resolve()!.annotation,f.study.series.annotations[index]);}
 f.channel.close();
});

test('copied, stale, retired, failed and closed reports have no authority',async()=>{
 const f=await fixture();f.report(3,1);const old=f.channel.selection!;
 assert.equal(f.resolve({...old}),null);assert.equal(f.resolve(structuredClone(old)),null);
 f.report(4,2);assert.equal(f.resolve(old),null);assert(f.resolve());
 const current=f.channel.selection!;f.channel.retire();assert.equal(f.resolve(current),null);
 f.channel.retry();f.channel.fail();assert.equal(f.resolve(),null);f.channel.close();
});

test('borrowed loader, inspection, catalogue and original source context fail closed',async()=>{
 const a=await fixture(),b=await fixture();a.report(3,1);const selection=a.channel.selection!;
 const resolve=(pkg=a.pkg,study=a.study,overlay=a.overlay,inspection=a.inspection,catalogue=a.catalogue,source=a.source)=>
  regionalMriBodyHandoff(source,catalogue,pkg,study,overlay,inspection,selection);
 assert(regionalMriInlineContextCurrent(a.inspection,a.source,a.catalogue,a.pkg,a.study,a.overlay));
 assert.equal(resolve(b.pkg),null);assert.equal(resolve(a.pkg,b.study),null);assert.equal(resolve(a.pkg,a.study,b.overlay),null);
 assert.equal(resolve(a.pkg,a.study,a.overlay,b.inspection),null);assert.equal(resolve(a.pkg,a.study,a.overlay,{...a.inspection}),null);
 assert.equal(resolve(a.pkg,a.study,a.overlay,a.inspection,structuredClone(a.catalogue)),null);
 assert.equal(resolve(a.pkg,a.study,a.overlay,a.inspection,a.catalogue,{...a.source,region:'leg'}),null);
 a.channel.close();b.channel.close();
});

test('held duplicate, provisional, deferred, opposite-side and other-sequence candidates are refused',async()=>{
 for(const options of [{candidateStatus:'provisional' as const},{candidateStatus:'deferred' as const},{duplicate:true},
  {candidateSide:'right' as const},{otherSequenceOnly:true},{currentProvisional:true}]){
  const f=await fixture('leg',options);f.report(3,1);assert.equal(f.resolve(),null,JSON.stringify(options));f.channel.close();
 }
});

test('mutated pins, href, relation, row duplication and catalogue revisions revoke context',async()=>{
 const changes=[
  (f:any)=>{f.catalogue.mappingRevision='0'.repeat(64)},(f:any)=>{f.catalogue.atlasRevision='0'.repeat(40)},
  (f:any)=>{f.catalogue.mriRevision='0'.repeat(64)},(f:any)=>{f.catalogue.entries.push(structuredClone(f.catalogue.entries[1]))},
  (f:any)=>{f.catalogue.entries[1].targets[0].sourceHash='0'.repeat(64)},
  (f:any)=>{f.catalogue.entries[1].targets[0].href+='&patient=forbidden'},
  (f:any)=>{f.catalogue.entries[1].targets[0].relation='parent-reference'},
 ];
 for(const change of changes){const f=await fixture();f.report(3,1);change(f);assert.equal(f.resolve(),null);f.channel.close();}
});

test('blocked, empty, foreign source, opposite side and wrong region reports revoke current authority',async()=>{
 const f=await fixture();f.report(3,1);const old=f.channel.selection!;
 let sequence=4;
 for(const replacement of [{status:'empty'}, {status:'blocked',reason:'practice'},
  {status:'selected',selection:{kind:'root',id:target(f.chosen[1]).id,source:'0'.repeat(64),laterality:'left'}},
  {status:'selected',selection:{kind:'root',id:target(f.chosen[1],'right').id,source:target(f.chosen[1],'right').sourceHash,laterality:'right'}}]){
  f.channel.receive({type:'vm-body-semantic-selection',version:1,revision:atlas,region:'leg',session:f.session,sequence:sequence++,...replacement});
  assert.equal(f.resolve(old),null);assert.equal(f.resolve(),null);
 }
 f.channel.receive({type:'vm-body-semantic-selection',version:1,revision:atlas,region:'thigh',session:f.session,sequence:99,status:'selected',selection:{
  kind:'root',id:target(f.chosen[1]).id,source:target(f.chosen[1]).sourceHash,laterality:'left'}});
 assert.equal(f.resolve(),null);f.channel.close();
});
