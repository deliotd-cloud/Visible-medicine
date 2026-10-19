import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve,isAbsolute,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';

const directory=process.argv[2],site=fileURLToPath(new URL('../../',import.meta.url));
if(!directory||!isAbsolute(directory))throw Error('Supply an absolute disposable staging directory.');
const stage=resolve(directory),fromSite=relative(site,stage);
if(!fromSite||(!isAbsolute(fromSite)&&fromSite!=='..'&&!fromSite.startsWith('..'+sep)))throw Error('Keep synthetic evidence outside source.');
mkdirSync(stage,{recursive:true});
const require=createRequire(new URL('../../package.json',import.meta.url));
await require('esbuild').build({entryPoints:[fileURLToPath(new URL('./head-anatomy-check-fixture.tsx',import.meta.url))],outfile:resolve(stage,'fixture.js'),bundle:true,format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"','process.env':'{}'}});
const css=['imaging-atlas-shell.css','head-atlas.css'].map(file=>readFileSync(resolve(site,'components',file),'utf8')).join('\n');
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Anatomy checks — synthetic acceptance</title><link rel="stylesheet" href="/style.css"><style>*{box-sizing:border-box}body{margin:0;font:16px system-ui;background:#091512;color:#e7f2ef}header{padding:18px 24px}header h1{font-size:22px}header label{display:inline-block;margin-right:16px}header select,header button{font:inherit;padding:6px}main{display:grid;grid-template-columns:360px minmax(0,1fr);gap:24px;padding:16px}main>aside,main>section{min-width:0;height:70vh;overflow:auto;padding:14px;border:1px solid #47625d;border-radius:8px}h2{font-size:18px}</style></head><body class="imaging-workspace-page"><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>';
const bundle=readFileSync(resolve(stage,'fixture.js')),routes=new Map([['/',['text/html',html]],['/style.css',['text/css',css]],['/fixture.js',['text/javascript',bundle]]]);
const server=createServer((request,response)=>{const value=routes.get(request.url);if(request.method!=='GET'||!value){response.writeHead(404);response.end();return;}response.setHeader('Content-Type',value[0]);response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');response.end(value[1]);});
server.listen(0,'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${server.address().port}/`,sha=value=>createHash('sha256').update(value).digest('hex');
  const files=['components/HeadAnatomyCheck.tsx','components/HeadAtlasTeaching.tsx','components/HeadAtlasReferenceTeaching.tsx','lib/head-anatomy-checks.ts','lib/head-atlas-teaching.ts','components/head-atlas.css'];
  writeFileSync(resolve(stage,'fixture-receipt.json'),JSON.stringify({url,pid:process.pid,syntheticOnly:true,bundleSha256:sha(bundle),cssSha256:sha(css),sourceFiles:files.map(path=>({path,sha256:sha(readFileSync(resolve(site,path)))}))},null,2)+'\n',{flag:'wx'});
  console.log(url);
});
