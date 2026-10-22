// Coherent next UI checkout. It never installs, starts a server or edits the predecessor.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-final-two-epoch-comparisons/APPLIED_SOURCE.json';
const sourceReceiptSha256='7b6a0a9a806baabe23c36a452254f875e47c65f83401e833f39b0f04c2b4e2af';
assert.equal(sha(read(sourceReceipt)),sourceReceiptSha256);const source=json(sourceReceipt);
const retry=json('F:/VisibleMedicine/staging/20261022-final-two-epoch-comparisons/native-current/TERMINAL.json');assert.equal(retry.code,0);assert.equal(retry.counts.pass,13);assert.deepEqual(retry.sourceDrift,[]);
const specimen=json('F:/VisibleMedicine/staging/20261022-inbox-ui-specimen-configured/TERMINAL.json');assert.equal(specimen.code,0);assert.equal(specimen.counts.pass,48);
const root='F:/VisibleMedicine/staging/20261022-review-queue-accessibility-successor',website=root+'/website';assert(!fs.existsSync(root));
const canonical='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
assert.equal(runGit(['-C',canonical,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
const held=new Map([['.local/disc-review/assets.ts','3355c0fdb96c189f6aa9e4e49975f701ab1e2255a194334c1d9f015df3c9ef77'],['.local/optic-review/assets.ts','9a1f3ec4bc5fef227315be9599b7215d4f1746fdbc9f4e258b511776df41d58e'],['.local/plexus-review/assets.ts','d631e8bd2bc26f8dd9973dd08a27bb8205e007cfbbccacdeefc22d83320c92ac']]);
const expected=new Map();
for(const row of source.sourceRows){
 containedTarget(website,row.path);assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
 if(held.has(row.path))assert.equal(row.sha256,held.get(row.path));
 else assert(!/(^|\/)(?:\.local|\.env(?:\.[^/]*)?|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path),'No private runtime record copied: '+row.path);
 expected.set(row.path,{...row,from:source.website+'/'+row.path});
}
const queue='F:/VisibleMedicine/staging/20261022-review-queue-accessible-context',adapters='F:/VisibleMedicine/staging/20261022-inbox-useid-test-adapters';
const names=fs.readdirSync(adapters+'/CODE/tests');assert.equal(names.length,7);
const overlays=[{path:'components/ClinicalReviewInbox.tsx',from:queue+'/CODE/components/ClinicalReviewInbox.tsx',before:queue+'/RAW/components/ClinicalReviewInbox.tsx'},
 {path:'tests/clinical-review-inbox-link-context.test.mjs',from:queue+'/CODE/tests/clinical-review-inbox-link-context.test.mjs'},
 ...names.map(name=>({path:'tests/'+name,from:adapters+'/CODE/tests/'+name,before:adapters+'/RAW/tests/'+name}))];
for(const row of overlays){
 const prior=expected.get(row.path);if(prior){assert(row.before);assert.equal(sha(read(row.before)),prior.sha256);}
 else{assert(!row.before);assert(row.path.startsWith('tests/'));}
 const bytes=read(row.from);expected.set(row.path,{path:row.path,from:row.from,bytes:bytes.length,sha256:sha(bytes)});
}
const binding=json(source.website+'/atlas-review/integration-inputs.json');
assert(!binding.inputs.some(row=>row.path==='components/ClinicalReviewInbox.tsx'));
for(const row of binding.inputs){assert.equal(sha(read(expected.get(row.path).from)),row.sha256,'Bound renderer/input cannot change in this queue-only successor: '+row.path);}
fs.mkdirSync(root);runGit(['clone','--shared','--no-checkout',canonical,website]);runGit(['-C',website,'read-tree','HEAD']);
for(const row of expected.values()){const to=containedTarget(website,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),row.sha256);}
fs.symlinkSync(canonical+'/node_modules',website+'/node_modules','junction');fs.symlinkSync(atlas,root+'/atlas','junction');
const sourceRows=[...expected.values()].map(({from,...row})=>row).sort((a,b)=>a.path.localeCompare(b.path));assert.equal(sourceRows.length,6072);
const result={at:new Date().toISOString(),website,sourceRows,sourcePaths:sourceRows.length,review:source.review,previousSource:sourceReceipt,previousSourceSha256:sourceReceiptSha256,
 changedProductPaths:['components/ClinicalReviewInbox.tsx'],changedTestPaths:overlays.filter(row=>row.path.startsWith('tests/')).map(row=>row.path),
 reviewBindingUnchanged:true,boundInputs:binding.inputs.length,controlledHeldSourceAssetsCopiedLocallyOnly:true,privateRuntimeRecordsCopied:false,
 nativeAccepted:false,typesForSuccessorPassed:false,websiteBuilt:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.current.nextUiSuccessor={website,sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),sourcePaths:6072,nativeAccepted:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({sourceReceipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),sourcePaths:6072,reviewBindingUnchanged:true,ownerPreviewChanged:false}));
