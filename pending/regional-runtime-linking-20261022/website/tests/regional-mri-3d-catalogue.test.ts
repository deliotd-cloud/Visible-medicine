import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';

// Bundle the real authored Atlas import graph; no replacement catalogue or source metadata.
const bundled=await build({stdin:{contents:`
 export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue';
 export {kneeReferenceSpecs} from './lib/regional-knee-3d-mappings';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
 export {parseStudyLink,resolveStudyLink} from './atlas-review/lib/study-links';
 export {parseSpecimenLink} from './atlas-review/lib/specimen-links';
 export {resolveSpecimenLink} from './atlas-review/lib/um-limb-navigation';
 export {lowerLimbStudySuffix} from './lib/lower-limb-study-transport';
 export {atlasReferenceRevisionCurrent} from './lib/atlas-reference-revision';
 export {regionalAtlasRuntimeBindingCurrent} from './lib/regional-atlas-runtime-binding';
 export {default as rawCatalog} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
 export {default as review} from './atlas-review/manifest.json';
 export {default as learner} from './public/atlas-runtime/head-neck/manifest.json';
 export {default as limb} from './public/atlas-runtime/lower-limb/manifest.json';
 export {default as limbInputs} from './public/atlas-runtime/lower-limb/source-inputs.json';
 export {default as viewer} from './public/atlas-review-viewer/manifest.json';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`) as any;
const {buildRegionalMri3dCatalogue,bodyDisplayCatalog,parseStudyLink,resolveStudyLink,parseSpecimenLink,resolveSpecimenLink,lowerLimbStudySuffix,atlasReferenceRevisionCurrent}=api;
const source={revision:'1'.repeat(64),region:'knee'};
const catalog=bodyDisplayCatalog(api.rawCatalog);
const binding={reviewRevision:api.review.revision,learnerRevision:api.learner.sourceCommit,limbRevision:api.limb.sourceCommit,viewerRevision:api.viewer.sourceCommit,reviewIntegration:api.review.websiteIntegrationSha256,viewerIntegration:api.viewer.websiteIntegrationSha256};
const clone=<T>(v:T):T=>structuredClone(v);
const find=(result:any,id:string,side:'left'|'right')=>result.entries.find((e:any)=>e.anatomyId===id&&e.sourceSide===side);
const params=(href:string)=>Object.fromEntries(new URL(href,'https://visible-medicine.invalid').searchParams);

test('canonical knee catalogue uses exact pinned Atlas binding and accepted public transport tuples',async()=>{
 const result=await buildRegionalMri3dCatalogue(source);
 assert(result);assert.equal(result.schema,'visible-medicine.regional-mri-3d/1');assert.equal(result.mriRevision,source.revision);
 assert.equal(result.atlasRevision,binding.reviewRevision);assert.match(result.mappingRevision,/^[a-f0-9]{64}$/);
 const patella=find(result,'anat.knee.bne.patella','left'),acl=find(result,'anat.knee.lig.anterior_cruciate_ligament','left');
 assert(patella?.targets.length);assert(acl?.targets.length);
 const body=patella.targets.find((t:any)=>t.kind==='body'),specimen=acl.targets.find((t:any)=>t.kind==='specimen');
 assert(body);assert(specimen);assert.equal(body.side,'left');assert.equal(specimen.side,'right');
 assert.equal(body.relation,'same-structure');assert.equal(specimen.relation,'same-structure');
 assert.equal(body.runtimeRevision,binding.learnerRevision);assert.equal(specimen.runtimeRevision,binding.limbRevision);
 assert.equal(params(body.href).atlasRevision,body.runtimeRevision);assert.equal(params(specimen.href).atlasRevision,specimen.runtimeRevision);
 assert.equal(atlasReferenceRevisionCurrent(params(body.href),binding.learnerRevision),true);
 assert.equal(atlasReferenceRevisionCurrent(params(specimen.href),binding.limbRevision),true);
 if(binding.limbRevision!==binding.reviewRevision)assert.equal(atlasReferenceRevisionCurrent(params(specimen.href),binding.reviewRevision),false);
 assert.equal(body.href.startsWith('/atlas/3d?'),true);assert.equal(specimen.href.startsWith('/atlas/lower-limb-3d?'),true);
 assert.equal(atlasReferenceRevisionCurrent({atlasRevision:result.atlasRevision},binding.reviewRevision),true);
 const bodyParams=params(body.href);assert.equal(resolveStudyLink(catalog,body.region,parseStudyLink(bodyParams)).status,'ready');
 const specimenParams=params(specimen.href);assert.equal(resolveSpecimenLink(parseSpecimenLink(specimenParams)).status,'ready');
 const suffix=lowerLimbStudySuffix(specimenParams);assert.equal(suffix,'?'+new URLSearchParams(Object.fromEntries(Object.entries(specimenParams).filter(([k])=>k!=='atlasRevision')) as Record<string,string>));
 assert.equal(new URLSearchParams(suffix!.slice(1)).get('specimenSource'),specimen.sourceHash);
 for(const target of [body,specimen]){
  assert(!/[?&](?:token|patient|scan|returnUrl|imageUrl)=/i.test(target.href));
  const url=new URL(target.href,'https://visible-medicine.invalid');assert.equal(url.origin,'https://visible-medicine.invalid');assert.equal(url.hash,'');
 }
});

test('stale or malformed MRI and Atlas bindings refuse entire catalogue',async()=>{
 for(const s of [{revision:'BAD',region:'knee'},{revision:source.revision,region:'thigh'}])assert.equal(await buildRegionalMri3dCatalogue(s),null);
 for(const patch of [{reviewRevision:'a'.repeat(40)},{learnerRevision:'a'.repeat(40)},{limbRevision:'a'.repeat(40)},{viewerRevision:'a'.repeat(40)},{reviewIntegration:'a'.repeat(64)},{viewerIntegration:'a'.repeat(64)}])
  assert.equal(await buildRegionalMri3dCatalogue(source,catalog,{...binding,...patch}),null,JSON.stringify(patch));
 assert.equal(await buildRegionalMri3dCatalogue(source,catalog,{reviewRevision:'a'.repeat(40),learnerRevision:'a'.repeat(40),limbRevision:'a'.repeat(40),viewerRevision:'a'.repeat(40),reviewIntegration:'a'.repeat(64),viewerIntegration:'a'.repeat(64)}),null);
});

test('independent runtime family requires every exact, unique semantic source input',()=>{
 const verify=(reviewFiles:any,runtimeInputs:any)=>api.regionalAtlasRuntimeBindingCurrent(binding,binding,reviewFiles,runtimeInputs);
 assert.equal(verify(api.review.files,api.limbInputs),true);
 const path='lib/um-limb-studies.ts';
 for(const mutate of [
  (rows:any[])=>rows.splice(rows.findIndex(row=>row.path===path),1),
  (rows:any[])=>rows.push(clone(rows.find(row=>row.path===path))),
  (rows:any[])=>{rows.find(row=>row.path===path).sha256='0'.repeat(64)},
 ]){const inputs=clone(api.limbInputs);mutate(inputs);assert.equal(verify(api.review.files,inputs),false);}
 for(const mutate of [
  (rows:any[])=>rows.splice(rows.findIndex(row=>row.path===path),1),
  (rows:any[])=>rows.push(clone(rows.find(row=>row.path===path))),
  (rows:any[])=>{rows.find(row=>row.path===path).sourceSha256='0'.repeat(64)},
 ]){const inputs=clone(api.review.files);mutate(inputs);assert.equal(verify(inputs,api.limbInputs),false);}
 assert.equal(verify(null,api.limbInputs),false);assert.equal(verify(api.review.files,{}),false);
});

test('exact canonical source hash, identity and laterality mutations remove only affected body mappings',async()=>{
 const base=await buildRegionalMri3dCatalogue(source,catalog,binding);
 assert(find(base,'anat.knee.bne.patella','left'));
 const targetId=find(base,'anat.knee.bne.patella','left').targets[0].id;
 const target=catalog.structures.find((s:any)=>s.id===targetId);assert(target);
 for(const change of [
  (c:any)=>{c.structures.find((s:any)=>s.id===targetId).name+=' changed'},
  (c:any)=>{c.structures.find((s:any)=>s.id===targetId).laterality='right'},
  (c:any)=>{c.bundles.find((b:any)=>b.id===target.bundle).sha256='0'.repeat(64)},
  (c:any)=>{c.structures.push(clone(c.structures.find((s:any)=>s.id===targetId)))},
 ]){const altered=clone(catalog);change(altered);const result=await buildRegionalMri3dCatalogue(source,altered,binding);assert.equal(find(result,'anat.knee.bne.patella','left'),undefined);}
});

test('authored parent/group relations are explicit; missing nerve or tendon never borrows nearby anatomy',async()=>{
 const result=await buildRegionalMri3dCatalogue(source);
 const parent=find(result,'anat.knee.bne.distal_femur','left');assert(parent?.targets.some((t:any)=>t.relation==='parent-reference'));
 const group=find(result,'anat.knee.men.medial_meniscus_anterior_horn','left');assert(group?.targets.some((t:any)=>t.relation==='group-reference'));
 for(const missing of ['anat.knee.nvs.tibial_nerve','anat.knee.tdn.patellar_tendon'])assert(!result.entries.some((e:any)=>e.anatomyId===missing));
 assert(!result.entries.some((e:any)=>e.sourceSide==='left'&&e.targets.some((t:any)=>t.kind==='specimen'&&t.side==='left')));
});

test('canonical mapping carries a separate exact-source teaching projection',async()=>{
 const result=await buildRegionalMri3dCatalogue(source);assert(result?.learning);
 assert.equal(result.learning.atlasRevision,result.atlasRevision);assert.equal(result.learning.mappingRevision,result.mappingRevision);
});
