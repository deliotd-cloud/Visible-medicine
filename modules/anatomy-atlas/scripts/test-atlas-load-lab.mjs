import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.VM_PLAYWRIGHT_MODULE);
assert(process.argv[2]&&process.argv[3],'Usage: test-atlas-load-lab.mjs receipt.json new-report.json [comma-separated-modes]');
const lab=JSON.parse(await readFile(process.argv[2]));
assert.equal(lab.diagnosticOnly,true);
const modes=process.argv[4]?.split(',')??lab.endpoints.map(e=>e.mode);
assert(modes.length>0&&new Set(modes).size===modes.length);
const endpoints=modes.map(mode=>{const endpoint=lab.endpoints.find(e=>e.mode===mode);assert(endpoint,'Unknown mode: '+mode);return endpoint;});
const probe=()=>{
 const data={firstLoading:null,rendererReady:null,ready:null,failed:false};window.__vmReadyProbe=data;
 let queued=false;
 new MutationObserver(()=>{
  const scene=document.querySelector('.body-canvas .vm-scene-recovery')||document.querySelector('.vm-scene-recovery');
  if(document.querySelector('output.body-loading')&&data.firstLoading===null)data.firstLoading=performance.now();
  if(scene?.getAttribute('data-health')==='ready'&&data.rendererReady===null)data.rendererReady=performance.now();
  if(document.querySelector('.body-loading.error'))data.failed=true;
  const ready=()=>!!document.querySelector('canvas')&&scene?.getAttribute('data-health')==='ready'&&!document.querySelector('.body-loading')&&data.firstLoading!==null;
  if(!queued&&data.ready===null&&ready()){queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(ready())data.ready=performance.now();queued=false;}));}
 }).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-health','class','hidden']});
};
const settings={viewport:{width:375,height:812},deviceScaleFactor:1,isMobile:true,hasTouch:true};
const network={offline:false,latency:150,downloadThroughput:1125000,uploadThroughput:1125000};
const browser=await chromium.launch({headless:true});
const report={diagnosticOnly:true,browserVersion:browser.version(),sourceInputs:lab.inputs,settings,network,cpuSlowdown:4,definition:'Existing renderer ready + all requested groups loaded; checked across two animation frames. Not visual accuracy, field performance or clinical readiness.',runs:[]};
try{
 // Rotate order between rounds; fresh context and disabled cache each time.
 for(let round=0;round<3;round++)for(let index=0;index<endpoints.length;index++){
  const endpoint=endpoints[(index+round)%endpoints.length];
  assert.equal(new URL(endpoint.url).hostname,'127.0.0.1');
  const context=await browser.newContext(settings),page=await context.newPage();
  const client=await context.newCDPSession(page);
  await client.send('Network.enable');await client.send('Network.setCacheDisabled',{cacheDisabled:true});
  await client.send('Network.emulateNetworkConditions',network);await client.send('Emulation.setCPUThrottlingRate',{rate:4});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(probe);
  await page.goto(endpoint.url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.__vmReadyProbe?.ready==='number'&&window.__vmReadyProbe.ready>0,{},{timeout:90000});
  const result=await page.evaluate(()=>({probe:window.__vmReadyProbe,resources:performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,start:r.startTime,end:r.responseEnd,transfer:r.transferSize,encoded:r.encodedBodySize,decoded:r.decodedBodySize}))}));
  assert.equal(result.probe.failed,false);assert.equal(errors.length,0);
  const glbs=result.resources.filter(r=>r.path.endsWith('.glb'));
  assert.equal(glbs.length,11,'Default whole-body skeleton should load eleven bundles');
  for(const glb of glbs){const file=lab.files.find(f=>glb.path.endsWith('/'+f.name));assert(file);assert.equal(glb.decoded,file.bytes);}
  report.runs.push({round,mode:endpoint.mode,...result,errors});
  console.log(JSON.stringify({round,mode:endpoint.mode,readyMs:result.probe.ready,rendererMs:result.probe.rendererReady,modelTransferBytes:glbs.reduce((s,r)=>s+r.encoded,0)}));
  await context.close();
 }
 report.summary=endpoints.map(({mode})=>{
  const runs=report.runs.filter(r=>r.mode===mode),median=values=>[...values].sort((a,b)=>a-b)[1];
  return {mode,medianReadyMs:median(runs.map(r=>r.probe.ready)),medianRendererMs:median(runs.map(r=>r.probe.rendererReady)),medianModelBytes:median(runs.map(r=>r.resources.filter(x=>x.path.endsWith('.glb')).reduce((s,x)=>s+x.encoded,0)))};
 });
 console.log(JSON.stringify(report.summary));
}finally{
 await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 await browser.close();
}
