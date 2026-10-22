// Selected authored sources/proposals only, never a runnable/private-data backup.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-review-queue-accessibility-successor',sourcePath=stage+'/SOURCE.json',source=json(sourcePath);
assert.equal(sha(read(sourcePath)),'c70dfa42798aba75ae16e37d8bb9c96765bc71ff00642db65c4c0814fc86c6b0');
const native=json(stage+'/native-inbox/TERMINAL.json'),types=json(stage+'/types-current/TERMINAL.json');
for(const result of [native,types]){assert.equal(result.code,0);assert.deepEqual(result.sourceDrift,[]);assert.equal(result.sourceReceiptSha256,sha(read(sourcePath)));}
assert(native.counts.pass>=48&&native.counts.fail===0&&native.counts.skipped===0&&native.counts.cancelled===0);
const wide=json('F:/VisibleMedicine/staging/20261022-final-closure-verification/native-selected/TERMINAL.json'),retry=json('F:/VisibleMedicine/staging/20261022-final-two-epoch-comparisons/native-current/TERMINAL.json');
assert.equal(wide.counts.tests,360);assert.equal(wide.counts.fail,2);assert.equal(retry.counts.pass,13);assert.equal(retry.code,0);
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-seven-closures-source-backup/github-backup.json';
assert.equal(sha(read(parentPath)),'98252869fbbf085761e3098c190a66a4baaac927394aafdac162320e5a22bd88');
const parent=json(parentPath),parentRepo='F:/VisibleMedicine/history/website-work/github-seven-closures-20261022.git';assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));
for(const row of manifest.files)assert.equal(sha(read(selected.get(row.path))),row.sha256);
const prefix='pending/review-queue-accessibility-20261022/';
function add(from,to){assert(/\.(?:mjs|ts|tsx|raw)$/.test(from)&&!from.endsWith('.json.raw'));assert(!/\/(?:\.local|node_modules|\.git)\//.test(from));const b=read(from);assert.deepEqual(Buffer.from(b.toString('utf8')),b);assert(!selected.has(prefix+to));selected.set(prefix+to,from);}
function walk(directory,relative){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){assert(!entry.isSymbolicLink());const from=directory+'/'+entry.name,to=relative+'/'+entry.name;if(entry.isDirectory())walk(from,to);else if(/\.(?:mjs|ts|tsx|raw)$/.test(from)&&!from.endsWith('.json.raw'))add(from,to);}}
for(const name of ['20261022-final-two-epoch-comparisons','20261022-head-pane-accessible-labels','20261022-review-queue-accessible-context','20261022-inbox-useid-test-adapters']){
 const base='F:/VisibleMedicine/staging/'+name;
 for(const dir of ['CODE','RAW','PRE_FIX','PROOF'])if(fs.existsSync(base+'/'+dir))walk(base+'/'+dir,name+'/'+dir);
 for(const entry of fs.readdirSync(base,{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.mjs'))add(base+'/'+entry.name,name+'/'+entry.name);
}
add('F:/VisibleMedicine/staging/20261022-inbox-ui-specimen/PROVER.before-config-fix.mjs','specimen/PROVER.before-config-fix.mjs');
for(const name of ['prepare-head-pane-labels-20261022.mjs','prove-head-pane-labels-20261022.mjs','verify-inbox-ui-specimen-20261022.mjs',
 'prepare-final-two-epoch-overlay-20261022.mjs','prepare-review-queue-accessibility-successor-20261022.mjs','prepare-review-queue-checks-20261022.mjs',
 'backup-review-queue-accessibility-20261022.mjs','checkpoint-review-queue-accessibility-20261022.mjs'])add(path.resolve(name),'coordination/'+name);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);};
backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-review-queue-a11y-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-review-queue-a11y-20261022.git',branch:'backup/review-queue-a11y-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:relative=>read(selected.get(relative)),verifySource,
 sourceIdentity:{installedWebsite:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',isolatedReview:source.review},
 scope:'Inherited selected source plus exact two regression repairs, queue accessibility component/regression and seven original-assertion-preserving test adapters, raw preimages and reproducible source proof/orchestration. Separate pane-label proposal is included but unapplied. Generated bindings/fixtures, held source assets, scans/models/masks, private DB/env/decisions/references, logs/media and canonical ancestry remain local. Not whole/private/runnable recovery or preview installation.',
 proof:{sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,wideOriginalActualCounts:wide.counts,exactFailedConsumerRetryCounts:retry.counts,inboxActualCounts:native.counts,fullTypesPassed:true,changedProductPaths:source.changedProductPaths,
 reviewBindingUnchanged:true,headPaneLabelProposalUnapplied:true,sourceOnlySpecimen48Passed:true,firstSpecimenConfigFailurePreserved:true,normalPreviewExplicitlyUnchanged:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,privateDataBackup:false,runnableProjectRecovery:false}});
