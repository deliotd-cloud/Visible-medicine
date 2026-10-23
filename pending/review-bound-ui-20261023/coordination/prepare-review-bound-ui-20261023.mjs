// Main-owned, create-only successor; keep the sealed unbound parent unchanged.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261023-review-bound-ui-website',site=root+'/website';
const parent='F:/VisibleMedicine/staging/20261023-coherent-ui-runtime-website/SOURCE_INVENTORIED.json';
assert.equal(sha(read(parent)),'9c609ee742d75147a944d92012c0dd6d7f2243e1c65178684992b52fb2373ffa');
const source=json(parent);assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(source.reviewBound,false);assert(!fs.existsSync(root));fs.mkdirSync(root);
runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'read-tree','HEAD']);
const slab=Buffer.alloc(65536);const hash=file=>{const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
for(const row of source.sourceRows){const from=source.website+'/'+row.path;assert.equal(hash(from),row.sha256,row.path);const to=containedTarget(site,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256);}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');fs.symlinkSync(source.atlas,root+'/atlas','junction');
const policy='lib/atlas-delivery-policy.ts',before=read(site+'/'+policy);fs.writeFileSync(root+'/atlas-delivery-policy.before.ts.raw',before,{flag:'wx'});
assert.equal(sha(read(site+'/lib/atlas-model-inventory.json')),'27a2b7fbe983a2e6ca89bcc73ee8f0fde6b22135bce93bdb38749050df56c40e');
assert.deepEqual(json(site+'/lib/atlas-model-inventory.json').models,json('F:/VisibleMedicine/staging/20261023-coherent-ui-runtime-website/inventory.before.json').models);
const prep={at:new Date().toISOString(),website:site,sourceParent:parent,sourceParentSha256:sha(read(parent)),sourceParentWebsite:source.website,sourcePaths:source.sourcePaths,atlas:source.atlas,atlasHead:source.atlasHead,atlasTree:source.atlasTree,policy,policyBeforeSha256:sha(before),priorInventorySha256:'2e5accc6d2a6c749bbacdfc5721b841a57a6cce715be6c3bd300870b28680284',inventorySha256:'27a2b7fbe983a2e6ca89bcc73ee8f0fde6b22135bce93bdb38749050df56c40e',models:137,paths:144,completeModelByteAndPathSetUnchanged:true,normalPreviewChanged:false,installed:false,privateDecisionsReadOrMigrated:false,sourceRows:source.sourceRows};
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PREPARATION.json',sha256:sha(read(root+'/PREPARATION.json')),sourcePaths:source.sourcePaths,oldPolicySha256:sha(before),audienceUnchanged:'administrator-review',previewChanged:false}));
