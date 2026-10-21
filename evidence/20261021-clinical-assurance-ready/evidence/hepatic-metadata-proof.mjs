// Actual existing validator and metadata only; not a corpus/test-module run.
import assert from 'node:assert/strict';
import {admitPreservedClinicalReview} from '../20261020-combined-website-ui/website/tests/clinical-review-current-admission.mjs';
const source=admitPreservedClinicalReview({revision:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2',sourceHashes:{
 'content/central-vessel-imaging-pins.json':'29610e12ec6864a4131874e0d3f6520597af3e65179fd0f009b216aff1371a63',
 'content/hepatic-venous-xray.ts':'8d8e74ab220e10e15c17c7fb91e343cc1479946da4303f0c35c0515bc80835ef',
 'lib/hepatic-venous-xray.ts':'24ecd4853dd474d3817ac83c4dfc1c30e85eb2ff1de196964d81ebd6a3125eaf',
},learnerModules:['head-neck']});
assert.equal(source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');
console.log(JSON.stringify({unchangedHepaticFeatureFiles:3,actualExistingAdmissionPassed:true,source,actualCorpusTestsRun:false,canonicalInstalled:false}));
