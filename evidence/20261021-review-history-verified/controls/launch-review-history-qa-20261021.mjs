// Loopback-only synthetic browser fixture. No auth, persisted review or scans.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-review-history-candidate',p=json(stage+'/PREPARATION.json'),site=p.site;
assert.equal(sha(read(site+'/lib/clinical-review-navigation-guard.ts')),p.helperSha256);
const require=createRequire(site+'/package.json'),ts=require('typescript');
const module=ts.transpileModule(read(site+'/lib/clinical-review-navigation-guard.ts').toString(),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic review history QA</title><style>body{max-width:900px;margin:32px auto;padding:0 20px;font:16px system-ui;color:#18383d}label{display:block;margin:18px 0}textarea{display:block;width:90%;height:100px}button,select,a{font:inherit;margin:6px;padding:10px}output{display:block;padding:12px;background:#eff5f2}li{margin:8px 0}</style></head><body>
<h1>Synthetic Review history QA</h1><p>Real browser history with scripted confirmation responses. No saved reviews, patient data, authentication or production routes. This does not verify native browser-dialog behavior.</p>
<output id="support" aria-label="History support"></output><output id="route" aria-label="Current synthetic route"></output>
<label>Confirmation response<select id="answer"><option value="cancel">Cancel navigation</option><option value="allow">Allow navigation</option></select></label>
<label>Synthetic unsaved notes<textarea id="notes"></textarea></label><label><input type="checkbox" id="uncertain">Synthetic uncertain save</label>
<button id="prepare" type="button">Prepare history</button><button id="back" type="button">Back one entry</button><button id="forward" type="button">Forward one entry</button><button id="clear" type="button">Clear synthetic form</button>
<p><a href="#section">Same-page section</a><a href="/qa/destination">Open synthetic destination</a></p><output id="prompts" aria-label="Confirmation count">0</output><p id="warning" aria-live="polite"></p><h2 id="section">Actual browser events</h2><ol id="events"></ol>
<script type="module">import {registerClinicalReviewNavigationGuard} from '/guard.js';
const notes=document.querySelector('#notes'),uncertain=document.querySelector('#uncertain'),answer=document.querySelector('#answer'),prompts=document.querySelector('#prompts'),route=document.querySelector('#route'),events=document.querySelector('#events');let count=0,lastRoute=location.pathname+location.search;
document.querySelector('#support').textContent=window.navigation?'Navigation API available':'Navigation API unavailable; only click protection applies';
window.confirm=message=>{prompts.textContent=String(++count);document.querySelector('#warning').textContent=message;return answer.value==='allow';};
registerClinicalReviewNavigationGuard(document,()=>notes.value.length>0||uncertain.checked);
function update(){route.textContent=location.pathname+location.search+location.hash;}
function log(message){const item=document.createElement('li');item.textContent=message;events.append(item);}
window.navigation?.addEventListener('navigate',event=>{log(event.navigationType+' · cancelable='+event.cancelable+' · sameDocument='+event.destination.sameDocument+' · prevented='+event.defaultPrevented);});
window.addEventListener('popstate',()=>{const next=location.pathname+location.search;if(next!==lastRoute){notes.value='';uncertain.checked=false;lastRoute=next;}update();log('popstate · '+next);});window.addEventListener('hashchange',update);
document.querySelector('#prepare').onclick=()=>{if(notes.value||uncertain.checked){log('Clear synthetic form before preparing history');return;}history.replaceState({},'', '/qa/previous');history.pushState({},'', '/qa/review');history.pushState({},'', '/qa/later');lastRoute='/qa/later';history.back();};
document.querySelector('#back').onclick=()=>history.back();document.querySelector('#forward').onclick=()=>history.forward();document.querySelector('#clear').onclick=()=>{notes.value='';uncertain.checked=false;};update();
</script></body></html>`;
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://127.0.0.1').pathname;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'");if(req.method!=='GET'){res.writeHead(405);res.end();return;}if(pathname==='/guard.js'){res.setHeader('Content-Type','text/javascript');res.end(module);return;}if(['/', '/qa/previous','/qa/review','/qa/later','/qa/destination'].includes(pathname)){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);return;}res.writeHead(404);res.end();});
server.listen(0,'127.0.0.1',()=>{const port=server.address().port,receipt={at:new Date().toISOString(),pid:process.pid,url:'http://127.0.0.1:'+port+'/',port,helperSha256:p.helperSha256,loopbackOnly:true,scriptedConfirmationResponses:true,actualBrowserHistoryNotConstructedEvents:true,nativeDialogAcceptance:false,privateDataUsed:false,authBypass:false,savedReviewWrites:false};fs.writeFileSync(stage+'/HISTORY_QA_SERVER.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));});
process.stdin.setEncoding('utf8');process.stdin.on('data',data=>{if(data.trim()==='stop')server.close(()=>{process.stdin.pause();console.log('Owned synthetic history fixture stopped.');});});
