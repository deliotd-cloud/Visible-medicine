// Actual component callbacks with controlled hooks; GPU/DOM acceptance is separate.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url), React=require('react');
const actualLink=await import('vinext/shims/link');
const built=await build({stdin:{contents:`export {NestedPractice} from './app/nested-practice'; export {VentricularView} from './app/ventricles'; export {cardiacCatalog} from './lib/cardiac'; export {ventricleCatalog} from './lib/ventricles'; export {nestedPracticePool} from './lib/nested-practice';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'gpu-boundary',setup(b){b.onLoad({filter:/body-scene\.tsx$/},()=>({contents:'export const BodyScene=()=>null; export const retryBodyAssets=()=>{};',loader:'tsx'}));}}]});
let slots=[],cursor=0,checks=0,effectSlots=[],effectCursor=0,pendingEffects=[];
const state=value=>{const i=cursor++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;return [slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];};
const layoutEffect=(fn,deps)=>{const i=effectCursor++;const prior=effectSlots[i];if(!prior||!deps||deps.some((value,index)=>!Object.is(value,prior[index])))pendingEffects.push(fn);effectSlots[i]=deps;};
const shim={...React,useState:state,useReducer:(reduce,arg,init)=>{const [value,set]=state(()=>init?init(arg):arg);return [value,action=>set(previous=>reduce(previous,action))];},useRef:value=>state(()=>({current:value}))[0],useMemo:fn=>fn(),useCallback:fn=>fn,useLayoutEffect:layoutEffect,useEffect:()=>{}};
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require:id=>id==='react'?shim:id==='next/link'?{__esModule:true,...actualLink}:require(id),structuredClone,requestAnimationFrame:fn=>fn()});
const api=scope.exports, clone=v=>JSON.parse(JSON.stringify(v));
const same=(a,b,m)=>{checks++;assert.deepEqual(clone(a),clone(b),m);};
const check=(v,m)=>{checks++;assert(v,m);};
const nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
const text=n=>typeof n==='string'||typeof n==='number'?String(n):!n?'':Array.isArray(n)?n.map(text).join(''):text(n.props?.children);
const document={activeElement:null};
let focusNodes=new Map();
const mount=()=>{slots=[];effectSlots=[];focusNodes=new Map();document.activeElement=null;};
const renderComponent=fn=>{
  cursor=0;effectCursor=0;pendingEffects=[];
  const tree=fn();
  for(const node of nodes(tree))if(node.props?.ref&&typeof node.props.ref==='object') {
    const key=node.type==='h3'?'heading':node.type==='output'?'feedback':null;
    if(!key)continue;
    if(!focusNodes.has(key))focusNodes.set(key,{focusCount:0,focus(){this.focusCount++;document.activeElement=this;}});
    node.props.ref.current=focusNodes.get(key);
  }
  for(const effect of pendingEffects)effect();
  return tree;
};
const focused=key=>check(document.activeElement===focusNodes.get(key),`${key} receives focus`);
for(const [study,catalog] of [['cardiac',api.cardiacCatalog],['ventricles',api.ventricleCatalog]])for(const mode of ['name','find']) {
  mount();let tree,closed=0;
  const structures=api.nestedPracticePool(catalog.parent,study,catalog.structures,catalog.bundles.map(b=>b.id),[]);
  const render=()=>{tree=renderComponent(()=>api.NestedPractice({catalog,structures,study,mode,view:'anterior',onClose:()=>closed++}));};
  const scene=()=>nodes(tree).find(n=>n.props?.onRendererHealth)?.props;
  const button=label=>nodes(tree).find(n=>n.props?.onClick&&text(n)===label)?.props;
  const choices=()=>nodes(tree).filter(n=>n.props?.onClick&&structures.some(s=>s.name===text(n)));
  render();
  same(scene().labels,false);same(scene().landmarks,[]);same(scene().contextIds,[]);same(scene().selectedId,null);same(scene().exam,true);same(scene().showOrigins,false);
  same(scene().explode,0);same(scene().inspection.plane,'off');
  check(!nodes(tree).some(n=>n.props?.parent||n.props?.['aria-label']==='Cardiac dissection controls'),'No teaching or named study controls');
  check(button('Skip & reveal').disabled,'No grading before load');
  button('Skip & reveal').onClick();render();check(text(tree).includes('Question 1 of 4'),'No early skip');
  for(const b of catalog.bundles)scene().onLoaded(b.id);scene().onRendererHealth('ready');render();
  check(!button('Skip & reveal').disabled);
  for(const status of ['lost','restoring','failed']) {
    scene().onRendererHealth(status);render();
    check(button('Skip & reveal').disabled,status+' pauses answer');
    button('Skip & reveal').onClick();render();check(text(tree).includes('Question 1 of 4'));
  }
  scene().onRendererHealth('ready');scene().onFailure(structures[0].bundle);render();
  check(button('Skip & reveal').disabled,'Asset failure blocks');
  button('Skip & reveal').onClick();render();check(text(tree).includes('Question 1 of 4'));
  scene().onLoaded(structures[0].bundle);render();
  let oldAnswer,oldNext;
  for(let i=0;i<4;i++) {
    check(text(tree).includes(`Question ${i+1} of 4`));
    if(mode==='name') {
      same(scene().structures.length,1);
      const correct=scene().structures[0];
      same(new Set(choices().map(text)).size,4,'Distinct name choices');
      const choose=button(correct.name).onClick;
      if(i===0)oldAnswer=choose;
      choose();choose();render();
      check(text(tree).includes('Correct: '+correct.name));
    } else {
      same(scene().structures.length,4);
      const correct=structures.find(s=>text(tree).includes('Find '+s.name));
      check(correct,'Find prompt names one permitted target');
      const pick=scene().onSelect;
      pick('unrelated-context');render();check(button('Skip & reveal'),'Foreign pick ignored');
      pick(correct.id);pick(correct.id);render();check(text(tree).includes('Correct: '+correct.name));
    }
    const next=button(i===3?'Finish round':'Next space').onClick;
    if(i===0)oldNext=next;
    next();render();
    if(i===0) {oldAnswer?.();oldNext();render();check(text(tree).includes('Question 2 of 4'),'Stale callbacks cannot grade or advance next question');check(button('Skip & reveal'));}
  }
  check(text(tree).includes('4 of 4 correct.'));check(text(tree).includes('Practice complete'));
  button('Return to dissection').onClick();same(closed,1,'Return callback');
}
for(const [study,catalog] of [['cardiac',api.cardiacCatalog],['ventricles',api.ventricleCatalog]]) {
  mount();let tree;
  const structures=api.nestedPracticePool(catalog.parent,study,catalog.structures,catalog.bundles.map(b=>b.id),[]);
  const render=()=>{tree=renderComponent(()=>api.NestedPractice({catalog,structures,study,mode:'name',view:'anterior',onClose:()=>{}}));};
  const scene=()=>nodes(tree).find(n=>n.props?.onRendererHealth)?.props;
  const button=label=>nodes(tree).find(n=>n.props?.onClick&&text(n)===label)?.props;
  render();focused('heading');
  const headingFocusCount=focusNodes.get('heading').focusCount;
  for(const b of catalog.bundles)scene().onLoaded(b.id);
  scene().onRendererHealth('ready');render();
  same(focusNodes.get('heading').focusCount,headingFocusCount,'Loading completion does not refocus heading');
  const correct=scene().structures[0];
  document.activeElement={label:'answer button'};
  button(correct.name).onClick();render();focused('feedback');
  same(nodes(tree).find(n=>n.props?.ref?.current===focusNodes.get('feedback'))?.props.tabIndex,-1,'Feedback can receive programmatic focus');
  check(text(tree).includes('Correct: '+correct.name),'Named answer feedback rendered');
  const feedbackFocusCount=focusNodes.get('feedback').focusCount;
  document.activeElement={label:'next button'};
  scene().onRendererHealth('lost');render();
  scene().onRendererHealth('ready');render();
  same(focusNodes.get('feedback').focusCount,feedbackFocusCount,'Health updates do not refocus answered feedback');
  check(document.activeElement.label==='next button','Health updates leave the active control focused');
  button('Next space').onClick();render();focused('heading');
  document.activeElement={label:'skip button'};
  button('Skip & reveal').onClick();render();focused('feedback');
  check(text(tree).includes('Answer: '),'Skip reveals feedback');
  button('Next space').onClick();render();focused('heading');
  for(let i=2;i<4;i++) {
    button('Skip & reveal').onClick();render();focused('feedback');
    button(i===3?'Finish round':'Next space').onClick();render();focused('heading');
  }
  check(text(tree).includes('Practice complete'),'Round completion rendered');
}
for(const [study,catalog] of [['cardiac',api.cardiacCatalog],['ventricles',api.ventricleCatalog]]) {
  mount();let tree;
  const render=()=>{tree=renderComponent(()=>api.VentricularView({parent:catalog.parent,study}));};
  const scene=()=>nodes(tree).find(n=>n.props?.onRendererHealth)?.props;
  const button=label=>nodes(tree).find(n=>n.props?.onClick&&text(n)===label)?.props;
  const start=()=>nodes(tree).find(n=>n.props?.onClick&&text(n).startsWith('Start practice ('))?.props;
  render();check(start().disabled,'Launcher waits for scene');
  scene().onRendererHealth('ready');for(const b of scene().catalog.bundles)scene().onLoaded(b.id);render();
  check(!start().disabled);check(text(tree).includes('Start practice (4)'));
  const bundle=scene().structures.find(s=>scene().landmarks.includes(s.id)).bundle;
  scene().onFailure(bundle);render();check(start().disabled,'Failed existing bundle denies launch');
  start().onClick();render();check(scene(),'Failed launch retained workbench');
  scene().onLoaded(bundle);render();
  button('Fade others').onClick();render();check(start().disabled,'Isolation cannot widen practice pool');
  start().onClick();render();check(scene());button('Fade others').onClick();render();
  const cut=nodes(tree).find(n=>n.props?.subject&&n.props?.onChange&&n.props?.value?.plane==='off').props;
  cut.onChange({...cut.value,plane:'sagittal'});render();check(start().disabled,'Clipped anatomy does not become whole-surface question');
  cut.onChange(cut.value);render();
  const remove=nodes(tree).find(n=>n.props?.onCheckedChange&&n.props?.['aria-label']?.startsWith('Show ')&&!n.props['aria-label'].includes('original position')).props;
  remove.onCheckedChange(false);render();check(text(tree).includes('Start practice (3)'));
  const before=clone({selectedId:scene().selectedId,hiddenIds:scene().hiddenIds,view:scene().view,explode:scene().explode,inspection:scene().inspection});
  start().onClick();render();
  check(tree.type===api.NestedPractice,'Shared workbench opens actual practice component');
  same(tree.props.structures.length,3);check(tree.props.structures.every(s=>!before.hiddenIds.includes(s.id)));
  tree.props.onClose();render();
  same({selectedId:scene().selectedId,hiddenIds:scene().hiddenIds,view:scene().view,explode:scene().explode,inspection:scene().inspection},before,'Dissection state preserved');
  button('Undo layers').onClick();render();same(scene().hiddenIds.filter(id=>scene().landmarks.includes(id)),[],'History preserved and still reversible');
}
console.log(JSON.stringify({passed:true,checks,actualComponentCallbacks:true,browserAcceptance:false}));
