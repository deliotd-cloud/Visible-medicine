import fs from 'node:fs';import http from 'node:http';import assert from 'node:assert/strict';import {hash,json} from './bounded-source-hash-20261026.mjs';
const phase=process.argv[2];assert(/^(before|after)-[1-9][0-9]*$/.test(phase));assert(process.stdin.isTTY);
const stage='F:/VisibleMedicine/staging/20261027-head-selection-history-browser',root=stage+'/'+phase,build=json(root+'/BUILD.json');
const allowed=new Map(build.files.filter(r=>['index.html','bundle.js','bundle.css'].includes(r.path)).map(r=>[r.path,r.sha256]));
for(const [p,digest]of allowed)assert.equal(hash(root+'/'+p),digest);
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 const file=/^\/atlas\/(ct|mri)-head$/.test(pathname)?'index.html':pathname.slice(1);
 if(!allowed.has(file)){res.writeHead(404);res.end();return;}
 assert.equal(hash(root+'/'+file),allowed.get(file));
 res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; connect-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'none'; object-src 'none'"});res.end(fs.readFileSync(root+'/'+file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
const receipt={at:new Date().toISOString(),pid:process.pid,url,phase,buildSha256:hash(root+'/BUILD.json'),normalPreviewChanged:false,syntheticOnly:true};
fs.writeFileSync(root+'/STARTED.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
const i=json('CURRENT_CHECKPOINT.json');i.activeWork.current.activeExecutionSessions.push({kind:'synthetic-head-history-browser',pid:process.pid,url,phase,evidence:root});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');
console.log(JSON.stringify(receipt));process.stdin.setEncoding('utf8');
await new Promise(resolve=>{process.stdin.on('data',s=>{if(s.includes('q'))resolve()});process.stdin.once('end',resolve);process.once('SIGINT',resolve);process.stdin.resume()});
server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
for(const [p,digest]of allowed)assert.equal(hash(root+'/'+p),digest);
fs.writeFileSync(root+'/TERMINAL.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,graceful:true,sourceUnchanged:true,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
const j=json('CURRENT_CHECKPOINT.json');j.activeWork.current.activeExecutionSessions=j.activeWork.current.activeExecutionSessions.filter(x=>x.pid!==process.pid);fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(j,null,2)+'\n');
console.log('Synthetic history QA stopped.');
