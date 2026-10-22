import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-runtime-admission-consolidated';
assert(!existsSync(root));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website',atlas='F:/VisibleMedicine/atlas';
const originalReceipt=website+'/../VERIFIED_SOURCE.json';
assert.equal(sha(read(originalReceipt)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const closed=json(originalReceipt),closedRows=new Map(closed.sourceRows.map(row=>[row.path,row]));
const previousPath='F:/VisibleMedicine/staging/20261022-runtime-family-batch2-v2/VERIFIED.json';
assert.equal(sha(read(previousPath)),'ca47a71c0ab0942a9438cb90c816c6c1bd95f7ccbca6d39ad3fa648198a415f5');
const mainPath='F:/VisibleMedicine/staging/20261022-runtime-main-consumers-batch3/VERIFIED.json';
assert.equal(sha(read(mainPath)),'448b062aa69a916bad2e19c15a97fe3597d3b978b1e79b07355b513affb9f1e3');
const previous=json(previousPath),repairs=[...previous.repairs,...json(mainPath).repairs];
const simple='F:/VisibleMedicine/staging/20261022-runtime-simple-consumers-batch3',historical='F:/VisibleMedicine/staging/20261022-runtime-historical-consumers-batch3';
const proofCommands=[simple+'/prove-inverse.mjs',historical+'/verify-inverse.mjs'];
const outputs=proofCommands.map(script=>({script,sha256:sha(read(script)),stdout:execFileSync(process.execPath,[script],{encoding:'utf8',windowsHide:true,maxBuffer:2e6})}));
for(const [base,beforeFolder,proposedFolder,count]of [[simple,'original/tests','proposal/tests',9],[historical,'raw-preimages','tests',3]]){
 const names=readdirSync(base+'/'+proposedFolder);assert.equal(names.length,count);
 for(const name of names){assert.match(name,/^[a-z-]+\.test\.ts$/);const p='tests/'+name,beforePath=base+'/'+beforeFolder+'/'+name,proposal=base+'/'+proposedFolder+'/'+name;
  repairs.push({path:p,beforePath,beforeSha256:sha(read(beforePath)),proposal,proposalSha256:sha(read(proposal)),wholeSourceInverse:true,nativeRootRerun:false});}
}
assert.equal(repairs.length,28);assert.equal(new Set(repairs.map(row=>row.path)).size,28);
for(const row of repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);assert.deepEqual(read(row.beforePath),read(website+'/'+row.path));assert.equal(row.beforeSha256,closedRows.get(row.path)?.sha256,'Exact frozen snapshot '+row.path);}
const pin=json(website+'/tests/fixtures/current-atlas-delivery.json');assert.equal(pin.source,closed.source);assert.equal(pin.reviewIntegration,closed.review);
for(const [p,digest]of Object.entries(pin.documents))assert.equal(sha(read(website+'/'+p)),digest,p);
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),pin.source);assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),pin.sourceTree);assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
const review=json(website+'/atlas-review/manifest.json'),reviewRows=new Map(review.files.map(row=>[row.path,row]));
const inputs=Object.fromEntries(Object.keys(pin.runtimeSources).map(name=>[name,new Map(json(website+'/public/atlas-runtime/'+name+'/source-inputs.json').map(row=>[row.path,row]))]));
const cache=new Map(),at=(revision,p)=>{const key=revision+':'+p;if(!cache.has(key))cache.set(key,runGit(['-C',atlas,'show',key]));return cache.get(key);};
const paths=new Set();
for(const row of repairs.slice(16)){for(const match of read(row.proposal).toString().matchAll(/(?:app|lib|content)\/[a-zA-Z0-9_.\/-]+\.(?:tsx|ts|json)\b/g))paths.add(match[0]);}
const sourceEvidence=[];
for(const p of [...paths].sort()){
 const current=reviewRows.get(p);if(!current)continue;
 const currentBytes=at(pin.source,p);assert.equal(current.sourceSha256,sha(currentBytes),p+': current Review source');assert.equal(current.importedSha256,sha(read(website+'/atlas-review/'+p)),p+': current Review import');
 for(const [name,revision]of Object.entries(pin.runtimeSources)){
  const input=inputs[name].get(p);if(!input)continue;const bytes=at(revision,p);assert.equal(input.sha256,sha(bytes),name+': source at actual admitted epoch '+p);
  sourceEvidence.push({path:p,module:name,source:revision,sha256:sha(bytes),currentReviewSourceSha256:current.sourceSha256,sameBytesAsCurrentReview:sha(bytes)===current.sourceSha256});
 }
}
assert(sourceEvidence.length>30,'Substantive independent source-input inspection');
const authored='9fba9a1e24b6669aafd48e945d55fc0939d50ab2',old='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const authoredChecks=[];
for(const stem of ['regional-muscle-completion-quiz','upper-limb-completion-quiz','thoracic-eus'])for(const p of ['content/'+stem+'.ts','content/'+stem+'-pins.json','lib/'+stem+'.ts']){
 // The EUS source names are spelled in its actual test; do not manufacture absent paths.
 if(!reviewRows.has(p))continue;assert.deepEqual(at(authored,p),at(old,p),p+': original authored190 roles');assert.deepEqual(at(old,p),at(pin.source,p),p+': exact authored source retained');authoredChecks.push(p);
}
const dispatch='app/body-content.ts';assert.equal(sha(at(authored,dispatch)),'92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');assert.equal(sha(at(old,dispatch)),'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');assert.equal(sha(at(pin.source,dispatch)),'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');
mkdirSync(root,{recursive:true});for(const [i,row]of outputs.entries())writeFileSync(root+'/pure-inverse-'+i+'.log',row.stdout,{flag:'wx'});
const result={at:new Date().toISOString(),website,source:pin.source,review:pin.reviewIntegration,originalReceipt,originalReceiptSha256:sha(read(originalReceipt)),previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),mainProof:mainPath,mainProofSha256:sha(read(mainPath)),workerProofs:outputs.map(({stdout,...row})=>row),repairs,additionalFiles:previous.additionalFiles,completeOriginalSourceInverses:28,independentCurrentAndFamilySourceEvidence:sourceEvidence,authoredSourcePreservation:authoredChecks,allThreeDispatchEpochHashesRetained:true,allValidatorsAndPinsUnchanged:true,frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false,sourceBackupIncludesThisWholeBatch:false,next:'Keep actual1143-entry run frozen until authoritative terminal. Then integrate this reviewed source-only repair batch into a separate coherent candidate, retain all original failure evidence and complete preimages, and run affected original native roots, full types/build and strict current-delivery/refusal guards once with the heavy slot free. Source proofs are not native/browser/clinical acceptance. Preserve existing owner draft gate before any local preview switch.'};
writeFileSync(root+'/QUEUE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:28,wholeSourceInversesVerified:28,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:previous.sourceBackup,next:result.next};pointer.activeWork.updated=result.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),wholeOriginalSourceInverses:28,independentFamilyInputs:sourceEvidence.length,authoredSourcePaths:authoredChecks.length,sourceEpochDifferencesPreserved:sourceEvidence.filter(r=>!r.sameBytesAsCurrentReview).length,nativeRootsRerun:false,frozenCandidateEdited:false}));
