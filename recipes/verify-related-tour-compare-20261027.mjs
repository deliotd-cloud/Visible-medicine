import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-related-tour-compare',sf=stage+'/SOURCE_CANDIDATE.json',s=json(sf),p=json(s.parent);
assert.equal(hash(s.parent),s.parentSha256);
assert.deepEqual([...s.changedPaths].sort(),['components/HeadAtlasRelatedLearning.tsx','tests/head-related-learning.test.ts','tests/related-lecture-entrypoints.test.ts'].sort());assert.equal(s.addedPaths.length,0);
for(const r of p.sourceRows){assert.equal(hash(p.website+'/'+r.path),r.sha256,r.path);if(!s.changedPaths.includes(r.path))assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);}
for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
const binding=json(s.website+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,s.reviewBindingSha256);assert.equal(binding.inputs.length,1836);for(const r of binding.inputs)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
// Existing clinical, source-resolution, access and navigation contracts stay byte-identical.
for(const n of ['lib/head-guided-comparison.ts','lib/head-related-learning.ts','lib/head-atlas-links.ts','lib/head-link-availability.ts','lib/head-atlas-learning.ts','lib/head-image-only-links.ts','lib/lecture-related-links.ts','components/head-atlas.css','package.json','package-lock.json'])assert.equal(hash(s.website+'/'+n),hash(p.website+'/'+n),n);
fs.writeFileSync(stage+'/CONTENT_QA.json',JSON.stringify({at:new Date().toISOString(),passing:true,source:{path:sf,sha256:hash(sf)},allOtherParentSourceExact:true,all1836ReviewInputsExact:true,existingMappingAccessAndProgressContractsUnchanged:true,clinicalApproval:false,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log('Exact three-file change; protected Review inputs, mapping, access, teaching, geometry and progress contracts retained.');
