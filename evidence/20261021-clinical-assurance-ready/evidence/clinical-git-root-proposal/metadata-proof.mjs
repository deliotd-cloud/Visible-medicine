// Actual checked Git/source/export metadata only; no resolver or bundle execution.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from '../20261020-combined-website-ui/website/tests/current-atlas-delivery.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const root=currentAtlasDeliveryRoot(),pin=validateCurrentAtlasDelivery();
const site='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const git=args=>execFileSync('git',['-C',root,...args],{windowsHide:true,maxBuffer:64e6,stdio:['pipe','pipe','pipe'],env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(pin.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');
assert.equal(git(['rev-parse','HEAD^{tree}']).toString().trim(),'f5af5162af89bae05b9ece240f6f158401c5bd15');
const review=JSON.parse(readFileSync(site+'/atlas-review/manifest.json'));
const records=[
 ['content/regional-teaching/head-neck.json','8b85f64cfa63fe7e15ccf317c9d4efb544430c0175b8d329608a23d02665f3d3',['head-neck','shoulder'],true],
 ['lib/teaching-heading.ts','167c480b486b97b89565dd34b9611bed0b7c7c59e3f9453983eec02af3ecd3e3',['head-neck'],false],
];
for(const [file,hash,modules,changed] of records){
 const committed=git(['show',pin.source+':'+file]);assert.equal(sha(committed),hash);
 assert.deepEqual(readFileSync(root+'/'+file),committed,'Actual clean source bytes');
 assert.deepEqual(readFileSync(site+'/atlas-review/'+file),committed,'Actual imported bytes');
 const row=review.files.find(row=>row.path===file);assert(row);
 assert.equal(row.sourceSha256,hash);assert.equal(row.importedSha256,hash);
 for(const name of modules){
  const inputs=JSON.parse(readFileSync(site+'/public/atlas-runtime/'+name+'/source-inputs.json'));
  assert.equal(inputs.find(row=>row.path===file)?.sha256,hash,name+' exact input');
 }
 const old=git(['show','9fba9a1e24b6669aafd48e945d55fc0939d50ab2:'+file]);
 assert.equal(sha(old)!==hash,changed,'Historical/current bytes are not conflated');
}
console.log(JSON.stringify({actualCommittedSourceArtifacts:2,exactReviewBindings:2,exactLearnerBindings:3,
 distinctHeadNeckHistoricalHash:true,headingHistoricalBytesPreserved:true,
 missingCommittedSource:false,actualCorpusModulesRun:false,canonicalInstalled:false}));
