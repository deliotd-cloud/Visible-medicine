import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {preCubitalProfiles} from './cubital-study-history.mjs';
const compiled=await build({stdin:{contents:`export * from './content/cubital-studies';export * from './lib/cubital-studies';export * from './lib/limb-vascular-studies';export * from './app/dissection-data';export * from './lib/body-display-catalog';export * from './lib/study-links';export * from './lib/study-library';export * from './lib/dissection-scope';export {bodyLesson} from './app/body-content';export {contentTabs} from './lib/content-types';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const a=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const root=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=a.bodyDisplayCatalog(root);
const pins=JSON.parse(await readFile('content/cubital-study-pins.json')),original=JSON.stringify(catalog),ids=ss=>ss.map(s=>s.id).sort();
const saved=await exactSourceHistoryApi(pins.sourceCommit);
assert.deepEqual(a.bodyDisplayCatalog(root),saved.bodyDisplayCatalog(root));
assert.deepEqual(preCubitalProfiles(a.dissectionProfiles),saved.dissectionProfiles);
let unchangedTopics=0;
for(const s of catalog.structures)for(const t of a.contentTabs){assert.deepEqual(a.bodyLesson(s,t),saved.bodyLesson(s,t));unchangedTopics++;}
assert.equal(pins.entries.length,32);assert.equal(pins.bundles.length,9);
for(const b of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
let scopes=0,rejected=0,historyActions=0;
for(const study of a.cubitalStudies){
 const keys=new Set([...study.targetFmaIds,...study.context.flatMap(r=>r.fmaIds)]);
 assert(a.limbVascularStudyReady(catalog,'whole-body',study.id));
 assert(!a.cubitalStudyReady(null,'whole-body',study.id));
 for(const region of catalog.regions.map(r=>r.id))if(region!=='whole-body')assert(!a.cubitalStudyReady(catalog,region,study.id));
 for(const side of ['both','left','right']){
  const scope=a.bodyStudyScope(catalog,'whole-body',side),profile=a.dissectionProfiles['whole-body'];
  const state=a.dissectionReducer(a.initialDissection,{type:'focus',id:study.id});
  assert.equal(a.dissectionReducer(state,a.dissectionScopeAction(catalog,profile,'whole-body',side)),state);
  const visible=a.resolveDissection(scope,profile,state).visible;
  assert.deepEqual(ids(visible),ids(scope.filter(s=>keys.has(s.fmaId))));assert.equal(visible.length,side==='both'?26:13);
  const recipe=a.studyLibrary(scope,profile).flatMap(c=>c.recipes).find(r=>r.id===study.id);assert(recipe.available);assert.deepEqual(ids(recipe.visible),ids(visible));
  assert.equal(recipe.targets.length,(study.id==='cubital-muscle-arterial'?16:6)/(side==='both'?1:2));
  const input={catalog,region:'whole-body',recipeId:study.id,structures:scope,visibleIds:ids(visible),enabled:true};
  const box=a.cubitalStudyBounds(input);assert(box);for(const i of [0,1,2])assert(box.max[i]>box.min[i]);
  if(side==='left')assert(box.min[0]>0);if(side==='right')assert(box.max[0]<0);
  for(const patch of [{enabled:false},{region:'forearm'},{visibleIds:[]},{visibleIds:[...ids(visible),visible[0].id]},{visibleIds:[...ids(visible),'not-a-source']},{recipeId:'assembled'}])assert.equal(a.cubitalStudyBounds({...input,...patch}),null);
  const added=scope.find(s=>!keys.has(s.fmaId));assert.equal(a.cubitalStudyBounds({...input,visibleIds:[...ids(visible),added.id]}),null);
  box.min[0]=999;assert.notEqual(a.cubitalStudyBounds(input).min[0],999,'Detached camera bounds');
  for(const target of recipe.targets){
   const removed=a.dissectionReducer(state,{type:'remove',id:target.id});
   assert(!a.resolveDissection(scope,profile,removed).visible.some(s=>s.id===target.id));
   const undo=a.dissectionReducer(removed,{type:'undo'});assert.deepEqual(ids(a.resolveDissection(scope,profile,undo).visible),ids(visible));
   const redo=a.dissectionReducer(undo,{type:'redo'});assert(!a.resolveDissection(scope,profile,redo).visible.some(s=>s.id===target.id));historyActions+=3;
  }
  scopes++;
 }
 for(const pin of pins.entries)for(const mutate of [s=>s.name+=' altered',s=>s.fmaId+='x',s=>s.laterality=s.laterality==='left'?'right':'left',s=>s.bounds.min[0]+=.1,s=>s.regions=['other'],s=>s.sourceTree='altered',s=>s.sources[0].file+='altered']){
  const copy=structuredClone(catalog);mutate(copy.structures.find(s=>s.id===pin.id));assert(!a.cubitalStudyReady(copy,'whole-body',study.id));rejected++;
 }
 for(const pin of pins.entries){
  const missing={...catalog,structures:catalog.structures.filter(s=>s.id!==pin.id)};assert(!a.cubitalStudyReady(missing,'whole-body',study.id));
  const duplicate={...catalog,structures:[...catalog.structures,{...pin,regions:['other']} ]};assert(!a.cubitalStudyReady(duplicate,'whole-body',study.id));rejected+=2;
 }
 for(const b of pins.bundles){const copy=structuredClone(catalog);copy.bundles.find(x=>x.id===b.id).sha256='0'.repeat(64);assert(!a.cubitalStudyReady(copy,'whole-body',study.id));rejected++;}
}
const changed=structuredClone(a.dissectionProfiles);changed.hand.title+=' altered';assert.throws(()=>preCubitalProfiles(changed));
assert.equal(JSON.stringify(catalog),original,'No source mutation');
const report={source:pins.sourceCommit,studies:2,selections:32,bundles:9,scopes,historyActions,rejectedIdentityMutations:rejected,unchangedTopics,priorRecipesUnchanged:true,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/cubital-studies-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
