import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executionPlan, main } from '../scripts/run-website-tests.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '.local', 'mirror-fixtures');
mkdirSync(fixtures, { recursive: true });
const exactWrapper = readFileSync(join(here, 'atlas-glottic-muscle-imaging.test.ts'));
const targetName = 'atlas-glottic-muscle-imaging.test.mjs';

function fixture({ changedWrapper = false, fails = false } = {}) {
  const root = mkdtempSync(join(fixtures, 'mirror-'));
  mkdirSync(join(root, 'tests'));
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  writeFileSync(join(root, 'tests', 'atlas-glottic-muscle-imaging.test.ts'),
    changedWrapper ? Buffer.concat([exactWrapper, Buffer.from('// changed wrapper\n')]) : exactWrapper);
  writeFileSync(join(root, 'tests', targetName),
    `import test from 'node:test'; import {appendFileSync} from 'node:fs'; test('mirrored assertion',()=>{appendFileSync('.local/mirror-count','x'); ${fails ? "throw Error('expected mirror failure')" : "assertPass()"}}); function assertPass() {}\n`);
  writeFileSync(join(root, 'tests', 'other.test.mjs'), "import test from 'node:test'; test('other root',()=>{});\n");
  return root;
}
async function capture(root) {
  const original = console.log;
  let summary;
  console.log = line => { summary = JSON.parse(line); };
  try {
    const code = await main(['--root', root, '--run']);
    return { code, summary,
      manifest: JSON.parse(readFileSync(join(summary.output, 'manifest.json'))),
      receipt: JSON.parse(readFileSync(join(summary.output, 'receipt.json'))) };
  } finally { console.log = original; }
}

test('exact wrapper keeps both discovered paths and runs mirrored assertion once', async () => {
  const root = fixture();
  const result = await capture(root);
  const execution = result.manifest.execution;
  assert.equal(result.code, 0);
  assert.equal(execution.mirror.active, true);
  assert.equal(execution.mirror.capability.supported, true);
  assert.deepEqual(result.manifest.entries,
    ['tests/atlas-glottic-muscle-imaging.test.mjs', 'tests/atlas-glottic-muscle-imaging.test.ts', 'tests/other.test.mjs']);
  assert.deepEqual(execution.coveredByImport.map(item => item.path), ['tests/atlas-glottic-muscle-imaging.test.mjs']);
  assert.deepEqual(execution.executedRoots,
    ['tests/atlas-glottic-muscle-imaging.test.ts', 'tests/other.test.mjs']);
  assert.deepEqual(result.receipt.counts, { tests: 2, pass: 2, fail: 0, cancelled: 0, skipped: 0, todo: 0 });
  assert.equal(readFileSync(join(root, '.local', 'mirror-count'), 'utf8'), 'x');
  assert.deepEqual(JSON.parse(readFileSync(join(result.summary.output, 'started.json'))).args,
    execution.args);
  assert.equal(execution.args.length, 9);
  assert.deepEqual(execution.args.slice(1,5),[
    '--test-reporter=spec','--test-reporter-destination=stdout',
    '--test-reporter=tap',`--test-reporter-destination=${join(result.summary.output,'child.tap')}`]);
  assert.match(readFileSync(join(result.summary.output,'child.tap'),'utf8'), /^TAP version 13/);
});

test('failure in mirrored target propagates from wrapper', async () => {
  const result = await capture(fixture({ fails: true }));
  assert.equal(result.manifest.execution.mirror.active, true);
  assert.equal(result.code, 1);
  assert.equal(result.receipt.passingClaim, false);
  assert.equal(result.receipt.counts.fail, 1);
});

test('changed wrapper retains both original globs and runs both roots', async () => {
  const root = fixture({ changedWrapper: true });
  const result = await capture(root);
  assert.equal(result.code, 0);
  assert.equal(result.manifest.execution.mirror.active, false);
  assert.deepEqual(result.manifest.execution.coveredByImport, []);
  assert.equal(result.receipt.counts.tests, 3);
  assert.equal(readFileSync(join(root, '.local', 'mirror-count'), 'utf8'), 'xx');
  assert.equal(result.manifest.execution.args.at(-1), 'tests/*.test.mjs');
});

test('malformed wrapper falls back without claiming import coverage', async () => {
  const root = fixture();
  writeFileSync(join(root, 'tests', 'atlas-glottic-muscle-imaging.test.ts'),
    "import test from 'node:test'; test('replacement wrapper',()=>{});\n");
  const result = await capture(root);
  assert.equal(result.code, 0);
  assert.equal(result.manifest.execution.mirror.active, false);
  assert.deepEqual(result.manifest.execution.coveredByImport, []);
  assert.deepEqual(result.manifest.execution.executedRoots, result.manifest.entries);
  assert.equal(result.receipt.counts.tests, 3);
  assert.equal(readFileSync(join(root, '.local', 'mirror-count'), 'utf8'), 'x');
});

test('unsupported CLI capability falls back before child launch', async () => {
  const root = fixture();
  const listed = await capture(root);
  const plan = await executionPlan(listed.manifest, listed.summary.output,
    { probe: async () => ({ supported: false, reason: 'synthetic unsupported Node' }) });
  assert.equal(plan.mirror.active, false);
  assert.equal(plan.mirror.eligible, true);
  assert.deepEqual(plan.coveredByImport, []);
  assert.equal(plan.args.at(-1), 'tests/*.test.mjs');
  assert.deepEqual(plan.executedRoots, listed.manifest.entries);
});
