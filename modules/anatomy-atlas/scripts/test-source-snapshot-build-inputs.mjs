import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, isAbsolute, join, relative, resolve} from 'node:path';
import {auditDefaultBuildInputs} from './source-snapshot-build-inputs.mjs';

const execFileAsync=promisify(execFile);
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const gitEnv={...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',
  GIT_CONFIG_SYSTEM:process.platform==='win32'?'NUL':'/dev/null',GIT_TERMINAL_PROMPT:'0',
  GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',
  GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid'};
const git=async(root,...args)=>(await execFileAsync('git',['-c','commit.gpgsign=false',
  '-c',`core.hooksPath=${join(root,'empty-hooks')}`,...args],{cwd:root,env:gitEnv,windowsHide:true})).stdout.trim();
const put=async(root,path,bytes)=>{
  const target=join(root,...path.split('/'));
  await mkdir(resolve(target,'..'),{recursive:true});
  await writeFile(target,bytes);
};
const fixture=async run=>{
  const temp=await mkdtemp(join(tmpdir(),'vm-build-inputs-'));
  try{
    const sourceRoot=join(temp,'source');
    await mkdir(sourceRoot);
    await mkdir(join(sourceRoot,'empty-hooks'));
    await git(sourceRoot,'init','--template=', '--quiet');
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
const audit=({sourceRoot,sourceCommit,stageRoot,...extra})=>auditDefaultBuildInputs({sourceRoot,sourceCommit,stageRoot,...extra});
const paths=report=>report.inputs.map(row=>row.path);
const unresolvedText=report=>JSON.stringify(report.unresolved).toLowerCase();
const policiesText=report=>JSON.stringify(report.policyConflicts).toLowerCase();
const compareText=report=>JSON.stringify(report.stageComparison).toLowerCase();
const neverAdmitted=report=>{
  assert.equal(report.closureProven,false);
  assert.equal(report.isolatedBuildVerified,false);
  assert.equal(report.rightsOrPrivacyGranted,false);
  assert.equal(report.sourceBackupAdmitted,false);
};
const reportShape=report=>{
  assert.match(report.sourceCommit,/^[a-f0-9]{40}$/);
  assert.match(report.sourceTree,/^[a-f0-9]{40}$/);
  assert(Array.isArray(report.inputs));
  assert(Array.isArray(report.classifiedReads));
  assert(Array.isArray(report.unresolved));
  assert(Array.isArray(report.policyConflicts));
  assert(Array.isArray(report.externalAssumptions));
  assert.equal(typeof report.staticTraversalComplete,'boolean');
  assert.deepEqual(paths(report),[...paths(report)].sort(),'stable path order');
  neverAdmitted(report);
};

// A frozen, reviewed guard fixture. Line endings alone are normalized for checkout
// portability; any semantic/source change requires a new explicit audit and pin.
const guardPath='scripts/exclude-source-recovery.mjs';
const archivePath='public/models/bodyparts3d-v3/abdominal-wall/original-source.zip';
const guardSource=(await readFile(new URL('./fixtures/legacy-source-archive-guard.txt',import.meta.url),'utf8')).replaceAll('\r\n','\n');
assert.equal(sha256(guardSource),'b4d1eb161942dea1b8561fe3dcba41bcd77cc703aa5a6c206f47338c6816c20a');
const putGuard=async(root,{source=guardSource,path=guardPath,build='vinext build && node '+guardPath}={})=>{
  await put(root,'package.json',JSON.stringify({scripts:{build}}));
  await put(root,path,source);
  await put(root,archivePath,'held-archive-sentinel-not-read-or-disclosed');
};
const guardReads=report=>report.classifiedReads.filter(row=>row.path===guardPath);
const dynamicGuardReads=report=>report.unresolved.filter(row=>row.code==='DYNAMIC_LOCAL_READ'&&row.path===guardPath);
const packagingSource=(await readFile(new URL('./exclude-source-recovery.mjs',import.meta.url),'utf8')).replaceAll('\r\n','\n');
assert.equal(sha256(packagingSource),'e35c3c9db0fb857468fe13af12c368da272c3daac6f25be54d819ebd20f40828');
const putPackaging=async(root,{source=packagingSource,path=guardPath,build='vinext build && node '+guardPath}={})=>{
  await put(root,'package.json',JSON.stringify({scripts:{build}}));
  await put(root,path,source);
};
const modelDeliveryPath='scripts/compress-model-delivery.mjs';
const modelDeliverySource=(await readFile(new URL('./compress-model-delivery.mjs',import.meta.url),'utf8')).replaceAll('\r\n','\n');
assert.equal(sha256(modelDeliverySource),'b18e1c9b00891f31190f8f3ccc02287500673fab48d9e74f0490cc68e9fbddf4');
const putModelDelivery=async(root,{source=modelDeliverySource,path=modelDeliveryPath,
  build='node scripts/compress-model-delivery.mjs'}={})=>{
  await put(root,'package.json',JSON.stringify({scripts:{build}}));
  await put(root,path,source);
  await put(root,'scripts/glb-lossless-codec.mjs','export const fixture = true;\n');
};
const modelReads=report=>report.classifiedReads.filter(row=>row.path===modelDeliveryPath);
const modelUnresolved=report=>report.unresolved.filter(row=>row.path===modelDeliveryPath);

test('exact default model delivery inventories allowed and held Git identities without admitting held bytes',async()=>fixture(async({sourceRoot})=>{
  await putModelDelivery(sourceRoot);
  await put(sourceRoot,'public/models/body.glb','allowed-model-fixture');
  await put(sourceRoot,'public/models/arm-recovery.glb','held-model-fixture');
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  reportShape(report);
  assert.equal(report.modelEnumeration.sourceProgramSha256,sha256(modelDeliverySource));
  assert.deepEqual(report.modelEnumeration.models.map(({path,disposition})=>({path,disposition})),[
    {path:'public/models/arm-recovery.glb',disposition:'policy-held'},
    {path:'public/models/body.glb',disposition:'policy-allowed'}
  ]);
  for(const row of report.modelEnumeration.models){
    assert.match(row.gitBlob,/^[0-9a-f]{40}$/);assert(row.bytes>0);
  }
  assert.deepEqual(modelReads(report).map(row=>[row.code,row.line]),[
    ['MODEL_FILESYSTEM_API',3],['MODEL_SET_ENUMERATION',12],['MODEL_SOURCE_READ',29],
    ['GENERATED_MODEL_CHECK',31],['MODEL_SOURCE_REREAD',35],['GENERATED_MODEL_MANIFEST_CHECK',42]
  ]);
  assert(modelReads(report).every(row=>row.modelSetIdentitySha256===report.modelEnumeration.identitySha256));
  assert.deepEqual(modelUnresolved(report),[]);
  assert(paths(report).includes('public/models/body.glb'));
  assert(!paths(report).includes('public/models/arm-recovery.glb'));
  assert(report.policyConflicts.some(row=>row.path==='public/models/arm-recovery.glb'));
  assert(!JSON.stringify(report).includes('held-model-fixture'));neverAdmitted(report);
}));

test('model discovery proof needs exact program, path and sole default invocation; dirty bytes cannot change it',async()=>fixture(async({sourceRoot})=>{
  await putModelDelivery(sourceRoot);
  await put(sourceRoot,'public/models/body.glb','body');
  const sourceCommit=await commit(sourceRoot),before=await audit({sourceRoot,sourceCommit});
  await put(sourceRoot,modelDeliveryPath,modelDeliverySource+'\n// dirty source\n');
  await put(sourceRoot,'public/models/dirty.glb','uncommitted');
  assert.deepEqual(await audit({sourceRoot,sourceCommit}),before);
  for(const options of [
    {source:modelDeliverySource+'\n// changed program\n'},
    {path:'scripts/model-delivery-lookalike.mjs',build:'node scripts/model-delivery-lookalike.mjs'},
    {build:'node scripts/compress-model-delivery.mjs --check'},
    {build:'node scripts/compress-model-delivery.mjs && node scripts/compress-model-delivery.mjs --measure-only'}
  ]){
    await putModelDelivery(sourceRoot,options);
    const report=await audit({sourceRoot,sourceCommit:await commit(sourceRoot)});
    assert.equal(report.modelEnumeration,null);
    assert(!report.classifiedReads.some(row=>row.basis==='exact-program-model-set'));
    assert(report.unresolved.some(row=>row.code==='FILESYSTEM_INPUT_DISCOVERY'));
    neverAdmitted(report);
  }
}));

test('new allowed or held models change the explicit model-set identity; symlink-mode model refuses proof',async()=>fixture(async({sourceRoot})=>{
  await putModelDelivery(sourceRoot);
  await put(sourceRoot,'public/models/body.glb','body');
  const first=await audit({sourceRoot,sourceCommit:await commit(sourceRoot)});
  await put(sourceRoot,'public/models/heart.glb','heart');
  const allowed=await audit({sourceRoot,sourceCommit:await commit(sourceRoot)});
  assert.notEqual(allowed.modelEnumeration.identitySha256,first.modelEnumeration.identitySha256);
  assert(allowed.modelEnumeration.models.some(row=>row.path==='public/models/heart.glb'&&row.disposition==='policy-allowed'));
  await put(sourceRoot,'public/models/nerve-recovery.glb','held');
  const held=await audit({sourceRoot,sourceCommit:await commit(sourceRoot)});
  assert.notEqual(held.modelEnumeration.identitySha256,allowed.modelEnumeration.identitySha256);
  assert(held.modelEnumeration.models.some(row=>row.path==='public/models/nerve-recovery.glb'&&row.disposition==='policy-held'));
  assert(!paths(held).includes('public/models/nerve-recovery.glb'));
  await put(sourceRoot,'link-target.txt','body.glb');
  const blob=await git(sourceRoot,'hash-object','-w','link-target.txt');
  await git(sourceRoot,'update-index','--add','--cacheinfo',`120000,${blob},public/models/linked.glb`);
  await git(sourceRoot,'commit','--quiet','-m','virtual model link');
  const linked=await audit({sourceRoot,sourceCommit:await git(sourceRoot,'rev-parse','HEAD')});
  assert.equal(linked.modelEnumeration,null);
  assert(linked.unresolved.some(row=>row.path==='public/models/linked.glb'&&row.code==='NONREGULAR_GIT_INPUT'));
  assert(linked.unresolved.some(row=>row.path===modelDeliveryPath&&row.code==='FILESYSTEM_INPUT_DISCOVERY'));
  neverAdmitted(linked);
}));

test('exact archive-independent packaging guard classifies only generated reads and does not require an absent original',async()=>fixture(async({sourceRoot})=>{
  await putPackaging(sourceRoot);
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  reportShape(report);
  assert.deepEqual(guardReads(report).map(({code,line,target})=>({code,line,target})),[
    {code:'GENERATED_OUTPUT_CHECK',line:46,target:'dist/client/models/bodyparts3d-v3/abdominal-wall/original-source.zip'},
    {code:'GENERATED_OUTPUT_CHECK',line:56,target:'dist/client/models/recovery-policy.json'}
  ]);
  assert.equal(dynamicGuardReads(report).length,0);
  assert(!report.classifiedReads.some(row=>row.code==='BLOCKED_BUILD_INPUT_READ'));
  assert(!report.unresolved.some(row=>row.path===archivePath));
  assert(!report.policyConflicts.some(row=>row.path===archivePath));
  assert(!paths(report).includes(archivePath));
  assert(!paths(report).some(path=>path.startsWith('dist/')));
  assert(report.unresolved.some(row=>row.code==='FILESYSTEM_INPUT_DISCOVERY'&&row.path===guardPath));
  assert(report.unresolved.some(row=>row.code==='PLUGIN_OR_ENV_DISCOVERY'));neverAdmitted(report);
}));

test('authoring original remains forbidden even when packaging does not need it',async()=>fixture(async({sourceRoot})=>{
  await putPackaging(sourceRoot);await put(sourceRoot,archivePath,'held-original-never-read');
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  assert.equal(guardReads(report).length,2);
  assert(report.policyConflicts.some(row=>row.path===archivePath));
  assert(!paths(report).includes(archivePath));
  assert(!JSON.stringify(report).includes('held-original-never-read'));
  assert(!JSON.stringify(report).includes(sha256('held-original-never-read')));neverAdmitted(report);
}));

test('modified archive-independent guards lose all exact classifications',async()=>fixture(async({sourceRoot})=>{
  for(const source of [packagingSource.replace('readFile(target)','readFile(process.env.INPUT)'),
    packagingSource.replace('14227760','14227761'),packagingSource+'await readFile(process.env.EXTRA);\n']){
    assert.notEqual(source,packagingSource);await putPackaging(sourceRoot,{source});
    const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
    assert.deepEqual(report.classifiedReads,[]);
    assert.equal(dynamicGuardReads(report).length,source.includes('process.env.EXTRA')?3:2);neverAdmitted(report);
  }
}));

test('archive-independent guard needs exact path and recognized build reachability',async()=>fixture(async({sourceRoot})=>{
  await putPackaging(sourceRoot,{build:'vinext build'});
  await put(sourceRoot,'app/page.js','import "../scripts/exclude-source-recovery.mjs";\n');
  let report=await audit({sourceRoot,sourceCommit:await commit(sourceRoot)});
  assert.deepEqual(report.classifiedReads,[]);assert.equal(dynamicGuardReads(report).length,2);neverAdmitted(report);
  await putPackaging(sourceRoot,{path:'scripts/lookalike.mjs',build:'node scripts/lookalike.mjs'});
  report=await audit({sourceRoot,sourceCommit:await commit(sourceRoot)});
  assert.deepEqual(report.classifiedReads,[]);
  assert.equal(report.unresolved.filter(row=>row.code==='DYNAMIC_LOCAL_READ'&&row.path==='scripts/lookalike.mjs').length,2);neverAdmitted(report);
}));

test('dirty packaging guard and build command cannot change immutable classifications',async()=>fixture(async({sourceRoot})=>{
  await putPackaging(sourceRoot);const sourceCommit=await commit(sourceRoot),before=await audit({sourceRoot,sourceCommit});
  await putPackaging(sourceRoot,{source:packagingSource+'await readFile(process.env.EXTRA);\n',build:'unknown command'});
  assert.deepEqual(await audit({sourceRoot,sourceCommit}),before);assert.equal(guardReads(before).length,2);neverAdmitted(before);
}));

test('exact reachable recovery guard separates blocked source reads from generated output checks without admission',async()=>fixture(async({sourceRoot})=>{
  await putGuard(sourceRoot);
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  reportShape(report);
  assert.deepEqual(guardReads(report).map(({code,line,target})=>({code,line,target})),[
    {code:'BLOCKED_BUILD_INPUT_READ',line:14,target:archivePath},
    {code:'GENERATED_OUTPUT_CHECK',line:23,target:'dist/client/models/bodyparts3d-v3/abdominal-wall/original-source.zip'},
    {code:'BLOCKED_BUILD_INPUT_READ',line:26,target:archivePath},
    {code:'GENERATED_OUTPUT_CHECK',line:28,target:'dist/client/models/recovery-policy.json'}
  ]);
  assert.equal(dynamicGuardReads(report).length,0);
  assert.equal(report.policyConflicts.filter(row=>row.code==='DEFAULT_BUILD_ARCHIVE_CONFLICT'&&row.path===archivePath).length,1);
  assert(!paths(report).includes(archivePath));
  assert(!paths(report).some(path=>path.startsWith('dist/')));
  assert(!JSON.stringify(report).includes('held-archive-sentinel'));
  assert(!JSON.stringify(report).includes(sha256('held-archive-sentinel-not-read-or-disclosed')));
  assert(report.unresolved.some(row=>row.code==='FILESYSTEM_INPUT_DISCOVERY'&&row.path===guardPath));
  assert(report.unresolved.some(row=>row.code==='PLUGIN_OR_ENV_DISCOVERY'));
}));

test('changed guard paths, roots and read arguments lose all exact-guard classifications',async()=>fixture(async({sourceRoot})=>{
  for(const source of [
    guardSource.replace("const name = 'models/", "const name = 'other/"),
    guardSource.replace("resolve(import.meta.dirname, '..')", "resolve(import.meta.dirname, '../other')"),
    guardSource.replace("resolve(root, 'dist/client')", "resolve(root, process.env.DESTINATION)"),
    guardSource.replace('readFile(target)','readFile(process.env.INPUT)')
  ]){
    assert.notEqual(source,guardSource);
    await putGuard(sourceRoot,{source});
    const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
    assert.deepEqual(report.classifiedReads,[]);assert.equal(dynamicGuardReads(report).length,4);
    assert(report.policyConflicts.some(row=>row.path===archivePath));neverAdmitted(report);
  }
}));

test('extra unknown guard read remains unresolved and cannot inherit the frozen guard classification',async()=>fixture(async({sourceRoot})=>{
  await putGuard(sourceRoot,{source:guardSource+'await readFile(process.env.EXTRA);\n'});
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  assert.deepEqual(report.classifiedReads,[]);assert.equal(dynamicGuardReads(report).length,5);
  assert(report.policyConflicts.some(row=>row.path===archivePath));neverAdmitted(report);
}));

test('an absent required source archive remains a missing build input and policy conflict, never an exemption',async()=>fixture(async({sourceRoot})=>{
  await putGuard(sourceRoot);
  await rm(join(sourceRoot,...archivePath.split('/')));
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  assert.equal(guardReads(report).length,4,'descriptive semantics remain pinned');
  assert(report.unresolved.some(row=>row.code==='MISSING_TRACKED_INPUT'&&row.path===archivePath));
  assert(report.policyConflicts.some(row=>row.code==='DEFAULT_BUILD_ARCHIVE_CONFLICT'&&row.path===archivePath));
  assert(!paths(report).includes(archivePath));neverAdmitted(report);
}));

test('guard imported by an app but not invoked by a recognized build command stays unresolved',async()=>fixture(async({sourceRoot})=>{
  await putGuard(sourceRoot,{build:'vinext build'});
  await put(sourceRoot,'app/page.js','import "../scripts/exclude-source-recovery.mjs";\n');
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  assert(paths(report).includes(guardPath));assert.deepEqual(report.classifiedReads,[]);
  assert.equal(dynamicGuardReads(report).length,4);neverAdmitted(report);
}));

test('exact guard bytes at a different script path are not given trusted path semantics',async()=>fixture(async({sourceRoot})=>{
  const path='scripts/lookalike.mjs';
  await putGuard(sourceRoot,{path,build:'node '+path});
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  assert.deepEqual(report.classifiedReads,[]);
  assert.equal(report.unresolved.filter(row=>row.code==='DYNAMIC_LOCAL_READ'&&row.path===path).length,4);neverAdmitted(report);
}));

test('dirty guard and package changes cannot modify committed read classifications',async()=>fixture(async({sourceRoot})=>{
  await putGuard(sourceRoot);
  const sourceCommit=await commit(sourceRoot),before=await audit({sourceRoot,sourceCommit});
  await putGuard(sourceRoot,{source:guardSource+'await readFile(process.env.EXTRA);\n',build:'unrecognized command'});
  const after=await audit({sourceRoot,sourceCommit});
  assert.deepEqual(after,before);assert.equal(guardReads(after).length,4);neverAdmitted(after);
}));

test('Git tree fixes actual bytes and OIDs while a dirty checkout and caller declarations cannot change the report',async()=>fixture(async({sourceRoot,temp})=>{
  const original=Buffer.from('export const pinned = "historical";\n');
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'node scripts/build.mjs'}}));
  await put(sourceRoot,'scripts/build.mjs','import "../app/page.js";\n');
  await put(sourceRoot,'app/page.js',original);
  await put(sourceRoot,'public/logo.svg','<svg/>');
  const sourceCommit=await commit(sourceRoot);
  const sourceTree=await git(sourceRoot,'rev-parse',`${sourceCommit}^{tree}`);
  const expectedBlob=await git(sourceRoot,'rev-parse',`${sourceCommit}:app/page.js`);
  await put(sourceRoot,'app/page.js','export const pinned = "dirty";\n');
  await put(sourceRoot,'app/new.js','not committed');
  const sentinel=join(temp,'must-not-exist');
  await put(sourceRoot,'scripts/build.mjs',`import "../app/page.js";\nrequire('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'bad');\n`);
  const first=await audit({sourceRoot,sourceCommit});
  const second=await audit({sourceRoot,sourceCommit});
  reportShape(first);
  assert.deepEqual(first,second,'report does not depend on mutable checkout or caller claims');
  assert.equal(first.sourceTree,sourceTree);
  assert(paths(first).includes('app/page.js'));
  assert(paths(first).includes('public/logo.svg'));
  assert(!paths(first).includes('app/new.js'));
  const page=first.inputs.find(row=>row.path==='app/page.js');
  assert.equal(page.gitBlob,expectedBlob);
  assert.equal(page.bytes,original.length);
  if('sha256'in page)assert.equal(page.sha256,sha256(original));
  assert(page.reasons?.length>0);
  await assert.rejects(()=>readFile(sentinel),{code:'ENOENT'},'source scripts were never run');
  try{
    const withClaims=await audit({sourceRoot,sourceCommit,proposed:[{path:'fake.ts'}],observed:[{path:'fake.ts'}]});
    assert.deepEqual(withClaims,first,'caller supplied declarations cannot alter the collector');
  }catch(error){
    if(error?.name==='AssertionError')throw error;
    assert(error instanceof Error,'refused caller declarations');
  }
}));

