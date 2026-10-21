import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import currentBodyManifest from '../public/atlas-runtime/head-neck/manifest.json' with {type:'json'};
import currentSpecimenManifest from '../public/atlas-runtime/lower-limb/manifest.json' with {type:'json'};
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {regionalMriInlineInspection,regionalMriInlineManifestCurrent,isRegionalMriInlineInspection,regionalMriInlineFamilyKey,regionalMriInlineCompatible} from '../lib/regional-mri-inline-inspection.ts';
import {createRegionalMriSpecimenFocus,publicSpecimenTarget} from '../lib/regional-mri-specimen-focus.ts';
import {kneeReferencePin,kneeBodyReferenceId,kneeReferenceSpecs} from '../lib/regional-knee-3d-mappings.ts';
import type {Regional3dCatalogue,Regional3dTarget} from '../lib/regional-mri-3d-comparison.ts';
import {regionalMriGuides,regionalMriGuideAnnotation} from '../lib/regional-mri-guided-study.ts';

const enc=new TextEncoder(),sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const asset=(bytes:ArrayBuffer):RegionalAsset=>({size:bytes.byteLength,async arrayBuffer(){return bytes.slice(0)}});
const atlasRevision='408759d57644b05402e98a937e7cf6338b5509cf',mappingRevision='b'.repeat(64);
const archivedRoot='F:/VisibleMedicine/staging/20261016-cervical-xray/website-before/source';
function archivedManifest(path:string,expectedHash:string){
 const bytes=readFileSync(`${archivedRoot}/${path}`);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),expectedHash,'Old 408 manifest bytes changed: '+path);
 const manifest=JSON.parse(bytes.toString());
 assert.equal(manifest.sourceCommit,atlasRevision,'Old 408 manifest source changed: '+path);
 return manifest;
}
const bodyManifest=archivedManifest('public/atlas-runtime/head-neck/manifest.json','ccfb9c0fe08dc8f991fa145ce95046d381ba36d1b987c8d382b9ff939a321c10');
const specimenManifest=archivedManifest('public/atlas-runtime/lower-limb/manifest.json','6ef0775e0e01f18617c86f7780d6470510dba7b6de56ccb432abd427d15974cf');
assert.equal(bodyManifest.sourceCommit,atlasRevision);
assert.equal(specimenManifest.sourceCommit,atlasRevision);
test('current imported reference manifests are independently bound to current Atlas',()=>{
 const current='190a63238eadcf906abe89dcbb6a67c88afe70b9';
 const binding=validateCurrentAtlasDelivery();
 assert.equal(binding.source,current);
 currentAtlasDeliveryRoot();
 assert.equal(currentBodyManifest.sourceCommit,current);
 assert.equal(currentSpecimenManifest.sourceCommit,current);
 assert.equal(currentBodyManifest.patientDataIncluded,false);
 assert.equal(currentSpecimenManifest.patientDataIncluded,false);
});
const bodySpec=kneeReferenceSpecs.find(s=>s.anatomyId==='anat.knee.bne.patella')!,specimenSpec=kneeReferenceSpecs.find(s=>s.anatomyId==='anat.knee.lig.anterior_cruciate_ligament')!;
function targets(){
 const bodyPin=kneeReferencePin(bodySpec,'left'),bodyId=kneeBodyReferenceId(bodySpec,'left')!;
 const body:Regional3dTarget={kind:'body',id:bodyId,label:bodyPin.label,side:'left',region:'leg',sourceHash:bodyPin.sourceHash,specimenRevision:null,relation:bodySpec.relation,
  href:'/atlas/3d?'+new URLSearchParams({region:'leg',study:'1',structure:bodyId,side:'left',source:bodyPin.sourceHash,atlasRevision})};
 const pin=kneeReferencePin(specimenSpec,'left'),id='vm:reference:um-5t6tz7-v1-2:knee:acl';
 const specimen:Regional3dTarget={kind:'specimen',id,label:pin.label,side:'right',region:'knee',sourceHash:pin.sourceHash,specimenRevision:pin.specimenRevision,relation:specimenSpec.relation,
  href:'/atlas/lower-limb-3d?'+new URLSearchParams({specimen:'um-limb-1',specimenScope:'knee',specimenPart:id,specimenSource:pin.sourceHash,specimenRevision:pin.specimenRevision!,specimenView:'anterior',atlasRevision})};
 return {body,specimen};
}
async function fixture(label='Synthetic MRI'){
 const image=enc.encode('AB').buffer as ArrayBuffer,mask=new Uint8Array([1,0]).buffer as ArrayBuffer;
 const imageHash=await sha(image),maskHash=await sha(mask),grid={shape_kji:[1,1,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'bilateral',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{id:'axial',label,image:{...grid,file:'axial/image.raw',sha256:imageHash,dtype:'uint8'},annotations:[
  {id:'patella',anatomyId:bodySpec.anatomyId,label:'Synthetic patella',seriesId:'axial',sourceImageSha256:imageHash,laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Synthetic scope only'},geometry:{kind:'mask',file:'axial/mask.raw',sha256:maskHash,shape_kji:[1,1,2],offset_kji:[0,0,0],grid,gridKind:'source-native',mappingRevision:'d'.repeat(64)}},
  {id:'acl',anatomyId:specimenSpec.anatomyId,label:'Synthetic ACL',seriesId:'axial',sourceImageSha256:imageHash,laterality:'left',coverage:'partial',review:{status:'provisional',revision:'e'.repeat(64),scope:'Inspection only'},geometry:{kind:'points',points_ras_mm:[[0,0,0]]}},
 ]},{id:'sagittal',label:'Other sequence',image:{...grid,file:'sagittal/image.raw',sha256:imageHash,dtype:'uint8'},annotations:[]}]};
 const bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=await sha(bytes);
 const pkg=await openRegionalMriPackage(bytes,new Map([['manifest.json',asset(bytes)],['axial/image.raw',asset(image)],['axial/mask.raw',asset(mask)],['sagittal/image.raw',asset(image)]]),revision);
 const study=await loadRegionalMriSeries(pkg,'axial'),otherStudy=await loadRegionalMriSeries(pkg,'sagittal');
 const patella=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[0]);
 const acl=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[1],undefined,{inspectProvisional:true});
 const target=targets(),catalogue:Regional3dCatalogue={schema:'visible-medicine.regional-mri-3d/1',mriRevision:revision,atlasRevision,mappingRevision,entries:[
  {anatomyId:bodySpec.anatomyId,sourceSide:'left',targets:[target.body]},{anatomyId:specimenSpec.anatomyId,sourceSide:'left',targets:[target.specimen]}]};
 return {pkg,study,otherStudy,patella,acl,revision,catalogue,target};
}

