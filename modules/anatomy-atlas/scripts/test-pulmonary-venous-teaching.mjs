// Source, history, Review, and real learner controls for twelve existing slots.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {beforePulmonaryVenousTeaching,hashPulmonaryVenousTeaching as hash} from './pulmonary-venous-teaching-history.mjs';
import pins from '../content/pulmonary-venous-teaching-pins.json' with {type:'json'};
import transition from '../content/pulmonary-venous-teaching.transition.json' with {type:'json'};
import centralPins from '../content/central-vessel-imaging-pins.json' with {type:'json'};

const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
const completedCommit='0b38b93e5626f34bf1a79a45734171371d52fb3d';
const {api:live,catalog:raw}=await contentContext();
// Every historical application import comes from the exact completed milestone.
// Live resolver and learner controls remain independently exercised below.
const current=await exactSourceHistoryApi(completedCommit,'pulmonary-venous-teaching');
const records=current.bodyContentRecords(raw);
const display=current.bodyDisplayCatalog(raw);
const completedRenderer=execFileSync('git',['--no-replace-objects','show',completedCommit+':content/body-renderer-revision.json'],{encoding:'utf8',windowsHide:true,maxBuffer:16e6});
const old=await exactSourceHistoryApi(transition.parentCommit,'review-security',{'content/body-renderer-revision.json':completedRenderer});
const genuineOld=await exactSourceHistoryApi(transition.parentCommit,'review-security');
assert.deepEqual(display,old.bodyDisplayCatalog(raw));assert.equal(hash(display),pins.catalogHash);
assert.deepEqual(current.structures,old.structures);assert.deepEqual(current.dissectionProfiles,old.dissectionProfiles);
assert.equal(hash(snapshot(old,display)),pins.previousSnapshotHash);
assert.equal(hash(snapshot(current,display)),transition.currentSnapshotHash);
assert.equal(hash(current.pulmonaryVenousTeachingConcepts),transition.conceptsHash);
assert.equal(hash(current.pulmonaryVenousTeachingReferences),transition.referencesHash);
assert.deepEqual(live.bodyDisplayCatalog(raw),display);
assert.equal(hash(live.pulmonaryVenousTeachingConcepts),transition.conceptsHash);
assert.equal(hash(live.pulmonaryVenousTeachingReferences),transition.referencesHash);
let liveSlots=0,liveSourceRefusals=0;
for(const entry of transition.entries){
  const lesson=live.bodyLesson(entry.identity,entry.tab);
  assert.equal(hash(lesson),entry.currentHash,'Current pulmonary teaching changed without a recorded revision');
  assert.deepEqual(live.pulmonaryVenousTeachingLesson(entry.identity,entry.tab),lesson);
  assert.deepEqual(live.bodyContent(entry.identity,entry.tab),shown(lesson));
  liveSlots++;
}
assert.equal(liveSlots,12);
const targetIds=new Set(pins.entries.map(e=>e.identity.id));assert.equal(targetIds.size,4);
const entries=new Map(transition.entries.map(e=>[e.identity.id+'|'+e.tab,e]));assert.equal(entries.size,12);
let changed=0,other=0,sourceRefusals=0;
for(const s of display.structures)for(const tab of current.contentTabs){
  const prior=old.bodyLesson(s,tab),now=current.bodyLesson(s,tab),entry=entries.get(s.id+'|'+tab);
  if(entry){
    assert.deepEqual(s,entry.identity);assert.deepEqual(prior,entry.previous);
    assert.equal(hash(now),entry.currentHash);assert.notDeepEqual(now,prior);
    assert.equal(now.readiness,'draft');assert.deepEqual(current.pulmonaryVenousTeachingLesson(s,tab),now);
    assert.deepEqual(current.bodyContent(s,tab),shown(now));
    assert.deepEqual(records.find(r=>r.id===s.id).content[tab],now);
    assert.equal(now.bullets.length,tab==='quiz'?4:2);assert.equal(new Set(now.bullets).size,now.bullets.length);
    if(tab==='quiz'){assert.equal(now.bullets.filter(x=>x===now.correctAnswer).length,1);assert(now.explanation.trim());}
    assert.deepEqual(now.citations,current.pulmonaryVenousTeachingConcepts[entry.group][tab].references.map(key=>current.pulmonaryVenousTeachingReferences[key]));
    assert(now.citations.length>=1);assert.match(now.note,/radiologist review pending/i);changed++;
  }else{
    assert.deepEqual(now,prior,s.id+'|'+tab);assert.deepEqual(current.bodyContent(s,tab),old.bodyContent(s,tab));
    assert.equal(current.pulmonaryVenousTeachingLesson(s,tab),undefined);other++;
  }
}
assert.equal(changed,12);assert.equal(other,9924);
const oldRecords=old.bodyContentRecords(raw);
for(const [index,record] of records.entries()){
  const previous=oldRecords[index];assert.equal(record.id,previous.id);
  if(!targetIds.has(record.id))assert.deepEqual(record,previous);
  else{
    for(const key of Object.keys(record))if(key!=='content')assert.deepEqual(record[key],previous[key]);
    for(const tab of current.contentTabs)if(!pins.tabs.includes(tab))assert.deepEqual(record.content[tab],previous.content[tab]);
  }
}
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
for(const {identity}of pins.entries){
  for(const path of leaves(identity)){
    const bad=structuredClone(identity);let node=bad;for(const key of path.slice(0,-1))node=node[key];
    const key=path.at(-1),prior=node[key];node[key]=typeof prior==='number'?prior+.01:typeof prior==='boolean'?!prior:String(prior)+'-foreign';
    for(const tab of pins.tabs){assert.equal(current.pulmonaryVenousTeachingLesson(bad,tab),undefined);sourceRefusals++;assert.equal(live.pulmonaryVenousTeachingLesson(bad,tab),undefined);liveSourceRefusals++;}
  }
  for(const bad of [{...identity,unexpected:true},(()=>{const s=structuredClone(identity);delete s.coverageNote;return s;})(),(()=>{const s=structuredClone(identity);s.sources.push(structuredClone(s.sources[0]));return s;})()]){
    for(const tab of pins.tabs){assert.equal(current.pulmonaryVenousTeachingLesson(bad,tab),undefined);sourceRefusals++;assert.equal(live.pulmonaryVenousTeachingLesson(bad,tab),undefined);liveSourceRefusals++;}
  }
  for(const bad of [{...identity,id:identity.id+'-foreign'},{...identity,fmaId:identity.fmaId+'-foreign'}]){
    for(const tab of pins.tabs){assert.equal(current.pulmonaryVenousTeachingLesson(bad,tab),undefined);sourceRefusals++;assert.equal(live.pulmonaryVenousTeachingLesson(bad,tab),undefined);liveSourceRefusals++;}
  }
  const pristine=current.pulmonaryVenousTeachingLesson(identity,'quiz');
  const altered=current.pulmonaryVenousTeachingLesson(identity,'quiz');altered.bullets[0]+=' foreign';altered.citations.push('https://foreign.example/');
  assert.deepEqual(current.pulmonaryVenousTeachingLesson(identity,'quiz'),pristine,'Quiz helper must return detached arrays');
  const livePristine=live.pulmonaryVenousTeachingLesson(identity,'quiz');
  const liveAltered=live.pulmonaryVenousTeachingLesson(identity,'quiz');liveAltered.bullets[0]+=' foreign';liveAltered.citations.push('https://foreign.example/');
  assert.deepEqual(live.pulmonaryVenousTeachingLesson(identity,'quiz'),livePristine,'Current quiz helper must return detached arrays');
}
const review=current;
let currentPackets=0,unrelatedPackets=0,oldRefusals=0,forgedRefusals=0;
for(const s of display.structures){
  const before=await old.bodyReviewMaterial(s.id),now=await review.bodyReviewMaterial(s.id);
  const beforeContext=await old.bodyReviewContext(s.id),nowContext=await review.bodyReviewContext(s.id);
  assert.equal(now.approval,false);assert.equal(await review.bodyReviewDisplayMatches(now,s.id),true);
  assert.deepEqual(await review.parseBodyReviewResponse(now,s.id),now);currentPackets++;
  if(!targetIds.has(s.id)){assert.deepEqual(now,before,'Unrelated Review material under shared current renderer '+s.id);assert.deepEqual(nowContext,beforeContext);unrelatedPackets++;continue;}
  assert.equal(beforeContext.sourceHash,nowContext.sourceHash);
  assert.equal(beforeContext.revisions.geometry,nowContext.revisions.geometry);
  assert.notEqual(beforeContext.revisions.teaching,nowContext.revisions.teaching);
  assert.equal(await review.parseBodyReviewResponse(await genuineOld.bodyReviewMaterial(s.id),s.id),null);oldRefusals++;
  for(const tab of pins.tabs)for(const alter of [q=>q.body+=' foreign',q=>q.bullets[0]+=' foreign',q=>q.citations[0]='https://foreign.example/',q=>q.note+=' foreign']){
    const forged=structuredClone(now);alter(forged.topics.find(topic=>topic.tab===tab));
    assert.equal(await review.parseBodyReviewResponse(forged,s.id),null);forgedRefusals++;
  }
}
assert.equal(currentPackets,1104);assert.equal(unrelatedPackets,1100);assert.equal(oldRefusals,4);assert.equal(forgedRefusals,48);
const restored=beforePulmonaryVenousTeaching(current,raw);
assert.equal(beforePulmonaryVenousTeaching(old,raw),old);
assert.equal(beforePulmonaryVenousTeaching(restored,raw),restored);
for(const s of display.structures)for(const tab of current.contentTabs){
  assert.deepEqual(restored.bodyLesson(s,tab),old.bodyLesson(s,tab));
  assert.deepEqual(restored.bodyContent(s,tab),old.bodyContent(s,tab));
}
assert.equal(Object.hasOwn(restored,'pulmonaryVenousTeachingLesson'),false);
let predecessorRefusals=0;const reject=(api,catalog=raw)=>{assert.throws(()=>beforePulmonaryVenousTeaching(api,catalog));predecessorRefusals++;};
const first=transition.entries[0],firstId=first.identity.id;
for(const field of ['title','body','bullets','citations','note'])reject({...current,bodyLesson(s,t){const lesson=current.bodyLesson(s,t);if(s.id!==firstId||t!=='ct')return lesson;const changed=structuredClone(lesson);if(Array.isArray(changed[field]))changed[field][0]+=' foreign';else changed[field]+=' foreign';return changed;}});
reject({...current,bodyLesson(s,t){return s.id===firstId&&t==='ct'?first.previous:current.bodyLesson(s,t);}});
reject({...current,bodyContent:()=>({body:'foreign'})});reject({...current,pulmonaryVenousTeachingLesson:()=>undefined});
for(const hook of ['pulmonaryVenousTeachingLesson','pulmonaryVenousTeachingConcepts','pulmonaryVenousTeachingReferences'])reject({...current,[hook]:undefined});
reject({...current,pulmonaryVenousTeachingLesson:undefined,pulmonaryVenousTeachingConcepts:undefined,pulmonaryVenousTeachingReferences:undefined});
reject({...current,bodyContent:undefined});
const concepts=structuredClone(current.pulmonaryVenousTeachingConcepts);concepts.rightSuperior.ct.body+=' foreign';reject({...current,pulmonaryVenousTeachingConcepts:concepts});
const references=structuredClone(current.pulmonaryVenousTeachingReferences);references.ct+='?foreign';reject({...current,pulmonaryVenousTeachingReferences:references});
for(const mutate of [c=>c.structures.find(s=>s.id===firstId).anchor[0]+=.01,c=>c.structures.push(structuredClone(first.identity)),c=>c.structures.push({...structuredClone(first.identity),id:firstId+'-foreign'})]){
  const catalog=structuredClone(display);mutate(catalog);reject(current,catalog);
}
const early={};assert.equal(beforePulmonaryVenousTeaching(early),early);
reject({...early,bodyContent:()=>undefined},undefined);
const earlyLesson={bodyLesson:()=>undefined};assert.equal(beforePulmonaryVenousTeaching(earlyLesson),earlyLesson);
const earlyWithContent={...earlyLesson,bodyContent:()=>undefined};assert.equal(beforePulmonaryVenousTeaching(earlyWithContent),earlyWithContent);
reject({...earlyLesson,bodyContent:()=>({body:'foreign'})},undefined);
reject({...earlyLesson,bodyDisplayCatalog:x=>x},undefined);
reject({bodyLesson(s,t){return s.id===firstId&&t==='ct'?undefined:current.bodyLesson(s,t);}} ,undefined);
const oldNoHooks={bodyLesson:old.bodyLesson,bodyContent:old.bodyContent};assert.equal(beforePulmonaryVenousTeaching(oldNoHooks),oldNoHooks);
const currentNoHooks={bodyLesson:current.bodyLesson,bodyContent:current.bodyContent};reject(currentNoHooks);
// Repeated older authoring chains may have already reached the exact original
// central-vessel pending imaging epoch. It is not an arbitrary pending lesson.
const originalPending={...restored,bodyLesson(s,t){
  const pin=centralPins.entries.find(e=>e.identity.id===s.id);
  return targetIds.has(s.id)&&['ct','mri'].includes(t)?structuredClone(pin.previous[t]):restored.bodyLesson(s,t);
}};
originalPending.bodyContent=(s,t)=>shown(originalPending.bodyLesson(s,t));
assert.equal(beforePulmonaryVenousTeaching(originalPending,raw),originalPending);
for(const alter of [
 lesson=>({...lesson,body:lesson.body+' foreign'}),
 ()=>structuredClone(first.previous),
])reject({...originalPending,bodyLesson(s,t){const lesson=originalPending.bodyLesson(s,t);return s.id===firstId&&t==='ct'?alter(lesson):lesson;}});
reject({...originalPending,bodyContent:()=>({body:'foreign'})});
reject({...originalPending,pulmonaryVenousTeachingLesson:current.pulmonaryVenousTeachingLesson});
reject({...originalPending,bodyLesson(s,t){return s.id===firstId&&t==='quiz'?current.bodyLesson(s,t):originalPending.bodyLesson(s,t);}});
for(const bad of [{...first.identity,name:'foreign'},{...first.identity,unexpected:true},(()=>{const s=structuredClone(first.identity);delete s.coverageNote;return s;})(),(()=>{const s=structuredClone(first.identity);s.sources.push(structuredClone(s.sources[0]));return s;})()]){
  for(const method of ['bodyLesson','bodyContent']){assert.throws(()=>restored[method](bad,'ct'));predecessorRefusals++;}
}
const detached=restored.bodyLesson(first.identity,'ct');detached.body='foreign';assert.deepEqual(restored.bodyLesson(first.identity,'ct'),first.previous);

