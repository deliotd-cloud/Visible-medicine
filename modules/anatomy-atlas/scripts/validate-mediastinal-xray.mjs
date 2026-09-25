import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import record from '../content/mediastinal-xray.before.json' with {type:'json'};
import transition from '../content/mediastinal-xray.transition.json' with {type:'json'};
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {beforeMediastinalXray} from './mediastinal-xray-history.mjs';
import {beforeLaminaPathology} from './lamina-pathology-history.mjs';
import {build} from './workspace-component-test-build.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
// Anatomical expectations are independent of runtime topic keys and saved hashes.
const expected=new Map([
  ['FMA3736',[/^Ascending aorta$/, /elongation/, /not synonymous with an aneurysm/]],
  ['FMA3768',[/^Arch of aorta$/, /left outer contour/, /left main bronchus/]],
  ['FMA87217',[/^Descending thoracic aorta$/, /down from the knuckle/, /circumference/]],
  ['FMA4720',[/^Superior vena cava$/, /right border of the vascular pedicle/, /SVC lumen/]],
  ['FMA4838',[/^Azygos vein$/, /azygos arch/, /not a stand-alone diagnosis/]],
]);
const live=await contentContext(),api=beforeLaminaPathology(live.api),{catalog}=live,display=api.bodyDisplayCatalog(catalog);
const before=beforeMediastinalXray(api);
assert.equal(beforeMediastinalXray(before),before);
assert.equal(hash(display),record.catalogHash);
assert.equal(hash(pins),record.originalPinsHash);
assert.equal(hash(wholeBodyTeachingSnapshot(before,catalog)),record.previousAllLessonsAndRecipesHash,'Unrelated teaching or recipes changed');
assert.deepEqual(record.entries.map(e=>e.identity.fmaId).sort(),[...expected.keys()].sort());
const selected=new Map(record.entries.map(e=>[e.identity.id,e]));
const exported=new Map(api.bodyContentRecords(display).map(e=>[e.id,e]));
const validate=await contentValidator(live.registry);
const checkAnatomy=(s,l)=>{
  const [name,...patterns]=expected.get(s.fmaId);assert.match(s.name,name);
  for(const p of patterns)assert.match(l.body,p);
};

// Exercise the existing viewer's real details callback and source-note component.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const built=await build({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const {SourceDisplayNotes}=scope.exports;
const source=await readFile('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(node){
  if(ts.isArrowFunction(node)&&node.body.getText(ast).includes('const content = bodyContent(selected, value);')){
    assert.equal(callback,undefined);callback=node.getText(ast);
  }
  ts.forEachChild(node,visit);
}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
let changed=0,unchanged=0,rendered=0,rejected=0;
for(const s of display.structures)for(const tab of api.contentTabs){
  const e=selected.get(s.id),lesson=api.mediastinalXrayLesson(s,tab);
  if(!e||tab!=='xray'){
    assert.equal(lesson,undefined);assert.deepEqual(api.bodyLesson(s,tab),before.bodyLesson(s,tab));unchanged++;continue;
  }
  changed++;assert.deepEqual(s,e.identity);
  assert.deepEqual(e.identity,pins.entries.find(p=>p.identity.id===s.id).identity);
  assert.equal(e.previous.readiness,'pending');assert.deepEqual(before.bodyLesson(s,tab),e.previous);
  assert.deepEqual(api.bodyLesson(s,tab),lesson);assert.equal(lesson.readiness,'draft');checkAnatomy(s,lesson);
  assert.equal(hash(lesson),transition.entries.find(t=>t.id===s.id).lessonHash);
  assert.deepEqual(exported.get(s.id).content.xray,lesson);assert(validate(exported.get(s.id)));
  assert.equal(exported.get(s.id).validation.clinicalApproval,'not-included');
  assert.match(lesson.note,/review pending/);assert.match(lesson.note,/access remain independent/);
  assert(lesson.bullets.some(b=>b.includes('no radiograph')));
  const {readiness:_r,...shown}=lesson;assert.deepEqual(api.bodyContent(s,tab),shown);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:display,side:'both',exam:false,openNested(){throw Error('Unexpected navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,lesson.body))));
  for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const url of lesson.citations){assert.equal(new URL(url).protocol,'https:');assert(html.includes(url));}
  assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));rendered++;
  const saved=structuredClone(lesson);lesson.bullets.push('foreign');lesson.citations.push('foreign');
  assert.deepEqual(api.mediastinalXrayLesson(s,tab),saved,'Detached results required');
}
assert.equal(changed,5);assert.equal(unchanged,9931);assert.equal(rendered,5);
const leaves=(v,path=[])=>v===null||typeof v!=='object'?[path]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...path,k]));
for(const {identity} of record.entries){
  for(const path of leaves(identity)){
    const bad=structuredClone(identity);let cursor=bad;
    for(const k of path.slice(0,-1))cursor=cursor[k];
    const k=path.at(-1),v=cursor[k];cursor[k]=typeof v==='number'?v+.01:typeof v==='boolean'?!v:String(v)+'-foreign';
    assert.equal(api.mediastinalXrayLesson(bad,'xray'),undefined);assert.equal(api.bodyLesson(bad,'xray').readiness,'pending');rejected++;
  }
  for(const other of record.entries)if(other.identity.id!==identity.id)assert.throws(()=>checkAnatomy(identity,api.mediastinalXrayLesson(other.identity,'xray')));
}
const first=record.entries[0];
assert.throws(()=>beforeMediastinalXray({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='xray'?structuredClone(first.previous):api.bodyLesson(s,t);}}),/Mixed/);
assert.throws(()=>beforeMediastinalXray({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='xray'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t);}}),/Unrecorded/);
console.log(JSON.stringify({changed,unchanged,rendered,rejected,catalogUnchanged:true,clinicalApproval:false}));
