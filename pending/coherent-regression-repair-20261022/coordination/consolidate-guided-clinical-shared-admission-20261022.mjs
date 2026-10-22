import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-guided-clinical-shared-consolidated';assert(!existsSync(root));
const previousPath='F:/VisibleMedicine/staging/20261022-cervical-cerebral-clinical-consolidated/QUEUE.json';
assert.equal(sha(read(previousPath)),'95a1317144b420492f9ffe49e1492ef5ee55d51b77f168eb69e38d450a5ea87d');
const previous=json(previousPath),website=previous.website;
const basePath=website+'/../VERIFIED_SOURCE.json';assert.equal(sha(read(basePath)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const base=new Map(json(basePath).sourceRows.map(row=>[row.path,row]));
const arm='F:/VisibleMedicine/staging/20261022-clinical-arm-axillary-colic-admission';
const cervical='F:/VisibleMedicine/staging/20261022-cervical-continuous-family-admission-v2';
const shared='F:/VisibleMedicine/staging/20261022-clinical-shared-coronary-admission';
const declarations=[
 [arm,'clinical-review-arm-arterial-xray.test.ts','0e49272f6c15524762d797a6c6908bc4b0161ebc57fbedfd2d39cba69a573585','3a032c39a2e91e710091faf2a743895d0765429c7f97b81aee269bae720b4efb'],
 [arm,'clinical-review-axillary-branch-xray.test.ts','a77b565ba1ad076bfc9d4bc0b8decdb334d48f5f60a9fe716b65b0eed7e6da85','3e59090c898f10709b7c9c62f67481fdd51380b2afcadcf64716a9c3afdd957b'],
 [arm,'clinical-review-colic-arterial-xray.test.ts','00fab7867451c88eff388b6392d91c9225bdcfd141d6fdd1f7590c829e7a5bd7','262450cc8d41c27b4b4cbdb2605e63e4ae29d71efb46cb5490fe2c139a3297f5'],
 [cervical,'clinical-review-cervical-disc-tour.test.ts','36b41c79a10d04fedc0bbb962accf58486ec2542f819e94aca3654d70a42f365','8f39ef8f48cbb6c0970bd14c2e92ed75eefcabe8a1db4c65d2b915bad1b8daff'],
 [cervical,'clinical-review-continuous-guided-playback.test.ts','26cabf16c9c2166c0415efcf23e29612586ca29dec039ea0985a62bfd3b1003c','2910f8ebf8610c3d3870ca069a321fc00e05bb30cc7d099020e41c44aba3bb56'],
 [cervical,'expanded-viewer-type-preservation.test.mjs','13c74f1c9c5d37207163dce2c7edf19163caf4013e9623bae0d6008036def786','00be06f3ea1866cbabf49f9f0e2d00f86fe0b44caf249b462c765ca04b17c476'],
 [shared,'clinical-review-current-admission.mjs','535b41a4b24b4d93ee15b8f271108fbff53ade3a08e4debf9e7a0cdf4177a223','181b1df7681ca831a9432559863bc65e7154cd64da8eb8d1686b7108aa56a791'],
 [shared,'clinical-review-coronary-sinus-xray.test.ts','4be201ff8982d64de4e62c007da0dc797e5e819077b9fcb78be0b399988396f1','23d17b87699b6fef26dd8555f6aa5e2678a28ea03ae7e590e272f908a3a5b84e'],
 [shared,'coronary-current-lifecycle-preservation.test.mjs','2f66f67cb54657af1368f21fa37982c6b15ed370031f47f40119b464ad209204','d745f82ad5ddd71dd7d94f6b68752efb2931fced102e34f293e4166434e60f8d'],
];
const row=([stage,name,beforeSha256,proposalSha256])=>({path:'tests/'+name,beforePath:stage+(stage===cervical?'/RAW/tests/':'/original/tests/')+name,beforeSha256,proposal:stage+(stage===cervical?'/CODE/tests/':'/proposal/tests/')+name,proposalSha256,wholeSourceInverse:true,nativeRootRerun:false});
const context='tests/cervical-current-history-context-contract.test.mjs';
const oldContext=previous.repairs.find(item=>item.path===context);assert.equal(oldContext.proposalSha256,'82d6299acf09abc68b9cccf7e38324dac7a4bd643b65441eb38011d55ec17cb1');
assert.equal(sha(read(cervical+'/PRIOR_QUEUE/'+context)),oldContext.proposalSha256);
const replacement=row([cervical,context.slice(6),'942386357c90782e6d357d936f3d2b7646597e5313d0e126221448f0ee3af6b3','8d475a073b44f7dfc56fae6aa6bef80790f3b003026185aef04bcb46a9efada4']);
const repairs=[...previous.repairs.map(item=>item.path===context?replacement:item),...declarations.map(row)];
assert.equal(repairs.length,78);assert.equal(new Set(repairs.map(item=>item.path)).size,78);
for(const item of repairs){assert.equal(sha(read(item.proposal)),item.proposalSha256);assert.equal(sha(read(item.beforePath)),item.beforeSha256);assert.equal(base.get(item.path)?.sha256,item.beforeSha256);assert.equal(sha(read(website+'/'+item.path)),item.beforeSha256);}
const extras=[
 [cervical+'/CODE','tests/cervical-family-source-adapter.mjs','bf8b51eb82123898b47f4e3dc8f973e89ad8aceaa8a1baea35136bb6ec6c425f'],
 [cervical+'/CODE','tests/fixtures/cervical-disc-tour-typed-current-before-family.test.ts.raw','36b41c79a10d04fedc0bbb962accf58486ec2542f819e94aca3654d70a42f365'],
 [shared+'/proposal','tests/coronary-current-lifecycle-inverse.mjs','b907d85e5fe24f85a4167cb0682458757ffc2542174bc83ecc8a8c29ef19aab1'],
 [shared+'/proposal','tests/fixtures/clinical-review-coronary-sinus-xray-prior-d57.ts.raw','d57fb041284d07658aa0276c82c403c19805130eed09bae2c2d85307a7dcc5c1'],
].map(([from,path,sha256])=>({path,from:from+'/'+path,sha256,kind:'Pure source adapter or complete authentic CODE preimage'}));
const additionalFiles=[...previous.additionalFiles,...extras];assert.equal(additionalFiles.length,11);assert.equal(new Set(additionalFiles.map(item=>item.path)).size,11);
for(const item of additionalFiles){assert.equal(sha(read(item.from)),item.sha256);assert(!existsSync(website+'/'+item.path));}
const sourceProofs=[...previous.sourceProofs,...[arm+'/prove-inverse.ps1',cervical+'/SOURCE_PROOF.mjs',shared+'/prove-inverse.mjs'].map(script=>({script,sha256:sha(read(script)),mainReadAndExecuted:true,nativeWebsiteModulesExecuted:false}))];
const result={at:new Date().toISOString(),website,source:previous.source,review:previous.review,previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),repairs,additionalFiles,sourceProofs,completeOriginalSourceInverses:78,mainReviewedNewPaths:9,mainReviewedReplacementPaths:1,
 supersededRepairs:[{path:context,previousProposal:oldContext.proposal,previousProposalSha256:oldContext.proposalSha256,priorCompleteCopy:cervical+'/PRIOR_QUEUE/'+context,now:replacement.proposalSha256,beforeOriginalRetained:replacement.beforeSha256,reason:'Compose newly corrected clinical test into the historical witness; keep every previous byte obligation'}],
 v1HelperRefusalPreserved:{stage:'F:/VisibleMedicine/staging/20261022-cervical-continuous-family-admission',cause:'63-character source digest always refused actual helper call',v2ActualPureHelperAndMutantsExecuted:true,oldStageUnchanged:true},
 independentPureCoronaryAdapterExecuted:true,coronarySourceChain:['23d17','4be','d57','76ace'],cervicalSourceChain:['8f39','36b','14e','29685'],originalHistoricalTestsAndTitlesPreserved:true,currentReviewAndRuntimeSourceRolesIndependent:true,strictValidatorAndPinUnchanged:true,frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false,sourceBackupIncludesAll78:false,
 next:'Keep actual1143-entry regression candidate/Atlas6d7 frozen until real terminal. Classify all failure blocks, including precise shared-helper routes. Only then assemble one source-exact repair candidate and run original affected native roots (including shared consumers/history witnesses), full types/build/strict refusals with one heavy job. Pure source/plan assertions are not native/browser/clinical evidence. Owner preview/forms and fresh draft-safe restart gate remain untouched; retain full71/eight goal.'};
mkdirSync(root);writeFileSync(root+'/QUEUE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:78,wholeSourceInversesVerified:78,additionalCodeAndProofPaths:11,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:pointer.activeWork.regressionRepairSourceBackup,next:result.next};pointer.activeWork.updated=result.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({queue:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposals:78,newPaths:9,replacedPaths:1,additionalCodePaths:11,nativeRootsRerun:false}));
