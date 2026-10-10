import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, mkdir, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, isAbsolute, join, relative, resolve} from 'node:path';
import {auditDefaultBuildInputs} from './source-snapshot-build-inputs.mjs';
import {compileReviewedPathPolicy} from './source-snapshot-reviewed-paths.mjs';

const execFileAsync=promisify(execFile);
const gitEnv={...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',
  GIT_CONFIG_SYSTEM:process.platform==='win32'?'NUL':'/dev/null',GIT_TERMINAL_PROMPT:'0',
  GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',
  GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid'};
const git=async(root,...args)=>(await execFileAsync('git',['-c','commit.gpgsign=false',
  '-c',`core.hooksPath=${join(root,'empty-hooks')}`,...args],
  {cwd:root,env:gitEnv,windowsHide:true})).stdout.trim();
const put=async(root,path,bytes)=>{
  const target=join(root,...path.split('/'));
  await mkdir(resolve(target,'..'),{recursive:true});
  await writeFile(target,bytes);
};
const fixture=async run=>{
  const temp=await mkdtemp(join(tmpdir(),'vm-reviewed-build-'));
  try{
    const sourceRoot=join(temp,'source');
    await mkdir(sourceRoot);
    await mkdir(join(sourceRoot,'empty-hooks'));
    await git(sourceRoot,'init','--template=','--quiet');
    return await run({temp,sourceRoot});
  }finally{
    const actual=await realpath(temp),parent=await realpath(tmpdir()),child=relative(parent,actual);
    assert(child&&child===basename(actual)&&!child.startsWith('..')&&!isAbsolute(child),
      'Remove only the resolved test-owned temp directory');
    await rm(actual,{recursive:true,force:false});
  }
};
const commit=async root=>{
  await git(root,'add','--all');
  await git(root,'commit','--quiet','-m','synthetic fixture');
  return git(root,'rev-parse','HEAD');
};
const names=[
  ['app/regions/[region]/page.tsx','framework-region-route','export default function Region() { return null; }\n'],
  ['app/scene-recovery.tsx','renderer-recovery-code','export default function Recovery() { return null; }\n'],
  ['app/scene-recovery.css','renderer-recovery-code','.recovery { color: black; }\n'],
];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const blob=bytes=>createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const envelope=sourceCommit=>({schema:'vm-reviewed-source-names/1',sourceCommit,
  records:names.map(([path,purpose,source])=>{
    const bytes=Buffer.from(source);
    return {path,role:'code',purpose,sha256:sha(bytes),gitBlob:blob(bytes),bytes:bytes.length,
      proof:{id:'synthetic-review',revision:'r1',sha256:'e'.repeat(64)}};
  })});
const seed=async sourceRoot=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'vinext build'}}));
  for(const [path,,source] of names)await put(sourceRoot,path,source);
  return commit(sourceRoot);
};
const assertNotAdmitted=report=>{
  for(const key of ['staticTraversalComplete','closureProven','isolatedBuildVerified',
    'rightsOrPrivacyGranted','sourceBackupAdmitted'])assert.equal(report[key],false,key);
};

test('default refuses all three exact names; opt-in verifies immutable bytes and stage',async()=>fixture(async({temp,sourceRoot})=>{
  const sourceCommit=await seed(sourceRoot);
  const defaultReport=await auditDefaultBuildInputs({sourceRoot,sourceCommit});
  for(const [path] of names){
    assert(defaultReport.policyConflicts.some(row=>row.path===path),path);
    assert(!defaultReport.inputs.some(row=>row.path===path),path);
  }
  assertNotAdmitted(defaultReport);
  const policy=compileReviewedPathPolicy(envelope(sourceCommit),sourceCommit);
  const stageRoot=join(temp,'stage'); await mkdir(stageRoot);
  await put(stageRoot,'package.json',await readFile(join(sourceRoot,'package.json')));
  for(const [path] of names)await put(stageRoot,path,await readFile(join(sourceRoot,...path.split('/'))));
  const report=await auditDefaultBuildInputs({sourceRoot,sourceCommit,reviewedPathPolicy:policy,stageRoot});
  for(const [path] of names){
    const actual=report.inputs.find(row=>row.path===path);
    assert(actual,path);
    assert.equal(actual.sha256,sha(await readFile(join(sourceRoot,...path.split('/')))));
    assert(!report.policyConflicts.some(row=>row.path===path));
  }
  assert.equal(report.stageComparison.matches,true);
  assertNotAdmitted(report);
  await put(stageRoot,names[0][0],'x'.repeat(Buffer.byteLength(names[0][2])));
  const changed=await auditDefaultBuildInputs({sourceRoot,sourceCommit,reviewedPathPolicy:policy,stageRoot});
  assert.equal(changed.stageComparison.matches,false);
  assert(changed.stageComparison.issues.some(row=>row.code==='STAGE_COLLECTION_REFUSED'));
  assertNotAdmitted(changed);
  await put(sourceRoot,names[0][0],'dirty working tree must not change the pinned blob\n');
  const pinned=await auditDefaultBuildInputs({sourceRoot,sourceCommit,reviewedPathPolicy:policy});
  assert.equal(pinned.inputs.find(row=>row.path===names[0][0]).sha256,sha(Buffer.from(names[0][2])));
  assertNotAdmitted(pinned);
}));

