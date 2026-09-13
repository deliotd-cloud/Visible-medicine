import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {headNeckModuleInputs,root} from './head-neck-module-inputs.mjs';
const compiled=await build({stdin:{contents:"export * from './lib/model-delivery';export * from './lib/study-links';export * from './integration/head-neck/regions';export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const {plan,models}=await headNeckModuleInputs(true);
assert.deepEqual(plan.scopes.map(s=>[s.region,s.regionalIds.length,s.nestedTargets.length]),[['head-neck',290,75],['thorax',157,9],['abdomen',106,16]]);
assert.equal(models.length,73);assert.equal(models.reduce((n,m)=>n+m.bytes,0),110546620);
const raw=JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
const original=JSON.stringify(raw),catalog=api.bodyDisplayCatalog(raw),base='/atlas-runtime/head-neck';
let links=0;
for(const scope of plan.scopes){
  for(const bundle of scope.bundles)assert(plan.bundles.some(b=>b.url===bundle.url&&b.sha256===bundle.sha256&&b.bytes===bundle.bytes));
  assert.deepEqual(scope.regionalIds,catalog.structures.filter(s=>s.regions.includes(scope.region)).map(s=>s.id));
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
assert.equal(links,653);assert.equal(JSON.stringify(raw),original);
for(const query of ['region=','region=pelvis','region=__proto__','region=THORAX','region=head-neck&region=thorax','region=thorax&region=thorax','region=../thorax'])assert.equal(api.parseRegionalModule(new URLSearchParams(query)),null);
assert.equal(api.parseRegionalModule(new URLSearchParams()),'head-neck');
assert.throws(()=>api.regionalStudyDeliveryUrl('/regions/thorax?region=head-neck','thorax',base),/routing field/);
assert.equal(api.regionalStudyDeliveryUrl('/regions/thorax','thorax',''),'/regions/thorax');
const c=await componentBuild({entryPoints:['integration/head-neck/framework.tsx'],bundle:true,write:false,format:'cjs',platform:'node'});
const module={exports:{}},require=createRequire(import.meta.url);runInNewContext(c.outputFiles[0].text,{module,exports:module.exports,require,URL,URLSearchParams});
const React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
for(const [href,want]of [['/regions/thorax',base+'/index.html?region=thorax'],['/regions/head-neck',base+'/index.html'],['/regions/abdomen',base+'/index.html?region=abdomen']]){
  const html=render(React.createElement(module.exports.Link,{href},'Study'));assert(html.includes('href="'+want+'"'));assert(!html.includes('target="_blank"'));
}
// A heart selection must never be silently substituted into head/neck.
const heart=catalog.structures.find(s=>s.name==='Heart');assert(heart);
const link=api.makeStudyLink(catalog,'thorax',heart.id,'both');assert(link);
assert.equal(api.resolveStudyLink(catalog,'head-neck',api.parseStudyLink(Object.fromEntries(new URL(link,'https://example.invalid').searchParams))).status,'rejected');
console.log(JSON.stringify({scopes:plan.scopes.map(s=>({region:s.region,root:s.regionalIds.length,nested:s.nestedTargets.length})),uniqueModels:models.length,modelBytes:models.reduce((n,m)=>n+m.bytes,0),sourceRoundTrips:links,staleAndDuplicateRejections:links*2,invalidRegionQueries:7,actualLocalNavigationRenders:3,privateData:false,clinicalApproval:false}));
