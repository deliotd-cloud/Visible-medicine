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
  assert.equal(previous.source,pin.source);
  assert.equal(previous.sourceTree,pin.sourceTree);
  assert.notEqual(previous.reviewIntegration,pin.reviewIntegration);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}));
  for(const [path,digest] of Object.entries(previous.documents)){
    if(path.startsWith('public/atlas-runtime/')||path==='lib/atlas-model-inventory.json')
      assert.equal(pin.documents[path],digest,path+' must retain its exact bytes');
  }
});
