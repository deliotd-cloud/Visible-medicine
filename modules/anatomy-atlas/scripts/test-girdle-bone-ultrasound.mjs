// Exact five-source educational ultrasound transition. No clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import pins from '../content/girdle-bone-ultrasound-pins.json' with {type:'json'};

const parentCommit='3db69cc3f712c7af256650dc645499752ca9adcb';
const pinHash='b7f114cb431e73eca380b017ebe74ab1657639c3e8f4f25ccbc21f1317b4dc19';
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(sha(pins),pinHash);
assert.equal(pins.parentCommit,parentCommit);
assert.equal(pins.entries.length,5);
assert.equal(new Set(pins.entries.map(e=>e.identity.id)).size,5);
assert.deepEqual(pins.entries.map(e=>e.group).sort(),['clavicle','hip','hip','humerus','scapula']);

const {api:current,catalog:raw,body:records}=await contentContext();
const display=current.bodyDisplayCatalog(raw);
const old=await exactSourceHistoryApi(parentCommit,'review-security',{
 'content/body-renderer-revision.json':await readFile('content/body-renderer-revision.json','utf8'),
});
const genuineOld=await exactSourceHistoryApi(parentCommit,'review-security');
assert.equal(sha(display),pins.catalogHash);
assert.deepEqual(display,old.bodyDisplayCatalog(raw));
assert.deepEqual(current.structures,old.structures);
assert.deepEqual(current.dissectionProfiles,old.dissectionProfiles);
assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
assert.deepEqual(display.bundles.filter(b=>pins.bundles.some(p=>p.id===b.id)),pins.bundles);
assert.equal(display.structures.length*current.contentTabs.length,9936);
const entries=new Map(pins.entries.map(e=>[e.identity.id,e]));
for(const entry of pins.entries){
 assert.deepEqual(display.structures.filter(s=>s.id===entry.identity.id),[entry.identity]);
 assert.deepEqual(old.bodyLesson(entry.identity,'ultrasound'),entry.previous);
 assert.equal(entry.previous.readiness,'pending');
}

