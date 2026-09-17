import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {headNeckModuleInputs,root,sha} from './head-neck-module-inputs.mjs';
import {regionalCompanions} from '../integration/head-neck/companions.mjs';

const compiled=await build({stdin:{contents:`
  export * from './lib/model-delivery';
  export * from './lib/independent-study-links';
  export * from './integration/head-neck/specimen-route';
  export * from './integration/head-neck/regions';
  export * from './lib/abdominal-wall';
  export * from './lib/hra-renal';
  export * from './lib/hepatic-biliary-context';
  export * from './lib/renal-relationships';
  export * from './lib/pancreatic';
  export {bodyDisplayCatalog} from './lib/body-display-catalog';
`,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const {plan,models}=await headNeckModuleInputs(true),scope=plan.scopes.find(s=>s.region==='abdomen');
const base='/atlas-runtime/head-neck',definitions=[api.abdominalWallDefinition,api.hraRenalDefinition];
const snapshot=JSON.stringify(definitions);
const dictionary=href=>{
  const p=new URL(href,'https://atlas.invalid').searchParams;
  return Object.fromEntries([...new Set(p.keys())].map(k=>[k,p.getAll(k).length===1?p.get(k):p.getAll(k)]));
};
assert.deepEqual(scope.independentSpecimens.map(s=>[s.key,s.license,s.surfaceIds.length,s.studyIds.length]),[
  ['bp3d3-abdominal-wall','CC BY-SA 2.1 JP',29,7],['hra-united-female-v1.10-kidneys','CC BY 4.0',82,9],
]);
for(const other of plan.scopes.filter(s=>['head-neck','thorax'].includes(s.region)))assert.equal(other.independentSpecimens.length,0);
for(const d of definitions){
  assert(d.catalog.structures.every(s=>s.regions.every(r=>r.startsWith('independent-'))));
  assert(!scope.regionalIds.some(id=>d.surfaces.some(s=>s.id===id)));
  for(const b of d.catalog.bundles)assert(models.some(m=>m.sha256===b.sha256&&m.bytes===b.bytes));
}
assert(!api.hraRenalDefinition.surfaces.some(s=>['VH_F_outer_cortex_of_kidney_L','VH_F_renal_column_R','VH_F_left_renal_vein'].includes(s.sourceName)));

// Independently exercise every abdominal context toggle/relationship used by the
// actual nested viewer. Check catalogue closure, not only root source counts.
const raw=JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
const parents=api.bodyDisplayCatalog(raw).structures.filter(s=>s.regions.includes('abdomen'));
let contextViews=0;
for(const parent of parents){
  const kinds=new Set(scope.nestedTargets.filter(t=>t.parentId===parent.id).map(t=>t.study));
  for(const kind of kinds){
    const [view,relationships]=kind==='hepatic'?[api.hepaticBiliaryViewCatalog,api.hepaticBiliaryRelationshipsFor(parent)]
      :kind==='renal'?[api.renalRelationshipViewCatalog,api.renalRelationshipsFor(parent)]
      :[api.pancreaticViewCatalog,[]];
    for(const context of [false,true])for(const relationship of [undefined,...relationships.map(r=>r.id)]){
      const c=view(parent,context,relationship);
      for(const s of c.structures){
        const bundle=c.bundles.find(b=>b.id===s.bundle);assert(bundle);
        assert(scope.bundles.some(b=>b.url===bundle.url&&b.sha256===bundle.sha256&&b.bytes===bundle.bytes));
      }
      contextViews++;
    }
  }
}
assert(contextViews>10);

let links=0,rejections=0;
for(const d of definitions){
  for(const study of [...d.studies,{id:null,view:'anterior',ids:d.surfaces.map(s=>s.id)}])for(const selectedId of study.ids){
    const original=await api.makeIndependentStudyLink(d,{selectedId,studyId:study.id,view:study.view});assert(original);
    assert.equal(api.independentStudyDeliveryUrl(original),original);
    const delivered=api.independentStudyDeliveryUrl(original,base),params=dictionary(delivered);
    const url=new URL(delivered,'https://atlas.invalid');
    assert.equal(url.pathname,base+'/index.html');
    assert.equal(api.parseRegionalModule(url.searchParams),'abdomen');
    const route=api.parseContainedSpecimen(params,'abdomen');assert.equal(route.status,'ready');
    const result=await api.resolveIndependentStudyLink(route.link,d);assert.equal(result.status,'ready');
    assert.equal(result.selectedId,selectedId);assert.equal(result.view,study.view);
    assert.equal(result.structureOnly,study.id===null);
    if(study.id)assert.deepEqual(new Set(d.surfaces.filter(s=>!result.state.hidden.includes(s.id)).map(s=>s.id)),new Set(study.ids));
    for(const region of ['head-neck','thorax',null]){assert.equal(api.parseContainedSpecimen(params,region).status,'invalid');rejections++;}
    for(const patch of [{refSource:'0'.repeat(64)},{refRevision:'0'.repeat(64)},{refFrame:'patient-lps'},
      {ref:[params.ref,params.ref]},{refUnknown:'x'},{structure:selectedId},{refStudy:['all','all']}]){
      const rejected=api.parseContainedSpecimen({...params,...patch},'abdomen');
      assert(rejected.status==='invalid'||(await api.resolveIndependentStudyLink(rejected.link,d)).status==='rejected');rejections++;
    }
    const other=definitions.find(other=>other!==d);
    assert.equal((await api.resolveIndependentStudyLink(route.link,other)).status,'rejected');rejections++;
    links++;
  }
}
assert.equal(api.parseContainedSpecimen({},'abdomen').status,'none');
for(const href of ['/specimens/kidneys','//evil.invalid/specimens/kidneys?ref=independent-1',
  '/specimens/abdominal-wall?ref=independent-1&refSpecimen=hra-united-female-v1.10-kidneys',
  '/specimens/unknown?ref=independent-1&refSpecimen=bp3d3-back-layers'])assert.throws(()=>api.independentStudyDeliveryUrl(href,base));

// Actual React composition and source/notice links, with only the GPU scene
// intercepted to inspect delivery props. This is not a browser-rendering claim.
const components=await componentBuild({stdin:{contents:`
  export {IndependentStudyView,IndependentStudyLinkControl} from './app/independent-study-navigation';
  export {KneeSpecimenView} from './app/um-knee-study';
  export {abdominalWallSupplement,abdominalWallSupplementFor} from './app/abdominal-wall-study';
  export {hraRenalSupplement,hraRenalSupplementFor} from './app/hra-renal-study';
`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',plugins:[{name:'scene-prop-observer',setup(b){
  b.onLoad({filter:/body-scene\.tsx$/},()=>({loader:'js',contents:'export function BodyScene(props){globalThis.sceneProps=props;return null;}export function retryBodyAssets(){}'}));
}}]});
const require=createRequire(new URL('../package.json',import.meta.url)),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const bridgeBuild=await componentBuild({entryPoints:['integration/head-neck/framework.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),bridge={exports:{}};
runInNewContext(bridgeBuild.outputFiles[0].text,{module:bridge,exports:bridge.exports,require,URL,URLSearchParams});
const module={exports:{}},sandbox={module,exports:module.exports,require:id=>id==='next/link'?{__esModule:true,default:bridge.exports.Link}:require(id),console,URL,URLSearchParams,crypto,TextEncoder,TextDecoder,structuredClone,setTimeout,clearTimeout};
runInNewContext(components.outputFiles[0].text,sandbox);
const ui=module.exports;
let renders=0;
for(const [i,d]of definitions.entries()){
  const factory=i===0?ui.abdominalWallSupplementFor:ui.hraRenalSupplementFor;
  const standalone=i===0?ui.abdominalWallSupplement:ui.hraRenalSupplement;
  assert.equal(render(factory().sourceDetails),render(standalone.sourceDetails));
  const supplement=factory(base),sources=render(supplement.sourceDetails);
  assert(sources.includes(base+'/models/'));assert(!sources.includes('href="/models/'));
  assert(sources.includes('/NOTICE.md'));
  render(React.createElement(ui.IndependentStudyView,{definition:d,supplement,assetBase:base}));
  assert.equal(sandbox.sceneProps.assetBase,base);
  for(const study of d.studies){
    const original=await api.makeIndependentStudyLink(d,{selectedId:study.selectedId,studyId:study.id,view:study.view});
    const nav=await api.resolveIndependentStudyLink(api.parseIndependentStudyLink(dictionary(original)),d);
    const html=render(React.createElement(ui.KneeSpecimenView,{specimen:d,supplement,assetBase:base,initialNavigation:nav}));
    assert.equal(sandbox.sceneProps.assetBase,base);assert.equal(sandbox.sceneProps.selectedId,study.selectedId);
    assert.match(html,/Link to this structure/);assert(!html.includes('/review/specimens'));renders++;
  }
  const props={definition:d,selectedId:d.surfaces[0].id,studyId:null,view:'anterior'};
  assert(render(React.createElement(ui.IndependentStudyLinkControl,props)).includes('/review/specimens'));
  assert(!render(React.createElement(ui.IndependentStudyLinkControl,{...props,assetBase:base})).includes('/review/specimens'));
}
assert.equal(JSON.stringify(definitions),snapshot,'No delivery rewrite of source anatomy, frames or teaching identity');

// Companion evidence is immutable and explicitly listed, not copied by glob.
assert.equal(new Set(regionalCompanions.map(([,to])=>to)).size,regionalCompanions.length);
assert(!regionalCompanions.some(([from])=>/original-source\.zip|renal-source\.glb|\.obj$/.test(from)));
const audit=JSON.parse(await readFile(new URL('../content/sources/bodyparts3d-v3-abdominal-wall/source-audit.json',import.meta.url),'utf8'));
for(const [file,evidence]of Object.entries(audit.evidence)){
  const source='content/sources/bodyparts3d-v3-abdominal-wall/'+file;
  assert(regionalCompanions.some(([from])=>from===source));
  assert.equal(sha(await readFile(new URL('../'+source,import.meta.url))),evidence.sha256);
}
assert.equal(sha(await readFile(new URL('../content/sources/hra-renal/metadata.json',import.meta.url))),api.hraRenalSource.metadataSha256);
console.log(JSON.stringify({contextViews,independentSourceSelections:111,sourceStudies:16,sourceRoundTrips:links,sourceRejections:rejections,actualStudyRenders:renders,companions:regionalCompanions.length,clinicalApproval:false}));
