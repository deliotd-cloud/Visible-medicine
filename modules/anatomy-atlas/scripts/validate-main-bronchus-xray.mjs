import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with {type:'json'};
import transition from '../content/main-bronchus-xray.transition.json' with {type:'json'};
import {contentContext} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {authoringBeforeMainBronchusXray,mainBronchusXrayHash as hash} from './main-bronchus-xray-history.mjs';

const context=await contentContext(),{api,catalog}=context;
const display=api.bodyDisplayCatalog(catalog),before=authoringBeforeMainBronchusXray(context);
assert.equal(hash(display),transition.catalogHash,'Source geometry/display changed');
assert.equal(hash(wholeBodyTeachingSnapshot(before.api,catalog)),transition.previousAllLessonsAndRecipesHash,'Other teaching or dissection recipes changed');
assert.equal(authoringBeforeMainBronchusXray(before),before,'History must be idempotent');
const entries=pins.entries.filter(e=>['FMA7395','FMA7396'].includes(e.identity.fmaId));
assert.deepEqual(entries.map(e=>e.identity.fmaId),['FMA7395','FMA7396']);
const records=api.bodyContentRecords(display);
let changed=0,unchanged=0,rejected=0,rendered=0;

// Exercise the actual viewer note callback, not a test-only rendering template.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const source=await readFile('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isArrowFunction(n)&&n.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert(!callback);callback=n.getText(ast);}ts.forEachChild(n,visit);}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
for(const s of display.structures)for(const tab of api.contentTabs){
  const draft=api.mainBronchusXrayLesson(s,tab);
  if(!draft){assert.deepEqual(api.bodyLesson(s,tab),before.api.bodyLesson(s,tab));unchanged++;continue;}
  changed++;
  assert.equal(tab,'xray');assert.equal(draft.readiness,'draft');
  assert.deepEqual(s,entries.find(e=>e.identity.id===s.id).identity);
  assert.deepEqual(api.bodyLesson(s,tab),draft);
  assert.equal(before.api.bodyLesson(s,tab).readiness,'pending');
  assert.deepEqual(records.find(r=>r.id===s.id).content.xray,draft);
  assert.equal(records.find(r=>r.id===s.id).validation.clinicalApproval,'not-included');
  const {readiness:_readiness,...shown}=draft;assert.deepEqual(api.bodyContent(s,tab),shown);
  assert.match(draft.note,/No X-ray image, detector geometry or registered correspondence/);
  assert.match(draft.note,/paid-lecture access remain independent/);
  assert.match(draft.note,/review pending/);
  for(const url of api.mainBronchusXrayReferences)assert(draft.citations.includes(url));
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:display,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);
  assert(html.includes(render(React.createElement('p',null,draft.body))));
  for(const bullet of draft.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
  for(const url of draft.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  rendered++;
  draft.bullets.push('foreign');draft.citations.push('foreign');
  assert.deepEqual(api.mainBronchusXrayLesson(s,tab),api.bodyLesson(s,tab));
}
assert.equal(changed,2);assert.equal(unchanged,9934);assert.equal(rendered,2);
for(const {identity} of entries)for(const mutate of [
 s=>s.id+='foreign',s=>s.fmaId='FMA7394',s=>s.name+='foreign',s=>s.sourceName+='foreign',
 s=>s.laterality=s.laterality==='left'?'right':'left',s=>s.region='abdomen',s=>s.regions.push('abdomen'),
 s=>s.system='vessels',s=>s.sourceTree=s.sourceTree==='isa'?'partof':'isa',s=>s.sources[0].file='foreign',s=>s.sources[0].sha256='foreign',
 s=>s.bundle='foreign',s=>s.nodeName='foreign',s=>s.anchor[0]+=.01,s=>s.bounds.min[0]+=.01,
 s=>s.validation={status:'unvalidated',anatomicalReview:true},
]){const bad=structuredClone(identity);mutate(bad);assert.equal(api.mainBronchusXrayLesson(bad,'xray'),undefined);assert.equal(api.bodyLesson(bad,'xray').readiness,'pending');rejected++;}
const first=entries[0].identity;
assert.throws(()=>authoringBeforeMainBronchusXray({...context,api:{...api,bodyLesson(s,t){return s.id===first.id&&t==='xray'?{...api.bodyLesson(s,t),body:'unrecorded'}:api.bodyLesson(s,t);}}}),/Unrecorded main-bronchus X-ray change/);
assert.throws(()=>authoringBeforeMainBronchusXray({...context,api:{...api,bodyLesson(s,t){return s.id===first.id&&t==='xray'?structuredClone(transition.previous):api.bodyLesson(s,t);}}}),/Mixed main-bronchus X-ray history/);
assert.throws(()=>authoringBeforeMainBronchusXray({...context,api:{...api,mainBronchusXrayLesson(s,t){return {...api.mainBronchusXrayLesson(s,t),body:'unrecorded'};}}}),/Unrecorded main-bronchus X-ray draft/);
const previous=before.api.bodyLesson(first,'xray');previous.body='foreign';assert.deepEqual(before.api.bodyLesson(first,'xray'),transition.previous);
const words=Object.values(api.mainBronchusXrayFacts).reduce((n,f)=>n+(f.body+' '+f.pitfall).split(/\s+/).length,0);
assert(words<=200,'Reference-derived teaching word budget');
console.log(JSON.stringify({changedDrafts:changed,unchangedTopics:unchanged,sourceMutationsRejected:rejected,actualNoteRenders:rendered,referenceWords:words,geometryChanged:false,imagesImported:false,clinicalApproval:false}));
