import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {beforeReviewSectionsNavigator,beforeReviewSectionsTeachingReview,beforeReviewSectionsNavigationTest} from './head-review-sections-history-inverse.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),sha=s=>createHash('sha256').update(s).digest('hex');
test('review section-only delta reproduces exact parent renderer facts, form structure and prior navigation tests',()=>{
 beforeReviewSectionsNavigator(read('components/HeadTeachingReviewNavigator.tsx'));
 beforeReviewSectionsTeachingReview(read('components/HeadAtlasTeachingReview.tsx'));
 beforeReviewSectionsNavigationTest(read('tests/head-teaching-review-navigation.test.ts'));
});
test('stock regenerated Review changes integration only, retaining native source, runtime sources and model inventory',()=>{
 const previous=JSON.parse(read('tests/fixtures/head-review-sections-before/current-atlas-delivery.json.raw')),current=validateCurrentAtlasDelivery();
 assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}));
 assert.equal(current.source,previous.source);assert.equal(current.sourceTree,previous.sourceTree);assert.deepEqual(current.runtimeSources,previous.runtimeSources);
 assert.equal(current.reviewSourceFiles,previous.reviewSourceFiles);assert.equal(current.viewerFiles,previous.viewerFiles);assert.equal(current.viewerPackages,previous.viewerPackages);
 const changed=Object.keys(current.documents).filter(p=>current.documents[p]!==previous.documents[p]);assert.deepEqual(changed.sort(),['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json'].sort());
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));assert.equal(binding.inputs.length,1850);assert.equal(current.reviewIntegration,binding.sha256);
 for(const row of binding.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 for(const field of ['source','sourceTree','reviewIntegration']){const bad=structuredClone(current);bad[field]=field==='sourceTree'?'HEAD':'0'.repeat(field==='reviewIntegration'?64:40);assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));}
});
