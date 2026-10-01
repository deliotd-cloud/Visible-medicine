import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const compiled = await build({stdin:{contents:"export * from './lib/abdominal-wall.ts'; export * from './lib/abdominal-wall-teaching.ts'; export * from './content/abdominal-wall-teaching.ts'; export { kneeDefinition } from './lib/um-limb-studies.ts'; export { specimenTeachingFor } from './lib/um-limb-teaching.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const { abdominalWallDefinition:def, abdominalTeachingFor:lessonFor, abdominalTeachingReferences:references, kneeDefinition:knee }=api;
const copy=v=>JSON.parse(JSON.stringify(v));let checks=0;
const ok=v=>{assert(v);checks++;},same=(a,b)=>{assert.deepEqual(a,b);checks++;};
const before=JSON.stringify(def), muscles=def.surfaces.filter(s=>s.tissue==='muscle');
const topics=['anatomy','function','clinical','pathology','ct','mri','xray','ultrasound'];
const urls=new Set(Object.values(references).map(r=>r.url));
same(muscles.length,8);same(Object.keys(api.abdominalLessonBindings).sort(),muscles.map(s=>s.id).sort());
for(const s of def.surfaces){
  const lesson=lessonFor(def,s);
  if(s.tissue!=='muscle'){ok(lesson);continue;}
  ok(lesson);ok(lesson.anatomy.length>90);ok(lesson.function.length>60);same(Object.keys(lesson.extended.topics).sort(),topics.slice(2).sort());
  for(const field of ['proximal','distal','motor'])ok(lesson.attachments[field].length>15);
  for(const draft of Object.values(lesson.extended.topics)){same(draft.readiness,'draft');ok(draft.body.length>90);ok(draft.references.length>0);ok(draft.references.every(u=>urls.has(u)&&new URL(u).protocol==='https:'));}
  ok(lesson.extended.modelLimit.length>80);ok(lesson.extended.selfCheck.question.length>30);ok(lesson.extended.selfCheck.references.every(u=>urls.has(u)));
  if(s.sourceName.includes('external oblique'))ok(lesson.function.endsWith(`towards the ${s.laterality==='right'?'left':'right'}.`));
  if(s.sourceName.includes('internal oblique'))ok(lesson.function.endsWith(`towards the ${s.laterality}.`));
  const detached=copy(lesson);lesson.anatomy='changed';lesson.extended.topics.ct.body='changed';same(lessonFor(def,s),detached);
  for(const field of ['id','fmaId','sourceName','name','laterality','tissue','bundle','nodeName'])same(lessonFor(def,{...s,[field]:'foreign'}),null);
  same(lessonFor(def,{...s,sources:[{...s.sources[0],sha256:'0'.repeat(64)}]}),null);
}
const mutations=[d=>d.key='foreign',d=>d.source.version='4.0',d=>d.source.license='MIT',d=>d.catalog.coordinateSystem.sourceToSceneColumnMajor[12]+=.5,d=>d.catalog.bundles[0].sha256='0'.repeat(64),d=>d.catalog.bundles[0].url='/foreign.glb',d=>d.surfaces[0].sources[0].sha256='0'.repeat(64),d=>d.catalog.structures[0].anchor[0]+=.1,d=>d.studies[0].ids.pop()];
for(const mutate of mutations){const bad=copy(def);mutate(bad);same(lessonFor(bad,muscles[0]),null);}
same(lessonFor(knee,muscles[0]),null);same(lessonFor(def,knee.surfaces[0]),null);ok(api.specimenTeachingFor(knee,knee.surfaces[0]));same(JSON.stringify(def),before);

// Installed React and the real Learn tabs. Stub only the unrelated WebGL module;
// SSR checks do not certify browser interaction, geometry or clinical accuracy.
const component=await componentBuild({stdin:{contents:"export { AbdominalWallTeaching, abdominalWallSupplement } from './app/abdominal-wall-study.tsx'; export { KneeSpecimenView } from './app/um-knee-study.tsx'; export { SpecimenLearning } from './app/um-limb-learning.tsx';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',plugins:[{name:'scene-boundary',setup(tool){tool.onLoad({filter:/body-scene\.tsx$/},()=>({loader:'js',contents:'export function BodyScene(){return null;} export function retryBodyAssets(){}'}));}}]});
const require=createRequire(import.meta.url),React=require('react'),actualLink=await import('vinext/shims/link'),mod={exports:{}},context={module:mod,exports:mod.exports,structuredClone,require(id){return id==='next/link'?{__esModule:true,...actualLink}:require(id);},URL,URLSearchParams,console,process:{env:{NODE_ENV:'test'}}};runInNewContext(component.outputFiles[0].text,context);
const render=(name,props)=>require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports[name],props));
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
let topicRenders=0;
for(const surface of muscles)for(const topic of topics){
  const lesson=lessonFor(def,surface),html=render('AbdominalWallTeaching',{surface,definition:def,initialTopic:topic});topicRenders++;
  const body=topic==='anatomy'||topic==='function'?lesson[topic]:lesson.extended.topics[topic].body;
  ok(html.includes(escape(body)));ok(html.includes('specialist review pending'));ok(html.includes('Clinical self-check'));same(html.includes('Teaching unavailable'),false);
  if(topic==='anatomy'){ok(html.includes('<dt>Origin</dt>'));ok(html.includes('<dt>Insertion</dt>'));same(html.includes('Proximal attachment'),false);}
  if(['ct','mri','xray','ultrasound'].includes(topic))ok(html.includes('No patient images, scan alignment or measured pathology'));
}
const closed=render('AbdominalWallTeaching',{surface:muscles[0],definition:def});same(/<details[^>]* open/.test(closed),false);
let boneTopicRenders=0;
for(const bone of def.surfaces.filter(s=>s.tissue==='skeleton'))for(const topic of topics){
  const lesson=lessonFor(def,bone),html=render('AbdominalWallTeaching',{surface:bone,definition:def,initialTopic:topic});boneTopicRenders++;
  const body=topic==='anatomy'||topic==='function'?lesson[topic]:lesson.extended?.topics[topic]?.body;
  if(body)ok(html.includes(escape(body)));else ok(html.includes('pending'));
  ok(html.includes('Clinical self-check'));same(html.includes('detailed bone teaching for this specimen is pending'),false);
  same(html.includes('<dt>Origin</dt>'),false);same(html.includes('<dt>Insertion</dt>'),false);
}
const bad=copy(def);bad.catalog.coordinateSystem.sourceToSceneColumnMajor[12]+=.5;
ok(render('AbdominalWallTeaching',{surface:muscles[0],definition:bad}).includes('Teaching unavailable'));
ok(render('KneeSpecimenView',{specimen:bad,supplement:mod.exports.abdominalWallSupplement}).includes('Teaching unavailable'));
ok(render('SpecimenLearning',{definition:knee,selected:knee.surfaces[0],initialTopic:'anatomy'}).includes(escape(api.specimenTeachingFor(knee,knee.surfaces[0]).anatomy)));
ok(render('SpecimenLearning',{definition:knee,selected:knee.surfaces[0],resolveLesson:()=>null}).includes('Teaching unavailable'));
console.log(JSON.stringify({checks,muscles:muscles.length,extendedTopics:muscles.length*6,topicRenders,boneTopicRenders,sourceFrameMutationsRejected:mutations.length,browserOrClinicalAcceptance:false}));
