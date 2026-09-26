// Low-memory browser acceptance harness for the actual read-only page/component.
// Next Link/Image wrappers become ordinary a/img only here. Not a deployment,
// authentication test, or substitute for the integrated application route test.
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve} from 'node:path';
const root=process.cwd();
const result=await build({stdin:{contents:"import React from 'react';import{createRoot}from'react-dom/client';import Page from './app/review/candidates/skin/page';createRoot(document.getElementById('root')).render(<Page/>);",resolveDir:root,loader:'tsx'},bundle:true,write:false,outdir:'.local/skin-candidate-preview',format:'esm',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'next-wrappers-for-browser-test',setup(api){
  api.onResolve({filter:/^next\/(link|image)$/},a=>({path:a.path,namespace:'test-next'}));
  api.onLoad({filter:/.*/,namespace:'test-next'},a=>({contents:a.path==='next/link'?"import React from'react';export default function Link({children,...p}){return React.createElement('a',p,children)}":"import React from'react';export default function Image({unoptimized,...p}){return React.createElement('img',p)}",resolveDir:root}));
}}]});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).contents,css=result.outputFiles.find(f=>f.path.endsWith('.css')).contents;
const candidate=JSON.parse(await readFile('content/skin-review-candidate.json','utf8'));
const allowed=new Map([candidate.model.url,candidate.section.url,candidate.context.bundleUrl.split('?')[0],'/brand/visible-medicine-lockup-light.png'].map(p=>[p,resolve(root,'public'+p)]));
const server=createServer(async(req,res)=>{
  try{
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
    const path=new URL(req.url,'http://localhost').pathname;
    res.setHeader('Cache-Control','no-store');
    if(path==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Skin candidate · local component check</title><link rel="stylesheet" href="/test.css"><style>body{margin:0;font-family:Arial,sans-serif}</style><div id="root"></div><script type="module" src="/test.js"></script></html>');}
    if(path==='/test.js'){res.setHeader('Content-Type','text/javascript');return res.end(js);}
    if(path==='/test.css'){res.setHeader('Content-Type','text/css');return res.end(css);}
    const file=allowed.get(path);if(!file){res.writeHead(404);return res.end('Not part of this component preview');}
    const metadata=await stat(file);res.setHeader('Content-Length',metadata.size);res.setHeader('Content-Type',file.endsWith('.glb')?'model/gltf-binary':'image/png');
    if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);
  }catch{if(!res.headersSent)res.writeHead(500);res.end('Preview asset unavailable');}
});
const port=process.argv[2]===undefined?0:Number(process.argv[2]);
if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid preview port');
server.listen(port,'127.0.0.1',()=>console.log(`Component preview: http://127.0.0.1:${server.address().port}/`));