test('default npm script recursion and literal imports discover transitive files and fresh app/public inputs',async()=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'npm run prepare && vinext build',prepare:'node scripts/prepare.mjs'}}));
  await put(sourceRoot,'scripts/prepare.mjs','import "../lib/start.js";\n');
  await put(sourceRoot,'lib/start.js','import "./next.js"; const v = require("./required.cjs"); import("./lazy.js");\n');
  await put(sourceRoot,'lib/next.js','export const next = 1;\n');
  await put(sourceRoot,'lib/required.cjs','module.exports = 2;\n');
  await put(sourceRoot,'lib/lazy.js','export const lazy = 3;\n');
  await put(sourceRoot,'app/new-route/page.tsx','import "@/components/view"; export default function Page(){}\n');
  await put(sourceRoot,'components/view.tsx','import "./view.css"; export const View = 1;\n');
  await put(sourceRoot,'components/view.css','@import "./theme.css";\n');
  await put(sourceRoot,'components/theme.css','body { color: black; }\n');
  await put(sourceRoot,'public/new-asset.svg','<svg/>');
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  reportShape(report);
  for(const path of ['package.json','scripts/prepare.mjs','lib/start.js','lib/next.js',
    'lib/required.cjs','lib/lazy.js','app/new-route/page.tsx','components/view.tsx',
    'components/view.css','components/theme.css','public/new-asset.svg'])
  assert(paths(report).includes(path),`missing discovered ${path}`);
}));