test('wrong source pin or forged token fails before Git or filesystem inspection',async()=>fixture(async({sourceRoot,temp})=>{
  const sourceCommit=await seed(sourceRoot);
  const policy=compileReviewedPathPolicy(envelope(sourceCommit),sourceCommit);
  const missingRoot=join(temp,'missing');
  await assert.rejects(()=>auditDefaultBuildInputs({sourceRoot:missingRoot,sourceCommit:'f'.repeat(40),
    reviewedPathPolicy:policy}),error=>error.code==='REVIEWED_POLICY_SOURCE');
  await assert.rejects(()=>auditDefaultBuildInputs({sourceRoot:missingRoot,sourceCommit,
    reviewedPathPolicy:Object.freeze({})}),error=>error.code==='REVIEWED_TOKEN');
  await assert.rejects(()=>auditDefaultBuildInputs({sourceRoot,sourceCommit,
    reviewedPathPolicy:undefined}),error=>error.code==='REVIEWED_POLICY_SOURCE');
}));

test('reviewed SHA, Git blob and byte count must match actual immutable blobs',async()=>fixture(async({sourceRoot})=>{
  const sourceCommit=await seed(sourceRoot);
  for(const mutate of [
    row=>{row.sha256='f'.repeat(64);},
    row=>{row.gitBlob='f'.repeat(40);},
    row=>{row.bytes++;},
  ]){
    const declared=envelope(sourceCommit); mutate(declared.records[0]);
    const policy=compileReviewedPathPolicy(declared,sourceCommit);
    await assert.rejects(()=>auditDefaultBuildInputs({sourceRoot,sourceCommit,reviewedPathPolicy:policy}),
      error=>error.code==='REVIEWED_IDENTITY_MISMATCH');
  }
}));

test('private, model, patient and recovery lookalikes remain refused with opt-in',async()=>fixture(async({sourceRoot})=>{
  const sourceCommit=await seed(sourceRoot);
  await put(sourceRoot,'app/page.tsx','import "../private/secret"; export default function Page() { return null; }\n');
  await put(sourceRoot,'private/secret.tsx','export const fixture = true;\n');
  await put(sourceRoot,'app/regions/[patient]/page.tsx','export default function Patient() { return null; }\n');
  await put(sourceRoot,'app/regions/[region]/candidate.tsx','export const candidate = true;\n');
  await put(sourceRoot,'app/scene-recovery-other.tsx','export const other = true;\n');
  await put(sourceRoot,'public/models/recovery-model.glb','synthetic model bytes');
  const expandedCommit=await commit(sourceRoot);
  assert.notEqual(expandedCommit,sourceCommit);
  const policy=compileReviewedPathPolicy(envelope(expandedCommit),expandedCommit);
  const report=await auditDefaultBuildInputs({sourceRoot,sourceCommit:expandedCommit,reviewedPathPolicy:policy});
  for(const path of ['private/secret.tsx','app/regions/[patient]/page.tsx',
    'app/regions/[region]/candidate.tsx','app/scene-recovery-other.tsx',
    'public/models/recovery-model.glb']){
    assert(report.policyConflicts.some(row=>row.path===path),path);
    assert(!report.inputs.some(row=>row.path===path),path);
  }
  assertNotAdmitted(report);
}));
