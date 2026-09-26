import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {beforeLaryngealMuscleImaging} from './laryngeal-muscle-imaging-history.mjs';
import {beforePulmonaryVeinUltrasound} from './pulmonary-vein-ultrasound-history.mjs';
import pins from '../content/laryngeal-muscle-imaging.before.json' with {type:'json'};
import sourcePins from '../content/laryngeal-muscle-teaching-pins.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api:currentApi,catalog}=await contentContext(),api=beforePulmonaryVeinUltrasound(currentApi),display=api.bodyDisplayCatalog(catalog),before=beforeLaryngealMuscleImaging(api);
assert.equal(hash(display),pins.catalogHash);assert.equal(hash(sourcePins),pins.originalPinsHash);
assert.equal(hash(wholeBodyTeachingSnapshot(before,catalog)),pins.previousAllLessonsAndRecipesHash,'Unrecorded teaching/recipe change');
assert.equal(beforeLaryngealMuscleImaging(before),before);
const expected=[['FMA46577','FJ2800','right','posterior'],['FMA46578','FJ2782','left','posterior'],['FMA46580','FJ2796','right','lateral'],['FMA46581','FJ2778','left','lateral'],['FMA46582','FJ2809','midline','transverse'],['FMA46584','FJ2798','right','oblique'],['FMA46585','FJ2780','left','oblique']];
assert.deepEqual(pins.entries.map(e=>[e.identity.fmaId,...e.identity.sources.map(s=>s.file),e.identity.laterality,e.family]),expected);
for(const bundle of sourcePins.bundles)assert.equal(createHash('sha256').update(await readFile('public'+bundle.url.split('?')[0])).digest('hex'),bundle.sha256);
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const built=await build({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const js=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
const records=api.bodyContentRecords(display),titles=new Set(),bodies=new Set();
let changed=0,unchanged=0,rejected=0,rendered=0,citationLinks=0;
for(const s of display.structures)for(const tab of api.contentTabs){
  const lesson=api.laryngealMuscleImagingLesson(s,tab);
  if(!lesson){assert.deepEqual(api.bodyLesson(s,tab),before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;assert(['ct','mri'].includes(tab));assert.equal(lesson.readiness,'draft');
  assert.equal(before.bodyLesson(s,tab).readiness,'pending');assert.equal(s.region,'head-neck');assert.equal(s.category,'muscle');
  assert.deepEqual(lesson,api.bodyLesson(s,tab));assert(lesson.title.includes(s.name));assert(lesson.title.includes(tab.toUpperCase()));
  titles.add(lesson.title);bodies.add(lesson.body);
  const allText=JSON.stringify(lesson);assert.match(allText,/review/i);assert.match(allText,/independent/i);assert.match(allText,/No imaging study loaded/);
  const binding=pins.entries.find(e=>e.identity.id===s.id),refs=api.laryngealMuscleImagingReferences;
  assert.deepEqual(lesson.citations,[refs.anatomy,...(binding.family==='posterior'?[refs.clinical]:[]),...(tab==='mri'?[refs.research]:[])]);
  assert.equal(lesson.body,api.laryngealMuscleImagingTopics[binding.family][tab]);
  assert(lesson.bullets.includes(api.laryngealMuscleImagingTopics[binding.family].landmark));
  if(tab==='mri')assert.match(allText,/cadaveric MRI.*not routine in-vivo/);
  for(const url of lesson.citations)assert.equal(new URL(url).protocol,'https:');
  const record=records.find(r=>r.id===s.id);assert.deepEqual(record.content[tab],lesson);assert.equal(record.validation.clinicalApproval,'not-included');
  const jsx=runInNewContext(js+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,SourceDisplayNotes:scope.exports.SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:display,side:'both',exam:false,openNested(){throw Error('No automatic navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,lesson.body))));
  assert(html.includes(render(React.createElement('div',{className:'eyebrow'},lesson.title))));
  for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const [index,url] of lesson.citations.entries()){
    assert(html.includes(render(React.createElement('a',{href:url,target:'_blank',rel:'noreferrer'},`Reference ${index+1} ↗`))));citationLinks++;
  }
  assert(html.includes('No imaging study loaded'));rendered++;
  lesson.bullets.push('foreign');lesson.citations.push('foreign');assert.deepEqual(api.laryngealMuscleImagingLesson(s,tab),api.bodyLesson(s,tab));
}
assert.equal(changed,14);assert.equal(unchanged,9922);assert.equal(rendered,14);assert.equal(citationLinks,25);assert.equal(titles.size,14);assert.equal(bodies.size,8);
for(const {identity}of pins.entries)for(const mutate of [s=>s.id+='x',s=>s.fmaId='FMA0',s=>s.name+='x',s=>s.sourceName+='x',s=>s.laterality=s.laterality==='left'?'right':'left',s=>s.region='thorax',s=>s.regions.push('hand'),s=>s.system='nervous',s=>s.category='bone',s=>s.sourceTree='partof',s=>s.sources[0].file='FJ0',s=>s.sources[0].sha256='x',s=>s.bundle='x',s=>s.nodeName='x',s=>s.anchor[0]+=.1,s=>s.bounds.min[0]+=.1,s=>s.validation={status:'unvalidated',anatomicalReview:true}]){
  const bad=structuredClone(identity);mutate(bad);for(const tab of ['ct','mri']){assert.equal(api.laryngealMuscleImagingLesson(bad,tab),undefined);rejected++;}
}
assert.equal(api.laryngealMuscleImagingLesson({id:'foreign',get name(){throw Error('Unknown identity fields read');}},'ct'),undefined);
const first=pins.entries[0];
assert.throws(()=>beforeLaryngealMuscleImaging({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='ct'?first.previous.ct:api.bodyLesson(s,t);}}),/Mixed/);
assert.throws(()=>beforeLaryngealMuscleImaging({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='ct'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t);}}),/Unrecorded/);
const detached=before.bodyLesson(first.identity,'ct');detached.body='foreign';assert.deepEqual(before.bodyLesson(first.identity,'ct'),first.previous.ct);
console.log(JSON.stringify({changedTopics:changed,unchangedTopics:unchanged,actualNoteRenders:rendered,citationLinks,identityMutationsRejected:rejected,conceptTopics:bodies.size,sourceGeometryChanged:false,clinicalApproval:false}));
