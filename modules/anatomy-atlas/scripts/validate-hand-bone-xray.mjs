import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import pins from '../content/acral-bone-imaging-pins.json' with {type:'json'};
import beforeRecord from '../content/hand-bone-xray.before.json' with {type:'json'};
import transition from '../content/hand-bone-xray.transition.json' with {type:'json'};
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {beforeHandBoneXray} from './hand-bone-xray-history.mjs';
import {build} from './workspace-component-test-build.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expectedFmas=[24464,24466,24468,24470,24472,24465,24467,24469,24471,24473,24450,24451,24452,24453,24454,65470,71915,71908,71916,66791,24455,24456,24457,24458,23938,23940,23942,23944,24459,24460,24461,24462,24463,23951,23953,23955,23957,23959].map(n=>'FMA'+n).sort();
// Independent anatomical expectations: do not derive this mapping from runtime groups
// or the generated transition. A correctly hashed lesson can still describe the wrong bone.
const anatomicalGroups=[
  {ids:[24464,24465],name:/first metacarpal/i,body:[/first metacarpal/i,/CMC/,/MCP/]},
  {ids:[24466,24467],name:/second metacarpal/i,body:[/second metacarpal/i,/index/,/MCP/]},
  {ids:[24468,24469],name:/third metacarpal/i,body:[/third metacarpal/i,/middle finger/,/MCP/]},
  {ids:[24470,24471],name:/fourth metacarpal/i,body:[/fourth metacarpal/i,/ring-finger/,/MCP/]},
  {ids:[24472,24473],name:/fifth metacarpal/i,body:[/fifth metacarpal/i,/little finger/,/neck/]},
  {ids:[24450,65470],name:/proximal phalanx.*thumb/i,body:[/thumb proximal phalanx/i,/MCP/,/\(IP\)/]},
  {ids:[24451,24452,24453,24454,71915,71908,71916,66791],name:/proximal phalanx.*finger/i,body:[/finger proximal phalanx/i,/MCP/,/\(PIP\)/]},
  {ids:[24455,24456,24457,24458,23938,23940,23942,23944],name:/middle phalanx.*finger/i,body:[/middle phalanx/i,/PIP/,/\(DIP\)/]},
  {ids:[24459,23951],name:/distal phalanx.*thumb/i,body:[/thumb distal phalanx/i,/thumb IP joint/,/tuft/]},
  {ids:[24460,24461,24462,24463,23953,23955,23957,23959],name:/distal phalanx.*finger/i,body:[/finger distal phalanx/i,/DIP joint/,/tuft/]},
];
const expectedAnatomy=new Map(anatomicalGroups.flatMap(g=>g.ids.map(id=>['FMA'+id,g])));
assert.deepEqual([...expectedAnatomy.keys()].sort(),expectedFmas);
function assertBoneTeaching(s,lesson){
  const expected=expectedAnatomy.get(s.fmaId);assert(expected);
  assert.match(s.name,expected.name);
  for(const pattern of expected.body)assert.match(lesson.body,pattern,s.fmaId+' has the wrong ray/level teaching');
}
const live=await contentContext(),{api,catalog}=live,display=api.bodyDisplayCatalog(catalog);
assert.equal(beforeRecord.parentCommit,'5f5a839b9c528d50ae67bd58c226bcfd3b69e6cd');
assert.equal(transition.parentCommit,beforeRecord.parentCommit);
assert.equal(transition.beforeHash,hash(beforeRecord));
assert.equal(beforeRecord.originalPinsHash,hash(pins),'Original acral bone pins changed');
assert.equal(beforeRecord.catalogHash,hash(display),'Source geometry or display changed');
assert.deepEqual(beforeRecord.entries.map(e=>e.identity.fmaId).sort(),expectedFmas);
assert.deepEqual(transition.entries.map(e=>e.id),beforeRecord.entries.map(e=>e.identity.id));
const selected=new Map(beforeRecord.entries.map(e=>[e.identity.id,e]));
assert.equal(selected.size,38);
for(const entry of beforeRecord.entries){
  assert.deepEqual(entry.identity,pins.entries.find(p=>p.identity.id===entry.identity.id)?.identity);
  assert.equal(entry.previous.readiness,'pending');
}
const before=beforeHandBoneXray(api);
assert.equal(beforeHandBoneXray(before),before,'History must be idempotent');
assert.equal(hash(wholeBodyTeachingSnapshot(before,catalog)),beforeRecord.previousAllLessonsAndRecipesHash,'Other teaching or recipes changed');