test('verified body/specimen contexts carry local scope while iframe URLs contain only public transport',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'};
 for(const [overlay,target,region,manifest] of [[f.patella,f.target.body,'head-neck',bodyManifest],[f.acl,f.target.specimen,'independent-right-lower-limb',specimenManifest]] as const){
  const proof=regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,overlay,target.id)!;
  assert(proof);assert(isRegionalMriInlineInspection(proof));assert.equal(proof.mri.revision,f.revision);assert.equal(proof.mri.seriesId,'axial');
  assert.equal(proof.mri.imageSha256,f.study.series.image.sha256);assert.equal(proof.mri.reviewRevision,overlay.annotation.review.revision);
  assert.equal(proof.runtimeRegion,region);assert.equal(proof.target.id,target.id);assert.equal(proof.atlasRevision,atlasRevision);
  assert.equal(proof.src.startsWith(target.kind==='body'?'/atlas-runtime/head-neck/index.html?':'/atlas-runtime/lower-limb/index.html?'),true);
  assert(!proof.src.includes(f.revision)&&!proof.src.includes(overlay.annotation.review.scope));
  assert(!/[?&](?:annotationId|reviewRevision|mriRevision)=/i.test(proof.src));
  assert(!/[?&](?:patient|scan|mask|token|atlasRevision)=/i.test(proof.src));
  assert.equal(regionalMriInlineManifestCurrent(proof,manifest),true,'current generated reference manifest should admit its pinned target');
  assert.equal(regionalMriInlineManifestCurrent(proof,target.kind==='body'?currentBodyManifest:currentSpecimenManifest),false,
    'old 408 proof must not be admitted by current 190 delivery');
 }
 const body=regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,f.patella,f.target.body.id)!;
 assert.equal(body.mri.gridKind,'source-native');assert.equal(body.mri.geometryMappingRevision,'d'.repeat(64));assert.equal(body.mri.coverage,'partial');
 const specimen=regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,f.acl,f.target.specimen.id)!;
 assert.equal(specimen.provisional,true);assert.equal(specimen.target.oppositeSide,true);
 assert.notEqual(body.key,specimen.key);
});

