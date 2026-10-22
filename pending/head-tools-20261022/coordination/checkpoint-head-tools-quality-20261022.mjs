// Recoverable, source-filtered checkpoint; never installs into the owner's preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-tools-bound-successor',admission='F:/VisibleMedicine/staging/20261022-head-tools-consumer-admission';
const sourcePath=admission+'/APPLIED_SOURCE.json',source=json(sourcePath);assert.equal(sha(read(sourcePath)),'52a09799b2f12607f66bcf750d750531ce7119949717a525ff673d105e836f85');
const qualityPath=root+'/quality/TERMINAL.json',quality=json(qualityPath),browserPath=root+'/browser-specimen-tsx/BROWSER_RESULT.json',browser=json(browserPath);
assert.equal(quality.code,0);assert.equal(quality.allBuildStepsPassed,true);assert.equal(source.nonTestProductBytesChanged,0);
const nativePath=admission+'/native-current/TERMINAL.json',typesPath=admission+'/types-current/TERMINAL.json',native=json(nativePath),types=json(typesPath);
for(const result of [native,types]){assert.equal(result.code,0);assert.deepEqual(result.sourceDrift,[]);assert.equal(result.sourceReceiptSha256,sha(read(sourcePath)));}
assert.equal(native.counts.pass,371);assert.equal(native.counts.fail,0);assert.equal(native.counts.skipped,0);assert.equal(native.counts.cancelled,0);
assert.equal(browser.reclaimedToolbarPixels,33.296875);assert.equal(browser.ownedTabClosed,true);assert.equal(browser.ownedServerStopped,true);
const product=rows=>rows.filter(row=>!row.path.startsWith('tests/')).sort((a,b)=>a.path.localeCompare(b.path));assert.deepEqual(product(source.sourceRows),product(quality.sourceRows),'All actual successful product build inputs stay exact');
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-review-queue-quality-source-backup/github-backup.json',parent=json(parentPath);
assert.equal(sha(read(parentPath)),'3a7a37b489510bbb52498aca80518fc65ec156909b8b2157bbe5a39849980224');assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const parentRepo='F:/VisibleMedicine/history/website-work/github-review-queue-quality-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));
for(const row of manifest.files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);
const prefix='pending/head-tools-20261022/';
function add(from,to){assert(/\.(mjs|ts|tsx|jsx|raw)$/.test(from)&&!from.endsWith('.json.raw'));assert(!/\/(\.local|node_modules|\.git)\//.test(from));const b=read(from);assert.deepEqual(Buffer.from(b.toString('utf8')),b);assert(!selected.has(prefix+to));selected.set(prefix+to,from);}
function walk(dir,relative){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){assert(!entry.isSymbolicLink());const from=dir+'/'+entry.name,to=relative+'/'+entry.name;if(entry.isDirectory())walk(from,to);else if(/\.(mjs|ts|tsx|jsx|raw)$/.test(from)&&!from.endsWith('.json.raw'))add(from,to);}}
for(const name of ['20261022-head-toolbar-compact-proposal','20261022-head-tools-role-admission','20261022-head-tools-consumer-admission']){
 const base='F:/VisibleMedicine/staging/'+name;for(const dir of ['CODE','RAW','PREVIOUS'])if(fs.existsSync(base+'/'+dir))walk(base+'/'+dir,name+'/'+dir);
 for(const entry of fs.readdirSync(base,{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.mjs'))add(base+'/'+entry.name,name+'/'+entry.name);
}
add(root+'/COMBINED/components/HeadAtlasViewer.tsx','combined/HeadAtlasViewer.tsx');
add('F:/VisibleMedicine/staging/20261022-head-tools-preparation-refusal/PREPARER.before-exact-label-order.mjs','preparation/PREPARER.before-exact-label-order.mjs');
add(root+'/browser-specimen/SERVER.before-tsx-correction.mjs','specimen/SERVER.before-tsx-correction.mjs');
add(root+'/browser-specimen/entry.jsx','specimen/entry.before-tsx-imports.jsx');
for(const name of ['prepare-head-tools-successor-20261022.mjs','build-head-tools-successor-20261022.mjs','prepare-head-tools-checks-20261022.mjs',
 'serve-head-tools-specimen-20261022.mjs','record-head-tools-browser-20261022.mjs','prepare-head-tools-test-admission-20261022.mjs','prepare-head-tools-final-checks-20261022.mjs',
 'prepare-head-tools-wide-checks-20261022.mjs','checkpoint-head-tools-quality-20261022.mjs','qa-head-tools-20261022/entry.jsx'])add(path.resolve(name),'coordination/'+name);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);};
const saved=backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-head-tools-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-head-tools-20261022.git',branch:'backup/head-tools-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{installedWebsite:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',isolatedReview:source.review},
 scope:'Inherited filtered source plus compact toolbar/pane labels, full preimages, authenticated historical source-role helpers/tests and reproducible local preparation/build/QA/checkpoint scripts. No scans/models/masks, generated binding/pin metadata, held assets, private records/DB/env/decisions/references, raw logs/media or canonical Git ancestry. Not whole/private/runnable recovery or installation.',
 proof:{sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,review:source.review,changedBoundInputs:['components/HeadAtlasViewer.tsx'],realProducerAndViewerBuildPassed:true,fullTypesPassed:true,websiteBuildPassed:true,focusedNative:native.counts,
 firstNative:{tests:354,pass:352,fail:2},originalHistoricalAssertionsPreserved:true,desktopSyntheticToolbarGainPx:33.296875,actualNativeScanBrowserWorkflowTested:false,screenReaderCertification:false,
 ownerPreviewUnchanged:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,wholePrivateOrRunnableBackup:false}});
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-head-tools-source-backup/github-backup.json';
const sourceBackup={receipt:backupPath,receiptSha256:sha(read(backupPath)),head:saved.head,tree:saved.tree,sourcePaths:saved.sourcePaths,restoredPaths:saved.restoredPaths,independentlyVerified:true,wholePrivateOrRunnableBackup:false};
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const next='Keep normal preview unchanged. Compact native CT/MRI toolbar and explicit pane names are isolated, real-producer/build/types/focused-native verified; synthetic desktop controls passed, not a signed-in native scan/AT or release approval. Advance the wider frozen-source regression and remaining full71/eight UI/teaching/linking roadmap. Retain original354/352/2 then371/371 retry separately and historical360/358/2+13/13 receipts. No blanket clinical-signoff stall, public deploy, fee, private upload, specialist-mask or desktopPACS change.';
const result={at:new Date().toISOString(),goalTurnClassification:'progress',sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,review:source.review,
 milestone:'Compact CT/MRI toolbar retains primary tools, moves two secondary locators into existing disclosure, and explicitly names eight pane actions; no clinical/geometry/entitlement changes.',
 checks:Object.fromEntries([['quality',qualityPath],['native',nativePath],['types',typesPath],['browser',browserPath]].map(([name,path])=>[name,{path,sha256:sha(read(path))}])),
 actualNativeCounts:native.counts,firstNative:{path:root+'/native-built/TERMINAL.json',counts:json(root+'/native-built/TERMINAL.json').counts},changedBoundInputs:['components/HeadAtlasViewer.tsx'],sourceBackup,
 previousCheckpoint:current.checkpoint,previousCheckpointSha256:current.checkpointSha256,ownerPreviewChanged:false,canonicalInstalled:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,full71AndEightIdeasPreserved:true,next};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-head-tools-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),currentCandidate:source.website,sourceReceipt:sourcePath,sourceReceiptSha256:result.sourceReceiptSha256,sourcePaths:source.sourcePaths,isolatedReview:source.review,
 sourceBackup,pendingUiProposals:[],pendingWorkers:[],viewerToolsQuality:result.checks,full71AndEightIdeasPreserved:true,next,beforeFurtherWork:next});
if(current.nextViewerSuccessor)Object.assign(current.nextViewerSuccessor,{appliedInIsolation:true,nativeAccepted:true,sourceReceipt:sourcePath,sourceReceiptSha256:result.sourceReceiptSha256,review:source.review});
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:current.checkpointSha256,sourceBackup,native:native.counts,sourcePaths:source.sourcePaths,ownerPreviewChanged:false}));
