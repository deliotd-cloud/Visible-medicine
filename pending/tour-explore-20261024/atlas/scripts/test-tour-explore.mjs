/* oxlint-disable react-hooks/rules-of-hooks -- controlled production component harness */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import ts from 'typescript';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
const raw=JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
const built=await build({stdin:{contents:"export {tourExploreRequest,resolveTourExplore} from './lib/tour-explore'; export {thoraxTour,regionalTourStructures} from './lib/regional-tours'; export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {RegionalGuidedLearning} from './app/regional-guided-learning';",loader:'tsx',resolveDir:process.cwd()},
  bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'},plugins:[{name:'tour-scene-boundary',setup(api){
    api.onLoad({filter:/[\\/]app[\\/]body-scene\.tsx$/},()=>({loader:'tsx',contents:'export function BodyScene(){return null;}'}));
    api.onLoad({filter:/[\\/]app[\\/]lazy-body-teaching\.tsx$/},()=>({loader:'tsx',contents:'export function LazyBodyTeaching(){return null;}'}));
  }}]});
const nodes=tree=>!tree||typeof tree!=='object'?[]:Array.isArray(tree)?tree.flatMap(nodes):[tree,...nodes(tree.props?.children)];
const label=node=>typeof node==='string'?node:Array.isArray(node)?node.map(label).join(''):node&&typeof node==='object'?label(node.props?.children):'';
const catalog=()=>api.bodyDisplayCatalog(structuredClone(raw));
let api;
{
  const mod={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,structuredClone,require(id){if(id==='next/dynamic')return()=> 'BodyScene';return require(id);}});
  api=mod.exports;
}

test('exact registered stop and source are required at creation and delivery',()=>{
  const source=catalog(),tour=api.thoraxTour;
  const request=api.tourExploreRequest(source,tour,1);
  assert(request);
  assert.equal(request.tour,tour);
  assert.equal(request.stepId,tour.steps[1].id);
  assert.deepEqual(request.sourceRecord,source.structures.find(s=>s.id===request.selectedId));
  assert.equal(api.resolveTourExplore(source,'thorax',request)?.structure.id,request.selectedId);
  assert.equal(api.resolveTourExplore(source,'abdomen',request),null);
  assert.equal(api.resolveTourExplore(catalog(),'thorax',request),null,'foreign catalogue object');
  assert.equal(api.tourExploreRequest(source,structuredClone(tour),1),null,'cloned tour');
  assert.equal(api.tourExploreRequest(source,{...tour,steps:[...tour.steps]},1),null,'mutated clone');
  for(const changes of [{stepId:'wrong'},{revision:'wrong'},{selectedId:tour.steps[0].selectedId},
    {sourceRecord:{...request.sourceRecord,name:'changed'}},{catalogSignature:'wrong'}])
    assert.equal(api.resolveTourExplore(source,'thorax',{...request,...changes}),null);
  const absent={...source,structures:source.structures.filter(s=>s.id!==request.selectedId)};
  assert.equal(api.tourExploreRequest(absent,tour,1),null,'missing selected source');
  const duplicate={...source,structures:[...source.structures,source.structures.find(s=>s.id===request.selectedId)]};
  assert.equal(api.tourExploreRequest(duplicate,tour,1),null,'ambiguous selected source');
  const missingBundle={...source,bundles:source.bundles.filter(b=>b.id!==request.sourceRecord.bundle)};
  assert.equal(api.tourExploreRequest(missingBundle,tour,1),null,'missing bundle');
  const changed=structuredClone(source);changed.structures.find(s=>s.id===request.selectedId).sourceName='changed';
  assert.equal(api.resolveTourExplore(changed,'thorax',{...request,catalog:changed}),null,'changed catalogue');
});

function player(onExplore){
  const slots=[],timers=new Map(),listeners=new Map(),events=[];
  let cursor=0,pending=[],dirty=false,tree,serial=0;
  const changed=(a,b)=>!a||!b||a.length!==b.length||a.some((x,i)=>!Object.is(x,b[i]));
  const hook={...React,
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;}}];},
    useRef(initial){return slots[cursor++]??={current:initial};},
    useMemo(fn,deps){const i=cursor++;if(changed(slots[i]?.deps,deps))slots[i]={deps,value:fn()};return slots[i].value;},
    useCallback(fn,deps){return hook.useMemo(()=>fn,deps);},
    useEffect(fn,deps){effect(fn,deps);},useLayoutEffect(fn,deps){effect(fn,deps);},
  };
  function effect(fn,deps){const i=cursor++;if(changed(slots[i]?.deps,deps))pending.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});}
  const doc={hidden:false,addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);}};
  const win={matchMedia(){return {matches:false,addEventListener(){},removeEventListener(){}};},setTimeout(fn){const id=++serial;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},addEventListener(){},removeEventListener(){}};
  const mod={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,structuredClone,document:doc,window:win,
    require(id){if(id==='react')return hook;if(id==='next/dynamic')return()=> 'BodyScene';return require(id);}});
  const local=mod.exports,props={catalog:local.bodyDisplayCatalog(structuredClone(raw)),tour:local.thoraxTour,onExit(){events.push('exit');},...(onExplore?{onExplore:r=>{events.push(r);onExplore(r);}}:{})};
  function render(){let count=0;do{dirty=false;cursor=0;pending=[];tree=local.RegionalGuidedLearning(props);assert(++count<20);if(dirty)continue;for(const fn of pending)fn();}while(dirty);return tree;}
  const button=name=>nodes(tree).find(n=>n.props?.onClick&&label(n)===name);
  const scene=()=>nodes(tree).find(n=>n.type==='BodyScene').props;
  const click=name=>{const node=button(name);assert(node&&!node.props.disabled,name);node.props.onClick();render();};
  function speculative(){
    const committedTree=tree;
    props.pauseRequest=1;cursor=0;pending=[];dirty=false;
    const proposed=local.RegionalGuidedLearning(props);
    delete props.pauseRequest;tree=committedTree;pending=[];dirty=false;
    return proposed;
  }
  render();
  return {props,render,button,scene,click,speculative,events,timers,doc,
    ready(){for(const id of new Set(scene().structures.map(s=>s.bundle)))scene().onLoaded(id);scene().onRendererHealth('ready');render();},
    retire(){for(const slot of slots)slot?.cleanup?.();}};
}

