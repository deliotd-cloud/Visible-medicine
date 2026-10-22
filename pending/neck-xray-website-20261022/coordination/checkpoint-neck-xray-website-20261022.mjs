// Coherent isolated source checkpoint and independently verified filtered backup.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-neck-xray-website-candidate',receipt=stage+'/SOURCE_V2.json',source=json(receipt),site=source.website;
const terminalPath=stage+'/verification-v2/TERMINAL.json',terminal=json(terminalPath),first=json(stage+'/verification/TERMINAL.json');
assert.equal(terminal.code,0);assert(terminal.allNamedChecksPassed);assert.equal(terminal.sourceReceiptSha256,sha(read(receipt)));assert.deepEqual(terminal.sourceDrift,[]);assert.deepEqual(terminal.priorSourceDrift,[]);
assert.equal(source.sourcePaths,6154);assert.equal(source.atlasHead,'389bd0ca846a42c7f21055f55904bcf5df81a09f');assert.equal(source.review,'2c8e263eb4bbd04120eb79560314f372a10846f6fd5616477bde18a42e9f7ef3');
const priorNative=first.commands.find(row=>row.label==='current-native');assert.deepEqual(priorNative.counts,{tests:178,pass:177,fail:1,cancelled:0,skipped:0,todo:0});
assert.equal(first.commands.find(row=>row.label==='original-current-native').counts.pass,41);
assert.equal(terminal.commands.find(row=>row.label==='corrected-integration').counts.pass,1);
const verify=()=>{for(const row of source.sourceRows)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');};verify();
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-neck-xray-website-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
const changed=new Set([...source.changedPaths,...source.addedPaths]);
for(const p of changed){const to=path.resolve(directory,'changed-source',p);assert(to.startsWith(path.resolve(directory,'changed-source')+path.sep));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+p,to);}
for(const p of ['SOURCE.json','SOURCE_V2.json','SOURCE_IMPORT.json','DELIVERY_ADMISSION.json','RUNTIME_EXPORT.json','COMPATIBILITY_RESTORE.json','VERIFY_PREFLIGHT_REFUSAL.json','HANDOFF_HASH_PREFLIGHT_REFUSAL.json'])fs.copyFileSync(stage+'/'+p,directory+'/'+p);
fs.copyFileSync('F:/VisibleMedicine/staging/20261022-neck-xray-delivery-check-proposal/CORRECTION_HANDOFF.md',directory+'/worker-correction-handoff.md');
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-review-return-refresh-source-backup/github-backup.json',parent=json(parentPath);
assert.equal(sha(read(parentPath)),'c604701128ececf53b60b3f6472f9b259a45b851ef1977b62ac2bef3b89b4202');assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const parentRepo='F:/VisibleMedicine/history/website-work/github-review-return-refresh-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));for(const row of manifest.files)assert.equal(sha(read(selected.get(row.path))),row.sha256);
const prefix='pending/neck-xray-website-20261022/';
function add(from,to){const bytes=read(from);assert(/\.(?:mjs|ts|raw)$/.test(from));assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);assert(!selected.has(prefix+to));selected.set(prefix+to,from);}
for(const p of ['scripts/import-clinical-review.mjs','scripts/check-anatomy-coverage.mjs','lib/anatomy-coverage-view.ts','lib/atlas-delivery-policy.ts',
 'tests/current-atlas-delivery.test.mjs','tests/atlas-neck-landmark-xray.test.mjs','tests/atlas-neck-xray-delivery-transition.test.mjs',
 'tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw'])add(site+'/'+p,'website/'+p);
