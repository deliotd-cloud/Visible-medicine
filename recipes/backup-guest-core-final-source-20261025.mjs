import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {backup,read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261025-head-search-guest-core-final-website';
const sourceFile=stage+'/SOURCE_CANDIDATE.json',sourceSha='078a315d863ce312d0d3cd28ab4464407ea2a57a9234762cbb5c2c3014400255';
assert.equal(sha(read(sourceFile)),sourceSha);
const verificationFile=stage+'/VERIFICATION_SUMMARY.json',verificationSha=sha(read(verificationFile));
const source=json(sourceFile),v=json(verificationFile);
assert(v.passing&&v.wholeCurrentCases===51&&v.fullTypeRoots===2662&&v.fullTypeFiles===6220&&v.diagnostics===0&&v.actualStockProductionArtifacts===1142&&v.completeBothProductionModuleInversesVerified);
const files=[];
function add(p,file,restore,expected){const b=read(file);assert(!b.includes(0));new TextDecoder('utf8',{fatal:true}).decode(b);if(expected)assert.equal(sha(b),expected);files.push({path:p,source:file,restore,bytes:b.length,sha256:sha(b)});}
for(const p of v.exactChangedPaths){assert(/^(lib|tests)\//.test(p));assert(!p.includes('/fixtures/'));add('website/'+p,source.website+'/'+p,'website/'+p,source.sourceRows.find(r=>r.path===p).sha256);}
for(const p of ['verify-guest-core-final-production-20261025.mjs','seal-guest-core-final-20261025.mjs','backup-guest-core-final-source-20261025.mjs'])add('recipes/'+p,path.resolve(p),'coordination/'+p);
const harness='F:/VisibleMedicine/staging/20261025-guest-api-harness-v3-proposal',manifest=json(harness+'/MANIFEST.json');
for(const r of manifest.files){assert(['common.mjs','serve.mjs','inspect-first.mjs','cleanup.mjs','run-sequential.mjs','README.md'].includes(r.path));add('recipes/guest-api-harness-v3/'+r.path,harness+'/'+r.path,'coordination/guest-api-harness-v3/'+r.path,r.sha256);}
const priorFile='F:/VisibleMedicine/recovery/checkpoints/20261025-public-search-startup-source/SOURCE_SUPPLEMENT.json';
assert.equal(sha(read(priorFile)),'ef2df5bdc7ec1e37ba62fabc1b67b887df7d1dad7a46c6038659425d169cff25');
const prior=json(priorFile);
function verify(){assert.equal(sha(read(sourceFile)),sourceSha);assert.equal(sha(read(verificationFile)),verificationSha);for(const r of files)assert.equal(sha(read(r.source)),r.sha256);const i=json('CURRENT_CHECKPOINT.json');assert.deepEqual(i.activeWork.current.activeExecutionSessions,[]);assert.equal(i.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.equal(i.goal.requirements,71);assert.equal(i.goal.optionalIdeas,8);}
verify();
const directory='F:/VisibleMedicine/recovery/checkpoints/20261025-guest-core-source',target=directory+'-supplement';
assert(!fs.existsSync(directory));fs.mkdirSync(directory,{recursive:true});
const lookup=new Map(files.map(r=>[r.path,r.source])),bytes=files.reduce((n,r)=>n+r.bytes,0);
const proof={wholeCurrentRoots:9,wholeCurrentCases:51,fullTypeRoots:2662,fullTypeFiles:6220,diagnostics:0,actualStockProductionArtifacts:1142,completeBothProductionModuleInverses:true,guestCoreNegativeRequestCriteriaVerified:true,framework404ExceptionsDisclosed:true,all1816ProtectedInputsUnchanged:true,anonymousIdentityProvisioningNotIntroduced:true,schemaSqlAuthAccessAndRateAlgorithmOtherwiseUnchanged:true,ownerPreviewChanged:false,installed:false,clinicalApproval:false,publicDeployment:false,wholeStockSuitePassing:false,original316FailuresAnd3SkipsUnadjusted:true,incrementalOnly:true};
const result=backup({root:target,repo:'F:/VisibleMedicine/history/website-work/github-guest-core-source-20261025.git',branch:'backup/guest-core-source-20261025',files:files.map(({source,...r})=>r),bytesFor:p=>read(lookup.get(p)),sourceIdentity:{candidateReceiptSha256:sourceSha,previousFilteredSupplementHead:prior.head},scope:'Incremental first-party guest core-prerequisite source recovery only. Overlay the seven website source paths on the exact retained local predecessor; selected checking recipes require their earlier local helpers and receipts. Baseline and prior source supplements remain required. Raw QA, local databases, inspector responses, private configuration/references/decisions, generated medical and Review records, scans/masks/identifiers, models/assets, dependencies, runtime, source receipts containing medical records and canonical/native ancestry are excluded. Not a complete private, runnable or whole-project backup.',proof,verifySource:verify});
const receipt=target+'/github-backup.json';
const supplement={schema:'vm-filtered-source-supplement/1',at:new Date().toISOString(),receipt,sha256:sha(read(receipt)),branch:result.branch,head:result.head,tree:result.tree,selectedPaths:files.length,restoredPaths:result.restoredPaths,selectedBytes:bytes,independentFetchAllPathBytesRestoreAndStrictIntegrityVerified:true,requiresPriorSupplement:{path:priorFile,sha256:sha(read(priorFile)),branch:prior.branch,head:prior.head},exactLocalBaselineRequired:true,rawMedicalQaPrivateOrGeneratedSourceDataUploaded:false,incrementalOnly:true,wholePrivateOrRunnableBackup:false};
fs.writeFileSync(directory+'/SOURCE_SUPPLEMENT.json',JSON.stringify(supplement,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({supplement:directory+'/SOURCE_SUPPLEMENT.json',sha256:sha(read(directory+'/SOURCE_SUPPLEMENT.json')),branch:result.branch,head:result.head,tree:result.tree,selected:files.length,restored:result.restoredPaths,bytes}));