test('uncertain shell, computed imports, filesystem reads, plugins, environment and cycles stay bounded and unresolved',async()=>fixture(async({sourceRoot,temp})=>{
  const sentinel=join(temp,'should-not-be-written');
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'echo uncertain && node scripts/build.mjs'}}));
  await put(sourceRoot,'scripts/build.mjs',`import "./cycle.js"; import(process.env.MODULE);\n`+
    `require('node:fs').readFileSync(process.env.INPUT);\n`+
    `require('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'bad');\n`);
  await put(sourceRoot,'scripts/cycle.js','import "./build.mjs";\n');
  await put(sourceRoot,'vite.config.js','import unknownPlugin from "unknown-plugin"; export default {};\n');
  const sourceCommit=await commit(sourceRoot);
  const report=await audit({sourceRoot,sourceCommit});
  reportShape(report);
  assert(paths(report).includes('vite.config.js'),'tracked alternative configuration is discovered');
  assert(report.unresolved.length>0,'uncertainty cannot become closure proof');
  assert(unresolvedText(report).includes('scripts/build.mjs')||unresolvedText(report).includes('build'),
    'unresolved evidence identifies the build surface');
  await assert.rejects(()=>readFile(sentinel),{code:'ENOENT'});
}));

test('missing literal import and escaping import are reported without escaping the source tree',async()=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'node scripts/build.mjs'}}));
  await put(sourceRoot,'scripts/build.mjs','import "../missing.js"; import "../../outside.js";\n');
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  reportShape(report);
  assert(report.unresolved.length>0);
  assert.match(unresolvedText(report),/missing|outside|escape|import/);
  assert(!paths(report).some(path=>path.startsWith('..')));
}));

