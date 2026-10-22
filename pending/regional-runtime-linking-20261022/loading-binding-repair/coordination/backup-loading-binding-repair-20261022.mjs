import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stem='loading-binding-repair',root='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor';
const sourcePath=root+'/TEST_READY_SOURCE.json',source=json(sourcePath);
const terminalPath=root+'/native-loading-binding/TERMINAL.json',terminal=json(terminalPath);
assert.deepEqual(terminal.counts,{tests:7,pass:7,fail:0,cancelled:0,skipped:0,todo:0});
assert.deepEqual(terminal.sourceDrift,[]);assert.equal(source.allBuildStepsPassed,true);
assert.equal(terminal.sourceReceiptSha256,sha(read(sourcePath)));
const parentReceipt='F:/VisibleMedicine/recovery/checkpoints/20261022-terminal-source-continuation-source-backup/github-backup.json';
assert.equal(sha(read(parentReceipt)),'4ad490795e07f207a937d1d242c52dcc79f65d59a1bc9b3a47de05df626f2691');
const parent=json(parentReceipt),parentRepo='F:/VisibleMedicine/history/website-work/github-terminal-source-continuation-20261022.git';
assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const inherited=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const destinations=new Map(inherited.files.map(row=>[row.path,path.dirname(parentReceipt)+'/remote-source-restored/'+row.path]));
for(const row of inherited.files)assert.equal(sha(read(destinations.get(row.path))),row.sha256);
const prefix='pending/regional-runtime-linking-20261022/loading-binding-repair/';
function add(from,relative){
 assert(/\.(?:mjs|ts|tsx|raw)$/.test(from)&&!from.endsWith('.json.raw'),'Authored source only: '+from);
 assert(!/\/(?:\.local|node_modules|\.git)\//.test(from));
 const bytes=read(from);assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);
 const to=prefix+relative;assert(!destinations.has(to),'Create-only selected source: '+to);destinations.set(to,from);
}
function sources(directory,prefixPath){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  assert(!entry.isSymbolicLink());const from=directory+'/'+entry.name,to=prefixPath+'/'+entry.name;
  if(entry.isDirectory())sources(from,to);
  else if(/\.(?:mjs|ts|tsx|raw)$/.test(entry.name)&&!entry.name.endsWith('.json.raw'))add(from,to);
 }
}
const stages=[
 '20261022-median-cubital-runtime-source-closure','20261022-spinal-current-colic-semantic-followup',
 '20261022-native-focus-current-source-followups','20261022-lacrimal-closed50-composition',
 '20261022-closed-epoch-preservation','20261022-vocal-runtime-epoch','20261022-historical-schema-refusals',
];
for(const stage of stages){
 const base='F:/VisibleMedicine/staging/'+stage;
 for(const part of ['CODE','RAW'])if(fs.existsSync(base+'/'+part))sources(base+'/'+part,stage+'/'+part);
 for(const name of ['PROVE_SOURCE.mjs','SOURCE_PROOF.mjs','SOURCE_CLOSURE.mjs','SOURCE_LOADER.mjs'])if(fs.existsSync(base+'/'+name))add(base+'/'+name,stage+'/'+name);
}
for(const part of ['CODE','RAW','ORIGINAL-V6'])sources(root+'/type-source-repair/'+part,'type-source-repair/'+part);
add(root+'/type-source-repair/RETRY_DRIVER.first-refused.mjs','type-source-repair/RETRY_DRIVER.first-refused.mjs');
sources('F:/VisibleMedicine/staging/20261022-review-loading-completeness/CODE','review-loading-completeness/CODE');
add('F:/VisibleMedicine/staging/20261022-current-binder-diagnosis/PREPARER.before-held-assets-allowlist.mjs','diagnostics/PREPARER.before-held-assets-allowlist.mjs');
const scripts=[
 'diagnose-current-binder-20261022.mjs','prepare-review-loading-binding-repair-20261022.mjs','prepare-loading-bound-successor-20261022.mjs',
 'build-loading-bound-successor-20261022.mjs','native-atlas-environment-20261022.mjs','prove-native-atlas-environment-20261022.mjs',
 'prepare-native-focus-source-followups-20261022.mjs','prove-native-focus-source-followups-20261022.mjs',
 'seal-loading-bound-type-failure-20261022.mjs','retry-loading-bound-build-20261022.mjs','verify-loading-binding-repair-20261022.mjs',
 'backup-loading-binding-repair-20261022.mjs','checkpoint-loading-binding-repair-20261022.mjs',
];
for(const name of scripts)add(path.resolve(name),'coordination/'+name);
const files=[...destinations].map(([relative,from])=>({path:relative,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{
 assert.equal(sha(read(sourcePath)),terminal.sourceReceiptSha256);
 for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
 for(const row of files)assert.equal(sha(read(destinations.get(row.path))),row.sha256,row.path);
 assert.equal(json(root+'/quality/types.TERMINAL.json').code,2,'First failure retained');
 assert.equal(json(root+'/quality-retry-type-safe/types.TERMINAL.json').code,0);
 assert.equal(json(root+'/quality-retry-type-safe/website.TERMINAL.json').code,0);
};
backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-'+stem+'-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-'+stem+'-20261022.git',branch:'backup/'+stem+'-20261022',
 parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:name=>read(destinations.get(name)),verifySource,
 sourceIdentity:{installedWebsite:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:source.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',isolatedReview:source.review},
 scope:'Inherited selected authored source plus isolated loading-binding repair tools, original type-test source and correction, route-completeness regression, and seven unapplied source-only repair packages. No generated Review/runtime metadata, private local assets, scans/models/masks, databases/env, saved decisions, raw diagnostic logs/media, article assets or canonical Git ancestry. Not a whole/private/runnable backup or deployment.',
 proof:{sourceReceiptSha256:sha(read(sourcePath)),focusedTerminalSha256:sha(read(terminalPath)),focusedCounts:terminal.counts,sourcePaths:source.sourcePaths,
 actualBinderIdempotence:true,fullTypesAndWebsiteBuildPassed:true,firstTypeFailureAndRefusedCaptureRetainedLocally:true,
 earlierActualRegressionCounts:{tests:329,pass:300,fail:29},earlierRegressionFailuresRetained:true,
 pendingPackagesSourceOnly:true,normalPreviewExplicitlyUnchanged:true,installed:false,wholeSuitePassing:false,
 clinicalApproval:false,spatialRegistration:false,publicDeployment:false,rawCanonicalAncestry:false,privateDataBackup:false,runnableProjectRecovery:false}});
