import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { captureSourceRecovery, verifySourceRecovery, restoreSourceRecovery } from '../scripts/source-recovery.mjs';

async function fixture(t) {
  const parent = path.resolve(os.tmpdir());
  const root = await fs.mkdtemp(path.join(parent, 'vm-source-recovery-'));
  t.after(async () => {
    if (path.dirname(root) !== parent || !path.basename(root).startsWith('vm-source-recovery-')) throw new Error('refusing temp cleanup outside dedicated fixture');
    await fs.rm(root, { recursive: true, force: true });
  });
  const source = path.join(root, 'source');
  await fs.mkdir(path.join(source, 'nested'), { recursive: true });
  await fs.writeFile(path.join(source, 'nested', 'a.txt'), 'alpha');
  await fs.writeFile(path.join(source, '.env.example'), 'PLACEHOLDER=none\n');
  return { root, source, snapshot: path.join(root, 'snapshot'), restored: path.join(root, 'restored') };
}
const paths = ['nested/a.txt', '.env.example'];

test('capture, verify and restore exact local source bytes', async t => {
  const f = await fixture(t);
  const manifest = await captureSourceRecovery({ sourceRoot: f.source, destinationRoot: f.snapshot, paths });
  assert.deepEqual(manifest.files.map(file => file.path), [...paths].sort());
  assert.equal(manifest.scope, 'local-source-only');
  assert.deepEqual(await verifySourceRecovery({ snapshotRoot: f.snapshot }), manifest);
  assert.deepEqual(await restoreSourceRecovery({ snapshotRoot: f.snapshot, destinationRoot: f.restored }), manifest);
  assert.equal(await fs.readFile(path.join(f.restored, 'nested', 'a.txt'), 'utf8'), 'alpha');
});

test('verification rejects changed, missing and extra contents', async t => {
  const f = await fixture(t);
  await captureSourceRecovery({ sourceRoot: f.source, destinationRoot: f.snapshot, paths });
  const copied = path.join(f.snapshot, 'source', 'nested', 'a.txt');
  await fs.writeFile(copied, 'altered');
  await assert.rejects(verifySourceRecovery({ snapshotRoot: f.snapshot }), /mismatch/);
  await assert.rejects(restoreSourceRecovery({ snapshotRoot: f.snapshot, destinationRoot: f.restored }), /mismatch/);
  await assert.rejects(fs.access(f.restored));
  await fs.writeFile(copied, 'alpha');
  await fs.rm(copied);
  await assert.rejects(verifySourceRecovery({ snapshotRoot: f.snapshot }), /missing files/);
  await fs.writeFile(copied, 'alpha');
  await fs.writeFile(path.join(f.snapshot, 'extra.txt'), 'extra');
  await assert.rejects(verifySourceRecovery({ snapshotRoot: f.snapshot }), /extras/);
  await fs.rm(path.join(f.snapshot, 'extra.txt'));
  await fs.mkdir(path.join(f.snapshot, 'empty-extra'));
  await assert.rejects(verifySourceRecovery({ snapshotRoot: f.snapshot }), /extras/);
});

test('unsafe, case-colliding, secret and private extensions refuse capture', async t => {
  const f = await fixture(t);
  const bad = ['../escape', '/absolute', 'nested\\a.txt', 'nested//a.txt', 'nested/./a.txt', 'nested/a.txt:ads', 'bad<name', 'bad>name', 'bad"name', 'bad|name', 'bad?name', 'bad*name', 'CON.txt', '.git/config', 'node_modules/x', '.wrangler/x', '.local/x', 'build/x', '.env.local', 'secret.pem', 'scan.nii.gz', 'records.sqlite', 'bundle.zip'];
  for (const name of bad) {
    await assert.rejects(captureSourceRecovery({ sourceRoot: f.source, destinationRoot: f.snapshot, paths: [name] }), undefined, name);
    await assert.rejects(fs.access(f.snapshot));
  }
  await assert.rejects(captureSourceRecovery({ sourceRoot: f.source, destinationRoot: f.snapshot, paths: ['nested/a.txt', 'NESTED/A.TXT'] }), /case-colliding/);
});

test('existing destinations and overlap refuse without overwriting', async t => {
  const f = await fixture(t);
  await fs.mkdir(f.snapshot);
  await fs.writeFile(path.join(f.snapshot, 'keep'), 'untouched');
  await assert.rejects(captureSourceRecovery({ sourceRoot: f.source, destinationRoot: f.snapshot, paths }), /already exists/);
  assert.equal(await fs.readFile(path.join(f.snapshot, 'keep'), 'utf8'), 'untouched');
  await assert.rejects(captureSourceRecovery({ sourceRoot: f.source, destinationRoot: path.join(f.source, 'inside'), paths }), /overlap/);
  await assert.rejects(captureSourceRecovery({ sourceRoot: f.source, destinationRoot: f.root, paths }), /overlap/);
  await fs.rm(f.snapshot, { recursive: true });
  await captureSourceRecovery({ sourceRoot: f.source, destinationRoot: f.snapshot, paths });
  await assert.rejects(restoreSourceRecovery({ snapshotRoot: f.snapshot, destinationRoot: path.join(f.snapshot, 'inside') }), /overlap/);
  await assert.rejects(restoreSourceRecovery({ snapshotRoot: f.snapshot, destinationRoot: f.root }), /overlap/);
  await fs.mkdir(f.restored);
  await fs.writeFile(path.join(f.restored, 'keep'), 'untouched');
  await assert.rejects(restoreSourceRecovery({ snapshotRoot: f.snapshot, destinationRoot: f.restored }), /already exists/);
  assert.equal(await fs.readFile(path.join(f.restored, 'keep'), 'utf8'), 'untouched');
});

test('source drift before final manifest refuses success receipt', async t => {
  const f = await fixture(t);
  const originalOpen = fs.open;
  const target = path.join(f.source, 'nested', 'a.txt');
  let opens = 0;
  fs.open = async function(file, ...args) {
    if (path.resolve(file) === target && ++opens === 3) await fs.writeFile(target, 'source drift');
    return originalOpen.call(this, file, ...args);
  };
  try {
    await assert.rejects(captureSourceRecovery({ sourceRoot: f.source, destinationRoot: f.snapshot, paths: ['nested/a.txt'] }), /source changed during capture/);
  } finally { fs.open = originalOpen; }
  assert.equal(opens, 3);
  await assert.rejects(fs.access(path.join(f.snapshot, 'manifest.json')));
});

test('symlinked source file is rejected when supported', async t => {
  const f = await fixture(t);
  const link = path.join(f.source, 'linked.txt');
  try { await fs.symlink(path.join(f.source, 'nested', 'a.txt'), link, 'file'); }
  catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP', 'EOPNOTSUPP'].includes(error.code)) return t.skip(`symlinks unavailable: ${error.code}`);
    throw error;
  }
  await assert.rejects(captureSourceRecovery({ sourceRoot: f.source, destinationRoot: f.snapshot, paths: ['linked.txt'] }), /symlink/);
});

test('junction or directory symlink ancestor is rejected when supported', async t => {
  const f = await fixture(t);
  const alias = path.join(f.root, 'alias');
  try { await fs.symlink(f.source, alias, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP', 'EOPNOTSUPP'].includes(error.code)) return t.skip(`directory links unavailable: ${error.code}`);
    throw error;
  }
  await assert.rejects(captureSourceRecovery({ sourceRoot: alias, destinationRoot: f.snapshot, paths }), /symlink/);
});
