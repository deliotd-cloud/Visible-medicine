import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spec,stage,json,writeNew,verifySourceBuild} from './common.mjs';

const mode=process.argv[2],s=spec(mode),dir=stage(mode);
const {site,buildSha}=verifySourceBuild();
const handle=json(dir+'/HANDLE.json');assert.equal(handle.mode,mode);
assert.equal(handle.url,`http://127.0.0.1:${s.port}`);
assert.equal(handle.build.sha256,buildSha);
assert(!fs.existsSync(dir+'/FIRST_REQUEST.json'),'One first request per isolate');
const WebSocket=createRequire(site+'/package.json')('ws');
let targets;
for(let attempt=0;attempt<60;attempt++){
  try{targets=await(await fetch(`http://127.0.0.1:${s.inspector}/json/list`,{signal:AbortSignal.timeout(1000)})).json();break;}
  catch{await new Promise(resolve=>setTimeout(resolve,500));}
}
assert(Array.isArray(targets)&&targets.length>0,'Owned inspector did not start');
const target=targets.find(item=>item.webSocketDebuggerUrl);assert(target,'No owned inspector target');
const inspectorUrl=new URL(target.webSocketDebuggerUrl);
assert(['127.0.0.1','localhost'].includes(inspectorUrl.hostname));
assert.equal(Number(inspectorUrl.port),s.inspector);
const socket=new WebSocket(inspectorUrl,{origin:`http://localhost:${s.inspector}`});
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});socket.on('unexpected-response',(_,r)=>reject(Error('Inspector handshake '+r.statusCode)));});
let id=0,paused=0,frameworkNoise=0;
const pending=new Map(),exceptions=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});socket.send(JSON.stringify({id:requestId,method,params}));});
socket.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.id){const item=pending.get(msg.id);if(item){pending.delete(msg.id);msg.error?item.reject(Error(JSON.stringify(msg.error))):item.resolve(msg.result);}return;}
  if(msg.method!=='Debugger.paused')return;
  paused++;
  const description=String(msg.params.data?.description??msg.params.data?.value??msg.params.data?.className??'').slice(0,1500);
  if(/Suspense Exception|^Promise$|^P$/.test(description))frameworkNoise++;
  else if(exceptions.length<30)exceptions.push({reason:msg.params.reason,description,frames:msg.params.callFrames.slice(0,4).map(f=>({name:f.functionName,url:f.url,line:f.location.lineNumber+1}))});
  send('Debugger.resume').catch(()=>{});
});
let response,requestError;
try{
  await send('Runtime.enable');await send('Debugger.enable');await send('Debugger.setPauseOnExceptions',{state:'all'});
  const base=`http://127.0.0.1:${s.port}`;
  const options={method:s.method,signal:AbortSignal.timeout(45000)};
  if(mode==='embed'){options.headers={'Content-Type':'application/json'};options.body=JSON.stringify({token:'invalid-token',parentOrigin:base});}
  if(mode==='pilot'){options.headers={'Content-Type':'application/json',Origin:base};options.body='{}';}
  const r=await fetch(base+s.target,options);const body=await r.text();
  response={status:r.status,bytes:Buffer.byteLength(body),contentType:r.headers.get('content-type'),
    hasSession:/"session"\s*:/.test(body),hasApplicationId:/"applicationId"\s*:|"id"\s*:/.test(body),
    serverRenderError:/This education view could not be prepared|An error occurred in the Server Components render/i.test(body),
    errorText:(()=>{try{return JSON.parse(body).error}catch{return undefined}})()};
}catch(e){requestError=String(e);}finally{
  await send('Debugger.setPauseOnExceptions',{state:'none'}).catch(()=>{});
  await send('Debugger.disable').catch(()=>{});socket.close();
}
const storageError=exceptions.some(x=>/D1_ERROR|SQLITE_ERROR|no such table|missing table/i.test(x.description));
const firstLines=exceptions.map(x=>x.description.split('\n')[0]);
const firstLineCounts=Object.fromEntries([...new Set(firstLines)].sort().map(line=>[line,firstLines.filter(x=>x===line).length]));
const expectedExceptionLine={
  embed:/^[A-Za-z_$][A-Za-z0-9_$]*: Signed launches are unavailable\.$/,
  pilot:/^[A-Za-z_$][A-Za-z0-9_$]*: Enter a valid email address\.$/,
};
const permitted=exceptions.filter(x=>!storageError && expectedExceptionLine[mode].test(x.description.split('\n')[0]));
const unexpected=exceptions.filter(x=>!permitted.includes(x));
const semantic=mode==='embed'?(response?.status===503&&response.errorText==='Signed launches are unavailable.'&&!response.hasSession):
  (response?.status===422&&response.errorText==='Enter a valid email address.'&&!response.hasApplicationId);
const passing=!requestError&&semantic&&!storageError&&unexpected.length===0;
const result={at:new Date().toISOString(),mode,source:handle.source,build:handle.build,
  firstRequest:true,freshLocalState:true,method:s.method,target:s.target,response,requestError,
  paused,frameworkNoise,exceptions,firstLineCounts,storageError,unexpectedCount:unexpected.length,
  semanticPassing:semantic,passing,noIdentityOrHeaderCapture:true};
writeNew(dir+'/FIRST_REQUEST.json',result);
console.log(JSON.stringify({mode,response,paused,frameworkNoise,storageError,unexpectedCount:unexpected.length,passing}));
if(!passing)process.exitCode=1;
