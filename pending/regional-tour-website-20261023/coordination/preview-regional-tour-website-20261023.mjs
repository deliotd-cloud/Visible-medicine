// Loopback catalogue/native-link QA only. No models, scans, sessions or access bypass.
// Launch with tty:true when a retained quit command is required.
import fs from 'node:fs';import http from 'node:http';import {createRequire} from 'node:module';import {hash} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-regional-tour-website',site=stage+'/website',dir=stage+'/browser';fs.mkdirSync(dir,{recursive:true});
const require=createRequire(site+'/package.json'),{build}=require('esbuild'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const compiled=await build({stdin:{contents:"export {default as Page} from './app/atlas/guided-learning/page';export {regionalLearningCatalogue} from './lib/regional-learning-catalogue';export {regionalTourEntrySuffix} from './lib/regional-tour-entry-navigation';",resolveDir:site,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'declared-ui-boundaries',setup(b){
  b.onResolve({filter:/^(next\/link|next\/navigation)$/},a=>({path:a.path,namespace:'qa'}));
  b.onResolve({filter:/^react$/},()=>({path:'react',external:true}));
  b.onResolve({filter:/HeadAtlasLearningLibrary$/},()=>({path:'head-library',namespace:'qa'}));
  b.onLoad({filter:/.*/,namespace:'qa'},a=>({loader:'js',contents:a.path==='next/navigation'?"export function notFound(){throw Error('not-found')}":a.path==='head-library'?"import React from 'react';export function HeadAtlasLearningLibrary(){return React.createElement('p',null,'Unchanged linked-head library boundary; not tested by this regional-link fixture.')}" : "import React from 'react';export default function Link({href,children,prefetch,...props}){return React.createElement('a',{href,...props},children)}"}));
}}]});
const module={exports:{}};new Function('require','module','exports',compiled.outputFiles[0].text)(require,module,module.exports);
const {Page,regionalLearningCatalogue,regionalTourEntrySuffix}=module.exports,catalogue=regionalLearningCatalogue();if(!catalogue.available)throw Error('Actual source-bound catalogue unavailable');
const paths=['app/atlas/guided-learning/page.tsx','components/RegionalLearningCatalogue.tsx','lib/regional-tour-entry-navigation.ts','lib/head-learning-discovery.ts','lib/regional-learning-catalogue.ts','atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-runtime/head-neck/manifest.json','public/atlas-review-viewer/manifest.json','app/atlas/guided-learning/guided-learning.css','components/regional-learning-catalogue.css'];
const css=['app/atlas/guided-learning/guided-learning.css','components/regional-learning-catalogue.css'].map(p=>fs.readFileSync(site+'/'+p,'utf8')).join('\n'),requests=[];
const document=content=>'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Regional tour entry QA</title><style>:root{--green:#073b35;--muted:#42655d}*{box-sizing:border-box}body{margin:0;background:white;font-family:Arial,sans-serif;color:#163c35}.fixture-scope{background:#e5f3ed;padding:8px 20px;font-size:13px}.atlas-hub{padding:24px 28px;margin:auto}h1{font-size:36px;margin:12px 0}h2{font-size:24px}p{line-height:1.5}.eyebrow{font-size:12px;letter-spacing:.1em;text-transform:uppercase}a{color:var(--green)}pre{white-space:pre-wrap;overflow-wrap:anywhere}'+css+'</style><p class="fixture-scope">Private native-link QA · actual catalogue/page/CSS · static rendering · no authentication, scans, models or playback · normal preview unchanged</p>'+content+'</html>';
const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://127.0.0.1');if(req.method!=='GET')throw Error('GET only');
  const params=Object.fromEntries([...new Set(url.searchParams.keys())].map(k=>{const v=url.searchParams.getAll(k);return[k,v.length===1?v[0]:v];}));
  let content;
  if(url.pathname==='/atlas/guided-learning'){
    content=renderToStaticMarkup(await Page({searchParams:Promise.resolve(params)}));requests.push({path:url.pathname,view:params.view,region:params.region,query:params.q,status:200});
  }else if(url.pathname==='/atlas/3d'){
    const suffix=regionalTourEntrySuffix(params);if(!suffix||typeof params.region!=='string')throw Error('Bad tour entry');
    const tour=catalogue.tours.find(t=>t.id===params.regionalTour&&t.revision===params.tourRevision&&t.regionId===params.region);if(!tour||params.tourSource!==catalogue.sourceRevision)throw Error('Unbound tour');
    const runtime='/atlas-runtime/head-neck/index.html?region='+params.region+suffix;
    content=renderToStaticMarkup(React.createElement('main',{className:'atlas-hub'},React.createElement('h1',null,tour.title),React.createElement('p',null,'Native link target checked. This is a navigation-only destination sentinel, not the 3D viewer. No model or playback has been loaded.'),React.createElement('output',{'data-runtime-src':runtime},React.createElement('pre',null,runtime))));
    requests.push({path:url.pathname,region:params.region,id:tour.id,revision:tour.revision,sourceRevision:params.tourSource,status:200});
  }else throw Error('Fixture routes only');
  res.writeHead(200,{'content-type':'text/html;charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'"});res.end(document(content));
}catch{res.writeHead(404,{'content-type':'text/plain'});res.end('Navigation fixture route unavailable. No viewer, asset or scan is served.');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/atlas/guided-learning?view=3D&region=thorax&q=airways`;
fs.writeFileSync(dir+'/READY.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,url,inputs:paths.map(p=>({path:p,sha256:hash(site+'/'+p)})),actualServerCatalogue:true,catalogueSourceRevision:catalogue.sourceRevision,tours:catalogue.tours.length,headLibraryStub:true,reactHydration:false,destinationSentinel:true,modelsOrStudiesServed:false,authenticatedAcceptance:false,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({pid:process.pid,url}));
function stop(){server.close(()=>{fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,requests,code:0,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});process.exit(0);});}process.stdin.setEncoding('utf8');process.stdin.on('data',v=>{if(v.trim()==='quit')stop();});process.stdin.resume();
