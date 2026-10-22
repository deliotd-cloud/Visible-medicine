import assert from 'node:assert/strict';
import {existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-keyboard-module-admission',website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website',relative='tests/atlas-keyboard-modules.test.ts';
const sourceReceipt=website+'/../VERIFIED_SOURCE.json';assert.equal(sha(read(sourceReceipt)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');const closed=json(sourceReceipt),originalRow=closed.sourceRows.find(row=>row.path===relative);assert(originalRow);assert.equal(sha(read(website+'/'+relative)),originalRow.sha256);
const mode=process.argv[2];assert(mode==='--prepare'||mode==='--verify');
if(mode==='--prepare'){
 assert(!existsSync(root));mkdirSync(root,{recursive:true});copyFileSync(website+'/'+relative,root+'/atlas-keyboard-modules.test.ts.raw');copyFileSync(website+'/'+relative,root+'/atlas-keyboard-modules.test.ts');writeFileSync(root+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),website,relative,originalSha256:originalRow.sha256,sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt))},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({prepared:root,preimageSha256:originalRow.sha256}));
}else{
 assert(!existsSync(root+'/VERIFIED.json'));const before=read(root+'/atlas-keyboard-modules.test.ts.raw'),proposal=root+'/atlas-keyboard-modules.test.ts',bytes=read(proposal);assert.deepEqual(before,read(website+'/'+relative));let reversed=bytes.toString();const eol=reversed.includes('\r\n')?'\r\n':'\n';
 for(const [from,to]of [
  ['import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}','import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot}'],
  ['const runtimePin=validateCurrentAtlasDelivery();\n',''],
  ['manifest.sourceCommit,runtimePin.runtimeSources[module]','manifest.sourceCommit,currentAtlas'],
  ["    assert.deepEqual(git(atlasRoot,runtimePin.runtimeSources[module],path),source,`${module}: exact admitted keyboard source ${path}`);\n",''],
 ]){const a=from.replaceAll('\n',eol),b=to.replaceAll('\n',eol);assert.equal(reversed.split(a).length,2,'Unique inverse '+from);reversed=reversed.replace(a,b);}
 assert.equal(reversed,before.toString(),'Entire original keyboard source');
 const pinPath=website+'/tests/fixtures/current-atlas-delivery.json';assert.equal(sha(read(pinPath)),closed.sourceRows.find(row=>row.path==='tests/fixtures/current-atlas-delivery.json').sha256);const pin=json(pinPath),review=json(website+'/atlas-review/manifest.json');
 for(const [p,digest]of Object.entries(pin.documents))assert.equal(sha(read(website+'/'+p)),digest,p);
 const atlas='F:/VisibleMedicine/atlas',cache=new Map(),at=(revision,p)=>{const key=revision+':'+p;if(!cache.has(key))cache.set(key,runGit(['-C',atlas,'show',key]));return cache.get(key);};
 const expected={'lib/camera-keyboard.ts':'47d9ea06a7b43ee613ad734767daaf567b765f3b931efb8f8c3b680026a3909e','app/camera-keyboard.css':'98d5bb8c7fe828c06e13f065fa7628aeeeb3638bedaea07a963ee3712ba4e7de','app/fitted-camera.tsx':'f9d7aa3b4ef534eeebb02f8bb3736898d0255062ecb7597a7d56493472fb54c6'},evidence=[];
 for(const [name,revision]of Object.entries(pin.runtimeSources))for(const [p,digest]of Object.entries(expected)){
  const current=at(pin.source,p),family=at(revision,p);assert.equal(sha(current),digest);assert.deepEqual(family,current);const inputs=json(website+'/public/atlas-runtime/'+name+'/source-inputs.json');assert.equal(inputs.find(row=>row.path===p)?.sha256,digest);const record=review.files.find(row=>row.path===p);assert(record);assert.equal(record.sourceSha256,digest);assert.equal(record.importedSha256,sha(read(website+'/atlas-review/'+p)));evidence.push({module:name,source:revision,path:p,sha256:digest,exactCurrentReviewSource:true});
 }
 const result={at:new Date().toISOString(),website,path:relative,beforePath:root+'/atlas-keyboard-modules.test.ts.raw',beforeSha256:sha(before),proposal,proposalSha256:sha(bytes),wholeSourceInverse:true,allOriginalTestRegistrationsRetained:true,actualFamilySourceBindings:evidence,currentValidatorAndPinUnchanged:true,frozenOrCanonicalEdited:false,nativeRootRerun:false};writeFileSync(root+'/VERIFIED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/VERIFIED.json',sha256:sha(read(root+'/VERIFIED.json')),entireOriginalInverse:true,actualFamilyInputs:12,nativeChecksRun:false}));
}
