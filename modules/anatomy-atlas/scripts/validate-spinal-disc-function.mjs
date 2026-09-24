import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {beforeSpinalDiscFunction} from './spinal-disc-function-history.mjs';
import {beforeLaryngealMuscleImaging} from './laryngeal-muscle-imaging-history.mjs';
import pins from '../content/spinal-disc-function.before.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api:currentApi,catalog}=await contentContext(),api=beforeLaryngealMuscleImaging(currentApi),display=api.bodyDisplayCatalog(catalog),before=beforeSpinalDiscFunction(api);
assert.equal(hash(display),pins.catalogHash);
assert.equal(hash(wholeBodyTeachingSnapshot(before,catalog)),pins.previousAllLessonsAndRecipesHash,'Unrecorded teaching or recipe change');
assert.equal(beforeSpinalDiscFunction(before),before);
const expected=[['FMA25058','FJ3202'],['FMA13896','FJ3213'],['FMA13897','FJ3218'],['FMA13898','FJ3219'],['FMA13899','FJ3220'],['FMA13900','FJ3221'],['FMA10458','FJ3222'],['FMA13495','FJ3223'],['FMA13500','FJ3224'],['FMA13501','FJ3203'],['FMA13502','FJ3204'],['FMA13503','FJ3205'],['FMA13504','FJ3206'],['FMA13505','FJ3207'],['FMA13506','FJ3208'],['FMA13507','FJ3209'],['FMA13508','FJ3210'],['FMA16033','FJ3212'],['FMA16034','FJ3214'],['FMA16035','FJ3215'],['FMA16036','FJ3216'],['FMA16037','FJ3217']];
assert.deepEqual(pins.entries.map(e=>[e.identity.fmaId,...e.identity.sources.map(s=>s.file)]),expected);
assert.deepEqual(['cervicalDisc','thoracicDisc','lumbarDisc'].map(g=>pins.entries.filter(e=>e.group===g).length),[6,11,5]);
assert(!display.structures.some(s=>s.sources.some(p=>p.file==='FJ3211')),'Unresolved disc admitted');

// Render the existing viewer callback, not a test-only note component.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const js=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
const records=api.bodyContentRecords(display),titles=new Set(),bodies=new Set();
let changed=0,unchanged=0,rejected=0,rendered=0,citationLinks=0;
for(const s of display.structures)for(const tab of api.contentTabs){
  const lesson=api.spinalDiscFunctionLesson(s,tab);
  if(!lesson){assert.deepEqual(api.bodyLesson(s,tab),before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;assert.equal(tab,'function');assert.equal(lesson.readiness,'draft');
  assert.equal(s.laterality,'midline');assert.equal(s.category,'cartilage');assert.equal(s.system,'connective');assert.equal(s.region,'spine');
  assert.deepEqual(lesson,api.bodyLesson(s,tab));assert.notDeepEqual(lesson,before.bodyLesson(s,tab));
  assert(lesson.title.includes(s.name));titles.add(lesson.title);bodies.add(lesson.body);
  const binding=pins.entries.find(e=>e.identity.id===s.id),group=api.spinalDiscFunctionGroups[binding.group];
  assert.equal(lesson.body,group.body);assert.deepEqual(lesson.citations,[...group.references]);
  assert(lesson.bullets.includes(api.spinalDiscFunctionFacts.shared));assert(group.bullets.every(b=>lesson.bullets.includes(b)));
  if(s.fmaId==='FMA25058')assert(lesson.bullets.some(b=>b.includes('no C1–C2 intervertebral disc')));
  assert.match(lesson.note,/review is pending/);assert.match(lesson.note,/not independently segmented/);assert.match(lesson.note,/one source level remains unresolved/);assert.match(lesson.note,/access remain independent/);
  const record=records.find(r=>r.id===s.id);assert.deepEqual(record.content[tab],lesson);assert.equal(record.validation.clinicalApproval,'not-included');
  const jsx=runInNewContext(js+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:display,side:'both',exam:false,openNested(){throw Error('No automatic navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,lesson.body))));
  assert(html.includes(render(React.createElement('div',{className:'eyebrow'},lesson.title))));
  for(const [index,url] of lesson.citations.entries()){
    assert(html.includes(render(React.createElement('a',{href:url,target:'_blank',rel:'noreferrer'},`Reference ${index+1} ↗`))),'Missing or unsafe rendered citation: '+url);
    citationLinks++;
  }
  for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  assert(html.includes('review is pending'));rendered++;
  lesson.bullets.push('foreign');lesson.citations.push('foreign');assert.deepEqual(api.spinalDiscFunctionLesson(s,tab),api.bodyLesson(s,tab));
}
assert.equal(changed,22);assert.equal(unchanged,9914);assert.equal(rendered,22);assert.equal(citationLinks,44);assert.equal(titles.size,22);assert.equal(bodies.size,3);
for(const {identity}of pins.entries)for(const mutate of [s=>s.id+='x',s=>s.fmaId='FMA0',s=>s.name+='x',s=>s.sourceName+='x',s=>s.laterality='left',s=>s.region='thorax',s=>s.regions.push('hand'),s=>s.system='nervous',s=>s.category='bone',s=>s.sourceTree='partof',s=>s.sources[0].file='FJ3211',s=>s.sources[0].sha256='x',s=>s.bundle='x',s=>s.nodeName='x',s=>s.anchor[0]+=.1,s=>s.bounds.min[0]+=.1,s=>s.validation={status:'unvalidated',anatomicalReview:true}]){
  const bad=structuredClone(identity);mutate(bad);assert.equal(api.spinalDiscFunctionLesson(bad,'function'),undefined);rejected++;
}
const first=pins.entries[0];
assert.throws(()=>beforeSpinalDiscFunction({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='function'?first.previous.function:api.bodyLesson(s,t);}}),/Mixed/);
assert.throws(()=>beforeSpinalDiscFunction({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='function'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t);}}),/Unrecorded/);
const detached=before.bodyLesson(first.identity,'function');detached.body='foreign';assert.deepEqual(before.bodyLesson(first.identity,'function'),first.previous.function);
console.log(JSON.stringify({changedTopics:changed,unchangedTopics:unchanged,actualNoteRenders:rendered,citationLinks,identityMutationsRejected:rejected,regionalConcepts:bodies.size,sourceGeometryChanged:false,clinicalApproval:false}));