test('case collisions and required original-source.zip produce a policy conflict, never an admitted input',async t=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'node scripts/build.mjs'}}));
  await put(sourceRoot,'scripts/build.mjs','import "../app/Foo.js";\n');
  await put(sourceRoot,'app/Foo.js','export const value = 1;');
  await put(sourceRoot,'app/foo.js','export const value = 2;');
  const caseDistinct=(await readdir(join(sourceRoot,'app'))).length===2;
  await put(sourceRoot,'public/original-source.zip',Buffer.from([0x50,0x4b,3,4]));
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  reportShape(report);
  assert(policiesText(report).includes('original-source.zip'),'forbidden required ZIP conflicts with policy');
  assert(!paths(report).includes('public/original-source.zip'),'forbidden ZIP not read/admitted');
  if(caseDistinct)assert(unresolvedText(report).includes('case')||policiesText(report).includes('case'),
    'case ambiguity is visible');
  else t.diagnostic('Filesystem folded case aliases; the ZIP policy conflict remains tested');
}));

test('stage inventory compares exact, absent, extra and changed bytes',async()=>fixture(async({sourceRoot,temp})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'vinext build'}}));
  await put(sourceRoot,'app/page.tsx','export default function Page(){}\n');
  await put(sourceRoot,'public/logo.svg','<svg/>');
  const sourceCommit=await commit(sourceRoot),stageRoot=join(temp,'stage');
  await mkdir(stageRoot);
  for(const path of ['package.json','app/page.tsx','public/logo.svg'])
    await put(stageRoot,path,await readFile(join(sourceRoot,...path.split('/'))));
  const exact=await audit({sourceRoot,sourceCommit,stageRoot});
  reportShape(exact);
  assert(exact.stageComparison,'stage comparison is populated');
  assert.equal(exact.stageComparison.matches,true);
  assert.equal(exact.stageComparison.scope,'discovered-policy-allowed-inputs-only');
  // Same-size corruption must exercise hashes, not just the byte-count guard.
  await put(stageRoot,'public/logo.svg','<svg >');
  const binaryChanged=await audit({sourceRoot,sourceCommit,stageRoot});
  assert.equal(binaryChanged.stageComparison.matches,false);
  assert(binaryChanged.stageComparison.issues.some(row=>row.path==='public/logo.svg'&&row.code==='STAGE_BLOB_MISMATCH'));
  await put(stageRoot,'public/logo.svg','<svg/>');
  const original=await readFile(join(sourceRoot,'app','page.tsx'));
  await put(stageRoot,'app/page.tsx',Buffer.alloc(original.length,32));
  const textChanged=await audit({sourceRoot,sourceCommit,stageRoot});
  assert(textChanged.stageComparison.issues.some(row=>row.path==='app/page.tsx'&&row.code==='STAGE_HASH_MISMATCH'));
  await put(stageRoot,'app/page.tsx','changed');
  await put(stageRoot,'extra.txt','extra');
  await rm(join(stageRoot,'public','logo.svg'));
  const changed=await audit({sourceRoot,sourceCommit,stageRoot});
  reportShape(changed);
  assert.notDeepEqual(changed.stageComparison,exact.stageComparison);
  assert.match(compareText(changed),/app\/page.tsx/);
  assert.match(compareText(changed),/public\/logo.svg/);
  assert.match(compareText(changed),/extra.txt/);
}));

