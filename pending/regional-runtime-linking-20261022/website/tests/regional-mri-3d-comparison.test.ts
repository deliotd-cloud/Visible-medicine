import assert from 'node:assert/strict';
import test from 'node:test';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {regionalMri3dComparison,type Regional3dCatalogue,type Regional3dTarget} from '../lib/regional-mri-3d-comparison.ts';
import {kneeBodyReferenceId,kneeReferenceSpecs,kneeReferencePin} from '../lib/regional-knee-3d-mappings.ts';

const sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const enc=new TextEncoder();
const asset=(bytes:ArrayBuffer):RegionalAsset=>({size:bytes.byteLength,async arrayBuffer(){return bytes.slice(0)}});
const atlasRevision='a'.repeat(40),mappingRevision='b'.repeat(64);
async function fixture(label='Synthetic source'){
 const image=enc.encode('AB').buffer as ArrayBuffer,sourceHash=await sha(image);
 const grid={shape_kji:[1,1,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const annotation=(id:string,anatomyId:string,side:'left'|'right',status:'accepted-scoped'|'provisional')=>({id,anatomyId,label:id,seriesId:'sequence',sourceImageSha256:sourceHash,laterality:side,coverage:'partial' as const,review:{status,revision:'c'.repeat(64),scope:'Synthetic source only'},geometry:{kind:'points' as const,points_ras_mm:[[0,0,0]]}});
 const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'bilateral',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{id:'sequence',label,image:{...grid,file:'sequence/image.raw',sha256:sourceHash,dtype:'uint8'},annotations:[annotation('patella','anat.knee.bne.patella','left','accepted-scoped'),annotation('acl','anat.knee.lig.anterior_cruciate_ligament','left','provisional')]},{id:'other-sequence',label:'Distinct synthetic sequence',image:{...grid,file:'other-sequence/image.raw',sha256:sourceHash,dtype:'uint8'},annotations:[]}]};
 const bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=await sha(bytes),files=new Map([['manifest.json',asset(bytes)],['sequence/image.raw',asset(image)],['other-sequence/image.raw',asset(image)]]);
 const pkg=await openRegionalMriPackage(bytes,files,revision),study=await loadRegionalMriSeries(pkg,'sequence'),otherStudy=await loadRegionalMriSeries(pkg,'other-sequence');
 const patella=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[0]);
 const acl=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[1],undefined,{inspectProvisional:true});
 return {pkg,study,otherStudy,patella,acl,revision};
}
const bodySpec=kneeReferenceSpecs.find(s=>s.anatomyId==='anat.knee.bne.patella')!;
const specimenSpec=kneeReferenceSpecs.find(s=>s.anatomyId==='anat.knee.lig.anterior_cruciate_ligament')!;
const bodyPin=kneeReferencePin(bodySpec,'left'),specimenPin=kneeReferencePin(specimenSpec,'left');
function bodyTarget():Regional3dTarget{const id=kneeBodyReferenceId(bodySpec,'left')!;return {kind:'body',id,label:bodyPin.label,side:'left',region:'leg',sourceHash:bodyPin.sourceHash,runtimeRevision:atlasRevision,specimenRevision:null,relation:'same-structure',href:'/atlas/3d?'+new URLSearchParams({region:'leg',study:'1',structure:id,side:'left',source:bodyPin.sourceHash,atlasRevision})};}
function specimenTarget():Regional3dTarget{const id='vm:reference:um-5t6tz7-v1-2:knee:acl';return {kind:'specimen',id,label:specimenPin.label,side:'right',region:'knee',sourceHash:specimenPin.sourceHash,runtimeRevision:atlasRevision,specimenRevision:specimenPin.specimenRevision,relation:specimenSpec.relation,href:'/atlas/lower-limb-3d?'+new URLSearchParams({specimen:'um-limb-1',specimenScope:'knee',specimenPart:id,specimenSource:specimenPin.sourceHash,specimenRevision:specimenPin.specimenRevision!,specimenView:'anterior',atlasRevision})};}
function catalogue(revision:string):Regional3dCatalogue{return {schema:'visible-medicine.regional-mri-3d/1',mriRevision:revision,atlasRevision,mappingRevision,entries:[{anatomyId:'anat.knee.bne.patella',sourceSide:'left',targets:[bodyTarget()]},{anatomyId:'anat.knee.lig.anterior_cruciate_ligament',sourceSide:'left',targets:[specimenTarget()]}]};}
const clone=<T>(value:T):T=>structuredClone(value);

test('loader-owned left MRI offers same-side body reference and explicit opposite-side right specimen',async()=>{
 const f=await fixture(),c=catalogue(f.revision),source={revision:f.revision,region:'knee'};
 const body=regionalMri3dComparison(source,c,f.pkg,f.study,f.patella)!;
 assert.equal(body.targets.length,1);assert.equal(body.targets[0].oppositeSide,false);assert.equal(body.targets[0].relation,'same-structure');
 const specimen=regionalMri3dComparison(source,c,f.pkg,f.study,f.acl)!;
 assert.equal(specimen.provisional,true);assert.equal(specimen.reviewStatus,'provisional');assert.equal(specimen.targets[0].oppositeSide,true);assert.equal(specimen.targets[0].side,'right');
 assert.equal(specimen.sourceReviewRevision,'c'.repeat(64));
});

