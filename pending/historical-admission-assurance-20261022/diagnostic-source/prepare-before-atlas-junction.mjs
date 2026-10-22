// Main-owned isolated composition. No current preview or predecessor is edited.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-historical-admission-assurance',site=root+'/website';
const previousSource='F:/VisibleMedicine/staging/20261022-corpus-cranio-assurance/SOURCE.json';
assert.equal(sha(read(previousSource)),'4148e2f10b083c9fdeec9d28ead4d13effd67e8f3499f2fdee43b9e0d1311eb7');
const previous=json(previousSource),proposalPath='F:/VisibleMedicine/staging/20261022-tongue-neck-history/RESULT.json';
assert.equal(sha(read(proposalPath)),'e7f06051364f6bd9ff0d840433a0eb2575242522bfef37e397a8c5354049aeb2');
const proposal=json(proposalPath);assert.equal(proposal.sourceReceiptSha256,sha(read(previousSource)));assert.equal(proposal.sourceOnlyProofPassed,true);
assert(!fs.existsSync(root));fs.mkdirSync(root);runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'read-tree','HEAD']);
const held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const row of previous.sourceRows){assert.equal(sha(read(previous.website+'/'+row.path)),row.sha256,row.path);
 if(!held.has(row.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path));
 const target=containedTarget(site,row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(previous.website+'/'+row.path,target,fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
const allowed=new Set(['tests/tongue-palate-delivery.test.ts','tests/tongue-palate-neck-history.mjs','tests/tongue-palate-neck-history.test.mjs','tests/fixtures/tongue-palate-before-neck-history.ts.raw']);
for(const row of proposal.files){assert(allowed.has(row.to));assert.equal(sha(read(row.from)),row.sha256);assert(row.from.startsWith('F:/VisibleMedicine/staging/20261022-tongue-neck-history/'));
 const target=containedTarget(site,row.to);fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.copyFileSync(row.from,target,row.to==='tests/tongue-palate-delivery.test.ts'?0:fs.constants.COPYFILE_EXCL);
}
const prepared={at:new Date().toISOString(),website:site,previousSource,previousSourceSha256:sha(read(previousSource)),atlas:previous.atlas,atlasHead:previous.atlasHead,atlasTree:previous.atlasTree,
 review:previous.review,tongueProposal:proposalPath,tongueProposalSha256:sha(read(proposalPath)),addedPaths:proposal.files.map(r=>r.to).filter(p=>!previous.sourceRows.some(r=>r.path===p)),
 pendingAdmissionComposition:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(prepared,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PREPARED.json',website:site,pendingAdmissionComposition:true,ownerPreviewChanged:false}));