test('forbidden imported bytes and recovery-named public inputs are identified without reading or disclosing them',async()=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'node scripts/build.mjs'}}));
  await put(sourceRoot,'scripts/build.mjs','import "../.env";\n');
  await put(sourceRoot,'.env','private-fixture-sentinel-must-not-be-in-report');
  await put(sourceRoot,'public/models/recovery-source.glb','fictional held asset');
  await put(sourceRoot,'public/models/bodyparts3d-v3/abdominal-wall/original-source.zip','fictional held archive');
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  reportShape(report);
  for(const path of['.env','public/models/recovery-source.glb','public/models/bodyparts3d-v3/abdominal-wall/original-source.zip']){
    assert(report.policyConflicts.some(row=>row.path===path),path);
    assert(!paths(report).includes(path));
  }
  assert(!JSON.stringify(report).includes('private-fixture-sentinel'));
}));

test('build alias cycles stay unresolved without omitting later recognized commands',async()=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'npm run first && node scripts/known.mjs',first:'npm run build'}}));
  await put(sourceRoot,'scripts/known.mjs','export const marker = 1;\n');
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  assert(report.unresolved.some(row=>row.code==='BUILD_SCRIPT_CYCLE'));
  assert(paths(report).includes('scripts/known.mjs'));neverAdmitted(report);
}));

