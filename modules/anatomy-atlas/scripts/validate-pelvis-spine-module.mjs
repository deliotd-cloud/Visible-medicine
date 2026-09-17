import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {headNeckModuleInputs,root,sha} from './head-neck-module-inputs.mjs';
import {regionalCompanions} from '../integration/head-neck/companions.mjs';
const compiled=await build({stdin:{contents:`export * from './lib/model-delivery';export * from './lib/independent-study-links';export * from './lib/um-limb-navigation';export * from './lib/specimen-links';export * from './integration/head-neck/specimen-route';export * from './lib/back-layers';export * from './lib/hra-pelvis';export * from './lib/um-limb-studies';`,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const {plan,models}=await headNeckModuleInputs(true),base='/atlas-runtime/head-neck';
const definitions=[[api.backLayersDefinition,'spine','back-layers'],[api.hraPelvisDefinition,'pelvis','female-pelvis']];
const before=JSON.stringify([definitions,api.limbDefinitions]);
const dictionary=url=>{const q=new URL(url,'https://atlas.invalid').searchParams;return Object.fromEntries([...new Set(q.keys())].map(k=>[k,q.getAll(k).length===1?q.get(k):q.getAll(k)]));};
let links=0,rejections=0;
for(const[d,region,kind]of definitions){
  const scope=plan.scopes.find(s=>s.region===region),delivered=scope.independentSpecimens.find(s=>s.key===d.key);
  assert.deepEqual(delivered.surfaceIds,d.surfaces.map(s=>s.id));assert.deepEqual(delivered.studyIds,d.studies.map(s=>s.id));
  assert.deepEqual(delivered.sourceFrame,d.catalog.coordinateSystem);
  for(const b of d.catalog.bundles)assert(models.some(m=>m.sha256===b.sha256&&m.bytes===b.bytes));
  for(const study of [...d.studies,{id:null,view:'anterior',ids:d.surfaces.map(s=>s.id)}])for(const selectedId of study.ids){
    const original=await api.makeIndependentStudyLink(d,{selectedId,studyId:study.id,view:study.view});assert(original);
    const params=dictionary(api.independentStudyDeliveryUrl(original,base));assert.equal(params.region,region);
    const route=api.parseContainedSpecimen(params,region);assert.equal(route.status,'ready');assert.equal(route.kind,kind);
    const resolved=await api.resolveIndependentStudyLink(route.link,d);assert.equal(resolved.status,'ready');assert.equal(resolved.selectedId,selectedId);assert.equal(resolved.view,study.view);
    assert.deepEqual(new Set(d.surfaces.filter(s=>!resolved.state.hidden.includes(s.id)).map(s=>s.id)),new Set(study.ids));
    assert.equal(resolved.structureOnly,study.id===null);assert(!resolved.state.hidden.includes(selectedId));
    assert.deepEqual(resolved.state.history,[]);assert.deepEqual(resolved.state.future,[]);
    for(const other of ['head-neck','thorax','abdomen',region==='spine'?'pelvis':'spine',null]){assert.equal(api.parseContainedSpecimen(params,other).status,'invalid');rejections++;}
    for(const patch of [{refSource:'0'.repeat(64)},{refRevision:'0'.repeat(64)},{refFrame:'patient-lps'},{ref:[params.ref,params.ref]},{structure:selectedId},{specimen:'um-limb-1'}]){
      const rejected=api.parseContainedSpecimen({...params,...patch},region);
      assert(rejected.status==='invalid'||(await api.resolveIndependentStudyLink(rejected.link,d)).status==='rejected');rejections++;
    }links++;
  }
}
for(const d of Object.values(api.limbDefinitions)){
  const scope=plan.scopes.find(s=>s.region==='pelvis');
  assert.deepEqual(scope.independentSpecimens.find(s=>s.key===d.key).surfaceIds,d.surfaces.map(s=>s.id));
  for(const study of d.studies)for(const selectedId of study.ids){
    const original=api.makeSpecimenLink(d,{selectedId,studyId:study.id,view:study.view,topic:null});assert(original);
    const params=dictionary(base+'/index.html?region=pelvis&'+original.split('?')[1]);
    const route=api.parseContainedSpecimen(params,'pelvis');assert.equal(route.status,'ready');assert.equal(route.kind,'lower-limb');
    const resolved=api.resolveSpecimenLink(route.link);assert.equal(resolved.status,'ready');assert.equal(resolved.selectedId,selectedId);
    assert.deepEqual(new Set(d.surfaces.filter(s=>!resolved.state.hidden.includes(s.id)).map(s=>s.id)),new Set(study.ids));
    for(const patch of [{specimenSource:'0'.repeat(64)},{specimenRevision:'0'.repeat(64)},{specimen:[params.specimen,params.specimen]},{ref:'independent-1'},{structure:selectedId}]){
      const rejected=api.parseContainedSpecimen({...params,...patch},'pelvis');assert(rejected.status==='invalid'||api.resolveSpecimenLink(rejected.link).status==='rejected');rejections++;
    }
    assert.equal(api.parseContainedSpecimen(params,'spine').status,'invalid');rejections++;links++;
  }
}
const components=await componentBuild({stdin:{contents:`export {IndependentStudyView} from './app/independent-study-navigation';export {KneeSpecimenView} from './app/um-knee-study';export {SpecimenStudyLink} from './app/specimen-study-link';export {backLayersSupplementFor} from './app/back-layers-study';export {hraPelvisSupplementFor} from './app/hra-pelvis-study';`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',plugins:[{name:'observe-scene',setup(b){b.onLoad({filter:/body-scene\.tsx$/},()=>({loader:'js',contents:'export function BodyScene(props){globalThis.sceneProps=props;return null;}export function retryBodyAssets(){}'}));}}]});
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup,module={exports:{}};
const bridgeBuild=await componentBuild({entryPoints:['integration/head-neck/framework.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),bridge={exports:{}};
runInNewContext(bridgeBuild.outputFiles[0].text,{module:bridge,exports:bridge.exports,require,URL,URLSearchParams});
const sandbox={module,exports:module.exports,require:id=>id==='next/link'?{__esModule:true,default:bridge.exports.Link}:require(id),console,URL,URLSearchParams,crypto,TextEncoder,TextDecoder,structuredClone,setTimeout,clearTimeout};runInNewContext(components.outputFiles[0].text,sandbox);
const ui=module.exports;let renders=0;
for(const[d,,kind]of definitions){
  const supplement=(kind==='back-layers'?ui.backLayersSupplementFor:ui.hraPelvisSupplementFor)(base);
  const sources=render(supplement.sourceDetails);assert(sources.includes(base+'/models/'));assert(!sources.includes('href="/models/'));
  render(React.createElement(ui.IndependentStudyView,{definition:d,supplement,assetBase:base}));assert.equal(sandbox.sceneProps.assetBase,base);
  for(const study of d.studies){
    const href=await api.makeIndependentStudyLink(d,{selectedId:study.selectedId,studyId:study.id,view:study.view});
    const nav=await api.resolveIndependentStudyLink(api.parseIndependentStudyLink(dictionary(href)),d);
    const html=render(React.createElement(ui.KneeSpecimenView,{specimen:d,supplement,assetBase:base,initialNavigation:nav}));
    assert.equal(sandbox.sceneProps.assetBase,base);assert.equal(sandbox.sceneProps.selectedId,study.selectedId);assert(!html.includes('/review/specimens'));renders++;
  }
}
for(const d of Object.values(api.limbDefinitions))for(const study of d.studies){
  const nav=api.resolveSpecimenLink(api.parseSpecimenLink(dictionary(api.makeSpecimenLink(d,{selectedId:study.selectedId,studyId:study.id,view:study.view,topic:null}))));
  const html=render(React.createElement(ui.KneeSpecimenView,{specimen:d,assetBase:base,initialNavigation:nav,studyLink:(definition,selectedId,studyId,view)=>React.createElement(ui.SpecimenStudyLink,{definition,selectedId,studyId,view,basePath:base+'/index.html?region=pelvis',reviewAvailable:false})}));
  assert.equal(sandbox.sceneProps.assetBase,base);assert.equal(sandbox.sceneProps.selectedId,study.selectedId);assert(html.includes('region=pelvis&amp;specimen=um-limb-1'));assert(!html.includes('/review/specimens'));renders++;
}
assert.equal(JSON.stringify([definitions,api.limbDefinitions]),before);
for(const name of ['NOTICE.md','license-legalcode.html','source-readme.html','source-audit.json','specimen-data.ts.txt'])assert(regionalCompanions.some(([,to])=>to==='models/bodyparts3d-v3/back-layers/'+name));
const audit=JSON.parse(await readFile(new URL('../content/sources/bodyparts3d-v3-back-layers/source-audit.json',import.meta.url)));
for(const[file,evidence]of Object.entries(audit.evidence)){const path='content/sources/bodyparts3d-v3-back-layers/'+file;assert(regionalCompanions.some(([from])=>from===path));assert.equal(sha(await readFile(new URL('../'+path,import.meta.url))),evidence.sha256);}
assert(!regionalCompanions.some(([from])=>/\.obj$|original-source\.zip|pelvic-source\.glb/.test(from)));
console.log(JSON.stringify({regions:['pelvis','spine'],rootSelections:196,nestedSelections:4,independentSelections:156,sourceRoundTrips:links,rejections,actualStudyRenders:renders,modelCount:models.length,clinicalApproval:false}));
