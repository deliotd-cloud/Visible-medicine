import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {beforeReviewSectionsNavigator,beforeReviewSectionsTeachingReview,beforeReviewSectionsNavigationTest} from './head-review-sections-history-inverse.mjs';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {replayReviewSectionsEpoch} from './partition7-anatomy-history.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),sha=s=>createHash('sha256').update(s).digest('hex');
test('review section-only delta reproduces exact parent renderer facts, form structure and prior navigation tests',()=>{
 beforeReviewSectionsNavigator(read('components/HeadTeachingReviewNavigator.tsx'));
 beforeReviewSectionsTeachingReview(read('components/HeadAtlasTeachingReview.tsx'));
 beforeReviewSectionsNavigationTest(read('tests/head-teaching-review-navigation.test.ts'));
});
test('original review-sections admission assertions execute at authenticated 9cef epoch',()=>{
 const result=replayReviewSectionsEpoch();assert.equal(result.originalCases,2);
});
test('current C32 Review binding remains exact and rejects forged fields',()=>{
 const current=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
 assert.equal(current.source,CURRENT_ATLAS_REVISION);
 assert.equal(current.sourceTree,'d7ead7f3673ddf5c4b68db755b559b08b921eec6');
 assert.equal(current.runtimeSources['head-neck'],current.source);
 const manifest=JSON.parse(read('atlas-review/manifest.json'));assert.equal(manifest.revision,current.source);
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(binding.sourceCommit,current.source);assert.equal(binding.sha256,current.reviewIntegration);
 assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 assert.equal(new Set(binding.inputs.map(row=>row.path)).size,binding.inputs.length);
 // Review inputs include binary brand assets. Hash their original bytes, not
 // a UTF-8 decoding that replaces non-text byte sequences.
 for(const row of binding.inputs)assert.equal(sha(readFileSync(new URL('../'+row.path,import.meta.url))),row.sha256,row.path);
 for(const field of ['source','sourceTree','reviewIntegration']){
  const bad=structuredClone(current);bad[field]=field==='sourceTree'?'HEAD':'0'.repeat(field==='reviewIntegration'?64:40);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));
 }
});