test('ownership, source and target changes refuse cloned or borrowed proofs',async()=>{
 const a=await fixture(),b=await fixture('Other MRI'),source={revision:a.revision,region:'knee'};
 assert.equal(regionalMriInlineInspection(source,a.catalogue,b.pkg,a.study,a.patella,a.target.body.id),null);
 assert.equal(regionalMriInlineInspection(source,a.catalogue,a.pkg,a.otherStudy,a.patella,a.target.body.id),null);
 assert.equal(regionalMriInlineInspection(source,a.catalogue,a.pkg,a.study,b.patella,a.target.body.id),null);
 assert.equal(regionalMriInlineInspection({...source,revision:'0'.repeat(64)},a.catalogue,a.pkg,a.study,a.patella,a.target.body.id),null);
 assert.equal(regionalMriInlineInspection({...source,region:'thigh'},a.catalogue,a.pkg,a.study,a.patella,a.target.body.id),null);
 assert.equal(regionalMriInlineInspection(source,a.catalogue,a.pkg,a.study,a.patella,'unknown'),null);
 const proof=regionalMriInlineInspection(source,a.catalogue,a.pkg,a.study,a.patella,a.target.body.id)!;
 assert.equal(isRegionalMriInlineInspection({...proof}),false);assert.equal(regionalMriInlineManifestCurrent({...proof},bodyManifest),false);
 const changed=structuredClone(a.catalogue);changed.entries[0].targets[0].sourceHash='0'.repeat(64);changed.entries[0].targets[0].href=changed.entries[0].targets[0].href.replace(a.target.body.sourceHash,'0'.repeat(64));
 assert.equal(regionalMriInlineInspection(source,changed,a.pkg,a.study,a.patella,a.target.body.id),null);
});

test('manifest admission refuses stale source, wrong region, duplicate/unsafe bundle and missing safety declaration',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'},proof=regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,f.acl,f.target.specimen.id)!;
 assert.equal(regionalMriInlineManifestCurrent(proof,specimenManifest),true);
 const clone=<T>(v:T):T=>structuredClone(v);
 for(const mutate of [
  (m:any)=>{m.sourceCommit='0'.repeat(40)},(m:any)=>{m.region='head-neck'},(m:any)=>{m.patientDataIncluded=true},
  (m:any)=>{delete m.patientDataIncluded},(m:any)=>{m.files.push(clone(m.files.find((x:any)=>x.path.endsWith('.glb')&&x.sha256===proof.target.sourceHash)))},
  (m:any)=>{m.files.find((x:any)=>x.path.endsWith('.glb')&&x.sha256===proof.target.sourceHash).path='../private.glb'},
 ]){const m=clone(specimenManifest);mutate(m);assert.equal(regionalMriInlineManifestCurrent(proof,m),false);}
});

test('owned specimen family stays scoped and body has no live-focus family',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'};
 const specimen=regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,f.acl,f.target.specimen.id)!;
 const again=regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,f.acl,f.target.specimen.id)!;
 const body=regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,f.patella,f.target.body.id)!;
 assert.equal(regionalMriInlineFamilyKey(specimen),regionalMriInlineFamilyKey(again));
 assert.equal(regionalMriInlineCompatible(specimen,again),true);
 assert.equal(regionalMriInlineFamilyKey(body),null);
 assert.equal(regionalMriInlineCompatible(body,specimen),false);
 assert.equal(regionalMriInlineFamilyKey({...specimen}),null);
 const target=publicSpecimenTarget(specimen)!;assert.deepEqual(target,{scope:'knee',id:specimen.target.id,source:specimen.target.sourceHash,
  revision:specimen.target.specimenRevision,laterality:'right-source-report'});
 assert.equal(publicSpecimenTarget(body),null);assert.equal(publicSpecimenTarget({...specimen}),null);
});

