import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import specimenManifest from '../public/atlas-runtime/lower-limb/manifest.json' with {type:'json'};
const enc=new TextEncoder(),sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const quad='anat.knee.tdn.quadriceps_tendon',patella='anat.knee.bne.patella',tendon='anat.knee.tdn.patellar_tendon';
const priorMetadataSha256='526a7999ca808f38b95f810ba928815f6e324958bbb1309a82f1b8a786cd72d8';
const apiPromise=build({stdin:{contents:[
 "export * from './lib/regional-mri-package';export * from './lib/regional-mri-guided-study';",
 "export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue';",
 "export * from './lib/regional-mri-inline-inspection';export * from './lib/regional-mri-specimen-focus';",
 "export {regionalMriFocusSlice} from './lib/regional-mri-render';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'}).then(r=>
 import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].contents).toString('base64')));
const asset=(data:ArrayBuffer)=>({size:data.byteLength,async arrayBuffer(){return data.slice(0)}});
async function fixture(acceptedPatella=false){
 const api=await apiPromise,image=Uint8Array.from({length:27},(_,i)=>i+1).buffer,imageHash=sha(new Uint8Array(image));
 const annotation=(id:string,anatomyId:string,point:number[],status='accepted-scoped',seriesId='native')=>({id,anatomyId,label:id,seriesId,
  sourceImageSha256:imageHash,laterality:'left',coverage:'partial',review:{status,revision:'d'.repeat(64),scope:'Synthetic source extent only'},geometry:{kind:'points',points_ras_mm:[point]}});
 const grid={shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]},manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
  {id:'native',label:'Synthetic native MRI',image:{...grid,file:'native.raw',sha256:imageHash,dtype:'uint8'},annotations:[
   annotation('synthetic-quadriceps',quad,[0,1,0]),annotation('synthetic-patella',patella,[1,1,1],acceptedPatella?'accepted-scoped':'provisional'),
   annotation('synthetic-facet','anat.knee.bne.patellar_medial_facet',[1,1,1]),
   annotation('synthetic-patellar-a',tendon,[2,1,2]),annotation('synthetic-patellar-b',tendon,[2,1,1])]},
  {id:'other',label:'Synthetic other sequence',image:{...grid,file:'other.raw',sha256:imageHash,dtype:'uint8'},annotations:[annotation('synthetic-other-patella',patella,[1,1,1],'accepted-scoped','other')]},
 ]},bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=sha(new Uint8Array(bytes));
 const pkg=await api.openRegionalMriPackage(bytes,new Map([['manifest.json',asset(bytes)],['native.raw',asset(image)],['other.raw',asset(image)]]),revision);
 const study=await api.loadRegionalMriSeries(pkg,'native'),other=await api.loadRegionalMriSeries(pkg,'other'),guides=api.regionalMriGuides(pkg,study),guide=guides.find((g:any)=>g.id==='extensor-mechanism');assert(guide);
 const catalogue=await api.buildRegionalMri3dCatalogue({revision,region:'knee'});assert(catalogue);return{api,pkg,study,other,guides,guide,catalogue,revision};
}
test('new extensor path preserves all six preceding guided steps and exact revision identities',async()=>{
 const f=await fixture();assert.equal(f.guides.slice(0,4).length,4);
 assert.equal(f.guides.length,5);assert.equal(f.guides[4].id,'posterior-knee');assert.deepEqual(f.guide.steps.map((s:any)=>s.anatomyId),[quad,patella,tendon]);
 const prior=f.guides.filter((g:any)=>['cruciate-ligaments','collateral-ligaments','menisci'].includes(g.id)).map(({id,title,revision,steps}:any)=>({id,title,revision,steps:steps.map(({anatomyId,title,caption,source}:any)=>({anatomyId,title,caption,source}))}));
 assert.equal(sha(JSON.stringify(prior)),priorMetadataSha256);assert.equal(f.guide.sourceRevision,f.revision);assert.equal(f.guide.sequenceId,'native');
 assert(!prior.some((g:any)=>g.revision===f.guide.revision));
 assert.equal(f.guide.steps[0].source.href,'https://pubmed.ncbi.nlm.nih.gov/19690926/');assert.match(f.guide.steps[0].source.title,/Waligora/);
 for(const step of f.guide.steps){assert(Object.isFrozen(step));assert(Object.isFrozen(step.candidates));assert(Object.isFrozen(step.source));}
});
test('provisional patella remains a fixed unavailable middle slot despite accepted facets and another sequence',async()=>{
 const f=await fixture();assert.deepEqual(f.guide.steps.map((s:any)=>s.candidates.map((a:any)=>a.id)),[
  ['synthetic-quadriceps'],['synthetic-patella'],['synthetic-patellar-a','synthetic-patellar-b']]);
 for(const id of ['synthetic-patella','synthetic-facet','synthetic-other-patella'])assert.equal(f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,1,id),null,id);
 for(const id of ['synthetic-patellar-a','synthetic-patellar-b'])assert(f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,2,id),'Each variant requires explicit ID');
 const a=f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,0,'synthetic-quadriceps');assert(a);
 assert.equal(f.api.regionalMriGuideAnnotation(f.pkg,f.other,f.guide,0,a.id),null);
 assert.equal(f.pkg.manifest.series[0].annotations[1].review.status,'provisional','Guide cannot promote source acceptance');
});
test('native tendon focus works without substituting the preceding quadriceps 3D reference for an unmapped tendon',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'};
 const q=f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,0,'synthetic-quadriceps');assert(q);const qo=await f.api.loadRegionalMriAnnotation(f.pkg,f.study,q);
 const target=f.catalogue.entries.find((e:any)=>e.anatomyId===quad&&e.sourceSide==='left').targets[0],proof=f.api.regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,qo,target.id);assert(proof);
 assert.equal(proof.target.oppositeSide,true);assert.equal(f.api.regionalMriInlineManifestCurrent(proof,specimenManifest),true);
 const t=f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,2,'synthetic-patellar-a');assert(t);const to=await f.api.loadRegionalMriAnnotation(f.pkg,f.study,t);
 for(const plane of ['axial','coronal','sagittal'])assert.equal(f.api.regionalMriFocusSlice(f.study,to,plane),[2,1,2][f.study.geometry.views[plane].fixedAxisIJK]);
 assert(!f.catalogue.entries.some((e:any)=>e.anatomyId===tendon),'No invented patellar-tendon model mapping');
 assert.equal(f.api.regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,to,target.id),null,'Never retain previous tendon as the new target');
 for(const value of [f.revision,f.study.series.image.sha256,q.id,q.review.scope])assert(!proof.src.includes(value));
 const sent:any[]=[],channel=f.api.createRegionalMriSpecimenFocus((m:any)=>sent.push(m),()=>{});channel.begin(proof,true);const session=sent[0].session;
 channel.close();channel.receive({type:'vm-specimen-selection',version:1,revision:proof.runtimeRevision,session,sequence:1,status:'selected',target:f.api.publicSpecimenTarget(proof)});assert.notEqual(channel.state,'confirmed');
});
test('only a separately accepted synthetic whole-patella source can expose its existing same-side body reference',async()=>{
 const f=await fixture(true),a=f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,1,'synthetic-patella');assert(a);
 const overlay=await f.api.loadRegionalMriAnnotation(f.pkg,f.study,a),target=f.catalogue.entries.find((e:any)=>e.anatomyId===patella&&e.sourceSide==='left').targets[0];
 const proof=f.api.regionalMriInlineInspection({revision:f.revision,region:'knee'},f.catalogue,f.pkg,f.study,overlay,target.id);assert(proof);
 assert.equal(proof.target.kind,'body');assert.equal(proof.target.relation,'same-structure');assert.equal(proof.target.side,'left');assert.equal(proof.target.oppositeSide,false);
 assert.equal(f.api.regionalMriInlineFamilyKey(proof),null,'Body comparison is not a compatible specimen frame');
 assert.notEqual(f.api.regionalMriInlineBodyFamilyKey(proof),null,'Separate root-body family is explicitly available in this source epoch');
 assert.equal(f.api.regionalMriInlineCompatible(proof,f.api.regionalMriInlineInspection({revision:f.revision,region:'knee'},f.catalogue,f.pkg,f.study,overlay,target.id)),true,'Owned equivalent root-body references share their separate family');
 assert.equal(f.api.regionalMriInlineCompatible(proof,{...proof}),false,'Copied proof cannot retain a source-owned body frame');
});
