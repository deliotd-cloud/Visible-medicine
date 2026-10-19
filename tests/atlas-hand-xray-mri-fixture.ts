import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

export const website=fileURLToPath(new URL('../',import.meta.url));
export const atlas=currentAtlasDeliveryRoot();
export const base='public/atlas-runtime/head-neck/';
export const historicalWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
export const historicalSource='88cea927d48729769b96ad8fe680b0872b7e6687';
export const currentSource=CURRENT_ATLAS_REVISION;
export const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
export function git(cwd:string,revision:string,path:string){return execFileSync('git',['show',`${revision}:${path}`],{cwd,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});}
export function delivery(epoch:'historical'|'current'){
 const read=(path:string)=>epoch==='historical'?git(website,historicalWebsite,base+path):readFileSync(website+base+path);
 const bytes=read('manifest.json');
 assert.equal(sha(bytes),epoch==='historical'?'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381':validateCurrentAtlasDelivery().documents[base+'manifest.json']);
 const manifest=JSON.parse(bytes.toString());
 assert.equal(manifest.sourceCommit,epoch==='historical'?historicalSource:currentSource);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false,flag);
 const inputs=JSON.parse(read('source-inputs.json').toString()) as {path:string;sha256:string}[];
 const files=manifest.files as {path:string;sha256:string;bytes:number}[];
 const teaching=()=>emittedTeaching(base,files,false,path=>read(path.slice(base.length)));
 const runtime=()=>files.filter(file=>file.path.endsWith('.js')).map(file=>{const bytes=read(file.path);assert.equal(bytes.length,file.bytes,file.path);assert.equal(sha(bytes),file.sha256,file.path);return bytes.toString();}).join('\n');
 return {manifest,inputs,files,read,teaching,runtime};
}
export function sourcePins(inputs:{path:string;sha256:string}[],expected:Record<string,string>,epoch:'historical'|'current'){
 for(const [path,hash] of Object.entries(expected)){
  assert.deepEqual(inputs.filter(row=>row.path===path),[{path,sha256:hash}],path);
  assert.equal(sha(git(atlas,epoch==='historical'?historicalSource:currentSource,path)),hash,`${path}: committed source`);
 }
}
export function committedInputs(inputs:{path:string;sha256:string}[],paths:string[]){
 for(const path of paths){
  const rows=inputs.filter(row=>row.path===path);
  assert.equal(rows.length,1,path);
  assert.equal(rows[0].sha256,sha(git(atlas,currentSource,path)),`${path}: committed source`);
  const review=JSON.parse(readFileSync(website+'atlas-review/manifest.json','utf8'));
  const imported=review.files.find((row:{path:string})=>row.path===path);
  if(imported){
   assert.equal(imported.sourceSha256,rows[0].sha256,`${path}: review source`);
   assert.equal(imported.importedSha256,sha(readFileSync(website+'atlas-review/'+path)),`${path}: import bytes`);
   if(path!=='app/body-explorer.tsx')assert.equal(imported.importedSha256,rows[0].sha256,`${path}: source/import`);
  }
 }
}
export function modelFilesUnchanged(){
 const old=delivery('historical'),now=delivery('current');
 const select=(files:{path:string;sha256:string;bytes:number}[])=>files.filter(file=>file.path.startsWith('models/'));
 assert.deepEqual(select(now.files),select(old.files));
}
