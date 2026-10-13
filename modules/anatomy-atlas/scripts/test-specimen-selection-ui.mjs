import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
const built=await build({stdin:{contents:"export * from './lib/specimen-selection-channel'; export {limbDefinitions} from './lib/um-limb-studies';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {specimenTarget,specimenChannelState:state,specimenFocusAllowed:allowed,createSpecimenLoadAttempt,limbDefinitions}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const definition=limbDefinitions.knee,first=definition.surfaces[0],second=definition.surfaces.find(s=>s.id!==first.id);
for(const [scope,specimen] of Object.entries(limbDefinitions))for(const surface of specimen.surfaces){
  const resolved=specimenTarget(specimen,surface.id,'anterior');
  assert(resolved,`${scope}: ${surface.id}`);assert.equal(resolved.scope,scope);
  assert.equal(resolved.laterality,surface.laterality);
}
const current=specimenTarget(definition,first.id,'anterior'),target=specimenTarget(definition,second.id,'anterior');
assert(current&&target);
const ready={current,requested:target,view:'anterior',hiddenIds:[],loadedBundles:definition.catalog.bundles.map(b=>b.id),failedBundles:[],
  practice:false,guided:false,ready:true,pageHidden:false};
assert(allowed(definition,ready));
for(const gate of ['practice','guided','pageHidden'])assert(!allowed(definition,{...ready,[gate]:true}),gate);
assert(!allowed(definition,{...ready,ready:false}));
assert(!allowed(definition,{...ready,hiddenIds:[target.id]}));
assert(!allowed(definition,{...ready,loadedBundles:[]}));
assert(!allowed(definition,{...ready,failedBundles:[definition.surfaces.find(s=>s.id===target.id).bundle]}));
for(const changed of [{scope:'foot'},{source:'0'.repeat(64)},{revision:'0'.repeat(64)},{laterality:'left'}])
  assert(!allowed(definition,{...ready,requested:{...target,...changed}}),JSON.stringify(changed));
assert.deepEqual(state({practice:true,guided:false,ready:true,hidden:false,target:current}),{status:'blocked',reason:'practice'});
assert.deepEqual(state({practice:false,guided:true,ready:true,hidden:false,target:current}),{status:'blocked',reason:'guided'});
assert.deepEqual(state({practice:false,guided:false,ready:false,hidden:false,target:current}),{status:'blocked',reason:'unavailable'});
assert.deepEqual(state({practice:false,guided:false,ready:true,hidden:true,target:current}),{status:'blocked',reason:'unavailable'});
assert.deepEqual(state({practice:false,guided:false,ready:true,hidden:false,target:null}),{status:'empty'});
assert.deepEqual(state({practice:false,guided:false,ready:true,hidden:false,target:current}),{status:'selected',target:current});
const attempt=createSpecimenLoadAttempt();
const oldLoaded=()=>attempt.accepts(0);
assert(oldLoaded());attempt.retire();assert(!oldLoaded(),'Retry synchronously retires old callback before commit');
assert(attempt.pending());assert(!attempt.accepts(1),'New attempt remains unavailable before its commit');
attempt.commit(0);assert(attempt.pending(),'Stale layout cannot clear the new attempt');
attempt.commit(1);assert(!attempt.pending());assert(attempt.accepts(1));
attempt.retire();attempt.retire();attempt.commit(2);assert(attempt.pending(),'Superseded retry commit cannot reopen loading');
attempt.commit(3);assert(attempt.accepts(3));
// Integration assertions guard the enabled module, opt-in standalone behavior,
// committed callback boundary, camera gate, and export source proof without a GPU.
const [ui,hook,main,vite,exporter]=await Promise.all([
  'app/um-knee-study.tsx','app/specimen-selection-channel.tsx','integration/lower-limb/main.tsx',
  'integration/lower-limb/vite.config.mjs','scripts/export-lower-limb-module.mjs'].map(p=>readFile(p,'utf8')));
assert.match(ui,/selectionChannelRevision\?: string/);assert.match(ui,/useSpecimenSelectionChannel\(selectionChannelRevision/);
assert.match(ui,/pageHiddenNow\.current\|\|document\.hidden/);assert.match(ui,/transitionMs=\{\(guidance \|\| \(selectionChannelRevision && liveFocus\)\) && !reducedMotion \? 1800 : 0\}/);
assert.match(hook,/useLayoutEffect/);assert.match(hook,/current\.current=\{state,focus,available\}/);
assert.match(hook,/specimenAvailableSnapshot\(current\.current\.state,current\.current\.available\(\)\)/);
assert(ui.indexOf('loadAttempt.retire();')<ui.indexOf('retryBodyAssets(kneeCatalog.bundles.map'),
  'Retry retires old callbacks before touching the asset cache');
assert.match(ui,/if \(!loadAttempt\.accepts\(retry\)\) return;/);
assert.match(ui,/loadAttempt\.pending\(\) \|\| loadFailureNow\.current/);
assert.match(main,/selectionChannelRevision=\{__VM_SPECIMEN_SOURCE_REVISION__\}/);
assert.match(vite,/specimen-channel\.json/);assert.match(exporter,/channel\.sourceCommit!==sourceCommit/);
// Execute the real hook with only React's ref/layout lifecycle substituted.
// Speculative render effects are discarded, just as a concurrent render can be.
const hookBuild=await build({stdin:{contents:"export {useSpecimenSelectionChannel} from './app/specimen-selection-channel';",resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'layout-harness',setup(api){
    api.onResolve({filter:/^react$/},()=>({path:'react',namespace:'mock-react'}));
    api.onLoad({filter:/.*/,namespace:'mock-react'},()=>({contents:
      'export const useRef = value => globalThis.__vmHook.useRef(value); export const useLayoutEffect = (fn,deps) => globalThis.__vmHook.useLayoutEffect(fn,deps);',loader:'js'}));
  }}]});
const {useSpecimenSelectionChannel}=await import('data:text/javascript;base64,'+Buffer.from(hookBuild.outputFiles[0].text).toString('base64'));
let slots=[],cursor=0,effects=[];
globalThis.__vmHook={
  useRef(value){const i=cursor++;if(!slots[i])slots[i]={current:value};return slots[i];},
  useLayoutEffect(fn,deps){effects.push({i:cursor++,fn,deps});},
};
const render=(revision,snapshot,focus,available)=>{cursor=0;effects=[];useSpecimenSelectionChannel(revision,snapshot,focus,available);};
const commit=()=>{for(const {i,fn,deps} of effects){
  const old=slots[i];if(deps&&old?.deps&&deps.length===old.deps.length&&deps.every((v,n)=>Object.is(v,old.deps[n])))continue;
  old?.cleanup?.();slots[i]={deps,cleanup:fn()};
}effects=[];};
const unmount=()=>{for(const slot of slots)slot?.cleanup?.();slots=[];effects=[];};
const sent=[],listeners=new Set(),origin='http://127.0.0.1:3000',parent={postMessage:(message,to)=>sent.push({message,to})};
globalThis.window={parent,location:{origin},addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
const emit=(data)=>{for(const fn of listeners)fn({data,origin,source:parent});};
const revision='f'.repeat(40),secondRevision='e'.repeat(40),session='hook-session-12345678',snapshot={status:'selected',target:current};
let live=true,firstFocus=0,secondFocus=0;
render(revision,snapshot,()=>{firstFocus++;return true;},()=>live);commit();
assert.equal(listeners.size,1);assert.equal(sent.at(-1).message.type,'vm-specimen-selection-ready');
emit({type:'vm-specimen-selection-request',version:1,session});await Promise.resolve();
assert.equal(sent.at(-1).message.status,'selected');
render(revision,{status:'blocked',reason:'guided'},()=>{throw Error('Speculative handler invoked');},()=>false);
effects=[]; // abandon speculative render without committing its effects
emit({type:'vm-specimen-focus',version:1,revision,session,command:1,target:current});
assert.equal(firstFocus,1,'Uncommitted render cannot replace focus handler');
assert.equal(sent.at(-1).message.status,'accepted');
live=false;emit({type:'vm-specimen-selection-request',version:1,session});await Promise.resolve();
assert.equal(sent.at(-1).message.status,'blocked','Live failure/hide/retry guard revokes a committed selection before render');
live=true;render(revision,snapshot,()=>{secondFocus++;return true;},()=>live);commit();
emit({type:'vm-specimen-focus',version:1,revision,session,command:2,target:current});assert.equal(secondFocus,1);
render(secondRevision,snapshot,()=>{secondFocus++;return true;},()=>live);commit();
assert.equal(listeners.size,1,'Revision switch removes prior receiver');
emit({type:'vm-specimen-focus',version:1,revision,session,command:3,target:current});assert.equal(secondFocus,1);
const fresh='new-hook-session-12345678';emit({type:'vm-specimen-selection-request',version:1,session:fresh});await Promise.resolve();
emit({type:'vm-specimen-focus',version:1,revision:secondRevision,session:fresh,command:1,target:current});assert.equal(secondFocus,2);
unmount();assert.equal(listeners.size,0);const closed=sent.length;
emit({type:'vm-specimen-focus',version:1,revision:secondRevision,session:fresh,command:2,target:current});assert.equal(sent.length,closed);
render(revision,snapshot,()=>{secondFocus++;return true;},()=>live);commit();
assert.equal(listeners.size,1,'StrictMode remount starts one receiver');unmount();assert.equal(listeners.size,0);
console.log(JSON.stringify({passed:true,uiGates:true,sourceIdentity:true,committedBoundary:true,cameraAndExportBinding:true,gpuTested:false}));
