import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const stage='F:/VisibleMedicine/staging/20261025-head-search-core-order-built-preview';
const site='F:/VisibleMedicine/staging/20261025-head-search-core-order-website/website';
const WebSocket=createRequire(site+'/package.json')('ws');
let targets;
for(let attempt=0;attempt<60;attempt++){
  try{targets=await(await fetch('http://127.0.0.1:49352/json/list',{signal:AbortSignal.timeout(1000)})).json();break;}
  catch{await new Promise(resolve=>setTimeout(resolve,500));}
}
assert(Array.isArray(targets)&&targets.length>0,'Owned inspector did not start');
const target=targets.find(item=>item.webSocketDebuggerUrl);
assert(target,'No owned inspector target');
const url=new URL(target.webSocketDebuggerUrl);
assert(['127.0.0.1','localhost'].includes(url.hostname));
const socket=new WebSocket(url,{origin:'http://localhost:49352'});
await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
  socket.on('unexpected-response',(_,response)=>reject(Error('Inspector handshake '+response.statusCode)));
});
let id=0,paused=0,noise=0;
const pending=new Map(),exceptions=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{
  const requestId=++id;pending.set(requestId,{resolve,reject});
  socket.send(JSON.stringify({id:requestId,method,params}));
});
socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.id){
    const request=pending.get(message.id);
    if(request){pending.delete(message.id);message.error?request.reject(Error(JSON.stringify(message.error))):request.resolve(message.result);}
  }else if(message.method==='Debugger.paused'){
    paused++;
    const description=String(message.params.data?.description??message.params.data?.value??message.params.data?.className??'').slice(0,5000);
    if(/Suspense Exception|^Promise$|^P$/.test(description))noise++;
    else if(exceptions.length<20)exceptions.push({reason:message.params.reason,description,
      frames:message.params.callFrames.slice(0,8).map(frame=>({name:frame.functionName,url:frame.url,line:frame.location.lineNumber+1}))});
    send('Debugger.resume').catch(()=>{});
  }
});
let response;
try{
  await send('Runtime.enable');
  await send('Debugger.enable');
  await send('Debugger.setPauseOnExceptions',{state:'all'});
  const request=await fetch('http://127.0.0.1:3052/search?q=Pons&kind=anatomy',{signal:AbortSignal.timeout(45000)});
  const body=await request.text();
  response={status:request.status,routeError:body.includes('This education view could not be prepared'),
    hasPonsResult:body.includes('search-result-card'),partialNotice:body.includes('Some results are temporarily unavailable.')};
}finally{
  await send('Debugger.setPauseOnExceptions',{state:'none'}).catch(()=>{});
  await send('Debugger.disable').catch(()=>{});
  socket.close();
}
const result={at:new Date().toISOString(),source:'0794f90c818a9e8fb9f885750d0fe4b1c7d4277fd1cd6299c60acd36af2c91b3',
  build:'6782a2fb14e0eb190c2bdb4b7d0b69f94a757f00a650d7084ea48b2dd1a902da',
  isolatedFreshState:true,firstRequest:true,response,paused,frameworkNoise:noise,exceptions,
  noIdentityOrHeaderCapture:true,sourceModified:false};
fs.writeFileSync(stage+'/FIRST_REQUEST.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({response,paused,frameworkNoise:noise,exceptions}));
