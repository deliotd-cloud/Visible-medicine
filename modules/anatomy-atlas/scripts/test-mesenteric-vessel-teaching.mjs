// Exact 14-source mesenteric teaching transition; no approval or patient imaging.
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
import transition from '../content/mesenteric-vessel-teaching.transition.json' with {type:'json'};
import pins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import centralPins from '../content/central-vessel-imaging-pins.json' with {type:'json'};

const parentCommit='72087cc2ece8f2715e2c7a552e9aed3e856c8c9a';
const tabs=['anatomy','function','quiz'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,api.bodyLesson(s,tab)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
const {api:current,catalog:raw,body:currentRecords}=await contentContext();
const display=current.bodyDisplayCatalog(raw);
const old=await exactSourceHistoryApi(parentCommit,'review-security',{'content/body-renderer-revision.json':await readFile('content/body-renderer-revision.json','utf8')});
const genuineOld=await exactSourceHistoryApi(parentCommit,'review-security');
assert.equal(transition.parentCommit,parentCommit);
assert.equal(hash(pins),transition.originalBranchPinsHash);
assert.equal(hash(centralPins),transition.originalCentralPinsHash);
assert.deepEqual(display,old.bodyDisplayCatalog(raw));
assert.equal(hash(display),transition.catalogHash);
assert.deepEqual(current.structures,old.structures);
assert.deepEqual(current.dissectionProfiles,old.dissectionProfiles);
assert.equal(hash(snapshot(old,display)),transition.previousSnapshotHash);
assert.equal(hash(snapshot(current,display)),transition.currentSnapshotHash);

const branchPins=pins.entries.filter(entry=>entry.identity.bundle==='abdomen-vessels-mesenteric');
assert.equal(branchPins.length,13);
const venousPins=centralPins.entries.filter(entry=>entry.identity.fmaId==='FMA14332');
assert.equal(venousPins.length,1);
assert.equal(venousPins[0].identity.bundle,'abdomen-vessels-mesenteric');
assert.deepEqual(venousPins[0].identity.sources.map(source=>source.file),['FJ3647']);
const selected=[...branchPins,...venousPins];
assert.equal(selected.length,14);
assert.equal(new Set(selected.map(entry=>entry.identity.id)).size,14);
assert.equal(new Set(selected.map(entry=>entry.identity.fmaId)).size,14);
assert.deepEqual(selected.map(entry=>entry.identity.id).sort(),display.structures.filter(s=>s.bundle==='abdomen-vessels-mesenteric').map(s=>s.id).sort());
for(const entry of selected)assert.deepEqual(display.structures.filter(s=>s.id===entry.identity.id),[entry.identity]);
const selectedIds=new Set(selected.map(entry=>entry.identity.id));
const entries=new Map(transition.entries.map(entry=>[entry.identity.id+'|'+entry.tab,entry]));
assert.equal(transition.entries.length,42);
assert.equal(entries.size,42);
assert.deepEqual([...entries.keys()].sort(),selected.flatMap(entry=>tabs.map(tab=>entry.identity.id+'|'+tab)).sort());
for(const entry of transition.entries){
 assert.deepEqual(selected.find(pin=>pin.identity.id===entry.identity.id)?.identity,entry.identity);
 assert(tabs.includes(entry.tab));
}

const oldRecords=old.bodyContentRecords(raw);
assert.equal(currentRecords.length,oldRecords.length);
let changed=0,unrelated=0,sourceRefusals=0;
const questions=[];
for(const s of display.structures)for(const tab of current.contentTabs){
 const before=old.bodyLesson(s,tab),now=current.bodyLesson(s,tab),entry=entries.get(s.id+'|'+tab);
 const direct=current.mesentericVesselTeachingLesson(s,tab);
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
  if(tab==='quiz'){
   assert.equal(now.bullets.length,4);
   assert.equal(new Set(now.bullets.map(choice=>choice.trim())).size,4);
   assert(now.bullets.every(choice=>typeof choice==='string'&&choice.trim()));
   assert.equal(now.bullets.filter(choice=>choice===now.correctAnswer).length,1);
   assert(now.explanation?.trim());questions.push(now);
  }
  changed++;
 }else{
  assert.equal(direct,undefined,s.id+'|'+tab);
  assert.deepEqual(now,before,s.id+'|'+tab);
  assert.deepEqual(current.bodyContent(s,tab),old.bodyContent(s,tab));
  unrelated++;
 }
}
assert.equal(changed,42);assert.equal(unrelated,9894);
assert.equal(questions.length,14);
assert.equal(new Set(questions.map(question=>question.body)).size,14,'Each source has a distinct question');
for(const [index,record] of currentRecords.entries()){
 const previous=oldRecords[index];assert.equal(record.id,previous.id);
 if(!selectedIds.has(record.id)){assert.deepEqual(record,previous,'Unrelated content record '+record.id);continue;}
 for(const key of Object.keys(record))if(key!=='content')assert.deepEqual(record[key],previous[key],record.id+'|'+key);
 for(const tab of current.contentTabs)if(!tabs.includes(tab))assert.deepEqual(record.content[tab],previous.content[tab],record.id+'|'+tab);
}
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
for(const {identity} of selected){
 for(const path of leaves(identity)){
  const bad=structuredClone(identity);let node=bad;
  for(const key of path.slice(0,-1))node=node[key];
  const key=path.at(-1),value=node[key];
  node[key]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
  for(const tab of tabs){assert.equal(current.mesentericVesselTeachingLesson(bad,tab),undefined);sourceRefusals++;}
 }
 for(const bad of [{...identity,foreign:true},(()=>{const copy=structuredClone(identity);copy.sources.push(structuredClone(copy.sources[0]));return copy;})()])
  for(const tab of tabs){assert.equal(current.mesentericVesselTeachingLesson(bad,tab),undefined);sourceRefusals++;}
 for(const tab of current.contentTabs)if(!tabs.includes(tab))assert.equal(current.mesentericVesselTeachingLesson(identity,tab),undefined);
}