const compiled=await build({stdin:{contents:`export {girdleBoneUltrasoundLesson} from './lib/girdle-bone-ultrasound';
export * from './content/girdle-bone-ultrasound';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export {bodyReviewDisplayMatches} from './lib/body-review-display-integrity';
export * from './lib/body-review-api';
export * from './lib/body-review-decisions';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm'});
const direct=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const lesson=direct.girdleBoneUltrasoundLesson;
assert.equal(typeof lesson,'function');
const shown=value=>{const {readiness:_readiness,...content}=value;return content;};
let changed=0,unchanged=0;
for(const s of display.structures)for(const tab of current.contentTabs){
 const prior=old.bodyLesson(s,tab),now=current.bodyLesson(s,tab);
 if(entries.has(s.id)&&tab==='ultrasound'){
  assert.deepEqual(prior,entries.get(s.id).previous);
  assert.deepEqual(now,lesson(s,tab));
  assert.equal(now.readiness,'draft');
  assert.notDeepEqual(now,prior);
  assert.deepEqual(current.bodyContent(s,tab),shown(now));
  assert.deepEqual(records.find(r=>r.id===s.id)?.content[tab],now);
  assert.match(now.title,/draft/i);
  assert.match(now.note,/revision.bound radiologist review pending/i);
  assert.match(now.note,/patient|registration/i);
  assert.match(now.note,/case|lecture|independent/i);
  assert(now.body.trim()&&now.body.length<2000);
  assert(now.bullets.length>=1&&now.bullets.length<=5);
  assert(now.bullets.every(b=>typeof b==='string'&&b.trim()&&b.length<600));
  assert(now.citations.length>=1&&now.citations.length<=5);
  assert(now.citations.every(url=>/^https:\/\/[^\s]+$/.test(url)));
  changed++;
 }else{
  assert.equal(lesson(s,tab),undefined,s.id+'|'+tab);
  assert.deepEqual(now,prior,s.id+'|'+tab);
  assert.deepEqual(current.bodyContent(s,tab),old.bodyContent(s,tab));
  unchanged++;
 }
}
assert.equal(changed,5);
assert.equal(unchanged,9931);
const oldRecords=old.bodyContentRecords(raw);
assert.equal(records.length,oldRecords.length);
for(let index=0;index<records.length;index++){
 const now=records[index],prior=oldRecords[index];assert.equal(now.id,prior.id);
 if(!entries.has(now.id)){assert.deepEqual(now,prior);continue;}
 for(const key of Object.keys(now))if(key!=='content')assert.deepEqual(now[key],prior[key]);
 for(const tab of current.contentTabs)if(tab!=='ultrasound')assert.deepEqual(now.content[tab],prior.content[tab]);
}

const paths=(value,predicate,path=[])=>[
 ...(predicate(value)?[path]:[]),
 ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>paths(child,predicate,[...path,key])):[]),
];
const at=(value,path)=>path.reduce((part,key)=>part[key],value);
let sourceRefusals=0;
for(const {identity} of pins.entries){
 const original=lesson(identity,'ultrasound');
 const clean=structuredClone(original);
 original.bullets.push('foreign');original.citations.push('https://foreign.example');
 assert.deepEqual(lesson(identity,'ultrasound'),clean,'Fresh lesson arrays');
 for(const path of paths(identity,v=>v===null||typeof v!=='object')){
  const bad=structuredClone(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1),value=parent[key];
  parent[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
  assert.equal(lesson(bad,'ultrasound'),undefined,path.join('.'));sourceRefusals++;
 }
 for(const path of paths(identity,Array.isArray)){
  const bad=structuredClone(identity);at(bad,path).push('foreign');
  assert.equal(lesson(bad,'ultrasound'),undefined,path.join('.'));sourceRefusals++;
 }
 const bad={...identity,unexpected:true};assert.equal(lesson(bad,'ultrasound'),undefined);sourceRefusals++;
 for(const tab of current.contentTabs)if(tab!=='ultrasound')assert.equal(lesson(identity,tab),undefined);
}
assert.equal(lesson({id:'foreign'},'ultrasound'),undefined);
for(const reference of Object.values(direct.girdleBoneUltrasoundReferences)){
 assert.match(reference,/^https:\/\/[^\s]+$/);
}

let packets=0,changedPackets=0,stale=0,storageCalls=0;
for(const s of display.structures){
 const previous=await old.bodyReviewMaterial(s.id),now=await direct.bodyReviewMaterial(s.id);
 const priorContext=await old.bodyReviewContext(s.id),context=await direct.bodyReviewContext(s.id);
 assert.equal(now.approval,false);
 assert.equal(await direct.bodyReviewDisplayMatches(now,s.id),true,'Display integrity '+s.id);
 assert.deepEqual(await direct.parseBodyReviewResponse(now,s.id),now,'Packet parser '+s.id);
 for(const key of ['source','reasoning','guidedTours'])assert.deepEqual(now[key],previous[key]);
 if(!entries.has(s.id)){
  assert.deepEqual(now,previous,'Unrelated review packet '+s.id);
  assert.deepEqual(context,priorContext,'Unrelated review context '+s.id);
 }else{
  assert.equal(context.sourceHash,priorContext.sourceHash);
  assert.equal(context.revisions.geometry,priorContext.revisions.geometry);
  assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
  assert.deepEqual(now.topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...current.bodyLesson(s,'ultrasound')});
  assert.equal(await direct.parseBodyReviewResponse(await genuineOld.bodyReviewMaterial(s.id),s.id),null);
  for(const delta of [{materialHash:priorContext.materialHash},{revisionHash:priorContext.revisions.teaching}]){
   const body={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
    draft:direct.blankBodyReview(context,'teaching'),...delta};
   const response=await direct.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',
    headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_GIRDLE_US_TEST'},
    body:JSON.stringify(body)}),{prepare(){storageCalls++;throw Error('Stale review reached storage');}});
   assert.equal(response.status,409);stale++;
  }
  changedPackets++;
 }
 packets++;
}
assert.equal(packets,1104);assert.equal(changedPackets,5);
assert.equal(stale,10);assert.equal(storageCalls,0);

const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';export {ComponentImagingNotes} from './app/component-imaging-notes';",resolveDir:process.cwd(),loader:'tsx'},
 bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};
runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require:id=>id==='react'?React:require(id)});
const callback=bodyNoteRenderCallback(await readFile('app/body-explorer.tsx','utf8'));
let noteRenders=0;
for(const {identity} of pins.entries){
 const currentLesson=current.bodyLesson(identity,'ultrasound');
 const code=ts.transpile(`(${callback})('ultrasound')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
 const html=render(runInNewContext(code,{React,SourceDisplayNotes:scope.exports.SourceDisplayNotes,
  ComponentImagingNotes:scope.exports.ComponentImagingNotes,ScanLine:()=>React.createElement('svg'),
  selected:identity,catalog:display,side:identity.laterality,exam:false,openNested:()=>{},
  bodyContent:current.bodyContent,WorkspaceModeButton:({children})=>React.createElement('button',null,children)}));
 assert(html.includes(render(React.createElement('p',null,currentLesson.body))));
 for(const bullet of currentLesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
 for(const [index,url] of currentLesson.citations.entries()){
  assert(html.includes(`href="${url}"`));assert(html.includes(`Reference ${index+1}`));
 }
 assert(html.includes('review pending'));noteRenders++;
}
assert.equal(noteRenders,5);
console.log(JSON.stringify({changed,unchanged,sourceRefusals,reviewPackets:packets,changedPackets,
 staleRejectedBeforeStorage:stale,storageCalls,noteRenders,clinicalApproval:false}));
