import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const receipt=process.argv[2];assert(path.isAbsolute(receipt));const source=json(receipt),site=source.website,root=path.dirname(receipt),stage=root+'/browser-specimen';
assert.equal(json(root+'/native-integration/TERMINAL.json').code,0);assert.equal(json(root+'/quality-build/TERMINAL.json').code,0);
for(const row of source.sourceRows)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const require=createRequire(site+'/package.json'),entry=path.resolve('qa-head-modality-3d-20261022/entry.jsx');
const built=await require('esbuild').build({entryPoints:[entry],bundle:true,write:false,outdir:stage,entryNames:'specimen',platform:'browser',format:'esm',jsx:'automatic',metafile:true,
 nodePaths:[site+'/node_modules'],tsconfig:site+'/tsconfig.json',alias:{'vm-exact-atlas-navigation':site+'/components/AtlasWorkspaceNavigation.tsx','vm-exact-head-links':site+'/lib/head-atlas-links.ts',
 'next/link':path.resolve('qa-head-modality-3d-20261022/next-link.jsx'),'next/navigation':path.resolve('qa-head-modality-3d-20261022/next-navigation.js')},define:{'process.env.NODE_ENV':'"production"'}});
const files=new Map();for(const output of built.outputFiles){const name=path.basename(output.path);assert(['specimen.js','specimen.css'].includes(name));fs.writeFileSync(stage+'/'+name,output.contents,{flag:'wx'});files.set('/'+name,output.contents);}
assert.equal(files.size,2);
const html=Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic Atlas modality navigation QA</title><link rel="stylesheet" href="/specimen.css"><style>*{box-sizing:border-box}body{margin:0;font:16px/1.45 system-ui,sans-serif;background:#f4f7f6;color:#132e32;--imaging-teal:#006f76;--imaging-border:#bed4d1}aside{padding:.75rem 1rem;background:#ffefc9;color:#43350b}main{padding:1rem}.fixture-case{display:flex;gap:1rem;margin:1rem;align-items:center}.fixture-limit{margin:1rem;max-width:70ch}select,button{font:inherit}a:focus-visible,summary:focus-visible{outline:3px solid #00757c;outline-offset:3px}</style></head><body><div id="app"></div><script type="module" src="/specimen.js"></script></body></html>');
files.set('/specimen',html);fs.writeFileSync(stage+'/index.html',html,{flag:'wx'});
fs.writeFileSync(stage+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),
 inputs:Object.keys(built.metafile.inputs).map(p=>({path:path.resolve(p),sha256:sha(read(path.resolve(p)))})),generated:[...files].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})),
 realReact:true,realComponent:true,realMappingHelpers:true,realComponentCss:true,nextAndRouterBoundarySynthetic:true,realNavigationPrevented:true,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
const server=http.createServer((request,response)=>{
 response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
 if(request.method!=='GET'&&request.method!=='HEAD'){response.writeHead(405);response.end();return;}
 const url=new URL(request.url,'http://127.0.0.1:3018');if(url.pathname==='/favicon.ico'){response.writeHead(204);response.end();return;}
 const bytes=files.get(url.pathname);if(!bytes){response.writeHead(404);response.end();return;}
 response.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html');response.writeHead(200);response.end(request.method==='HEAD'?undefined:bytes);
});server.listen(3018,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:3018/specimen',pid:process.pid,evidence:stage})));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