// Render the callback extracted from the actual viewer with its actual source-note component.
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
const records=new Map(api.bodyContentRecords(display).map(r=>[r.id,r]));
const validate=await contentValidator(live.registry);
let changed=0,unchanged=0,rendered=0,rejected=0;
const lessonBodies=new Set(),lessonTitles=new Set();
const thumbProximal=new Set(['FMA65470','FMA24450']);
const thumbDistal=new Set(['FMA23951','FMA24459']);
for(const s of display.structures)for(const tab of api.contentTabs){
  const entry=selected.get(s.id),draft=api.handBoneXrayLesson(s,tab);
  if(!entry||tab!=='xray'){
    assert.equal(draft,undefined);
    assert.deepEqual(api.bodyLesson(s,tab),before.bodyLesson(s,tab));
    unchanged++;continue;
  }
  changed++;
  assert.deepEqual(s,entry.identity);
  assert.deepEqual(before.bodyLesson(s,tab),entry.previous);
  assert.deepEqual(api.bodyLesson(s,tab),draft);
  assert.equal(draft.readiness,'draft');
  assertBoneTeaching(s,draft);
  assert.equal(hash(draft),transition.entries.find(e=>e.id===s.id)?.lessonHash);
  assert.deepEqual(records.get(s.id).content.xray,draft);
  assert.equal(records.get(s.id).validation.clinicalApproval,'not-included');
  assert(validate(records.get(s.id)));
  const {readiness:_readiness,...shown}=draft;
  assert.deepEqual(api.bodyContent(s,tab),shown);
  assert(draft.body.length>30);
  lessonBodies.add(draft.body);lessonTitles.add(draft.title);
  assert(draft.title.startsWith(s.name+' ·'));
  if(thumbProximal.has(s.fmaId)){
    assert.match(draft.body,/MCP/);assert.match(draft.body,/IP/);
    assert(!/PIP|DIP/.test(draft.body));assert(draft.bullets.some(b=>b.includes('no middle phalanx')));
  }
  if(thumbDistal.has(s.fmaId)){
    assert.match(draft.body,/thumb IP joint/);assert.match(draft.body,/tuft/);
    assert(!/DIP/.test(draft.body));
  }
  assert(draft.bullets.length>=2);
  assert.equal(new Set(draft.citations).size,draft.citations.length);
  assert(draft.note.includes('Anatomy/radiology review pending'));
  assert(draft.note.includes('paid-lecture access remain independent'));
  assert.match(draft.note,/No X-ray image|No radiograph/i);
  for(const url of api.handBoneXrayReferences){
    assert.equal(new URL(url).protocol,'https:');
    assert(draft.citations.includes(url));
  }
  const jsx=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:tab,bodyContent:api.bodyContent,selected:s,SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog:display,side:'both',exam:false,openNested(){throw Error('No automatic specimen navigation');}});
  const html=render(jsx);
  assert(html.includes(render(React.createElement('p',null,draft.body))));
  for(const bullet of draft.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
  for(const url of draft.citations)assert(html.includes(url.replaceAll('&','&amp;')));
  assert(html.includes('No imaging study loaded'));
  assert(html.includes('Anatomy/radiology review pending'));
  rendered++;
  const copy=structuredClone(draft);
  draft.bullets.push('foreign');draft.citations.push('foreign');
  assert.deepEqual(api.handBoneXrayLesson(s,tab),copy,'Draft arrays must be detached');
  assert.deepEqual(api.bodyLesson(s,tab),copy,'Viewer lesson must be detached');
}
assert.equal(changed,38);assert.equal(unchanged,9898);assert.equal(rendered,38);
assert.equal(lessonBodies.size,10);assert.equal(lessonTitles.size,38);
let swappedGroupsRejected=0;
for(const {identity} of beforeRecord.entries)for(const other of beforeRecord.entries){
  if(expectedAnatomy.get(identity.fmaId)===expectedAnatomy.get(other.identity.fmaId))continue;
  assert.throws(()=>assertBoneTeaching(identity,api.handBoneXrayLesson(other.identity,'xray')));
  swappedGroupsRejected++;
}

const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,item])=>leaves(item,[...path,key]));
for(const {identity} of beforeRecord.entries){
  for(const path of leaves(identity)){
    const bad=structuredClone(identity);let cursor=bad;
    for(const key of path.slice(0,-1))cursor=cursor[key];
    const key=path.at(-1),value=cursor[key];
    cursor[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
    assert.equal(api.handBoneXrayLesson(bad,'xray'),undefined);
    assert.equal(api.bodyLesson(bad,'xray').readiness,'pending');rejected++;
  }
  for(const mutate of [s=>s.sources.pop(),s=>s.regions.push('foreign'),s=>{delete s.anchor;},s=>{delete s.sources;}]){
    const bad=structuredClone(identity);mutate(bad);
    assert.equal(api.handBoneXrayLesson(bad,'xray'),undefined);rejected++;
  }
}
const first=beforeRecord.entries[0];
assert.throws(()=>beforeHandBoneXray({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='xray'?structuredClone(first.previous):api.bodyLesson(s,t);}}),/Mixed/);
assert.throws(()=>beforeHandBoneXray({...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='xray'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t);}}),/Unrecorded/);
assert.throws(()=>beforeHandBoneXray({...api,handBoneXrayLesson(s,t){const lesson=api.handBoneXrayLesson(s,t);return lesson?{...lesson,body:'foreign'}:lesson;}}),/Unrecorded/);
const original=before.bodyLesson(first.identity,'xray');original.body='foreign';
assert.deepEqual(before.bodyLesson(first.identity,'xray'),first.previous);
console.log(JSON.stringify({drafts:changed,unchangedTopics:unchanged,identityMutationsRejected:rejected,swappedGroupsRejected,actualViewerRenders:rendered,geometryChanged:false,recipesChanged:false,imagesImported:false,clinicalApproval:false}));
