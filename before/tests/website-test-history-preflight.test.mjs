import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { assertWebsiteTestHistory, expectedIndexedModelPaths, requiredWebsiteRevisions } from '../scripts/website-test-history-preflight.mjs';

const commit = 'a'.repeat(40);
const model = 'public/atlas-runtime/head-neck/models/sample.glb';
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'vm-history-preflight-'));
  mkdirSync(join(root, 'lib'));
  writeFileSync(join(root, 'lib', 'atlas-model-inventory.json'), JSON.stringify({
    schemaVersion: 1, models: [{ paths: ['/atlas-runtime/head-neck/models/sample.glb'] }],
  }));
  return root;
}
function fakeGit({ absentRevision = false, indexed = true } = {}) {
  const calls = [];
  const git = (_root, args) => {
    calls.push(args);
    if (args[0] === 'cat-file') {
      if (absentRevision) throw new Error('missing object');
      return Buffer.alloc(0);
    }
    if (args[0] === 'ls-files') return Buffer.from(indexed ? `100644 ${'b'.repeat(40)} 0\t${model}\0` : '');
    throw new Error(`unexpected Git command ${args[0]}`);
  };
  return { git, calls };
}

test('missing immutable commit refuses before index query and before output/child', () => {
  const root = fixture(), { git, calls } = fakeGit({ absentRevision: true });
  assert.throws(() => assertWebsiteTestHistory(root, { git, revisions: [commit] }), /missing immutable Website commit/);
  assert.deepEqual(calls.map(args => args[0]), ['cat-file']);
  assert.deepEqual(readdirSync(root).sort(), ['lib']);
});

test('present model file with absent index entry refuses without repair or output', () => {
  const root = fixture(), { git, calls } = fakeGit({ indexed: false });
  mkdirSync(join(root, 'public', 'atlas-runtime', 'head-neck', 'models'), { recursive: true });
  writeFileSync(join(root, model), 'synthetic model bytes');
  assert.throws(() => assertWebsiteTestHistory(root, { git, revisions: [commit] }), /absent from the local Git index/);
  assert.deepEqual(calls.map(args => args[0]), ['cat-file', 'ls-files']);
  assert.equal(readFileSync(join(root, model), 'utf8'), 'synthetic model bytes');
  assert.deepEqual(readdirSync(root).sort(), ['lib', 'public']);
});

test('indexed models pass with unrelated staged and unstaged code', () => {
  const root = fixture(), { git, calls } = fakeGit();
  writeFileSync(join(root, 'staged.ts'), 'staged synthetic change');
  writeFileSync(join(root, 'unstaged.ts'), 'unstaged synthetic change');
  assert.deepEqual(assertWebsiteTestHistory(root, { git, revisions: [commit] }), {
    checkedRevisions: 1, indexedModelPaths: 1,
  });
  assert.deepEqual(calls.map(args => args[0]), ['cat-file', 'ls-files']);
  assert.equal(readFileSync(join(root, 'staged.ts'), 'utf8'), 'staged synthetic change');
  assert.equal(readFileSync(join(root, 'unstaged.ts'), 'utf8'), 'unstaged synthetic change');
  assert.deepEqual(readdirSync(root).sort(), ['lib', 'staged.ts', 'unstaged.ts']);
});

test('inventory paths are exact indexed paths and malformed paths refuse', () => {
  assert.deepEqual(expectedIndexedModelPaths({ schemaVersion: 1, models: [{ paths: [
    '/atlas-runtime/head-neck/models/sample.glb', '/atlas-runtime/head-neck/models/sample.glb',
  ] }] }), [model]);
  assert.throws(() => expectedIndexedModelPaths({ schemaVersion: 1, models: [{ paths: ['/atlas-runtime/../outside.glb'] }] }), /invalid model path/);
});

