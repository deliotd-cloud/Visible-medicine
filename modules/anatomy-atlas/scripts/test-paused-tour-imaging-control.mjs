/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- controlled production-component hook harness */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
let controlled=false,stateIndex=0,effectIndex=0;
const states=[],effects=[],pending=[];
const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
const shim={...React,
  useState(initial){
    if(!controlled)return React.useState(initial);
    const slot=stateIndex++;
    if(!(slot in states))states[slot]=typeof initial==='function'?initial():initial;
    return [states[slot],value=>{states[slot]=typeof value==='function'?value(states[slot]):value;}];
  },
  useEffect(fn,deps){
    if(!controlled)return React.useEffect(fn,deps);
    const slot=effectIndex++;
    if(!equal(effects[slot]?.deps,deps))pending.push({slot,fn,deps});
  },
};
const built=await build({stdin:{contents:"export {PausedTourImagingLink} from './app/paused-tour-imaging-link';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false});
const mod={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,require:id=>id==='react'?shim:require(id)});
const {PausedTourImagingLink}=mod.exports;
const nodes=value=>!value||typeof value!=='object'?[]:Array.isArray(value)?value.flatMap(nodes):[value,...nodes(value.props?.children)];
const text=value=>value==null?'':typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):text(value.props?.children);
let tree;
function render(link){
  controlled=true;stateIndex=0;effectIndex=0;pending.length=0;
  tree=PausedTourImagingLink({link});controlled=false;
  for(const {slot,fn,deps} of pending){effects[slot]?.cleanup?.();effects[slot]={deps,cleanup:fn()};}
  return tree;
}
const controls=()=>({checkbox:nodes(tree).find(n=>n.type==='input'),button:nodes(tree).find(n=>n.type==='button')});
let current={adapter:null,eligible:false,enabled:false,structureName:null,notice:'Pause the tour at a stop to link.'};
const listeners=new Set(),toggles=[];let subscriptions=0,unsubscriptions=0,sends=0;
const link={
  snapshot:()=>({...current}),
  subscribe(listener){subscriptions++;listeners.add(listener);return ()=>{unsubscriptions++;listeners.delete(listener);};},
  setEnabled(value){toggles.push(value);current={...current,enabled:value};publish();},
  send(){sends++;current={...current,notice:'Request sent to the viewer; check the viewer for its result.'};publish();return true;},
};
function publish(){for(const listener of listeners)listener();}

assert.equal(render(undefined),null,'No session renders no control');
render(link);render(link);
assert.equal(subscriptions,1,'Stable link subscribes once');
assert.equal(controls().checkbox.props.disabled,true);
assert.equal(controls().button.props.disabled,true);
assert.match(text(tree),/No imaging viewer connected/);
assert.match(text(tree),/Pause the tour/);
current={...current,adapter:{id:'viewer',label:'Didanix Education',modality:'MRI'},eligible:true,structureName:'left example'};
publish();render(link);
assert.equal(controls().checkbox.props.disabled,false);
assert.equal(controls().checkbox.props.checked,false);
assert.equal(controls().button.props.disabled,true);
assert.match(text(tree),/Connected viewer: Didanix Education/);
assert.match(text(tree),/does not mean a study is loaded/);
controls().checkbox.props.onChange({currentTarget:{checked:true}});render(link);
assert.deepEqual(toggles,[true]);
assert.equal(controls().button.props.disabled,false);
controls().button.props.onClick();render(link);
assert.equal(sends,1);
assert.match(text(tree),/Request sent to the viewer; check the viewer for its result/);
assert.doesNotMatch(text(tree),/study (?:loaded|revealed)|scan (?:loaded|revealed)/i);

// A stale enabled button handler must consult the session again.
const staleSend=controls().button.props.onClick;
current={...current,eligible:false,enabled:false,notice:'Tour is moving; pause at a stop.'};publish();
staleSend();render(link);
assert.equal(sends,1);
assert.equal(controls().checkbox.props.disabled,true);
assert.equal(controls().button.props.disabled,true);
assert.match(text(tree),/Tour is moving/);
const staleChoice=controls().checkbox.props.onChange;
staleChoice({currentTarget:{checked:true}});
assert.deepEqual(toggles,[true],'Revoked state cannot be re-enabled through stale handler');
current={...current,adapter:null,eligible:false,notice:'Viewer disconnected.'};publish();render(link);
assert.equal(controls().checkbox.props.disabled,true);
assert.equal(controls().button.props.disabled,true);

const oldLink=link,oldListeners=[...listeners];
const replacement={...link,subscribe(listener){subscriptions++;listeners.add(listener);return ()=>{unsubscriptions++;listeners.delete(listener);};}};
render(replacement);
assert.equal(unsubscriptions,1,'Changing session removes prior listener');
assert.equal(subscriptions,2);
render(undefined);
assert.equal(unsubscriptions,2,'Unmounting control removes listener');
assert.equal(listeners.size,0);
for(const listener of oldListeners)listener();
assert.equal(render(undefined),null,'Late notification cannot resurrect control');
assert.ok(oldLink);

const html=require('react-dom/server').renderToStaticMarkup(React.createElement(PausedTourImagingLink,{link:{...link,snapshot:()=>({adapter:{id:'x',label:'<img src=x onerror=alert(1)>',modality:'MRI'},eligible:false,enabled:false,structureName:null,notice:'Waiting.'})}}));
assert.match(html,/&lt;img/,'Adapter label escapes as text');
assert.doesNotMatch(html,/<img|<iframe|<canvas|https?:\/\//i);
assert.match(html,/viewer must enable its own link/);
assert.match(html,/source identity and a reference-model centre, not patient coordinates/);
assert.match(html,/No spatial alignment or scan transfer/);
assert.match(html,/Imaging cases retain separate access/);
assert.match(html,/Incoming imaging selections cannot move the tour/);
assert.match(html,/disabled=""/,'Unready SSR controls stay disabled');
console.log(JSON.stringify({passed:true,productionComponent:true,subscriptionCleanup:true,revocationGuards:true,ssrSafe:true}));
