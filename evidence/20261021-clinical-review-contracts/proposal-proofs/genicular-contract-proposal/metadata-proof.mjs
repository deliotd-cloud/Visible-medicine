import assert from 'node:assert/strict';
import {admitPreservedClinicalReview} from '../20261020-combined-website-ui/website/tests/clinical-review-current-admission.mjs';
import {currentAtlasDeliveryRoot} from '../20261020-combined-website-ui/website/tests/current-atlas-delivery.mjs';
const sourceHashes = {
  'content/genicular-imaging-pins.json': '365a921cf5fa507c682f067df6762dd6759e21c4c686442129bc3f2e3103e9f2',
  'content/genicular-ultrasound.ts': '3a4d9e4da862b4de40aeef26408874ad7679e5ae3e13603f923d0313d70ae298',
  'lib/genicular-ultrasound.ts': '27ecab9cc163d92fb6d2adce507484b62e74dc42b6468ec00860a84f84124a13',
};
const source = admitPreservedClinicalReview({ revision: '9fba9a1e24b6669aafd48e945d55fc0939d50ab2',
  sourceHashes, learnerModules: ['head-neck', 'shoulder'] });
assert.equal(source, '485df97c2530e8e81a8d39a5ee61073ce76d93db');
assert.equal(currentAtlasDeliveryRoot().replaceAll('\\', '/'), 'F:/VisibleMedicine/staging/20261020-inbox-material-source');
let refused = 0;
for (const key of Object.keys(sourceHashes)) {
  assert.throws(() => admitPreservedClinicalReview({ revision: '9fba9a1e24b6669aafd48e945d55fc0939d50ab2',
    sourceHashes: { ...sourceHashes, [key]: '0'.repeat(64) }, learnerModules: ['head-neck', 'shoulder'] }));
  refused++;
}
for (const learnerModules of [[], ['head-neck', 'head-neck'], ['foreign']]) {
  assert.throws(() => admitPreservedClinicalReview({ revision: '9fba9a1e24b6669aafd48e945d55fc0939d50ab2',
    sourceHashes, learnerModules })); refused++;
}
console.log(JSON.stringify({ source, unchangedOriginalFeatureFiles: sourceHashes,
  refused, actualMetadataAdmissionPass: true, actualCorpusModulePass: false, canonicalInstalled: false }));
