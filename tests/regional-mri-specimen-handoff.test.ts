import assert from 'node:assert/strict';
import test from 'node:test';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {regionalMriInlineInspection,regionalMriInlineContextCurrent} from '../lib/regional-mri-inline-inspection.ts';
import {createRegionalMriSpecimenFocus,isCurrentRegionalMriSpecimenSelection} from '../lib/regional-mri-specimen-focus.ts';
import {regionalMriSpecimenHandoff} from '../lib/regional-mri-specimen-handoff.ts';
import {kneeReferenceSpecs,kneeReferencePin} from '../lib/regional-knee-3d-mappings.ts';
import type {Regional3dCatalogue,Regional3dTarget} from '../lib/regional-mri-3d-comparison.ts';

const hash=async(bytes:ArrayBuffer)=>Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
const asset=(bytes:ArrayBuffer):RegionalAsset=>({size:bytes.byteLength,arrayBuffer:async()=>bytes.slice(0)});
const atlas='a'.repeat(40),mapping='b'.repeat(64),encoder=new TextEncoder();
const concept=(slug:string)=>'anat.knee.'+({acl:'lig.anterior_cruciate_ligament',pcl:'lig.posterior_cruciate_ligament',mcl:'lig.medial_collateral_ligament','meniscus-group':'men.medial_meniscus'} as Record<string,string>)[slug];
function target(slug:string):Regional3dTarget{
 const spec=kneeReferenceSpecs.find(spec=>spec.anatomyId===concept(slug)&&spec.kind==='specimen')!,pin=kneeReferencePin(spec,'left');
 const id='vm:reference:um-5t6tz7-v1-2:knee:'+slug;
 return {id,label:pin.label,kind:'specimen',side:'right',region:'knee',sourceHash:pin.sourceHash,specimenRevision:pin.specimenRevision,relation:spec.relation,
  href:'/atlas/lower-limb-3d?'+new URLSearchParams({specimen:'um-limb-1',specimenScope:'knee',specimenPart:id,specimenSource:pin.sourceHash,specimenRevision:pin.specimenRevision!,specimenView:'anterior',atlasRevision:atlas})};
}
async function fixture(options:{candidateStatus?:'accepted-scoped'|'provisional'|'deferred';candidateSide?:'left'|'right';duplicate?:boolean;otherSequenceOnly?:boolean;currentProvisional?:boolean}={}){
 const image=new Uint8Array([1,2,3,4]).buffer as ArrayBuffer,mask=new Uint8Array([1,0,0,0]).buffer as ArrayBuffer;
 const imageSha=await hash(image),maskSha=await hash(mask),grid={shape_kji:[1,2,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const annotation=(slug:string)=>({id:'synthetic-'+slug,anatomyId:concept(slug),label:'Synthetic '+slug.toUpperCase(),seriesId:'native',sourceImageSha256:imageSha,
  laterality:'left' as const,coverage:'partial' as const,review:{status:'accepted-scoped' as 'accepted-scoped'|'provisional'|'deferred',revision:'c'.repeat(64),scope:'Synthetic partial native sequence only'},
  geometry:{kind:'points' as const,points_ras_mm:[[1,1,0]]}});
 const acl={...annotation('acl'),review:{...annotation('acl').review,status:options.currentProvisional?'provisional' as const:'accepted-scoped' as const},
  geometry:{kind:'mask' as const,file:'native/acl.raw',sha256:maskSha,shape_kji:[1,2,2],offset_kji:[0,0,0],grid,gridKind:'source-native' as const,mappingRevision:'d'.repeat(64)}};
 const pcl={...annotation('pcl'),laterality:options.candidateSide??'left',review:{...annotation('pcl').review,status:options.candidateStatus??'accepted-scoped'},
  geometry:options.candidateStatus==='deferred'?{kind:'none' as const}:annotation('pcl').geometry};
 const entries=[acl,...options.otherSequenceOnly?[]:[pcl],annotation('mcl'),annotation('meniscus-group')];
 if(options.duplicate)entries.push({...pcl,id:'synthetic-duplicate-pcl'});
 const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'bilateral',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
  {id:'native',label:'Synthetic native sequence',image:{...grid,file:'native/image.raw',sha256:imageSha,dtype:'uint8'},annotations:entries},
  {id:'other',label:'Synthetic other sequence',image:{...grid,file:'other/image.raw',sha256:imageSha,dtype:'uint8'},annotations:[{...pcl,seriesId:'other'}]},
 ]};
 const bytes=encoder.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=await hash(bytes);
 const pkg=await openRegionalMriPackage(bytes,new Map([['manifest.json',asset(bytes)],['native/image.raw',asset(image)],['native/acl.raw',asset(mask)],['other/image.raw',asset(image)]]),revision);
 const study=await loadRegionalMriSeries(pkg,'native'),overlay=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[0],undefined,options.currentProvisional?{inspectProvisional:true}:undefined);
 const catalogue:Regional3dCatalogue={schema:'visible-medicine.regional-mri-3d/1',mriRevision:revision,atlasRevision:atlas,mappingRevision:mapping,
  entries:['acl','pcl','mcl','meniscus-group'].map(slug=>({anatomyId:concept(slug),sourceSide:'left',targets:[target(slug)]}))};
 const source={revision,region:'knee'},inspection=regionalMriInlineInspection(source,catalogue,pkg,study,overlay,target('acl').id)!;assert(inspection);
 const sent:Record<string,any>[]=[],channel=createRegionalMriSpecimenFocus(message=>sent.push(message),()=>{},()=> 'synthetic-session-123456789');
 channel.begin(inspection,true);const session=sent[0].session;
 const report=(sequence:number,slug:string)=>channel.receive({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',
  target:{scope:'knee',id:target(slug).id,source:target(slug).sourceHash,revision:target(slug).specimenRevision,laterality:'right-source-report'}});
 report(1,'acl');channel.receive({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});report(2,'acl');
 const resolve=(selection=channel.selection)=>selection?regionalMriSpecimenHandoff(source,catalogue,pkg,study,overlay,inspection,selection):null;
 return {source,pkg,study,overlay,catalogue,inspection,channel,report,resolve,sent,session};
}

