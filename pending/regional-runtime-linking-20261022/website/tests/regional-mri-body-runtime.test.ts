import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {regionalMriInlineInspection,regionalMriInlineCompatible,regionalMriInlineBodyFamilyKey,regionalMriInlineManifestCurrent} from '../lib/regional-mri-inline-inspection.ts';
import {createRegionalMriBodyFocus,publicBodyTarget,isCurrentRegionalMriBodySelection} from '../lib/regional-mri-body-focus.ts';
import {regionalMriReferenceMatchesRequested} from '../lib/regional-mri-reference-selection.ts';
import {regionalMriBodyHandoff} from '../lib/regional-mri-body-handoff.ts';
import {regionalMriFocusSlice,regionalMriFrame} from '../lib/regional-mri-render.ts';
import {kneeReferenceSpecs,kneeReferencePin,kneeBodyReferenceId} from '../lib/regional-knee-3d-mappings.ts';
import type {Regional3dCatalogue,Regional3dTarget} from '../lib/regional-mri-3d-comparison.ts';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const json=(path:string)=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const learner=json('public/atlas-runtime/head-neck/manifest.json'),revision=learner.sourceCommit;
const built=await build({stdin:{contents:"export * from './atlas-review/lib/body-selection-channel';",resolveDir:fileURLToPath(new URL('..',import.meta.url)),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',tsconfigRaw:{}});
const sourceApi=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].contents).toString('base64'));
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};