test('player offers one handoff only at a committed ready paused stop',()=>{
  const none=player();none.ready();none.click('Start guided tour');assert.equal(none.button('Explore this structure'),undefined);none.retire();
  const h=player(()=>{});
  assert.equal(h.button('Explore this structure'),undefined,'not ready');
  h.ready();assert.equal(h.button('Explore this structure'),undefined,'not active');
  h.click('Play full tour');assert.equal(h.button('Explore this structure'),undefined,'playing');
  h.click('Pause');
  const speculative=nodes(h.speculative()).find(n=>n.props?.onClick&&label(n)==='Explore this structure');
  assert(speculative);speculative.props.onClick();assert.equal(h.events.length,0,'speculative render action');
  const action=h.button('Explore this structure').props.onClick;
  assert(action);action();h.render();assert.equal(h.events.length,1);
  action();assert.equal(h.events.length,1,'retained duplicate');
  assert.equal(h.events[0].stepId,h.props.tour.steps[0].id);
  h.retire();action();assert.equal(h.events.length,1,'retired action');
});

test('parent current handler refuses retired, foreign and duplicate requests',async()=>{
  const source=catalog(),tour=api.thoraxTour,request=api.tourExploreRequest(source,tour,0);
  const text=await readFile(new URL('../app/body-explorer.tsx',import.meta.url),'utf8');
  const file=ts.createSourceFile('body-explorer.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let handler;
  function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(file)==='exploreTourStop')handler=node.initializer.getText(file);ts.forEachChild(node,visit);}visit(file);
  assert(handler,'production parent handler');
  const js=ts.transpileModule(`const action=${handler};action;`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const calls=[],retired={current:false},restore={current:'old camera'},scope={current:{catalog:source,region:'thorax',guided:true,exam:false,inlineStudy:false,directTour:tour}};
  const context={committedTourScope:scope,guidedScopeRetired:retired,catalog:source,initialRegion:'thorax',resolveTourExplore:api.resolveTourExplore,
    bodySideMatches:()=>true,pausedTourImaging:{suspend(){calls.push('suspend');}},changeGuidedLearning(){calls.push('exit');restore.current='guided Return camera';},
    chooseWorkspaceMode(mode){calls.push(mode);},cameraRestore:restore,setSide(v){calls.push(['side',v]);},
    setDissection(fn){calls.push(['dissection',fn({removed:['source']})]);},dissectionReducer:(_state,action)=>action,setSystems(){calls.push('systems');},allBodySystems:{},
    setGhostRemoved(v){calls.push(['ghost',v]);},setPlate(v){calls.push(['plate',v]);},setFocus(v){calls.push(['focus',v]);},setIsolated(v){calls.push(['isolated',v]);},setInspection(v){calls.push(['inspection',v]);},initialInspection:{plane:'off'},setLayout(v){calls.push(['layout',v]);},setShowOrigins(){},
    setExplode(){},setRegionalFraming(){},setView(v){calls.push(['view',v]);},setZoom(){},
    applySelection(id,_restoreFocus,sourceScope){calls.push(['selection',id,sourceScope.filter(s=>s.id===id).length]);},setReset(){}};
  const action=runInNewContext(js,context);
  action({...request,stepId:'wrong'});assert.equal(calls.length,0);
  scope.current.exam=true;action(request);assert.equal(calls.length,0);
  scope.current.exam=false;scope.current.catalog=catalog();action(request);assert.equal(calls.length,0);
  scope.current.catalog=source;action(request);
  assert.deepEqual(calls.filter(v=>Array.isArray(v)&&v[0]==='selection').map(v=>[v[1],v[2]]),[[request.selectedId,1]]);
  assert.equal(restore.current,null,'guided Return camera removed');
  assert(calls.includes('explore'));
  assert(calls.some(v=>Array.isArray(v)&&v[0]==='side'&&v[1]==='both'),'laterality filter reset');
  assert(calls.some(v=>Array.isArray(v)&&v[0]==='dissection'&&v[1]?.type==='stage'&&v[1]?.id==='assembled'),'old cutaway stage reset');
  for(const flag of [['ghost',false],['plate',false],['focus',true],['isolated',true],['layout','spatial']])
    assert(calls.some(v=>Array.isArray(v)&&v[0]===flag[0]&&v[1]===flag[1]),`${flag[0]} handoff`);
  assert(calls.some(v=>Array.isArray(v)&&v[0]==='inspection'&&v[1]?.plane==='off'),'cut plane cleared');
  action(request);assert.equal(calls.filter(v=>Array.isArray(v)&&v[0]==='selection').length,1);
});

test('manual stops can freeze their camera and hand off without toggling Play first',()=>{
  const h=player(()=>{});h.ready();h.click('Start guided tour');
  const action=h.button('Explore this structure')?.props.onClick;
  assert.equal(typeof action,'function');action();h.render();
  assert.equal(h.events.length,1);assert.equal(h.events[0].stepId,h.props.tour.steps[0].id);
  action();assert.equal(h.events.length,1);h.retire();
});
