import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {hash} from './anterior-choroidal-source-report.mjs';
const root=resolve('../work/choroidal-context-preview-20260930'),manifest=JSON.parse(await readFile(resolve(root,'manifest.json'))),assets=new Map();
assert.equal(manifest.purpose,'source-only-choroidal-context-review');
assert.equal(manifest.reportSha256,hash((await readFile('content/choroidal-context-review.json','utf8')).replaceAll('\r\n','\n')),'Preview report stale');
assert.deepEqual(manifest.files.map(f=>f.name).sort(),['THIRD_PARTY_NOTICES.txt','app.js','index.html','scene.json']);
for(const entry of manifest.files){const bytes=await readFile(resolve(root,entry.name));assert.equal(bytes.length,entry.bytes);assert.equal(hash(bytes),entry.sha256,'Preview asset changed');assets.set('/'+entry.name,bytes);}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8'};
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1'),path=url.pathname==='/'?'/index.html':url.pathname;
 const bytes=assets.get(path);if(!['GET','HEAD'].includes(req.method)||!bytes){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':types[path.slice(path.lastIndexOf('.'))],'Content-Length':bytes.length,
  'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"});
 res.end(req.method==='HEAD'?undefined:bytes);
});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({url:`http://127.0.0.1:${server.address().port}/`,purpose:manifest.purpose,reportSha256:manifest.reportSha256})));
