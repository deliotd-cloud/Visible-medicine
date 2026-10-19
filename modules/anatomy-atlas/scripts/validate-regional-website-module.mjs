import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {headNeckModuleInputs,root,sha} from './head-neck-module-inputs.mjs';
import admitted from './fixtures/regional-module-scope-6ba.json' with {type:'json'};
const compiled=await build({stdin:{contents:"export * from './lib/model-delivery';export * from './lib/study-links';export * from './integration/head-neck/regions';export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const {plan,models}=await headNeckModuleInputs(true);
assert.equal(sha(await readFile(new URL('./fixtures/regional-module-scope-6ba.json',import.meta.url))),'887ed0adccf001ad17429b4d71c7e1b9f7b0298cec003f2ffe49c951fa7469f2','Frozen admitted scope fixture changed');
assert.equal(admitted.schema,'vm-regional-module-admitted-scope-1');
assert.equal(admitted.sourceCommit,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
assert.equal(admitted.manifestSha256,'9db24686c007ba7306c692713c955be3d6e5fe4f61e0105c9674539dce62c421');
assert.equal(sha(JSON.stringify(plan.scopes)),admitted.scopesSha256,'Current ordered scope records differ from admitted 6ba module');
assert.equal(sha(JSON.stringify(plan.bundles)),admitted.modelBundlesSha256,'Current ordered model records differ from admitted 6ba module');
assert.equal(sha(JSON.stringify({scopes:plan.scopes,bundles:plan.bundles})),admitted.planSha256,'Current scope/model plan differs from admitted 6ba module');
assert.deepEqual(plan.bundles.filter(b=>b.id===admitted.admittedAdditionalModel.id),[admitted.admittedAdditionalModel]);
for(const region of admitted.admittedAdditionalStudy.scopes){
  const targets=plan.scopes.find(s=>s.region===region).nestedTargets.filter(t=>t.study===admitted.admittedAdditionalStudy.study&&admitted.admittedAdditionalStudy.structureIds.includes(t.structureId));
  assert.deepEqual(targets.map(t=>t.structureId),admitted.admittedAdditionalStudy.structureIds);
  assert(targets.every(t=>t.parentId===admitted.admittedAdditionalStudy.parentId&&t.sourceHash===admitted.admittedAdditionalStudy.sourceHash));
}
// Three separately source-audited additions since the original 1,101-root module.
const additions=[
  ['head-neck','vm:anatomy:body:head-neck:unspecified:nerve:short-ciliary-nerve','9272b6137e321e1ed243d0c79b8c3a022eb56f2954af2ec65dd8b06ebfe6e0a5',65264],
  ['thorax','vm:anatomy:body:thorax:unspecified:vessel:anterior-cardiac-vein','ff72014e957d661a16892581db9e371482541302e4a3203ba3e84cac9f5f1928',17252],
  ['pelvis','vm:anatomy:body:pelvis:midline:organ:corpus-spongiosum-of-penis','f704a79a0fe2c9b30a93380d36ab31cb241f1ca81f701b870ff288bfb616d826',11856],
];
for(const [region,id,hash,bytes] of additions){
  assert(plan.scopes.find(s=>s.region===region).regionalIds.includes(id));
  assert(plan.scopes.find(s=>s.region==='whole-body').regionalIds.includes(id));
  assert.equal(models.filter(m=>m.sha256===hash&&m.bytes===bytes).length,1);
}
const retained=[['head-neck',291,77],['thorax',158,11],['abdomen',106,16],['pelvis',82,4],['spine',115,0]];
assert.deepEqual(plan.scopes.slice(0,5).map(s=>[s.region,s.regionalIds.length,s.nestedTargets.length]),retained);
assert.deepEqual(plan.scopes.slice(5).map(s=>[s.region,s.regionalIds.length,s.nestedTargets.length]),[['shoulder-arm',115,0],['forearm',86,0],['hand',124,0],['thigh',95,4],['leg',76,4],['foot',122,0],['whole-body',1104,108]]);
// The source-reviewed celiac display correction is a separate retained model,
// already present in the current website inventory; do not count it as a new
// forearm teaching asset.
assert.equal(models.length,136);assert.equal(models.reduce((n,m)=>n+m.bytes,0),198300644);
const venousHash='4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12';
const venousPath='models/bodyparts3d/coronary-venous/coronary-venous.glb';
assert.equal(models.filter(m=>m.path===venousPath&&m.sha256===venousHash&&m.bytes===40996).length,1);
for(const region of ['thorax','whole-body']){
  const targets=plan.scopes.find(s=>s.region===region).nestedTargets.filter(t=>t.study==='coronary-venous');
  assert.deepEqual(targets.map(t=>t.structureId),[
    'vm:anatomy:body:thorax:unpaired:vessel:coronary-sinus',
    'vm:anatomy:body:thorax:unpaired:vessel:small-cardiac-vein',
  ]);
  assert(targets.every(t=>t.parentId==='vm:anatomy:body:thorax:unpaired:organ:heart'&&t.sourceHash===venousHash));
}
const oldModels=new Map(plan.scopes.slice(0,5).flatMap(s=>s.bundles).map(b=>[b.url,b]));
assert.equal(oldModels.size,99);assert.equal([...oldModels.values()].reduce((n,b)=>n+b.bytes,0),176738772);
const raw=JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
const original=JSON.stringify(raw),catalog=api.bodyDisplayCatalog(raw),base='/atlas-runtime/head-neck';
let links=0;
for(const scope of plan.scopes){
  for(const bundle of scope.bundles)assert(plan.bundles.some(b=>b.url===bundle.url&&b.sha256===bundle.sha256&&b.bytes===bundle.bytes));
  assert.deepEqual(scope.regionalIds,catalog.structures.filter(s=>scope.region==='whole-body'||s.regions.includes(scope.region)).map(s=>s.id));
  for(const item of [...scope.regionalIds.map(id=>({id})),...scope.nestedTargets.map(t=>({id:t.parentId,nested:t}))]){
    const link=api.makeStudyLink(catalog,scope.region,item.id,'both',null,item.nested);assert(link);
    const delivered=api.regionalStudyDeliveryUrl(link,scope.region,base),url=new URL(delivered,'https://example.invalid');
    assert.equal(url.pathname,base+'/index.html');assert.equal(api.parseRegionalModule(url.searchParams),scope.region);
    const params=Object.fromEntries(url.searchParams),resolved=api.resolveStudyLink(catalog,scope.region,api.parseStudyLink(params));
    assert.equal(resolved.status,'ready');assert.equal(resolved.selected.id,item.id);
    if(item.nested)assert.equal(resolved.nested.structureId,item.nested.structureId);
    assert.equal(api.resolveStudyLink(catalog,scope.region,api.parseStudyLink({...params,source:'0'.repeat(64)})).status,'rejected');
    assert.equal(api.parseStudyLink({...params,structure:[params.structure,params.structure]}).status,'invalid');links++;
  }
}
assert.equal(links,2698);assert.equal(JSON.stringify(raw),original);
for(const query of ['region=','region=not-a-region','region=__proto__','region=THORAX','region=head-neck&region=thorax','region=thorax&region=thorax','region=../thorax'])assert.equal(api.parseRegionalModule(new URLSearchParams(query)),null);
assert.equal(api.parseRegionalModule(new URLSearchParams()),'head-neck');
assert.throws(()=>api.regionalStudyDeliveryUrl('/regions/thorax?region=head-neck','thorax',base),/routing field/);
assert.equal(api.regionalStudyDeliveryUrl('/regions/thorax','thorax',''),'/regions/thorax');
const c=await componentBuild({entryPoints:['integration/head-neck/framework.tsx'],bundle:true,write:false,format:'cjs',platform:'node'});
const module={exports:{}},require=createRequire(import.meta.url);runInNewContext(c.outputFiles[0].text,{module,exports:module.exports,require,URL,URLSearchParams});
const React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
for(const [region,item]of Object.entries(api.regionalModules).filter(([region])=>region!=='whole-body')){
  const html=render(React.createElement(module.exports.Link,{href:'/regions/'+region},'Study'));assert(html.includes('href="'+item.website+'"'));assert(html.includes('target="_top"'));assert(!html.includes('target="_blank"'));
}
// A heart selection must never be silently substituted into head/neck.
const heart=catalog.structures.find(s=>s.name==='Heart');assert(heart);
const link=api.makeStudyLink(catalog,'thorax',heart.id,'both');assert(link);
assert.equal(api.resolveStudyLink(catalog,'head-neck',api.parseStudyLink(Object.fromEntries(new URL(link,'https://example.invalid').searchParams))).status,'rejected');
console.log(JSON.stringify({scopes:plan.scopes.map(s=>({region:s.region,root:s.regionalIds.length,nested:s.nestedTargets.length})),uniqueModels:models.length,retainedModelCount:oldModels.size,modelBytes:models.reduce((n,m)=>n+m.bytes,0),sourceRoundTrips:links,staleAndDuplicateRejections:links*2,invalidRegionQueries:7,actualHostNavigationRenders:11,privateData:false,clinicalApproval:false}));
