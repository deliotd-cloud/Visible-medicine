import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type HeadStudy,type LocalHeadPackage,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headImageConcept as headAtlasConcept,resolveHeadImageConcept as resolveHeadConcept} from '../lib/head-image-only-links.ts';
import {headLearningSteps} from '../lib/head-atlas-learning.ts';
import {headImageHref,parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';
import {createHeadViewHistory,HEAD_VIEW_ENTRY_KEY,HEAD_VIEW_EXTERNAL_HISTORY_KEY} from '../lib/head-view-history.ts';

// Execute the parent's actual comparison callbacks, commit scope and native
// control JSX. This synthetic focus/commit fixture does not load private scans
// or claim browser/GPU acceptance, and does not reimplement the exit decision.
const source=readFileSync(process.env.HEAD_COMPARISON_EXIT_SOURCE??new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const viewer=ast.statements.find((node):node is ts.FunctionDeclaration=>ts.isFunctionDeclaration(node)&&node.name?.text==='HeadAtlasViewer');
assert(viewer?.body);
const functions=new Set(['currentHistoryScope','rememberHistoryView','focusComparisonReturn','closeComparison','finishComparisonTour','navigateComparisonTour','selectComparisonConcept','openGuidedComparison','changeLearningPosition','writeNavigation','resetIndexDetails']);
const names=new Set(['viewMemoryReadyRef','pendingHistoryRestoreRef','historyLiveRef','historyTransitionRef','historyHref','comparisonScope','comparisonScopeRef','comparisonOpen','activeEntry','concept']);
const statements=viewer.body.statements.filter(statement=>
  ts.isFunctionDeclaration(statement)&&!!statement.name&&functions.has(statement.name.text)||
  ts.isVariableStatement(statement)&&statement.declarationList.declarations.some(item=>ts.isIdentifier(item.name)&&names.has(item.name.text))||
  ts.isIfStatement(statement)&&statement.getText(ast).startsWith('if(quizActive)viewMemoryReadyRef.current=false;')||
  ts.isExpressionStatement(statement)&&statement.getText(ast).startsWith('historyLiveRef.current=')||
  ts.isExpressionStatement(statement)&&statement.getText(ast).startsWith('useLayoutEffect(')&&statement.getText(ast).includes('comparisonScopeRef.current'));
assert.deepEqual([...functions].filter(name=>!statements.some(item=>ts.isFunctionDeclaration(item)&&item.name?.text===name)),[],'extract every named parent callback');
assert.deepEqual([...names].filter(name=>!statements.some(item=>ts.isVariableStatement(item)&&item.declarationList.declarations.some(decl=>ts.isIdentifier(decl.name)&&decl.name.text===name))),[],'extract every named parent state declaration');
let search:ts.JsxSelfClosingElement|undefined,launcher:ts.JsxElement|undefined,tour:ts.JsxExpression|undefined;
function visit(node:ts.Node){
  if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='input'&&node.getText(ast).includes('ref={indexSearchRef}'))search=node;
  if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='button'&&node.openingElement.getText(ast).includes('ref={comparisonButtonRef}'))launcher=node;
  if(ts.isJsxExpression(node)&&node.expression?.getText(ast).startsWith("comparisonOpen&&rightPanel==='guided'&&<HeadComparisonTour"))tour=node;
  ts.forEachChild(node,visit);
}visit(viewer);
assert(search&&launcher&&tour?.expression,'use actual rendered tour, launcher and search control');
const program=`return function execute(input,hooks,actions){
  const {pkg,study,modality,quizActive,activeId,selected,inlineComparison,rightPanel,learningPosition,query,cursor,windowing,expanded}=input;
  const setExpanded=()=>{};
  const {useMemo,useRef,useLayoutEffect}=hooks;
  const {importGeneration,practiceRef,comparisonButtonRef,indexSearchRef,window,
    setInlineComparison,setRightPanel,setLearningPosition,setUrlNavigation,setNavigationNotice,
    setActiveId,setSelected,setGroupLayers,setOverlayGroup,setQuery,setFamily,setIndexSide,setIndexRepresentation,showLearningEntry,chooseStructure}=actions;
  const {HEAD_LINK_REVISION,HEAD_MANIFEST_SHA256,headAtlasConcept,resolveHeadConcept,headLearningSteps,headImageHref,parseHeadImageNavigation,headViewHistory,HeadComparisonTour,toggleInlineComparison}=actions;
  ${statements.map(item=>item.getText(ast)).join('\n')}
  return {tour:(${tour.expression.getText(ast)}),launcher:(${launcher.getText(ast)}),search:(${search.getText(ast)}),closeComparison,selectComparisonConcept,openGuidedComparison,comparisonScopeRef,rememberHistoryView,writeNavigation,viewMemoryReadyRef,pendingHistoryRestoreRef};
}`;
const code=ts.transpileModule(program,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const execute=new Function('exports','require',code)({},(id:string)=>{assert.equal(id,'react/jsx-runtime');return jsxRuntime;});
type Element={props:Record<string,any>};
type Effect={setup:()=>void|(()=>void);deps?:unknown[];cleanup?:()=>void};
const entry=(modality:'CT'|'MRI',name:string):HeadEntry=>({id:`${modality==='CT'?'cth':'mrb'}.bst.${name}`,label:`${name==='medulla_oblongata'?'Medulla oblongata':name[0].toUpperCase()+name.slice(1)} — regional mask`,laterality:'midline_or_unpaired',representation:'partial-mask',family:'Brainstem',color:[1,0,0],opacity:{fill:0.3,outline:1}});

function harness(modality:'CT'|'MRI'='CT'){
  const pons=entry(modality,'pons'),medulla=entry(modality,'medulla_oblongata');
  assert.equal(headAtlasConcept(pons,modality)?.conceptId,'brainstem-pons');
  assert.equal(headAtlasConcept(medulla,modality)?.conceptId,'brainstem-medulla');
  // Synthetic in-memory grid for callback tests, not an admitted imaging package.
  const definition:HeadStudy={entries:[pons,medulla],image:{shape_kji:[8,9,10],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],sha256:'a'.repeat(64),file:'fixture-image.raw',dtype:'int16'}};
  const pkg:LocalHeadPackage={source:'configured-local',files:new Map(),manifest:{schema_version:'synthetic',version:'synthetic',byte_order:'little',source_studies_are_distinct:true,studies:{CT:definition,MRI:{...definition}}}};
  // Preserve the exact active definition identity for both independently tested modalities.
  pkg.manifest.studies[modality]=definition;
  const study:LoadedStudy={definition,geometry:createNativeVolumeGeometry(definition.image),data:new Int16Array(8*9*10),range:[0,0]};
  let input={pkg,study,modality,quizActive:false,activeId:pons.id,selected:{entry:pons} as {entry:HeadEntry}|null,
    inlineComparison:{pkg,study,modality} as {pkg:object;study:typeof study;modality:'CT'|'MRI'}|null,rightPanel:'guided',learningPosition:{sequenceId:'brainstem',conceptId:'brainstem-pons' as string|null},query:'',cursor:[2,3,4],windowing:[40,80],expanded:'axial'};
  let pending:Record<string,any>={},cursor=0,tree:any,active='finish',mounted=true;
  const refs:any[]=[],committed=new Map<number,Effect>();let effects=new Map<number,Effect>();
  const writes:string[]=[],replaces:unknown[]=[],focuses:string[]=[],selections:HeadEntry[]=[];
  const headViewHistory=createHeadViewHistory();
  const controls=Object.fromEntries(['search','launcher'].map(id=>[id,{disabled:false,connected:true,focus(options:unknown){
    assert.deepEqual(options,{preventScroll:true});if(!this.connected||this.disabled)return;active=id;focuses.push(id);
  }}]));
  const hooks={useMemo:(fn:()=>unknown)=>fn(),useRef:(initial:unknown)=>{const index=cursor++;return refs[index]??(refs[index]={current:initial});},
    useLayoutEffect:(setup:Effect['setup'],deps?:unknown[])=>effects.set(cursor++,{setup,deps})};
  function set(key:string){return(next:any)=>{pending[key]=typeof next==='function'?next(pending[key]??(input as any)[key]):next;};}
  const actions:any={HEAD_LINK_REVISION,HEAD_MANIFEST_SHA256,headAtlasConcept,resolveHeadConcept,headLearningSteps,headImageHref,parseHeadImageNavigation,headViewHistory,
    HeadComparisonTour:()=>null,toggleInlineComparison:()=>{},importGeneration:{current:0},practiceRef:{current:{active:false}},
    comparisonButtonRef:{current:controls.launcher},indexSearchRef:{current:controls.search},
    setInlineComparison:(value:unknown)=>{writes.push('comparison');set('inlineComparison')(value);},setRightPanel:set('rightPanel'),setLearningPosition:set('learningPosition'),
    setUrlNavigation:()=>{},setNavigationNotice:()=>{},setActiveId:set('activeId'),setSelected:set('selected'),setGroupLayers:()=>{},setOverlayGroup:()=>{},
    setQuery:set('query'),setFamily:()=>{},setIndexSide:()=>{},setIndexRepresentation:()=>{},
    showLearningEntry:(item:HeadEntry)=>{selections.push(item);set('activeId')(item.id);set('selected')({entry:item});},chooseStructure:()=>{},
    window:{location:{origin:'https://example.test',pathname:`/atlas/${modality==='CT'?'ct':'mri'}-head`,search:`?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`,hash:''},history:{state:{frameworkIndex:7},replaceState:(state:unknown)=>{
      replaces.push(state);actions.window.history.state=state;
    },pushState:(state:unknown,_unused:string,href:string)=>{
      actions.window.history.state=state;
      writes.push(href);const url=new URL(href,actions.window.location.origin);Object.assign(actions.window.location,{pathname:url.pathname,search:url.search,hash:url.hash});
    }}}};
  function render(patch:Record<string,any>={},commit=true){
    const next={...input,...pending,...patch};cursor=0;effects=new Map();const result=execute(next,hooks,actions);
    if(!commit)return result;
    input=next;pending={};tree=result;
    for(const [name,element]of [['search',tree.search],['launcher',tree.launcher]] as const){controls[name].disabled=!!element.props.disabled;element.props.ref.current=controls[name];}
    if((active==='launcher'||active==='search')&&controls[active].disabled)active='body';
    for(const[index,effect]of effects){const previous=committed.get(index);if(previous?.deps&&effect.deps&&previous.deps.length===effect.deps.length&&previous.deps.every((value,i)=>Object.is(value,effect.deps![i])))continue;
      previous?.cleanup?.();const cleanup=effect.setup();committed.set(index,{...effect,cleanup:typeof cleanup==='function'?cleanup:undefined});}
    return result;
  }
  const unmount=()=>{mounted=false;for(const effect of committed.values())effect.cleanup?.();for(const control of Object.values(controls))control.connected=false;active='body';};
  render();
  return {render,actions,controls,writes,replaces,focuses,selections,pons,medulla,pkg,study,headViewHistory,unmount,
    get tree(){return tree;},get active(){return active;},get input(){return input;},get mounted(){return mounted;}};
}