async function fixture(region:'leg'|'thigh'){
 const slugs=region==='leg'?['popliteus','popliteal-artery']:['vastus-medialis','vastus-lateralis'];
 const specs=slugs.map(slug=>kneeReferenceSpecs.find(s=>s.kind==='body'&&s.slug===slug)!);
 const image=new Uint8Array([1,2,3,4,5,6,7,8]),grid={shape_kji:[2,2,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'bilateral',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{
  id:'native',label:'Synthetic native scan',image:{...grid,file:'native/image.raw',sha256:sha(image),dtype:'uint8'},annotations:specs.map((spec,i)=>({id:'synthetic-'+i,anatomyId:spec.anatomyId,label:'Synthetic '+i,seriesId:'native',sourceImageSha256:sha(image),laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Synthetic only'},geometry:{kind:'points',points_ras_mm:[[1,1,1]]}}))
 }]};
 const bytes=new TextEncoder().encode(JSON.stringify(manifest)),source={revision:sha(bytes),region:'knee'};
 const asset=(b:Uint8Array):RegionalAsset=>({size:b.length,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength) as ArrayBuffer});
 const pkg=await openRegionalMriPackage(bytes.buffer,new Map([['manifest.json',asset(bytes)],['native/image.raw',asset(image)]]),source.revision),study=await loadRegionalMriSeries(pkg,'native');
 const targets:Regional3dTarget[]=specs.map(spec=>{const pin=kneeReferencePin(spec,'left'),id=kneeBodyReferenceId(spec,'left')!;return{kind:'body',id,label:pin.label,side:'left',region,sourceHash:pin.sourceHash,runtimeRevision:revision,specimenRevision:null,relation:'same-structure',href:'/atlas/3d?'+new URLSearchParams({region,study:'1',structure:id,side:'left',source:pin.sourceHash,atlasRevision:revision})};});
 const catalogue:Regional3dCatalogue={schema:'visible-medicine.regional-mri-3d/1',mriRevision:source.revision,atlasRevision:revision,mappingRevision:'b'.repeat(64),entries:specs.map((s,i)=>({anatomyId:s.anatomyId,sourceSide:'left',targets:[targets[i]]}))};
 const overlays=await Promise.all(study.series.annotations.map(a=>loadRegionalMriAnnotation(pkg,study,a)));
 const proofs=overlays.map((o,i)=>regionalMriInlineInspection(source,catalogue,pkg,study,o,targets[i].id)!);assert(proofs.every(Boolean));
 return{source,pkg,study,catalogue,targets,overlays,proofs};
}

test('actual imported root channel and owned host complete explicit leg/thigh native MRI handoffs',async()=>{
 for(const region of ['leg','thigh'] as const){
  const f=await fixture(region),messages:object[]=[],listeners=new Set<(event:any)=>void>(),origin='https://visible-medicine.invalid';
  let connection:ReturnType<typeof sourceApi.connectBodySelectionChannel>|null=null;
  // Window.postMessage delivers after the sender returns, never reentrantly.
  const send=(data:object)=>{messages.push(data);queueMicrotask(()=>{for(const fn of [...listeners])fn({data,origin,source:parent});});};
  const host=createRegionalMriBodyFocus(send,()=>{});host.begin(f.proofs[0]);
  const parent={postMessage:(data:object,where:string)=>{assert.equal(where,origin);queueMicrotask(()=>host.receive(data));}};
  const state=sourceApi.createBodySelectionState(()=>connection?.publish());
  const rootFocus=(target:any)=>{const match=f.proofs.map(publicBodyTarget).find(t=>t!==null&&t.id===target.id&&t.source===target.source&&t.laterality===target.laterality);if(!match)return false;queueMicrotask(()=>state.root({status:'selected',selection:match},rootFocus));return true;};
  state.root({status:'selected',selection:publicBodyTarget(f.proofs[0])},rootFocus);
  const win={parent,location:{origin},addEventListener:(name:string,fn:any)=>{assert.equal(name,'message');listeners.add(fn)},removeEventListener:(_name:string,fn:any)=>listeners.delete(fn)};
  connection=sourceApi.connectBodySelectionChannel(win,revision,region,()=>state.current(),rootFocus);await settle();
  assert.equal(host.state,'confirmed');assert(isCurrentRegionalMriBodySelection(host.selection));assert.equal(host.selection!.target.id,f.targets[0].id);
  assert(regionalMriReferenceMatchesRequested(host.selection,f.proofs[0]));
  assert.equal(regionalMriReferenceMatchesRequested({...host.selection},f.proofs[0]),false);
  state.root({status:'selected',selection:publicBodyTarget(f.proofs[1])},rootFocus);await settle();const selected=host.selection!;
  assert(isCurrentRegionalMriBodySelection(selected));assert.equal(regionalMriReferenceMatchesRequested(selected,f.proofs[0]),false);
  assert(regionalMriReferenceMatchesRequested(selected,f.proofs[1]));
  const handoff=regionalMriBodyHandoff(f.source,f.catalogue,f.pkg,f.study,f.overlays[0],f.proofs[0],selected)!;
  assert(handoff);assert.strictEqual(handoff.annotation,f.study.series.annotations[1]);assert.equal(handoff.targetId,f.targets[1].id);
  assert(regionalMriInlineCompatible(f.proofs[0],f.proofs[1]));assert.equal(regionalMriInlineBodyFamilyKey(f.proofs[0]),regionalMriInlineBodyFamilyKey(f.proofs[1]));
  for(const plane of ['axial','coronal','sagittal'] as const){const slice=regionalMriFocusSlice(f.study,f.overlays[1],plane);assert.notEqual(slice,null);const frame=regionalMriFrame(f.study,f.overlays[1],plane,slice!,{center:4,width:8,opacity:.55});assert(frame.markers.length>0);}
  assert.equal(regionalMriBodyHandoff(f.source,f.catalogue,f.pkg,f.study,f.overlays[0],f.proofs[0],{...selected}),null);
  const files=[...new Set(f.targets.map(t=>t.sourceHash))].map((h,i)=>({path:'models/synthetic-'+i+'.glb',sha256:h}));
  for(const p of f.proofs)assert(regionalMriInlineManifestCurrent(p,{...learner,files}));
  state.root({status:'empty'});await settle();assert(!isCurrentRegionalMriBodySelection(selected));assert.equal(host.selection,null);
  connection.close();host.close();assert.equal(listeners.size,0);
  for(const message of messages){const text=JSON.stringify(message);assert(!text.includes(f.source.revision));assert(!text.includes(f.study.series.image.sha256));assert.doesNotMatch(text,/Synthetic|annotationId|points_ras_mm|ijk_to_ras/);}
 }
});

test('generated root-body runtime binds all new source dependencies and each exact installed module revision',()=>{
 const review=json('atlas-review/manifest.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(review.revision,revision);assert.equal(json('public/atlas-review-viewer/manifest.json').sourceCommit,revision);
 const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])assert.equal(json('public/atlas-runtime/'+module+'/manifest.json').sourceCommit,runtimeSources[module]);
 for(const path of ['app/body-selection-channel.tsx','lib/body-focus-command.ts','lib/body-selection-channel.ts']){
  const input=inputs.filter((f:any)=>f.path===path),imported=review.files.filter((f:any)=>f.path===path);assert.equal(input.length,1);assert.equal(imported.length,1);
  assert.equal(sha(readFileSync(new URL('../atlas-review/'+path,import.meta.url))),imported[0].importedSha256);
  assert.equal(input[0].sha256,imported[0].sourceSha256);
 }
 const scripts=learner.files.filter((f:any)=>/^assets\/.*\.js$/.test(f.path));let protocol=false;
 for(const file of scripts){const bytes=readFileSync(new URL('../public/atlas-runtime/head-neck/'+file.path,import.meta.url));assert.equal(sha(bytes),file.sha256);if(new TextDecoder().decode(bytes).includes('vm-body-semantic-selection'))protocol=true;}
 assert(protocol,'The actual generated learner JavaScript includes the body protocol, not just source declarations');
 assert.equal(learner.patientDataIncluded,false);assert.equal(learner.clinicalApproved,false);
});
