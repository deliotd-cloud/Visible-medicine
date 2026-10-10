// Four pinned vocal tissues: Anatomy/Function only. Existing quizzes stay exact.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build as reviewBuild} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import transition from '../content/vocal-tissue-teaching.transition.json' with {type:'json'};
import pins from '../content/vocal-tissue-teaching-pins.json' with {type:'json'};

const parentCommit='169e3aef92e866dd98e97f5394c1d2c908268547';
const fmaIds=['FMA46592','FMA46593','FMA55245','FMA55246'];
const sourceFiles={FMA55245:'FJ2805',FMA55246:'FJ2787',FMA46592:'FJ2806',FMA46593:'FJ2788'};
const tabs=['anatomy','function'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,api.bodyLesson(s,tab)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
const {api:current,catalog:raw,body:currentRecords}=await contentContext();
const display=current.bodyDisplayCatalog(raw);
const old=await exactSourceHistoryApi(parentCommit,'review-security',{'content/body-renderer-revision.json':await readFile('content/body-renderer-revision.json','utf8')});
const genuineOld=await exactSourceHistoryApi(parentCommit,'review-security');
assert.equal(transition.parentCommit,parentCommit);
assert.equal(pins.sourceCommit,parentCommit);
assert.equal(pins.sourceVersion,'4.0');assert.equal(pins.license,'CC-BY-4.0');
assert.equal(hash(pins),transition.originalPinsHash);
assert.deepEqual(display,old.bodyDisplayCatalog(raw));
assert.equal(hash(display),transition.catalogHash);
assert.deepEqual(current.structures,old.structures);
assert.deepEqual(current.dissectionProfiles,old.dissectionProfiles);
assert.equal(hash(snapshot(old,display)),transition.previousSnapshotHash);
assert.equal(hash(snapshot(current,display)),transition.currentSnapshotHash);
assert.equal(pins.entries.length,4);
assert.deepEqual(pins.entries.map(entry=>entry.identity.fmaId).sort(),fmaIds);
assert.equal(new Set(pins.entries.map(entry=>entry.identity.id)).size,4);
const selectedIds=new Set(pins.entries.map(entry=>entry.identity.id));
const families=new Map();
for(const {identity,family}of pins.entries){
 assert.deepEqual(display.structures.filter(s=>s.id===identity.id),[identity]);
 assert.equal(identity.region,'head-neck');assert(['left','right'].includes(identity.laterality));
 assert.deepEqual(identity.sources.map(source=>source.file),[sourceFiles[identity.fmaId]]);
 assert(['ligament','vocalis'].includes(family));
 families.set(family,[...(families.get(family)??[]),identity]);
}
assert.equal(families.size,2);
for(const pair of families.values())assert.deepEqual(pair.map(identity=>identity.laterality).sort(),['left','right']);
const entries=new Map(transition.entries.map(entry=>[entry.identity.id+'|'+entry.tab,entry]));
assert.equal(transition.entries.length,8);assert.equal(entries.size,8);
assert.deepEqual([...entries.keys()].sort(),pins.entries.flatMap(entry=>tabs.map(tab=>entry.identity.id+'|'+tab)).sort());
for(const entry of transition.entries){
 assert.deepEqual(pins.entries.find(pin=>pin.identity.id===entry.identity.id)?.identity,entry.identity);
 assert(tabs.includes(entry.tab));
}

const oldRecords=old.bodyContentRecords(raw);assert.equal(currentRecords.length,oldRecords.length);
let changed=0,unrelated=0,sourceRefusals=0,existingQuizTopicsExact=0;
for(const s of display.structures)for(const tab of current.contentTabs){
 const before=old.bodyLesson(s,tab),now=current.bodyLesson(s,tab),entry=entries.get(s.id+'|'+tab);
 const direct=current.vocalTissueTeachingLesson(s,tab);
 if(entry){
  assert.deepEqual(before,entry.previous,s.id+'|'+tab);
  assert.equal(hash(before),entry.previousHash,s.id+'|'+tab);
  assert.equal(hash(now),entry.currentHash,s.id+'|'+tab);
  assert.notDeepEqual(now,before,s.id+'|'+tab);
  assert.deepEqual(direct,now);
  assert.equal(now.readiness,'draft');
  assert.deepEqual(current.bodyContent(s,tab),shown(now));
  assert.deepEqual(currentRecords.find(record=>record.id===s.id)?.content[tab],now);
  assert.match(now.note,/review pending/i);
  assert(now.citations.length>0);assert.equal(new Set(now.citations).size,now.citations.length);
  assert(now.bullets.some(bullet=>bullet.includes(`Source identity: ${s.fmaId} · ${s.laterality} · ${s.sources.map(source=>source.file).join(', ')}`)));
  changed++;
 }else{
  assert.equal(direct,undefined,s.id+'|'+tab);
  assert.deepEqual(now,before,s.id+'|'+tab);
  assert.deepEqual(current.bodyContent(s,tab),old.bodyContent(s,tab));unrelated++;
  if(selectedIds.has(s.id)&&tab==='quiz')existingQuizTopicsExact++;
 }
}
assert.equal(changed,8);assert.equal(unrelated,9928);assert.equal(existingQuizTopicsExact,4);
for(const pair of families.values())for(const tab of tabs){
 const [a,b]=pair.map(identity=>current.bodyLesson(identity,tab));
 assert.equal(a.body,b.body);assert.deepEqual(a.citations,b.citations);
 for(const identity of pair)assert.match(current.bodyLesson(identity,tab).title,new RegExp(identity.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
}
for(const [index,record]of currentRecords.entries()){
 const previous=oldRecords[index];assert.equal(record.id,previous.id);
 if(!selectedIds.has(record.id)){assert.deepEqual(record,previous,'Unrelated content record '+record.id);continue;}
 for(const key of Object.keys(record))if(key!=='content')assert.deepEqual(record[key],previous[key],record.id+'|'+key);
 for(const tab of current.contentTabs)if(!tabs.includes(tab))assert.deepEqual(record.content[tab],previous.content[tab],record.id+'|'+tab);
}
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
for(const {identity}of pins.entries){
 for(const path of leaves(identity)){
  const bad=structuredClone(identity);let node=bad;
  for(const key of path.slice(0,-1))node=node[key];
  const key=path.at(-1),value=node[key];node[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
  for(const tab of tabs){assert.equal(current.vocalTissueTeachingLesson(bad,tab),undefined);sourceRefusals++;}
 }
 for(const bad of [{...identity,foreign:true},(()=>{const copy=structuredClone(identity);copy.sources.push(structuredClone(copy.sources[0]));return copy;})()])
  for(const tab of tabs){assert.equal(current.vocalTissueTeachingLesson(bad,tab),undefined);sourceRefusals++;}
 for(const tab of current.contentTabs)if(!tabs.includes(tab))assert.equal(current.vocalTissueTeachingLesson(identity,tab),undefined);
}

const compiled=await reviewBuild({stdin:{contents:"export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export {bodyReviewDisplayMatches} from './lib/body-review-display-integrity';export {postBodyDecision} from './lib/body-review-api';export {blankBodyReview} from './lib/body-review-decisions';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const review=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
let packets=0,unrelatedPackets=0,oldRefusals=0,staleRejected=0,storageCalls=0,forgedRefusals=0;
for(const s of display.structures){
 const previous=await old.bodyReviewMaterial(s.id),now=await review.bodyReviewMaterial(s.id);
 const previousContext=await old.bodyReviewContext(s.id),context=await review.bodyReviewContext(s.id);
 assert.equal(now.approval,false);
 assert.equal(await review.bodyReviewDisplayMatches(now,s.id),true);
 assert.deepEqual(await review.parseBodyReviewResponse(now,s.id),now);packets++;
 if(!selectedIds.has(s.id)){
  assert.deepEqual(now,previous,'Unrelated Review packet '+s.id);
  assert.deepEqual(context,previousContext,'Unrelated Review context '+s.id);unrelatedPackets++;continue;
 }
 for(const tab of tabs)assert.deepEqual(review.bodyReviewSnapshot(s.id).topics.find(topic=>topic.tab===tab),{tab,...current.bodyLesson(s,tab)});
 assert.deepEqual(review.bodyReviewSnapshot(s.id).topics.find(topic=>topic.tab==='quiz'),old.bodyReviewSnapshot(s.id).topics.find(topic=>topic.tab==='quiz'));
 assert.equal(previousContext.sourceHash,context.sourceHash);
 assert.equal(previousContext.revisions.geometry,context.revisions.geometry);
 assert.notEqual(previousContext.revisions.teaching,context.revisions.teaching);
 assert.equal(await review.parseBodyReviewResponse(await genuineOld.bodyReviewMaterial(s.id),s.id),null);oldRefusals++;
 for(const delta of [{materialHash:previousContext.materialHash},{revisionHash:previousContext.revisions.teaching}]){
  const body={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:review.blankBodyReview(context,'teaching'),...delta};
  const response=await review.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',
   headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_VOCAL_TEST'},
   body:JSON.stringify(body)}),{prepare(){storageCalls++;throw Error('Stale review reached storage');}});
  assert.equal(response.status,409);staleRejected++;
 }
 for(const tab of tabs)for(const alter of [topic=>topic.body+=' foreign',topic=>topic.bullets[0]+=' foreign',topic=>topic.citations[0]='https://foreign.example/',topic=>topic.note+=' foreign']){
  const bad=structuredClone(now);alter(bad.topics.find(topic=>topic.tab===tab));
  assert.equal(await review.parseBodyReviewResponse(bad,s.id),null);forgedRefusals++;
 }
}
assert.equal(packets,1104);assert.equal(unrelatedPackets,1100);assert.equal(oldRefusals,4);
assert.equal(staleRejected,8);assert.equal(storageCalls,0);assert.equal(forgedRefusals,32);

const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require:id=>id==='react'?React:require(id)});
const callback=bodyNoteRenderCallback(await readFile('app/body-explorer.tsx','utf8'));
let noteRenders=0;
for(const {identity}of pins.entries)for(const tab of tabs){
 const lesson=current.bodyLesson(identity,tab),code=ts.transpile(`(${callback})('${tab}')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
 const html=render(runInNewContext(code,{React,SourceDisplayNotes:scope.exports.SourceDisplayNotes,selected:identity,
  bodyContent:current.bodyContent,WorkspaceModeButton:({children})=>React.createElement('button',null,children)}));
 assert(html.includes(render(React.createElement('p',null,lesson.body))));
 for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
 for(const [index,url]of lesson.citations.entries()){assert(html.includes(`href="${url}"`));assert(html.includes(`Reference ${index+1}`));}
 assert(html.includes('review pending'));noteRenders++;
}
assert.equal(noteRenders,8);
console.log(JSON.stringify({changedVocalTissueTopics:changed,otherTopicsExact:unrelated,existingQuizTopicsExact,sourceRefusals,reviewPackets:packets,unrelatedReviewPacketsExact:unrelatedPackets,genuineOldPacketsRefused:oldRefusals,staleRejectedBeforeStorage:staleRejected,forgedRefusals,noteRenders,clinicalApproval:false}));