for(const modality of ['CT','MRI'] as const){
  test(`${modality}: finishing an unavailable canonical final step returns to enabled search`,()=>{
    const h=harness(modality);h.study.definition.entries.pop();
    h.tree.tour.props.onNavigate({sequenceId:'brainstem',conceptId:'brainstem-medulla'});h.render();
    assert.equal(h.input.selected,null);assert.equal(h.input.activeId,'');assert.equal(h.controls.launcher.disabled,false,'open comparison can still be closed');
    h.tree.tour.props.onFinish();h.render();
    assert.equal(h.tree.tour,false);assert.equal(h.input.rightPanel,'info');assert.equal(h.input.learningPosition.conceptId,null);
    assert.equal(h.controls.launcher.disabled,true);assert.equal(h.controls.search.disabled,false);assert.equal(h.active,'search');
    assert.equal(h.writes.at(-1),`/atlas/${modality==='CT'?'ct':'mri'}-head`);h.unmount();
  });
  test(`${modality}: finishing mapped anatomy preserves the selection and focuses its enabled launcher`,()=>{
    const h=harness(modality);h.tree.tour.props.onNavigate({sequenceId:'brainstem',conceptId:'brainstem-medulla'});h.render();
    h.tree.tour.props.onFinish();h.render();assert.equal(h.input.selected?.entry,h.medulla);assert.equal(h.active,'launcher');
    assert.equal(h.controls.launcher.disabled,false);assert.match(h.writes.at(-1)!,/concept=brainstem-medulla&headRevision=/);h.unmount();
  });
  test(`${modality}: Finish reserves its exit before duplicate or reverse callbacks in the same commit`,()=>{
    const h=harness(modality),finish=h.tree.tour.props.onFinish,reverse=h.tree.selectComparisonConcept,navigate=h.tree.tour.props.onNavigate;
    finish();const firstWrites=h.writes.length,firstFocus=h.focuses.length;
    finish();reverse('brainstem-medulla');navigate({sequenceId:'brainstem',conceptId:'brainstem-medulla'});
    assert.equal(h.writes.length,firstWrites);assert.equal(h.focuses.length,firstFocus);assert.deepEqual(h.selections,[]);
    h.render();finish();assert.equal(h.writes.length,firstWrites);assert.equal(h.active,'launcher');h.unmount();
  });
  test(`${modality}: ordinary Close also returns unavailable selections to search`,()=>{
    const h=harness(modality);h.render({activeId:'',selected:null});h.tree.closeComparison();h.render();
    assert.equal(h.active,'search');assert.equal(h.input.rightPanel,'guided');assert.equal(h.controls.launcher.disabled,true);h.unmount();
  });
  test(`${modality}: Close retires duplicate exits and queued reverse navigation before a commit`,()=>{
    const h=harness(),old=h.tree;old.closeComparison();const writes=h.writes.length,focuses=h.focuses.length;
    old.closeComparison();old.tour.props.onFinish();old.selectComparisonConcept('brainstem-medulla');
    assert.equal(h.writes.length,writes);assert.equal(h.focuses.length,focuses);assert.deepEqual(h.selections,[]);
    h.render();assert.equal(h.input.rightPanel,'guided');assert.equal(h.active,'launcher');h.unmount();
  });
  test(`${modality}: a pending selection cannot return focus to a disabled launcher`,()=>{
    const h=harness();h.render({activeId:h.medulla.id,selected:{entry:h.pons}});
    h.tree.tour.props.onFinish();h.render();assert.equal(h.active,'search');assert.equal(h.controls.launcher.disabled,true);h.unmount();
  });
}
for(const retired of ['study','practice','panel','closed','generation','unmount'])test(`retained Finish cannot move focus or navigate after ${retired}`,()=>{
  const h=harness(),finish=h.tree.tour.props.onFinish;
  if(retired==='study')h.render({study:{definition:{entries:[]}}});
  if(retired==='practice'){h.actions.practiceRef.current.active=true;h.render({quizActive:true});}
  if(retired==='panel')h.render({rightPanel:'info'});
  if(retired==='closed')h.render({inlineComparison:null});
  if(retired==='generation')h.actions.importGeneration.current++;
  if(retired==='unmount')h.unmount();
  finish();assert.deepEqual(h.writes,[]);assert.deepEqual(h.focuses,[]);h.unmount();
});
for(const action of ['finish','navigate','close','reverse','open-guided'])test(`comparison ${action} is inert when practice starts before a parent commit`,()=>{
  const h=harness();h.actions.practiceRef.current.active=true;
  if(action==='finish')h.tree.tour.props.onFinish();
  if(action==='navigate')h.tree.tour.props.onNavigate({sequenceId:'brainstem',conceptId:'brainstem-medulla'});
  if(action==='close')h.tree.closeComparison();
  if(action==='reverse')h.tree.selectComparisonConcept('brainstem-medulla');
  if(action==='open-guided')h.tree.openGuidedComparison(h.pons);
  assert.deepEqual(h.writes,[]);assert.deepEqual(h.focuses,[]);assert.deepEqual(h.selections,[]);h.unmount();
});
test('an abandoned replacement render cannot finish or retire the visible tour',()=>{
  const h=harness(),visible=h.tree,speculative=h.render({selected:null,activeId:''},false);
  speculative.tour.props.onFinish();assert.deepEqual(h.writes,[]);assert.deepEqual(h.focuses,[]);
  visible.tour.props.onFinish();h.render();assert.equal(h.active,'launcher');assert.equal(h.input.rightPanel,'info');h.unmount();
});

