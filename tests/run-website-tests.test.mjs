import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRegularStat, launch, main } from '../scripts/run-website-tests.mjs';

const syntheticRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '.local', 'complete-runner-fixtures');
mkdirSync(syntheticRoot, { recursive: true });

function fixture() {
  const root = mkdtempSync(join(syntheticRoot, 'vm-complete-test-runner-'));
  mkdirSync(join(root, 'tests'));
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  return root;
}
function receipt(output) { return JSON.parse(readFileSync(join(output, 'receipt.json'))); }
async function captured(argv) {
  const prior = console.log;
  let line;
  console.log = text => { line = JSON.parse(text); };
  try { const code = await main(argv); return { code, ...line, receipt: receipt(line.output), manifest: JSON.parse(readFileSync(join(line.output, 'manifest.json'))) }; }
  finally { console.log = prior; }
}

test('default lists both suffixes, retains wrapper and target, launches nothing', async () => {
  const root = fixture();
  writeFileSync(join(root, 'tests', 'wrapper.test.ts'), "import './target.test.mjs';\n");
  writeFileSync(join(root, 'tests', 'target.test.mjs'), "import test from 'node:test'; test('ok',()=>{});\n");
  const result = await captured(['--root', root]);
  assert.equal(result.code, 0);
  assert.equal(result.receipt.launched, false);
  assert.deepEqual(result.manifest.entries, ['tests/target.test.mjs', 'tests/wrapper.test.ts']);
  assert.equal(result.manifest.files.filter(file => file.path.startsWith('tests/')).length, 2);
  assert.match(result.manifest.files[0].sha256, /^[a-f0-9]{64}$/);
});

test('synthetic TypeScript and mjs entries run once each through Node globs', async () => {
  const root = fixture();
  writeFileSync(join(root, 'tests', 'one.test.ts'), "import test from 'node:test'; test('typescript',()=>{});\n");
  writeFileSync(join(root, 'tests', 'two.test.mjs'), "import test from 'node:test'; test('module',()=>{});\n");
  const result = await captured(['--root', root, '--run']);
  assert.equal(result.code, 0);
  assert.equal(result.receipt.passingClaim, true);
  assert.equal(result.receipt.unskippedPassingClaim,true);
  assert.deepEqual(result.receipt.counts,{tests:2,pass:2,fail:0,cancelled:0,skipped:0,todo:0});
  assert.equal(result.manifest.entryCount, 2);
  const started=JSON.parse(readFileSync(join(result.output,'started.json')));
  assert(Number.isSafeInteger(started.testPid)&&started.testPid>0);
  assert.equal(started.runnerPid,process.pid);
  assert.deepEqual(started.args,['--test','--experimental-strip-types','--test-concurrency=1','tests/*.test.ts','tests/*.test.mjs']);
  assert.equal(started.sourceSha256,result.manifest.sourceSha256);
  assert.match(readFileSync(join(result.output, 'child.log'), 'utf8'), /typescript/);
  assert.match(readFileSync(join(result.output, 'child.log'), 'utf8'), /module/);
});
test('migration SQL, module declarations and named root configuration are fingerprinted and drift refuses pass',async()=>{
  const root=fixture();
  mkdirSync(join(root,'drizzle'));mkdirSync(join(root,'lib'));mkdirSync(join(root,'.openai'));
  writeFileSync(join(root,'drizzle','example.sql'),'CREATE TABLE synthetic(id INTEGER);\n');
  writeFileSync(join(root,'lib','example.d.mts'),'export declare const synthetic: string;\n');
  writeFileSync(join(root,'.openai','hosting.json'),'{}\n');
  writeFileSync(join(root,'env.d.ts'),'export {};\n');
  writeFileSync(join(root,'tests','change.test.mjs'),"import test from 'node:test';import {appendFileSync} from 'node:fs';test('migration-drift',()=>{appendFileSync('drizzle/example.sql','-- drift\\n')});\n");
  const listed=await captured(['--root',root]);
  for(const path of ['drizzle/example.sql','lib/example.d.mts','.openai/hosting.json','env.d.ts'])assert(listed.manifest.files.some(file=>file.path===path),path);
  const result=await captured(['--root',root,'--run']);
  assert.equal(result.receipt.child.exitCode,0);assert.equal(result.code,1);
  assert.equal(result.receipt.testInputDrift,true);assert.equal(result.receipt.passingClaim,false);
});

test('child failure propagates', async () => {
  const root = fixture();
  writeFileSync(join(root, 'tests', 'fail.test.mjs'), "import test from 'node:test'; test('failure',()=>{throw Error('expected failure')});\n");
  const result = await captured(['--root', root, '--run']);
  assert.equal(result.code, 1);
  assert.equal(result.receipt.passingClaim, false);
});

test('a successful child still records skipped or todo coverage instead of claiming an unskipped pass',async()=>{
  for(const kind of ['skip','todo']){
    const root=fixture();
    writeFileSync(join(root,'tests','limited.test.mjs'),`import test from 'node:test';test.${kind}('synthetic platform limit',()=>{});\n`);
    const result=await captured(['--root',root,'--run']);
    assert.equal(result.code,0);assert.equal(result.receipt.child.exitCode,0);assert.equal(result.receipt.passingClaim,true);
    assert.equal(result.receipt.unskippedPassingClaim,false);
    assert.equal(result.receipt.counts[kind==='skip'?'skipped':'todo'],1);
    assert.match(result.receipt.claimScope,/coverage limits/);
  }
});

