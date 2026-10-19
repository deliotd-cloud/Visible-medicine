import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {projectCoverageView} from '../lib/anatomy-coverage-view.ts';

const originals=JSON.parse(readFileSync(new URL('./fixtures/current-history-wave2-before-20261016/manifest.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const registrations=text=>[...text.matchAll(/^test\(['"]([^'"]+)['"]/gm)].map(match=>match[1]);

test('all six original sources retain exact bytes and all twelve active registrations',()=>{
 assert.equal(originals.schema,'vm-current-history-wave2-originals-1');
 assert.equal(originals.files.length,6);
 let total=0;
 for(const file of originals.files){
  const archived=readFileSync(new URL(`./fixtures/current-history-wave2-before-20261016/${file.name}.test.ts.txt`,import.meta.url));
  const active=readFileSync(new URL(`./${file.name}.test.ts`,import.meta.url));
  assert.equal(sha(archived),file.sha256,file.name);
  const before=registrations(archived.toString()),after=registrations(active.toString());
  assert.equal(before.length,file.registrations,file.name);
  assert.deepEqual(after,before,file.name);
  assert(!/^\s*(?:test|describe)\.skip\(/m.test(active.toString()),file.name);
  total+=after.length;
 }
 assert.equal(total,12);
});

test('current admission rejects a past source and forged delivery document',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 assert.equal(currentAtlasDeliveryRoot().length>0,true);
 const past=structuredClone(pin);past.source='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
 assert.throws(()=>validateCurrentAtlasDelivery({pin:past}));
 const forged=structuredClone(pin);forged.documents['atlas-review/manifest.json']='0'.repeat(64);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:forged}));
});

test('coverage package identity is the exact committed Atlas input and a past package fails closed',async()=>{
 const atlas=currentAtlasDeliveryRoot();
 const snapshot=JSON.parse(readFileSync('docs/anatomy-coverage/index.json','utf8'));
 const manifest=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const bytes=execFileSync('git',['-C',atlas,'show',`${CURRENT_ATLAS_REVISION}:package.json`],{maxBuffer:32e6});
 assert.equal(snapshot.evidence.sourceInputs['package.json'],sha(bytes));
 assert(await projectCoverageView(snapshot,manifest));
 const past=structuredClone(snapshot);past.evidence.sourceInputs['package.json']='25c8f2e4d5cea2762605025eb4b72bed390a5a24234af9e4a39a71219ab648dd';
 assert.equal(await projectCoverageView(past,manifest),null);
});

test('aorta, camera and back teaching replay their actual feature exports and Atlas inputs',()=>{
 const epochs=[
  {website:'c285a3871181565c35535ed65eb48d23fc13acd8',source:'a10496da94d9d054306bbc48e5ae9c98239d82b5',
   review:'d2e4f2c6c6a5edee8545ee80847d913602e27609cf720ca1e656c106f990c6b6',
   learner:'0be7bbd67e7eba935ab05a66379e07efe0c970cecb247d54482f7187a99a0fae',
   inputs:'c571bac87341cd0dfefd5b23ccf8d8b7fc589353f3871de7bc6c1e4e72ea3acf',
   paths:['content/central-vessel-imaging.ts','app/body-explorer.tsx','app/fitted-camera.tsx','app/body-scene.tsx','app/scene-orientation.tsx']},
  {website:'f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6',source:'88cea927d48729769b96ad8fe680b0872b7e6687',
   review:'c368f353345bc0a03dbff54410f2f8ad68ebcc01142cfb0aa06d43bafb02115c',
   learner:'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381',
   inputs:'5fdbdf5a788b90de0a8bbefcf0e68ce3e28bab14a2bf946d655ddb41089448c8',
   paths:['content/back-bone-teaching.ts','content/back-layers-clinical.ts','content/body-renderer-revision.json']},
 ];
 const websiteBytes=(revision,path)=>execFileSync('git',['show',`${revision}:${path}`],{maxBuffer:32e6});
 for(const epoch of epochs){
  assert.equal(execFileSync('git',['rev-parse',`${epoch.website}^{commit}`],{encoding:'utf8'}).trim(),epoch.website);
  const atlas=checkedAtlasHistoryRepo(epoch.source);
  const sourceBytes=path=>execFileSync('git',['-C',atlas,'show',`${epoch.source}:${path}`],{maxBuffer:32e6});
  const reviewBytes=websiteBytes(epoch.website,'atlas-review/manifest.json');
  const learnerBytes=websiteBytes(epoch.website,'public/atlas-runtime/head-neck/manifest.json');
  const inputBytes=websiteBytes(epoch.website,'public/atlas-runtime/head-neck/source-inputs.json');
  assert.equal(sha(reviewBytes),epoch.review);
  assert.equal(sha(learnerBytes),epoch.learner);
  assert.equal(sha(inputBytes),epoch.inputs);
  const review=JSON.parse(reviewBytes),learner=JSON.parse(learnerBytes),inputs=JSON.parse(inputBytes);
  assert.equal(review.revision,epoch.source);
  assert.equal(learner.sourceCommit,epoch.source);
  assert.equal(learner.patientDataIncluded,false);
  assert.equal(learner.clinicalApproved,false);
  for(const path of epoch.paths){
   const imported=review.files.find(file=>file.path===path);
   assert(imported,`${epoch.website}: ${path}`);
   assert.equal(imported.sourceSha256,sha(sourceBytes(path)),path);
   assert.equal(imported.importedSha256,sha(websiteBytes(epoch.website,`atlas-review/${path}`)),path);
   const learnerInput=inputs.find(file=>file.path===path);
   if(learnerInput)assert.equal(learnerInput.sha256,imported.sourceSha256,path);
  }
 }
});