for(const modality of ['CT','MRI'] as const)test(`${modality}: real history callback saves the departing plain view and retires pending restore on navigation`,()=>{
  const h=harness(modality),browser=h.actions.window;
  browser.location.search='';h.render({inlineComparison:null,rightPanel:'info',cursor:[2,3,4],windowing:[45,90],expanded:'coronal'});
  const plainHref=browser.location.pathname,frameworkState=browser.history.state;
  h.tree.viewMemoryReadyRef.current=true;
  h.tree.rememberHistoryView();
  assert.equal(h.replaces.length,1,'a real history entry receives its opaque token');
  const savedState=browser.history.state;
  assert.equal(savedState.frameworkIndex,7,'framework state survives replaceState');
  assert.equal(typeof savedState[HEAD_VIEW_ENTRY_KEY],'string');
  assert.deepEqual(h.headViewHistory.read(savedState,plainHref,{pkg:h.pkg,study:h.study,modality,revision:HEAD_MANIFEST_SHA256}),
    {cursor:[2,3,4],layout:'coronal',windowing:[45,90]});
  assert.equal(h.headViewHistory.read(frameworkState,plainHref,{pkg:h.pkg,study:h.study,modality,revision:HEAD_MANIFEST_SHA256}),null);
  h.tree.pendingHistoryRestoreRef.current={pkg:h.pkg,study:h.study,href:plainHref,view:{cursor:[1,1,1],layout:'axial',windowing:[40,80]}};
  h.tree.writeNavigation('brainstem-pons',null);
  assert.equal(h.tree.pendingHistoryRestoreRef.current,null,'leaving a view clears a pending restore');
  assert.equal(h.tree.viewMemoryReadyRef.current,false,'concept navigation cannot overwrite the saved plain view');
  assert.equal(browser.history.state[HEAD_VIEW_ENTRY_KEY],undefined,'new URL does not inherit the prior view token');
  assert.equal(browser.history.state[HEAD_VIEW_EXTERNAL_HISTORY_KEY],true,'navigation remains an external history entry');
  assert.equal(h.replaces.length,1,'re-saving the same entry does not replace its token');
  assert.equal(h.headViewHistory.read(savedState,plainHref,{pkg:h.pkg,study:h.study,modality,revision:HEAD_MANIFEST_SHA256})?.layout,'coronal');
  assert.equal(h.headViewHistory.read(savedState,h.writes.at(-1)!,{pkg:h.pkg,study:h.study,modality,revision:HEAD_MANIFEST_SHA256}),null,'copied state cannot restore at another URL');
  assert.equal(h.headViewHistory.read(savedState,plainHref,{pkg:{...h.pkg,source:undefined},study:h.study,modality,revision:HEAD_MANIFEST_SHA256}),null,'another source cannot restore the view');
  h.unmount();
});

