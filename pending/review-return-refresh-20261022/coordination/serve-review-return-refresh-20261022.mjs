import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const plan=json(process.argv[2]);
assert(path.isAbsolute(plan.sourceReceipt));assert.equal(sha(read(plan.sourceReceipt)),plan.sourceReceiptSha256);
const source=json(plan.sourceReceipt),website=source.website;
assert.equal(json(path.dirname(plan.sourceReceipt)+'/quality-build/TERMINAL.json').code,0);
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const specimen=plan.specimen??'browser-specimen';assert(['browser-specimen','browser-specimen-v2'].includes(specimen));
const stage=path.dirname(plan.sourceReceipt)+'/'+specimen;assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const entry=path.resolve('qa-review-return-refresh-20261022/entry.jsx');
const require=createRequire(website+'/package.json'),esbuild=require('esbuild');
const bundle=await esbuild.build({entryPoints:[entry],bundle:true,write:false,outdir:stage,entryNames:'specimen',
  platform:'browser',format:'esm',jsx:'automatic',metafile:true,nodePaths:[website+'/node_modules'],
  alias:{'vm-exact-review-inbox':website+'/components/ClinicalReviewInbox.tsx'},
  tsconfig:website+'/tsconfig.json',define:{'process.env.NODE_ENV':'"production"'}});
const files=new Map();
for(const output of bundle.outputFiles){const name=path.basename(output.path);assert(['specimen.js','specimen.css'].includes(name));
  fs.writeFileSync(stage+'/'+name,output.contents,{flag:'wx'});files.set('/'+name,output.contents);}
assert.equal(files.size,2);
const pagePath='/workspace/clinical-review-inbox';
const html=Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic Review return QA — no real decisions</title><link rel="stylesheet" href="/specimen.css"><style>*{box-sizing:border-box}body{margin:0;font:16px/1.45 system-ui,sans-serif;background:#f1f5f4}aside{padding:.7rem 1.5rem;background:#ffefc9;color:#43350b}main{padding:.25rem 1rem}</style></head><body><aside>SYNTHETIC TEST ONLY · No real reviews, decisions, identity, network or navigation. Normal website unchanged.</aside><main id="app"></main><script type="module" src="/specimen.js"></script></body></html>');
const away=Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Synthetic away tab</title></head><body><p>Owned empty test tab. No account or real worksheet.</p></body></html>');
files.set(pagePath,html);files.set('/away',away);fs.writeFileSync(stage+'/index.html',html,{flag:'wx'});
const inputs=Object.keys(bundle.metafile.inputs).map(p=>({path:path.resolve(p),sha256:sha(read(path.resolve(p)))}));
fs.writeFileSync(stage+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:plan.sourceReceipt,
  sourceReceiptSha256:plan.sourceReceiptSha256,inputs,generated:[...files].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})),
  realReact:true,realComponent:true,realComponentCss:true,syntheticRecordsOnly:true,signedInWorkflowTested:false,
  screenReaderCertification:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
const port=3016;
const server=http.createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const url=new URL(req.url,'http://127.0.0.1:'+port);if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const bytes=files.get(url.pathname);if(!bytes||url.pathname!==pagePath&&url.search){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html');
  res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
});
server.on('error',error=>{console.error(String(error));process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({phase:'ready',url:'http://127.0.0.1:'+port+pagePath,pid:process.pid,evidence:stage,ownerPreviewChanged:false})));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
