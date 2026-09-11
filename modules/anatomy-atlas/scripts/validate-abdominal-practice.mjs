import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const compiled = await build({stdin:{contents:"export * from './lib/abdominal-wall.ts'; export * from './lib/abdominal-wall-practice.ts'; export * from './lib/independent-specimen.ts'; export * from './lib/specimen-identification.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const {abdominalWallDefinition:def,abdominalWallPractice:adapter,initialSpecimen,reduceSpecimen,specimenAction,reduceIdentification}=api;
let checks=0;const same=(a,b)=>{assert.deepEqual(a,b);checks++;},ok=v=>{assert(v);checks++;},copy=v=>JSON.parse(JSON.stringify(v));
const before=JSON.stringify(def), counts={all:8,internal:6,transverse:4,rectus:2,right:4,left:4,muscles:8};
for(const study of def.studies){
  const dissection=reduceSpecimen(def,initialSpecimen(def),specimenAction(def,study.id)), snapshot=JSON.stringify(dissection);
  const visible=def.surfaces.filter(s=>!dissection.hidden.includes(s.id)).map(s=>s.id), eligible=adapter.eligibleIds(def,visible);
  same(eligible.length,counts[study.id]);same(eligible.every(id=>def.surfaces.find(s=>s.id===id).tissue==='muscle'),true);
  let state=adapter.createRound(def,visible,()=>.37);ok(state);same(state.questions.length,eligible.length);same(new Set(state.questions.map(q=>q.targetId)).size,eligible.length);
  while(state.questions[state.index]){
    const q=state.questions[state.index];ok(eligible.includes(q.targetId));same(q.options.length,Math.min(4,eligible.length));same(new Set(q.options).size,q.options.length);ok(q.options.every(id=>eligible.includes(id)));ok(q.options.includes(q.targetId));
    same(reduceIdentification(state,{type:'next'}),state);same(reduceIdentification(state,{type:'answer',id:'FMA13336'}),state);
    if(state.index%3===0){const wrong=q.options.find(id=>id!==q.targetId);state=reduceIdentification(state,{type:'answer',id:wrong});same(state.feedback,'wrong');same(reduceIdentification(state,{type:'answer',id:wrong}),state);state=reduceIdentification(state,{type:'answer',id:q.targetId});same(state.results.at(-1).firstTry,false);}
    else if(state.index%3===1){state=reduceIdentification(state,{type:'reveal'});same(state.results.at(-1).firstTry,false);same(state.results.at(-1).revealed,true);}
    else{state=reduceIdentification(state,{type:'answer',id:q.targetId});same(state.results.at(-1).firstTry,true);}
    same(reduceIdentification(state,{type:'answer',id:q.targetId}),state);state=reduceIdentification(state,{type:'next'});
  }
  same(state.results.length,eligible.length);same(JSON.stringify(dissection),snapshot);
  const missed=state.results.filter(r=>!r.firstTry).map(r=>r.targetId), retry=adapter.createRound(def,visible,()=>.63,missed);
  same(retry.questions.map(q=>q.targetId).sort(),[...missed].sort());ok(retry.questions.every(q=>q.options.every(id=>eligible.includes(id))));
  same(adapter.createRound(def,visible,()=>.5,[]),null);same(adapter.createRound(def,visible,()=>.5,['foreign']),null);
}
const all=def.surfaces.map(s=>s.id), muscles=def.surfaces.filter(s=>s.tissue==='muscle'), bones=def.surfaces.filter(s=>s.tissue==='skeleton').map(s=>s.id);
for(const ids of [[],bones,[...bones,muscles[0].id],['foreign'],[...all,'foreign'],[...all,all[0]]])same(adapter.createRound(def,ids,()=>.5),null);
same(adapter.createRound(def,all,()=>.5,[muscles[0].id,muscles[0].id]),null);
for(const bad of [NaN,-.1,1,Infinity]){assert.throws(()=>adapter.createRound(def,all,()=>bad));checks++;}
const mutations=[d=>d.key='foreign',d=>d.source.version='4.0',d=>d.source.license='MIT',d=>d.catalog.sourceVersion='4.0',d=>d.catalog.coordinateSystem.sourceToSceneColumnMajor[12]+=.5,d=>d.catalog.bundles[0].sha256='0'.repeat(64),d=>d.catalog.bundles[0].url='/different.glb',d=>d.surfaces[0].sources[0].sha256='0'.repeat(64),d=>d.surfaces[0].fmaId='FMA13337',d=>d.surfaces[0].laterality='left',d=>d.surfaces[0].bounds.min[0]+=.1,d=>d.catalog.structures[0].anchor[0]+=.1,d=>d.studies[0].ids.pop(),d=>d.surfaces.push(copy(d.surfaces[0]))];
for(const mutate of mutations){const bad=copy(def);mutate(bad);same(adapter.eligibleIds(bad,all),[]);same(adapter.createRound(bad,all,()=>.5),null);same(adapter.feedback(bad,muscles[0]),null);}
for(const surface of muscles){ok(adapter.feedback(def,surface));for(const field of ['name','id','fmaId','sourceName','laterality','tissue','nodeName'])same(adapter.feedback(def,{...surface,[field]:'foreign'}),null);}
same(JSON.stringify(def),before);
// Real UI markup, source callbacks and WebGL props. No browser/device assertion.
const component=await componentBuild({stdin:{contents:"export { SpecimenIdentification } from './app/um-limb-learning.tsx'; export { KneeSpecimenView } from './app/um-knee-study.tsx'; export { abdominalWallSupplement } from './app/abdominal-wall-study.tsx';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',plugins:[{name:'scene-boundary',setup(tool){tool.onLoad({filter:/body-scene\.tsx$/},()=>({loader:'js',contents:'export function BodyScene(props){globalThis.sceneProps=props;return null;} export function retryBodyAssets(){}'}));}}]});
const require=createRequire(import.meta.url),React=require('react'),mod={exports:{}},context={module:mod,exports:mod.exports,require,URL,URLSearchParams,console,process:{env:{NODE_ENV:'test'}}};runInNewContext(component.outputFiles[0].text,context);
const render=(name,props)=>require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports[name],props));
for(const study of def.studies){
  const visible=study.ids, initial=adapter.createRound(def,visible,()=>.4), props={definition:def,initial,visibleIds:visible,initialView:'anterior',onClose(){},adapter};
  let html=render('SpecimenIdentification',props), scene=context.sceneProps;
  ok(html.includes('Name the highlighted structure'));ok(html.includes('Bones are context, never answers'));ok(html.includes('Answering is paused until the model is ready.'));
  const target=def.surfaces.find(s=>s.id===initial.questions[0].targetId), explanation=adapter.feedback(def,target);
  same(html.includes(explanation),false);same(scene.labels,false);same(scene.showOrigins,false);same(scene.landmarks.length,0);same(scene.explode,0);same(scene.selectedId,target.id);same(scene.catalog.sourceVersion,def.key);
  same(JSON.stringify(scene.hiddenIds),JSON.stringify(def.surfaces.filter(s=>!visible.includes(s.id)).map(s=>s.id)));
  html=render('SpecimenIdentification',{...props,initial:reduceIdentification(initial,{type:'reveal'})});ok(html.includes(explanation));
  let completed=initial;while(completed.questions[completed.index])completed=reduceIdentification(reduceIdentification(completed,{type:'reveal'}),{type:'next'});
  html=render('SpecimenIdentification',{...props,initial:completed});ok(html.includes(`0 of ${completed.questions.length} identified on the first try`));ok(html.includes('Retry missed'));
}
const launch=render('KneeSpecimenView',{specimen:def,supplement:mod.exports.abdominalWallSupplement});ok(launch.includes('Practise identification'));ok(launch.includes('disabled=""'));
console.log(JSON.stringify({checks,studies:7,muscles:8,sourceFrameMutationsRejected:mutations.length,anatomyMeshesChanged:false,clinicalOrBrowserAcceptance:false}));
