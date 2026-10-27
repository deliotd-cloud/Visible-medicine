import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-current-contract-repairs',sf=stage+'/SOURCE_CANDIDATE.json',s=json(sf),p=json(s.parent);
assert.equal(hash(s.parent),s.parentSha256);assert(s.testOnly);assert.deepEqual(s.removedPaths,[]);assert([...s.changedPaths,...s.addedPaths].every(path=>path.startsWith('tests/')));
for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
for(const r of p.sourceRows)if(!s.changedPaths.includes(r.path))assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
for(const r of s.originalFixtureSources){assert.equal(hash(r.origin),r.sha256);assert.equal(hash(s.website+'/'+r.target),r.sha256);}
for(const d of s.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
const binding=json(s.website+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,s.reviewBindingSha256);assert.equal(binding.inputs.length,1835);for(const r of binding.inputs)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
const result={passing:true,source:{path:sf,sha256:hash(sf)},allNonOwnedParentSourceExact:true,allProductInputsExact:true,all1835ReviewInputsExact:true,generatedRuntimesUnchanged:true,liveValidatorsUnchanged:true,noClinicalContentOrApprovalChanged:true,noBuildOrBrowserRerunRequiredForUnchangedProduct:true};fs.writeFileSync(stage+'/CONTENT_QA.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
