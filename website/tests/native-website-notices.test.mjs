import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const proposalRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(process.env.NATIVE_WEBSITE_SOURCE_ROOT ?? proposalRoot);
const script = join(proposalRoot, 'scripts/native-website-notices.mjs');
const original = JSON.parse(readFileSync(join(proposalRoot, 'LICENSES/native-website/distribution-notices.json'), 'utf8'));
const output = 'public/licenses/native-website-NOTICES.txt';
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'vm-notices-'));
  const paths = new Set(original.packages.flatMap(p => [p.packageJsonPath, ...p.texts.map(t => t.path)]));
  for (const p of paths) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    copyFileSync(join(sourceRoot, p), join(root, p));
  }
  mkdirSync(join(root, 'LICENSES/native-website'), { recursive: true });
  mkdirSync(join(root, 'public/licenses'), { recursive: true });
  writeFileSync(join(root, 'LICENSES/native-website/distribution-notices.json'), JSON.stringify(original));
  return root;
}
function run(root, mode) {
  return spawnSync(process.execPath, ['--max-old-space-size=384', script, mode, '--root', root], { encoding: 'utf8' });
}
function mutate(root, fn) {
  const path = join(root, 'LICENSES/native-website/distribution-notices.json');
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  fn(manifest);
  writeFileSync(path, JSON.stringify(manifest));
}
function withFixture(fn) {
  const root = fixture();
  try { fn(root); } finally {
    const target = resolve(root);
    assert.equal(dirname(target), resolve(tmpdir()), 'Cleanup stays directly within the test temporary directory');
    assert(basename(target).startsWith('vm-notices-'), 'Only this fixture may be removed');
    rmSync(target, { recursive: true, force: true });
  }
}
test('generates a repeatable complete notice and checks the output', () => withFixture(root => {
  assert.equal(run(root, '--write').status, 0);
  const first = readFileSync(join(root, output));
  const text = first.toString('utf8');
  assert.match(text, /jose@5\.10\.0[\s\S]*Copyright \(c\) 2018 Filip Skokan/);
  for (const name of ['@livekit/components-react@2.9.24', '@livekit/components-styles@1.2.0', '@livekit/protocol@1.48.0', 'livekit-client@2.22.0', 'livekit-server-sdk@2.18.0']) assert.ok(text.includes(name));
  assert.equal(run(root, '--write').status, 0);
  assert.deepEqual(readFileSync(join(root, output)), first);
  assert.equal(run(root, '--check').status, 0);
}));
test('rejects version changes and package inventory changes', () => withFixture(root => {
  assert.equal(run(root, '--write').status, 0);
  mutate(root, m => { m.packages[0].version = '999.0.0'; });
  assert.notEqual(run(root, '--check').status, 0);
  mutate(root, m => { m.packages[0].version = original.packages[0].version; m.packages.pop(); });
  assert.notEqual(run(root, '--check').status, 0);
  mutate(root, m => { m.packages = structuredClone(original.packages); m.packages.push(structuredClone(m.packages[0])); });
  assert.notEqual(run(root, '--check').status, 0);
}));
test('rejects installed metadata version drift', () => withFixture(root => {
  assert.equal(run(root, '--write').status, 0);
  const path = join(root, original.packages[0].packageJsonPath);
  const metadata = JSON.parse(readFileSync(path, 'utf8'));
  metadata.version = '999.0.0';
  writeFileSync(path, JSON.stringify(metadata));
  assert.notEqual(run(root, '--check').status, 0);
}));
test('rejects changed licence bytes and missing root NOTICE', () => withFixture(root => {
  assert.equal(run(root, '--write').status, 0);
  const jose = original.packages.find(p => p.name === 'jose').texts[0].path;
  writeFileSync(join(root, jose), readFileSync(join(root, jose), 'utf8') + '\nchanged');
  assert.notEqual(run(root, '--check').status, 0);
  copyFileSync(join(sourceRoot, jose), join(root, jose));
  rmSync(join(root, jose));
  assert.notEqual(run(root, '--check').status, 0);
}));
test('rejects a newly present unlisted root NOTICE and public output drift', () => withFixture(root => {
  assert.equal(run(root, '--write').status, 0);
  const rootDir = dirname(join(root, original.packages[0].packageJsonPath));
  writeFileSync(join(rootDir, 'NOTICE'), 'extra attribution');
  assert.notEqual(run(root, '--check').status, 0);
  rmSync(join(rootDir, 'NOTICE'));
  writeFileSync(join(root, output), 'drift');
  assert.notEqual(run(root, '--check').status, 0);
}));
