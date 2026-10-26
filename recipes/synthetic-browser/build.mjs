// Local recipe only. Build is intentionally left for the coordinator to run.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';

const website=resolve('F:/VisibleMedicine/staging/20261026-atlas-keyboard-help-v2/website');
const here=resolve(import.meta.dirname);
const requireWebsite=createRequire(resolve(website,'package.json'));
const {build}=requireWebsite('esbuild');
const actual=['components/AtlasRuntimeFrame.tsx','components/atlas-runtime-state.ts',
  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const inputs=Object.fromEntries(actual.map(path=>[path,sha(readFileSync(resolve(website,path)))]));
mkdirSync(resolve(here,'dist'),{recursive:true});
await build({
  stdin:{contents:`import React,{useState,useEffect} from 'react';
import{createRoot}from'react-dom/client';
import{AtlasRuntimeFrame}from 'vm-actual-frame';
function App(){
 const [kind,setKind]=useState('known');
 const src=kind==='known'?'/atlas-runtime/head-neck/index.html?region=whole-body':'/atlas-runtime/other/index.html?region=whole-body';
 useEffect(()=>{
  let next=0; const seen=new WeakMap();
  const update=()=>{const frame=document.querySelector('.atlas-runtime-frame>iframe');
   if(frame&&!seen.has(frame))seen.set(frame,++next);
   document.getElementById('instance').textContent=frame?'Iframe instance '+seen.get(frame):'No iframe mounted';};
  const watcher=new MutationObserver(update);watcher.observe(document.getElementById('fixture'),{childList:true,subtree:true});update();
  return()=>watcher.disconnect();
 },[]);
 return <><header><h1>Viewer help layout check</h1><p>Synthetic blank iframe. No model, user data, or readiness proof.</p>
 <nav aria-label="Fixture controls"><button type="button" onClick={()=>setKind('known')} aria-pressed={kind==='known'}>Known generic runtime</button>
 <button type="button" onClick={()=>setKind('unknown')} aria-pressed={kind==='unknown'}>Unknown runtime</button>
 <button type="button" id="before">Focus before viewer</button></nav></header>
 <main className="atlas-3d-workspace-page"><div id="fixture"><AtlasRuntimeFrame src={src} title="Synthetic blank viewer" className="synthetic-frame"/></div></main>
 <footer><button type="button" id="after">Focus after viewer</button><output id="instance" aria-live="polite"/></footer></>;
}
createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:website,sourcefile:'keyboard-help-browser-harness.tsx',loader:'tsx'},
  bundle:true,jsx:'automatic',format:'esm',platform:'browser',target:'es2022',outdir:resolve(here,'dist'),entryNames:'harness',
  loader:{'.css':'css'},
  plugins:[{name:'synthetic-learning-row-only',setup(api){
   api.onResolve({filter:/^vm-actual-frame$/},()=>({path:resolve(website,'components/AtlasRuntimeFrame.tsx')}));
   api.onResolve({filter:/^\.\/AtlasBodyLearning$/},args=>args.importer.endsWith('AtlasRuntimeFrame.tsx')?{path:'synthetic-learning-row',namespace:'fixture'}:undefined);
   api.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`import React from 'react';
export function AtlasBodyLearning(){return <details className="atlas-body-learning"><summary>Related learning (synthetic)</summary><p>No teaching, model, or clinical content is loaded.</p></details>}`,loader:'tsx',resolveDir:website}));
  }}],
});
const sourceHtml=readFileSync(resolve(here,'index.html'));
writeFileSync(resolve(here,'dist/index.html'),sourceHtml);
writeFileSync(resolve(here,'dist/fixture-inputs.json'),JSON.stringify({schema:'vm-keyboard-help-browser-synthetic/1',claim:'local layout and interaction fixture only; no model or readiness proof',website,inputs},null,2)+'\n');
