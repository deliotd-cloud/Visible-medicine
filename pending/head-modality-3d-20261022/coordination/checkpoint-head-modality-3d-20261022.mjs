import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-modality-3d-context-successor',receipt=root+'/SOURCE.json',source=json(receipt),site=source.website;
assert.equal(sha(read(receipt)),'b9c972cf68305f7f621ef12e3db1c421389439d78ee7716e7373b0789c8241a7');
assert.equal(source.sourcePaths,6155);assert.equal(source.review,'2c8e263eb4bbd04120eb79560314f372a10846f6fd5616477bde18a42e9f7ef3');
const nativePath=root+'/native-integration/TERMINAL.json',qualityPath=root+'/quality-build/TERMINAL.json',browserPath=root+'/browser-specimen/OBSERVED.json';
const native=json(nativePath),quality=json(qualityPath),browser=json(browserPath);
assert.deepEqual(native.counts,{tests:91,pass:91,fail:0,cancelled:0,skipped:0,todo:0});assert.equal(native.code,0);assert.equal(quality.code,0);
assert.deepEqual(native.sourceDrift,[]);assert.deepEqual(quality.sourceDrift,[]);assert(quality.reviewBindingUnchanged);
assert.equal(browser.sourceReceiptSha256,sha(read(receipt)));assert(browser.allNamedCasesPassed&&browser.ownedTabClosed&&browser.ownedServerStopped);
const toolingPath='F:/VisibleMedicine/staging/20261022-head-modality-native-tools/TOOLING_CHECKS.json';assert.equal(json(toolingPath).counts.pass,20);
const verify=()=>{for(const row of source.sourceRows)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');};verify();
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-head-modality-3d-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
for(const p of ['components/AtlasWorkspaceNavigation.tsx','tests/atlas-workspace-simplification.test.ts','tests/atlas-workspace-3d-context.test.mjs']){
 const to=directory+'/source/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+p,to);}
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-neck-xray-website-source-backup/github-backup.json',parent=json(parentPath);
assert.equal(sha(read(parentPath)),'8bb337090fab4fea0ec752368b95d83a2687f1ad74aabc860c2828eb62ec76d0');assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const parentRepo='F:/VisibleMedicine/history/website-work/github-neck-xray-website-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));for(const row of manifest.files)assert.equal(sha(read(selected.get(row.path))),row.sha256);
const proposal='F:/VisibleMedicine/staging/20261022-head-modality-3d-context-proposal',prefix='pending/head-modality-3d-20261022/';
function add(from,to){const bytes=read(from);assert(/\.(?:mjs|ts|tsx|js|jsx)$/.test(from));assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);assert(!selected.has(prefix+to));selected.set(prefix+to,from);}
for(const p of ['components/AtlasWorkspaceNavigation.tsx','tests/atlas-workspace-simplification.test.ts','tests/atlas-workspace-3d-context.test.mjs'])add(site+'/'+p,'website/'+p);
for(const p of ['components/AtlasWorkspaceNavigation.tsx','tests/atlas-workspace-simplification.test.ts'])add(proposal+'/RAW/'+p,'RAW/'+p);
const helpers=['prepare-unbound-ui-successor.mjs','verify-isolated-source-native.mjs','build-unbound-ui-successor.mjs','native-atlas-environment-20261022.mjs'];
for(const p of helpers){add(path.resolve(p),'coordination/'+p);add('F:/VisibleMedicine/staging/20261022-head-modality-native-tools/RAW/'+p,'coordination/RAW/'+p);}
for(const p of ['test-native-atlas-receipt-20261022.mjs','prepare-head-modality-3d-20261022.mjs','serve-head-modality-3d-20261022.mjs','checkpoint-head-modality-3d-20261022.mjs',
 'qa-head-modality-3d-20261022/entry.jsx','qa-head-modality-3d-20261022/next-link.jsx','qa-head-modality-3d-20261022/next-navigation.js','qa-head-modality-3d-20261022/check-browser.js'])add(path.resolve(p),'coordination/'+p);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-head-modality-3d-source-backup';let saved,backupFailure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-head-modality-3d-20261022.git',branch:'backup/head-modality-3d-20261022',
 parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{websiteReceiptSha256:sha(read(receipt)),atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review},
 scope:'Inherited filtered source plus staged CT/MRI-to-existing3D modality navigation, additive tests and exact component/test/tool preimages with local synthetic QA/coordination code. Generated bindings/pins/coverage JSON, compiled runtime/viewer payloads, private records/accounts/DB/env/decisions/references, held source/assets, scans/models/masks, raw logs/media and canonical ancestry remain local. Not full/private/runnable recovery, model/scan browser acceptance, installation or deployment.',
 proof:{focusedCounts:native.counts,sourceToolingCases:20,fullTypesPassed:true,productionBuildPassed:true,reviewBindingUnchanged:true,browserCases:browser.cases,
 signedInAcceptance:false,nativeScanModelRenderingTested:false,wholeSuitePassing:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});}
catch(error){backupFailure={at:new Date().toISOString(),message:error.message,independentlyVerified:false,automaticRetry:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(backupFailure,null,2)+'\n',{flag:'wx'});}
verifySource();const savedPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:savedPath,receiptSha256:sha(read(savedPath)),head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,independentlyVerified:Boolean(saved),wholePrivateOrRunnableBackup:false,...(backupFailure?{failure:backupFailure}:{})};
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Top modality tab preserves verified CT/MRI head structure or complete authored tour step when opening the existing3D Atlas, with fail-closed explicit browse fallback.',
 sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,website:site,atlas:source.atlasHead,review:source.review,sourceBackup,
 native:{path:nativePath,sha256:sha(read(nativePath)),counts:native.counts},quality:{path:qualityPath,sha256:sha(read(qualityPath))},browser:{path:browserPath,sha256:sha(read(browserPath)),cases:browser.cases,syntheticOnly:true},
 tooling:{path:toolingPath,sha256:sha(read(toolingPath)),cases:20,explicitFrozenAtlasSourceAndCanonicalFallback:true},
 full71AndEightIdeasPreserved:true,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 next:'Keep normal preview unchanged. Selected Website6155/Atlas389/Review2c8 remains staged. Continue substantive source-backed learning and CT/MRI/existing3D integration, plus remaining source-epoch consumer closure and signed-in desktop acceptance when permitted. Do not infer spatial registration, release approval or full-suite success; preserve all71/eight roadmap, private specialist masks, independent access and desktopPACS boundary.'};
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;assert.equal(current.sourceReceipt,source.previousSource);assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),currentCandidate:site,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourceBackup,
 headModality3D:{state:'Verified in isolation; not installed',native:result.native,browser:result.browser,reviewBindingUnchanged:true},pendingWorkers:[],next:result.next,beforeFurtherWork:result.next});
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:current.checkpointSha256,sourceBackup,sourcePaths:source.sourcePaths,previewChanged:false}));
