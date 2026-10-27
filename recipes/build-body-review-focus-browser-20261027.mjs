// Actual React dashboard and Base UI controls; synthetic read-only rows/editor only.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const phase=process.argv[2],attempt=process.argv[3]??'1';assert(['before','after'].includes(phase));assert(/^[1-9][0-9]*$/.test(attempt));
const source='F:/VisibleMedicine/staging/20261027-pharyngeal-mri-native/SOURCE_CANDIDATE.json';assert.equal(hash(source),'34f73bcfcb3954ee0ea3aee6964db43981f5514c9ed4f14ac1c5b566a80c0353');
const native=json(source),atlas=native.atlas,proposal='F:/VisibleMedicine/staging/20261027-body-review-focus-proposal';
const stage='F:/VisibleMedicine/staging/20261027-body-review-focus-browser',root=stage+'/'+phase+'-'+attempt;assert(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true});
fs.symlinkSync(fs.realpathSync.native(atlas+'/node_modules'),root+'/node_modules','junction');
const write=(p,s)=>fs.writeFileSync(root+'/'+p,s,{flag:'wx'}),dashboard=atlas+'/app/review/body/review-dashboard.tsx';
const input=phase==='before'?dashboard:proposal+'/app/review/body/review-dashboard.tsx';
const inputSha256=hash(input);
if(phase==='after')assert.equal(inputSha256,process.argv[4],'Explicit final proposal digest required');
assert.equal(hash(dashboard),native.sourceRows.find(r=>r.path==='app/review/body/review-dashboard.tsx').sha256);
write('entry.jsx',`import React from 'react';import {createRoot} from 'react-dom/client';
import {BodyReviewDashboard} from ${JSON.stringify(dashboard)};
import ${JSON.stringify(atlas+'/app/review/body/body-review.css')};
const rows=Array.from({length:41},(_,i)=>({id:'synthetic-'+i,name:'Synthetic structure '+String(i+1).padStart(2,'0'),fmaId:'SYNTHETIC',system:'skeleton',laterality:'unspecified',regions:['synthetic']}));
window.qaErrors=[];window.addEventListener('error',e=>qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>qaErrors.push(String(e.reason)));
window.fetch=async (url,options)=>{const id=new URL(url,location.origin).searchParams.get('structure');if(options?.method&&options.method!=='GET')throw Error('No writes in synthetic QA');return {ok:true,json:async()=>({structureId:id,materialHash:'synthetic-'+id,atlasLink:'#synthetic',source:{structure:{name:id}}})}};
const root=createRoot(document.getElementById('root'));let version=0;let currentRows=rows;
function show(initialId='synthetic-0',count=41){version++;currentRows=rows.slice(0,count);root.render(<React.Fragment key={version}><aside className="qa-note">Synthetic Review navigation QA · ${phase} · no account or clinical decisions</aside><label>Unrelated control<input aria-label="Unrelated control"/></label><BodyReviewDashboard rows={currentRows} regions={[{id:'synthetic',name:'Synthetic'}]} initialId={initialId} initialRegion="all"/></React.Fragment>);}
window.qaReset=show;show();
`);
write('index.html','<!doctype html><html lang="en"><meta charset="UTF-8"><title>Synthetic Review navigation QA</title><link rel="stylesheet" href="/bundle.css"><style>body{margin:0;background:#f3f6f4;font:14px system-ui}.qa-note{padding:8px;background:#163b40;color:white}button{padding:6px;border:1px solid #789}[data-slot="alert-dialog-overlay"]{position:fixed;inset:0;background:#0005}[data-slot="alert-dialog-content"]{position:fixed;top:35%;left:30%;padding:20px;background:white;z-index:50}*:focus-visible{outline:3px solid #007d92}</style><div id="root"></div><script type="module" src="/bundle.js"></script></html>');
const {build}=createRequire(atlas+'/package.json')('esbuild');
const result=await build({absWorkingDir:root,entryPoints:[root+'/entry.jsx'],outfile:root+'/bundle.js',bundle:true,format:'esm',platform:'browser',jsx:'automatic',metafile:true,tsconfig:atlas+'/tsconfig.json',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'synthetic-content-only',setup(b){
 b.onLoad({filter:/review-dashboard\.tsx$/},a=>{let text=fs.readFileSync(input,'utf8');const marker='export function BodyReviewDetails(';assert.equal(text.split(marker).length,2);text=text.slice(0,text.indexOf(marker))+'export function BodyReviewDetails(){return <p>Synthetic worksheet content</p>}';return {contents:text,loader:'tsx',resolveDir:path.dirname(dashboard)};});
 b.onResolve({filter:/^@\/lib\/body-review-response$|body-decision-editor$|review-model-preview$|^next\/link$|^@\/components\/review-sign-in-link$|^\.\.\/\.\.\/brand$/},a=>({path:a.path,namespace:'qa'}));
 b.onLoad({filter:/.*/,namespace:'qa'},a=>({loader:'jsx',resolveDir:atlas,contents:
   a.path.includes('body-review-response')?'export async function parseBodyReviewResponse(data){return data}':
   a.path.includes('body-decision-editor')?'import React from "react";export function BodyDecisionEditor({id,onDirty}){return <section data-synthetic-editor={id}><button onClick={()=>onDirty(true)}>Edit synthetic review</button><button onClick={()=>onDirty(false)}>Clear synthetic edit</button></section>}':
   a.path.includes('review-model-preview')?'export function ReviewModelPreview(){return null}':
   a.path==='next/link'?'import React from "react";export default function Link(props){return <a {...props}/>}':
   a.path.includes('review-sign-in-link')?'export function ReviewSignInLink(){return null}':'export function Brand(){return null}'
 }));
}}]});
assert.equal(hash(input),inputSha256,'Dashboard changed during browser build');
const inputs=Object.keys(result.metafile.inputs).filter(p=>!p.startsWith('qa:')).map(p=>{const absolute=path.resolve(root,p).replaceAll('\\','/');return {path:absolute,sha256:hash(absolute===dashboard?input:absolute),overlay:absolute===dashboard?input:null}});
write('BUILD.json',JSON.stringify({at:new Date().toISOString(),phase,source,sourceSha256:hash(source),dashboard:{path:input,sha256:hash(input)},inputs,files:['entry.jsx','index.html','bundle.js','bundle.css'].map(p=>({path:p,sha256:hash(root+'/'+p)})),actualReactDashboardAndBaseUiControls:true,syntheticRowsParserEditorDetailsAndModel:true,realAccountAcceptance:false,normalPreviewChanged:false},null,2)+'\n');
console.log(JSON.stringify({root,inputs:inputs.length,phase,synthetic:true}));
