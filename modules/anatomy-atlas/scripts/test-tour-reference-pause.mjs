/* oxlint-disable react-hooks/rules-of-hooks -- actual component event harness */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
const catalog=JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
const built=await build({stdin:{contents:"export {ShoulderTourPlayer} from './app/shoulder-tour-player'; export {shoulderTour} from './lib/shoulder-tours'; export {RegionalGuidedLearning} from './app/regional-guided-learning'; export {thoraxTour} from './lib/regional-tours'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'},plugins:[{name:'gpu-boundary',setup(api){
  api.onLoad({filter:/[\\/]app[\\/]body-scene\.tsx$/},()=>({loader:'tsx',contents:'export function BodyScene(){return null;} export function retryBodyAssets(){}'}));
}}]});
const nodes=t=>!t||typeof t!=='object'?[]:Array.isArray(t)?t.flatMap(nodes):[t,...nodes(t.props?.children)];
const text=t=>t==null?'':typeof t==='string'||typeof t==='number'?String(t):Array.isArray(t)?t.map(text).join(''):text(t.props?.children);
const plain=v=>JSON.parse(JSON.stringify(v));
function load(shim=React,extra={}){
  const mod={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,structuredClone,...extra,require(id){if(id==='react')return shim;if(id==='next/dynamic')return ()=>'BodyScene';return require(id);}});
  return mod.exports;
}

test('Shoulder references call the existing reading pause only on opening at every stop',()=>{
  const api=load();
  for(const index of api.shoulderTour.steps.keys()){
    let pauses=0,playToggles=0,steps=0,exits=0;
    const tree=api.ShoulderTourPlayer({index,playing:true,ready:true,onStart(){},onReadImaging(){pauses++;},onPlayPause(){playToggles++;},onStep(){steps++;},onExit(){exits++;}});
    const references=nodes(tree).find(n=>n.props?.className==='shoulder-tour-evidence').props;
    assert.equal(typeof references.onToggle,'function','References owns its pause handler');
    references.onToggle({currentTarget:{open:false}});assert.equal(pauses,0);
    references.onToggle({currentTarget:{open:true}});assert.equal(pauses,1);
    references.onToggle({currentTarget:{open:false}});assert.equal(pauses,1,'Closing never resumes');
    assert.equal(playToggles,0);assert.equal(steps,0);assert.equal(exits,0);
    nodes(tree).find(n=>n.props?.onClick&&text(n)==='Pause').props.onClick();
    assert.equal(playToggles,1,'Playback control remains explicit');
  }
});

function regionalHarness(compact,reduced){
  const slots=[],timers=new Map();let cursor=0,pending=[],dirty=false,tree,serial=0,exits=0;
  const changed=(old,next)=>!old||old.length!==next.length||old.some((value,i)=>!Object.is(value,next[i]));
  const shim={...React,
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;}}];},
    useRef(initial){return slots[cursor++]??={current:initial};},
    useMemo(fn,deps){const i=cursor++;if(changed(slots[i]?.deps,deps))slots[i]={deps,value:fn()};return slots[i].value;},
    useCallback(fn,deps){return shim.useMemo(()=>fn,deps);},
    useEffect(fn,deps){const i=cursor++;if(changed(slots[i]?.deps,deps))pending.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});},
  };
  const window={matchMedia:query=>({matches:query.includes('max-width')?compact:reduced,addEventListener(){},removeEventListener(){}}),setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);}};
  const document={hidden:false,addEventListener(){},removeEventListener(){}};
  const api=load(shim,{window,document}),props={catalog:api.bodyDisplayCatalog(catalog),tour:api.thoraxTour,onExit(){exits++;}};
  function render(){let rounds=0;do{dirty=false;cursor=0;pending=[];tree=api.RegionalGuidedLearning(props);for(const effect of pending)effect();assert(++rounds<15);}while(dirty);}
  const find=predicate=>{const matches=nodes(tree).filter(predicate);assert.equal(matches.length,1);return matches[0].props;};
  const scene=()=>find(n=>n.type==='BodyScene');
  const button=label=>find(n=>n.props?.onClick&&text(n)===label);
  const explanation=()=>find(n=>n.props?.className==='regional-tour-explanation');
  const references=()=>find(n=>n.type==='details'&&text(n.props.children?.[0]).startsWith('References & limits'));
  function click(label){const control=button(label);assert(!control.disabled);control.onClick();render();}
  render();
  return {render,scene,button,explanation,references,click,timers,props,exits:()=>exits,ready(){for(const id of new Set(scene().structures.map(s=>s.bundle)))scene().onLoaded(id);scene().onRendererHealth('ready');render();}};
}

test('Regional nested references pause timer and camera after Play with explanation already open',()=>{
  for(const compact of [false,true])for(const reduced of [false,true]){
    const h=regionalHarness(compact,reduced);h.ready();h.click('Start guided tour');h.click('Next');
    h.explanation().onToggle({currentTarget:{open:true}});h.render();h.click('Play');
    assert.equal(h.explanation().open,true);assert.equal(h.timers.size,1);assert.equal(h.scene().transitionPaused,false);
    const before={index:h.scene().reset,selected:h.scene().selectedId,frame:plain(h.scene().presetBounds)};
    const references=h.references();assert.equal(typeof references.onToggle,'function','Nested references owns its handler; no parent toggle bubbling');
    references.onToggle({currentTarget:{open:true}});h.render();
    assert.equal(h.timers.size,0,'Autoplay timer cleared');assert.equal(h.scene().transitionPaused,true,'Camera transition paused');
    assert.equal(h.button('Play')['aria-pressed'],false);assert.equal(h.explanation().open,true);
    assert.deepEqual({index:h.scene().reset,selected:h.scene().selectedId,frame:plain(h.scene().presetBounds)},before,'Reading retains the current stop');
    h.references().onToggle({currentTarget:{open:false}});h.render();
    assert.equal(h.timers.size,0);assert.equal(h.scene().transitionPaused,true,'Closing never resumes');
    h.click('Play');assert.equal(h.timers.size,1);assert.equal(h.scene().transitionPaused,false);assert.equal(h.scene().transitionMs,reduced?0:1800);
    h.references().onToggle({currentTarget:{open:false}});h.render();
    assert.equal(h.timers.size,1,'Closing while explicitly playing does not toggle playback');
    const [id,timer]=[...h.timers][0];h.timers.delete(id);assert.equal(timer.delay,h.props.tour.steps[before.index].durationMs);timer.fn();h.render();
    assert.equal(h.scene().reset,before.index+1,'Explicit Play resumes normal progression');
    h.click('Exit tour');assert.equal(h.exits(),1);
  }
});
