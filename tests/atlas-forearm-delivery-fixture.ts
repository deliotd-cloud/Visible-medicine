import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const base='public/atlas-runtime/head-neck/';
const old='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const oldSource='88cea927d48729769b96ad8fe680b0872b7e6687';
const oldManifestHash='eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381';
export const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
function git(cwd:string,ref:string,path:string){return execFileSync('git',['show',`${ref}:${path}`],{cwd,maxBuffer:128*1024*1024,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});}
export function delivery(epoch:'old'|'current'){
  const current=epoch==='current'?validateCurrentAtlasDelivery():undefined;
  const read=(path:string)=>epoch==='old'?git(root,old,base+path):readFileSync(root+base+path);
  const bytes=read('manifest.json');
  assert.equal(sha(bytes),epoch==='old'?oldManifestHash:current!.documents[base+'manifest.json']);
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,epoch==='old'?oldSource:current!.source);
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false,flag);
  const inputs=JSON.parse(read('source-inputs.json').toString()) as {path:string;sha256:string}[];
  const inventory=JSON.parse((epoch==='old'?git(root,old,'lib/atlas-model-inventory.json'):readFileSync(root+'lib/atlas-model-inventory.json')).toString());
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(bytes));
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
  const files=manifest.files as {path:string;sha256:string}[];
  const script=(name:string)=>{
    const file=files.find(item=>item.path.startsWith(`assets/${name}-`)&&item.path.endsWith('.js'));
    assert.ok(file,`${name} bundle`);
    const bytes=read(file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return bytes.toString();
  };
  const teaching=emittedTeaching(base,files,false,(path)=>read(path.slice(base.length)));
  const runtime=files.filter(file=>file.path.endsWith('.js')).map(file=>{const bytes=read(file.path);assert.equal(sha(bytes),file.sha256,file.path);return bytes.toString();}).join('\n');
  return {manifest,inputs,script,teaching,runtime};
}
export function pins(inputs:{path:string;sha256:string}[],expected:Record<string,string>,epoch:'old'|'current'){
  const sourceRoot=epoch==='old'?checkedAtlasHistoryRepo(oldSource):currentAtlasDeliveryRoot();
  const sourceRevision=epoch==='old'?oldSource:validateCurrentAtlasDelivery().source;
  for(const [path,hash] of Object.entries(expected)){
    const input=inputs.find(row=>row.path===path);
    assert.equal(input?.sha256,hash,path);
    // The emitted source-input record must match the source commit, not just a fixture literal.
    const source=git(sourceRoot,sourceRevision,path);
    assert.equal(sha(source),hash,`${path} committed source`);
  }
}
/** Shared dispatch can evolve; bind it to the admitted commit, never arbitrary HEAD. */
export function currentPins(inputs:{path:string;sha256:string}[],paths:string[]){
  const sourceRoot=currentAtlasDeliveryRoot(),revision=validateCurrentAtlasDelivery().source;
  const expected=Object.fromEntries(paths.map(path=>[path,sha(git(sourceRoot,revision,path))]));
  pins(inputs,expected,'current');
}
