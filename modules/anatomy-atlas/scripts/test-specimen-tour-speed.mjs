/* oxlint-disable react-hooks/rules-of-hooks -- controlled hooks exercise production tour hosts */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
const plain=value=>JSON.parse(JSON.stringify(value));
const nodes=tree=>!tree||typeof tree!=='object'?[]:Array.isArray(tree)?tree.flatMap(nodes):[tree,...nodes(tree.props?.children)];
const label=tree=>tree==null?'':typeof tree==='string'||typeof tree==='number'?String(tree):Array.isArray(tree)?tree.map(label).join(''):label(tree.props?.children);
const shoulderBuild=await build({stdin:{contents:"export {default as ShoulderExplorer} from './app/shoulder-explorer'; export {WorkspaceModes} from './app/atlas-workspace'; export {shoulderTour} from './lib/shoulder-tours'; export {guidedPlaybackDuration,guidedSweepDuration} from './lib/guided-playback';",loader:'tsx',resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},plugins:[{name:'session-boundaries',setup(api){
  api.onLoad({filter:/[\\/]app[\\/]anatomy-scene\.tsx$/},()=>({loader:'tsx',contents:'export function AnatomyScene(){return null;}'}));
  api.onLoad({filter:/[\\/]app[\\/]workspace-session\.tsx?$/},()=>({loader:'ts',contents:'export function useWorkspaceSession(){return window.__workspace;}'}));
  api.onLoad({filter:/[\\/]app[\\/]imaging-link\.tsx$/},()=>({loader:'tsx',contents:'export function ImagingLink(){return null;} export function useImagingLink(options){window.__imaging=options;return {publish(){}};}'}));
}}]});
const specimenBuild=await build({stdin:{contents:"export {KneeSpecimenView} from './app/um-knee-study'; export {createHraPelvisSupplement} from './app/hra-pelvis-supplement'; export {hraPelvisDefinition} from './lib/hra-pelvis'; export {guidedPlaybackDuration,guidedSweepDuration} from './lib/guided-playback';",loader:'tsx',resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},plugins:[{name:'no-gpu-boundary',setup(api){api.onLoad({filter:/[\\/]app[\\/]body-scene\.tsx$/},()=>({loader:'js',contents:'export function BodyScene(){return null;} export function retryBodyAssets(){}'}));}}]});
const bundlesBuild=await build({stdin:{contents:"export {requestedBodySceneBundles} from './app/body-scene';",loader:'tsx',resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',write:false,loader:{'.css':'empty'}});
const bundleModule={exports:{}};
runInNewContext(bundlesBuild.outputFiles[0].text,{module:bundleModule,exports:bundleModule.exports,require});

function hooks(){
  const slots=[],effects=[],timers=new Map(),listeners=new Map();let cursor=0,dirty=false,serial=0,mounted=true;
  const changed=(old,next)=>!old||!next||old.length!==next.length||old.some((value,index)=>!Object.is(value,next[index]));
  const shim={...React,
    useContext(){return window.__modeContext;},useId(){return 'tour-speed-test';},
    useState(initial){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return [slots[index],value=>{if(!mounted)return;const next=typeof value==='function'?value(slots[index]):value;if(!Object.is(next,slots[index])){slots[index]=next;dirty=true;}}];},
    useRef(initial){return slots[cursor++]??={current:initial};},
    useMemo(fn,deps){const index=cursor++;if(changed(slots[index]?.deps,deps))slots[index]={deps,value:fn()};return slots[index].value;},
    useCallback(fn,deps){return shim.useMemo(()=>fn,deps);},
    useReducer(reducer,initial,init){const [state,set]=shim.useState(()=>init?init(initial):initial);return [state,action=>set(value=>reducer(value,action))];},
    useEffect(fn,deps){const index=cursor++;if(changed(slots[index]?.deps,deps))effects.push(()=>{slots[index]?.cleanup?.();slots[index]={deps,cleanup:fn()};});},
    useLayoutEffect(fn,deps){shim.useEffect(fn,deps);},
  };
  const preference={matches:false,addEventListener(_name,fn){listeners.set('motion',fn);},removeEventListener(){listeners.delete('motion');}};
  const document={hidden:false,modelContext:{registerTool(){}},addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);}};
  const window={__workspace:{mode:'explore',chooseMode(mode){this.mode=mode;}},matchMedia:()=>preference,
    setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},
    addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);}};
  function render(component,props){let tree;for(let count=0;count<20;count++){cursor=0;dirty=false;effects.length=0;tree=component(props);for(const effect of effects)effect();if(!dirty)return tree;}assert.fail('Tour host did not settle');}
  function unmount(){for(const slot of slots)slot?.cleanup?.();mounted=false;}
  return {shim,window,document,preference,timers,listeners,render,unmount};
}

