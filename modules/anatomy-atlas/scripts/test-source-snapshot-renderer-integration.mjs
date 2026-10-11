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
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const blob=bytes=>createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const programPath='scripts/body-renderer-revisions.mjs';
const pinnedProgramSha='6a297c3c75b427d275e3c63dc5a275b880430667237b1b3fa0f1991b9a4f4baf';
// Restore canonical LF fixture bytes if the checkout uses Windows CRLF.
// The production auditor still pins the exact immutable Git blob bytes.
const programBytes=Buffer.from((await readFile(new URL('./body-renderer-revisions.mjs',import.meta.url),'utf8')).replace(/\r\n/g,'\n'));
assert.equal(sha(programBytes),pinnedProgramSha,'real generator must match the audited program pin');
const scenePaths=['app/scene-recovery.tsx','app/scene-recovery.css'];
const sources=new Map([
  ['package.json',JSON.stringify({scripts:{build:'node scripts/body-renderer-revisions.mjs && vinext build'}})],
  ['package-lock.json','{}\n'],
  ['app/body-explorer.tsx',"import './scene-recovery';\nexport const explorer = true;\n"],
  ['app/layout.tsx','export default function Layout() { return null; }\n'],
  ['app/globals.css','@import "./scene-recovery.css";\n'],
  ['vite.config.ts','export default {};\n'],
  ['scripts/compress-model-delivery.mjs','export const compress = true;\n'],
  ['scripts/glb-lossless-codec.mjs','export const codec = true;\n'],
  [programPath,programBytes],
  [scenePaths[0],"import './renderer-helper';\nexport const recovery = true;\n"],
  [scenePaths[1],'.recovery { color: black; }\n'],
  ['app/renderer-helper.ts','export const helper = true;\n'],
]);
const gitEnv={...process.env,GIT_CONFIG_NOSYSTEM:'1',
  GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',
  GIT_CONFIG_SYSTEM:process.platform==='win32'?'NUL':'/dev/null',GIT_TERMINAL_PROMPT:'0',
  GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',
  GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid'};
const git=async(root,...args)=>(await execFileAsync('git',[
  '-c','commit.gpgsign=false','-c',`core.hooksPath=${join(root,'empty-hooks')}`,...args],
  {cwd:root,env:gitEnv,windowsHide:true})).stdout.trim();
const put=async(root,path,bytes)=>{
  const target=join(root,...path.split('/'));
  await mkdir(resolve(target,'..'),{recursive:true});
  await writeFile(target,bytes);
};
async function fixture(run){
  const temp=await mkdtemp(join(tmpdir(),'vm-renderer-integration-'));
  try{
    const sourceRoot=join(temp,'source');
    await mkdir(sourceRoot);
    await mkdir(join(sourceRoot,'empty-hooks'));
    await git(sourceRoot,'init','--template=','--quiet');
    for(const [path,bytes] of sources)await put(sourceRoot,path,bytes);
    await git(sourceRoot,'add','--all');
    await git(sourceRoot,'commit','--quiet','-m','synthetic renderer fixture');
    return await run({sourceRoot,sourceCommit:await git(sourceRoot,'rev-parse','HEAD')});
  }finally{
    const actual=await realpath(temp),parent=await realpath(tmpdir()),child=relative(parent,actual);
    assert(child&&child===basename(actual)&&!child.startsWith('..')&&!isAbsolute(child),
      'Remove only the resolved test-owned temp directory');
    await rm(actual,{recursive:true,force:false});
  }
}
const envelope=sourceCommit=>({schema:'vm-reviewed-source-names/1',sourceCommit,
  records:scenePaths.map(path=>{
    const bytes=Buffer.from(sources.get(path));
    return {path,role:'code',purpose:'renderer-recovery-code',sha256:sha(bytes),
      gitBlob:blob(bytes),bytes:bytes.length,
      proof:{id:'synthetic-review',revision:'r1',sha256:'e'.repeat(64)}};
  })});
const neverAdmitted=report=>{
  for(const key of ['staticTraversalComplete','closureProven','isolatedBuildVerified',
    'rightsOrPrivacyGranted','sourceBackupAdmitted'])assert.equal(report[key],false,key);
  assert.equal(report.rendererInputs.sourceExecutionObserved,false);
  assert.equal(report.rendererInputs.installedToolIdentityVerified,false);
};

test('default renderer audit holds scene recovery; exact opt-in traces its complete static graph',
  async()=>fixture(async({sourceRoot,sourceCommit})=>{
    const held=await auditDefaultBuildInputs({sourceRoot,sourceCommit});
    assert(held.rendererInputs,'exact pinned generator must trigger the integrated audit');
    assert.equal(held.rendererInputs.sourceProgramSha256,pinnedProgramSha);
    assert.equal(held.rendererInputs.graphComplete,false);
    assert.equal(held.rendererInputs.normalizedDependenciesSha256,null);
    for(const path of scenePaths){
      assert(held.policyConflicts.some(row=>row.path===path),path);
      assert(held.rendererInputs.issues.some(row=>row.path===path&&row.code==='HELD_INPUT'),path);
      assert(!held.rendererInputs.dependencies.some(row=>row.path===path),path);
    }
    neverAdmitted(held);

    const reviewedPathPolicy=compileReviewedPathPolicy(envelope(sourceCommit),sourceCommit);
    const allowed=await auditDefaultBuildInputs({sourceRoot,sourceCommit,reviewedPathPolicy});
    assert(allowed.rendererInputs,'integrated renderer result must remain present');
    assert.equal(allowed.rendererInputs.graphComplete,true,JSON.stringify(allowed.rendererInputs.issues));
    assert.deepEqual(allowed.rendererInputs.issues,[]);
    assert.match(allowed.rendererInputs.normalizedDependenciesSha256,/^[0-9a-f]{64}$/);
    const paths=allowed.rendererInputs.dependencies.map(row=>row.path);
    for(const path of [...scenePaths,'app/renderer-helper.ts']){
      assert(paths.includes(path),path);
      assert(allowed.inputs.some(row=>row.path===path),path);
    }
    assert(allowed.inputs.find(row=>row.path==='app/renderer-helper.ts').reasons
      .some(reason=>reason.includes('renderer import from app/scene-recovery.tsx')));
    for(const path of scenePaths)assert(!allowed.policyConflicts.some(row=>row.path===path),path);
    assert.equal(paths.length,11,'eight fixed entrypoints, two reviewed scenes, and one transitive helper');
    neverAdmitted(allowed);
  }));

test('stale policy pin and mismatched reviewed scene identity refuse integrated audit',
  async()=>fixture(async({sourceRoot,sourceCommit})=>{
    const policy=compileReviewedPathPolicy(envelope(sourceCommit),sourceCommit);
    await assert.rejects(()=>auditDefaultBuildInputs({sourceRoot,sourceCommit:'f'.repeat(40),
      reviewedPathPolicy:policy}),error=>error.code==='REVIEWED_POLICY_SOURCE');
    const stale=envelope(sourceCommit);
    stale.records[0].sha256='f'.repeat(64);
    const mismatched=compileReviewedPathPolicy(stale,sourceCommit);
    await assert.rejects(()=>auditDefaultBuildInputs({sourceRoot,sourceCommit,
      reviewedPathPolicy:mismatched}),error=>error.code==='REVIEWED_IDENTITY_MISMATCH');
  }));
