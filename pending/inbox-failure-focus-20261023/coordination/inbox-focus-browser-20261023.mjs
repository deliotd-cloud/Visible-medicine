// Disposable real-React DOM fixture, loopback only, no production identity/services.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261023-review-inbox-failure-focus',site=root+'/website',out=root+'/browser-fixture';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
if(process.argv.includes('--build')){
  assert(!fs.existsSync(out));fs.mkdirSync(out);
  const source=fs.readFileSync('inbox-focus-browser-entry-20261023.tsx','utf8').replace('__INBOX_COMPONENT__',site+'/components/ClinicalReviewInbox.tsx');
  const require=createRequire(site+'/package.json'),{build}=require('esbuild');
  await build({stdin:{contents:source,resolveDir:site,loader:'tsx'},bundle:true,write:true,outfile:out+'/fixture.js',platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},metafile:true});
  fs.writeFileSync(out+'/index.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>Synthetic inbox focus fixture</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#eef4f1;color:#102824;font:15px system-ui}.fixture-controls{padding:16px;border-bottom:2px solid #207f72}.fixture-controls h1{margin:0;font-size:22px}.fixture-controls p{max-width:100ch}select{padding:6px}*:focus-visible{outline:3px solid #0b6c5e;outline-offset:3px}</style><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script></html>',{flag:'wx'});
  const files=fs.readdirSync(out).map(name=>{const bytes=fs.readFileSync(out+'/'+name);return{name,bytes:bytes.length,sha256:sha(bytes)};});
  fs.writeFileSync(root+'/BROWSER_BUILD.json',JSON.stringify({at:new Date().toISOString(),componentSha256:sha(fs.readFileSync(site+'/components/ClinicalReviewInbox.tsx')),fixtureSourceSha256:sha(fs.readFileSync('inbox-focus-browser-entry-20261023.tsx')),files,realReactDom:true,syntheticFetchOnly:true,authenticatedAcceptance:false,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({fixture:out,files:files.length}));
}else if(process.argv.includes('--serve')){
  const build=JSON.parse(fs.readFileSync(root+'/BROWSER_BUILD.json'));
  for(const row of build.files)assert.equal(sha(fs.readFileSync(out+'/'+row.name)),row.sha256);
  const allowed=new Map(build.files.map(r=>['/'+r.name,r.name]));
  const server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://127.0.0.1:3048');
    const name=url.pathname==='/workspace/clinical-review-inbox'?'index.html':allowed.get(url.pathname);
    if(!name){response.writeHead(404).end('Fixture asset not found');return;}
    response.writeHead(200,{'Content-Type':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store'});response.end(fs.readFileSync(out+'/'+name));
  });
  server.listen(3048,'127.0.0.1',()=>console.log('Fixture ready http://127.0.0.1:3048/workspace/clinical-review-inbox'));
}else throw Error('Use --build or --serve');
