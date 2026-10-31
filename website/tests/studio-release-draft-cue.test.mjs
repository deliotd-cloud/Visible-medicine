import { loadOutlineHelper } from './studio-outline-helper-loader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript');
const editorSource=readFileSync(new URL('../components/StudioCourseEditor.tsx',import.meta.url),'utf8');
const outlineHelper = loadOutlineHelper(ts, new URL('../components/StudioCourseEditor.tsx', import.meta.url));
const formsSource=readFileSync(new URL('../components/StudioForms.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(editorSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const all=node=>Array.isArray(node)?node.flatMap(all):node?.props?[node,...all(node.props.children)]:[];
const words=node=>Array.isArray(node)?node.map(words).join(''):node?.props?words(node.props.children):node==null?'':String(node);

function fixture(pane='content',initialRelease='release-one'){
  let scope={actorId:'edu:synthetic-author',organizationId:'org:synthetic'};
  let course={id:'course-one',title:'Synthetic course'},releases=initialRelease?[{id:initialRelease,courseId:'course-one',status:'draft',workbookIds:[]}]:[];
  const workbooks=[{id:'workbook-one',courseId:'course-one',title:'Synthetic item',mode:'teaching',caseCount:1,status:'draft'}];
  let location=new URL(`https://visiblemedicine.test/studio/courses/course-one?pane=${pane}&keep=1#outline`),historyState={host:'retained'},pushes=0;
  const settings={open:false,querySelector:selector=>selector==='summary'?{focus:()=>{settings.focuses++;}}:null,focuses:0};
  const document={activeElement:null,getElementById:id=>id==='course-release-settings'?settings:null,querySelector:()=>null};
  const window={get location(){return location;},history:{get state(){return historyState;},pushState(state,_title,href){pushes++;historyState=state;location=new URL(href,location);}},addEventListener(){},removeEventListener(){}};
  let slots=[],cursor=0,pending=[],layoutPending=[],tree,dirty=false,stateWrites=0;
  const effects=new Map(),layoutEffects=new Map();
  const changed=(left,right)=>!left||right.some((value,k)=>!Object.is(value,left[k]));
  const hooks={
    useRef(initial){const i=cursor++;return slots[i]??={current:initial};},
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;stateWrites++;}}];},
    useMemo(fn,deps){const i=cursor++,old=slots[i];if(!old||changed(old.deps,deps))slots[i]={deps,value:fn()};return slots[i].value;},
    useLayoutEffect(fn,deps){const i=cursor++,old=layoutEffects.get(i);if(!old||changed(old.deps,deps))layoutPending.push(()=>{old?.cleanup?.();layoutEffects.set(i,{deps,cleanup:fn()});});},
    useEffect(fn,deps){const i=cursor++,old=effects.get(i);if(!old||changed(old.deps,deps))pending.push(()=>{old?.cleanup?.();effects.set(i,{deps,cleanup:fn()});});}
  };
  const forms={CreateWorkbookForm:'create',DuplicateCourseButton:'duplicate',EditCourseDetailsForm:'edit',ReleaseDraftForm:'release'};
  const mocks={'../lib/studio-outline-navigation.ts': outlineHelper,react:hooks,'react/jsx-runtime':{jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})},'next/link':'a','next/navigation':{useSearchParams:()=>new URLSearchParams(location.search)},'./StudioForms':forms};
  const module={exports:{}};
  new Function('require','module','exports','window','document',code)(name=>{assert(name in mocks,name);return mocks[name];},module,module.exports,window,document);
  function render(){let count=0;do{dirty=false;cursor=0;pending=[];layoutPending=[];tree=module.exports.StudioCourseEditor({course,workbooks,releases,recoveryScope:scope});for(const fn of layoutPending)fn();for(const fn of pending)fn();assert(++count<12);}while(dirty);return tree;}
  function speculative(nextCourse,nextReleases){
    const prior={course,releases,location,slots,tree,dirty,cursor,pending,layoutPending};
    slots=[...slots];course=nextCourse;releases=nextReleases;location=new URL(`https://visiblemedicine.test/studio/courses/${nextCourse.id}?pane=content`);
    cursor=0;pending=[];layoutPending=[];const candidate=module.exports.StudioCourseEditor({course,workbooks,releases,recoveryScope:scope});
    ({course,releases,location,slots,tree,dirty,cursor,pending,layoutPending}=prior);
    return candidate;
  }
  const find=predicate=>{const node=all(tree).find(predicate);assert(node,'expected node');return node;};
  const cue=()=>all(tree).find(node=>node.props.id==='course-release-draft-status');
  const report=state=>{find(node=>node.type==='release').props.onDraftRecoveryChange(state);render();};
  render();
  return {render,speculative,find,cue,report,settings,forms,get scope(){return scope;},get tree(){return tree;},get stateWrites(){return stateWrites;},get pushes(){return pushes;},get url(){return location.href;},get historyState(){return historyState;},navigate(url){location=new URL(url,location);},switchRelease(){releases=[{id:'release-two',courseId:course.id,status:'draft',workbookIds:[]}];render();},switchCourse(){course={id:'course-two',title:'Other synthetic course'};releases=[{id:'release-two',courseId:'course-two',status:'draft',workbookIds:[]}];location=new URL('https://visiblemedicine.test/studio/courses/course-two?pane=content');render();},switchBack(){course={id:'course-one',title:'Synthetic course'};releases=[{id:'release-one',courseId:'course-one',status:'draft',workbookIds:[]}];location=new URL('https://visiblemedicine.test/studio/courses/course-one?pane=content');render();},switchActor(){scope={actorId:'edu:another-author',organizationId:'org:synthetic'};render();},createdRelease(){releases=[{id:'release-created',courseId:course.id,status:'draft',workbookIds:[]}];render();},cleanup(){for(const effect of layoutEffects.values())effect.cleanup?.();for(const effect of effects.values())effect.cleanup?.();}};
}