test('annotated tag object is not accepted as a full commit identity',async()=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'vinext build'}}));
  await commit(sourceRoot);await git(sourceRoot,'tag','-a','-m','fixture','snapshot');
  const tagObject=await git(sourceRoot,'rev-parse','refs/tags/snapshot');
  await assert.rejects(()=>audit({sourceRoot,sourceCommit:tagObject}));
}));

test('explicit npm invocations include lifecycle inputs without inventing hooks around automatic hooks',async()=>fixture(async({sourceRoot})=>{
  const scripts={build:'npm run alias && npm run manual',prebuild:'node scripts/prebuild.mjs',
    postbuild:'node scripts/postbuild.mjs',alias:'node scripts/alias.mjs',
    prealias:'node scripts/prealias.mjs',postalias:'node scripts/postalias.mjs',
    manual:'npm run preexplicit',preexplicit:'node scripts/explicit.mjs',
    prepreexplicit:'node scripts/explicit-pre.mjs',postpreexplicit:'node scripts/explicit-post.mjs',
    preprebuild:'node scripts/should-not-discover.mjs'};
  await put(sourceRoot,'package.json',JSON.stringify({scripts}));
  const expected=['prebuild','postbuild','alias','prealias','postalias','explicit','explicit-pre','explicit-post'];
  for(const name of [...expected,'should-not-discover'])
    await put(sourceRoot,`scripts/${name}.mjs`,'export const fixture = true;\n');
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  for(const name of expected)assert(paths(report).includes(`scripts/${name}.mjs`),name);
  assert(!paths(report).includes('scripts/should-not-discover.mjs'));
  assert(!report.unresolved.some(row=>row.code==='BUILD_SCRIPT_CYCLE'));
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{...scripts,prebuild:'npm run build',postalias:42}}));
  const cycleCommit=await commit(sourceRoot),cycle=await audit({sourceRoot,sourceCommit:cycleCommit});
  assert(cycle.unresolved.some(row=>row.code==='BUILD_SCRIPT_CYCLE'));
  assert(cycle.unresolved.some(row=>row.code==='BUILD_SCRIPT_MISSING'));
  assert(paths(cycle).includes('scripts/postbuild.mjs'),'later hook still discovered after cycle');
  neverAdmitted(cycle);
}));

