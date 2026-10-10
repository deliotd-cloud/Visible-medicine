import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir, mkdtemp, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, isAbsolute, join, relative, resolve} from 'node:path';
import {auditDefaultBuildInputs} from './source-snapshot-build-inputs.mjs';

const execFileAsync=promisify(execFile);
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const generatorPath='scripts/generate-nested-review-bindings.mjs';
const builderPath='scripts/workspace-test-build.mjs';
const entryPath='lib/nested-review-material.ts';
const command=`node ${generatorPath} --check`;
const generator=(await readFile(new URL('./generate-nested-review-bindings.mjs',import.meta.url),'utf8')).replaceAll('\r\n','\n');
const builder=(await readFile(new URL('./workspace-test-build.mjs',import.meta.url),'utf8')).replaceAll('\r\n','\n');
assert.equal(sha256(generator),'814066ef06e7af0e131215724b8419eb4ed64b8782e8f31228ec818cc3c5b9f5');
assert.equal(sha256(builder),'c30102bdcfa2d33ae997ef749b8077f6c182e297fed0d312dafa210f73e10412');

const tempBase=tmpdir();
const gitEnv={...process.env,GIT_CONFIG_NOSYSTEM:'1',
  GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',
  GIT_CONFIG_SYSTEM:process.platform==='win32'?'NUL':'/dev/null',
  GIT_TERMINAL_PROMPT:'0',GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',
  GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid'};
const git=async(root,...args)=>(await execFileAsync('git',['-c','commit.gpgsign=false',
  '-c',`core.hooksPath=${join(root,'empty-hooks')}`,...args],
  {cwd:root,env:gitEnv,windowsHide:true})).stdout.trim();
const put=async(root,path,bytes)=>{
  const target=join(root,...path.split('/'));
  await mkdir(resolve(target,'..'),{recursive:true});
  await writeFile(target,bytes);
};
const commit=async root=>{
  await git(root,'add','--all');
  await git(root,'commit','--quiet','-m','synthetic fixture');
  return git(root,'rev-parse','HEAD');
};
const audit=async(root,sourceCommit)=>auditDefaultBuildInputs({sourceRoot:root,sourceCommit});
const fixture=async run=>{
  await mkdir(tempBase,{recursive:true});
  const temp=await mkdtemp(join(tempBase,'vm-generated-import-'));
  try{
    const root=join(temp,'source');
    await mkdir(root);await mkdir(join(root,'empty-hooks'));
    await git(root,'init','--template=','--quiet');
    return await run(root);
  }finally{
    const actual=await realpath(temp),parent=await realpath(tempBase),child=relative(parent,actual);
    assert(child&&child===basename(actual)&&!child.startsWith('..')&&!isAbsolute(child),
      'Remove only the resolved test-owned temp directory');
    await rm(actual,{recursive:true,force:false});
  }
};
const seed=async(root,{program=generator,programPath=generatorPath,builderSource=builder,
  builderPresent=true,entry='export const nestedReviewRows=[]; export const nestedReviewMaterial=async()=>null;\n',
  entryPresent=true,build=command}={})=>{
  await put(root,'package.json',JSON.stringify({scripts:{build}}));
  await put(root,programPath,program);
  if(builderPresent)await put(root,builderPath,builderSource);
  if(entryPresent)await put(root,entryPath,entry);
  await put(root,'public/models/bodyparts3d-v3/abdominal-wall/original-source.zip',
    'held-archive-sentinel-never-admitted');
  await put(root,'public/models/arm-recovery.glb','held-model-sentinel-never-admitted');
};
const rows=report=>report.classifiedImports.filter(row=>row.path===generatorPath);
const issues=report=>report.unresolved.filter(row=>row.path===generatorPath);
const noAdmission=report=>{
  assert.equal(report.closureProven,false);
  assert.equal(report.isolatedBuildVerified,false);
  assert.equal(report.rightsOrPrivacyGranted,false);
  assert.equal(report.sourceBackupAdmitted,false);
  assert(!report.inputs.some(row=>row.path.endsWith('original-source.zip')||row.path==='public/models/arm-recovery.glb'));
  assert(!JSON.stringify(report).includes('held-archive-sentinel-never-admitted'));
  assert(!JSON.stringify(report).includes('held-model-sentinel-never-admitted'));
};
const noClass=report=>{
  assert.deepEqual(rows(report),[]);
  noAdmission(report);
};

test('exact reviewed generator labels only its data URL import and retains an unresolved payload',async()=>fixture(async root=>{
  await seed(root);
  const sourceCommit=await commit(root),report=await audit(root,sourceCommit);
  assert(Array.isArray(report.classifiedImports));
  assert.equal(rows(report).length,1);
  const row=rows(report)[0];
  assert.equal(row.code,'GENERATED_BUNDLE_DATA_IMPORT');
  assert.equal(row.basis,'exact-program-data-url-construction');
  assert.equal(row.path,generatorPath);
  assert.equal(row.line,5);
  assert.equal(row.sourceProgramSha256,sha256(generator));
  assert.equal(row.buildInvocation,command);
  const builderInput=report.inputs.find(input=>input.path===builderPath);
  const entryInput=report.inputs.find(input=>input.path===entryPath);
  assert(builderInput);assert(entryInput);
  assert.deepEqual(row.builder,{path:builderPath,gitBlob:builderInput.gitBlob,
    bytes:Buffer.byteLength(builder),sha256:sha256(builder)});
  assert.deepEqual(row.entry,{path:entryPath,gitBlob:entryInput.gitBlob,bytes:entryInput.bytes});
  for(const flag of ['payloadBytesVerified','outputCardinalityVerified','transitiveBuildInputsVerified',
    'installedToolIdentityVerified','runtimeImportClosureVerified','sourceExecutionObserved'])
    assert.equal(row[flag],false,flag);
  assert(issues(report).some(issue=>issue.code==='GENERATED_BUNDLE_PAYLOAD_UNVERIFIED'&&issue.line===5));
  assert(!issues(report).some(issue=>issue.code==='COMPUTED_IMPORT'&&issue.line===5));
  assert(entryInput.reasons.some(reason=>reason.includes(generatorPath)));
  noAdmission(report);
}));

test('immutable Git tree controls classification despite dirty working tree',async()=>fixture(async root=>{
  await seed(root);
  const sourceCommit=await commit(root),before=await audit(root,sourceCommit);
  await put(root,generatorPath,generator.replace("await import('data:text/javascript;base64,'", "await import('data:text/javascript,broken,'"));
  await put(root,builderPath,builder+'\n// dirty builder\n');
  await put(root,entryPath,'throw Error("dirty entry never read");\n');
  assert.deepEqual(await audit(root,sourceCommit),before);
  noAdmission(before);
}));

test('changed generator URL, import, entry, options, output index, or extra import loses exact proof',async()=>{
  const variants=[
    generator.replace("'data:text/javascript;base64,'", "'data:text/javascript,'"),
    generator.replace('await import(', 'await import(/* changed */'),
    generator.replace("'./lib/nested-review-material'", "'./lib/other-material'"),
    generator.replace("platform:'node'", "platform:'browser'"),
    generator.replace('outputFiles[0]', 'outputFiles[1]'),
    generator+"\nawait import('data:text/javascript;base64,ZXhwb3J0IHt9');\n"
  ];
  for(const program of variants)await fixture(async root=>{
    await seed(root,{program});
    const report=await audit(root,await commit(root));
    noClass(report);
    assert(issues(report).some(issue=>issue.code==='COMPUTED_IMPORT'&&issue.line===5));
  });
});

test('changed or missing builder, absent entry, wrong generator path or invocation lose proof',async()=>{
  const variants=[
    {builderSource:builder+'\n// changed builder\n'},
    {builderPresent:false},
    {entryPresent:false},
    {programPath:'scripts/generate-nested-review-lookalike.mjs',build:'node scripts/generate-nested-review-lookalike.mjs --check'},
    {build:`node ${generatorPath}`},
    {build:`${command} && ${command}`}
  ];
  for(const options of variants)await fixture(async root=>{
    await seed(root,options);
    const report=await audit(root,await commit(root));
    noClass(report);
  });
});

test('builder or entry symlink-mode Git records cannot establish the proof',async()=>{
  for(const path of [builderPath,entryPath])await fixture(async root=>{
    await seed(root);
    await git(root,'add','--all');
    const blob=await git(root,'hash-object','-w',path);
    // Replace the staged regular file with a virtual symlink-mode record. This
    // works on Windows without enabling native symlinks or changing the checkout.
    await git(root,'update-index','--add','--cacheinfo','120000',blob,path);
    await git(root,'commit','--quiet','-m','synthetic symlink-mode fixture');
    const report=await audit(root,await git(root,'rev-parse','HEAD'));
    noClass(report);
    assert(report.unresolved.some(issue=>issue.path===path&&issue.code==='NONREGULAR_GIT_INPUT'));
  });
});

test('changed policy-allowed entry identity is reported from Git rather than pinned or presumed verified',async()=>fixture(async root=>{
  await seed(root,{entry:'export const nestedReviewRows=[{key:"fixture"}];\n'});
  const first=await audit(root,await commit(root));
  await put(root,entryPath,'export const nestedReviewRows=[{key:"changed"}];\n');
  const second=await audit(root,await commit(root));
  assert.equal(rows(first).length,1);assert.equal(rows(second).length,1);
  assert.notEqual(rows(first)[0].entry.gitBlob,rows(second)[0].entry.gitBlob);
  assert.equal(rows(second)[0].entry.gitBlob,second.inputs.find(row=>row.path===entryPath).gitBlob);
  assert.equal(rows(second)[0].payloadBytesVerified,false);
  assert(issues(second).some(issue=>issue.code==='GENERATED_BUNDLE_PAYLOAD_UNVERIFIED'));
  noAdmission(first);noAdmission(second);
}));

test('an imported generator without its sole exact default invocation is not classified',async()=>fixture(async root=>{
  await seed(root,{build:'node scripts/indirect-entry.mjs'});
  await put(root,'scripts/indirect-entry.mjs',`import './generate-nested-review-bindings.mjs';\n`);
  const report=await audit(root,await commit(root));
  noClass(report);
  assert(issues(report).some(issue=>issue.code==='COMPUTED_IMPORT'&&issue.line===5));
}));

test('unrelated computed imports remain generic while the exact generator is classified',async()=>fixture(async root=>{
  await seed(root,{build:`${command} && node scripts/unrelated.mjs`});
  await put(root,'scripts/unrelated.mjs',`await import('data:text/javascript,'+Math.random());\n`);
  const report=await audit(root,await commit(root));
  assert.equal(report.classifiedImports.length,1);
  assert.equal(rows(report).length,1);
  assert(report.unresolved.some(issue=>issue.code==='COMPUTED_IMPORT'&&
    issue.path==='scripts/unrelated.mjs'&&issue.line===1));
  assert(issues(report).some(issue=>issue.code==='GENERATED_BUNDLE_PAYLOAD_UNVERIFIED'&&issue.line===5));
  noAdmission(report);
}));
