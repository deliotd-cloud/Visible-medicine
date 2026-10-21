import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const json=path=>JSON.parse(readFileSync(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('normal Review binds the native transport and deferred comparison to exact current source',()=>{
  const pin=validateCurrentAtlasDelivery();
  const manifest=json('atlas-review/manifest.json');
  const binding=json('atlas-review/integration-inputs.json');
  assert.equal(manifest.revision,pin.source);
  assert.equal(manifest.files.length,pin.reviewSourceFiles);
  assert.equal(binding.sourceCommit,pin.source);
  assert.equal(binding.sha256,pin.reviewIntegration);
  assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
  for(const path of [
    'components/HeadAtlasViewer.tsx',
    'components/HeadAtlasInlineComparison.tsx',
    'components/HeadAtlasInlineComparisonLoader.tsx',
    'lib/head-atlas-import.ts',
    'lib/head-local-source.ts',
    'scripts/bind-clinical-review.mjs',
  ]){
    const entries=binding.inputs.filter(entry=>entry.path===path);
    assert.equal(entries.length,1,path+' must be uniquely bound');
    assert.equal(entries[0].sha256,sha(readFileSync(path)),path+' must match current bytes');
  }
  assert.equal(json('atlas-review/content/body-renderer-revision.json').websiteIntegrationSha256,binding.sha256);
  assert.equal(json('public/atlas-review-viewer/manifest.json').websiteIntegrationSha256,binding.sha256);
  // This is a source-binding assertion, not an approval or spatial-registration claim.
});

test('the previous Review binding is retired without changing anatomy, source meshes or access',()=>{
  const pin=validateCurrentAtlasDelivery();
  const previous=json('tests/fixtures/current-atlas-delivery-before-head-loading.txt');
  const afterBytes=readFileSync(new URL('./fixtures/head-binding-before-role-batch-20261021/head-loading-after-pin.json.raw',import.meta.url));
  assert.equal(sha(afterBytes),'903fc8b1eb81ac3b2eefd2b1756222a2003a90dbb074e7227a2ac0fad76f618c','Authentic retained head-loading after-pin');
  const after=JSON.parse(afterBytes);
  assert.equal(previous.source,'bc925194ce3b388d4b6d9f73b4b3362ed4f2ad5f');
  assert.equal(previous.source,after.source);
  assert.equal(previous.sourceTree,after.sourceTree);
  assert.notEqual(previous.reviewIntegration,after.reviewIntegration);
  assert.notEqual(after.source,pin.source);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}));
  assert.throws(()=>validateCurrentAtlasDelivery({pin:after}));
  for(const [path,digest] of Object.entries(previous.documents)){
    if(path.startsWith('public/atlas-runtime/')||path==='lib/atlas-model-inventory.json')
      assert.equal(after.documents[path],digest,path+' must retain its exact bytes');
  }
});