test('TypeScript import-equals require discovers a literal tracked input',async()=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'vinext build'}}));
  await put(sourceRoot,'app/page.ts','import local = require("../lib/local"); export const value = local;\n');
  await put(sourceRoot,'lib/local.ts','const local = 1; export = local;\n');
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  assert(paths(report).includes('lib/local.ts'));neverAdmitted(report);
}));

test('Git-tree symlinks are refused without relying on native symlink privileges',async()=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'vinext build'}}));
  await put(sourceRoot,'link-target.txt','../private/never-read');
  const blob=await git(sourceRoot,'hash-object','-w','link-target.txt');
  await git(sourceRoot,'update-index','--add','--cacheinfo',`120000,${blob},app/link.js`);
  await git(sourceRoot,'add','package.json');
  await git(sourceRoot,'commit','--quiet','-m','fixture with virtual link');
  const sourceCommit=await git(sourceRoot,'rev-parse','HEAD'),report=await audit({sourceRoot,sourceCommit});
  assert(report.unresolved.some(row=>row.path==='app/link.js'&&row.code==='NONREGULAR_GIT_INPUT'));
  assert(!paths(report).includes('app/link.js'));neverAdmitted(report);
}));

test('Git-tree case collision refuses even on a case-folding filesystem',async()=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'vinext build'}}));
  await put(sourceRoot,'fixture.txt','fixture');
  const blob=await git(sourceRoot,'hash-object','-w','fixture.txt');
  await git(sourceRoot,'-c','core.ignorecase=false','update-index','--add','--cacheinfo',`100644,${blob},app/Foo.js`);
  await git(sourceRoot,'-c','core.ignorecase=false','update-index','--add','--cacheinfo',`100644,${blob},app/foo.js`);
  await git(sourceRoot,'add','package.json');
  await git(sourceRoot,'commit','--quiet','-m','fixture with virtual case collision');
  const sourceCommit=await git(sourceRoot,'rev-parse','HEAD');
  await assert.rejects(()=>audit({sourceRoot,sourceCommit}),error=>error.code==='CASE_COLLISION');
}));

