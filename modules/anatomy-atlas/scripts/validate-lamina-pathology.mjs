import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import pins from '../content/cranial-boundary-clinical-pins.json' with {type:'json'};
import record from '../content/lamina-pathology.before.json' with {type:'json'};
import transition from '../content/lamina-pathology.transition.json' with {type:'json'};
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {beforeLaminaPathology} from './lamina-pathology-history.mjs';
import {build} from './workspace-component-test-build.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const live=await contentContext(),{api,catalog}=live,display=api.bodyDisplayCatalog(catalog);
const before=beforeLaminaPathology(api),identity=record.entries[0].identity;
assert.equal(beforeLaminaPathology(before),before);
assert.equal(hash(display),record.catalogHash);assert.equal(hash(pins),record.originalPinsHash);
assert.equal(hash(wholeBodyTeachingSnapshot(before,catalog)),record.previousAllLessonsAndRecipesHash,'Unrelated teaching or recipes changed');
assert.equal(identity.id,'vm:anatomy:body:head-neck:midline:organ:lamina-terminalis');
assert.equal(identity.fmaId,'FMA61975');assert.equal(identity.laterality,'midline');
assert.equal(identity.bundle,'limbic-landmarks');assert.equal(identity.sourceTree,'isa');
assert.deepEqual(identity.sources.map(s=>s.file),['FJ1764','FJ1812']);
assert.deepEqual(record.entries.map(e=>e.tab),['clinical','pathology']);
for(const e of record.entries)assert.deepEqual(e.identity,identity);
const bundle=display.bundles.find(b=>b.id===identity.bundle);
const bytes=await readFile('public'+bundle.url.split('?')[0]);
assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
const exported=api.bodyContentRecords(display),records=new Map(exported.map(r=>[r.id,r]));
const registry=new Map([...live.shoulder,...exported].map(r=>[r.representationScope+'|'+r.id,r]));
const validate=await contentValidator(registry);

// Render the actual existing viewer callback, not a parallel mock panel.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const built=await build({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const {SourceDisplayNotes}=scope.exports,source=await readFile('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let callback;
function visit(node){
  if(ts.isArrowFunction(node)&&node.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert.equal(callback,undefined);callback=node.getText(ast);}
  ts.forEachChild(node,visit);
}
visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
let changed=0,unchanged=0,rendered=0,rejected=0;
for(const s of display.structures)for(const tab of api.contentTabs){
  const entry=record.entries.find(e=>e.identity.id===s.id&&e.tab===tab),lesson=api.laminaPathologyLesson(s,tab);
  if(!entry){assert.equal(lesson,undefined);assert.deepEqual(api.bodyLesson(s,tab),before.bodyLesson(s,tab));unchanged++;continue;}
  changed++;assert.deepEqual(s,identity);assert.deepEqual(api.bodyLesson(s,tab),lesson);assert.equal(lesson.readiness,'draft');
  assert.equal(hash(lesson),transition.entries.find(t=>t.tab===tab).lessonHash);
  assert.deepEqual(records.get(s.id).content[tab],lesson);assert(validate(records.get(s.id)));
  assert.equal(records.get(s.id).validation.clinicalApproval,'not-included');
  assert.match(lesson.note,/revision-bound radiologist review/);assert.match(lesson.note,/access remain independent/);
  assert(lesson.bullets.some(b=>b.includes('not a reconstructed continuous membrane')));
  if(tab==='clinical'){
    assert.deepEqual(lesson,{...entry.previous,bullets:entry.previous.bullets.map(b=>b.replace(' Pathology remains pending for appropriate structure-specific evidence.',''))});
    assert(!JSON.stringify(lesson).includes('Pathology remains pending'));
  }else{
    assert.equal(entry.previous.readiness,'pending');
    for(const p of [/lamina terminalis/i,/anteriorly/,/third ventricle/,/eight patients/,/selection features/])assert.match(lesson.body,p);
    const text=lesson.bullets.join(' ');
    for(const p of [/prepontine/,/alone does not identify/,/small descriptive series/,/gold-standard/,/no acquired MRI/])assert.match(text,p);
    assert.deepEqual(lesson.citations,['https://link.springer.com/article/10.1007/s00381-024-06323-w']);
  }
  const {readiness:_r,...shown}=lesson;assert.deepEqual(api.bodyContent(s,tab),shown);
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:display,side:'both',exam:false,openNested(){throw Error('Unexpected navigation');}});
  const html=render(jsx);assert(html.includes(render(React.createElement('p',null,lesson.body))));
  for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const url of lesson.citations)assert(html.includes(url));
  assert(html.includes('revision-bound radiologist review'));rendered++;
  const saved=structuredClone(lesson);lesson.bullets.push('foreign');lesson.citations.push('foreign');
  assert.deepEqual(api.laminaPathologyLesson(s,tab),saved,'Detached results required');
}
assert.equal(changed,2);assert.equal(unchanged,9934);assert.equal(rendered,2);
const leaves=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...p,k]));
const reject=bad=>{for(const tab of ['clinical','pathology']){assert.equal(api.laminaPathologyLesson(bad,tab),undefined);assert.equal(api.bodyLesson(bad,tab).readiness,'pending');rejected++;}};
for(const path of leaves(identity)){
  const bad=structuredClone(identity);let cursor=bad;
  for(const k of path.slice(0,-1))cursor=cursor[k];
  const k=path.at(-1),v=cursor[k];cursor[k]=typeof v==='number'?v+.01:typeof v==='boolean'?!v:String(v)+'-foreign';reject(bad);
}
for(const mutate of [s=>s.sources.reverse(),s=>s.sources.pop(),s=>s.sources.push(s.sources[0]),s=>{delete s.coverageNote;}]){const bad=structuredClone(identity);mutate(bad);reject(bad);}
assert.equal(api.laminaPathologyLesson(identity,'foreign'),undefined);
const first=record.entries[0];
assert.throws(()=>beforeLaminaPathology({...api,bodyLesson(s,t){return s.id===identity.id&&t===first.tab?structuredClone(first.previous):api.bodyLesson(s,t);}}),/Mixed/);
assert.throws(()=>beforeLaminaPathology({...api,bodyLesson(s,t){return s.id===identity.id&&t==='pathology'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t);}}),/Unrecorded/);
const legacyClinical=pins.entries.find(e=>e.identity.id===identity.id).previous.clinical;
const legacy={...api,bodyLesson(s,t){return s.id!==identity.id?api.bodyLesson(s,t):t==='clinical'?structuredClone(legacyClinical):t==='pathology'?structuredClone(record.entries[1].previous):api.bodyLesson(s,t);}};
assert.equal(beforeLaminaPathology(legacy),legacy);
assert.throws(()=>beforeLaminaPathology({...legacy,bodyLesson(s,t){const value=legacy.bodyLesson(s,t);return s.id===identity.id&&t==='clinical'?{...value,body:'unrecorded pending'}:value;}}),/Unrecorded/);
const report={changed,unchanged,rendered,rejected,catalogUnchanged:true,geometryUnchanged:true,clinicalApproval:false,browserAcceptance:false,beforeHash:hash(record),transitionHash:hash(transition)};
await writeFile('docs/lamina-pathology-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
