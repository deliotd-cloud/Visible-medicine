import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

// A proposal builder only. The coordinator supplies the final, verified website
// checkout and a new output folder, then serves that folder separately.
const native='F:/VisibleMedicine/staging/20261027-tour-step-native/atlas';
const expectedHead='5c7346af577ae626c1ac06c0352f96bf84d36100';
const [websiteArg,outputArg]=process.argv.slice(2);
assert(websiteArg&&outputArg,'Usage: node builder.mjs <integrated-website> <new-output-folder>');
const website=path.resolve(websiteArg),output=path.resolve(outputArg),importedAtlas=path.join(website,"atlas-review");
assert.equal(execFileSync('git',['-C',native,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),expectedHead);
assert(fs.existsSync(path.join(website,'components/RegionalLearningCatalogue.tsx')),'Integrated website component unavailable');
assert(!fs.existsSync(output),'Output folder must be new');
fs.mkdirSync(output,{recursive:false});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write=(name,value)=>fs.writeFileSync(path.join(output,name),value,{flag:'wx'});

write('entry.jsx',`
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import rawCatalog from ${JSON.stringify(path.join(importedAtlas,'public/models/bodyparts3d/full-body/catalog.json').replaceAll('\\','/'))};
import review from ${JSON.stringify(path.join(website,'atlas-review/manifest.json').replaceAll('\\','/'))};
import {bodyDisplayCatalog} from ${JSON.stringify(path.join(importedAtlas,'lib/body-display-catalog.ts').replaceAll('\\','/'))};
import {regionalTours,regionalTourStructures,regionalTourLimitations} from ${JSON.stringify(path.join(importedAtlas,'lib/regional-tours.ts').replaceAll('\\','/'))};
import {parseRegionalTourEntry,resolveRegionalTourEntry} from ${JSON.stringify(path.join(importedAtlas,'lib/regional-tour-entry.ts').replaceAll('\\','/'))};
import {WholeBodyGuidedLearning} from ${JSON.stringify(path.join(importedAtlas,'app/whole-body-guided-learning.tsx').replaceAll('\\','/'))};
import {RegionalLearningCatalogue} from ${JSON.stringify(path.join(website,'components/RegionalLearningCatalogue.tsx').replaceAll('\\','/'))};

import {regionalLearningCatalogue} from ${JSON.stringify(path.join(website,"lib/regional-learning-catalogue.ts").replaceAll("\\","/"))};
const catalog=bodyDisplayCatalog(rawCatalog);
const tour=regionalTours.find(item=>item.id==='thoracic-airways-vessels');
if(!tour||tour.region!=='thorax'||tour.steps.length<2)throw Error('Representative thorax tour unavailable');
const fullDiscovery=regionalLearningCatalogue();
const projection=fullDiscovery.tours.find(item=>item.id===tour.id);
if(!fullDiscovery.available||!projection)throw Error('Actual website catalogue did not admit target tour');
const discovery={...fullDiscovery,regions:fullDiscovery.regions.filter(item=>item.id==='thorax'),tours:[projection]};
const root=createRoot(document.getElementById('root'));
let serial=0,selectedRoute=null,sceneProps=null,sceneCallbacks=null;
window.qa={errors:[],sourceRevision:review.revision,tour:{id:tour.id,revision:tour.revision,steps:tour.steps.map(s=>({title:s.title,selectedId:s.selectedId,durationMs:s.durationMs}))},lastLink:null};
window.addEventListener('error',event=>window.qa.errors.push(String(event.message)));
window.addEventListener('unhandledrejection',event=>window.qa.errors.push(String(event.reason)));
window.fetch=()=>Promise.reject(Error('Network disabled in synthetic tour fixture'));
function SyntheticScene(props){
 sceneProps=props;
 useEffect(()=>{sceneCallbacks={loaded:props.onLoaded,health:props.onRendererHealth,failed:props.onFailure};
  return()=>{if(sceneCallbacks?.loaded===props.onLoaded)sceneCallbacks=null;};},[props]);
 return <div className="synthetic-scene" role="img" aria-label="Synthetic renderer placeholder; no model is loaded">Synthetic renderer · no model or WebGL</div>;
}
window.__qaSyntheticScene=SyntheticScene;
function App({route}){
 const [selected,setSelected]=useState(route);
 useEffect(()=>{setSelected(route);},[route]);
 const params=selected?.params;
 const parsed=params?parseRegionalTourEntry(params):{status:'none'};
 const resolved=params?resolveRegionalTourEntry(catalog,selected.region||'thorax',review.revision,parsed):{status:'none'};
 window.qa.route={params:params||null,parsed,resolution:resolved.status,reason:resolved.reason||null};
 const chooser=useRef(null);
 useEffect(()=>{
  const click=event=>{const anchor=event.target.closest?.('a[href*="regionalTour="]');if(!anchor)return;
   event.preventDefault();const url=new URL(anchor.href,location.href);window.qa.lastLink=url.pathname+url.search;
   const values=Object.fromEntries(url.searchParams);setSelected({region:values.region,params:values});};
  const node=chooser.current;node?.addEventListener('click',click);return()=>node?.removeEventListener('click',click);
 },[]);
 return <><header><h1>Synthetic guided-step browser QA</h1><p>Public draft tour metadata; synthetic renderer. No scans, models, account, or clinical approval.</p></header>
 <div ref={chooser}><RegionalLearningCatalogue catalogue={discovery}/></div>
 <hr/><h2>Actual guided player</h2>
 {resolved.status==='ready'?<WholeBodyGuidedLearning key={serial+':'+resolved.tour.id+':'+(resolved.stepIndex??'none')}
    catalog={catalog} region={selected.region||'thorax'} initialTour={{id:resolved.tour.id,revision:resolved.tour.revision,stepIndex:resolved.stepIndex}}
    onExit={()=>setSelected(null)}/> : <p role="status">{resolved.status==='rejected'? 'Tour route rejected: '+resolved.reason : 'Select a catalogue step or reset to a route.'}</p>}
 </>;
}
function paramsFrom(options={}){
 if(options.params)return {...options.params};
 if(options.query){const query=String(options.query).replace(/^.*?\\?/,'');const p=new URLSearchParams(query);return Object.fromEntries([...new Set(p.keys())].map(k=>[k,p.getAll(k).length>1?p.getAll(k):p.get(k)]));}
 const step=options.initialStep===undefined?3:Number(options.initialStep)+1;
 return {region:options.region||'thorax',regionalTour:options.tourId||tour.id,
  tourRevision:options.revision||tour.revision,tourSource:options.sourceRevision||review.revision,regionalStep:String(step)};
}
window.qa.reset=(options={})=>{serial++;sceneProps=null;sceneCallbacks=null;window.qa.errors=[];window.qa.lastLink=null;
 selectedRoute={region:options.region||'thorax',params:paramsFrom(options)};
 flushSync(()=>root.render(<React.StrictMode><App key={serial} route={selectedRoute}/></React.StrictMode>));return window.qa.snapshot();};
window.qa.ready=()=>{const p=sceneProps,c=sceneCallbacks;if(!p||!c)return false;
 c.health('ready');for(const id of new Set(p.structures.map(s=>s.bundle)))c.loaded(id);return true;};
window.qa.selectTour=id=>{const node=document.querySelector('select[aria-label="Choose a tour"]');
 if(!node)return false;node.value=id;node.dispatchEvent(new Event('change',{bubbles:true}));return true;};
window.qa.snapshot=()=>{const p=document.querySelector('.synthetic-scene')?sceneProps:null;const q=window.qa.route||{};const picker=document.querySelector('select[aria-label="Choose a tour"]');
 const caption=document.querySelector('.regional-tour-caption');const play=document.querySelector('[data-tour-resume]');
 const stepTitle=document.querySelector('.regional-tour-heading h2')?.textContent||null;
 const index=tour.steps.findIndex(s=>s.title===stepTitle);
 return {route:q,selectedTourId:picker?.value||null,stepIndex:index>=0?index:null,stepTitle,
  caption:caption?.textContent||null,selectedId:p?.selectedId||null,sceneReset:p?.reset??null,
  transitionMs:p?.transitionMs??null,transitionPaused:p?.transitionPaused??null,
  playLabel:play?.textContent||null,playPressed:play?.getAttribute('aria-pressed')||null,playDisabled:play?.disabled??null,
  sceneReady:!!sceneCallbacks,lastLink:window.qa.lastLink,errors:[...window.qa.errors]};};
window.qa.unmount=()=>{flushSync(()=>root.render(null));sceneProps=null;sceneCallbacks=null;};
window.qa.reset();
`);
write('index.html','<!doctype html><html lang="en"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic guided-step QA</title><style>body{font:16px system-ui;margin:24px;background:#f7f9f9;color:#173339}header{max-width:900px}.synthetic-scene{height:220px;background:#e5eeee;border:2px dashed #668;padding:20px;box-sizing:border-box}.regional-tour,.whole-body-guided-learning,.regional-learning-catalogue{max-width:1000px}.regional-tour-panel,.regional-learning-catalogue{padding:18px;background:white;border:1px solid #9ab;border-radius:8px}button,input,select{font:inherit;padding:6px}button:focus-visible,a:focus-visible,select:focus-visible{outline:3px solid teal}li{margin-block:8px}.regional-tour-controls{display:flex;gap:8px;flex-wrap:wrap}</style><div id="root"></div><script type="module" src="/bundle.js"></script></html>');

const require=createRequire(path.join(native,'package.json'));
const {build}=require('esbuild');
const reactDir=path.dirname(require.resolve('react/package.json'));
const reactDomDir=path.dirname(require.resolve('react-dom/package.json'));
const result=await build({absWorkingDir:output,entryPoints:[path.join(output,'entry.jsx')],outfile:path.join(output,'bundle.js'),
 bundle:true,format:'esm',platform:'browser',jsx:'automatic',metafile:true,logLevel:'warning',
 alias:{'@':website,'react':reactDir,'react-dom':reactDomDir},define:{'process.env.NODE_ENV':'"development"'},
 plugins:[{name:'synthetic-scene-and-framework',setup(api){
  api.onResolve({filter:/^next\/dynamic$/},()=>({path:'dynamic',namespace:'fixture'}));
  api.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'fixture'}));
  api.onResolve({filter:/^\.\/lazy-body-teaching$/},args=>args.importer.replaceAll('\\','/').endsWith('/app/regional-guided-learning.tsx')?({path:'teaching',namespace:'fixture'}):undefined);
  api.onResolve({filter:/\.css$/},()=>({path:'css',namespace:'fixture'}));
  api.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'jsx',resolveDir:native,contents:args.path==='dynamic'
   ? 'import React from "react"; export default function dynamic(){ return function SyntheticDynamic(props){ return React.createElement(window.__qaSyntheticScene,props); }; }'
   :args.path==='link'?'import React from "react";export default function Link(p){return <a {...p}/>;}'
   :args.path==='teaching'?'import React from "react";export function LazyBodyTeaching(){return <p>Teaching deferred in synthetic QA.</p>;}':''}));
 }}]});
const inputs=Object.keys(result.metafile.inputs).filter(item=>!item.startsWith('fixture:')).map(item=>{
 const absolute=path.resolve(output,item.replace(/ with \{ type: ['"]json['"] \}$/,''));return {path:absolute.replaceAll('\\','/'),sha256:sha(absolute)};
});
write('BUILD.json',JSON.stringify({createdAt:new Date().toISOString(),nativeHead:expectedHead,website:website.replaceAll('\\','/'),
 actualReactStrictMode:true,actualNativePlayerAndParserResolver:true,actualWebsiteCatalogueAndLinkHelper:true,
 syntheticRenderer:true,actualServerCatalogueFilteredToOneRealTour:true,importedWebsitePlayerAndResolver:true,noWebGLOrModelAssets:true,
 inputs,outputs:['entry.jsx','index.html','bundle.js'].map(name=>({name,sha256:sha(path.join(output,name))}))},null,2)+'\n');
console.log(JSON.stringify({output:output.replaceAll('\\','/'),inputs:inputs.length}));