test('oversized code input is reported before blob parsing',async()=>fixture(async({sourceRoot})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'vinext build'}}));
  await put(sourceRoot,'app/too-large.ts',Buffer.alloc(16*1024*1024+1,32));
  const sourceCommit=await commit(sourceRoot),report=await audit({sourceRoot,sourceCommit});
  assert(report.unresolved.some(row=>row.path==='app/too-large.ts'&&row.code==='CODE_SIZE_LIMIT'));
  assert(!paths(report).includes('app/too-large.ts'));neverAdmitted(report);
}));

test('invalid commit, invalid root and unsafe caller input fail closed',async()=>fixture(async({sourceRoot,temp})=>{
  await put(sourceRoot,'package.json',JSON.stringify({scripts:{build:'vinext build'}}));
  const sourceCommit=await commit(sourceRoot);
  for(const invalid of ['HEAD',sourceCommit.slice(0,12),'0'.repeat(40),'../escape',''])
    await assert.rejects(()=>audit({sourceRoot,sourceCommit:invalid}),`reject ${invalid}`);
  await assert.rejects(()=>audit({sourceRoot:join(temp,'missing'),sourceCommit}));
  await assert.rejects(()=>audit({sourceRoot:join(sourceRoot,'package.json'),sourceCommit}));
  // The optional stage must be an actual directory; caller inventories have no authority.
  await assert.rejects(()=>audit({sourceRoot,sourceCommit,stageRoot:join(temp,'missing')}));
}));
