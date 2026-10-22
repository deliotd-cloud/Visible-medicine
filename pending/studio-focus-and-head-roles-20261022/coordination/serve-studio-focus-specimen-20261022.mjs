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
for(const name of ['entry.jsx','forms.jsx','next.jsx'])fs.copyFileSync(path.resolve('qa-studio-focus-20261022/'+name),stage+'/'+name,fs.constants.COPYFILE_EXCL);
const css=read(website+'/app/globals.css').toString();
const variables=css.slice(css.indexOf(':root {'),css.indexOf('\n}',css.indexOf(':root {'))+2);
const start=css.indexOf('.course-editor {'),end=css.indexOf('\n.studio-context-bar > div',start);assert(start>0&&end>start);
const scopedCss=variables+'\n'+css.slice(start,end)+'\nbody{margin:0;font:14px/1.5 system-ui;background:var(--paper);color:var(--ink)}main{max-width:1120px;margin:auto}h1{font-size:26px;padding:16px 28px}button,input,textarea{font:inherit}button{cursor:pointer}input,textarea{display:block;min-width:260px;margin:8px 0 16px;padding:8px}button{padding:8px}:focus-visible{outline:3px solid var(--teal);outline-offset:3px}.qa-banner{padding:10px;background:#ffefc9;color:#43350b}.qa-banner div{display:flex;gap:12px;margin-top:6px}';
fs.writeFileSync(stage+'/scope.css',scopedCss,{flag:'wx'});
const require=createRequire(website+'/package.json'),esbuild=require('esbuild');
const built=await esbuild.build({entryPoints:[stage+'/entry.jsx'],bundle:true,write:false,outdir:stage,entryNames:'specimen',format:'esm',platform:'browser',jsx:'automatic',metafile:true,nodePaths:[website+'/node_modules'],tsconfig:website+'/tsconfig.json',define:{'process.env.NODE_ENV':'"production"'},
 plugins:[{name:'explicit-synthetic-boundaries',setup(build){build.onResolve({filter:/^vm-studio-editor$/},()=>({path:website+'/components/StudioCourseEditor.tsx'}));build.onResolve({filter:/^next\/(link|navigation)$/},()=>({path:stage+'/next.jsx'}));build.onResolve({filter:/^\.\/StudioForms$/},args=>{assert.equal(args.importer.replaceAll('\\','/'),website+'/components/StudioCourseEditor.tsx');return{path:stage+'/forms.jsx'};});}}]});
const files=new Map();for(const output of built.outputFiles){const name=path.basename(output.path);assert(['specimen.js','specimen.css'].includes(name));files.set('/'+name,output.contents);fs.writeFileSync(stage+'/'+name,output.contents,{flag:'wx'});}
const html=Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Visible Medicine synthetic Studio focus QA</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/specimen.css"></head><body><div id="app"></div><script type="module" src="/specimen.js"></script></body></html>');
fs.writeFileSync(stage+'/index.html',html,{flag:'wx'});
const inputs=Object.keys(built.metafile.inputs).map(p=>{const absolute=path.resolve(p);return{path:absolute,sha256:sha(read(absolute))};});
fs.writeFileSync(stage+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),inputs,cssSource:{path:website+'/app/globals.css',sha256:sha(read(website+'/app/globals.css')),scope:'Exact root variables and course-editor block only; test shell/form styles are synthetic.'},generated:[...files].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})),actualComponent:true,realReact:true,syntheticFormsAndNextRouting:true,syntheticDataOnly:true,signedInEndToEndTested:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
const server=http.createServer((req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'none';script-src 'self';style-src 'self';connect-src 'none';base-uri 'none';frame-ancestors 'none';form-action 'none'");if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}const u=new URL(req.url,'http://127.0.0.1:3014');if(u.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}const bytes=u.pathname==='/studio/courses/synthetic-course'?html:files.get(u.pathname);if(!bytes||u.search&&!u.pathname.startsWith('/studio/courses/')){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.css')?'text/css':'text/html');res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);});
server.on('error',error=>{console.error(String(error));process.exitCode=1;});server.listen(3014,'127.0.0.1',()=>console.log(JSON.stringify({phase:'ready',url:'http://127.0.0.1:3014/studio/courses/synthetic-course?pane=content',pid:process.pid,evidence:stage,ownerPreviewChanged:false})));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
