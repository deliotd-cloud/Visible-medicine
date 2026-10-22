// An isolated loopback QA server; the owner's preview, tabs and state stay intact.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-access-browser-qa',receipt='F:/VisibleMedicine/staging/20261022-head-model-access-candidate/SOURCE_WEBSITE_V2.json',source=json(receipt),site=source.website;
assert(!fs.existsSync(root));assert.equal(sha(read(receipt)),'f56d329c5092b59237256be431c61294a797ba272c84047b04bdaa69257012f8');
assert.equal(json('F:/VisibleMedicine/staging/20261022-head-model-access-candidate/website-verification-v2/TERMINAL.json').code,0);
for(const row of source.sourceRows)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const {loadEnv}=await import(pathToFileURL(site+'/node_modules/vite/dist/node/index.js'));
const local=loadEnv('development','F:/VisibleMedicine/website','VM_LOCAL_HEAD_');
// Reuse the existing local-only pinned input binding in process memory; do not
// copy environment secrets, scans, masks, accounts or the production database.
const allowed=Object.fromEntries(Object.entries(local).filter(([key])=>key==='VM_LOCAL_HEAD_ROOT'));
assert(typeof allowed.VM_LOCAL_HEAD_ROOT==='string'&&allowed.VM_LOCAL_HEAD_ROOT.length>0,'Existing local head binding required');
const host='127.0.0.1',port=3022;await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(port,host,()=>probe.close(resolve));});fs.mkdirSync(root);
const stream=fs.createWriteStream(root+'/server.log',{flags:'wx'}),child=spawn(process.execPath,['node_modules/vinext/dist/cli.js','dev','--host',host,'--port',String(port)],{
 cwd:site,env:{...process.env,...allowed,VM_ATLAS_SOURCE_REPO:source.atlas,VM_LOCAL_PREVIEW_STABLE:'1',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'},windowsHide:true,stdio:['ignore','pipe','pipe']});
child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
const state={at:new Date().toISOString(),pid:child.pid,launcherPid:process.pid,site,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),atlas:source.atlasHead,review:source.review,url:`http://${host}:${port}`,localPinnedHeadBinding:true,authenticationChanged:false,privateDataCopied:false,ownerPreviewChanged:false,canonicalInstalled:false,publicDeployment:false};
fs.writeFileSync(root+'/OWNED_PREVIEW.json',JSON.stringify(state,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(state));
const stop=signal=>{if(!child.killed)child.kill(signal);};process.on('SIGINT',stop);process.on('SIGTERM',stop);
const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});await new Promise(resolve=>stream.end(resolve));
fs.writeFileSync(root+'/SERVER_TERMINAL.json',JSON.stringify({...state,...outcome,at:new Date().toISOString()},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({terminal:true,...outcome,ownerPreviewChanged:false}));