for(const p of ['build-neck-xray-runtime-20261022.mjs','prepare-neck-xray-website-20261022.mjs','import-neck-xray-website-20261022.mjs',
 'admit-neck-xray-delivery-20261022.mjs','verify-neck-xray-website-20261022.mjs','restore-neck-xray-review-compatibility-20261022.mjs',
 'finalize-neck-xray-website-20261022.mjs','checkpoint-neck-xray-website-20261022.mjs'])add(path.resolve(p),'coordination/'+p);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-neck-xray-website-source-backup';let saved,backupFailure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-neck-xray-website-20261022.git',branch:'backup/neck-xray-website-20261022',
 parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{websiteReceiptSha256:sha(read(receipt)),atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review,installedAtlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'},
 scope:'Inherited filtered source plus staged website producer/source-epoch declarations, exact original current-delivery test, additive source-bound neck X-ray integration tests and local coordination source. Generated binding/pin/coverage JSON, compiled runtime/viewer payloads, private records/DB/env/decisions/references, held sources/assets, scans/models/masks, article assets/media, raw logs and canonical ancestry remain local. Not full/private/runnable recovery or installation.',
 proof:{sourcePaths:source.sourcePaths,review:source.review,boundInputs:1726,importedSources:1560,viewerFiles:46,viewerPackages:22,
 focused:{originalCurrentDeliveryPass:41,firstCurrentRun:{tests:178,pass:177,fail:1},correctedIntegrationPass:1,unchangedProductionAndOtherTests:true,newCombined178PassRun:false},
 fullTypesPassed:true,productionBuildPassed:true,stockSourceRuntimeReviewModelPolicyCoverageCatalogChecksPassed:true,models:137,modelPaths:144,modelBytes:199072480,
 newBrowserAcceptance:false,wholeSuitePassing:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});}
catch(error){backupFailure={at:new Date().toISOString(),message:error.message,independentlyVerified:false,automaticRetry:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(backupFailure,null,2)+'\n',{flag:'wx'});}
verifySource();const backupReceipt=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:backupReceipt,receiptSha256:sha(read(backupReceipt)),head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,
 independentlyVerified:Boolean(saved),wholePrivateOrRunnableBackup:false,...(backupFailure?{failure:backupFailure}:{})};
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Coherent source-bound neck X-ray learner/runtime/Review import with all pending UI changes preserved.',
 sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,website:site,atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review,
 runtime:{receipt:stage+'/RUNTIME_EXPORT.json',sha256:sha(read(stage+'/RUNTIME_EXPORT.json'))},import:{receipt:stage+'/SOURCE_IMPORT.json',sha256:sha(read(stage+'/SOURCE_IMPORT.json'))},
 verification:{receipt:terminalPath,sha256:sha(read(terminalPath)),firstReceipt:stage+'/verification/TERMINAL.json',firstReceiptSha256:sha(read(stage+'/verification/TERMINAL.json'))},sourceBackup,
 limits:'177 unchanged cases passed in the178-case run; the sole faulty new test was corrected and passes separately with exact unchanged-production/all-other-test closure. This is not a new combined178-pass or whole-suite/browser/clinical acceptance claim. Original source-graph and malformed handoff-hash refusals are retained locally. The intermediate topic-shape failure is worker-reported; its full raw output was not saved, as explicitly recorded in the local correction handoff.',
 all71RequirementsAndEightIdeasPreserved:true,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 next:'Keep normal preview unchanged. The coherent staged Website6154/Atlas389/Review2c8 candidate includes the pending UI and three source-bound X-ray drafts but is not installed. Remaining historical/current-source consumers and signed-in desktop acceptance are not broadly certified. Continue source-backed learning and existing3D/CT/MRI work; no clinical-signoff stall, private upload, public deployment, fee, specialist-mask or desktopPACS edit.'};
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;assert.equal(current.sourceReceipt,source.previousSource);assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),currentCandidate:site,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourceBackup,
 neckXrayWebsite:{state:'Coherent and verified in isolation; not installed',source:source.atlasHead,review:source.review,sourcePaths:source.sourcePaths,verification:result.verification},next:result.next,beforeFurtherWork:result.next,pendingWorkers:[]});
Object.assign(current.pendingNeckLandmarkXray,{websiteImportedInIsolation:true,websiteSourceReceipt:receipt,review:source.review,canonicalInstalled:false});
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:current.checkpointSha256,sourceBackup,sourcePaths:source.sourcePaths,review:source.review,ownerPreviewChanged:false}));
