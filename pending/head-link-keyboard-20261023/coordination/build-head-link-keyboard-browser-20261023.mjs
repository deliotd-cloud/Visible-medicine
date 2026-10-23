// Bundle the actual modules and production CSS. Only next/navigation is inert.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {hash} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard',root=stage+'/browser',site=stage+'/website';
const esbuild=createRequire(site+'/package.json')('esbuild');assert(!fs.existsSync(root+'/BUILD.json'));
fs.symlinkSync(site+'/node_modules',root+'/node_modules','junction');
await esbuild.build({absWorkingDir:root,entryPoints:[root+'/entry.jsx'],outfile:root+'/bundle.js',bundle:true,format:'esm',platform:'browser',jsx:'automatic',metafile:true,
 define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'inert-fixture-router',setup(build){
  build.onResolve({filter:/^next\/navigation$/},()=>({path:'next/navigation',namespace:'qa'}));
  build.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export function useRouter(){return {push(href){(window.qaRoutes??=[]).push(href)}}}',loader:'js'}));
 }}]}).then(result=>{
 const inputs=Object.keys(result.metafile.inputs).filter(p=>!p.startsWith('qa:')).map(p=>({path:p,sha256:hash(root+'/'+p)}));
 fs.writeFileSync(root+'/BUILD.json',JSON.stringify({at:new Date().toISOString(),inputs,
  outputs:['entry.jsx','index.html','bundle.js','bundle.css'].map(p=>({path:p,sha256:hash(root+'/'+p)})),
  actualReactComponents:true,inertRouter:true,staticFocus:true,privateDataLoaded:false,previewChanged:false},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({inputs:inputs.length,bundle:root+'/bundle.js'}));
});
