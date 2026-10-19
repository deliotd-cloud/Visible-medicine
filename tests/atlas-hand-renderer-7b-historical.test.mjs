// Closed 7b renderer proof. The imported bytes below are a fixed-hash-matched
// reconstruction, not an observation of a 7b website checkout.
import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {deriveBoundRenderer} from './hand-renderer-binding.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=name=>readFileSync(new URL('./fixtures/'+name,import.meta.url));
const source='7b3e678ae4b8059aadb84459048ebd05f7abe7b9';
const review='245ca2015821a0715539428dbcf4e499d9807ab83a906e0ee3f03c042571bf37';
const atlas=process.env.VM_ATLAS_SOURCE_REPO??'F:/VisibleMedicine/atlas';
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{
  windowsHide:true,maxBuffer:4e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
});

test('immutable 7b source and fixed Review reconstruct all four historical renderer pins',()=>{
  const pinBytes=read('current-atlas-delivery-7b3e678a.json');
  assert.equal(sha(pinBytes),'1a9a62e5ec6998ccc0f68c083dcd50ef03c6f89bc8cc46a7036e6c3ba39466cf');
  const pin=JSON.parse(pinBytes);
  assert.equal(pin.source,source);assert.equal(pin.sourceTree,'de883b9d6bccb3b4403256e42fabc7471e0ea8c9');
  assert.equal(pin.reviewIntegration,review);
  assert.equal(git('rev-parse',source+'^{tree}').toString().trim(),pin.sourceTree);

  const inputBytes=read('integration-inputs-7b3e678a.json');
  assert.equal(sha(inputBytes),'37ee961401e8d18bf6e595a7edf58acd49faeec8a47201fdc91747697b637104');
  const inputs=JSON.parse(inputBytes);
  assert.equal(inputs.sourceCommit,source);assert.equal(inputs.sha256,review);
  assert.equal(sha(JSON.stringify(inputs.inputs)),review);

  const manifestBytes=read('atlas-review-7b-manifest.json');
  assert.equal(sha(manifestBytes),'2cdccade40ccd436bd5c3af931291813bf5857ec78bb7c18b7df4fcf1ab99ec4');
  const manifest=JSON.parse(manifestBytes);
  assert.equal(manifest.revision,source);assert.equal(manifest.websiteIntegrationSha256,review);
  const rendererPath='content/body-renderer-revision.json';
  const rendererRecord=manifest.files.find(item=>item.path===rendererPath);
  assert(rendererRecord,'Closed 7b renderer manifest record');
  const sourceRendererBytes=git('show',source+':'+rendererPath);
  const importedRendererBytes=deriveBoundRenderer(sourceRendererBytes,review);
  const sourceRenderer=JSON.parse(sourceRendererBytes),importedRenderer=JSON.parse(importedRendererBytes);
  assert.equal(rendererRecord.sourceSha256,'4ecf2aceca0aabe20989601e708c71169a551b5e82e17bb60540d080cb157439');
  assert.equal(rendererRecord.importedSha256,'254599253be26df67574c82d09b423ca5b057307fc5f6653185ee2c934835e2d');
  assert.equal(sha(sourceRendererBytes),rendererRecord.sourceSha256);
  assert.equal(sha(importedRendererBytes),rendererRecord.importedSha256);
  assert.equal(sourceRenderer.sha256,'8119179fa735404207218a71df812a5b25e53763065b361c09be4943e194e0e7');
  assert.equal(importedRenderer.sha256,'18b87b4b19f5d89b9716f02c7d5fe25a88f0b55ed8a4884d92968291811f245e');
  assert.equal(importedRenderer.sourceRendererSha256,sourceRenderer.sha256);
  assert.equal(importedRenderer.websiteIntegrationSha256,review);

  const wrongReview='0'.repeat(64);
  assert.notEqual(sha(deriveBoundRenderer(sourceRendererBytes,wrongReview)),rendererRecord.importedSha256);
  const altered=structuredClone(sourceRenderer);altered.sha256='1'.repeat(64);
  assert.notEqual(sha(Buffer.from(JSON.stringify(altered,null,2)+'\n')),rendererRecord.sourceSha256);
  assert.notEqual(sha(deriveBoundRenderer(Buffer.from(JSON.stringify(altered)),review)),rendererRecord.importedSha256);
  assert.throws(()=>deriveBoundRenderer(sourceRendererBytes,'not-a-review-hash'));
});
