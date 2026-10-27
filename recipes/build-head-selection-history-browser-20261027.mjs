// Real React/viewer; synthetic voxel data and loader only. No scans, login or private state.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const phase=process.argv[2];assert(['before','after'].includes(phase));
const attempt=process.argv[3]??'1';assert(/^[1-9][0-9]*$/.test(attempt));
const stage='F:/VisibleMedicine/staging/20261027-head-selection-history-browser',root=stage+'/'+phase+'-'+attempt;
const source='F:/VisibleMedicine/staging/20261026-tongue-website/SOURCE_CANDIDATE.json',site=json(source).website;
assert.equal(hash(source),'e8a9c3a37a7d6671e2dfe4eb4a643efe4f0abe0824bda7e8630a8881de415a5a');
const proposal='F:/VisibleMedicine/staging/20261027-head-selection-history-proposal';
assert(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true});fs.symlinkSync(site+'/node_modules',root+'/node_modules','junction');
const write=(p,s)=>fs.writeFileSync(root+'/'+p,s,{flag:'wx'});
const imports=JSON.stringify(site+'/lib/head-atlas-import.ts');
write('synthetic-loader.ts',`import {createNativeVolumeGeometry} from ${JSON.stringify(site+'/lib/head-atlas-geometry.mjs')};
export * from ${imports};
const transform=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
const raw=(file,sha)=>({file,sha256:sha.repeat(64),dtype:'uint8',shape_kji:[9,9,9],ijk_to_ras:transform});
const entry=(id,label,point)=>({id,label,family:'bst',representation:'partial-mask',laterality:'midline_or_unpaired',color:[.2,.8,.6],opacity:{fill:.3,outline:1},focus_ras_mm:point,mask:raw(id+'.raw','c')});
const definition=modality=>({image:{...raw(modality+'.raw',modality==='CT'?'a':'b'),dtype:'int16'},entries:[entry(modality==='CT'?'cth.bst.pons':'mrb.bst.pons','Pons — regional mask',[6,4,3]),entry('synthetic.unmapped.'+modality,'Unmapped synthetic structure',[2,4,6]),{...entry('synthetic.oversize.'+modality,'Oversize synthetic structure',[3,4,5]),qaPayload:'x'.repeat(65537)}]});
export const fixturePackage={manifest:{schema_version:'synthetic',version:'synthetic',byte_order:'little',source_studies_are_distinct:true,studies:{CT:definition('CT'),MRI:definition('MRI')}},files:new Map()};
export async function openLocalHeadPackage(){return fixturePackage;}
export async function loadHeadStudy(pkg,modality,signal){if(signal?.aborted)throw new DOMException('Cancelled','AbortError');const definition=pkg.manifest.studies[modality];return {definition,geometry:createNativeVolumeGeometry(definition.image),data:Int16Array.from({length:729},(_,i)=>i%150),range:[0,150]};}
export async function loadHeadEntry(pkg,study,entry,signal){await new Promise(r=>setTimeout(r,80));if(signal?.aborted)throw new DOMException('Cancelled','AbortError');const mask=new Uint8Array(729),p=entry.focus_ras_mm;mask[p[0]+9*(p[1]+9*p[2])]=1;return {entry,mask,focus:[...p]};}
export function canReuseHeadMask(){return false;}
`);
write('entry.jsx',`import React from 'react';import {createRoot} from 'react-dom/client';
import {HeadAtlasViewer} from ${JSON.stringify(site+'/components/HeadAtlasViewer.tsx')};
import {HeadFolderSessionContext} from ${JSON.stringify(site+'/components/HeadFolderSessionContext.tsx')};
import {createHeadFolderSession} from ${JSON.stringify(site+'/lib/head-folder-session.ts')};
import {HEAD_MANIFEST_SHA256} from ${JSON.stringify(site+'/lib/head-atlas-import.ts')};
import {fixturePackage} from './synthetic-loader.ts';
const session=createHeadFolderSession(HEAD_MANIFEST_SHA256);session.keep(fixturePackage,HEAD_MANIFEST_SHA256);
window.history.replaceState({__NA:true,synthetic:true},'');
window.addEventListener('error',e=>(window.qaErrors??=[]).push(e.message));window.addEventListener('unhandledrejection',e=>(window.qaErrors??=[]).push(String(e.reason)));
createRoot(document.getElementById('root')).render(<HeadFolderSessionContext.Provider value={session}><aside className='qa-note'>Synthetic CT/MRI history QA · ${phase} · no patient data or account</aside><HeadAtlasViewer modality={location.pathname.includes('mri-head')?'MRI':'CT'}/></HeadFolderSessionContext.Provider>);
`);
write('index.html','<!doctype html><html lang="en"><meta charset="UTF-8"><title>Synthetic head selection history QA</title><link rel="stylesheet" href="/bundle.css"><style>body{margin:0;background:#f3f6f4;font:14px system-ui}.qa-note{padding:8px;background:#163b40;color:white}</style><div id="root"></div><script type="module" src="/bundle.js"></script></html>');
const replacements=new Map(phase==='after'?['components/HeadAtlasViewer.tsx','lib/head-view-history.ts'].map(p=>[site+'/'+p,proposal+'/'+p]):[]);
const {build}=createRequire(site+'/package.json')('esbuild');
const result=await build({absWorkingDir:root,entryPoints:[root+'/entry.jsx'],outfile:root+'/bundle.js',bundle:true,format:'esm',platform:'browser',jsx:'automatic',metafile:true,
 define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'synthetic-loader-and-inert-framework-only',setup(b){
  b.onResolve({filter:/head-atlas-import(?:\.ts)?$/},a=>{
   if(a.importer===root+'/synthetic-loader.ts')return;
   return {path:root+'/synthetic-loader.ts'};
  });
  b.onLoad({filter:/(HeadAtlasViewer\.tsx|head-view-history\.ts)$/},a=>{const p=a.path.replaceAll('\\','/'),replacement=replacements.get(p);if(replacement)return {contents:fs.readFileSync(replacement,'utf8'),loader:p.endsWith('.tsx')?'tsx':'ts',resolveDir:path.dirname(p)};});
  b.onResolve({filter:/^next\/(link|navigation)$/},a=>({path:a.path,namespace:'qa'}));
  b.onLoad({filter:/.*/,namespace:'qa'},a=>({loader:'jsx',resolveDir:site,contents:a.path==='next/link'?`import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>;}`:`export function useRouter(){return {push(href){location.assign(href)},replace(href){location.replace(href)}}}export function usePathname(){return location.pathname}export function useSearchParams(){return new URLSearchParams(location.search)}`}));
 }}]});
const inputs=Object.keys(result.metafile.inputs).filter(p=>!p.startsWith('qa:')).map(p=>{const absolute=path.resolve(root,p).replaceAll('\\','/');return {path:absolute,sha256:hash(replacements.get(absolute)??absolute),overlay:replacements.get(absolute)??null}});
write('BUILD.json',JSON.stringify({at:new Date().toISOString(),phase,source,sourceSha256:hash(source),inputs,files:['entry.jsx','synthetic-loader.ts','index.html','bundle.js','bundle.css'].map(p=>({path:p,sha256:hash(root+'/'+p)})),actualReactViewerAndHistory:true,syntheticLoadersAndData:true,inertNextRouter:true,realAccountAcceptance:false,normalPreviewChanged:false},null,2)+'\n');
console.log(JSON.stringify({root,inputs:inputs.length,phase,synthetic:true}));