const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(root,args)=>execFileSync('git',['-C',root,...args],{windowsHide:true,maxBuffer:2e6}).toString().trim();
function cliFixture({history=true,index=false,previews=true}={}){
  const parent=join(site,'.local','history-preflight-fixtures');mkdirSync(parent,{recursive:true});
  const root=mkdtempSync(join(parent,'source-'));
  for(const dir of ['lib','scripts','tests'])mkdirSync(join(root,dir));
  writeFileSync(join(root,'package.json'),'{"type":"module"}\n');
  writeFileSync(join(root,'tests','probe.test.mjs'),"import test from 'node:test';import{writeFileSync}from'node:fs';test('synthetic child',()=>writeFileSync('.local/child-ran','yes'));\n");
  copyFileSync(join(site,'lib','atlas-model-inventory.json'),join(root,'lib','atlas-model-inventory.json'));
  for(const name of ['run-website-tests.mjs','public-preview-preflight.mjs','website-test-history-preflight.mjs'])copyFileSync(join(site,'scripts',name),join(root,'scripts',name));
  if(previews){
    const dir=join(root,'public','media','atlas');mkdirSync(dir,{recursive:true});
    for(const name of ['manifest.json','NOTICES.md','3d-detail-preview.jpg','ct-preview.png','mri-preview.png','ultrasound-preview.jpg','xray-preview.png'])copyFileSync(join(site,'public','media','atlas',name),join(dir,name));
  }
  git(root,['init','--quiet']);
  if(history){
    const objects=resolve(site,git(site,['rev-parse','--git-path','objects']));
    writeFileSync(join(root,'.git','objects','info','alternates'),objects.replaceAll('\\','/')+'\n');
    git(root,['update-ref','HEAD',requiredWebsiteRevisions[0]]);
    if(index)git(root,['read-tree','HEAD']); // Explicit synthetic test setup; product preflight remains read-only.
  }
  return root;
}
function cli(root,mode='--run'){
  const env={...process.env};delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath,[join(root,'scripts','run-website-tests.mjs'),mode],{cwd:root,env,windowsHide:true,encoding:'utf8',maxBuffer:2e6});
}

test('real default CLI refuses missing history and index before output or child',()=>{
  for(const [options,message]of [[{history:false},/missing immutable Website commit/],[{history:true,index:false},/absent from the local Git index/]]){
    const root=cliFixture(options),result=cli(root);
    assert.equal(result.status,1,result.stderr);assert.equal(result.stdout,'');assert.match(result.stderr,message);
    assert.equal(existsSync(join(root,'.local')),false,'No receipt, glob probe or child created');
    assert.equal(existsSync(join(root,'.local','child-ran')),false);
  }
});

test('real default CLI retains list mode and runs normally with valid indexed context',()=>{
  const listRoot=cliFixture({history:false,previews:false}),listed=cli(listRoot,'--list');
  assert.equal(listed.status,0,listed.stderr);assert.equal(JSON.parse(listed.stdout).launched,false);
  assert.equal(existsSync(join(listRoot,'.local','child-ran')),false);
  const root=cliFixture({history:true,index:true}),result=cli(root);
  assert.equal(result.status,0,result.stderr);
  const summary=JSON.parse(result.stdout);assert.equal(summary.passingClaim,true);assert.equal(summary.unskippedPassingClaim,true);
  assert.equal(readFileSync(join(root,'.local','child-ran'),'utf8'),'yes');
  const receipt=JSON.parse(readFileSync(join(summary.output,'receipt.json'),'utf8'));
  assert.equal(receipt.testInputDrift,false);assert.equal(receipt.publicPreviewAssetDrift,false);
});

test('runner change and preview-fixture dependency are exact minimal additions',()=>{
  let runner=readFileSync(join(site,'scripts','run-website-tests.mjs'),'utf8');
  for(const line of ["import { assertWebsiteTestHistory } from './website-test-history-preflight.mjs';","  if (run && resolve(root) === scriptRoot) assertWebsiteTestHistory(root);"]){
    const ending=runner.includes('\r\n')?'\r\n':'\n';assert.equal(runner.split(line+ending).length,2);runner=runner.replace(line+ending,'');
  }
  assert.equal(sha(Buffer.from(runner)),'aa4461d742d1e2e3470b7d801539a76441ad1e3d7e61244ddab246800876fa01');
  const current=readFileSync(join(site,'tests','run-website-tests-public-preview.test.mjs'),'utf8');
  const added="['run-website-tests.mjs','public-preview-preflight.mjs','website-test-history-preflight.mjs']";
  assert.equal(current.split(added).length,2);
  assert.equal(sha(Buffer.from(current.replace(added,"['run-website-tests.mjs','public-preview-preflight.mjs']"))),'32260e68fdb075418be50118754587a618c1275143379cecee1481e98f30cbea','All existing public-asset assertions retained byte-exact');
});