// Exercise actual lazy learner components, answers, retry, focus and exam hiding.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';export {StructureQuickCheck} from './app/structure-quick-check';export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';export {teachingHeading} from './lib/teaching-heading';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const load=react=>{const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require:id=>id==='react'?react:id==='next/link'?()=>{throw Error('Unrelated navigation');}:require(id),console,structuredClone});return scope.exports;};
const actual=load(React),walk=(node,found=[])=>{if(React.isValidElement(node)){found.push(node);React.Children.forEach(node.props.children,child=>walk(child,found));}return found;};
const text=node=>typeof node==='string'?node:!node?'':Array.isArray(node)?node.map(text).join(''):text(node.props?.children);
let states=[],refs=[],cursor=0,refCursor=0,active=false,focusTarget;
const shim={...React,useContext:()=>({exam:false}),useId:()=>active?'pulmonary-vein-quiz':React.useId(),
  useState(initial){if(!active)return React.useState(initial);const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],value=>{states[i]=value;}];},
  useRef(initial){if(!active)return React.useRef(initial);const i=refCursor++;return refs[i]??(refs[i]={current:initial});}};
const events=load(shim);let quizRenders=0,interactions=0;
for(const {identity}of pins.entries){
  const lesson=live.bodyLesson(identity,'quiz'),props={question:lesson.body,choices:lesson.bullets,correctAnswer:lesson.correctAnswer,explanation:lesson.explanation};
  const attempt=events.StructureQuickCheck(props);assert.equal(attempt.key,JSON.stringify(props));
  states=[];refs=[];cursor=0;refCursor=0;active=true;let note=events.QuizNotes({structure:identity});active=false;
  assert.equal(walk(note).find(n=>typeof n.type==='function'&&n.type.name==='LazyBodyTeaching').props.enabled,false);
  note.props.onToggle({currentTarget:{open:true}});cursor=0;active=true;note=events.QuizNotes({structure:identity});active=false;
  const lazy=walk(note).find(n=>typeof n.type==='function'&&n.type.name==='LazyBodyTeaching');assert(lazy.props.enabled);
  const loaded=lazy.props.children({bodyContent:live.bodyContent}),check=walk(loaded).find(n=>typeof n.type==='function'&&n.type.name==='StructureQuickCheck');
  assert.equal(check.key,identity.id);assert.deepEqual(JSON.parse(JSON.stringify(check.props)),props);
  assert.deepEqual(walk(loaded).filter(n=>n.type==='a').map(n=>n.props.href),lesson.citations);
  const html=render(React.createElement(actual.StructureQuickCheck,props));assert.equal((html.match(/type="radio"/g)||[]).length,4);assert(html.includes('<fieldset'));
  const exam=render(React.createElement(actual.AtlasWorkspace,{exam:true},React.createElement(actual.QuizNotes,{structure:identity})));assert(!exam.includes('atlas-quiz-notes'));quizRenders++;
  states=[];refs=[];let tree;
  const redraw=()=>{cursor=0;refCursor=0;active=true;tree=attempt.type(attempt.props);active=false;for(const n of walk(tree))if(n.props.ref)n.props.ref.current={focus(options){assert.equal(options.preventScroll,true);focusTarget=n.type==='input'?'first-radio':'feedback';}};};
  const radios=()=>walk(tree).filter(n=>n.type==='input'),button=label=>walk(tree).find(n=>n.type==='button'&&text(n)===label);
  const answer=index=>{radios()[index].props.onChange();redraw();button('Check answer').props.onClick();redraw();};
  redraw();assert.equal(button('Check answer').props.disabled,true);const correct=props.choices.indexOf(props.correctAnswer);
  answer(correct);assert(text(tree).includes('Correct. Correct answer: '+props.correctAnswer));assert.equal(focusTarget,'feedback');
  button('Practise again').props.onClick();redraw();assert.equal(focusTarget,'first-radio');
  answer((correct+1)%4);assert(text(tree).includes('Incorrect. Correct answer: '+props.correctAnswer));
  button('Try again').props.onClick();redraw();assert.equal(focusTarget,'first-radio');assert(radios().every(n=>!n.props.checked));interactions++;
}
const callback=bodyNoteRenderCallback(await readFile('app/body-explorer.tsx','utf8'));
let noteRenders=0;
for(const tab of ['ct','mri']){
  const code=ts.transpile(`(${callback})('${tab}')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
  for(const {identity}of pins.entries){
    const lesson=live.bodyLesson(identity,tab);
    const html=render(runInNewContext(code,{React,teachingHeading:actual.teachingHeading,SourceDisplayNotes:actual.SourceDisplayNotes,selected:identity,bodyContent:live.bodyContent,catalog:display,side:'both',exam:false,ScanLine:()=>null,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,openNested(){throw Error('Unexpected nested specimen');}}));
    assert(html.includes(render(React.createElement('p',null,lesson.body))));
    for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
    for(const [index,url]of lesson.citations.entries()){assert(html.includes(`href="${url}"`));assert(html.includes(`Reference ${index+1}`));}
    assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));noteRenders++;
  }
}
assert.equal(quizRenders,4);assert.equal(interactions,4);assert.equal(noteRenders,8);
console.log(JSON.stringify({historicalCommit:completedCommit,changed,other,unrelatedPackets,currentPackets,genuineOldPacketsRefused:oldRefusals,forgedRefusals,sourceRefusals,predecessorRefusals,liveSlots,liveSourceRefusals,quizRenders,interactions,noteRenders,clinicalApproval:false}));
