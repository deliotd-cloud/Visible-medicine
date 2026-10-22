import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/staging/20261022-extra-expansion-family-consolidated';assert(!existsSync(root));
const previousPath='F:/VisibleMedicine/staging/20261022-shared-family-admission-consolidated/QUEUE.json';
assert.equal(sha(read(previousPath)),'f56b5196e2bb6c37ff3d1a99c8293d5c83d6ac055d052db563329be0c6f7aa26');
const previous=json(previousPath),website=previous.website;
const sourceReceipt=website+'/../VERIFIED_SOURCE.json';assert.equal(sha(read(sourceReceipt)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const sourceRows=new Map(json(sourceReceipt).sourceRows.map(row=>[row.path,row]));
const extraRoot='F:/VisibleMedicine/staging/20261022-extra-expansion-admission',extraPath=extraRoot+'/VERIFIED.json';
assert.equal(sha(read(extraPath)),'3635c49d412a0984daf3da07b8f5259251f6aa908067cd01414da02261470e89');
const extra=json(extraPath),refusals=json(extraRoot+'/SOURCE_REFUSALS.json');
assert.equal(refusals.sourceMutationRefusals,13);assert.equal(refusals.wholeOriginalSources,3);assert.equal(refusals.nativeRootsRerun,false);
const paused='F:/VisibleMedicine/staging/20261022-paused-pelvic-source-families';
const respiratory='F:/VisibleMedicine/staging/20261022-respiratory-source-family-admission';
const access='F:/VisibleMedicine/staging/20261022-search-shoulder-access-family-admission';
const additions=[...extra.repairs];
for(const [name,stage,beforeHash,proposalHash]of [
 ['atlas-paused-tour-imaging-checks.mjs',paused,'4b161133c2d493a52767049a58a39f5ce6ce47fb887f81e08a92ac1ff50c482e','cf877a8edb29119f3b9d382ceb50f51ea9d748586b77d2dd0eefa4f7ae3f0e97'],
 ['atlas-pelvic-reproductive-core-checks.mjs',paused,'7ed75abd2e4e443c28a95ceef5b05b8cdece0af7dbfd497cc21ac9622fa67365','9e1dd04e7901a89b82e976591495279265b2889b884794b7df3e2baf9e7ed14a'],
 ['atlas-respiratory-core-depth-checks.mjs',respiratory,'3bccab25e6751237ed6448868bf1c85f1361acc1932824c3c4df81429ae0bee5',null],
]){
 const proposal=stage+'/'+name,beforePath=stage+'/'+name.replace(/\.mjs$/,'.preimage.bin');
 assert.equal(sha(read(beforePath)),beforeHash);
 if(proposalHash)assert.equal(sha(read(proposal)),proposalHash);
 additions.push({path:'tests/'+name,proposal,proposalSha256:sha(read(proposal)),beforePath,beforeSha256:beforeHash,wholeSourceInverse:true,nativeRootRerun:false});
}
additions.push({path:'tests/atlas-shoulder-access.test.ts',proposal:access+'/tests/atlas-shoulder-access.test.ts',
 proposalSha256:'b7e7b1f131625cf0f8f95c6ab83b993ad0c25d54b6d89ace949e6ff7b0a3e308',beforePath:access+'/tests/preimages/atlas-shoulder-access.test.ts.raw',beforeSha256:'aa8323319f05d0e2d4366dff71092d08ebec398d8651565341aa97120ec648e1',wholeSourceInverse:true,nativeRootRerun:false});
assert.equal(additions.length,7);
const repairs=[...previous.repairs,...additions];assert.equal(repairs.length,52);assert.equal(new Set(repairs.map(row=>row.path)).size,52);
for(const row of repairs){
 assert.equal(sha(read(row.proposal)),row.proposalSha256,row.path+' proposal');
 assert.equal(sha(read(row.beforePath)),row.beforeSha256,row.path+' complete code preimage');
 assert.equal(sha(read(website+'/'+row.path)),row.beforeSha256,row.path+' frozen original');
 assert.equal(sourceRows.get(row.path)?.sha256,row.beforeSha256,row.path+' closed inventory');
}
const additionalFiles=[...previous.additionalFiles,...extra.additionalFiles.map(({source,...row})=>({...row,from:source}))];
assert.equal(additionalFiles.length,6);
for(const row of additionalFiles){assert.equal(sha(read(row.from)),row.sha256);assert(!sourceRows.has(row.path));assert(!existsSync(website+'/'+row.path));}
const sourceProofs=[
 'F:/VisibleMedicine/staging/20261022-nonhead-expansion-harness-proposal/SOURCE_PROOF.mjs',
 paused+'/SOURCE_ONLY_AUDIT.ps1',paused+'/SOURCE_ONLY_INVERSE.ps1',
 respiratory+'/SOURCE_ONLY_AUDIT.ps1',respiratory+'/SOURCE_ONLY_INVERSE.ps1',
 access+'/SOURCE_PROOF.mjs',
].map(script=>({script,sha256:sha(read(script)),mainReadAndExecuted:true,nativeWebsiteModulesExecuted:false}));
mkdirSync(root,{recursive:true});
const result={at:new Date().toISOString(),website,source:previous.source,review:previous.review,
 previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),repairs,additionalFiles,
 completeOriginalSourceInverses:52,mainReviewedNewPaths:7,mainReviewedNewAdditionalPaths:5,
 sourceProofs,mainExtraExpansionReceipt:{path:extraPath,sha256:sha(read(extraPath))},sourceMutationRefusals:{path:extraRoot+'/SOURCE_REFUSALS.json',sha256:sha(read(extraRoot+'/SOURCE_REFUSALS.json')),count:13},
 exactSharedSourceRolesPreserved:true,historicalTestsAndPrivacyAssertionsPreserved:true,realControllerLoaderReused:true,
 noSeparateSearchHandoffEditNeeded:{path:'tests/atlas-search-study-handoff.test.ts',sha256:sha(read(website+'/tests/atlas-search-study-handoff.test.ts')),via:'tests/atlas-nonregional-release-fixture.ts'},
 strictValidatorAndPinUnchanged:true,frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,
 clinicalApproval:false,publicDeployment:false,sourceBackupIncludesAll52:false,
 next:'Keep the same1143-entry frozen regression running to authoritative terminal. Then classify every failure, assemble a separate coherent candidate with this52-path queue and6 additional CODE/proof paths, run affected original native roots/full types/build/current strict refusal guards with one heavy slot. Source-only proofs are not native/browser/clinical acceptance. Owner preview cutover still requires the fresh saved-draft answer; no forced owner refresh. Continue full71/eight roadmap.'};
writeFileSync(root+'/QUEUE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:52,wholeSourceInversesVerified:52,additionalCodeAndProofPaths:6,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:pointer.activeWork.regressionRepairSourceBackup,next:result.next};pointer.activeWork.updated=result.at;
writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({queue:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposals:52,newReviewedPaths:7,additionalCodeAndProofPaths:6,nativeRootsRerun:false,ownerFormsRefreshed:false}));
