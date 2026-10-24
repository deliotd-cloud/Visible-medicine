import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const dir='F:/VisibleMedicine/staging/20261024-observer-stack';
const receipt='F:/VisibleMedicine/staging/20261024-practice-actions-website/SOURCE_BOUND.json';
assert.equal(hash(receipt),'dc0532736094fcd7225e1229af3a41322aacc591789bf1179c44476b98b7077e');
const source=json(receipt),root=source.website+'/public/atlas-runtime/head-neck',manifest=json(root+'/manifest.json'),files=new Map(),requests=[],errors=[];
assert.equal(manifest.sourceCommit,source.atlasHead);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);assert(!fs.existsSync(dir));fs.mkdirSync(dir);
for(const r of manifest.files){assert.equal(hash(root+'/'+r.path),r.sha256,r.path);files.set('/atlas-runtime/head-neck/'+r.path,root+'/'+r.path);}
const instrumentation=`<script>\n(()=>{const report=value=>fetch('/__qa_error',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)}).catch(()=>{});addEventListener('error',event=>report({kind:'error',message:event.message,filename:event.filename,line:event.lineno,column:event.colno,stack:event.error?.stack??null}));addEventListener('unhandledrejection',event=>report({kind:'unhandledrejection',message:String(event.reason?.message??event.reason),stack:event.reason?.stack??null}));report({kind:'ready'});})();\n</script>`;
const original=fs.readFileSync(root+'/index.html','utf8');assert.equal(original.split('<head>').length,2);
const instrumented=original.replace('<head>','<head>'+instrumentation);assert.equal(instrumented.replace(instrumentation,''),original);
fs.writeFileSync(dir+'/instrumentation.js',instrumentation.slice(8,-9),{flag:'wx'});fs.writeFileSync(dir+'/instrumented-index.html',instrumented,{flag:'wx'});
let base;const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://qa.invalid');res.setHeader('Cache-Control','no-store');
 requests.push({at:new Date().toISOString(),method:req.method,path:url.pathname});
 if(req.method==='POST'&&url.pathname==='/__qa_error'&&req.headers.origin===base&&errors.length<30){
  let size=0,chunks=[];req.on('data',chunk=>{size+=chunk.length;if(size>16384){req.destroy();return;}chunks.push(chunk);});
  req.on('end',()=>{try{const value=JSON.parse(Buffer.concat(chunks));assert(['ready','error','unhandledrejection'].includes(value.kind));errors.push({at:new Date().toISOString(),...value});fs.writeFileSync(dir+'/ERROR_EVENTS.json',JSON.stringify(errors,null,2)+'\n');res.writeHead(204);res.end();}catch{res.writeHead(400);res.end();}});return;
 }
 const file=files.get(url.pathname);if(req.method!=='GET'||!file&&url.pathname!=='/forearm'){res.writeHead(404);res.end('Not registered');return;}
 if(url.pathname==='/forearm'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><html><head><title>Isolated Atlas exception QA</title></head><body><p>Public export diagnostic harness · owner preview unchanged</p><iframe title="Public Atlas diagnostic frame" style="width:1000px;height:580px;border:1px solid #ccc" src="/atlas-runtime/head-neck/index.html?region=forearm"></iframe></body></html>');return;}
 res.setHeader('Content-Type',({'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.txt':'text/plain'})[path.extname(file)]??'application/octet-stream');
 res.end(file===root+'/index.html'?instrumented:fs.readFileSync(file));
});
const write=(name,value)=>fs.writeFileSync(dir+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
function state(active){const p=json('CURRENT_CHECKPOINT.json');assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='observer-stack-qa');if(active)p.activeWork.current.activeExecutionSessions.push({role:'observer-stack-qa',pid:process.pid,evidence:dir,previewChanged:false});const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);}
let closing=false;function close(reason){if(closing)return;closing=true;server.close(()=>{write('REQUESTS.json',requests);write('TERMINAL.json',{at:new Date().toISOString(),pid:process.pid,reason,code:0,graceful:true,errors:errors.length,previewChanged:false});state(false);process.exit(0);});}
server.listen(0,'127.0.0.1',()=>{base='http://127.0.0.1:'+server.address().port;write('STARTED.json',{at:new Date().toISOString(),base,pid:process.pid,sourceReceipt:receipt,sourceReceiptSha256:hash(receipt),sourceCommit:source.atlasHead,manifestSha256:hash(root+'/manifest.json'),originalHtmlSha256:hash(root+'/index.html'),diagnosticHtmlSha256:hash(dir+'/instrumented-index.html'),instrumentationSha256:hash(dir+'/instrumentation.js'),htmlOnlyDiagnosticAddition:true,wholeHtmlInverseVerified:true,allManifestAssetsByteExact:true,prototypeOrObserverPatches:false,privateDataServed:false,previewChanged:false});state(true);console.log(JSON.stringify({base,pid:process.pid,quit:'q'}));});
process.stdin.setEncoding('utf8');process.stdin.on('data',value=>{if(value.trim()==='q')close('q');});process.stdin.on('end',()=>close('stdin-ended'));process.on('SIGINT',()=>close('SIGINT'));process.on('SIGTERM',()=>close('SIGTERM'));
