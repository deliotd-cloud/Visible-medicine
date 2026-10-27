import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-coccygeus-tour-native',site=stage+'/atlas',root=stage+'/browser';
assert(process.stdin.isTTY);assert(json(stage+'/checks/module-1/RESULT.json').passing);
const commit=json(stage+'/COMMITTED.json'),moduleRoot=site+'/.sites-runtime/head-neck-module';
assert(!fs.existsSync(root));fs.mkdirSync(root);
const {regionalCompanions}=await import('file:///'+site+'/integration/head-neck/companions.mjs');
const prefix='/atlas-runtime/head-neck/',allowed=new Map();
function admit(url,file){assert(!allowed.has(url),url);allowed.set(url,{file,sha256:hash(file),bytes:fs.statSync(file).size});}
function walk(dir,rel=''){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){assert(!ent.isSymbolicLink());const file=path.join(dir,ent.name),p=rel+ent.name;if(ent.isDirectory())walk(file,p+'/');else if(ent.isFile())admit(prefix+p,file);}}
walk(moduleRoot);
for(const[from,to]of regionalCompanions)if(!allowed.has(prefix+to))admit(prefix+to,site+'/'+from);
const pins=json(site+'/content/coccygeus-tour-pins.json');for(const b of pins.bundles)admit(prefix+b.url.slice(1),site+'/public'+b.url);
const mime=p=>p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html':p.endsWith('.json')?'application/json':p.endsWith('.png')?'image/png':p.endsWith('.glb')?'model/gltf-binary':'text/plain';
const requests=[];
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),item=allowed.get(url.pathname);
  if(!['GET','HEAD'].includes(req.method)||!item){requests.push({method:req.method,path:url.pathname,status:404});res.writeHead(404);res.end();return;}
  assert.equal(hash(item.file),item.sha256);requests.push({method:req.method,path:url.pathname,status:200});
  res.writeHead(200,{'Content-Type':mime(item.file),'Content-Length':item.bytes,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; worker-src 'self' blob:; frame-src 'none'; object-src 'none'"});
  if(req.method==='HEAD')res.end();else fs.createReadStream(item.file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+prefix+'index.html?region=pelvis&regionalTour=coccygeus-pelvic-landmarks&tourRevision='+pins.tourRevision+'&tourSource='+commit.head;
fs.writeFileSync(root+'/STARTED.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,url,sourceHead:commit.head,normalPreviewChanged:false,actualContainedModule:true,allowed:[...allowed].map(([url,row])=>({url,...row}))},null,2)+'\n',{flag:'wx'});
const ix=json('CURRENT_CHECKPOINT.json');assert.deepEqual(ix.activeWork.current.activeExecutionSessions,[]);ix.activeWork.current.activeExecutionSessions=[{kind:'coccygeus-tour-local-review',pid:process.pid,url,evidence:root}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(ix,null,2)+'\n');
console.log(JSON.stringify({url,pid:process.pid,sourceHead:commit.head}));process.stdin.setEncoding('utf8');
await new Promise(resolve=>{process.stdin.on('data',s=>{if(s.includes('q'))resolve();});process.stdin.once('end',resolve);process.once('SIGINT',resolve);process.stdin.resume();});
server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
process.stdin.pause();
fs.writeFileSync(root+'/REQUESTS.json',JSON.stringify(requests,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(root+'/TERMINAL.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,graceful:true,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
const end=json('CURRENT_CHECKPOINT.json');end.activeWork.current.activeExecutionSessions=end.activeWork.current.activeExecutionSessions.filter(x=>x.pid!==process.pid);fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(end,null,2)+'\n');
console.log('Owned tour review server stopped.');
