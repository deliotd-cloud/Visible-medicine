// Browser-only Navigation API harness. No account, patient or review API exists here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-traversal-browser-fixture',sourcePath='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas/lib/review-history-navigation.ts';assert(!fs.existsSync(root));fs.mkdirSync(root);
const source=read(sourcePath),ts=await import(pathToFileURL('F:/VisibleMedicine/atlas/node_modules/typescript/lib/typescript.js'));
const javascript=ts.default.transpileModule(source.toString(),{compilerOptions:{target:ts.default.ScriptTarget.ES2022,module:ts.default.ModuleKind.ESNext}}).outputText;
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Local synthetic review traversal QA</title></head><body>
<h1>Synthetic review draft</h1><p>No real reviews, accounts, permissions or medical content are loaded.</p>
<label>Test draft <textarea id="draft"></textarea></label><button id="clean">Mark synthetic draft clean</button><button id="dispose">Dispose guard</button><p id="status" role="status">Clean</p><p id="path"></p>
<script type="module">import{registerReviewHistoryNavigation}from'/guard.js';
const draft=document.querySelector('#draft'),status=document.querySelector('#status'),path=document.querySelector('#path');let dirty=false,blocked=0;
history.replaceState(null,'','/review/overview');history.pushState(null,'','/review?structure=synthetic');
const show=()=>path.textContent=location.pathname+location.search+location.hash;show();
const cleanup=registerReviewHistoryNavigation(window,()=>dirty,()=>{blocked++;status.textContent='Blocked: synthetic draft is still here';});
draft.addEventListener('input',()=>{dirty=true;status.textContent='Unsaved synthetic draft';});document.querySelector('#clean').onclick=()=>{dirty=false;status.textContent='Clean';};
document.querySelector('#dispose').onclick=()=>{cleanup();status.textContent='Guard disposed';};window.addEventListener('popstate',show);
window.qaState=()=>({dirty,blocked,draft:draft.value,status:status.textContent,path:location.pathname+location.search+location.hash,navigationApi:!!window.navigation});
</script></body></html>`;
fs.writeFileSync(root+'/fixture.html',html,{flag:'wx'});fs.writeFileSync(root+'/guard.js',javascript,{flag:'wx'});
const server=http.createServer((req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');if(req.url==='/guard.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(javascript);}else{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);}});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(3023,'127.0.0.1',resolve);});
const state={at:new Date().toISOString(),pid:process.pid,url:'http://127.0.0.1:3023/',sourcePath,sourceSha256:sha(source),scriptSha256:sha(Buffer.from(javascript)),fixtureSha256:sha(Buffer.from(html)),syntheticOnly:true,actualReviewRouteOrAccount:false,privateDataIncluded:false,ownerPreviewChanged:false};
fs.writeFileSync(root+'/SERVER.json',JSON.stringify(state,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(state));
const stop=()=>server.close(()=>process.exit(0));process.on('SIGINT',stop);process.on('SIGTERM',stop);
