import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {discHash} from './disc-source-review-report.mjs';
const allowed=['index.html','app.js','scene.json','THIRD_PARTY_NOTICES.txt'];
const types={'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','scene.json':'application/json; charset=utf-8','THIRD_PARTY_NOTICES.txt':'text/plain; charset=utf-8'};
export async function discReviewServer(directory,reportSha256){
 assert(/^[a-f0-9]{64}$/.test(reportSha256),'Invalid report revision');
 const folder=resolve(directory),manifest=JSON.parse(await readFile(resolve(folder,'manifest.json'),'utf8'));
 assert.equal(manifest.purpose,'source-only-unresolved-disc-review');assert.equal(manifest.reportSha256,reportSha256);assert.equal(manifest.admissions,0);assert.equal(manifest.levelAssigned,false);
 assert.deepEqual(manifest.files.map(f=>f.name).sort(),[...allowed].sort());
 async function verified(name){const row=manifest.files.find(f=>f.name===name),bytes=await readFile(resolve(folder,name));assert.equal(bytes.length,row.bytes,'Asset bytes changed');assert.equal(discHash(bytes),row.sha256,'Asset hash changed');return bytes;}
 for(const name of allowed)await verified(name);
 const scene=JSON.parse((await verified('scene.json')).toString());assert.equal(scene.reportSha256,reportSha256);assert.equal(scene.levelAssigned,false);assert.equal(scene.admissions,0);assert.equal(scene.clinicalValidation,false);
 const server=createServer(async(req,res)=>{try{
  const host='127.0.0.1:'+server.address().port;if(req.headers.host!==host||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){res.writeHead(403).end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  if(req.headers.origin&&req.headers.origin!=='http://'+host){res.writeHead(403).end();return;}
  const url=new URL(req.url,'http://'+host),name=url.pathname==='/'?'index.html':url.pathname.slice(1);
  if(url.search||!allowed.includes(name)){res.writeHead(404).end();return;}
  const bytes=await verified(name);res.writeHead(200,{'Content-Type':types[name],'Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin',
   'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(503,{'Cache-Control':'no-store'}).end('Pinned review unavailable');}});
 await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});return server;
}