test('actual loader/channel ownership offers one explicit same-named PCL annotation in the current native sequence',async()=>{
 const f=await fixture();assert.equal(f.resolve(),null,'already selected ACL offers no redundant action');
 f.report(3,'pcl');const selection=f.channel.selection!;assert(isCurrentRegionalMriSpecimenSelection(selection));assert.equal(f.channel.state,'failed','requested-focus confirmation is separate from live browsing');
 const handoff=f.resolve()!;assert(handoff);assert.strictEqual(handoff.annotation,f.study.series.annotations[1]);assert.equal(handoff.label,'Synthetic PCL');
 assert.equal(handoff.targetId,target('pcl').id);assert.equal(f.inspection.target.oppositeSide,true);assert.equal(handoff.annotation.coverage,'partial');
 assert.equal(handoff.annotation.laterality,'left');assert.equal(selection.target.laterality,'right-source-report');
 for(const message of f.sent){const text=JSON.stringify(message);assert(!text.includes(f.source.revision));assert(!text.includes(f.study.series.image.sha256));assert.doesNotMatch(text,/Synthetic|annotationId|points_ras_mm|ijk_to_ras/);}
 f.channel.close();assert.equal(f.resolve(selection),null);
});

test('copied, old and retired reports do not authorize a handoff',async()=>{
 const f=await fixture();f.report(3,'pcl');const old=f.channel.selection!;
 assert.equal(f.resolve({...old}),null);assert.equal(f.resolve(structuredClone(old)),null);
 f.report(4,'mcl');assert.equal(f.resolve(old),null);assert.equal(f.resolve()!.annotation.anatomyId,concept('mcl'));
 const current=f.channel.selection!;f.channel.retire();assert.equal(f.resolve(current),null);f.channel.close();
});

test('borrowed package, study, overlay, inspection and catalogue contexts fail closed',async()=>{
 const a=await fixture(),b=await fixture();a.report(3,'pcl');const selection=a.channel.selection!;
 const resolve=(...args:any[])=>{const[pkg=a.pkg,study=a.study,overlay=a.overlay,inspection=a.inspection,catalogue=a.catalogue]=args;
  return regionalMriSpecimenHandoff(a.source,catalogue,pkg,study,overlay,inspection,selection);
 };
 for(const args of [[b.pkg,a.study],[a.pkg,b.study],[a.pkg,a.study,b.overlay],[a.pkg,a.study,a.overlay,b.inspection],
  [a.pkg,a.study,a.overlay,{...a.inspection}],[a.pkg,a.study,a.overlay,a.inspection,structuredClone(a.catalogue)]])assert.equal(resolve(...args),null);
 assert.equal(regionalMriInlineContextCurrent(a.inspection,a.source,a.catalogue,a.pkg,a.study,a.overlay),true);
 a.channel.close();b.channel.close();
});

test('provisional/deferred/duplicate/opposite MRI candidates and other-sequence-only anatomy are not substituted',async()=>{
 for(const options of [{candidateStatus:'provisional' as const},{candidateStatus:'deferred' as const},{duplicate:true},{candidateSide:'right' as const},{otherSequenceOnly:true},{currentProvisional:true}]){
  const f=await fixture(options);f.report(3,'pcl');assert.equal(f.resolve(),null,JSON.stringify(options));f.channel.close();
 }
});

test('grouped model surfaces have no invented one-to-one MRI target',async()=>{
 const f=await fixture();f.report(3,'meniscus-group');assert(f.channel.selection);assert.equal(f.resolve(),null);f.channel.close();
});

test('mutated mapping revisions, source pins, links and duplicate rows revoke the original context',async()=>{
 for(const mutate of [
  (f:any)=>{f.catalogue.mappingRevision='0'.repeat(64)},(f:any)=>{f.catalogue.atlasRevision='0'.repeat(40)},
  (f:any)=>{f.catalogue.mriRevision='0'.repeat(64)},(f:any)=>{f.catalogue.entries.push(structuredClone(f.catalogue.entries[1]))},
  (f:any)=>{f.catalogue.entries[1].targets[0].sourceHash='0'.repeat(64)},
  (f:any)=>{f.catalogue.entries[1].targets[0].href+='&patient=forbidden'},
  (f:any)=>{f.catalogue.entries[1].targets[0].relation='parent-reference'},
 ]){const f=await fixture();f.report(3,'pcl');mutate(f);assert.equal(f.resolve(),null);f.channel.close();}
});

test('blocked, empty, foreign-source and out-of-scope reports remove current authority',async()=>{
 for(const replacement of [
  {status:'empty'}, {status:'blocked',reason:'practice'},
  {status:'selected',target:{scope:'knee',id:target('pcl').id,source:'0'.repeat(64),revision:target('pcl').specimenRevision,laterality:'right-source-report'}},
  {status:'selected',target:{scope:'foot',id:'vm:reference:um-5t6tz7-v1-2:lower-limb:source-group',source:target('pcl').sourceHash,revision:target('pcl').specimenRevision,laterality:'source-group'}},
 ]){
  const f=await fixture();f.report(3,'pcl');const old=f.channel.selection!;
  f.channel.receive({type:'vm-specimen-selection',version:1,revision:atlas,session:f.session,sequence:4,...replacement});
  assert.equal(f.channel.selection,null);assert.equal(f.resolve(old),null);f.channel.close();
 }
});