test('focus needs fresh command ACK and a newer exact selected snapshot; stale and blocked states fail closed',async()=>{
 const f=await fixture(),proof=regionalMriInlineInspection({revision:f.revision,region:'knee'},f.catalogue,f.pkg,f.study,f.acl,f.target.specimen.id)!;
 const sent:Record<string,any>[]=[],states:string[]=[];let count=0;
 const channel=createRegionalMriSpecimenFocus(message=>sent.push(message),state=>states.push(state),()=>`session_${String(++count).padStart(16,'0')}`);
 const target=publicSpecimenTarget(proof)!;channel.begin(proof);
 channel.receive({type:'vm-specimen-selection-ready',version:1,revision:proof.atlasRevision});
 const first=sent.at(-1)!.session;assert.equal(sent.at(-1)!.type,'vm-specimen-selection-request');
 const snapshot=(sequence:number,status:'selected'|'empty'|'blocked',extra:object={})=>({type:'vm-specimen-selection',version:1,
  revision:proof.atlasRevision,session:first,sequence,status,...extra});
 channel.receive(snapshot(1,'selected',{target}));
 const command=sent.at(-1)!;assert.equal(command.type,'vm-specimen-focus');assert.deepEqual(command.target,target);
 assert.equal(channel.state,'focusing');
 channel.receive(snapshot(1,'selected',{target}));
 channel.receive({type:'vm-specimen-focus-result',version:1,revision:proof.atlasRevision,session:first,command:1,status:'accepted'});
 assert.equal(channel.state,'focusing','ACK alone is not confirmation');
 channel.receive(snapshot(2,'selected',{target:{...target,id:'vm:reference:um-5t6tz7-v1-2:knee:pcl'}}));
 assert.equal(channel.state,'failed','other valid model selection clears authority');
 channel.receive(snapshot(3,'selected',{target}));assert.equal(channel.state,'failed','old command cannot recover');
 channel.retry();const second=sent.at(-1)!.session;assert.notEqual(second,first);
 channel.receive(snapshot(4,'selected',{target}));assert.equal(channel.state,'requesting','retired session is inert');
 channel.receive({...snapshot(1,'empty'),session:second});assert.equal(channel.state,'focusing');
 channel.receive({type:'vm-specimen-focus-result',version:1,revision:proof.atlasRevision,session:second,command:1,status:'accepted'});
 channel.receive({...snapshot(2,'selected',{target}),session:second});assert.equal(channel.state,'confirmed');
 channel.receive({...snapshot(3,'blocked',{reason:'practice'}),session:second});assert.equal(channel.state,'blocked');
 channel.close();channel.receive({...snapshot(4,'selected',{target}),session:second});assert.notEqual(channel.state,'confirmed');
 assert(states.includes('confirmed'));
});

