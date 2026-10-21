import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('complete pre-keyboard 30b delivery and original tour proof remain byte-exact historical evidence',()=>{
 const prior=read('./fixtures/tour-discovery-before-role-batch-20261021.mjs.raw');assert.equal(sha(prior),'de76cd029107bb874bb6664c08568f7a8944e6fd96283870d6080cf73c331d82');
 const bytes=read('./fixtures/current-atlas-delivery-30b3752e.json');assert.equal(sha(bytes),'7166d8104a3338ba7518c7257f216d97144d511f340b23dbb2c807acb1341dee');
 const old=JSON.parse(bytes);assert.equal(old.source,'30b3752ea64e3ee8439fc44e42410a975983829c');assert.equal(old.sourceTree,'6a9d9a3a1eaca908a2c91f58659e4d3698e75cff');assert.equal(old.reviewIntegration,'405276a2d8a53b75e72504853e06c7132d4235eaa06634ba6ded8c7ba0d6b8d6');assert.equal(old.reviewSourceFiles,1543);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const original=read('./fixtures/current-atlas-delivery-30b3752e.txt');assert.equal(sha(original),'c6797be1b49783f3a3ba5af8ce2313a68d24edd0b02b8bd14d2b2bb0408e1666');
 const current=validateCurrentAtlasDelivery();assert.equal(CURRENT_ATLAS_REVISION,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(current.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');assert.equal(current.reviewSourceFiles,1553);
 const beforeDisclosure=read('./fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.mjs.raw');assert.equal(sha(beforeDisclosure),'871fcea7bf926778e3a6741815216f97897c0a20e54afa2005431eabb7e34935');
 const disclosurePin=JSON.parse(read('./fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.json'));
 assert.equal(beforeDisclosure.toString().split(disclosurePin.source).join(old.source).split(disclosurePin.sourceTree).join(old.sourceTree),original.toString(),'Complete original behavioral and historical refusal bodies reconstruct from the authentic archived delivery source');
 const archived=original.toString(),live=read('./current-atlas-delivery.test.mjs').toString(),refusalStart=archived.indexOf('for(const [label,edit]of ['),refusalEnd=archived.indexOf('previous8d',refusalStart);
 assert(refusalStart>0&&refusalEnd>refusalStart);assert(live.includes(archived.slice(refusalStart,refusalEnd)),'Complete original refusal bodies still execute in current delivery root');
 const corpus=read('./fixtures/corpus-xray-v2-current-delivery-30b3752e.mjs.raw');assert.equal(sha(corpus),'66f44b7af0b5261d28420e1681b291f5942bb4676ec239146b535e95ca63ef0e');
 const historicalCorpus=read('./fixtures/tour-discovery-corpus-bd5465ee.mjs.raw');assert.equal(sha(historicalCorpus),'90d7a670937e05a5a607c813e3a712e62b19a9d0ea608f64841f6d167e2858ef');
 assert.equal(historicalCorpus.toString().split(disclosurePin.source).join(old.source).split(disclosurePin.sourceTree).join(old.sourceTree),corpus.toString(),'Complete original corpus source and refusals reconstruct from authentic archived delivery source');
 const currentCorpus=read('./corpus-xray-v2-current-delivery.test.mjs').toString(),corpusAppendix="\ntest('whole bd corpus contract remains an exact archived source and refuses current admission'";
 const appendixAt=currentCorpus.indexOf(corpusAppendix);assert(appendixAt>0&&currentCorpus.lastIndexOf(corpusAppendix)===appendixAt);
 const corpusBefore=currentCorpus.slice(0,appendixAt).replace("assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');","assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');");
 assert.equal(corpusBefore,historicalCorpus.toString(),'Whole original corpus source and refusals survive the current190 source seam and a separate historical witness');
 const ui=read('./fixtures/ui-teaching-current-delivery-30b3752e.mjs.raw');assert.equal(sha(ui),'a0b9387c12c0ab17528f81ae158448061f9ce865230b08e64762588203f61b6b');
 const historicalUi=read('./fixtures/ui-teaching-before-head-disclosure-bd5465ee.mjs.raw');assert.equal(sha(historicalUi),'a0b9387c12c0ab17528f81ae158448061f9ce865230b08e64762588203f61b6b');assert.deepEqual(historicalUi,ui,'Complete original UI source and refusals remain exact in authentic pre-disclosure archive');
 const uiBody=ui.toString(),uiRefusalStart=uiBody.indexOf('const forgedIdentity'),uiRefusalEnd=uiBody.indexOf('\n  });',uiRefusalStart);assert(uiRefusalStart>0&&uiRefusalEnd>uiRefusalStart);assert(read('./ui-teaching-current-delivery.test.mjs').toString().includes(uiBody.slice(uiRefusalStart,uiRefusalEnd)),'Full original UI submission and modality refusal body remains in the executing current root');
 const inputs=JSON.parse(read('../atlas-review/integration-inputs.json')),review=JSON.parse(read('../atlas-review/manifest.json')),learner=JSON.parse(read('../public/atlas-runtime/head-neck/manifest.json'));
 assert.equal(inputs.inputs.length,1710);assert.equal(current.reviewIntegration,inputs.sha256);assert.equal(review.revision,current.source);assert.equal(learner.sourceCommit,current.source);
 for(const path of ['content/corpus-spongiosum-xray-v2.ts','lib/corpus-spongiosum-xray-v2.ts','content/regional-teaching/pelvis.json','content/median-antebrachial-xray-pins.json','content/median-antebrachial-xray.ts','lib/median-antebrachial-xray.ts','content/regional-teaching/forearm.json']){
  const bytes=read('../atlas-review/'+path),digest=sha(bytes),row=review.files.find(r=>r.path===path);assert(row,path);assert.equal(row.importedSha256,digest,path);assert(inputs.inputs.some(r=>r.path==='atlas-review/'+path&&r.sha256===digest),path);
 }
});