// The current renderer is deliberately shared with the exact parent replay:
// unrelated Review packets must remain byte-for-byte equivalent as objects.
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
  assert.deepEqual(context,previousContext,'Unrelated Review context '+s.id);
  unrelatedPackets++;continue;
 }
 for(const tab of tabs)assert.deepEqual(review.bodyReviewSnapshot(s.id).topics.find(topic=>topic.tab===tab),{tab,...current.bodyLesson(s,tab)});
 assert.equal(previousContext.sourceHash,context.sourceHash);
 assert.equal(previousContext.revisions.geometry,context.revisions.geometry);
 assert.notEqual(previousContext.revisions.teaching,context.revisions.teaching);
 assert.equal(await review.parseBodyReviewResponse(await genuineOld.bodyReviewMaterial(s.id),s.id),null);oldRefusals++;
 for(const delta of [{materialHash:previousContext.materialHash},{revisionHash:previousContext.revisions.teaching}]){
  const body={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:review.blankBodyReview(context,'teaching'),...delta};
  const response=await review.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',
   headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_MESENTERIC_TEST'},
   body:JSON.stringify(body)}),{prepare(){storageCalls++;throw Error('Stale review reached storage');}});
  assert.equal(response.status,409);staleRejected++;
 }
 for(const tab of tabs)for(const alter of [topic=>topic.body+=' foreign',topic=>topic.bullets[0]+=' foreign',topic=>topic.citations[0]='https://foreign.example/',topic=>topic.note+=' foreign']){
  const bad=structuredClone(now);alter(bad.topics.find(topic=>topic.tab===tab));
  assert.equal(await review.parseBodyReviewResponse(bad,s.id),null);forgedRefusals++;
 }
}
assert.equal(packets,1104);assert.equal(unrelatedPackets,1090);assert.equal(oldRefusals,14);
assert.equal(staleRejected,28);assert.equal(storageCalls,0);assert.equal(forgedRefusals,168);

