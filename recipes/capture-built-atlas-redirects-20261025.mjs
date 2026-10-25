import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const phase=process.argv[2];assert(['before','after'].includes(phase));
const dir='F:/VisibleMedicine/staging/20261025-atlas-canonical-redirect-'+phase;assert(!fs.existsSync(dir));
const origins='http://127.0.0.1:3047',modules=['shoulder','female-pelvis','lower-limb','head-neck'];
const checks=[];
async function capture(start){
 let url=new URL(start,origins),steps=[];
 for(let i=0;i<4;i++){
  assert.equal(url.origin,origins);const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});
  const step={requested:url.href,status:r.status,location:r.headers.get('location'),csp:r.headers.get('content-security-policy')};steps.push(step);await r.body?.cancel();
  if(r.status>=300&&r.status<400&&step.location){url=new URL(step.location,url);continue;}
  return {start,steps,final:step};
 }throw Error('Unexpected redirect depth');
}
for(const module of modules){const r=await capture('/atlas-runtime/'+module+'/index.html?vmRedirectCheck=1');checks.push(r);assert.equal(r.final.status,200);assert.equal(new URL(r.final.requested).pathname,'/atlas-runtime/'+module+'/');
 assert.equal(r.final.csp.includes("'wasm-unsafe-eval'"),phase==='after',module+' final document policy');assert(!r.final.csp.includes("'unsafe-eval'"),'No JavaScript eval');}
const defaults=[];
for(const p of ['/atlas/3d','/atlas-runtime/head-neck/models/bodyparts3d/full-body/head-neck-skeleton.glb']){const r=await capture(p);defaults.push(r);assert(!r.final.csp?.includes("'wasm-unsafe-eval'"));if(p.endsWith('.glb'))assert.equal(r.final.status,401,'Protected model access unchanged');else assert.equal(r.final.status,200);}
const result={at:new Date().toISOString(),phase,checks,defaults,redirectAndFinalHeadersObserved:true,protectedAnonymousModel401:true,javascriptUnsafeEvalEnabled:false,privateStateCopied:false,ownerPreviewChanged:false};
fs.mkdirSync(dir);fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),phase,modules:checks.map(r=>({path:r.start,steps:r.steps.map(s=>({status:s.status,path:new URL(s.requested).pathname,wasm:s.csp?.includes("'wasm-unsafe-eval'")}))})),protectedModel401:true}));
