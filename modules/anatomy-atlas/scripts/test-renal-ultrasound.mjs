// Two source-bound renal Ultrasound drafts against the exact preceding Git epoch.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {beforeRenalUltrasound} from './renal-ultrasound-history.mjs';
import {beforeLumbarDiscMri} from './lumbar-disc-mri-history.mjs';
import transition from '../content/renal-ultrasound.transition.json' with {type:'json'};

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
const {api:current, catalog:raw, body:currentRecords}=await contentContext();
const display=current.bodyDisplayCatalog(raw);
const old=await exactSourceHistoryApi(transition.parentCommit,'review-security',{'content/body-renderer-revision.json':await readFile('content/body-renderer-revision.json','utf8')});
const genuineOld=await exactSourceHistoryApi(transition.parentCommit,'review-security');
assert.equal(transition.parentCommit,'d517b77d2df2feb465b4d557e4446ef2451cbaa2');
assert.deepEqual(display,old.bodyDisplayCatalog(raw));
assert.equal(hash(display),transition.catalogHash);
assert.deepEqual(current.structures,old.structures);
assert.deepEqual(current.dissectionProfiles,old.dissectionProfiles);
assert.equal(hash(snapshot(old,display)),transition.previousSnapshotHash);
assert.equal(hash(snapshot(current,display)),transition.currentSnapshotHash);
assert.equal(transition.entries.length,2);
const entries=new Map(transition.entries.map(e=>[e.identity.id,e]));
assert.equal(entries.size,2);
assert.deepEqual([...entries.values()].map(e=>e.identity.fmaId).sort(),['FMA7204','FMA7205']);
assert([...entries.values()].every(e=>e.tab==='ultrasound'));
for(const e of entries.values())assert.deepEqual(display.structures.filter(s=>s.id===e.identity.id),[e.identity]);

// The original source pins, identities and display metadata must not be repinned.
const pins=JSON.parse(await readFile('content/abdominal-organ-imaging-pins.json','utf8'));
assert.equal(hash(pins),transition.originalPinsHash);
assert.deepEqual(pins.entries.filter(e=>e.group==='kidney').map(e=>e.identity),[...entries.values()].map(e=>e.identity));
const oldRecords=old.bodyContentRecords(raw);
assert.equal(currentRecords.length,oldRecords.length);
let changed=0,other=0,sourceRefusals=0;
for(const s of display.structures)for(const tab of current.contentTabs){
 const before=old.bodyLesson(s,tab),now=current.bodyLesson(s,tab),direct=current.abdominalOrganImagingLesson(s,tab),target=entries.get(s.id);
 if(target&&tab==='ultrasound'){
  assert.deepEqual(before,target.previous);assert.equal(hash(before),target.previousHash);
  assert.equal(hash(now),target.currentHash);assert.notDeepEqual(now,before);
  assert.equal(now.readiness,'draft');assert.deepEqual(direct,now);
  assert.equal(now.bullets.length,6);assert.equal(new Set(now.bullets).size,6);
  assert.deepEqual(current.bodyContent(s,tab),shown(now));
  assert.deepEqual(currentRecords.find(r=>r.id===s.id).content.ultrasound,now);
  assert(now.citations.includes('https://onlinelibrary.wiley.com/doi/10.1002/jum.70430'));
  assert(now.citations.includes('https://onlinelibrary.wiley.com/doi/10.1002/jum.16353'));
  assert.match(now.note,/review pending/i);changed++;
 }else{
  assert.deepEqual(now,before,s.id+' '+tab);
  assert.deepEqual(current.bodyContent(s,tab),old.bodyContent(s,tab));
  if(target)assert(['ct','mri','xray'].includes(tab)?direct!==undefined:direct===undefined,
    'Only the four imaging modalities have an abdominal-organ helper');
  if(target&&['ct','mri','xray'].includes(tab))assert.deepEqual(direct,now);
  other++;
 }
}
assert.equal(changed,2);assert.equal(other,9934);
for(const [i,record] of currentRecords.entries()){
 const previous=oldRecords[i];assert.equal(record.id,previous.id);
 if(entries.has(record.id)){
  for(const key of Object.keys(record))if(key!=='content')assert.deepEqual(record[key],previous[key],record.id+' '+key);
  for(const tab of current.contentTabs)if(tab!=='ultrasound')assert.deepEqual(record.content[tab],previous.content[tab]);
 }else assert.deepEqual(record,previous,'Unrelated content metadata '+record.id);
}

