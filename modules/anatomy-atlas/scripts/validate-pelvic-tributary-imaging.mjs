import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {beforePelvicTributaryImaging} from './pelvic-tributary-imaging-history.mjs';
import {beforeHipAbductorXray} from './hip-abductor-xray-history.mjs';
import pins from '../content/pelvic-tributary-imaging.before.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const context=await contentContext(),api=beforeHipAbductorXray(context.api),catalog=context.catalog,display=api.bodyDisplayCatalog(catalog),before=beforePelvicTributaryImaging(api);
assert.equal(hash(display),pins.catalogHash);
assert.equal(hash(wholeBodyTeachingSnapshot(before,catalog)),pins.previousAllLessonsAndRecipesHash);
assert.equal(beforePelvicTributaryImaging(before),before);
assert.deepEqual([...new Set(pins.entries.map(e=>e.identity.fmaId))],['FMA18904','FMA18903','FMA18916','FMA18915','FMA18906']);
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,99,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const js=ts.transpileModule('const renderNote='+callback,{compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const built=await build({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const {SourceDisplayNotes}=scope.exports;
const ids=new Set(pins.entries.map(e=>e.identity.id+'|'+e.topic)),records=api.bodyContentRecords(display);
let changed=0,unchanged=0,rendered=0,rejected=0;
const bodies=new Set();
for(const s of display.structures)for(const topic of api.contentTabs){
  const lesson=api.bodyLesson(s,topic);
  if(!ids.has(s.id+'|'+topic)){assert.deepEqual(lesson,before.bodyLesson(s,topic));unchanged++;continue;}
  changed++;assert.equal(lesson.readiness,'draft');assert.equal(before.bodyLesson(s,topic).readiness,'pending');
  assert.deepEqual(lesson,api.pelvicVeinLesson(s,topic));bodies.add(lesson.body);
  assert.match(lesson.body,/not|cannot/);assert.match(lesson.note,/radiologist review/);assert.match(lesson.note,/No patient images/);
  assert(lesson.citations.length>0);for(const url of lesson.citations)assert(Object.values(api.pelvicVeinTeachingReferences).includes(url));
  assert.equal(records.find(r=>r.id===s.id).validation.clinicalApproval,'not-included');
  assert.deepEqual(records.find(r=>r.id===s.id).content[topic],lesson);
  const jsx=runInNewContext(js+';renderNote(topic)',{React,topic,selected:s,bodyContent:api.bodyContent,SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:display,side:'both',exam:false,openNested(){throw Error('No automatic navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,lesson.body))));
  for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const url of lesson.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  assert(html.includes('No imaging study loaded'));rendered++;
  lesson.bullets.push('foreign');assert.deepEqual(api.bodyLesson(s,topic),api.pelvicVeinLesson(s,topic));
}
assert.equal(changed,11);assert.equal(unchanged,9925);assert.equal(bodies.size,7);assert.equal(rendered,11);
for(const {identity,topic}of pins.entries)for(const mutate of [
  s=>s.id+='x',s=>s.fmaId='FMA0',s=>s.name+='x',s=>s.sourceName+='x',s=>s.laterality=s.laterality==='left'?'right':'left',s=>s.region='hand',s=>s.regions.push('hand'),s=>s.system='nervous',s=>s.category='bone',s=>s.sourceTree='partof',s=>s.sources[0].file='FJ0',s=>s.sources[0].sha256='x',s=>s.bundle='x',s=>s.nodeName='x',s=>s.anchor[0]+=.1,s=>s.bounds.min[0]+=.1,s=>s.validation={status:'unvalidated',anatomicalReview:true},
]){const bad=structuredClone(identity);mutate(bad);assert.equal(api.pelvicVeinLesson(bad,topic),undefined);rejected++;}
const first=pins.entries[0];
assert.throws(()=>beforePelvicTributaryImaging({...api,bodyLesson(s,t){return s.id===first.identity.id&&t===first.topic?first.previous:api.bodyLesson(s,t);}}),/Mixed/);
assert.throws(()=>beforePelvicTributaryImaging({...api,bodyLesson(s,t){return s.id===first.identity.id&&t===first.topic?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t);}}),/Unrecorded/);
const changedGroups=structuredClone(api.pelvicVeinTeaching);changedGroups[first.group][first.topic].body='foreign';
assert.throws(()=>beforePelvicTributaryImaging({...api,pelvicVeinTeaching:changedGroups}));
const detached=before.bodyLesson(first.identity,first.topic);detached.body='foreign';assert.deepEqual(before.bodyLesson(first.identity,first.topic),first.previous);
console.log(JSON.stringify({changedTopics:changed,unchangedTopics:unchanged,actualNoteRenders:rendered,identityRejections:rejected,negativeHistoryCases:3,geometryChanged:false,clinicalApproval:false}));