test('actual loader-owned ACL and PCL guided steps retain one public specimen family but require fresh focus',async()=>{
 const f=await fixture(),manifest=structuredClone(f.pkg.manifest);
 const acl=manifest.series[0].annotations[1];acl.review.status='accepted-scoped';acl.review.scope='Synthetic accepted-scoped test geometry';
 const pclSpec=kneeReferenceSpecs.find(s=>s.anatomyId==='anat.knee.lig.posterior_cruciate_ligament')!;
 manifest.series[0].annotations.push({...structuredClone(acl),id:'synthetic-pcl',anatomyId:pclSpec.anatomyId,label:'Synthetic PCL',review:{...acl.review,revision:'f'.repeat(64)}});
 const bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=await sha(bytes);
 const image=enc.encode('AB').buffer as ArrayBuffer,mask=new Uint8Array([1,0]).buffer as ArrayBuffer;
 const pkg=await openRegionalMriPackage(bytes,new Map([['manifest.json',asset(bytes)],['axial/image.raw',asset(image)],['axial/mask.raw',asset(mask)],['sagittal/image.raw',asset(image)]]),revision);
 const study=await loadRegionalMriSeries(pkg,'axial'),guide=regionalMriGuides(pkg,study).find(g=>g.id==='cruciate-ligaments')!;
 const overlays=[];
 for(const[i,id]of [[0,'acl'],[1,'synthetic-pcl']] as const){const a=regionalMriGuideAnnotation(pkg,study,guide,i,id);assert(a);overlays.push(await loadRegionalMriAnnotation(pkg,study,a));}
 const pin=kneeReferencePin(pclSpec,'left'),pclId='vm:reference:um-5t6tz7-v1-2:knee:pcl';
 const pcl:Regional3dTarget={...f.target.specimen,id:pclId,label:pin.label,relation:pclSpec.relation,
  href:'/atlas/lower-limb-3d?'+new URLSearchParams({specimen:'um-limb-1',specimenScope:'knee',specimenPart:pclId,specimenSource:pin.sourceHash,specimenRevision:pin.specimenRevision!,specimenView:'anterior',atlasRevision})};
 const catalogue:Regional3dCatalogue={...f.catalogue,mriRevision:revision,entries:[{anatomyId:specimenSpec.anatomyId,sourceSide:'left',targets:[f.target.specimen]},{anatomyId:pclSpec.anatomyId,sourceSide:'left',targets:[pcl]}]};
 const proofs=overlays.map((o,i)=>regionalMriInlineInspection({revision,region:'knee'},catalogue,pkg,study,o,i?pclId:f.target.specimen.id)!);
 assert(proofs.every(Boolean));assert.notEqual(proofs[0].key,proofs[1].key);assert.notEqual(proofs[0].src,proofs[1].src);
 assert.equal(regionalMriInlineFamilyKey(proofs[0]),regionalMriInlineFamilyKey(proofs[1]));assert(regionalMriInlineCompatible(proofs[0],proofs[1]));
 for(const p of proofs){assert(regionalMriInlineManifestCurrent(p,specimenManifest));assert(p.target.oppositeSide);assert.equal(p.provisional,false);}
 const sent:Record<string,any>[]=[],channel=createRegionalMriSpecimenFocus(m=>sent.push(m),()=>{});channel.begin(proofs[0],true);
 const old=sent.at(-1)!.session;channel.begin(proofs[1],true);const current=sent.at(-1)!.session;assert.notEqual(old,current);
 const target=publicSpecimenTarget(proofs[1])!;
 const snapshot=(session:string,sequence:number)=>({type:'vm-specimen-selection',version:1,revision:atlasRevision,session,sequence,status:'selected',target});
 channel.receive(snapshot(old,1));assert.equal(channel.state,'requesting');channel.receive(snapshot(current,1));assert.equal(channel.state,'focusing');
 channel.receive({type:'vm-specimen-focus-result',version:1,revision:atlasRevision,session:current,command:1,status:'accepted'});assert.equal(channel.state,'focusing');
 channel.receive(snapshot(current,2));assert.equal(channel.state,'confirmed');
 for(const message of sent){const text=JSON.stringify(message);assert(!text.includes(revision));assert(!text.includes(study.series.image.sha256));assert(!text.includes('Synthetic'));assert(!/annotationId|points_ras_mm|ijk_to_ras/.test(text));}
 const changed=regionalMriInlineInspection({revision,region:'knee'},{...catalogue,mappingRevision:'7'.repeat(64)},pkg,study,overlays[1],pclId)!;assert(changed);assert(!regionalMriInlineCompatible(proofs[0],changed));channel.close();
});

test('a valid model selection in another declared specimen scope clears the previous knee report',async()=>{
 const f=await fixture(),proof=regionalMriInlineInspection({revision:f.revision,region:'knee'},f.catalogue,f.pkg,f.study,f.acl,f.target.specimen.id)!;
 const target=publicSpecimenTarget(proof)!;
 for(const scope of ['hip-thigh','calf','foot','whole']){
  const sent:Record<string,any>[]=[],channel=createRegionalMriSpecimenFocus(m=>sent.push(m),()=>{});channel.begin(proof,true);const session=sent[0].session;
  const snapshot=(sequence:number,selected:object)=>({type:'vm-specimen-selection',version:1,revision:atlasRevision,session,sequence,status:'selected',target:selected});
  channel.receive(snapshot(1,target));channel.receive({type:'vm-specimen-focus-result',version:1,revision:atlasRevision,session,command:1,status:'accepted'});
  channel.receive(snapshot(2,target));assert.equal(channel.state,'confirmed');
  channel.receive(snapshot(3,{...target,scope,id:'vm:reference:um-5t6tz7-v1-2:lower-limb:source-group',laterality:'source-group'}));
  assert.equal(channel.state,'failed',scope+': current source selection left the requested knee context');
  channel.receive(snapshot(4,target));assert.equal(channel.state,'failed','old command cannot restore confirmation');channel.close();
 }
});
