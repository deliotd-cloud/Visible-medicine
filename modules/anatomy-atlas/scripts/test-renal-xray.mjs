// Two exact source-bound root renal X-ray drafts and their offline transition.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {build as reviewBuild} from './workspace-test-build.mjs';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {beforeRenalXray} from './renal-xray-history.mjs';
import transition from '../content/renal-xray.transition.json' with {type:'json'};
import renalUltrasoundTransition from '../content/renal-ultrasound.transition.json' with {type:'json'};

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
const {api:current,catalog:raw,body:currentRecords}=await contentContext();
const display=current.bodyDisplayCatalog(raw);
const old=await exactSourceHistoryApi(transition.parentCommit,'review-security',{'content/body-renderer-revision.json':await readFile('content/body-renderer-revision.json','utf8')});
const genuineOld=await exactSourceHistoryApi(transition.parentCommit,'review-security');
assert.equal(transition.parentCommit,'ce9dcce39fb088975bee2ec890730d1ee153d70f');
assert.deepEqual(display,old.bodyDisplayCatalog(raw));
assert.equal(hash(display),transition.catalogHash);
assert.deepEqual(current.structures,old.structures);
assert.deepEqual(current.dissectionProfiles,old.dissectionProfiles);
assert.equal(hash(snapshot(old,display)),transition.previousSnapshotHash);
assert.equal(hash(snapshot(current,display)),transition.currentSnapshotHash);
assert.deepEqual(transition.newReferences,['renalPlainFilm','renalIvp','renalStoneRadiopacity']);
const entries=new Map(transition.entries.map(entry=>[entry.identity.id,entry]));
assert.equal(entries.size,2);
assert.deepEqual([...entries.values()].map(entry=>entry.identity.fmaId).sort(),['FMA7204','FMA7205']);
assert([...entries.values()].every(entry=>entry.tab==='xray'));
for(const entry of entries.values())assert.deepEqual(display.structures.filter(s=>s.id===entry.identity.id),[entry.identity]);
const pins=JSON.parse(await readFile('content/abdominal-organ-imaging-pins.json','utf8'));
assert.equal(hash(pins),transition.originalPinsHash);
assert.deepEqual(pins.entries.filter(entry=>entry.group==='kidney').map(entry=>entry.identity),[...entries.values()].map(entry=>entry.identity));
const oldRecords=old.bodyContentRecords(raw);
assert.equal(currentRecords.length,oldRecords.length);
let changed=0,other=0,sourceRefusals=0;
for(const s of display.structures)for(const tab of current.contentTabs){
 const before=old.bodyLesson(s,tab),now=current.bodyLesson(s,tab),target=entries.get(s.id);
 if(target&&tab==='xray'){
  assert.deepEqual(before,target.previous);assert.equal(hash(before),target.previousHash);
  assert.equal(hash(now),target.currentHash);assert.notDeepEqual(now,before);
  assert.equal(now.readiness,'draft');assert.equal(now.bullets.length,6);
  assert.deepEqual(current.abdominalOrganImagingLesson(s,tab),now);
  assert.deepEqual(current.bodyContent(s,tab),shown(now));
  assert.deepEqual(currentRecords.find(record=>record.id===s.id).content.xray,now);
  for(const key of transition.newReferences)assert(now.citations.includes(current.abdominalOrganImagingReferences[key]));
  assert.match(now.note,/review pending/i);changed++;
 }else{
  assert.deepEqual(now,before,s.id+'|'+tab);
  assert.deepEqual(current.bodyContent(s,tab),old.bodyContent(s,tab));
  if(target&&['ct','mri','ultrasound'].includes(tab))assert.deepEqual(current.abdominalOrganImagingLesson(s,tab),now);
  other++;
 }
}
assert.equal(changed,2);assert.equal(other,9934);
for(const [index,record] of currentRecords.entries()){
 const previous=oldRecords[index];assert.equal(record.id,previous.id);
 if(entries.has(record.id)){
  for(const key of Object.keys(record))if(key!=='content')assert.deepEqual(record[key],previous[key],record.id+'|'+key);
  for(const tab of current.contentTabs)if(tab!=='xray')assert.deepEqual(record.content[tab],previous.content[tab]);
 }else assert.deepEqual(record,previous,'Unrelated content metadata '+record.id);
}
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
for(const {identity}of entries.values())for(const path of leaves(identity)){
 const bad=structuredClone(identity);let node=bad;for(const key of path.slice(0,-1))node=node[key];
 const key=path.at(-1),value=node[key];node[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
 assert.equal(current.abdominalOrganImagingLesson(bad,'xray'),undefined);sourceRefusals++;
}

// Compare Review with the same current renderer: only renal teaching may differ.
const compiled=await reviewBuild({stdin:{contents:"export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export {bodyReviewDisplayMatches} from './lib/body-review-display-integrity';export {postBodyDecision} from './lib/body-review-api';export {blankBodyReview} from './lib/body-review-decisions';export {bodyLesson,bodyContent} from './app/body-content';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const review=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
let currentPackets=0,unrelatedPackets=0,oldRefusals=0,forgedRefusals=0,staleRejected=0,storageCalls=0;
for(const s of display.structures){
 const previous=await old.bodyReviewMaterial(s.id),now=await review.bodyReviewMaterial(s.id);
 const previousContext=await old.bodyReviewContext(s.id),context=await review.bodyReviewContext(s.id);
 assert.equal(now.approval,false);assert.equal(await review.bodyReviewDisplayMatches(now,s.id),true);
 assert.deepEqual(await review.parseBodyReviewResponse(now,s.id),now);currentPackets++;
 if(!entries.has(s.id)){
  assert.deepEqual(now,previous,'Unrelated Review packet '+s.id);assert.deepEqual(context,previousContext);unrelatedPackets++;continue;
 }
 const lesson=current.bodyLesson(s,'xray');
 assert.deepEqual(review.bodyReviewSnapshot(s.id).topics.find(topic=>topic.tab==='xray'),{tab:'xray',...lesson});
 assert.equal(previousContext.sourceHash,context.sourceHash);
 assert.equal(previousContext.revisions.geometry,context.revisions.geometry);
 assert.notEqual(previousContext.revisions.teaching,context.revisions.teaching);
 assert.equal(await review.parseBodyReviewResponse(await genuineOld.bodyReviewMaterial(s.id),s.id),null);oldRefusals++;
 for(const delta of [{materialHash:previousContext.materialHash},{revisionHash:previousContext.revisions.teaching}]){
  const body={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:review.blankBodyReview(context,'teaching'),...delta};
  const response=await review.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',
   headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_RENAL_XRAY_TEST'},
   body:JSON.stringify(body)}),{prepare(){storageCalls++;throw Error('Stale review reached storage');}});
  assert.equal(response.status,409);staleRejected++;
 }
 for(const alter of [topic=>topic.body+=' foreign',topic=>topic.bullets[0]+=' foreign',topic=>topic.citations[0]='https://foreign.example/',topic=>topic.note+=' foreign']){
  const bad=structuredClone(now);alter(bad.topics.find(topic=>topic.tab==='xray'));
  assert.equal(await review.parseBodyReviewResponse(bad,s.id),null);forgedRefusals++;
 }
}
assert.equal(currentPackets,1104);assert.equal(unrelatedPackets,1102);assert.equal(oldRefusals,2);assert.equal(forgedRefusals,8);
assert.equal(staleRejected,4);assert.equal(storageCalls,0);

const restored=beforeRenalXray(current,raw),restoredFromDisplay=beforeRenalXray(current,display);
assert.equal(beforeRenalXray(old,raw),old);assert.equal(beforeRenalXray(restored,raw),restored);
assert.equal(beforeRenalXray(old,display),old);
const olderUltrasound=await exactSourceHistoryApi(renalUltrasoundTransition.parentCommit,'review-security');
const olderTopics=structuredClone(current.abdominalOrganImagingTopics);
olderTopics.kidney.xray=structuredClone(transition.focus.previous.topic);
olderTopics.kidney.ultrasound=structuredClone(renalUltrasoundTransition.focus.previous.topic);
const olderMetadata={groups:current.abdominalOrganImagingGroups,topics:olderTopics,
 references:renalUltrasoundTransition.focus.previous.references,
 landmarks:current.abdominalOrganImagingLandmarks,scope:current.abdominalOrganImagingScope};
assert.equal(hash(olderMetadata),renalUltrasoundTransition.previousMetadataHash);
const olderWithMetadata={...olderUltrasound,abdominalOrganImagingGroups:olderMetadata.groups,
 abdominalOrganImagingTopics:olderMetadata.topics,abdominalOrganImagingReferences:olderMetadata.references,
 abdominalOrganImagingLandmarks:olderMetadata.landmarks,abdominalOrganImagingScope:olderMetadata.scope};
assert.equal(beforeRenalXray(olderWithMetadata,raw),olderWithMetadata);
for(const entry of entries.values())assert.deepEqual(olderUltrasound.bodyLesson(entry.identity,'xray'),entry.previous);
for(const entry of entries.values()){
 assert.deepEqual(restoredFromDisplay.bodyLesson(entry.identity,'xray'),entry.previous);
 assert.deepEqual(restoredFromDisplay.bodyContent(entry.identity,'xray'),shown(entry.previous));
 assert.deepEqual(restoredFromDisplay.abdominalOrganImagingLesson(entry.identity,'xray'),entry.previous);
}
assert.deepEqual(restoredFromDisplay.abdominalOrganImagingTopics,restored.abdominalOrganImagingTopics);
assert.deepEqual(restoredFromDisplay.abdominalOrganImagingReferences,restored.abdominalOrganImagingReferences);
assert.equal(hash(current.abdominalOrganImagingTopics.kidney.xray),hash(transition.focus.current.topic));
assert.equal(hash(restored.abdominalOrganImagingTopics.kidney.xray),hash(transition.focus.previous.topic));
assert.deepEqual(restored.abdominalOrganImagingReferences,transition.focus.previous.references);
assert.deepEqual(current.abdominalOrganImagingReferences,transition.focus.current.references);
for(const s of display.structures)for(const tab of current.contentTabs){
 assert.deepEqual(restored.bodyLesson(s,tab),old.bodyLesson(s,tab));
 assert.deepEqual(restored.bodyContent(s,tab),old.bodyContent(s,tab));
}
let predecessorRefusals=0;const reject=(api,catalog=raw)=>{assert.throws(()=>beforeRenalXray(api,catalog));predecessorRefusals++;};
const first=transition.entries[0];
for(const field of ['body','bullets','citations','note','title'])reject({...current,bodyLesson(s,t){
 const lesson=current.bodyLesson(s,t);if(s.id!==first.identity.id||t!=='xray')return lesson;
 const bad=structuredClone(lesson);if(Array.isArray(bad[field]))bad[field][0]+=' foreign';else bad[field]+=' foreign';return bad;
}});
reject({...current,bodyLesson(s,t){return s.id===first.identity.id&&t==='xray'?first.previous:current.bodyLesson(s,t);}});
reject({...current,bodyContent:()=>({body:'foreign'})});
reject({...current,abdominalOrganImagingLesson:()=>undefined});
reject({...current,bodyContent:42});reject({...current,abdominalOrganImagingLesson:42});
reject({...current,abdominalOrganImagingTopics:undefined});
reject({...current,abdominalOrganImagingReferences:transition.focus.previous.references});
reject({...restored,abdominalOrganImagingTopics:current.abdominalOrganImagingTopics,abdominalOrganImagingReferences:current.abdominalOrganImagingReferences});
reject({...current,abdominalOrganImagingTopics:restored.abdominalOrganImagingTopics,abdominalOrganImagingReferences:restored.abdominalOrganImagingReferences});
const foreignTopics=structuredClone(current.abdominalOrganImagingTopics);foreignTopics.kidney.xray.body+=' foreign';reject({...current,abdominalOrganImagingTopics:foreignTopics});
const foreignGroups=structuredClone(current.abdominalOrganImagingGroups);foreignGroups.kidney.push('foreign');reject({...current,abdominalOrganImagingGroups:foreignGroups});
const badCatalog=structuredClone(raw);badCatalog.structures.find(s=>s.id===first.identity.id).anchor[0]+=.01;reject(current,badCatalog);
const duplicate=structuredClone(display);duplicate.structures.push(structuredClone(first.identity));reject(current,duplicate);
const pendingApi={bodyLesson(s,t){const entry=entries.get(s.id);return entry&&t==='xray'?pins.entries.find(pin=>pin.identity.id===s.id).previous.xray:undefined;},bodyContent(s,t){const lesson=this.bodyLesson(s,t);return lesson?shown(lesson):undefined;}};
assert.equal(beforeRenalXray(pendingApi),pendingApi);
const mixedEarly={bodyLesson(s,t){if(t!=='xray')return undefined;return s.id===first.identity.id?pins.entries.find(pin=>pin.identity.id===s.id).previous.xray:entries.get(s.id)?.previous;},bodyContent(s,t){const lesson=this.bodyLesson(s,t);return lesson?shown(lesson):undefined;}};
reject(mixedEarly,undefined);
const early={bodyLesson:()=>undefined};assert.equal(beforeRenalXray(early),early);
const earlyWithContent={bodyLesson:()=>undefined,bodyContent:()=>undefined};assert.equal(beforeRenalXray(earlyWithContent),earlyWithContent);
reject({...early,bodyContent:()=>({body:'foreign'})},undefined);
reject({...pendingApi,abdominalOrganImagingLesson:()=>({body:'foreign'})},undefined);
const oldNoMetadata={bodyLesson:old.bodyLesson,bodyContent:old.bodyContent};assert.equal(beforeRenalXray(oldNoMetadata),oldNoMetadata);
const currentNoMetadata={bodyLesson:current.bodyLesson,bodyContent:current.bodyContent};
const rewindNoMetadata=beforeRenalXray(currentNoMetadata);
assert.equal(Object.hasOwn(rewindNoMetadata,'abdominalOrganImagingLesson'),false);
for(const entry of entries.values())assert.deepEqual(rewindNoMetadata.bodyLesson(entry.identity,'xray'),entry.previous);
for(const bad of [{...first.identity,name:'foreign'},{...first.identity,foreign:true},(()=>{const x=structuredClone(first.identity);delete x.coverageNote;return x;})(),(()=>{const x=structuredClone(first.identity);x.sources.push(structuredClone(x.sources[0]));return x;})()]){
 for(const method of ['bodyLesson','bodyContent','abdominalOrganImagingLesson']){assert.throws(()=>restored[method](bad,'xray'));predecessorRefusals++;}
}
const detached=restored.bodyLesson(first.identity,'xray');detached.body='foreign';assert.deepEqual(restored.bodyLesson(first.identity,'xray'),first.previous);

const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const callback=bodyNoteRenderCallback(await readFile('app/body-explorer.tsx','utf8'));
const code=ts.transpile(`(${callback})('xray')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
let renders=0;
for(const {identity}of entries.values()){
 const lesson=current.bodyLesson(identity,'xray');
 const html=render(runInNewContext(code,{React,SourceDisplayNotes:scope.exports.SourceDisplayNotes,selected:identity,bodyContent:current.bodyContent,catalog:display,side:'both',exam:false,ScanLine:()=>null,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,openNested(){throw Error('Unexpected nested specimen');}}));
 assert(html.includes(render(React.createElement('p',null,lesson.body))));
 for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
 for(const [index,url] of lesson.citations.entries()){assert(html.includes(`href="${url}"`));assert(html.includes(`Reference ${index+1}`));}
 assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));renders++;
}
assert.equal(renders,2);
console.log(JSON.stringify({changedRenalXray:changed,otherTopicsExact:other,unrelatedReviewMaterialsAndContextsExactWithSharedRenderer:unrelatedPackets,currentPackets,genuineOldPacketsRefused:oldRefusals,forgedRefusals,staleRejectedBeforeStorage:staleRejected,sourceRefusals,predecessorRefusals,actualNoteRenders:renders,clinicalApproval:false}));
