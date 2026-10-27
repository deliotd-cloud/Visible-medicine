import fs from 'node:fs';import assert from 'node:assert/strict';import{hash,json}from'./bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-learning-return-links',sf=stage+'/SOURCE_CANDIDATE.json',s=json(sf),p=json(s.parent);
assert.equal(hash(s.parent),s.parentSha256);for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
for(const r of p.sourceRows){assert.equal(hash(p.website+'/'+r.path),r.sha256,r.path);if(!s.changedPaths.includes(r.path))assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);}
const inputs=json(s.website+'/atlas-review/integration-inputs.json');assert.equal(inputs.sha256,p.reviewBindingSha256);for(const r of inputs.inputs)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
assert(s.changedPaths.every(p=>!inputs.inputs.some(r=>r.path===p)));
const result={at:new Date().toISOString(),passing:true,source:{path:sf,sha256:hash(sf)},changedPaths:s.changedPaths,addedPaths:s.addedPaths,protectedInputs:inputs.inputs.length,allPriorModelsTeachingLicencesAccessAndRuntimesUnchanged:true,reviewBindingUnchanged:true,normalPreviewChanged:false,clinicalApproval:false};
fs.writeFileSync(stage+'/CONTENT_QA.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
