import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react'),actualLink=await import('vinext/shims/link');
const built=await build({stdin:{contents:`export {EyeLayerView} from './app/eye-layers';
 export {bodyDisplayCatalog} from './lib/body-display-catalog';export {eyeLayersFor} from './lib/eye-layers';
 export {eyeLayerGuide} from './lib/eye-layer-guide';export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,
 plugins:[{name:'controlled-eye-boundaries',setup(b){
  b.onLoad({filter:/body-scene\.tsx$/},()=>({contents:'export const BodyScene=()=>null;export const retryBodyAssets=()=>{};',loader:'tsx'}));
  b.onLoad({filter:/nested-teaching\.tsx$/},()=>({contents:'export const NestedTeaching=()=>null;',loader:'tsx'}));
  b.onLoad({filter:/nested-education-link\.ts$/},()=>({contents:'export const useNestedEducationLink=options=>globalThis.education.use(options);',loader:'ts'}));
 }}]});
let slots=[],cursor=0,after=[],checks=0;
const state=value=>{const i=cursor++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;
 return [slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];};
const sameDeps=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
const memo=(fn,deps)=>{const i=cursor++;if(!sameDeps(slots[i]?.deps,deps))slots[i]={deps,value:fn()};return slots[i].value;};
const effect=(fn,deps)=>{const i=cursor++;if(!sameDeps(slots[i]?.deps,deps)){slots[i]?.cleanup?.();slots[i]={deps};after.push(()=>slots[i].cleanup=fn());}};
const shim={...React,useContext:()=>null,useState:state,useMemo:memo,useCallback:(fn,deps)=>memo(()=>fn,deps),useRef:value=>state(()=>({current:value}))[0],
 useEffect:effect,useLayoutEffect:effect,useReducer:(reduce,arg,init)=>{const[value,set]=state(()=>init?init(arg):arg);return[value,action=>set(old=>reduce(old,action))];}};
const education={options:null,published:[],use(options){this.options=options;return{adapter:null,publish:id=>this.published.push(id)};}};
const events=new Map(),preference={matches:true,addEventListener:(name,fn)=>events.set('motion:'+name,fn),removeEventListener:name=>events.delete('motion:'+name)};
const document={hidden:false,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
const timers=new Map();let timerSerial=0;
const window={matchMedia:()=>preference,
 setTimeout(fn,delay){const id=++timerSerial;timers.set(id,{fn,delay});return id;},
 clearTimeout(id){timers.delete(id);},
 addEventListener:(name,fn)=>events.set('window:'+name,fn),removeEventListener:name=>events.delete('window:'+name)};
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,
 require:id=>id==='react'?shim:id==='next/link'?{__esModule:true,...actualLink}:require(id),
 education,structuredClone,window,document});
const api=scope.exports,nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
const text=n=>typeof n==='string'||typeof n==='number'?String(n):!n?'':Array.isArray(n)?n.map(text).join(''):text(n.props?.children);
const check=(value,message)=>{checks++;assert(value,message);};
const same=(a,b,message)=>{checks++;assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),message);};
const catalog=api.bodyDisplayCatalog(api.raw),parents=catalog.structures.filter(s=>api.eyeLayersFor(s).length);
for(const parent of parents){
 slots=[];events.clear();timers.clear();preference.matches=true;document.hidden=false;education.published=[];let tree;
 const render=(extra={})=>{cursor=0;after=[];tree=api.EyeLayerView({parent,educationCatalog:catalog,...extra});after.forEach(fn=>fn());};
 const scene=()=>nodes(tree).find(n=>n.props?.onRendererHealth)?.props;
 const button=label=>nodes(tree).find(n=>n.props?.onClick&&text(n).trim()===label)?.props;
 const control=label=>nodes(tree).find(n=>n.props?.['aria-label']===label)?.props;
 const selectWith=trigger=>nodes(tree).find(n=>n.props?.onValueChange&&nodes(n).some(child=>child.props?.['aria-label']===trigger))?.props;
 const cutaway=()=>nodes(tree).find(n=>n.props?.onChange&&n.props?.value?.plane)?.props;
 const guidedPanel=()=>nodes(tree).find(n=>n.type==='details'&&n.props?.className==='eye-layer-guided-learning');
 const scopeDisclosure=()=>nodes(guidedPanel()).find(n=>n.type==='details'&&n.props?.['data-testid']==='eye-tour-limitations');
 const snapshot=()=>({selectedId:scene().selectedId,hidden:scene().hiddenIds,explode:scene().explode,
  layout:scene().layout,view:scene().view,inspection:scene().inspection,labels:scene().labels,
  origins:scene().showOrigins,isolated:scene().isolated,focus:scene().focus});
 render();render();check(button('Start eye walkthrough').disabled,'Loading denies start');
 button('Start eye walkthrough').onClick();render();check(!button('End walkthrough'),'Callback also denies loading start');
 scene().onLoaded();scene().onRendererHealth('ready');render();check(!button('Start eye walkthrough').disabled,'Loaded ready guide admitted');
 const idlePanel=guidedPanel(),idleScope=scopeDisclosure();
 idlePanel.props.onToggle({target:idleScope,currentTarget:{open:true}});render();
 check(!guidedPanel().props.open&&!button('End walkthrough'),'Reading scope does not expand or autoplay the idle guide');
 // Save a non-default manual state and a real-shaped camera snapshot.
 const preset=nodes(tree).find(n=>n.props?.onValueChange&&n.props.value==='anterior'&&nodes(n).some(child=>child.props?.id==='eye-layer-preset'));
 preset.props.onValueChange('lens');render();
 const slider=nodes(tree).find(n=>n.props?.['aria-label']==='Eye component separation');slider.props.onValueChange([37]);render();
 const before=snapshot();
 const camera={direction:[0.2672612419,0.5345224838,0.8017837257],up:[0,1,0],pan:[0.1,0.2,0],scale:1.25};
 scene().cameraCapture.current=camera;
 button('Start eye walkthrough').onClick();render();
 const guide=api.eyeLayerGuide(parent);
 for(const [index,step]of guide.steps.entries()){
  const panel=guidedPanel(),scope=scopeDisclosure();
  const notice=nodes(panel).find(n=>n.props?.['data-testid']==='eye-tour-source-scope');
  check(text(notice)==='Draft source-component teaching · not clinical approval or scan registration.','Compact source warning remains visible at every stop');
  check(scope?.props.open!==true&&nodes(scope).some(n=>n.type==='summary'&&text(n)==='Tour scope & limitations'),'Full scope starts in a closed disclosure');
  check(nodes(scope).some(n=>n.type==='p'&&text(n)===guide.limitation),'Exact eye-guide limitation retained in disclosure');
  const beforeScope=snapshot();
  panel.props.onToggle({target:scope,currentTarget:{open:false}});render();
  same(snapshot(),beforeScope,'Reading nested scope does not change active guide state');
  check(!!button('End walkthrough')&&guidedPanel().props.open,'Nested disclosure cannot end the eye guide');
  same(scene().selectedId,step.selectedId,'Exact selected child');same(scene().view,step.view,'Requested camera direction');
  same(scene().hiddenIds,scene().structures.filter(s=>!step.ids.includes(s.id)).map(s=>s.id),'Only preset source children shown');
  same(scene().explode,0,'No tissue translation');same(scene().layout,'spatial','Assembled source positions');
  check(scene().tourLocked,'Tour camera protected');check(scene().isolated,'Context surfaces faded');
  same(scene().transitionMs,0,'Reduced motion honoured');check(education.options.disabled,'Imaging sync paused for guidance');
  check(nodes(tree).some(n=>n.type==='fieldset'&&n.props.disabled&&n.props.inert),'Manual subtree disabled and inert');
  const manual=nodes(tree).find(n=>n.type==='fieldset'&&n.props.className==='eye-layer-manual-controls');
  check(manual.props.hidden===true,'Manual controls removed from guided layout');
  const teaching=nodes(tree).find(n=>n.props?.className==='eye-layer-teaching');
  check(!!teaching&&!nodes(manual).includes(teaching),'Selected teaching remains outside inert controls');
  check(text(teaching).includes(scene().structures.find(s=>s.id===step.selectedId).name),'Teaching follows exact guided child');
  check(!nodes(manual).some(n=>n.type==='summary'&&text(n)==='Source and limitations'),'Source limits remain outside inert controls');
  check(selectWith('Eye separation mechanism').disabled,'Separation select explicitly disabled');
  check(selectWith('Eye camera view').disabled,'Camera select explicitly disabled');
  check(nodes(tree).find(n=>n.props?.onValueChange&&nodes(n).some(child=>child.props?.id==='eye-layer-preset')).props.disabled,'Preset select explicitly disabled');
  check(control('Eye component separation').disabled,'Separation slider explicitly disabled');
  check(control('Show original position').disabled,'Origin switch explicitly disabled');
  for(const s of scene().structures)check(control(`Show ${s.name.toLowerCase()}`).disabled,'Layer switch explicitly disabled');
  const visible=snapshot(),reset=scene().reset,source=scene().structures[0];
  selectWith('Eye camera view').onValueChange('posterior');
  nodes(tree).find(n=>n.props?.onValueChange&&nodes(n).some(child=>child.props?.id==='eye-layer-preset')).props.onValueChange('all');
  selectWith('Eye separation mechanism').onValueChange('tray');
  control('Eye component separation').onValueChange([91]);
  control('Show original position').onCheckedChange(true);
  control(`Show ${source.name.toLowerCase()}`).onCheckedChange(false);
  cutaway().onChange({...cutaway().value,plane:'sagittal'});
  for(const label of ['Undo layers','Redo layers','Reassemble','Fade others','Frame','Labels','Frame eye']){
   check(!!button(label),`${label} callback available`);button(label).onClick();
  }
  render();same(snapshot(),visible,'Forced manual callbacks cannot mutate active guide or camera');
  same(scene().reset,reset,'Forced manual callbacks cannot reset the guide camera');
  same(education.published,[],'Forced controls never publish scan selections');
  check(text(tree).includes(step.caption),'Full caption rendered');
  same(button('Previous step').disabled,index===0,'First boundary');same(button('Next step').disabled,index===guide.steps.length-1,'Last boundary');
  const selected=scene().selectedId;scene().onSelect(scene().structures.find(s=>s.id!==selected).id);render();same(scene().selectedId,selected,'Scene selections cannot override guidance');
  same(education.published,[],'Guide changes never publish scan selections');
  if(index===0){
   preference.matches=false;events.get('motion:change')();render();same(scene().transitionMs,1800,'Smooth sweep enabled on preference change');
   document.hidden=true;events.get('visibilitychange')();render();check(scene().transitionPaused,'Hidden page pauses');
   button('Next step').onClick();render();same(scene().selectedId,selected,'Hidden callback denied');
   document.hidden=false;events.get('visibilitychange')();scene().onRendererHealth('lost');render();check(scene().transitionPaused,'Renderer loss pauses');
   button('Next step').onClick();render();same(scene().selectedId,selected,'Lost renderer callback denied');
   scene().onRendererHealth('ready');render();check(!scene().transitionPaused,'Recovered renderer resumes');
   preference.matches=true;events.get('motion:change')();render();
  }
  if(index<guide.steps.length-1){button('Next step').onClick();render();}
 }
 button('Next step').onClick();render();same(scene().selectedId,guide.steps.at(-1).selectedId,'Out-of-range callback denied');
 button('End walkthrough').onClick();render();
 same(snapshot(),before,'Manual state and history presentation restored unchanged');
 const restoredManual=nodes(tree).find(n=>n.type==='fieldset'&&n.props.className==='eye-layer-manual-controls');
 check(restoredManual.props.hidden===false&&!restoredManual.props.disabled&&!restoredManual.props.inert,'Manual controls visible and interactive after End');
 check(!selectWith('Eye camera view').disabled,'Camera control re-enabled after End');
 check(!nodes(tree).find(n=>n.props?.onValueChange&&nodes(n).some(child=>child.props?.id==='eye-layer-preset')).props.disabled,'Preset control re-enabled after End');
 check(!selectWith('Eye separation mechanism').disabled,'Separation control re-enabled after End');
 check(!control('Eye component separation').disabled,'Separation slider re-enabled after End');
 check(!control('Show original position').disabled,'Origin switch re-enabled after End');
 check(!control(`Show ${scene().structures[0].name.toLowerCase()}`).disabled,'Layer switch re-enabled after End');
 const ordinaryCut=cutaway();ordinaryCut.onChange({...ordinaryCut.value,plane:'sagittal'});render();same(scene().inspection.plane,'sagittal','Ordinary cutaway still works');
 button('Restore whole view').onClick();render();same(scene().inspection.plane,'off','Ordinary cutaway restoration still works');
 const ordinaryLayer=scene().structures.find(s=>!scene().hiddenIds.includes(s.id));check(ordinaryLayer,'Visible ordinary layer exists');
 control(`Show ${ordinaryLayer.name.toLowerCase()}`).onCheckedChange(false);render();
 check(scene().hiddenIds.includes(ordinaryLayer.id),'Ordinary layer switch still works');
 button('Undo layers').onClick();render();check(!scene().hiddenIds.includes(ordinaryLayer.id),'Ordinary Undo still works');
 nodes(tree).find(n=>n.props?.onValueChange&&nodes(n).some(child=>child.props?.id==='eye-layer-preset')).props.onValueChange('all');render();
 same(scene().hiddenIds,[],'Ordinary preset still works');
 control('Eye component separation').onValueChange([19]);render();same(scene().explode,19,'Ordinary separation still works');
 control('Show original position').onCheckedChange(true);render();check(scene().showOrigins,'Ordinary origin guide still works');
 selectWith('Eye separation mechanism').onValueChange('tray');render();same(scene().layout,'tray','Ordinary layout select still works');
 selectWith('Eye camera view').onValueChange('posterior');render();same(scene().view,'posterior','Ordinary camera select still works');
 same(scene().cameraRestore.current,camera,'Exact prior camera supplied for restoration');check(!scene().tourLocked,'Camera unlocked');
 same(scene().transitionMs,0,'Ordinary camera unchanged');check(!button('End walkthrough'),'Guide ended');
 const launch=button('Start eye walkthrough');let focused=false;launch.ref.current={focus(){focused=true;}};
 button('Start eye walkthrough').onClick();render();button('End walkthrough').onClick();render();check(focused,'Focus returns to launcher');
 // The separate full-tour launcher runs every source-bound stop with a reading hold.
 preference.matches=false;events.get('motion:change')();render();
 button('Play full tour').onClick();render();
 same(scene().transitionMs,8000,'Full tour uses slow shared camera sweep');
 check(!!button('Pause full tour')&&timers.size===1,'Full tour starts playback with one timer');
 const firstTimer=[...timers.values()][0];
 same(firstTimer.delay,guide.continuousPlayback.stepDurationsMs[0],'First caption receives shared reading duration');
 button('Pause full tour').onClick();render();
 check(scene().transitionPaused&&timers.size===0,'Pause freezes camera and clears timer');
 firstTimer.fn();render();same(scene().selectedId,guide.steps[0].selectedId,'Stale timer cannot advance');
 button('Next step').onClick();render();
 same(scene().selectedId,guide.steps[1].selectedId,'Paused manual Next changes exact stop');
 check(!scene().transitionPaused&&timers.size===0,'Paused manual Next animates camera without restarting timer');
 button('Resume full tour').onClick();render();
 for(let index=1;index<guide.steps.length;index++){
  same(scene().selectedId,guide.steps[index].selectedId,'Continuous stop keeps exact source child');
  const [id,timer]=[...timers][0];same(timer.delay,guide.continuousPlayback.stepDurationsMs[index],'Caption duration stays source-bound');
  timers.delete(id);timer.fn();render();
 }
 check(!button('Pause full tour')&&!!button('Resume full tour')&&timers.size===0,'Final stop holds without loop or exit');
 same(scene().selectedId,guide.steps.at(-1).selectedId,'Final caption remains visible');
 button('End walkthrough').onClick();render();
 button('Play full tour').onClick();render();
 const replaced=[...timers.values()][0];
 button('Next step').onClick();render();
 same(scene().selectedId,guide.steps[1].selectedId,'Manual Next keeps continuous sequence');
 replaced.fn();render();same(scene().selectedId,guide.steps[1].selectedId,'Old stop timer cannot skip manual choice');
 check(!!button('Pause full tour')&&timers.size===1,'Manual Next gets a fresh caption interval');
 document.hidden=true;events.get('visibilitychange')();render();
 check(timers.size===0&&scene().transitionPaused,'Hidden page revokes playback');
 document.hidden=false;events.get('visibilitychange')();render();
 check(timers.size===0,'Visibility return does not autoplay');
 button('Resume full tour').onClick();render();
 preference.matches=true;events.get('motion:change')();render();
 check(timers.size===0&&scene().transitionPaused,'Reduced-motion change revokes playback');
 button('End walkthrough').onClick();render();
 button('Play full tour').onClick();render();
 check(timers.size===0&&!!button('Resume full tour')&&scene().transitionMs===0,
  'Starting with reduced motion waits for explicit resume and has no sweep');
 button('Resume full tour').onClick();render();
 const failedTimer=[...timers.values()][0];
 scene().onFailure('eye-layers');render();
 check(timers.size===0&&scene().transitionPaused,'Model failure revokes continuous playback');
 failedTimer.fn();render();same(scene().selectedId,guide.steps[0].selectedId,'Queued callback after failure cannot advance');
 button('End walkthrough').onClick();render();
 scene().onLoaded();scene().onRendererHealth('ready');render();
 preference.matches=false;events.get('motion:change')();render();
 button('Play full tour').onClick();render();
 const sourceTimer=[...timers.values()][0];
 render({parent:{...parent,name:'altered parent'}});
 sourceTimer.fn();render({parent:{...parent,name:'altered parent'}});
 check(timers.size===0&&!button('End walkthrough'),'Changed source retires queued callback');
 slots=[];render();scene().onLoaded();scene().onRendererHealth('ready');render();
 button('Play full tour').onClick();render();
 const unmountedTimer=[...timers.values()][0];
 for(const slot of slots)slot?.cleanup?.();
 check(timers.size===0,'Unmount clears full-tour timer');
 unmountedTimer.fn();check(timers.size===0,'Queued callback after unmount is inert');
 // Parent or incoming selection mismatch must not start a guide.
 slots=[];render({initialSelectedId:'foreign-child'});scene().onLoaded();scene().onRendererHealth('ready');render({initialSelectedId:'foreign-child'});
 check(button('Start eye walkthrough').disabled,'Foreign incoming selection fails closed');button('Start eye walkthrough').onClick();render({initialSelectedId:'foreign-child'});check(!button('End walkthrough'));
 slots=[];render({parent:{...parent,name:'altered parent'}});check(!button('Start eye walkthrough'),'Full binding mismatch denies guide');
 slots=[];render({initialGuidedLearningExpanded:true});
 check(nodes(tree).find(n=>n.type==='details'&&n.props.className==='eye-layer-guided-learning').props.open,'Library expands the existing walkthrough disclosure');
 check(!button('End walkthrough')&&button('Start eye walkthrough').disabled,'Expanded disclosure does not autoplay or bypass readiness');
 slots=[];render();
 check(!nodes(tree).find(n=>n.type==='details'&&n.props.className==='eye-layer-guided-learning').props.open,'Ordinary eye study retains compact default');
}
console.log(JSON.stringify({componentChecks:checks,parents:parents.length,smoothCameraShared:true,manualStatePreserved:true,browserAcceptance:false,clinicalApproval:false}));
