import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {beforeOrbitalUltrasound} from './orbital-ultrasound-history.mjs';
import pins from '../content/orbital-ultrasound.before.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api,catalog,shoulder}=await contentContext(),display=api.bodyDisplayCatalog(catalog),before=beforeOrbitalUltrasound(api);
assert.equal(hash(display),pins.catalogHash,'Source geometry/catalog unchanged');
assert.equal(hash(wholeBodyTeachingSnapshot(before,catalog)),pins.previousAllLessonsAndRecipesHash,'All prior teaching and recipes preserved');
assert.equal(beforeOrbitalUltrasound(before),before);
assert.deepEqual(pins.entries.map(e=>e.identity.fmaId).sort(),['FMA49044','FMA49045','FMA49046','FMA49047','FMA49048','FMA49049','FMA49050','FMA49051','FMA49052','FMA49053','FMA49054','FMA49055','FMA49056','FMA49057']);
const records=api.bodyContentRecords(display),registry=new Map([...shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);for(const record of records)assert(validate(record));
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,99,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const js=ts.transpileModule('const renderNote='+callback,{compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const ids=new Set(pins.entries.map(e=>e.identity.id)),bodies=new Set();
let changed=0,unchanged=0,rendered=0,rejected=0;
for(const s of display.structures)for(const topic of api.contentTabs){
 const lesson=api.bodyLesson(s,topic);
 if(!ids.has(s.id)||topic!=='ultrasound'){assert.deepEqual(lesson,before.bodyLesson(s,topic));unchanged++;continue;}
 assert.equal(lesson.readiness,'draft');assert.equal(before.bodyLesson(s,topic).readiness,'pending');
 assert.deepEqual(lesson,api.orbitalNeckMuscleImagingLesson(s,topic));changed++;bodies.add(lesson.body);
 assert.equal(lesson.title.startsWith(s.name+' ·'),true,'Source laterality/name retained');
 assert.match(lesson.note,/review pending/);assert.match(lesson.note,/No scan or spatial registration/);
 assert(lesson.bullets.includes(api.orbitalUltrasoundMode.text));
 assert(!lesson.bullets.includes(api.orbitalNeckMuscleImagingModes.ultrasound.text),'No generic pressure/probe instruction for the eye');
 const record=records.find(r=>r.id===s.id);assert.equal(record.validation.clinicalApproval,'not-included');assert.deepEqual(record.content[topic],lesson);
 const jsx=runInNewContext(js+';renderNote(topic)',{React,topic,selected:s,bodyContent:api.bodyContent,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:display,side:'both',exam:false,openNested(){throw Error('No automatic navigation');}});
 const html=render(jsx);assert(html.includes(render(React.createElement('p',null,lesson.body))));
 for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
 for(const url of lesson.citations)assert(html.includes(url.replaceAll('&','&amp;')));
 assert(html.includes('No imaging study loaded'));rendered++;
 lesson.bullets.push('foreign');assert.deepEqual(api.bodyLesson(s,topic),api.orbitalNeckMuscleImagingLesson(s,topic));
}
assert.equal(changed,14);assert.equal(unchanged,9922);assert.equal(rendered,14);assert.equal(bodies.size,7);
for(const {identity}of pins.entries)for(const mutate of [
 s=>s.id+='x',s=>s.fmaId='FMA0',s=>s.name+='x',s=>s.sourceName+='x',s=>s.laterality=s.laterality==='left'?'right':'left',s=>s.region='hand',s=>s.regions.push('hand'),s=>s.system='nervous',s=>s.category='bone',s=>s.sourceTree='partof',s=>s.sources[0].file='FJ0',s=>s.sources[0].sha256='x',s=>s.bundle='x',s=>s.nodeName='x',s=>s.anchor[0]+=.1,s=>s.bounds.min[0]+=.1,s=>s.validation={status:'unvalidated',anatomicalReview:true},
]){const bad=structuredClone(identity);mutate(bad);assert.equal(api.orbitalNeckMuscleImagingLesson(bad,'ultrasound'),undefined);assert.equal(api.bodyLesson(bad,'ultrasound').readiness,'pending');rejected++;}
const first=pins.entries[0];
assert.throws(()=>beforeOrbitalUltrasound({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='ultrasound'?first.previous:api.bodyLesson(s,t);}}),/Mixed/);
assert.throws(()=>beforeOrbitalUltrasound({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='ultrasound'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t);}}),/Unrecorded/);
assert.throws(()=>beforeOrbitalUltrasound({...api,orbitalUltrasoundMode:{...api.orbitalUltrasoundMode,text:'foreign'}}));
const facts=[api.orbitalUltrasoundMode,...Object.values(api.orbitalNeckMuscleImagingGroups).filter(g=>g.family==='orbital').map(g=>g.focus.ultrasound)],budgets={};
for(const fact of facts)for(const key of fact.references)budgets[key]=(budgets[key]||0)+fact.text.split(/\s+/).length;
for(const [key,count]of Object.entries(budgets))assert(count<=200,`${key} fact budget: ${count}`);
console.log(JSON.stringify({changedTopics:changed,unchangedTopics:unchanged,actualNoteRenders:rendered,identityRejections:rejected,sourceWordCounts:budgets,geometryChanged:false,clinicalApproval:false}));