// Exercise the shipped quick-check component's answer, feedback and reset path.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {StructureQuickCheck} from './app/structure-quick-check';export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const load=react=>{const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require:id=>id==='react'?react:require(id)});return scope.exports;};
const actual=load(React);let states=[],refs=[],cursor=0,refCursor=0,active=false;
const callback=bodyNoteRenderCallback(await readFile('app/body-explorer.tsx','utf8'));
let noteRenders=0;
for(const {identity}of selected)for(const tab of tabs){
 const lesson=current.bodyLesson(identity,tab);
 const code=ts.transpile(`(${callback})('${tab}')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
 const html=render(runInNewContext(code,{React,SourceDisplayNotes:actual.SourceDisplayNotes,selected:identity,
  bodyContent:current.bodyContent,WorkspaceModeButton:({children})=>React.createElement('button',null,children)}));
 assert(html.includes(render(React.createElement('p',null,lesson.body))));
 for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
 for(const [index,url]of lesson.citations.entries()){assert(html.includes(`href="${url}"`));assert(html.includes(`Reference ${index+1}`));}
 assert(html.includes('review pending'));noteRenders++;
}
assert.equal(noteRenders,42);
const shim={...React,useId:()=>active?'mesenteric-test':React.useId(),
 useState(initial){if(!active)return React.useState(initial);const index=cursor++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=value;}];},
 useRef(initial){if(!active)return React.useRef(initial);const index=refCursor++;return refs[index]??(refs[index]={current:initial});}};
const events=load(shim);
function walk(node,found=[]){if(React.isValidElement(node)){found.push(node);React.Children.forEach(node.props.children,child=>walk(child,found));}return found;}
const nodeText=node=>typeof node==='string'?node:!node?'':Array.isArray(node)?node.map(nodeText).join(''):nodeText(node.props?.children);
let checked=0;
for(const lesson of questions){
 const props={question:lesson.body,choices:lesson.bullets,correctAnswer:lesson.correctAnswer,explanation:lesson.explanation};
 const html=render(React.createElement(actual.StructureQuickCheck,props));
 assert.equal((html.match(/type="radio"/g)||[]).length,4);
 assert.match(html,/<button[^>]*disabled=""[^>]*>Check answer/);
 assert(!html.includes('answer key is missing'));assert(!html.includes('Correct answer:'));
 const attempt=events.StructureQuickCheck(props);assert.equal(attempt.key,JSON.stringify(props));
 assert.notEqual(events.StructureQuickCheck({...props,question:props.question+' revised'}).key,attempt.key);
 states=[];refs=[];let tree;
 const redraw=()=>{cursor=0;refCursor=0;active=true;tree=attempt.type(attempt.props);active=false;
  for(const node of walk(tree))if(node.props.ref)node.props.ref.current={focus(){}};};
 const radios=()=>walk(tree).filter(node=>node.type==='input');
 const button=label=>walk(tree).find(node=>node.type==='button'&&nodeText(node)===label);
 const answer=index=>{radios()[index].props.onChange();redraw();button('Check answer').props.onClick();redraw();};
 redraw();const correct=props.choices.indexOf(props.correctAnswer);
 answer(correct);assert(nodeText(tree).includes('Correct. Correct answer: '+props.correctAnswer));assert(nodeText(tree).includes(props.explanation));
 button('Practise again').props.onClick();redraw();assert(radios().every(node=>!node.props.checked));
 answer((correct+1)%4);assert(nodeText(tree).includes('Incorrect. Correct answer: '+props.correctAnswer));assert(nodeText(tree).includes(props.explanation));
 button('Try again').props.onClick();redraw();assert(radios().every(node=>!node.props.checked));checked++;
}
assert.equal(checked,14);
console.log(JSON.stringify({changedMesentericTopics:changed,otherTopicsExact:unrelated,sourceRefusals,reviewPackets:packets,unrelatedReviewPacketsExact:unrelatedPackets,genuineOldPacketsRefused:oldRefusals,staleRejectedBeforeStorage:staleRejected,forgedRefusals,quickChecksExercised:checked,noteRenders,clinicalApproval:false}));