test('release form forwards the ActionForm recovery callback',()=>{
  assert.match(formsSource,/export function ReleaseDraftForm\([^\n]+onDraftRecoveryChange/);
  assert.match(formsSource,/draftRevision=\{JSON\.stringify\(\[selectedIds,rebaseRevision\]\)\} onDraftRecoveryChange=\{onDraftRecoveryChange\}/);
});

for(const pane of ['content','preview','review'])test(`recovered release cue is visible from ${pane} and opens the form with focus`,()=>{
  const h=fixture(pane);try{
    assert.equal(h.cue(),undefined);
    const release=h.find(node=>node.type==='release');assert.equal(typeof release.props.onDraftRecoveryChange,'function');assert.equal(release.props.recoveryScope,h.scope);
    h.report('recovered');const cue=h.cue();assert(cue);assert.equal(cue.props.role,'status');assert.match(words(cue),/Recovered unsent release edits/);
    assert(!all(h.find(node=>node.props.id==='course-review')).includes(cue));
    const button=all(cue).find(node=>node.type==='button');assert.equal(button.props['aria-controls'],'course-release-settings');
    button.props.onClick();h.render();assert.equal(h.find(node=>node.props.id==='course-review').props.hidden,false);
    assert.equal(h.settings.open,true);assert.equal(h.settings.focuses,1);
    assert.equal(h.url,'https://visiblemedicine.test/studio/courses/course-one?pane=review&keep=1#outline');
    assert.equal(h.pushes,pane==='review'?0:1);assert.equal(h.historyState.host,'retained');
    h.render();assert.equal(h.settings.focuses,1,'focus intent is consumed once');
    h.report('none');assert.equal(h.cue(),undefined);
  }finally{h.cleanup();}
});

test('attention cue does not claim recovery and old release callbacks cannot affect a new course',()=>{
  const h=fixture();try{
    const stale=h.find(node=>node.type==='release').props.onDraftRecoveryChange;
    h.report('attention');assert.match(words(h.cue()),/needs attention/);assert.doesNotMatch(words(h.cue()),/Recovered unsent/);
    h.switchCourse();assert.equal(h.cue(),undefined);h.report('attention');stale('recovered');h.render();
    assert.match(words(h.cue()),/needs attention/);assert.doesNotMatch(words(h.cue()),/Recovered unsent/);
  }finally{h.cleanup();}
});

test('a different editable release retires the cue without remounting open draft fields',()=>{
  const h=fixture();try{
    const old=h.find(node=>node.type==='release'),stale=old.props.onDraftRecoveryChange;
    h.report('recovered');assert(h.cue());h.switchRelease();
    assert.equal(h.cue(),undefined);assert.equal(h.find(node=>node.type==='release').key,old.key);
    stale('recovered');h.render();assert.equal(h.cue(),undefined);
  }finally{h.cleanup();}
});

test('a speculative replacement cannot report before commit or retire the visible callback when abandoned',()=>{
  const h=fixture();try{
    const visible=h.find(node=>node.type==='release').props.onDraftRecoveryChange;
    const candidate=h.speculative({id:'course-one',title:'Synthetic course'},[{id:'release-two',courseId:'course-one',status:'draft',workbookIds:[]}]);
    const precommit=all(candidate).find(node=>node.type==='release').props.onDraftRecoveryChange;
    const writes=h.stateWrites;precommit('recovered');assert.equal(h.stateWrites,writes);
    h.render();assert.equal(h.cue(),undefined);
    visible('recovered');h.render();assert.match(words(h.cue()),/Recovered unsent release edits/);
  }finally{h.cleanup();}
});

test('old callbacks remain retired after unmount and an A-B-A course visit',()=>{
  const h=fixture();
  const first=h.find(node=>node.type==='release').props.onDraftRecoveryChange;
  h.switchCourse();h.switchBack();first('recovered');h.render();assert.equal(h.cue(),undefined);
  const current=h.find(node=>node.type==='release').props.onDraftRecoveryChange;
  current('recovered');h.render();assert(h.cue());
  h.report('none');h.cleanup();const writes=h.stateWrites;current('recovered');assert.equal(h.stateWrites,writes);
});

test('old cue action and recovery callback cannot act after actor replacement',()=>{
  const h=fixture();try{
    const oldCallback=h.find(node=>node.type==='release').props.onDraftRecoveryChange;
    h.report('recovered');const oldButton=all(h.cue()).find(node=>node.type==='button');
    h.switchActor();assert.equal(h.cue(),undefined);
    const pushes=h.pushes;oldButton.props.onClick();oldCallback('recovered');h.render();
    assert.equal(h.pushes,pushes);assert.equal(h.settings.focuses,0);assert.equal(h.cue(),undefined);
  }finally{h.cleanup();}
});

test('old cue action and recovery callback cannot act after the URL moves to a replacement route',()=>{
  const h=fixture();try{
    const oldCallback=h.find(node=>node.type==='release').props.onDraftRecoveryChange;
    h.report('recovered');const oldButton=all(h.cue()).find(node=>node.type==='button');
    h.navigate('/studio/courses/course-two?pane=content');const writes=h.stateWrites,pushes=h.pushes;
    oldButton.props.onClick();oldCallback('attention');
    assert.equal(h.pushes,pushes);assert.equal(h.stateWrites,writes);assert.equal(h.settings.focuses,0);
  }finally{h.cleanup();}
});

test('normal save clears the create cue without remounting before draft cleanup',()=>{
  const h=fixture('content',null);try{
    const first=h.find(node=>node.type==='release'),oldCallback=first.props.onDraftRecoveryChange;
    h.report('recovered');assert(h.cue());h.report('none');assert.equal(h.cue(),undefined);
    h.createdRelease();assert.equal(h.cue(),undefined);assert.equal(h.find(node=>node.type==='release').key,first.key);
    oldCallback('recovered');h.render();assert.equal(h.cue(),undefined);
  }finally{h.cleanup();}
});
