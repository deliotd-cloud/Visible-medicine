import assert from 'node:assert/strict';
import {build} from './workspace-test-build.mjs';

const built=await build({stdin:{contents:"export * from './lib/body-selection-channel'; export {BODY_FOCUS_PROTOCOL} from './lib/body-focus-command';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {BODY_SELECTION_PROTOCOL:type,BODY_FOCUS_PROTOCOL:focusType,bodyRegion,bodySelectionRequest,
  createBodySelectionState,connectBodySelectionChannel}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const revision='f'.repeat(40),source='a'.repeat(64),session='body-session-12345678';
const target=(part='leg')=>({kind:'root',id:`vm:anatomy:body:${part}:left:bone:left-femur`,source,laterality:'left'});
const selected=(part='leg')=>({status:'selected',selection:target(part)});
const blocked=reason=>({status:'blocked',reason});
assert(bodyRegion('leg')&&bodyRegion('thigh')&&!bodyRegion('head-neck')&&!bodyRegion(null));
let changed=0;const state=createBodySelectionState(()=>changed++);
assert.deepEqual(state.current(),blocked('unavailable'));
state.root(selected('thigh'),value=>{assert.deepEqual(value,target('leg'));return true;});
assert.deepEqual(state.current(),selected('thigh'));
assert(state.focus(target('leg')),'Focus may refer to a different catalog region');
for(const reason of ['practice','guided','unavailable']){
  state.root(blocked(reason),()=>{throw Error('blocked focus invoked');});
  assert.deepEqual(state.current(),blocked(reason));assert(!state.focus(target()));
}
state.root({status:'empty'},()=>true);assert(state.focus(target()));
for(const invalid of [{status:'selected',selection:{...target(),url:'private'}},
  {status:'selected',selection:{...target(),kind:'nested'}},
  {status:'selected',selection:{...target(),id:'vm:anatomy:body:head-neck:left:bone:left-femur'}},
  {status:'blocked',reason:'other'},{status:'empty',patient:'private'}]){
  state.root(invalid,()=>{throw Error('invalid state invoked');});
  assert.deepEqual(state.current(),blocked('unavailable'));assert(!state.focus(target()));
}
state.root({status:'empty'},()=>true);assert(!state.focus({...target(),coordinates:[1,2,3]}));
state.root({status:'empty'});assert(!state.focus(target()));assert(changed>0);

for(const region of ['leg','thigh']){
  const messages=[],listeners=new Set(),origin='http://127.0.0.1:3000';
  const parent={postMessage:(message,targetOrigin)=>messages.push({message,targetOrigin})};
  const win={parent,location:{origin},addEventListener:(name,fn)=>{assert.equal(name,'message');listeners.add(fn);},removeEventListener:(name,fn)=>{assert.equal(name,'message');listeners.delete(fn);}};
  const emit=(data,source=parent,where=origin)=>{for(const listener of listeners)listener({data,source,origin:where});};
  const request=(sid=session)=>({type:type+'-request',version:1,revision,region,session:sid});
  let snapshot=selected(region);
  const channel=connectBodySelectionChannel(win,revision,region,()=>snapshot);
  assert.deepEqual(messages.pop(),{targetOrigin:origin,message:{type:type+'-ready',version:1,revision,region}});
  channel.publish();await Promise.resolve();assert.equal(messages.length,0,'No unsolicited snapshot');
  for(const bad of [null,[],{}, {...request(),type:'vm-head-semantic-selection-request'},
    {...request(),version:2},{...request(),revision:'e'.repeat(40)},
    {...request(),region:region==='leg'?'thigh':'leg'},
    {...request(),session:'short'},{...request(),session:'x'.repeat(81)},
    {...request(),private:true}]){assert(!bodySelectionRequest(bad,revision,region));emit(bad);}
  emit(request(),{});emit(request(),parent,'https://foreign.invalid');
  await Promise.resolve();assert.equal(messages.length,0,'Foreign requests ignored');
  assert(bodySelectionRequest(request(),revision,region));
  emit(request());await Promise.resolve();
  assert.deepEqual(messages.at(-1),{targetOrigin:origin,message:{type,version:1,revision,region,session,sequence:1,...snapshot}});
  channel.publish();snapshot=blocked('practice');channel.publish();await Promise.resolve();
  assert.equal(messages.at(-1).message.sequence,2);assert.equal(messages.at(-1).message.reason,'practice');
  assert(!('selection' in messages.at(-1).message));
  snapshot={status:'selected',selection:{...target(region),url:'private'}};channel.publish();await Promise.resolve();
  assert.deepEqual(messages.at(-1).message,{type,version:1,revision,region,session,sequence:3,...blocked('unavailable')},'Malformed outbound state fails closed');
  snapshot=selected(region);channel.publish();await Promise.resolve();
  assert.deepEqual(messages.at(-1).message,{type:type+'-ready',version:1,revision,region},'Recovery requires a fresh request');
  const waiting=messages.length;channel.publish();await Promise.resolve();assert.equal(messages.length,waiting);
  const next='another-session-123456';emit(request(next));await Promise.resolve();
  assert.equal(messages.at(-1).message.sequence,1);assert.equal(messages.at(-1).message.session,next);
  snapshot=blocked('guided');channel.publish();await Promise.resolve();assert.equal(messages.at(-1).message.reason,'guided');
  snapshot=selected(region);channel.publish();channel.close();await Promise.resolve();
  assert.equal(messages.at(-1).message.reason,'unavailable','Synchronous close wins over queued publish');
  assert.equal(messages.at(-1).message.sequence,3);assert.equal(listeners.size,0);
  const closedCount=messages.length;channel.publish();emit(request());await Promise.resolve();assert.equal(messages.length,closedCount);
  for(const bad of ['', 'g'.repeat(40)]){
    const disabled=connectBodySelectionChannel(win,bad,region,()=>selected());assert.equal(listeners.size,0);disabled.close();
  }
  const top={...win};top.parent=top;
  const disabledTop=connectBodySelectionChannel(top,revision,region,()=>selected());assert.equal(listeners.size,0);disabledTop.close();
  const file={...win,location:{origin:'null'}};
  const disabledFile=connectBodySelectionChannel(file,revision,region,()=>selected());assert.equal(listeners.size,0);disabledFile.close();
  const invalidRegion=connectBodySelectionChannel(win,revision,'head-neck',()=>selected());assert.equal(listeners.size,0);invalidRegion.close();

  messages.length=0;snapshot={status:'empty'};let applied=0;
  const focusing=connectBodySelectionChannel(win,revision,region,()=>snapshot,value=>{assert.deepEqual(value,target('thigh'));applied++;return true;});
  const command=(number=1,sid=session)=>({type:focusType,version:1,revision,region,session:sid,command:number,target:target('thigh')});
  emit(command());assert.equal(applied,0,'Handshake required');
  emit(request());await Promise.resolve();
  for(const bad of [{...command(),type:'vm-head-semantic-focus'},
    {...command(),revision:'e'.repeat(40)},
    {...command(),region:region==='leg'?'thigh':'leg'},
    {...command(),patient:'private'},
    {...command(),target:{...target('thigh'),kind:'nested'}},
    {...command(),target:{...target('thigh'),url:'private'}}])emit(bad);
  emit(command(),{});emit(command(),parent,'https://foreign.invalid');assert.equal(applied,0);
  emit(command());assert.equal(applied,1);assert.deepEqual(messages.at(-1).message,
    {type:focusType+'-result',version:1,revision,region,session,command:1,status:'accepted'});
  emit(command());assert.equal(applied,1,'Replay ignored');
  snapshot=blocked('practice');emit(command(2));assert.equal(applied,1);assert.equal(messages.at(-1).message.status,'refused');
  snapshot={status:'empty'};emit(command(2));assert.equal(applied,1,'Refused command consumed');
  emit(command(3));assert.equal(applied,2);
  emit(request(next));emit(command(4));assert.equal(applied,2,'Old session rejected');
  emit(command(1,next));assert.equal(applied,3,'New session starts at command one');
  focusing.close();const count=messages.length;emit(command(2,next));await Promise.resolve();
  assert.equal(applied,3);assert.equal(messages.length,count);assert.equal(listeners.size,0);
}
console.log(JSON.stringify({passed:true,regions:['leg','thigh'],originParentSessionChecks:true,strictOutbound:true,unavailableRecovery:true,staleClose:true,rootFocusGates:true,privateData:false}));