test('changed test input after child run blocks a passing claim', async () => {
  const root = fixture();
  const path = join(root, 'tests', 'change.test.mjs');
  writeFileSync(path, "import test from 'node:test'; import {appendFileSync} from 'node:fs'; test('change',()=>{appendFileSync(new URL(import.meta.url),'// drift\\n')});\n");
  const result = await captured(['--root', root, '--run']);
  assert.equal(result.code, 1);
  assert.equal(result.receipt.child.exitCode, 0);
  assert.equal(result.receipt.testInputDrift, true);
  assert.equal(result.receipt.passingClaim, false);
});

test('changed generated atlas-review metadata blocks a passing claim', async () => {
  const root = fixture();
  const generated = join(root, 'atlas-review', 'public', 'models');
  mkdirSync(generated, { recursive: true });
  const catalog = join(generated, 'catalog.json');
  writeFileSync(catalog, '{"revision":1}\n');
  writeFileSync(join(root, 'tests', 'change.test.mjs'),
    "import test from 'node:test'; import {appendFileSync} from 'node:fs'; test('change review metadata',()=>{appendFileSync('atlas-review/public/models/catalog.json','\\n')});\n");
  const result = await captured(['--root', root, '--run']);
  assert.equal(result.code, 1);
  assert.equal(result.receipt.child.exitCode, 0);
  assert.equal(result.receipt.testInputDrift, true);
  assert.equal(result.receipt.passingClaim, false);
  assert.ok(result.manifest.files.some(file => file.path === 'atlas-review/public/models/catalog.json'));
});

test('binary models and private runtime directories stay outside source inventory', async () => {
  const root = fixture();
  writeFileSync(join(root, 'tests', 'one.test.mjs'), "import test from 'node:test'; test('ok',()=>{});\n");
  const atlas = join(root, 'public', 'atlas-runtime');
  mkdirSync(atlas, { recursive: true });
  writeFileSync(join(atlas, 'catalog.json'), '{"kind":"metadata"}\n');
  writeFileSync(join(atlas, 'model.glb'), Buffer.from([0, 1, 2, 3]));
  const hidden = join(atlas, 'private');
  mkdirSync(hidden);
  writeFileSync(join(hidden, 'runtime.json'), '{"secret":"fixture"}\n');
  const result = await captured(['--root', root]);
  assert.ok(result.manifest.files.some(file => file.path === 'public/atlas-runtime/catalog.json'));
  assert.ok(!result.manifest.files.some(file => file.path.endsWith('model.glb') || file.path.includes('/private/')));
});

test('mixed-case private directories and credential filenames are excluded from metadata fingerprints',async()=>{
  const root=fixture();
  writeFileSync(join(root,'tests','one.test.mjs'),"import test from 'node:test';test('ok',()=>{});\n");
  const lib=join(root,'lib');mkdirSync(lib);mkdirSync(join(lib,'PrIvAtE'));mkdirSync(join(lib,'CrEdEnTiAlS'));
  for(const path of [join(lib,'PrIvAtE','hidden.json'),join(lib,'CrEdEnTiAlS','hidden.json'),join(lib,'CREDENTIALS.JSON'),join(lib,'Secrets.json'),join(lib,'.env.private.json')])writeFileSync(path,'{"synthetic":"not-source"}\n');
  writeFileSync(join(lib,'visible.json'),'{}\n');
  const result=await captured(['--root',root]);
  assert.deepEqual(result.manifest.files.filter(file=>file.path.startsWith('lib/')).map(file=>file.path),['lib/visible.json']);
  assert.equal(result.manifest.sourceScope.caseInsensitiveExclusions,true);
  assert.deepEqual(result.manifest.sourceScope.excludedFileNames,['credentials.json','id_ed25519','id_rsa','secrets.json']);
});

test('child start failure and termination are surfaced', async () => {
  const root = fixture();
  const output = mkdtempSync(join(syntheticRoot, 'vm-runner-child-'));
  const start = await launch(root, output, { executable: join(root, 'does-not-exist.exe') });
  assert.equal(start.exitCode, 1);
  assert.match(start.startError, /ENOENT/);
  writeFileSync(join(root, 'tests', 'wait.test.mjs'), "import test from 'node:test'; test('wait',()=>new Promise(resolve=>setTimeout(resolve,2000)));\n");
  const output2 = mkdtempSync(join(syntheticRoot, 'vm-runner-child-'));
  const terminated = await launch(root, output2, { onSpawn: child => setTimeout(() => child.kill('SIGTERM'), 100) });
  assert.notEqual(terminated.exitCode, 0);
  assert.ok(terminated.signal || terminated.exitCode);
});

test('matching nonregular test path fails closed before output or launch', async () => {
  const root = fixture();
  mkdirSync(join(root, 'tests', 'directory.test.mjs'));
  await assert.rejects(main(['--root', root, '--run']), /Nonregular or symlink input/);
});

test('symlink rejection logic fails closed with an injected stat', () => {
  assert.throws(() => assertRegularStat('tests/linked.test.mjs', {
    isFile: () => true, isSymbolicLink: () => true
  }), /Nonregular or symlink input/);
});

test('ambiguous, unknown and incomplete arguments refuse before inventory', async () => {
  for (const argv of [['--run', '--list'], ['--list', '--run'], ['--run', '--run'],
    ['--unknown'], ['--root'], ['--root', '--run'], ['--root', 'a', '--root', 'b']]) {
    await assert.rejects(main(argv), /Specify at most one|Unknown or incomplete argument/);
  }
});