// The exact source identity is the complete immutable selected object.
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
for(const {identity}of entries.values())for(const path of leaves(identity)){
 const bad=structuredClone(identity);let node=bad;for(const key of path.slice(0,-1))node=node[key];
 const key=path.at(-1),value=node[key];node[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
 assert.equal(current.abdominalOrganImagingLesson(bad,'ultrasound'),undefined);sourceRefusals++;
}

// Review uses an explicit shared current renderer for unrelated comparisons.
const review=await import('data:text/javascript;base64,'+Buffer.from((await (await import('./workspace-test-build.mjs')).build({stdin:{contents:"export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export {bodyReviewDisplayMatches} from './lib/body-review-display-integrity';export {bodyLesson,bodyContent} from './app/body-content';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'})).outputFiles[0].text).toString('base64'));
let currentPackets=0,unrelatedPackets=0,oldRefusals=0,forgedRefusals=0;
for(const s of display.structures){
 const a=await old.bodyReviewMaterial(s.id),b=await review.bodyReviewMaterial(s.id);
 const ac=await old.bodyReviewContext(s.id),bc=await review.bodyReviewContext(s.id);
 assert.equal(b.approval,false);assert.equal(await review.bodyReviewDisplayMatches(b,s.id),true);
 assert.deepEqual(await review.parseBodyReviewResponse(b,s.id),b);currentPackets++;
 if(!entries.has(s.id)){assert.deepEqual(b,a,'Unrelated Review material with shared current renderer '+s.id);assert.deepEqual(bc,ac);unrelatedPackets++;continue;}
 const lesson=current.bodyLesson(s,'ultrasound');assert.deepEqual(review.bodyReviewSnapshot(s.id).topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...lesson});
 assert.equal(ac.sourceHash,bc.sourceHash);assert.equal(ac.revisions.geometry,bc.revisions.geometry);assert.notEqual(ac.revisions.teaching,bc.revisions.teaching);
 assert.equal(await review.parseBodyReviewResponse(await genuineOld.bodyReviewMaterial(s.id),s.id),null);oldRefusals++;
 for(const alter of [q=>q.body+=' foreign',q=>q.bullets[0]+=' foreign',q=>q.citations[0]='https://foreign.example/',q=>q.note+=' foreign']){
  const bad=structuredClone(b);alter(bad.topics.find(t=>t.tab==='ultrasound'));
  assert.equal(await review.parseBodyReviewResponse(bad,s.id),null);forgedRefusals++;
 }
}
assert.equal(currentPackets,1104);assert.equal(unrelatedPackets,1102);assert.equal(oldRefusals,2);assert.equal(forgedRefusals,8);

// The offline adapter admits only complete legitimate historical epochs.
const restored=beforeRenalUltrasound(current,raw);assert.equal(beforeRenalUltrasound(old,raw),old);
assert.equal(beforeRenalUltrasound(restored,raw),restored);
const restoredFromDisplay=beforeRenalUltrasound(current,display);
assert.equal(beforeRenalUltrasound(old,display),old);
for(const e of entries.values()){
 assert.deepEqual(restoredFromDisplay.bodyLesson(e.identity,'ultrasound'),e.previous);
 assert.deepEqual(restoredFromDisplay.bodyContent(e.identity,'ultrasound'),shown(e.previous));
 assert.deepEqual(restoredFromDisplay.abdominalOrganImagingLesson(e.identity,'ultrasound'),e.previous);
}
assert.deepEqual(restoredFromDisplay.abdominalOrganImagingTopics,restored.abdominalOrganImagingTopics);
assert.deepEqual(restoredFromDisplay.abdominalOrganImagingReferences,restored.abdominalOrganImagingReferences);
assert.equal(hash(current.abdominalOrganImagingTopics.kidney.ultrasound),hash(transition.focus.current.topic));
assert.equal(hash(restored.abdominalOrganImagingTopics.kidney.ultrasound),hash(transition.focus.previous.topic));
assert.deepEqual(restored.abdominalOrganImagingReferences,transition.focus.previous.references);
assert.deepEqual(current.abdominalOrganImagingReferences,transition.focus.current.references);
assert.deepEqual(current.abdominalOrganImagingGroups.kidney,transition.focus.current.groups);
assert.deepEqual(current.abdominalOrganImagingLandmarks.kidney,transition.focus.current.landmark);
assert.deepEqual(current.abdominalOrganImagingScope.kidney,transition.focus.current.scope);
for(const s of display.structures)for(const tab of current.contentTabs){assert.deepEqual(restored.bodyLesson(s,tab),old.bodyLesson(s,tab));assert.deepEqual(restored.bodyContent(s,tab),old.bodyContent(s,tab));}
let predecessorRefusals=0;const reject=(api,catalog=raw)=>{assert.throws(()=>beforeRenalUltrasound(api,catalog));predecessorRefusals++;};
const first=transition.entries[0];
// Spine history can receive an already re-projected unrelated display catalog.
// Its renal boundary still refuses a changed/duplicated kidney identity.
const repeatedDisplay=current.bodyDisplayCatalog(display);
const spineReplay=beforeLumbarDiscMri(current,repeatedDisplay);
for(const e of entries.values())assert.deepEqual(spineReplay.bodyLesson(e.identity,'ultrasound'),e.previous);
for(const mutate of [catalog=>catalog.structures.find(s=>s.id===first.identity.id).anchor[0]+=.01,
 catalog=>catalog.structures.push(structuredClone(first.identity)),
 catalog=>catalog.structures.push({...structuredClone(first.identity),id:first.identity.id+'-foreign'})]){
 const foreign=structuredClone(repeatedDisplay);mutate(foreign);
 assert.throws(()=>beforeLumbarDiscMri(current,foreign));predecessorRefusals++;
}
for(const field of ['body','bullets','citations','note','title'])reject({...current,bodyLesson(s,t){const lesson=current.bodyLesson(s,t);if(s.id!==first.identity.id||t!=='ultrasound')return lesson;const bad=structuredClone(lesson);if(Array.isArray(bad[field]))bad[field][0]+=' foreign';else bad[field]+=' foreign';return bad;}});
reject({...current,bodyLesson(s,t){return s.id===first.identity.id&&t==='ultrasound'?first.previous:current.bodyLesson(s,t);}});
reject({...current,bodyContent:()=>({body:'foreign'})});
reject({...current,abdominalOrganImagingLesson:()=>undefined});
reject({...current,bodyContent:42});
reject({...current,abdominalOrganImagingLesson:42});
reject({...current,abdominalOrganImagingTopics:undefined});
reject({...current,abdominalOrganImagingReferences:transition.focus.previous.references});
reject({...restored,abdominalOrganImagingTopics:current.abdominalOrganImagingTopics,abdominalOrganImagingReferences:current.abdominalOrganImagingReferences});
reject({...current,abdominalOrganImagingTopics:restored.abdominalOrganImagingTopics,abdominalOrganImagingReferences:restored.abdominalOrganImagingReferences});
const foreignTopics=structuredClone(current.abdominalOrganImagingTopics);foreignTopics.kidney.ultrasound.body+=' foreign';
reject({...current,abdominalOrganImagingTopics:foreignTopics});
const foreignGroups=structuredClone(current.abdominalOrganImagingGroups);foreignGroups.kidney.push('foreign');
reject({...current,abdominalOrganImagingGroups:foreignGroups});
const badCatalog=structuredClone(raw);badCatalog.structures.find(s=>s.id===first.identity.id).anchor[0]+=.01;reject(current,badCatalog);
const duplicatedDisplay=structuredClone(display);duplicatedDisplay.structures.push(structuredClone(first.identity));reject(current,duplicatedDisplay);
const pendingApi={bodyLesson(s,t){const entry=entries.get(s.id);return entry&&t==='ultrasound'?pins.entries.find(p=>p.identity.id===s.id).previous.ultrasound:undefined;},bodyContent(s,t){const lesson=this.bodyLesson(s,t);return lesson?shown(lesson):undefined;}};
assert.equal(beforeRenalUltrasound(pendingApi),pendingApi);
const early={bodyLesson:()=>undefined};assert.equal(beforeRenalUltrasound(early),early);
const earlyWithContent={bodyLesson:()=>undefined,bodyContent:()=>undefined};assert.equal(beforeRenalUltrasound(earlyWithContent),earlyWithContent);
reject({...early,bodyContent:()=>({body:'foreign'})},null);
const mixedEarly={bodyLesson(s,t){if(t!=='ultrasound')return undefined;return s.id===first.identity.id?pins.entries.find(p=>p.identity.id===s.id).previous.ultrasound:entries.get(s.id)?.previous;},bodyContent(s,t){const lesson=this.bodyLesson(s,t);return lesson?shown(lesson):undefined;}};
reject(mixedEarly,null);
reject({...pendingApi,abdominalOrganImagingLesson:()=>({body:'foreign'})},null);
const oldNoMetadata={bodyLesson:old.bodyLesson,bodyContent:old.bodyContent};assert.equal(beforeRenalUltrasound(oldNoMetadata),oldNoMetadata);
const currentNoMetadata={bodyLesson:current.bodyLesson,bodyContent:current.bodyContent};const rewindNoMetadata=beforeRenalUltrasound(currentNoMetadata);
assert.equal(Object.hasOwn(rewindNoMetadata,'abdominalOrganImagingLesson'),false);
assert.equal(Object.hasOwn(rewindNoMetadata,'abdominalOrganImagingTopics'),false);
assert.equal(Object.hasOwn(rewindNoMetadata,'abdominalOrganImagingReferences'),false);
for(const e of entries.values())assert.deepEqual(rewindNoMetadata.bodyLesson(e.identity,'ultrasound'),e.previous);
assert.throws(()=>restored.bodyLesson({...first.identity,name:'foreign'},'ultrasound'));predecessorRefusals++;
assert.throws(()=>restored.bodyContent({...first.identity,name:'foreign'},'ultrasound'));predecessorRefusals++;
assert.throws(()=>restored.abdominalOrganImagingLesson({...first.identity,name:'foreign'},'ultrasound'));predecessorRefusals++;
const unknownField={...first.identity,foreign:true};
for(const method of ['bodyLesson','bodyContent','abdominalOrganImagingLesson']){assert.throws(()=>restored[method](unknownField,'ultrasound'));predecessorRefusals++;}
const missingField=structuredClone(first.identity);delete missingField.coverageNote;
for(const method of ['bodyLesson','bodyContent','abdominalOrganImagingLesson']){assert.throws(()=>restored[method](missingField,'ultrasound'));predecessorRefusals++;}
const duplicatedSource=structuredClone(first.identity);duplicatedSource.sources.push(structuredClone(duplicatedSource.sources[0]));
for(const method of ['bodyLesson','bodyContent','abdominalOrganImagingLesson']){assert.throws(()=>restored[method](duplicatedSource,'ultrasound'));predecessorRefusals++;}
const detached=restored.bodyLesson(first.identity,'ultrasound');detached.body='foreign';assert.deepEqual(restored.bodyLesson(first.identity,'ultrasound'),first.previous);

// Render the actual learner note callback and its links for each side.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const callback=bodyNoteRenderCallback(await readFile('app/body-explorer.tsx','utf8'));
const code=ts.transpile(`(${callback})('ultrasound')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
let renders=0;
for(const {identity}of entries.values()){
 const lesson=current.bodyLesson(identity,'ultrasound');
 const html=render(runInNewContext(code,{React,SourceDisplayNotes:scope.exports.SourceDisplayNotes,selected:identity,bodyContent:current.bodyContent,catalog:display,side:'both',exam:false,ScanLine:()=>null,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,openNested(){throw Error('Unexpected nested specimen');}}));
 assert(html.includes(render(React.createElement('p',null,lesson.body))));
 for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
 for(const [index,url] of lesson.citations.entries()){assert(html.includes(`href="${url}"`));assert(html.includes(`Reference ${index+1}`));}
 assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));renders++;
}
assert.equal(renders,2);
console.log(JSON.stringify({changedRenalUltrasound:changed,otherTopicsExact:other,unrelatedReviewMaterialsAndContextsExactWithSharedRenderer:unrelatedPackets,currentPackets,genuineOldPacketsRefused:oldRefusals,forgedRefusals,sourceRefusals,predecessorRefusals,actualNoteRenders:renders,clinicalApproval:false}));