for(const gate of ['not-ready','guided-panel','practice','3d-layout','position-link','invalid-link','other-route','no-replace-state'] as const)test(`real history callback refuses ${gate} presentation`,()=>{
  const h=harness(),browser=h.actions.window;
  browser.location.search='';
  const patch:Record<string,unknown>={inlineComparison:null,rightPanel:'info'};
  if(gate==='guided-panel')patch.rightPanel='guided';
  if(gate==='practice')patch.quizActive=true;
  if(gate==='3d-layout')patch.expanded='3d';
  h.render(patch);
  if(gate==='practice')assert.equal(h.tree.viewMemoryReadyRef.current,false,'practice retires any ready view before the callback');
  h.tree.viewMemoryReadyRef.current=gate!=='not-ready';
  if(gate==='position-link')browser.location.search=`?concept=brainstem-pons&headTour=brainstem&headStep=1&headRevision=${HEAD_LINK_REVISION}`;
  if(gate==='invalid-link')browser.location.search='?headRevision=obsolete';
  if(gate==='other-route')browser.location.pathname='/atlas/shoulder';
  if(gate==='no-replace-state')browser.history.replaceState=undefined;
  h.tree.rememberHistoryView();
  assert.deepEqual(h.replaces,[]);
  assert.equal(h.headViewHistory.size(),0);
  assert.equal(browser.history.state[HEAD_VIEW_ENTRY_KEY],undefined);
  h.unmount();
});
