import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createServer} from 'node:http';
import {opticHash} from './optic-alternative-scene.mjs';
export async function opticPreviewServer({root,reportBytes}){
 const manifest=JSON.parse(await readFile(resolve(root,'manifest.json')));
 assert.equal(manifest.purpose,'source-only-optic-alternative-review');
 assert.equal(manifest.reportSha256,opticHash(reportBytes),'Preview report stale');
 const report=JSON.parse(reportBytes);assert.equal(report.admissions,0);assert.equal(report.clinicalValidation,false);assert.equal(report.sourceGeometryChanged,false);
 assert.deepEqual(manifest.files.map(f=>f.name).sort(),['THIRD_PARTY_NOTICES.txt','app.js','index.html','scene.json']);
 const assets=new Map();for(const file of manifest.files){const bytes=await readFile(resolve(root,file.name));assert.equal(bytes.length,file.bytes);assert.equal(opticHash(bytes),file.sha256,'Preview asset changed');assets.set('/'+file.name,bytes);}
 const scene=JSON.parse(assets.get('/scene.json'));assert.equal(scene.reportSha256,manifest.reportSha256);assert.equal(scene.purpose,manifest.purpose);assert.equal(scene.admissions,0);assert.equal(scene.clinicalValidation,false);assert.equal(scene.sourceGeometryChanged,false);
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8'};
 const server=createServer((req,res)=>{
  const host='127.0.0.1:'+server.address().port;
  if(req.headers.host!==host){res.writeHead(403);res.end();return;}
  if(!['GET','HEAD'].includes(req.method)||!req.url.startsWith('/')){res.writeHead(404);res.end();return;}
  const path=new URL(req.url,'http://'+host).pathname,bytes=assets.get(path==='/'?'/index.html':path);
  if(!bytes){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':types[extname(path==='/'?'/index.html':path)],'Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
   'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"});
  res.end(req.method==='HEAD'?undefined:bytes);
 });
 return {server,manifest};
}
