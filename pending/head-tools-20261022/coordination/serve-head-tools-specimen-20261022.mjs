import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-tools-bound-successor',website=root+'/website',sourcePath=root+'/BUILT_SOURCE.json';
const source=json(sourcePath);assert.equal(source.code,0);assert.equal(source.website,website);
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const stage=root+'/browser-specimen-tsx';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const original=read(website+'/tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw').toString(),current=read(website+'/components/HeadAtlasViewer.tsx').toString();
assert.equal(sha(Buffer.from(original)),'a14d1d851fff12960b35ffe71e282a0f2ec00e9a9077c74e72d3ed456ad25daa');
const bindings='study,rightPanel,quizActive,playbackStep,comparisonOpen,concept,linkedCount,planes,expanded,modality,overlay,showCrosshair,selected,regionalCourse,windowing,activeId,learningPosition,comparisonButtonRef,headDisclosureKeyDown,setOverlay,setShowCrosshair,setRegionalCourse,setWindowing,initialWindow,setActiveId,setSelected,setLearningPosition,writeNavigation,changeImageLayout,toggleInlineComparison,findLinkedStructures';
function toolbar(text){const start=text.indexOf('  const toolbar=study?<>'),end=text.indexOf('  </>:undefined;',start);assert(start>=0&&end>start);return `export function Toolbar(c){const {${bindings}}=c;${text.slice(start,end+'  </>:undefined;'.length)}return toolbar;}\n`;}
const nativeStart=current.indexOf('<button type="button" onClick={onExpand}'),nativeEnd=current.indexOf('</button>',nativeStart);assert(nativeStart>0&&nativeEnd>nativeStart);
const surfaceHeading='<h2>Selected anatomy · 3D scan view</h2>',surfaceStart=current.indexOf('<button ',current.indexOf(surfaceHeading)+surfaceHeading.length),surfaceEnd=current.indexOf('</button>',surfaceStart);assert(surfaceStart>0&&surfaceEnd>surfaceStart);
const moduleCurrent=toolbar(current)+`export function PaneButton({plane,expanded,onExpand}){return ${current.slice(nativeStart,nativeEnd+9)};}\nexport function SurfaceButton({expanded,setExpanded}){return ${current.slice(surfaceStart,surfaceEnd+9)};}\n`;
const modules={'current-toolbar.tsx':moduleCurrent,'before-toolbar.tsx':toolbar(original)};
fs.copyFileSync(path.resolve('qa-head-tools-20261022/entry.jsx'),stage+'/entry.jsx',fs.constants.COPYFILE_EXCL);
for(const [name,text] of Object.entries(modules))fs.writeFileSync(stage+'/'+name,text,{flag:'wx'});
const require=createRequire(website+'/package.json'),esbuild=require('esbuild');
const built=await esbuild.build({entryPoints:[stage+'/entry.jsx'],bundle:true,write:false,outdir:stage,entryNames:'specimen',format:'esm',platform:'browser',jsx:'automatic',metafile:true,
 nodePaths:[website+'/node_modules'],tsconfig:website+'/tsconfig.json',define:{'process.env.NODE_ENV':'"production"'},
 alias:{'vm-head-disclosure-helper':website+'/lib/head-disclosure-keyboard.ts','vm-imaging-shell-css':website+'/components/imaging-atlas-shell.css','vm-head-atlas-css':website+'/components/head-atlas.css'}});
const files=new Map();for(const output of built.outputFiles){const name=path.basename(output.path);assert(['specimen.js','specimen.css'].includes(name));files.set('/'+name,output.contents);fs.writeFileSync(stage+'/'+name,output.contents,{flag:'wx'});}
const html=Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Visible Medicine synthetic image tools QA</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/specimen.css"><style>body{margin:0;font:14px/1.4 system-ui,sans-serif;background:#071210}.qa-banner{background:#ffefc9;color:#43350b;padding:6px 12px;box-sizing:border-box}.qa-banner>div{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.qa-banner label{display:flex;align-items:center;gap:5px}.anatomy-site-frame{height:calc(100dvh - 75px)!important}.topbar{color:white;padding:12px 16px;box-sizing:border-box}.qa-pane-actions{display:grid;grid-template-columns:1fr 1fr;gap:14px}.qa-pane-actions section{border:1px solid #304541;padding:10px}.qa-pane-actions h2{font-size:14px}</style></head><body><div id="app"></div><script type="module" src="/specimen.js"></script></body></html>');
files.set('/',html);fs.writeFileSync(stage+'/index.html',html,{flag:'wx'});
const inputs=Object.keys(built.metafile.inputs).map(p=>{const absolute=path.resolve(p);return{path:absolute,sha256:sha(read(absolute))};});
fs.writeFileSync(stage+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),inputs,
 generated:[...files].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})),actualToolbarJsx:true,actualPaneButtonJsx:true,actualCss:true,actualDisclosureHelper:true,realReact:true,
 syntheticDataOnly:true,nativeScanWorkflowTested:false,clinicalApproval:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
const server=http.createServer((req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'none';script-src 'self';style-src 'self' 'unsafe-inline';connect-src 'none';base-uri 'none';frame-ancestors 'none';form-action 'none'");
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 const url=new URL(req.url,'http://127.0.0.1:3013');if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}const bytes=files.get(url.pathname);
 if(!bytes||url.search){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html');res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
});
server.on('error',error=>{console.error(String(error));process.exitCode=1;});server.listen(3013,'127.0.0.1',()=>console.log(JSON.stringify({phase:'ready',url:'http://127.0.0.1:3013/',pid:process.pid,evidence:stage,ownerPreviewChanged:false})));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
