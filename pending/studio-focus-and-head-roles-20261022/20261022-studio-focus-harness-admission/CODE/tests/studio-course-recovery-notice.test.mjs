import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const source=readFileSync(new URL('../components/StudioCourseEditor.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const all=n=>Array.isArray(n)?n.flatMap(all):n?.props?[n,...all(n.props.children)]:[];
const words=n=>Array.isArray(n)?n.map(words).join(''):n?.props?words(n.props.children):n==null?'':String(n);
function fixture(){
 const recoveryScope={actorId:'edu:synthetic-author',organizationId:'org:synthetic'};
 const slots=[],effects=new Map();let cursor=0,pending=[],tree,dirty=false,course={id:'course-one',title:'Saved title'},pushes=0;
 let location=new URL('https://visiblemedicine.test/studio/courses/course-one?pane=review&keep=1#preview');
 let historyState={host:'retained',__vinext_historyIndex:7};
 const listeners=new Set(),window={get location(){return location;},history:{get state(){return historyState;},pushState(state,_title,href){pushes++;historyState=state;location=new URL(href,location);}},addEventListener:(_n,f)=>listeners.add(f),removeEventListener:(_n,f)=>listeners.delete(f)};
 const hooks={useRef(initial){const i=cursor++;return slots[i]??={current:initial};},useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;}}];},useEffect(fn,deps){const i=cursor++,old=effects.get(i);if(!old||deps.some((d,k)=>!Object.is(d,old.deps[k])))pending.push(()=>{old?.cleanup?.();effects.set(i,{deps,cleanup:fn()});});}};
 const forms={CreateWorkbookForm:'create',DuplicateCourseButton:'duplicate',EditCourseDetailsForm:'edit',ReleaseDraftForm:'release'};
 const mocks={react:hooks,'react/jsx-runtime':{jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})},'next/link':'a','next/navigation':{useSearchParams:()=>new URLSearchParams(location.search)},'./StudioForms':forms};
 const module={exports:{}};new Function('require','module','exports','window',code)(name=>{assert(name in mocks,name);return mocks[name];},module,module.exports,window);
 function render(next=course,workbooks=[]){course=next;let count=0;do{dirty=false;cursor=0;pending=[];tree=module.exports.StudioCourseEditor({course,workbooks,releases:[],recoveryScope});for(const fn of pending)fn();assert(++count<10);}while(dirty);return tree;}
 const find=(predicate)=>{const node=all(tree).find(predicate);assert(node,'expected node');return node;};
 render();return{render,find,forms,recoveryScope,get tree(){return tree;},get pushes(){return pushes;},get url(){return location.href;},get historyState(){return historyState;},report(status){find(n=>n.type==='edit').props.onDraftRecoveryChange(status);render();},cleanup(){for(const e of effects.values())e.cleanup?.();}};
}
test('course editor forwards the same server scope to details, workbook and release forms',()=>{
 const h=fixture();try{assert.equal(h.find(n=>n.type==='edit').props.recoveryScope,h.recoveryScope);assert.equal(h.find(n=>n.type==='create').props.recoveryScope,h.recoveryScope);h.render(undefined,[{id:'synthetic-workbook'}]);assert.equal(h.find(n=>n.type==='release').props.recoveryScope,h.recoveryScope);}finally{h.cleanup();}
});
test('draft recovery notice stays absent with no draft and course details remain collapsed',()=>{
 const h=fixture();try{assert.equal(h.find(n=>n.props.id==='course-details-editor').props.hidden,true);assert(!all(h.tree).some(n=>n.props.id==='course-details-draft-status'));assert.equal(h.pushes,0);}finally{h.cleanup();}
});
test('draft recovery notice is visible outside collapsed options, generic and explicitly reviewable',()=>{
 const h=fixture();try{assert.equal(typeof h.find(n=>n.type==='edit').props.onDraftRecoveryChange,'function');h.report('recovered');
  const status=h.find(n=>n.props.id==='course-details-draft-status'),options=h.find(n=>n.props.className==='course-options');assert.equal(status.props.role,'status');assert(!all(options).includes(status));assert.match(words(status),/Recovered unsent course edits/);assert.doesNotMatch(words(status),/Saved title|course-one/);
  assert.equal(h.find(n=>n.props.id==='course-details-editor').props.hidden,true);const button=all(status).find(n=>n.type==='button');assert.equal(button.props['aria-controls'],'course-details-editor');assert.equal(button.props['aria-expanded'],false);button.props.onClick();h.render();assert.equal(h.find(n=>n.props.id==='course-details-editor').props.hidden,false);assert.equal(h.pushes,1);
  assert.equal(h.url,'https://visiblemedicine.test/studio/courses/course-one?pane=content&keep=1#preview');assert.equal(h.historyState.host,'retained');assert.equal(h.historyState.__vinext_historyIndex,7);assert.equal(h.find(n=>n.props.id==='course-review').props.hidden,true);
  h.report('none');assert(!all(h.tree).some(n=>n.props.id==='course-details-draft-status'));assert.equal(h.find(n=>n.props.id==='course-details-editor').props.hidden,false);
 }finally{h.cleanup();}
});
test('draft recovery attention has a generic visible action without automatic disclosure or history mutation',()=>{
 const h=fixture();try{h.report('attention');const status=h.find(n=>n.props.id==='course-details-draft-status');assert.match(words(status),/needs attention/);assert.match(words(status),/Check device draft/);assert.equal(h.find(n=>n.props.id==='course-details-editor').props.hidden,true);assert.equal(h.pushes,0);}finally{h.cleanup();}
});
test('draft recovery notice belongs only to the current course and old callbacks cannot overwrite its status',()=>{
 const h=fixture();try{const old=h.find(n=>n.type==='edit').props.onDraftRecoveryChange;assert.equal(typeof old,'function');h.report('recovered');h.render({id:'course-two',title:'Another saved title'});assert(!all(h.tree).some(n=>n.props.id==='course-details-draft-status'));h.report('attention');old('recovered');h.render();assert.match(words(h.find(n=>n.props.id==='course-details-draft-status')),/needs attention/);assert.equal(h.pushes,0);}finally{h.cleanup();}
});
