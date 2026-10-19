import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';

const originals=JSON.parse(readFileSync(new URL('./fixtures/current-history-wave3-before-20261016/manifest.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const registrations=text=>[...text.matchAll(/^test\(['"]([^'"]+)['"]/gm)].map(match=>match[1]);

test('six exact originals and all twelve active registrations remain recoverable',()=>{
 assert.equal(originals.schema,'vm-current-history-wave3-originals-1');
 assert.equal(originals.files.length,6);
 let total=0;
 for(const file of originals.files){
  const before=readFileSync(new URL(`./fixtures/current-history-wave3-before-20261016/${file.name}.test.ts.txt`,import.meta.url));
  const after=readFileSync(new URL(`./${file.name}.test.ts`,import.meta.url));
  assert.equal(sha(before),file.sha256,file.name);
  const earlier=registrations(before.toString()),active=registrations(after.toString());
  assert.equal(earlier.length,file.registrations,file.name);
  assert.deepEqual(active,earlier,file.name);
  assert(!/^\s*(?:test|describe)\.skip\(/m.test(after.toString()),file.name);
  total+=active.length;
 }
 assert.equal(total,12);
});

test('closed current delivery refuses both previously admitted sources and forged documents',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 assert(currentAtlasDeliveryRoot());
 for(const previous of ['408759d57644b05402e98a937e7cf6338b5509cf','9fba9a1e24b6669aafd48e945d55fc0939d50ab2']){
  const stale=structuredClone(pin);stale.source=previous;
  assert.throws(()=>validateCurrentAtlasDelivery({pin:stale}),previous);
 }
 const forged=structuredClone(pin);forged.documents['public/atlas-runtime/head-neck/manifest.json']='0'.repeat(64);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:forged}));
});

test('Undo, contained review, coronary teaching and Spread replay exact feature exports',()=>{
 const epochs=[
  {website:'f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6',source:'88cea927d48729769b96ad8fe680b0872b7e6687',
   review:'c368f353345bc0a03dbff54410f2f8ad68ebcc01142cfb0aa06d43bafb02115c',
   learner:'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381',
   inputs:'5fdbdf5a788b90de0a8bbefcf0e68ce3e28bab14a2bf946d655ddb41089448c8',
   paths:['app/source-display-notes.tsx','lib/source-display-notes.ts','app/body-selection-notice.tsx','lib/contextual-dissection-undo.ts','app/eye-layers.tsx','app/femoral-components.tsx','app/nested-teaching.tsx','app/ventricles.tsx','lib/coronary-venous.ts','content/coronary-venous-teaching.ts']},
  {website:'c285a3871181565c35535ed65eb48d23fc13acd8',source:'a10496da94d9d054306bbc48e5ae9c98239d82b5',
   review:'d2e4f2c6c6a5edee8545ee80847d913602e27609cf720ca1e656c106f990c6b6',
   learner:'0be7bbd67e7eba935ab05a66379e07efe0c970cecb247d54482f7187a99a0fae',
   inputs:'c571bac87341cd0dfefd5b23ccf8d8b7fc589353f3871de7bc6c1e4e72ea3acf',
   paths:['lib/body-spread.ts','app/body-scene.tsx','app/body-explorer.tsx']},
 ];
 const websiteBytes=(revision,path)=>execFileSync('git',['show',`${revision}:${path}`],{maxBuffer:32e6});
 for(const epoch of epochs){
  assert.equal(execFileSync('git',['rev-parse',`${epoch.website}^{commit}`],{encoding:'utf8'}).trim(),epoch.website);
  const atlas=checkedAtlasHistoryRepo(epoch.source);
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
   const sourceBytes=execFileSync('git',['-C',atlas,'show',`${epoch.source}:${path}`],{maxBuffer:32e6});
   assert.equal(imported.sourceSha256,sha(sourceBytes),path);
   assert.equal(imported.importedSha256,sha(websiteBytes(epoch.website,`atlas-review/${path}`)),path);
   const input=inputs.find(file=>file.path===path);
   if(input)assert.equal(input.sha256,imported.sourceSha256,path);
  }
 }
});
