import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const source='F:/VisibleMedicine/staging/20261022-renal-canonical-checkout/atlas';
const {build,transform}=createRequire(join(source,'package.json'))('esbuild');
const entry=join(root,'lib/head-selection-channel.ts');
const built=await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',
  plugins:[{name:'source-helper',setup(api){api.onResolve({filter:/^\.\/head-focus-command$/},()=>({path:join(source,'lib/head-focus-command.ts')}));}}]});
const {connectHeadSelectionChannel,HEAD_SELECTION_PROTOCOL:type,createHeadSelectionState}=await import(
  'data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));

const blocked=reason=>({status:'blocked',reason});
const structureId='vm:anatomy:body:head-neck:midline:organ:pons';
const selected={status:'selected',selection:{kind:'root',id:structureId,source:'a'.repeat(64),laterality:'midline'}};
const origin='https://atlas.example',revision='f'.repeat(40);
const messages=[],listeners=new Set(),parent={postMessage:(message,target)=>messages.push({message,target})};
const win={parent,location:{origin},addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
const emit=(data,source=parent,where=origin)=>{for(const fn of listeners)fn({data,source,origin:where});};
let current=blocked('sign-in');
const channel=connectHeadSelectionChannel(win,revision,()=>current,()=>{throw Error('blocked focus called');});
const request=session=>({type:type+'-request',version:1,session});
const first='source-session-12345678',second='source-session-abcdefgh',third='source-session-ijklmnop';
const flush=()=>Promise.resolve();
emit(request(first),{},origin);emit(request(first),parent,'https://other.example');await flush();
assert.equal(messages.length,1,'only the initial ready is public before same-origin request');
emit(request(first));await flush();
assert.deepEqual(messages.at(-1),{target:origin,message:{type,version:1,revision,session:first,sequence:1,...blocked('sign-in')}});
const count=messages.length;channel.publish();await flush();assert.equal(messages.length,count,'same resource block stays retired');
current=blocked('access-denied');channel.publish();await flush();
assert.deepEqual(messages.at(-1).message,{type:type+'-ready',version:1,revision},'cause change announces fresh handshake');
const afterCause=messages.length;channel.publish();await flush();assert.equal(messages.length,afterCause,'retired session never reused');
emit(request(second));await flush();assert.deepEqual(messages.at(-1).message,{type,version:1,revision,session:second,sequence:1,...blocked('access-denied')});
current=selected;
const command={type:'vm-head-semantic-focus',version:1,revision,session:second,command:1,target:{kind:'root',id:structureId,source:'a'.repeat(64),laterality:'midline'}};
const beforeStaleFocus=messages.length;emit(command);assert.equal(messages.length,beforeStaleFocus,'retired session cannot focus after recovery');
channel.publish();await flush();assert.deepEqual(messages.at(-1).message,{type:type+'-ready',version:1,revision});
emit(request(third));await flush();assert.deepEqual(messages.at(-1).message,{type,version:1,revision,session:third,sequence:1,...selected});
channel.close();assert.equal(messages.at(-1).message.reason,'unavailable','legacy close remains generic');
assert.equal(listeners.size,0);
const state=createHeadSelectionState(()=>{});
for(const reason of ['practice','guided','unavailable','sign-in','access-denied']){
  state.root({nested:false,state:blocked(reason)});assert.deepEqual(state.current(),blocked(reason));assert.equal(state.focus(command.target),false);
}
for(const [file,loader] of [['app/body-explorer.tsx','tsx'],['app/ventricles.tsx','tsx'],['app/eye-layers.tsx','tsx']]){
  await transform(await readFile(join(root,file),'utf8'),{loader,format:'esm'});
}
const body=await readFile(join(root,'app/body-explorer.tsx'),'utf8');
assert(body.indexOf('const [failureReasons, setFailureReasons]')<body.indexOf('useHeadRootSelection('),'root failure reasons initialized before hook');
assert(body.includes('failed.includes(selected.bundle)')&&body.includes("failureReasons[selected.bundle] ?? 'unavailable'"));
assert(body.indexOf('failed.includes(selected.bundle)',body.indexOf('useHeadRootSelection('))<body.indexOf('!loaded.includes(selected.bundle)',body.indexOf('useHeadRootSelection(')),'failed selected bundle precedes generic pending');
const vents=await readFile(join(root,'app/ventricles.tsx'),'utf8');
assert(vents.includes("required.some(id=>failed.includes(id)&&failureReasons[id]==='sign-in')"),'nested cause limited to required failed bundles');
assert(vents.indexOf("health!=='ready'||(initialSelectedId!==undefined&&!initialSelection)",vents.indexOf('useHeadNestedSelection('))<vents.indexOf('hasFailed?',vents.indexOf('useHeadNestedSelection(')),'renderer and missing selection precedence');
const eye=await readFile(join(root,'app/eye-layers.tsx'),'utf8');
assert(eye.includes("failed?{status:'blocked',reason:failureReason}"),'eye uses its current failure');
assert(eye.indexOf("health!=='ready'||(!!initialSelectedId&&!initialSelection)",eye.indexOf('useHeadNestedSelection('))<eye.indexOf("failed?{status:'blocked',reason:failureReason}",eye.indexOf('useHeadNestedSelection(')),'eye readiness and missing selection precedence');
console.log(JSON.stringify({passed:true,protocol:['same-origin','session-retirement','cause-change','recovery','focus-refusal','legacy-close'],syntax:true,scope:true}));
