import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {headNeckModuleInputs,root} from './head-neck-module-inputs.mjs';
const compiled=await build({stdin:{contents:"export * from './lib/model-delivery';export * from './lib/study-links';export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const {plan,models}=await headNeckModuleInputs();
assert.equal(plan.regionalIds.length,291);assert.equal(plan.nestedTargets.length,75);assert.equal(models.length,38);
assert(plan.regionalIds.includes('vm:anatomy:body:head-neck:unspecified:nerve:short-ciliary-nerve'));
assert(models.some(m=>m.sha256==='9272b6137e321e1ed243d0c79b8c3a022eb56f2954af2ec65dd8b06ebfe6e0a5'&&m.bytes===65264));
const raw=JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
const before=JSON.stringify(raw),catalog=api.bodyDisplayCatalog(raw),base='/atlas-runtime/head-neck';
let links=0;
for(const item of [...plan.regionalIds.map(id=>({id})),...plan.nestedTargets.map(t=>({id:t.parentId,nested:t}))]){
  const link=api.makeStudyLink(catalog,'head-neck',item.id,'both',null,item.nested);assert(link);
  const delivered=api.regionalStudyDeliveryUrl(link,'head-neck',base);
  assert.equal(delivered.split('?')[0],base+'/index.html');
  const params=Object.fromEntries(new URL(delivered,'https://example.invalid').searchParams);
  const resolved=api.resolveStudyLink(catalog,'head-neck',api.parseStudyLink(params));
  assert.equal(resolved.status,'ready');assert.equal(resolved.selected.id,item.id);
  if(item.nested)assert.equal(resolved.nested.structureId,item.nested.structureId);
  assert.equal(api.resolveStudyLink(catalog,'head-neck',api.parseStudyLink({...params,source:'0'.repeat(64)})).status,'rejected');
  assert.equal(api.parseStudyLink({...params,structure:[params.structure,params.structure]}).status,'invalid');
  links++;
}
assert.equal(JSON.stringify(raw),before,'No base-catalog mutation');
for(const model of plan.bundles)assert.equal(api.modelDeliveryUrl(model.url,base),base+model.url);
for(const invalid of ['https://example.invalid','//evil','/atlas-runtime/head-neck/../x','/atlas-runtime/head-neck?x','/atlas-runtime/head-neck/'])assert.throws(()=>api.modelDeliveryUrl('/models/bodyparts3d/x.glb',invalid));
for(const invalid of ['/regions/spine','//evil','/regions/head-neck-other','https://example.invalid','/regions/head-neck/../spine'])assert.throws(()=>api.regionalStudyDeliveryUrl(invalid,'head-neck',base));
const components=await componentBuild({entryPoints:['integration/head-neck/framework.tsx'],bundle:true,write:false,format:'cjs',platform:'node'});
const module={exports:{}},require=createRequire(import.meta.url);
runInNewContext(components.outputFiles[0].text,{module,exports:module.exports,require,URL,URLSearchParams});
const React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
for(const importedModule of [false,true]){
  const View=({label})=>React.createElement('p',null,label);
  const Dynamic=module.exports.dynamic(async()=>importedModule?{default:View}:View);
  const stream=await require('react-dom/server').renderToReadableStream(React.createElement(Dynamic,{label:'Nested study ready'}));
  await stream.allReady;
  assert((await new Response(stream).text()).includes('Nested study ready'),'Both next/dynamic loader shapes render');
}
for(const [href,destination,target]of [['/','/atlas','_top'],['/shoulder','/atlas/shoulder-3d','_top'],['/regions/head-neck','/atlas/head-neck-3d','_top'],['/regions/hand','/atlas/3d?region=hand','_top']]){
  const html=render(React.createElement(module.exports.Link,{href},'Open'));assert(html.includes('href="'+destination+'"'));if(target)assert(html.includes('target="'+target+'"'));
}
console.log(JSON.stringify({regionalSelections:291,nestedSelections:75,verifiedModels:models.length,modelBytes:models.reduce((n,b)=>n+b.bytes,0),roundTripLinks:links,staleAndDuplicateRejections:links*2,actualNavigationRenders:4,clinicalApproval:false},null,2));
