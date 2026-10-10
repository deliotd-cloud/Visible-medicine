import assert from 'node:assert/strict';
import {build} from './workspace-test-build.mjs';
const built=await build({stdin:{contents:"export * from './lib/head-selection-channel';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {createHeadSelectionState,connectHeadSelectionChannel,headSelectionRequest,HEAD_SELECTION_PROTOCOL:type}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const selected=id=>({status:'selected',selection:{kind:'root',id,source:'a'.repeat(64),laterality:'left'}});
const blocked=reason=>({status:'blocked',reason});
let changes=0;const state=createHeadSelectionState(()=>changes++),child={};
assert.deepEqual(state.current(),blocked('unavailable'));
state.root({nested:false,state:selected('root')});assert.deepEqual(state.current(),selected('root'));
state.nested(child,selected('child'));assert.deepEqual(state.current(),selected('root'),'Hidden nested view ignored');
state.root({nested:true,state:selected('root')});assert.deepEqual(state.current(),selected('child'));
for(const reason of ['practice','guided','unavailable']){
 state.root({nested:true,state:blocked(reason)});assert.deepEqual(state.current(),blocked(reason));
}
state.root({nested:true,state:selected('root')});
const other={};state.nested(other,selected('other'));assert.deepEqual(state.current(),blocked('unavailable'),'Ambiguous nested owner fails closed');
state.remove(other);state.nested(child,blocked('practice'));assert.deepEqual(state.current(),blocked('practice'));
state.remove(child);assert.deepEqual(state.current(),blocked('unavailable'));
state.root({nested:false,state:{status:'empty'}});assert.deepEqual(state.current(),{status:'empty'});
assert(changes>0);

const messages=[],listeners=new Set(),origin='http://127.0.0.1:3000';
const parent={postMessage:(message,target)=>messages.push({message,target})};
const win={parent,location:{origin},addEventListener:(name,fn)=>{assert.equal(name,'message');listeners.add(fn);},removeEventListener:(name,fn)=>listeners.delete(fn)};
const revision='f'.repeat(40),session='test-session-12345678';
const request={type:type+'-request',version:1,session};
const emit=(data,source=parent,where=origin)=>{for(const fn of listeners)fn({data,source,origin:where});};
let snapshot=selected('root');
const channel=connectHeadSelectionChannel(win,revision,()=>snapshot);
assert.deepEqual(messages.pop(),{target:origin,message:{type:type+'-ready',version:1,revision}});
assert.equal(listeners.size,1);channel.publish();await Promise.resolve();assert.equal(messages.length,0,'No unsolicited context');
for(const invalid of [null,[],{}, {...request,version:2},{...request,session:'short'},{...request,extra:'private'}, {...request,session:'x'.repeat(81)}]){
 assert.equal(headSelectionRequest(invalid),false);emit(invalid);
}
emit(request,{},origin);emit(request,parent,'https://foreign.invalid');await Promise.resolve();assert.equal(messages.length,0);
emit(request);await Promise.resolve();assert.equal(messages.length,1);
assert.deepEqual(messages[0],{target:origin,message:{type,version:1,revision,session,sequence:1,...snapshot}});
channel.publish();snapshot=blocked('practice');channel.publish();await Promise.resolve();
assert.equal(messages.length,2);assert.equal(messages[1].message.status,'blocked');assert(!('selection' in messages[1].message));
snapshot=selected('nested-return');emit(request);await Promise.resolve();assert.equal(messages.at(-1).message.sequence,3);
const newer={...request,session:'another-session-123456'};emit(newer);await Promise.resolve();assert.equal(messages.at(-1).message.sequence,1);assert.equal(messages.at(-1).message.session,newer.session);
channel.publish();channel.close();await Promise.resolve();assert.equal(messages.at(-1).message.reason,'unavailable');assert.equal(listeners.size,0);
const count=messages.length;channel.publish();channel.close();emit(request);await Promise.resolve();assert.equal(messages.length,count);
for(const invalid of ['', 'not-a-revision']){const c=connectHeadSelectionChannel(win,invalid,()=>snapshot);assert.equal(listeners.size,0);c.close();}
const top={...win};top.parent=top;const c=connectHeadSelectionChannel(top,revision,()=>snapshot);assert.equal(listeners.size,0);c.close();
// A loading failure revokes the host session. Recovery must request a fresh
// handshake rather than sending a selection the host correctly discards.
for(const recovered of [selected('recovered'),{status:'empty'},blocked('practice'),blocked('guided')]){
 messages.length=0;snapshot=blocked('unavailable');
 const recovering=connectHeadSelectionChannel(win,revision,()=>snapshot);
 emit(request);await Promise.resolve();
 assert.equal(messages.at(-1).message.reason,'unavailable');
 const readyCount=()=>messages.filter(m=>m.message.type===type+'-ready').length;
 recovering.publish();recovering.publish();await Promise.resolve();assert.equal(readyCount(),1,'Repeated unavailable does not announce readiness');
 snapshot=recovered;recovering.publish();recovering.publish();await Promise.resolve();
 assert.deepEqual(messages.at(-1),{target:origin,message:{type:type+'-ready',version:1,revision}},'Recovery announces exact revision without stale selection');
 const waiting=messages.length;recovering.publish();await Promise.resolve();assert.equal(messages.length,waiting,'No selection until a fresh request');
 emit(newer);await Promise.resolve();
 assert.deepEqual(messages.at(-1).message,{type,version:1,revision,session:newer.session,sequence:1,...recovered});
 snapshot=selected('after-gate');recovering.publish();await Promise.resolve();
 assert.equal(readyCount(),2,'Normal selection/gate changes do not reconnect');
 assert.equal(messages.at(-1).message.sequence,2);
 // Transient React cleanup is coalesced; it must not revoke healthy context.
 snapshot=blocked('unavailable');recovering.publish();snapshot=selected('final-layout');recovering.publish();await Promise.resolve();
 assert.equal(readyCount(),2);assert.equal(messages.at(-1).message.selection.id,'final-layout');
 snapshot=blocked('unavailable');recovering.publish();await Promise.resolve();
 snapshot=selected('closed-recovery');recovering.publish();recovering.close();
 const closedCount=messages.length;await Promise.resolve();assert.equal(messages.length,closedCount,'Queued recovery cannot announce readiness after close');
 assert.equal(listeners.size,0);
}
// Focus commands preserve the active owner and refuse quiz/loading/cross-owner changes.
const target={kind:'root',id:'vm:anatomy:body:head-neck:midline:organ:pons',source:'a'.repeat(64),laterality:'midline'};
const nestedTarget={...target,kind:'nested',parentId:'vm:anatomy:body:head-neck:midline:organ:brain',parentSource:'b'.repeat(64),study:'brainstem'};
let focused=0;const focusState=createHeadSelectionState(()=>{}),focusOwner={};
focusState.root({nested:false,state:{status:'empty'}},value=>{assert.equal(value,target);focused++;return true;});
assert(focusState.focus(target));assert.equal(focused,1);assert(!focusState.focus(nestedTarget));
for(const reason of ['practice','guided','unavailable']){
 focusState.root({nested:false,state:blocked(reason)},()=>{throw Error('blocked root invoked');});assert(!focusState.focus(target));
}
focusState.root({nested:true,state:{status:'empty'}},()=>{throw Error('inactive root invoked');});
focusState.nested(focusOwner,{status:'empty'},value=>{assert.equal(value,nestedTarget);focused++;return true;});
assert(focusState.focus(nestedTarget));assert(!focusState.focus(target));
for(const reason of ['practice','guided','unavailable']){focusState.nested(focusOwner,blocked(reason),()=>{throw Error('blocked child invoked');});assert(!focusState.focus(nestedTarget));}
focusState.nested(focusOwner,{status:'empty'},()=>true);focusState.nested(other,{status:'empty'},()=>true);
assert(!focusState.focus(nestedTarget),'ambiguous owner');focusState.remove(other);assert(focusState.focus(nestedTarget));
focusState.remove(focusOwner);assert(!focusState.focus(nestedTarget),'unmounted owner');
focusState.root({nested:false,state:{status:'empty'}});assert(!focusState.focus(target),'absent handler');

messages.length=0;snapshot={status:'empty'};let applied=0;
const focusChannel=connectHeadSelectionChannel(win,revision,()=>snapshot,value=>{assert.deepEqual(value,target);applied++;return true;});
const command={type:'vm-head-semantic-focus',version:1,revision,session,command:1,target};
emit(command);assert.equal(applied,0,'handshake required');emit(request);await Promise.resolve();
emit(command,{});emit(command,parent,'https://foreign.invalid');emit({...command,revision:'0'.repeat(40)});emit({...command,patient:'private'});assert.equal(applied,0);
emit(command);assert.equal(applied,1);assert.equal(messages.at(-1).message.status,'accepted');
assert.deepEqual(Object.keys(messages.at(-1).message).sort(),['command','revision','session','status','type','version']);
emit(command);assert.equal(applied,1,'replay ignored');
snapshot=blocked('practice');emit({...command,command:2});assert.equal(applied,1);assert.equal(messages.at(-1).message.status,'refused');
snapshot={status:'empty'};emit({...command,command:2});assert.equal(applied,1,'refused command cannot replay after gate clears');
emit({...command,command:3});assert.equal(applied,2);
emit(newer);emit({...command,command:4});assert.equal(applied,2,'old session rejected');
emit({...command,session:newer.session});assert.equal(applied,3,'fresh session sequence');
focusChannel.close();const afterClose=messages.length;emit({...command,session:newer.session,command:2});await Promise.resolve();
assert.equal(applied,3);assert.equal(messages.length,afterClose);assert.equal(listeners.size,0);
console.log(JSON.stringify({passed:true,rootNestedGates:true,originSourceSessionChecks:true,coalescedNoAnswerLeak:true,unmountClears:true,focusCommands:true,patientData:false}));
