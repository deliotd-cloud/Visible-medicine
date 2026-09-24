/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- controlled component harness */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
let active=false,states=[],stateCursor=0,refs=[],refCursor=0,effects=[],context;
const shim={
  ...React,
  useState(initial){
    if(!active)return React.useState(initial);
    const i=stateCursor++;
    if(!(i in states))states[i]=typeof initial==='function'?initial():initial;
    return [states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next;}];
  },
  useMemo:(fn,deps)=>active?fn():React.useMemo(fn,deps),
  useCallback:(fn,deps)=>active?fn:React.useCallback(fn,deps),
  useContext:value=>active?context:React.useContext(value),
  useId:()=>active?'search-preview-focus':React.useId(),
  useRef(value){
    if(!active)return React.useRef(value);
    const i=refCursor++;
    return refs[i]??(refs[i]={current:value});
  },
  useEffect:(fn,deps)=>active?effects.push(fn):React.useEffect(fn,deps),
};
const built=await build({
  stdin:{contents:"export {AtlasSearch} from './app/atlas-workspace'; export {atlasSearchIndex} from './lib/atlas-navigation';",resolveDir:process.cwd(),loader:'ts'},
  bundle:true,platform:'node',format:'cjs',write:false,
  external:['react','react/*','react-dom','react-dom/*','next/link'],loader:{'.css':'empty'},
});
const scope={exports:{}},uiWindow={innerWidth:1280,innerHeight:720};
runInNewContext(built.outputFiles[0].text,{
  module:scope,exports:scope.exports,console,URLSearchParams,window:uiWindow,
  process:{env:{NODE_ENV:'test'}},
  require:id=>id==='react'?shim:id==='next/link'?()=>null:require(id),
});
const {AtlasSearch,atlasSearchIndex}=scope.exports;
const catalog=JSON.parse(await fs.readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const studyEntries=atlasSearchIndex(catalog,'head-neck','both');
const previewCases=[
  studyEntries.find(entry=>entry.label==='Deep-brain overview'&&entry.action.type==='window'),
  studyEntries.find(entry=>entry.action.type==='focus'),
];
assert(previewCases.every(Boolean),'window and focus study results exist');
const document={activeElement:null};
class FocusNode{
  constructor(name){this.name=name;this.isConnected=true;this.focusCalls=[];}
  focus(options){this.focusCalls.push(options);document.activeElement=this;}
}
const walk=(node,predicate,result=[])=>{
  if(React.isValidElement(node)){
    if(predicate(node))result.push(node);
    React.Children.forEach(node.props.children,child=>walk(child,predicate,result));
  }
  return result;
};
const text=node=>typeof node==='string'||typeof node==='number'?String(node):
  !node?'':Array.isArray(node)?node.map(text).join(''):text(node.props?.children);
const find=(tree,predicate,label)=>{
  const node=walk(tree,predicate)[0];assert(node,label);return node;
};
const calls=[];
context={
  mode:'explore',exam:false,focusView:false,panelLayout:null,
  chooseMode:mode=>calls.push(['mode',mode]),
  setPanelOpen:(info,open)=>calls.push(['panel',info,open]),
  showInfo:()=>calls.push(['info']),
};
const props={
  catalog,region:'head-neck',side:'both',
  onSelect:id=>calls.push(['select',id]),onWindow:id=>calls.push(['window',id]),
  onFocus:id=>calls.push(['focus',id]),onDissect:target=>calls.push(['dissect',target]),
};
let tree;
function render(){
  active=true;stateCursor=0;refCursor=0;effects=[];
  tree=AtlasSearch(props);active=false;return tree;
}
function attachAndCommit({confirmation=true}={}){
  const root=new FocusNode('dialog root');
  find(tree,node=>node.props.className==='atlas-search-dialog','dialog popup').props.ref.current=root;
  if(confirmation){
    const button=find(tree,node=>text(node)==='Open study view','confirmation action');
    button.props.ref.current=new FocusNode('Open study view');
  }
  const pending=effects;effects=[];pending.forEach(effect=>effect());
  return root;
}
function reset(query='Deep-brain overview',kind='view'){
  states=[true,query,kind,12,null];refs=[];calls.length=0;
  context.exam=false;context.focusView=false;context.panelLayout=null;document.activeElement=null;
  render();
}
function resultButton(entry=previewCases[0]){
  return find(tree,node=>node.type==='button'&&node.key===entry.key,`${entry.label} result`);
}
function openPreview(entry=previewCases[0],origin=new FocusNode('origin result')){
  document.activeElement=origin;
  resultButton(entry).props.onClick({currentTarget:origin});
  render();
  const root=attachAndCommit();
  assert.equal(document.activeElement.name,'Open study view','preview focuses its primary confirmation');
  assert.equal(find(tree,node=>node.props.className==='atlas-search-results','results').props.hidden,true);
  return {origin,root};
}

// The live keyboard path: Enter on window and focus study results, then cancel
// back to the precise originating result without changing the search state.
for(const entry of previewCases){
  reset(entry.label);
  const {origin}=openPreview(entry);
  find(tree,node=>text(node)==='Keep current view','cancel action').props.onClick();
  render();attachAndCommit({confirmation:false});
  assert.equal(document.activeElement,origin,`${entry.action.type} cancel returns to its exact result`);
  assert.equal(states[1],entry.label);assert.equal(states[2],'view');
}

// Query and filter changes intentionally invalidate preview without moving the
// user's active editing control back to the old result or confirmation.
for(const control of ['query','filter']){
  reset();openPreview();
  const editing=new FocusNode(control);document.activeElement=editing;
  if(control==='query'){
    find(tree,node=>node.type==='input'&&node.props.type==='search','query input').props.onChange({target:{value:'ventricle'}});
  }else{
    find(tree,node=>node.type==='select','kind filter').props.onChange({target:{value:'structure'}});
  }
  render();attachAndCommit({confirmation:false});
  assert.equal(document.activeElement,editing,`${control} invalidation retains its active control`);
  assert.equal(states[4],null);
}

// Losing the old result is safe: cancellation focuses the still-mounted popup.
reset();
const absent=openPreview();absent.origin.isConnected=false;
find(tree,node=>text(node)==='Keep current view','fallback cancel').props.onClick();
render();const fallback=attachAndCommit({confirmation:false});
assert.equal(document.activeElement,fallback,'missing origin uses the dialog root fallback');

// Closing, confirmed handoff and exam entry must not trigger the
// preview-restoration effect.
reset();openPreview();
const focusedOnClose=document.activeElement;
tree.props.onOpenChange(false);render();attachAndCommit({confirmation:false});
assert.equal(document.activeElement,focusedOnClose,'dialog close does not run preview restoration');

for(const entry of previewCases){
  for(const layout of ['desktop','collapsed','focus view']){
    reset(entry.label);
    context.focusView=layout==='focus view';
    context.panelLayout=layout==='collapsed'?{tools:true,info:true}:null;
    openPreview(entry);
    const focusedOnHandoff=document.activeElement;
    const launcher=new FocusNode('Search atlas');
    find(tree,node=>node.props.render?.props?.className==='atlas-search-trigger','Search launcher').props.render.props.ref.current=launcher;
    find(tree,node=>text(node)==='Open study view','confirmed handoff').props.onClick();
    render();attachAndCommit({confirmation:false});
    assert.equal(document.activeElement,focusedOnHandoff,`${entry.action.type} ${layout} handoff does not run preview restoration`);
    assert.equal(find(tree,node=>node.props.className==='atlas-search-dialog','dialog popup').props.finalFocus(),launcher,`${entry.action.type} ${layout} restores Search launcher on dialog close`);
    assert.deepEqual(calls,[['mode','dissect'],[entry.action.type,entry.action.id],['panel',false,false],['panel',true,false]],`${entry.action.type} ${layout} leaves both panels closed`);
  }
}

reset();openPreview();
const focusedOnExam=document.activeElement;context.exam=true;render();attachAndCommit({confirmation:false});
assert.equal(document.activeElement,focusedOnExam,'exam transition does not move focus');
const examCalls=calls.length;
find(tree,node=>text(node)==='Open study view','stale exam confirmation').props.onClick();
assert.equal(calls.length,examCalls,'exam blocks stale study confirmation');

console.log(JSON.stringify({
  passed:true,component:'AtlasSearch',actualComponentCallbacks:true,
  activeElementAssertions:true,browserAcceptance:false,
  cases:['window/focus entry and cancel','query/filter invalidation','missing-origin fallback','desktop/collapsed/focus-view handoff','close/exam'],
  limitations:'Controlled hooks and focusable-node document boundary; not a browser DOM, native details-state, or visual test.',
}));
