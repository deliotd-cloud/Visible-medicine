import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import specimenManifest from '../public/atlas-runtime/lower-limb/manifest.json' with {type:'json'};

const enc=new TextEncoder(),sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const medial='anat.knee.men.medial_meniscus',lateral='anat.knee.men.lateral_meniscus';
const originalLigamentMetadataSha256='4228e80da6f9c37e661d7ed6c6751b5f1d7661bdf310ae2dc6ffc01c62bbc0dd';
const apiPromise=build({stdin:{contents:[
  "export * from './lib/regional-mri-package';",
  "export * from './lib/regional-mri-guided-study';",
  "export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue';",
  "export * from './lib/regional-mri-inline-inspection';",
  "export * from './lib/regional-mri-specimen-focus';",
  "export {regionalMriFocusSlice} from './lib/regional-mri-render';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'}).then(result=>
  import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64')));
const asset=(data:ArrayBuffer)=>({size:data.byteLength,async arrayBuffer(){return data.slice(0)}});

async function fixture(){
  const api=await apiPromise,image=Uint8Array.from({length:27},(_,i)=>i+1).buffer,imageHash=sha(new Uint8Array(image));
  const annotation=(id:string,anatomyId:string,point:number[])=>({id,anatomyId,label:id,seriesId:'native',
    sourceImageSha256:imageHash,laterality:'left',coverage:'partial',
    review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Synthetic exact sequence extent only'},
    geometry:{kind:'points',points_ras_mm:[point]}});
  const grid={shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
  const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',
    coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
      {id:'native',label:'Synthetic native MRI',image:{...grid,file:'native.raw',sha256:imageHash,dtype:'uint8'},annotations:[
        annotation('synthetic-medial',medial,[0,1,0]),annotation('synthetic-lateral',lateral,[2,1,2])]},
      {id:'other',label:'Synthetic different sequence',image:{...grid,file:'other.raw',sha256:imageHash,dtype:'uint8'},annotations:[]},
    ]};
  const bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=sha(new Uint8Array(bytes));
  const pkg=await api.openRegionalMriPackage(bytes,new Map([['manifest.json',asset(bytes)],['native.raw',asset(image)],['other.raw',asset(image)]]),revision);
  const study=await api.loadRegionalMriSeries(pkg,'native'),other=await api.loadRegionalMriSeries(pkg,'other');
  const guides=api.regionalMriGuides(pkg,study),guide=guides.find((g:any)=>g.id==='menisci');assert(guide);
  const catalogue=await api.buildRegionalMri3dCatalogue({revision,region:'knee'});assert(catalogue);
  return {api,pkg,study,other,guides,guide,catalogue,revision,manifest};
}

test('actual meniscal guide preserves all four original ligament captions, sources and revision identities',async()=>{
  const f=await fixture();assert.equal(f.guides.slice(0,4).length,4);
  assert.equal(f.guides.length,5);assert.equal(f.guides[4].id,'posterior-knee');assert.equal(f.guide.steps.length,2);
  const original=f.guides.filter((g:any)=>g.id==='cruciate-ligaments'||g.id==='collateral-ligaments').map(({id,title,revision,steps}:any)=>({id,title,revision,
    steps:steps.map(({anatomyId,title,caption,source}:any)=>({anatomyId,title,caption,source}))}));
  assert.equal(sha(JSON.stringify(original)),originalLigamentMetadataSha256);
  assert.deepEqual(f.guide.steps.map((s:any)=>s.anatomyId),[medial,lateral]);
  assert.notEqual(f.guide.revision,f.api.KNEE_GUIDE_REVISION);
  assert.equal(f.guide.sourceRevision,f.revision);assert.equal(f.guide.sequenceId,f.study.series.id);
  for(const step of f.guide.steps){assert.equal(step.source.href,'https://pubmed.ncbi.nlm.nih.gov/17449741/');assert(Object.isFrozen(step));}
  assert.equal(f.pkg.manifest.registration,'none');assert.equal(f.pkg.manifest.release,'local-private-draft');
});

test('two verified native meniscal stops retain only a grouped opposite-side 3D reference, not individual correspondence',async()=>{
  const f=await fixture(),source={revision:f.revision,region:'knee'},proofs:any[]=[],overlays:any[]=[];
  for(const [index,id,point] of [[0,'synthetic-medial',[0,1,0]],[1,'synthetic-lateral',[2,1,2]]] as const){
    const annotation=f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,index,id);assert(annotation);
    const overlay=await f.api.loadRegionalMriAnnotation(f.pkg,f.study,annotation);overlays.push(overlay);
    assert.equal(overlay.purpose,'scoped-display');
    for(const plane of ['axial','coronal','sagittal'])
      assert.equal(f.api.regionalMriFocusSlice(f.study,overlay,plane),point[f.study.geometry.views[plane].fixedAxisIJK]);
    const targets=f.catalogue.entries.find((e:any)=>e.anatomyId===annotation.anatomyId&&e.sourceSide==='left')?.targets;
    assert.equal(targets.length,1);const target=targets[0];
    assert.equal(target.relation,'group-reference');assert.equal(target.side,'right');assert.equal(target.label,'Knee meniscus (source group)');
    const proof=f.api.regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,overlay,target.id);assert(proof);
    assert.equal(proof.target.oppositeSide,true);assert.equal(proof.provisional,false);
    assert.equal(proof.target.relation,'group-reference');assert.equal(proof.mri.coverage,'partial');
    assert.equal(proof.runtimeRevision,specimenManifest.sourceCommit);
    assert.equal(f.api.regionalMriInlineManifestCurrent(proof,specimenManifest),true);
    assert.equal(f.api.regionalMriInlineInspection(source,f.catalogue,f.pkg,f.other,overlay,target.id),null);
    for(const value of [f.revision,f.study.series.image.sha256,id,annotation.review.scope])assert(!proof.src.includes(value));
    proofs.push(proof);
  }
  assert.equal(proofs[0].target.id,proofs[1].target.id,'Both stop comparisons are the same grouped model, not separate medial/lateral surfaces');
  assert.equal(proofs[0].src,proofs[1].src);assert.notEqual(proofs[0].key,proofs[1].key,'Private source context must still change');
  assert.equal(f.api.regionalMriInlineCompatible(proofs[0],proofs[1]),true);
  const changed=structuredClone(f.catalogue);changed.entries.find((e:any)=>e.anatomyId===medial&&e.sourceSide==='left').targets[0].relation='same-structure';
  assert.equal(f.api.regionalMriInlineInspection(source,changed,f.pkg,f.study,overlays[0],proofs[0].target.id),null,'Cannot upgrade group reference to individual correspondence');
  assert.throws(()=>f.api.regionalMriFocusSlice(f.other,overlays[0],'axial'),/owned|sequence|study|verified/i);
});

test('identical public meniscus target still requires a new report after changing the private guided stop',async()=>{
  const f=await fixture(),source={revision:f.revision,region:'knee'},proofs:any[]=[];
  for(let i=0;i<2;i++){
    const annotation=f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,i,f.guide.steps[i].candidates[0].id);assert(annotation);
    const overlay=await f.api.loadRegionalMriAnnotation(f.pkg,f.study,annotation),id=f.catalogue.entries.find((e:any)=>e.anatomyId===annotation.anatomyId&&e.sourceSide==='left').targets[0].id;
    proofs.push(f.api.regionalMriInlineInspection(source,f.catalogue,f.pkg,f.study,overlay,id));
  }
  const sent:any[]=[],channel=f.api.createRegionalMriSpecimenFocus((m:any)=>sent.push(m),()=>{});
  channel.begin(proofs[0],true);const old=sent.at(-1).session,target=f.api.publicSpecimenTarget(proofs[0]);
  const snapshot=(session:string,sequence:number)=>({type:'vm-specimen-selection',version:1,revision:proofs[0].runtimeRevision,session,sequence,status:'selected',target});
  channel.receive(snapshot(old,1));channel.receive({type:'vm-specimen-focus-result',version:1,revision:proofs[0].runtimeRevision,session:old,command:1,status:'accepted'});
  channel.receive(snapshot(old,2));assert.equal(channel.state,'confirmed');
  channel.begin(proofs[1],true);const current=sent.at(-1).session;assert.notEqual(current,old);assert.equal(channel.state,'requesting');
  channel.receive(snapshot(old,3));assert.equal(channel.state,'requesting','Prior stop report is retired even for identical grouped target');
  channel.receive(snapshot(current,1));assert.equal(channel.state,'focusing');
  channel.receive({type:'vm-specimen-focus-result',version:1,revision:proofs[1].runtimeRevision,session:current,command:1,status:'accepted'});
  assert.equal(channel.state,'focusing','ACK alone is not a current selection report');
  channel.receive(snapshot(current,2));assert.equal(channel.state,'confirmed');
  for(const message of sent){const text=JSON.stringify(message);for(const value of [f.revision,f.study.series.image.sha256,'synthetic-medial','synthetic-lateral','Synthetic'])assert(!text.includes(value));assert(!/points_ras_mm|ijk_to_ras|annotationId/.test(text));}
  channel.close();channel.receive(snapshot(current,3));assert.notEqual(channel.state,'confirmed');
});