function shoulder(){
  const h=hooks(),mod={exports:{}};
  runInNewContext(shoulderBuild.outputFiles[0].text,{module:mod,exports:mod.exports,structuredClone,AbortController,window:h.window,document:h.document,console,require(id){
    if(id==='react')return h.shim;if(id==='next/dynamic')return ()=>'AnatomyScene';if(id==='next/link')return 'a';if(id==='next/image')return 'img';
    if(id==='next/navigation')return {useRouter:()=>({}),useSearchParams:()=>new URLSearchParams(),usePathname:()=>'/shoulder'};return require(id);
  }});
  let tree;const render=()=>tree=h.render(mod.exports.ShoulderExplorer,{connectedReviews:false});
  const one=predicate=>{const found=nodes(tree).filter(predicate);assert.equal(found.length,1);return found[0].props;};
  const scene=()=>one(node=>node.type==='AnatomyScene');
  const player=()=>one(node=>node.type?.name==='ShoulderTourPlayer');
  const modes=()=>one(node=>node.type?.name==='WorkspaceModes');
  render();return {...h,api:mod.exports,render,scene,player,start(){scene().onRendererHealth('ready');scene().onModelReady(true);render();h.window.__modeContext={mode:h.window.__workspace.mode,exam:false,chooseMode:mode=>h.window.__workspace.chooseMode(mode),setPanelOpen(){}};mod.exports.WorkspaceModes({guidedLearning:modes().guidedLearning}).props.onValueChange('guided-learning');render();player().onPlayFullTour();render();}};
}

function specimen(){
  const h=hooks(),mod={exports:{}};
  runInNewContext(specimenBuild.outputFiles[0].text,{module:mod,exports:mod.exports,structuredClone,window:h.window,document:h.document,require(id){return id==='react'?h.shim:require(id);}});
  const specimen=mod.exports.hraPelvisDefinition,props={specimen,supplement:mod.exports.createHraPelvisSupplement()};let tree;
  const render=()=>tree=h.render(mod.exports.KneeSpecimenView,props);
  const one=predicate=>{const found=nodes(tree).filter(predicate);assert.equal(found.length,1);return found[0].props;};
  const scene=()=>one(node=>node.type?.name==='BodyScene');
  const button=name=>one(node=>typeof node.props?.onClick==='function'&&label(node)===name);
  const speed=()=>one(node=>node.type?.name==='TourSpeedControl');
  render();return {...h,api:mod.exports,render,scene,button,speed,start(){scene().onRendererHealth('ready');const displayed=scene().structures.filter(surface=>!scene().hiddenIds.includes(surface.id));for(const bundle of bundleModule.exports.requestedBodySceneBundles(specimen.catalog,displayed,scene().structures,scene().loadBundleIds))scene().onLoaded(bundle.id);render();assert.equal(button('Play full tour').disabled,false);button('Play full tour').onClick();render();}};
}

test('shoulder live speed restarts the same continuous stop and retires stale timer',()=>{
  const h=shoulder();h.start();assert.equal(h.player().index,0);assert.equal(h.player().rate,1);
  const stale=[...h.timers.values()][0].fn;
  h.player().onRateChange(2);stale();h.render();
  assert.equal(h.player().index,0);assert.equal(h.player().playing,true);assert.equal(h.player().rate,2);
  assert.equal([...h.timers.values()][0].delay,h.api.guidedPlaybackDuration(h.api.shoulderTour.steps[0].caption,h.api.shoulderTour.steps[0].durationMs,2));
  assert.equal(h.scene().transitionMs,h.api.guidedSweepDuration(2));
  h.player().onRateChange('2');h.render();assert.equal(h.player().rate,2,'string rate rejected');
  h.player().onPlayPause();h.render();assert.equal(h.timers.size,0);
  h.player().onRateChange(0.5);h.render();assert.equal(h.player().playing,false);assert.equal(h.timers.size,0);
  h.unmount();
});

test('specimen live speed restarts current stop while hidden and reduced-motion remain paused',()=>{
  const h=specimen();h.start();assert.equal(h.speed().rate,1);
  const stale=[...h.timers.values()][0].fn,selected=h.scene().selectedId;
  h.speed().onRateChange(3);stale();h.render();
  assert.equal(h.scene().selectedId,selected);assert.equal(h.speed().rate,3);
  const guide=h.api.createHraPelvisSupplement().guidedDissection(h.api.hraPelvisDefinition);
  assert.equal([...h.timers.values()][0].delay,h.api.guidedPlaybackDuration(guide.steps[0].caption,0,3));
  assert.equal(h.scene().transitionMs,h.api.guidedSweepDuration(3));
  h.speed().onRateChange('3');h.render();assert.equal(h.speed().rate,3,'string rate rejected');
  const queued=[...h.timers.values()][0].fn;h.document.hidden=true;h.listeners.get('visibilitychange')();h.render();
  h.speed().onRateChange(0.5);queued();h.render();assert.equal(h.timers.size,0);assert.equal(h.scene().selectedId,selected);
  h.document.hidden=false;h.preference.matches=true;h.listeners.get('motion')();h.render();
  h.speed().onRateChange(1.5);h.render();assert.equal(h.timers.size,0);
  h.unmount();
});
