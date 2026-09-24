import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {beforeProperDigitalTeaching} from './proper-digital-teaching-history.mjs';
import pins from '../content/proper-digital-teaching.before.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog),before=beforeProperDigitalTeaching(api);
assert.equal(hash(display),pins.catalogHash);
assert.equal(hash(wholeBodyTeachingSnapshot(before,catalog)),pins.previousAllLessonsAndRecipesHash,'Other teaching or recipes changed');
assert.equal(beforeProperDigitalTeaching(before),before);
const expected={FMA22858:['right','middle finger','radial','index finger'],FMA22860:['left','middle finger','radial','index finger'],FMA23050:['right','index finger','ulnar','middle finger'],FMA23051:['left','index finger','ulnar','middle finger'],FMA23052:['right','ring finger','ulnar','little finger'],FMA23054:['right','little finger','radial','ring finger'],FMA23055:['left','little finger','radial','ring finger'],FMA85112:['right','middle finger','ulnar','ring finger'],FMA85115:['right','ring finger','radial','middle finger'],FMA85116:['left','ring finger','radial','middle finger']};
assert.deepEqual(Object.fromEntries(Object.entries(api.properDigitalTeachingSelections).map(([id,s])=>[id,[s.side,s.digit,s.border,s.faces]])),expected);
assert.deepEqual(pins.entries.map(e=>e.identity.fmaId),Object.keys(expected));
assert.equal(pins.entries.filter(e=>e.identity.laterality==='right').length,6);

// Render the actual viewer note callback: no parallel test-only presentation.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const js=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
let changed=0,unchanged=0,rejected=0,rendered=0;
const bodies={anatomy:new Set(),function:new Set()},records=api.bodyContentRecords(display);
for(const s of display.structures)for(const tab of api.contentTabs){
 const lesson=api.properDigitalTeachingLesson(s,tab);
 if(!lesson){assert.deepEqual(api.bodyLesson(s,tab),before.bodyLesson(s,tab));unchanged++;continue;}
 changed++;assert(['anatomy','function'].includes(tab));assert.equal(lesson.readiness,'draft');
 assert.deepEqual(lesson,api.bodyLesson(s,tab));assert.notDeepEqual(lesson,before.bodyLesson(s,tab));
 assert.deepEqual(records.find(r=>r.id===s.id).content[tab],lesson);
 assert.equal(records.find(r=>r.id===s.id).validation.clinicalApproval,'not-included');
 const [side,digit,border,faces]=expected[s.fmaId];assert.equal(side,s.laterality);
 assert(lesson.body.includes(side+' '+digit));assert(lesson.body.includes(border));
 if(tab==='anatomy'){assert(lesson.body.includes(faces));assert(s.name.toLowerCase().includes(border==='radial'?'lateral':'medial'));}
 assert.match(lesson.note,/review pending/);assert.match(lesson.note,/access remain independent/);
 assert.deepEqual(lesson.citations,[...api.properDigitalTeachingReferences]);bodies[tab].add(lesson.body);
 const jsx=runInNewContext(js+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:display,side:'both',exam:false,openNested(){throw Error('No automatic navigation');}});
 const html=render(jsx);assert(html.includes(render(React.createElement('p',null,lesson.body))));
 for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
 assert(html.includes('review pending'));rendered++;
 lesson.bullets.push('foreign');lesson.citations.push('foreign');assert.deepEqual(api.properDigitalTeachingLesson(s,tab),api.bodyLesson(s,tab));
}
assert.equal(changed,20);assert.equal(unchanged,9916);assert.equal(rendered,20);
assert.equal(bodies.anatomy.size,10);assert.equal(bodies.function.size,10);
for(const {identity}of pins.entries)for(const mutate of [s=>s.id+='x',s=>s.fmaId='FMA0',s=>s.name+='x',s=>s.sourceName+='x',s=>s.laterality=s.laterality==='left'?'right':'left',s=>s.region='forearm',s=>s.regions.push('forearm'),s=>s.system='nervous',s=>s.sourceTree='partof',s=>s.sources[0].file='FJ0',s=>s.sources[0].sha256='x',s=>s.bundle='x',s=>s.nodeName='x',s=>s.anchor[0]+=.1,s=>s.bounds.min[0]+=.1,s=>s.validation={status:'unvalidated',anatomicalReview:true}]){
 const bad=structuredClone(identity);mutate(bad);
 for(const tab of ['anatomy','function'])assert.equal(api.properDigitalTeachingLesson(bad,tab),undefined);rejected++;
}
const first=pins.entries[0];
assert.throws(()=>beforeProperDigitalTeaching({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='anatomy'?first.previous.anatomy:api.bodyLesson(s,t);}}),/Mixed/);
assert.throws(()=>beforeProperDigitalTeaching({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='anatomy'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t);}}),/Unrecorded/);
const detached=before.bodyLesson(first.identity,'anatomy');detached.body='foreign';assert.deepEqual(before.bodyLesson(first.identity,'anatomy'),first.previous.anatomy);
const factWords=Object.values(api.properDigitalTeachingFacts).flatMap(Object.values).join(' ').split(/\s+/).length;assert(factWords<150);
console.log(JSON.stringify({changedTopics:changed,unchangedTopics:unchanged,actualNoteRenders:rendered,identityMutationsRejected:rejected,uniqueFactWords:factWords,geometryChanged:false,clinicalApproval:false}));
