import assert from 'node:assert/strict';
import {build} from './workspace-test-build.mjs';
const built=await build({stdin:{contents:"export * from './lib/specimen-selection-channel'; export {limbDefinitions} from './lib/um-limb-studies';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const {connectSpecimenSelectionChannel:connect,specimenSelectionRequest:request,parseSpecimenFocusCommand:parse,
  specimenTarget,specimenAvailableSnapshot,limbDefinitions,SPECIMEN_SELECTION_PROTOCOL:type,SPECIMEN_FOCUS_PROTOCOL:focusType}=api;
const revision='f'.repeat(40),session='source-session-12345678',origin='http://127.0.0.1:3000';
const definition=limbDefinitions.knee,id=definition.surfaces[0].id;
const target=specimenTarget(definition,id,'anterior');
assert(target);assert.equal(target.scope,'knee');assert.equal(target.source,definition.catalog.bundles.find(b=>b.id===definition.surfaces[0].bundle).sha256);
assert.equal(target.laterality,'right-source-report');assert.equal(target.revision.length,64);
assert.equal(specimenTarget(definition,'name-only','anterior'),null);
const messages=[],listeners=new Set(),parent={postMessage:(message,to)=>messages.push({message,to})};
const win={parent,location:{origin},addEventListener:(name,fn)=>{assert.equal(name,'message');listeners.add(fn);},removeEventListener:(_,fn)=>listeners.delete(fn)};
let state={status:'selected',target},focused=0;
const channel=connect(win,revision,()=>state,t=>{assert.deepEqual(t,target);focused++;return true;});
assert.deepEqual(messages.pop(),{message:{type:type+'-ready',version:1,revision},to:origin});
const emit=(data,source=parent,where=origin)=>{for(const fn of listeners)fn({data,source,origin:where});};
const req={type:type+'-request',version:1,session};
for(const invalid of [null,{},[],{...req,session:'short'},{...req,extra:'patient'},{...req,version:2}])assert.equal(request(invalid),false);
emit(req,{});emit(req,parent,'https://foreign.invalid');await Promise.resolve();assert.equal(messages.length,0);
emit(req);await Promise.resolve();assert.deepEqual(messages.pop(),{message:{type,version:1,revision,session,sequence:1,...state},to:origin});
const command={type:focusType,version:1,revision,session,command:1,target};
for(const invalid of [{...command,url:'https://private.invalid'},{...command,command:0},{...command,target:{...target,coordinate:[1,2,3]}},
  {...command,target:{...target,source:'a'.repeat(63)}},{...command,target:{...target,laterality:'left'}},
  {...command,revision:'0'.repeat(40)}])assert.equal(parse(invalid,revision,session,0),null);
const mutable={...target},detached=parse({...command,target:mutable},revision,session,0);
assert(detached);mutable.source='0'.repeat(64);assert.deepEqual(detached.target,target,'Validated command detaches mutable event input');
emit(command,{});emit(command,parent,'https://foreign.invalid');assert.equal(focused,0);
emit(command);assert.equal(focused,1);assert.equal(messages.at(-1).message.status,'accepted');
assert.deepEqual(Object.keys(messages.at(-1).message).sort(),['command','revision','session','status','type','version']);
emit(command);assert.equal(focused,1);
state={status:'blocked',reason:'practice'};emit({...command,command:2});assert.equal(messages.at(-1).message.status,'refused');
state={status:'selected',target};emit({...command,command:2});assert.equal(focused,1,'Refused command consumed');
const next={...req,session:'new-session-12345678'};emit(next);await Promise.resolve();
const nextCount=messages.length;emit(req);await Promise.resolve();assert.equal(messages.length,nextCount,'Superseded session cannot be revived');
emit({...command,command:3});assert.equal(focused,1,'Old session rejected');
emit({...command,session:next.session});assert.equal(focused,2);
channel.close();const closed=messages.length;emit({...command,session:next.session,command:4});await Promise.resolve();
assert.equal(messages.length,closed);assert.equal(listeners.size,0);
messages.length=0;state={status:'blocked',reason:'unavailable'};
const recovering=connect(win,revision,()=>state,()=>true);emit(req);await Promise.resolve();
assert.equal(messages.at(-1).message.reason,'unavailable');
state={status:'selected',target};recovering.publish();await Promise.resolve();
assert.deepEqual(messages.at(-1).message,{type:type+'-ready',version:1,revision});
const count=messages.length;recovering.publish();await Promise.resolve();assert.equal(messages.length,count);
emit(req);await Promise.resolve();assert.equal(messages.length,count,'Retired recovery session cannot be reused');
emit(next);await Promise.resolve();assert.equal(messages.at(-1).message.sequence,1);recovering.close();
for(const invalid of ['', 'not-revision']){const c=connect(win,invalid,()=>state,()=>true);assert.equal(listeners.size,0);c.close();}
const top={...win,parent:null};top.parent=top;const c=connect(top,revision,()=>state,()=>true);assert.equal(listeners.size,0);c.close();
// The committed snapshot can still be selected in React before a renderer or
// page event commits. Parent reads must observe the live revocation immediately.
for(const gate of ['failed','hidden','retry','health']){
  messages.length=0;
  const live={failed:false,hidden:false,retry:false,health:true};
  const committed={status:'selected',target};let commands=0;
  const guarded=connect(win,revision,()=>specimenAvailableSnapshot(committed,
    live.health&&!live.failed&&!live.hidden&&!live.retry),()=>{commands++;return true;});
  emit(req);await Promise.resolve();assert.equal(messages.at(-1).message.status,'selected');
  if(gate==='health')live.health=false;else live[gate]=true;
  emit(req);await Promise.resolve();
  assert.deepEqual({status:messages.at(-1).message.status,reason:messages.at(-1).message.reason},
    {status:'blocked',reason:'unavailable'},`${gate} must revoke before next render`);
  assert(!('target' in messages.at(-1).message));
  emit(command);assert.equal(messages.at(-1).message.status,'refused');assert.equal(commands,0);
  guarded.close();assert.equal(listeners.size,0);
}
console.log(JSON.stringify({passed:true,sourceBound:true,strictEnvelope:true,originSessionReplay:true,recovery:true}));
