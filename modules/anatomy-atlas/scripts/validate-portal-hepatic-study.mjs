import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {prePortalHepaticProfiles} from './portal-hepatic-study-history.mjs';
const compiled=await build({stdin:{contents:"export * from './content/portal-hepatic-study';export * from './lib/portal-hepatic-study';export * from './lib/limb-vascular-studies';export * from './app/dissection-data';export * from './lib/body-display-catalog';export * from './lib/study-library';export * from './lib/study-links';export * from './lib/dissection-scope';export {bodyLesson} from './app/body-content';export {contentTabs} from './lib/content-types';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const a=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=a.bodyDisplayCatalog(raw);
const pins=JSON.parse(await readFile('content/portal-hepatic-study-pins.json')),saved=await exactSourceHistoryApi(pins.sourceCommit);
assert.deepEqual(catalog,saved.bodyDisplayCatalog(raw));assert.deepEqual(prePortalHepaticProfiles(a.dissectionProfiles),saved.dissectionProfiles);
const original=JSON.stringify(catalog),study=a.portalHepaticStudy,keys=new Set(a.portalHepaticStudyFmaIds),ids=ss=>ss.map(s=>s.id).sort();
assert.equal(pins.entries.length,5);assert.equal(pins.bundles.length,2);
for(const b of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+b.url.split('?')[0])).digest('hex'),b.sha256);
let unchangedTopics=0,rejected=0,historyActions=0,sideTransitions=0;
for(const s of catalog.structures)for(const tab of a.contentTabs){assert.deepEqual(a.bodyLesson(s,tab),saved.bodyLesson(s,tab));unchangedTopics++;}
assert(a.limbVascularStudyReady(catalog,'abdomen',study.id));assert(!a.portalHepaticStudyReady(null,'abdomen',study.id));
for(const region of catalog.regions.map(r=>r.id))if(region!=='abdomen')assert(!a.portalHepaticStudyReady(catalog,region,study.id));
for(const side of ['both','left','right']){
 const scope=a.bodyStudyScope(catalog,'abdomen',side),profile=a.dissectionProfiles.abdomen;
 const state=a.dissectionReducer(a.initialDissection,{type:'focus',id:study.id});
 assert.equal(a.dissectionReducer(state,a.dissectionScopeAction(catalog,profile,'abdomen',side)),state);
 const visible=a.resolveDissection(scope,profile,state).visible;
 assert.deepEqual(ids(visible),ids(scope.filter(s=>keys.has(s.fmaId))));assert.equal(visible.length,side==='both'?5:4);
 const recipe=a.studyLibrary(scope,profile).flatMap(c=>c.recipes).filter(r=>r.id===study.id);assert.equal(recipe.length,1);assert(recipe[0].available);
 assert.deepEqual(ids(recipe[0].visible),ids(visible));assert.equal(recipe[0].targets.length,side==='both'?3:2);
 for(const target of visible){
  const removed=a.dissectionReducer(state,{type:'remove',id:target.id});assert(!a.resolveDissection(scope,profile,removed).visible.some(s=>s.id===target.id));
  const undo=a.dissectionReducer(removed,{type:'undo'});assert.deepEqual(ids(a.resolveDissection(scope,profile,undo).visible),ids(visible));
  const redo=a.dissectionReducer(undo,{type:'redo'});assert(!a.resolveDissection(scope,profile,redo).visible.some(s=>s.id===target.id));historyActions+=3;
 }
}
// A populated history must remain usable across successive side changes without
// rendering a contralateral selection retained in an undo snapshot.
const profile=a.dissectionProfiles.abdomen;
const liver=pins.entries.find(s=>s.fmaId==='FMA7197'),right=pins.entries.find(s=>s.fmaId==='FMA14338');
let history=a.dissectionReducer(a.initialDissection,{type:'focus',id:study.id});
history=a.dissectionReducer(history,{type:'remove',id:right.id});
history=a.dissectionReducer(history,{type:'remove',id:liver.id});
history=a.dissectionReducer(history,{type:'undo'});
assert(history.history.length>0&&history.future.length>0);
for(const side of ['left','right','both']){
 const before=history,scope=a.bodyStudyScope(catalog,'abdomen',side);
 history=a.dissectionReducer(history,a.dissectionScopeAction(catalog,profile,'abdomen',side));
 assert.deepEqual(history,before); // Neutral portal target keeps this study valid.
 const check=state=>{
  assert.equal(state.focusId,study.id);
  assert.deepEqual(ids(a.resolveDissection(scope,profile,state).visible),ids(scope.filter(s=>keys.has(s.fmaId)&&!state.removed.includes(s.id))));
 };
 check(history);
 history=a.dissectionReducer(history,{type:'redo'});check(history);
 history=a.dissectionReducer(history,{type:'undo'});check(history);
 sideTransitions++;historyActions+=2;
}
const link=a.parseStudyLink(Object.fromEntries(new URL(a.makeStudyLink(catalog,'abdomen',liver.id,'both',study.id),'https://atlas.invalid').searchParams));
assert.equal(a.resolveStudyLink(catalog,'abdomen',link).status,'ready');
const reject=mutate=>{
 const copy=structuredClone(catalog);mutate(copy);
 assert.equal(a.portalHepaticStudyReady(copy,'abdomen',study.id),false);
 assert.equal(a.limbVascularStudyReady(copy,'abdomen',study.id),false);
 assert.equal(a.resolveStudyLink(copy,'abdomen',link).status,'rejected');rejected++;
};
for(const pin of pins.entries){
 for(const mutate of [s=>s.name+=' altered',s=>s.fmaId+='x',s=>s.laterality='midline',s=>s.bounds.min[0]+=.1,s=>s.regions=['other'],s=>s.sourceTree='other',s=>s.sources[0].sha256='0'.repeat(64)]){
  reject(copy=>mutate(copy.structures.find(s=>s.id===pin.id)));
 }
 reject(copy=>{copy.structures=copy.structures.filter(s=>s.id!==pin.id);});
 reject(copy=>copy.structures.push({...structuredClone(pin),id:pin.id+'-alias'}));
}
for(const b of pins.bundles){
 for(const mutate of [v=>v.sha256='0'.repeat(64),v=>v.id+='-changed',v=>v.url+='?changed=1',v=>v.bytes++,v=>v.structures++])reject(copy=>mutate(copy.bundles.find(x=>x.id===b.id)));
 reject(copy=>{copy.bundles=copy.bundles.filter(x=>x.id!==b.id);});
 reject(copy=>copy.bundles.push({...structuredClone(b),id:b.id+'-alias',url:b.url+'?alias=1'}));
}
for(const key of ['sourceVersion','license','coordinateSystem'])reject(copy=>{copy[key]='changed';});
const altered=structuredClone(a.dissectionProfiles);altered.hand.title+=' altered';assert.throws(()=>prePortalHepaticProfiles(altered));
assert.equal(JSON.stringify(catalog),original);
const report={source:pins.sourceCommit,studies:1,selections:5,bundles:2,scopes:3,sideTransitions,historyActions,rejectedIdentityMutations:rejected,rejectionThroughStudyLinks:true,unchangedTopics,priorRecipesUnchanged:true,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/portal-hepatic-study-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
