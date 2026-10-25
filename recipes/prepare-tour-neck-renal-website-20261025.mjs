import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';
const memory=memoryGate(2048),stage='F:/VisibleMedicine/staging/20261025-tour-neck-renal-website',site=stage+'/website';
const parentFile='F:/VisibleMedicine/staging/20261025-verified-navigation-teaching-website/SOURCE_CANDIDATE.json';
assert(!fs.existsSync(stage));assert.equal(hash(parentFile),'62331b7a0ed39f58f1a01eb91c6b82322366b61c41065b3679428768a8e98dbd');
const parent=json(parentFile),rows=new Map(parent.sourceRows.map(r=>[r.path,r]));
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const sets=[
 {root:'F:/VisibleMedicine/staging/20261025-tour-reading-behavior-proposal',sha:'3fa9fd213c0151c0f6c030eeceb83bb4bf424659e0cf04c54a0377e265ac066b',kind:'tour'},
 {root:'F:/VisibleMedicine/staging/20261025-neck-renal-role-proposal',sha:'f86f1eef3f79ce879254b0fd0cb49c7c362c0ed523df4fc1e51c1f95d018628a',kind:'neck-renal'}
];
const edits=[];
for(const s of sets){
 assert.equal(hash(s.root+'/PATCHSET.json'),s.sha);
 for(const r of json(s.root+'/PATCHSET.json').installableFiles){
  const p=s.kind==='tour'?r.path:r.destination;
  edits.push({path:p,from:s.root+(s.kind==='tour'?'/PATCHSET/':'/')+(r.source??p),
   before:s.kind==='tour'?r.baseSha256:rows.get(p)?.sha256??null,
   after:s.kind==='tour'?r.proposalSha256:r.sha256});
 }
}
assert.equal(edits.length,9);assert.equal(new Set(edits.map(r=>r.path)).size,9);
const proofs=[
 'F:/VisibleMedicine/staging/20261025-tour-reading-behavior-shadow-v2/checks/attempt-1/RESULT.json',
 'F:/VisibleMedicine/staging/20261025-neck-renal-role-shadow/checks/attempt-1/RESULT.json',
 'F:/VisibleMedicine/staging/20261025-tour-reading-original-worktrees/RESULT.json',
 'F:/VisibleMedicine/staging/20261025-neck-renal-archived-original-runtime/RESULT.json'
];
for(const p of proofs)assert(json(p).passing,p);
for(const p of proofs.slice(0,2)){assert.equal(json(p).counts.pass,7);assert(json(p).sourceAndDependencyEntriesUnchanged);}
for(const row of parent.sourceRows)assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);
for(const e of edits){assert(e.path.startsWith('tests/')&&!e.path.includes('..'));assert.equal(hash(e.from),e.after);assert.equal(rows.get(e.path)?.sha256??null,e.before);}
fs.mkdirSync(site,{recursive:true});
fs.cpSync(parent.website+'/.git',site+'/.git',{recursive:true,errorOnExist:true,force:false,dereference:false});
for(const row of parent.sourceRows){const to=site+'/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent.website+'/'+row.path,to,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');
fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
fs.mkdirSync(site+'/.next/types',{recursive:true});
fs.copyFileSync(parent.website+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);
for(const e of edits){const to=site+'/'+e.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(e.from,to);rows.set(e.path,{path:e.path,bytes:fs.statSync(to).size,sha256:hash(to)});assert.equal(hash(to),e.after);}
assert.equal(rows.size,6830);
for(const row of rows.values())assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
for(const row of parent.sourceRows){assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);if(!row.path.startsWith('tests/'))assert.equal(hash(site+'/'+row.path),row.sha256,'Application/generated inputs unchanged');}
for(const r of parent.dependencies){assert.equal(hash(r.file),r.sha256);assert.equal(hash(r.entry),r.entrySha256);}
for(const row of json('F:/VisibleMedicine/staging/20261025-studio-access-website/PREPARATION.json').historicalFixtures){const to=stage+'/before/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync('F:/VisibleMedicine/staging/20261025-viewer-notice-role-website/before/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256);}
const config=json('F:/VisibleMedicine/staging/20261025-verified-navigation-teaching-website/LOCAL_TEST_CONFIGURATION.json');
Object.assign(config.environment,{VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:parent.atlas,ATLAS_SOURCE_REPO:parent.atlas,
 VM_NECK_RENAL_CONTEXT_CONFIG:'F:/VisibleMedicine/staging/20261025-neck-renal-role-proposal/CONTEXTS.json',
 VM_CERVICAL_LOCAL_EVIDENCE_ROOT:stage+'/cervical-child-evidence'});
fs.mkdirSync(stage+'/cervical-child-evidence');
fs.writeFileSync(stage+'/LOCAL_TEST_CONFIGURATION.json',JSON.stringify(config,null,2)+'\n',{flag:'wx'});
const git=(root,...args)=>execFileSync('git',['--no-replace-objects','-C',root,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).trim();
assert.equal(git('F:/VisibleMedicine/website','rev-parse','HEAD'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(git('F:/VisibleMedicine/atlas','rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(git(parent.atlas,'rev-parse','HEAD'),parent.atlasHead);assert.equal(git(parent.atlas,'status','--porcelain'),'');
const result={...parent,at:new Date().toISOString(),website:site,parent:parentFile,parentSha256:hash(parentFile),sourcePaths:rows.size,
 sourceRows:[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path)),proposals:sets.map(s=>({path:s.root+'/PATCHSET.json',sha256:s.sha})),
 changedPaths:edits.filter(r=>r.before!==null).map(r=>r.path),addedPaths:edits.filter(r=>r.before===null).map(r=>r.path),
 focusedEvidence:proofs.map(p=>({path:p,sha256:hash(p)})),
 focusedInterpretation:'Seven current tour parent cases and seven neck/renal parent cases pass separately. All genuine historical tour whole roots2+1 and four archived neck/renal originals1/2/1/1 pass. Earlier tour6pass/1renderer-newline role failure retained; exact committed/imported/raw and renderer-LF roles now distinct. Synthetic callback/event proof is not real browser/lifecycle/timer/camera acceptance. No hover-only requirement inferred.',
 productionSourceUnchangedFromParent:true,freshStrictOrBuildForThisSource:false,wholeSuitePassing:false,physicalBrowserAcceptancePending:true,
 installed:false,ownerPreviewChanged:false,privateStateCopied:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:result.at,memory,source:stage+'/SOURCE_CANDIDATE.json',sourceSha256:hash(stage+'/SOURCE_CANDIDATE.json'),sourcePaths:6830,
 proposals:result.proposals,focusedEvidence:result.focusedEvidence,noPreviousBuildCopied:true,priorTypeBuildClaimsNotReusedForChangedUiApplication:true,
 privateConfigurationSha256:hash(stage+'/LOCAL_TEST_CONFIGURATION.json'),ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json'),sourcePaths:6830,changed:7,added:2,freshTypesBuildBrowserPending:true,installed:false}));