test('forged, other-package, other-study and other-overlay identities fail closed',async()=>{
 const a=await fixture(),b=await fixture('Different source'),source={revision:a.revision,region:'knee'},c=catalogue(a.revision);
 assert.equal(regionalMri3dComparison(source,c,b.pkg,a.study,a.patella),null);
 assert.equal(regionalMri3dComparison(source,c,a.pkg,b.study,a.patella),null);
 assert.equal(regionalMri3dComparison(source,c,a.pkg,a.otherStudy,a.patella),null);
 assert.equal(regionalMri3dComparison(source,c,a.pkg,a.study,b.patella),null);
 assert.equal(regionalMri3dComparison(source,c,a.pkg,{...a.study},a.patella),null);
 assert.equal(regionalMri3dComparison(source,c,a.pkg,a.study,{...a.patella}),null);
});

test('stale source/catalogue pins and duplicate mapping identities fail closed',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'},base=catalogue(f.revision);
 for(const s of [{revision:'0'.repeat(64),region:'knee'},{revision:f.revision,region:'thigh'}])assert.equal(regionalMri3dComparison(s,base,f.pkg,f.study,f.patella),null);
 for(const mutate of [
  (c:Regional3dCatalogue)=>{c.mriRevision='0'.repeat(64)},
  (c:Regional3dCatalogue)=>{c.atlasRevision='0'.repeat(40)},
  (c:Regional3dCatalogue)=>{c.mappingRevision='bad'},
  (c:Regional3dCatalogue)=>{c.entries.push(clone(c.entries[0]))},
  (c:Regional3dCatalogue)=>{c.entries[0].targets.push(clone(c.entries[0].targets[0]))},
 ]){const c=clone(base);mutate(c);assert.equal(regionalMri3dComparison(source,c,f.pkg,f.study,f.patella),null);}
});

test('target URLs reject wrong side, external destinations, extras, duplicates and false parent/group claims',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'};
 const invalid:Array<(t:Regional3dTarget)=>void>=[
  t=>{t.side='right'},t=>{t.href='https://private.example/atlas/3d?'+t.href.split('?')[1]},
  t=>{t.href+='&patient=private'},t=>{t.href+='&side=left'},
  t=>{t.href='https://visible-medicine.invalid'+t.href},
  t=>{t.href=t.href.replace('atlasRevision='+atlasRevision,'atlasRevision='+'0'.repeat(40))},
  t=>{t.relation='parent-reference'},t=>{t.id='vm:anatomy:body:leg:left:bone:femur'},t=>{t.label+=' altered'},
  t=>{const old=t.sourceHash;t.sourceHash='0'.repeat(64);t.href=t.href.replace(old,t.sourceHash)},
  t=>{t.href+='&scan=https://private.example'},
  t=>{delete (t as Partial<Regional3dTarget>).runtimeRevision},t=>{t.runtimeRevision='bad'},
  t=>{t.runtimeRevision='0'.repeat(40);t.href=t.href.replace(atlasRevision,t.runtimeRevision)},
 ];
 for(const mutate of invalid){const c=catalogue(f.revision);mutate(c.entries[0].targets[0]);assert.equal(regionalMri3dComparison(source,c,f.pkg,f.study,f.patella),null);}
 const wrong=catalogue(f.revision);wrong.entries[1].targets[0].side='left';assert.equal(regionalMri3dComparison(source,wrong,f.pkg,f.study,f.acl),null);
 for(const mutate of [
  (t:Regional3dTarget)=>{const old=t.sourceHash;t.sourceHash='0'.repeat(64);t.href=t.href.replace(old,t.sourceHash)},
  (t:Regional3dTarget)=>{const old=t.specimenRevision!;t.specimenRevision='0'.repeat(64);t.href=t.href.replace(old,t.specimenRevision)},
  (t:Regional3dTarget)=>{t.label+=' altered'},
  (t:Regional3dTarget)=>{t.href='https://visible-medicine.invalid'+t.href},
 ]){const c=catalogue(f.revision);mutate(c.entries[1].targets[0]);assert.equal(regionalMri3dComparison(source,c,f.pkg,f.study,f.acl),null);}
});

test('specimen runtime may differ from Review, but its exact URL pin is mandatory',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'},c=catalogue(f.revision),target=c.entries[1].targets[0];
 target.runtimeRevision='d'.repeat(40);target.href=target.href.replace(atlasRevision,target.runtimeRevision);
 const comparison=regionalMri3dComparison(source,c,f.pkg,f.study,f.acl);
 assert(comparison);assert.equal(comparison.atlasRevision,atlasRevision);assert.equal(comparison.targets[0].runtimeRevision,target.runtimeRevision);
 for(const mutate of [
  (t:Regional3dTarget)=>{delete (t as Partial<Regional3dTarget>).runtimeRevision},
  (t:Regional3dTarget)=>{t.runtimeRevision='bad'},
  (t:Regional3dTarget)=>{t.href=t.href.replace(t.runtimeRevision,atlasRevision)},
 ]){const changed=clone(c);mutate(changed.entries[1].targets[0]);assert.equal(regionalMri3dComparison(source,changed,f.pkg,f.study,f.acl),null);}
});

test('unmapped nerve/tendon concepts and unknown laterality get no substitution',async()=>{
 const f=await fixture(),c=catalogue(f.revision),source={revision:f.revision,region:'knee'};
 const changed=clone(c);changed.entries[0].anatomyId='anat.knee.nvs.tibial_nerve';
 assert.equal(regionalMri3dComparison(source,changed,f.pkg,f.study,f.patella),null);
 const tendon=clone(c);tendon.entries[0].anatomyId='anat.knee.tdn.patellar_tendon';
 assert.equal(regionalMri3dComparison(source,tendon,f.pkg,f.study,f.patella),null);
 const forged={...f.patella,annotation:{...f.patella.annotation,laterality:'bilateral'}};
 assert.equal(regionalMri3dComparison(source,c,f.pkg,f.study,forged as any),null);
});
