// Keep all five original compact-era assertions running in their verified source epoch.
// Current candidate checks use its own exact receipt and section inverse.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {caseNames,checkedCurrentFiles,currentDeliveryContract,currentSectionInverse,runHistoricalCompact} from './head-review-compact-epoch.mjs';

const historicalCase=index=>{
 const result=runHistoricalCompact();
 assert.equal(result.counts.tests,5);assert.equal(result.counts.pass,5);
 assert.equal(result.caseNames[index],caseNames[index]);
};
const current=(...names)=>checkedCurrentFiles(names).root;

test(caseNames[0],async()=>{
 historicalCase(0);
 const root=current('components/HeadAtlasTeachingReview.tsx','components/HeadCtFacialTeachingReview.tsx',
  'tests/head-review-sections-history-inverse.mjs');
 const inverse=await currentSectionInverse();
 inverse.beforeReviewSectionsTeachingReview(readFileSync(join(root,'components/HeadAtlasTeachingReview.tsx'),'utf8'));
});

test(caseNames[1],async()=>{
 historicalCase(1);
 const root=current('components/HeadTeachingReviewNavigator.tsx','tests/head-review-sections-history-inverse.mjs');
 const source=readFileSync(join(root,'components/HeadTeachingReviewNavigator.tsx'),'utf8');
 const inverse=await currentSectionInverse();inverse.beforeReviewSectionsNavigator(source);
 assert(!/fetch\(|localStorage|sessionStorage|location\.|history\.|useRouter|useState/.test(source));
});

test(caseNames[2],async()=>{
 historicalCase(2);
 const root=current('scripts/bind-clinical-review.mjs','atlas-review/integration-inputs.json',
  'components/HeadTeachingReviewNavigator.tsx','lib/head-surface-validation.ts',
  'tests/current-atlas-delivery.mjs');
 const {validateCurrentAtlasDelivery}=await currentDeliveryContract();
 const pin=validateCurrentAtlasDelivery(),binding=JSON.parse(readFileSync(join(root,'atlas-review/integration-inputs.json'),'utf8'));
 assert.equal(pin.source,'9cef8900417bf592d3130f6ff92bf3e748cb55fc');
 assert.equal(binding.inputs.length,1850);assert.equal(binding.sha256,pin.reviewIntegration);
 assert.equal(binding.inputs.filter(row=>row.path==='components/HeadTeachingReviewNavigator.tsx').length,1);
 assert.equal(binding.inputs.filter(row=>row.path==='lib/head-surface-validation.ts').length,1);
 assert.equal(binding.sourceCommit,pin.source);
});

test(caseNames[3],async()=>{
 historicalCase(3);
 const root=current('tests/current-atlas-delivery.test.mjs','tests/review-navigation-delivery-preservation.test.mjs',
  'atlas-review/integration-inputs.json','tests/current-atlas-delivery.mjs');
 const {validateCurrentAtlasDelivery}=await currentDeliveryContract();
 const pin=validateCurrentAtlasDelivery(),binding=JSON.parse(readFileSync(join(root,'atlas-review/integration-inputs.json'),'utf8'));
 assert.equal(binding.inputs.length,1850);assert.equal(binding.sourceCommit,pin.source);
});

test(caseNames[4],async()=>{
 historicalCase(4);
 const root=current('tests/head-teaching-review-navigation.test.ts','components/HeadTeachingReviewNavigator.tsx',
  'tests/head-review-sections-history-inverse.mjs');
 const inverse=await currentSectionInverse();
 inverse.beforeReviewSectionsNavigationTest(readFileSync(join(root,'tests/head-teaching-review-navigation.test.ts'),'utf8'));
});
