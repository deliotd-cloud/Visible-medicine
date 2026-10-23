import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-studio-session-drafts',site=stage+'/website',final=process.argv.includes('--final'),out=stage+(final?'/browser-fixture-final':'/browser-fixture'),manifest=stage+(final?'/BROWSER_BUILD_FINAL.json':'/BROWSER_BUILD.json');
const sha=b=>createHash('sha256').update(b).digest('hex');
if(process.argv.includes('--build')){
  assert(!fs.existsSync(out));fs.mkdirSync(out);
  const require=createRequire(site+'/package.json'),{build}=require('esbuild');
  const entry=fs.readFileSync('studio-session-browser-entry-20261023.tsx','utf8').replace('__STUDIO_FORMS__',site+'/components/StudioForms.tsx');
  await build({stdin:{contents:entry,resolveDir:site,loader:'tsx'},bundle:true,write:true,outfile:out+'/fixture.js',platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},alias:{'next/navigation':path.resolve('studio-session-browser-router-20261023.mjs'),'@':site}});
  fs.writeFileSync(out+'/index.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>Synthetic Studio session recovery</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:16px system-ui;background:#eef4f1;color:#102824}header,main{padding:20px;max-width:1050px;margin:auto}header{border-bottom:2px solid #147d70}h1{font-size:24px}h2{font-size:20px}button,input,textarea{font:inherit}button{padding:8px 12px;background:#087b6c;color:white;border:0;border-radius:5px;cursor:pointer}.studio-form{max-width:700px}.studio-form label{display:grid;gap:6px;margin:10px 0}.studio-form input,.studio-form textarea{padding:7px;border:1px solid #a5bdb3}.studio-form fieldset{border:0;padding:0}.studio-form small{display:block;margin:8px 0}.studio-form-message{padding:10px;background:#e1ece6;line-height:1.5}.draft-safety{color:#724819}*:focus-visible{outline:3px solid #167d6d;outline-offset:3px}</style><div id="root"></div><script type="module" src="/fixture.js"></script></html>',{flag:'wx'});
  const files=fs.readdirSync(out).map(name=>{const bytes=fs.readFileSync(out+'/'+name);return{name,bytes:bytes.length,sha256:sha(bytes)};});
  const inputs=['components/StudioForms.tsx','lib/studio-session-drafts.ts'].map(name=>({path:name,sha256:sha(fs.readFileSync(site+'/'+name))}));
  fs.writeFileSync(manifest,JSON.stringify({at:new Date().toISOString(),inputs,files,realReactDom:true,syntheticProtocolOnly:true,nativeBrowserDialogTested:false,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,files:files.length}));
}else if(process.argv.includes('--serve')){
  const proof=JSON.parse(fs.readFileSync(manifest));for(const r of proof.files)assert.equal(sha(fs.readFileSync(out+'/'+r.name)),r.sha256);
  const server=http.createServer((request,response)=>{const url=new URL(request.url,'http://127.0.0.1:3049'),name=url.pathname==='/fixture.js'?'fixture.js':['/studio','/studio/courses/new'].includes(url.pathname)?'index.html':null;if(!name){response.writeHead(404).end('Fixture only');return;}response.writeHead(200,{'Content-Type':name.endsWith('.js')?'application/javascript':'text/html','Cache-Control':'no-store'});response.end(fs.readFileSync(out+'/'+name));});
  server.listen(3049,'127.0.0.1',()=>console.log('Fixture ready http://127.0.0.1:3049/studio'));
}else throw Error('Use --build or --serve');
