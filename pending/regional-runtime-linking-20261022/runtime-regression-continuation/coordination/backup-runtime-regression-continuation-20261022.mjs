import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-remaining-runtime-admissions';
const sourcePath=stage+'/APPLIED_SOURCE.json',source=json(sourcePath);
assert.equal(sha(read(sourcePath)),'d72789221c1cbdb0686e65a6316fe42c378f4cddc6e4adfd2b556ad7b79f2f8e');
const combined=json('F:/VisibleMedicine/staging/20261022-loading-followup-sources/native-combined/TERMINAL.json');
const retry=json('F:/VisibleMedicine/staging/20261022-closed56-followup-consumers/native-current/TERMINAL.json');
const current=json(stage+'/native-current/TERMINAL.json'),types=json(stage+'/types-current/TERMINAL.json');
assert.equal(combined.counts.tests,65);assert.equal(combined.counts.pass,63);assert.equal(combined.counts.fail,2);
assert.equal(retry.counts.pass,8);assert.equal(retry.counts.fail,0);
for(const result of [retry,current,types]){assert.equal(result.code,0);assert.deepEqual(result.sourceDrift,[]);}
for(const result of [retry,current]){assert.equal(result.counts.skipped,0);assert.equal(result.counts.cancelled,0);}
assert.equal(current.sourceReceiptSha256,sha(read(sourcePath)));assert.equal(types.sourceReceiptSha256,sha(read(sourcePath)));
const built=json('F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/BUILT_SOURCE.json');
const product=rows=>rows.filter(row=>!row.path.startsWith('tests/')).sort((a,b)=>a.path.localeCompare(b.path));
assert.deepEqual(product(source.sourceRows),product(built.sourceRows),'Real product build still applies byte for byte');
const initial=json('F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/TEST_READY_SOURCE.json');
const originalRows=new Map(initial.sourceRows.map(row=>[row.path,row.sha256]));
const delta=source.sourceRows.filter(row=>originalRows.get(row.path)!==row.sha256);
assert.equal(delta.length,24);assert(delta.every(row=>row.path.startsWith('tests/')));
assert.equal(delta.filter(row=>!originalRows.has(row.path)).length,2);
for(const row of initial.sourceRows)assert(source.sourceRows.some(current=>current.path===row.path));
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-loading-binding-repair-source-backup/github-backup.json';
assert.equal(sha(read(parentPath)),'c9e68ccd4b4cb38de885882334d55fb9dc1f33cace95d514baffd0e4695225f3');
const parent=json(parentPath),parentRepo='F:/VisibleMedicine/history/website-work/github-loading-binding-repair-20261022.git';
assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const inherited=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const destinations=new Map(inherited.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));
for(const row of inherited.files)assert.equal(sha(read(destinations.get(row.path))),row.sha256);
const prefix='pending/regional-runtime-linking-20261022/runtime-regression-continuation/';
function add(from,to){
 assert(/\.(?:mjs|ts|raw)$/.test(from)&&!from.endsWith('.json.raw'));
 assert(!/\/(?:\.local|node_modules|\.git)\//.test(from));
 const bytes=read(from);assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);
 assert(!destinations.has(prefix+to));destinations.set(prefix+to,from);
}
const walk=(directory,relative)=>{
 for(const e of fs.readdirSync(directory,{withFileTypes:true})){
  assert(!e.isSymbolicLink());const from=directory+'/'+e.name,to=relative+'/'+e.name;
  if(e.isDirectory())walk(from,to);
  else if(/\.(?:mjs|ts|raw)$/.test(from)&&!from.endsWith('.json.raw'))add(from,to);
 }
};
const packages=['20261022-loading-followup-sources','20261022-lecture-context-source-repair','20261022-vascular-guard-composition',
 '20261022-closed56-followup-consumers','20261022-remaining-runtime-admissions'];
for(const name of packages){
 const base='F:/VisibleMedicine/staging/'+name;
 for(const dir of ['CODE','RAW','PREVIOUS-CODE','PRE_FIX'])if(fs.existsSync(base+'/'+dir))walk(base+'/'+dir,name+'/'+dir);
 for(const file of ['PROVE_SOURCE.mjs','SOURCE_INVERSE.mjs','SOURCE_LOADER.mjs','MAIN_NATIVE_RUNNER.before-types.mjs'])if(fs.existsSync(base+'/'+file))add(base+'/'+file,name+'/'+file);
}
for(const name of ['prepare-loading-followup-sources-20261022.mjs','apply-loading-followup-sources-20261022.mjs','apply-isolated-test-overlay.mjs',
 'verify-isolated-source-native.mjs','finish-runtime-admission-checks-20261022.mjs',
 'backup-runtime-regression-continuation-20261022.mjs','checkpoint-runtime-regression-continuation-20261022.mjs'])add(path.resolve(name),'coordination/'+name);
const files=[...destinations].map(([relative,from])=>({path:relative,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{
 assert.equal(sha(read(sourcePath)),current.sourceReceiptSha256);
 for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
 for(const row of files)assert.equal(sha(read(destinations.get(row.path))),row.sha256,row.path);
 assert.equal(json(stage+'/types-current/TERMINAL.json').code,0);
};
backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-runtime-regression-continuation-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-runtime-regression-continuation-20261022.git',
 branch:'backup/runtime-regression-continuation-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:relative=>read(destinations.get(relative)),verifySource,
 sourceIdentity:{installedWebsite:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',isolatedReview:source.review},
 scope:'Inherited selected authored sources plus24 explicitly overlaid test/helper paths, their original preimages, rejected first proposals and named reproducible proof/orchestration sources. Product byte graph is unchanged from the verified isolated loading-bound build. Generated metadata/fixtures, raw logs/media, held local assets, scans/models/masks, private records/DB/env/decisions/references and canonical Git ancestry remain local. Not whole/private/runnable recovery or installation.',
 proof:{sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,overlaidTestHelperPaths:24,nonTestProductBytesChanged:0,
 initialCombinedActualCounts:combined.counts,exactFailedConsumerRetryCounts:retry.counts,newAdmissionActualCounts:current.counts,fullTypesPassed:true,
 original65AndV6FailuresRetained:true,firstRejectedRootOverrideAndReducedShoulderCoveragePreserved:true,
 bothOriginalCraniofacialRuntimeEmissionsRetained:true,currentValidatorOrPinChanged:false,
 normalPreviewExplicitlyUnchanged:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,privateDataBackup:false,runnableProjectRecovery:false}});
