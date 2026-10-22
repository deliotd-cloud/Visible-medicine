import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const sourcePath=process.argv[2];assert(path.isAbsolute(sourcePath));const source=json(sourcePath),website=source.website;
assert(website.startsWith('F:/VisibleMedicine/staging/')&&website.endsWith('/website'));
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const stage=path.dirname(sourcePath)+'/browser-specimen';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
for(const name of ['entry.jsx','mappings.jsx'])fs.copyFileSync(path.resolve('qa-linked-tour-dismiss-20261022/'+name),stage+'/'+name,fs.constants.COPYFILE_EXCL);
const require=createRequire(website+'/package.json'),esbuild=require('esbuild');
const mocked=new Set(['next/navigation','../lib/head-link-availability.ts','../lib/head-atlas-learning','../lib/head-atlas-links','../lib/lecture-tour-context','../lib/lecture-related-links','./HeadLearningBookmark']);
const built=await esbuild.build({entryPoints:[stage+'/entry.jsx'],bundle:true,write:false,outdir:stage,entryNames:'specimen',format:'esm',platform:'browser',jsx:'automatic',metafile:true,nodePaths:[website+'/node_modules'],tsconfig:website+'/tsconfig.json',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'explicit-synthetic-boundaries',setup(build){
 build.onResolve({filter:/^vm-head-tour-navigation$/},()=>({path:website+'/components/HeadAtlasLearningNavigation.tsx'}));
 build.onResolve({filter:/^vm-head-learning-css$/},()=>({path:website+'/app/atlas/head-neck-3d/head-learning.css'}));
 build.onResolve({filter:/^(next\/navigation|\.\.\/lib\/|\.\/HeadLearningBookmark$)/},args=>mocked.has(args.path)?{path:stage+'/mappings.jsx'}:null);
}}]});
const files=new Map();for(const output of built.outputFiles){const name=path.basename(output.path);assert(['specimen.js','specimen.css'].includes(name));files.set('/'+name,output.contents);fs.writeFileSync(stage+'/'+name,output.contents,{flag:'wx'});}
const html=Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Visible Medicine synthetic linked-tour QA</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/specimen.css"><style>:root{--green:#082a31}*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui;background:#f3f7f6;color:#132c32}.qa-banner{background:#ffefc9;color:#43350b;padding:10px 16px}.qa-banner label{display:block;margin-top:6px}main{max-width:1200px;margin:24px auto}.qa-stage{height:450px;margin:20px;padding:20px;border:1px solid #d4e1df;background:#fff}h1{font-size:26px}</style></head><body><div id="app"></div><script type="module" src="/specimen.js"></script></body></html>');
fs.writeFileSync(stage+'/index.html',html,{flag:'wx'});
const inputs=Object.keys(built.metafile.inputs).map(p=>{const absolute=path.resolve(p);return{path:absolute,sha256:sha(read(absolute))};});
fs.writeFileSync(stage+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),inputs,generated:[...files].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})),actualPicker:true,actualParentDelegation:true,actualLearningCss:true,realReact:true,syntheticMetadataRouterAndPracticeCallback:true,livePracticeSessionTested:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
const server=http.createServer((req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'none';script-src 'self';style-src 'self' 'unsafe-inline';connect-src 'none';base-uri 'none';frame-ancestors 'none';form-action 'none'");if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}const u=new URL(req.url,'http://127.0.0.1:3015');if(u.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}const bytes=u.pathname==='/qa-tour-picker'?html:files.get(u.pathname);if(!bytes||u.search){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.css')?'text/css':'text/html');res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);});
server.on('error',error=>{console.error(String(error));process.exitCode=1;});server.listen(3015,'127.0.0.1',()=>console.log(JSON.stringify({phase:'ready',url:'http://127.0.0.1:3015/qa-tour-picker',pid:process.pid,evidence:stage,ownerPreviewChanged:false})));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
