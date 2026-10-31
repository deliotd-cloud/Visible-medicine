import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const originalPath='G:/VisibleMedicine-temp/staging/20261031-release14-family-epoch-ready/website/tests/atlas-emitted-teaching.ts';
const {emittedTeaching:original}=await import(pathToFileURL(originalPath).href);
const {emittedTeaching:adapted}=await import('./tests/atlas-emitted-teaching-async.ts');
const base='public/atlas-runtime/head-neck/';
const assets=new Map([
 [base+'index.html',Buffer.from('<script src="./entry.js"></script>')],
 [base+'assets/entry.js',Buffer.from('import "./body-content-abc.js"; export const ready=true;')],
 [base+'assets/body-content-abc.js',Buffer.from('export const teaching="heart";')],
]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=[...assets].map(([path,bytes])=>({path:path.slice(base.length),sha256:sha(bytes)}));
const sync=path=>{assert(assets.has(path));return assets.get(path);};
const asyncRead=async path=>sync(path);
const oldText=original(base,files,true,sync);
const newText=await adapted(base,files,true,asyncRead);
assert.equal(newText,oldText);
assert.equal(await adapted(base,files,false,asyncRead),original(base,files,false,sync));
const result={schema:'visible-medicine.thoracic-reader-helper-proof/1',
 syntheticArtifacts:3,allReachableOutputIdentical:true,deferredOutputIdentical:true,
 originalHelper:originalPath,realThoracicTestRun:false};
writeFileSync(join(here,'HELPER_PROOF.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
