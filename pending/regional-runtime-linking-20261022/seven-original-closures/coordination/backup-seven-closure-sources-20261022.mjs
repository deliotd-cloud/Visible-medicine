// Filtered authored source recovery only; never canonical ancestry/private assets.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const current=json('CURRENT_CHECKPOINT.json').activeWork.current;
const sourcePath=current.sourceReceipt,source=json(sourcePath);assert.equal(sha(read(sourcePath)),current.sourceReceiptSha256);
const typesPath='F:/VisibleMedicine/staging/20261022-final-closure-verification/types-current/TERMINAL.json';
const retryPath='F:/VisibleMedicine/staging/20261022-final-loading-history-closures/native-current/TERMINAL.json';
const types=json(typesPath),retry=json(retryPath);
for(const check of [types,retry]){assert.equal(check.code,0);assert.deepEqual(check.sourceDrift,[]);assert.equal(check.sourceReceiptSha256,current.sourceReceiptSha256);}
assert(retry.counts.pass>0&&retry.counts.fail===0&&retry.counts.skipped===0&&retry.counts.cancelled===0);
const firstPaths=['F:/VisibleMedicine/staging/20261022-seven-final-source-closures/native-current/TERMINAL.json','F:/VisibleMedicine/staging/20261022-loading-count-and-tour-closure/native-current/TERMINAL.json'];
const first=firstPaths.map(json);assert.deepEqual(first.map(run=>[run.counts.tests,run.counts.pass,run.counts.fail]),[[34,33,1],[78,75,3]]);
const built=json('F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/BUILT_SOURCE.json');
const product=rows=>rows.filter(row=>!row.path.startsWith('tests/')).sort((a,b)=>a.path.localeCompare(b.path));assert.deepEqual(product(source.sourceRows),product(built.sourceRows));
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-runtime-regression-continuation-source-backup/github-backup.json';
assert.equal(sha(read(parentPath)),'8139c0bfa088e0b410b4b29407a909f52a00af6b0987ad5ca679e83f67b65349');
const parent=json(parentPath),parentRepo='F:/VisibleMedicine/history/website-work/github-runtime-regression-continuation-20261022.git';
assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const inherited=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const destinations=new Map(inherited.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));
for(const row of inherited.files)assert.equal(sha(read(destinations.get(row.path))),row.sha256);
const prefix='pending/regional-runtime-linking-20261022/seven-original-closures/';
function add(from,to){
 assert(/\.(?:mjs|ts|raw)$/.test(from)&&!from.endsWith('.json.raw'));
 assert(!/\/(?:\.local|node_modules|\.git)\//.test(from));
 const bytes=read(from);assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);assert(!destinations.has(prefix+to));destinations.set(prefix+to,from);
}
function walk(directory,relative){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  assert(!entry.isSymbolicLink());const from=directory+'/'+entry.name,to=relative+'/'+entry.name;
  if(entry.isDirectory())walk(from,to);
  else if(/\.(?:mjs|ts|raw)$/.test(from)&&!from.endsWith('.json.raw'))add(from,to);
 }
}
const packages=['20261022-current-ui-final-closures','20261022-limb-urinary-final-closures','20261022-orbital-radial-final-closures',
 '20261022-tour-refusal-comparison','20261022-loading-current-admission-count','20261022-loading-direct-consumers',
 '20261022-loading-history-followup','20261022-loading-head-live-roles','20261022-loading-ui-consumer-closures'];
for(const name of packages){
 const base='F:/VisibleMedicine/staging/'+name;assert(fs.existsSync(base));
 for(const dir of ['CODE','RAW','PRE_UI','PRE_FIX','FIRST_CODE','EVIDENCE'])if(fs.existsSync(base+'/'+dir))walk(base+'/'+dir,name+'/'+dir);
 for(const entry of fs.readdirSync(base,{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.mjs'))add(base+'/'+entry.name,name+'/'+entry.name);
}
for(const name of ['prepare-current-ui-final-closures-20261022.mjs','prove-current-ui-final-closures-20261022.mjs',
 'prepare-seven-final-closures-20261022.mjs','prepare-tour-refusal-comparison-20261022.mjs','prove-tour-refusal-comparison-20261022.mjs',
 'prove-tour-refusal-ui-composition-20261022.mjs','integrate-loading-count-tour-closures-20261022.mjs',
 'integrate-final-loading-history-closures-20261022.mjs','prepare-final-closure-verification-20261022.mjs',
 'backup-seven-closure-sources-20261022.mjs','checkpoint-seven-closures-20261022.mjs'])add(path.resolve(name),'coordination/'+name);
const files=[...destinations].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{
 assert.equal(sha(read(sourcePath)),current.sourceReceiptSha256);
 for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
 for(const row of files)assert.equal(sha(read(destinations.get(row.path))),row.sha256,row.path);
};
backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-seven-closures-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-seven-closures-20261022.git',branch:'backup/seven-closures-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:relative=>read(destinations.get(relative)),verifySource,
 sourceIdentity:{installedWebsite:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',installedReview:current.installedReview,isolatedReview:source.review},
 scope:'Inherited selected authored source plus exact seven original failure corrections, current loading-bound test-role closures, complete preimages and reproducible source proof scripts. Product graph remains byte-exact to the built isolated loading-bound candidate. Generated metadata/fixtures, logs/media, held assets, scans/models/masks, DB/env/private decisions/references and canonical ancestry remain local. Not full/private/runnable recovery or preview installation.',
 proof:{sourceReceiptSha256:current.sourceReceiptSha256,sourcePaths:source.sourcePaths,nonTestProductBytesChanged:0,originalV6AndIntermediateFailuresRetained:true,firstFocusedCounts:first.map(run=>run.counts),finalFocusedCounts:retry.counts,fullTypesPassed:true,currentValidatorOrPinChanged:false,normalPreviewExplicitlyUnchanged:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,privateDataBackup:false,runnableProjectRecovery:false}});
