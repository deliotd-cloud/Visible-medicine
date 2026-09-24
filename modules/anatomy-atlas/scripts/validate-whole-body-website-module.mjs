import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {headNeckModuleInputs,root} from './head-neck-module-inputs.mjs';
const compiled=await build({stdin:{contents:"export * from './lib/model-delivery';export * from './lib/specimen-links';export * from './lib/um-limb-navigation';export * from './lib/um-limb-studies';export * from './integration/head-neck/specimen-route';export * from './integration/head-neck/regions';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const {plan}=await headNeckModuleInputs(true),base='/atlas-runtime/head-neck';
const dictionary=url=>{const q=new URL(url,'https://atlas.invalid').searchParams;return Object.fromEntries([...new Set(q.keys())].map(k=>[k,q.getAll(k).length===1?q.get(k):q.getAll(k)]));};
const components=await componentBuild({stdin:{contents:"export {KneeSpecimenView} from './app/um-knee-study';export {SpecimenStudyLink} from './app/specimen-study-link';",resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',plugins:[{name:'observe-scene',setup(b){b.onLoad({filter:/body-scene\.tsx$/},()=>({loader:'js',contents:'export function BodyScene(props){globalThis.sceneProps=props;return null;}export function retryBodyAssets(){}'}));}}]});
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup,module={exports:{}};
const bridgeBuild=await componentBuild({entryPoints:['integration/head-neck/framework.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),bridge={exports:{}};
runInNewContext(bridgeBuild.outputFiles[0].text,{module:bridge,exports:bridge.exports,require,URL,URLSearchParams});
const sandbox={module,exports:module.exports,require:id=>id==='next/link'?{__esModule:true,default:bridge.exports.Link}:require(id),console,URL,URLSearchParams,crypto,TextEncoder,TextDecoder,structuredClone,setTimeout,clearTimeout};runInNewContext(components.outputFiles[0].text,sandbox);
let links=0,rejections=0,renders=0;
for(const region of ['pelvis','thigh','leg','foot']){
  const scope=plan.scopes.find(s=>s.region===region);
  assert.equal(api.containedLimbStudyBase(region),base+'/index.html?region='+region);
  for(const d of Object.values(api.limbDefinitions)){
    assert.deepEqual(scope.independentSpecimens.find(s=>s.key===d.key).surfaceIds,d.surfaces.map(s=>s.id));
    assert.deepEqual(scope.independentSpecimens.find(s=>s.key===d.key).sourceFrame,d.catalog.coordinateSystem);
    for(const study of d.studies){
      const url=api.makeSpecimenLink(d,{selectedId:study.selectedId,studyId:study.id,view:study.view,topic:null});
      const params=dictionary(api.containedLimbStudyBase(region)+'&'+url.split('?')[1]);
      const route=api.parseContainedSpecimen(params,region);assert.equal(route.status,'ready');assert.equal(route.kind,'lower-limb');
      const resolved=api.resolveSpecimenLink(route.link);assert.equal(resolved.status,'ready');assert.equal(resolved.selectedId,study.selectedId);
      assert.deepEqual(new Set(d.surfaces.filter(s=>!resolved.state.hidden.includes(s.id)).map(s=>s.id)),new Set(study.ids));links++;
      for(const other of ['head-neck','thorax','abdomen','spine','whole-body','hand','forearm','shoulder-arm',null]){
        assert.equal(api.parseContainedSpecimen(params,other).status,'invalid');rejections++;
      }
      for(const patch of [{specimenSource:'0'.repeat(64)},{specimenRevision:'0'.repeat(64)},{specimen:[params.specimen,params.specimen]},{ref:'independent-1'},{structure:study.selectedId}]){
        const rejected=api.parseContainedSpecimen({...params,...patch},region);
        assert(rejected.status==='invalid'||api.resolveSpecimenLink(rejected.link).status==='rejected');rejections++;
      }
      const html=render(React.createElement(module.exports.KneeSpecimenView,{specimen:d,assetBase:base,initialNavigation:resolved,studyLink:(definition,selectedId,studyId,view)=>React.createElement(module.exports.SpecimenStudyLink,{definition,selectedId,studyId,view,basePath:api.containedLimbStudyBase(region),reviewAvailable:false})}));
      assert.equal(sandbox.sceneProps.assetBase,base);assert.equal(sandbox.sceneProps.selectedId,study.selectedId);
      assert(html.includes('region='+region+'&amp;specimen=um-limb-1'));assert(!html.includes('/review/specimens'));renders++;
    }
  }
}
for(const bad of ['__proto__','shoulder-arm','head-neck','whole-body','../foot','foot&specimen=x'])assert.throws(()=>api.containedLimbStudyBase(bad));
const whole=plan.scopes.find(s=>s.region==='whole-body');
assert.equal(whole.regionalIds.length,1104);assert.equal(new Set(whole.regionalIds).size,1104);
assert.equal(whole.nestedTargets.length,106);
assert.deepEqual(whole.independentSpecimens.map(s=>s.key),['bp3d3-back-layers','hra-united-female-v1.10-pelvis','hra-united-female-v1.10-kidneys']);
for(const scope of plan.scopes)assert.equal(api.regionalHostHref(scope.region),api.regionalModules[scope.region].website);
for(const bad of ['__proto__','constructor','not-a-region'])assert.equal(api.regionalHostHref(bad),null);
assert.equal(api.regionalStudyDeliveryUrl('/?study=body-1','whole-body',base),base+'/index.html?region=whole-body&study=body-1');
for(const bad of ['/regions/whole-body?study=x','//evil/','/?region=foot','/regions/hand'])assert.throws(()=>api.regionalStudyDeliveryUrl(bad,'whole-body',base));
const main=await readFile(new URL('../integration/head-neck/main.tsx',import.meta.url),'utf8');
assert(main.includes('initialRegion={region}'));assert(!main.includes('regionNavigation='));
console.log(JSON.stringify({containedLimbRegions:4,sourceBoundStudyLinks:links,rejectedRoutesAndRevisions:rejections,actualStudyRenders:renders,wholeBodyRoot:1104,wholeBodyNested:106,additionalPermanentControls:0,clinicalApproval:false}));
