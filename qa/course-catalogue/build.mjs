import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root='G:/VisibleMedicine-temp/staging/20261029-course-catalogue-browser';
const website='G:/VisibleMedicine-temp/staging/20261029-combined-website/website';
const require=createRequire(website+'/package.json'),{build}=require('esbuild');
const hash=b=>createHash('sha256').update(b).digest('hex');
const result=await build({absWorkingDir:website,entryPoints:[root+'/entry.tsx'],outfile:root+'/bundle.js',bundle:true,
  platform:'browser',format:'iife',target:['es2022'],jsx:'automatic',metafile:true,
  nodePaths:[website+'/node_modules'],define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent',
  plugins:[{name:'synthetic-links',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'synthetic'}));
    b.onLoad({filter:/.*/,namespace:'synthetic'},()=>({loader:'jsx',resolveDir:website,contents:'import React from "react"; export default function Link({prefetch,children,...props}){return <a {...props}>{children}</a>}' }));}}]});
const inputs=Object.keys(result.metafile.inputs).filter(p=>!p.startsWith('synthetic:')).map(p=>({path:path.resolve(website,p),sha256:hash(fs.readFileSync(path.resolve(website,p)))}));
fs.writeFileSync(root+'/BUILD.json',JSON.stringify({at:new Date().toISOString(),inputs,output:{path:root+'/bundle.js',sha256:hash(fs.readFileSync(root+'/bundle.js'))},syntheticCourses:true,nativeAnchorNavigation:true,fullNextRouter:false},null,2));
console.log(JSON.stringify({inputs:inputs.length,bytes:fs.statSync(root+'/bundle.js').size}));
