import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {verifyScopedCheckpoint} from '../scripts/verify-scoped-checkpoint.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'vm-scoped-checkpoint-'));
  t.after(async () => {
    assert(resolve(root).startsWith(resolve(tmpdir()) + (process.platform === 'win32' ? '\\' : '/')));
    await rm(root, {recursive:true, force:true});
  });
  const rows = [
    {path:'added.txt', before:null, after:sha('added')},
    {path:'deleted.txt', before:sha('deleted'), after:null},
    {path:'nested/modified.txt', before:sha('old'), after:sha('new')},
  ];
  for (const [side,path,value] of [
    ['after','added.txt','added'], ['before','deleted.txt','deleted'],
    ['before','nested/modified.txt','old'], ['after','nested/modified.txt','new'],
  ]) {
    const file = join(root, side, ...path.split('/'));
    await mkdir(join(file, '..'), {recursive:true});
    await writeFile(file, value);
  }
  const save = async () => writeFile(join(root, 'checkpoint.json'), JSON.stringify({files:rows}));
  await save();
  return {root,rows,save};
}

test('verifies added, deleted and modified scoped copies only', async t => {
  const {root} = await fixture(t);
  assert.deepEqual(await verifyScopedCheckpoint(root), {
    kind:'scoped-checkpoint-integrity', verified:true, files:3, copies:4,
    fullRestoreVerified:false, remoteBackupVerified:false,
  });
});

test('rejects missing and corrupted copies', async t => {
  const {root} = await fixture(t);
  await rm(join(root, 'after', 'added.txt'));
  await assert.rejects(verifyScopedCheckpoint(root), /missing-or-inaccessible-file/);
  await writeFile(join(root, 'after', 'added.txt'), 'corrupt');
  await assert.rejects(verifyScopedCheckpoint(root), /hash-mismatch/);
});

test('rejects duplicate, escaping and malformed manifest records', async t => {
  const {root,rows,save} = await fixture(t);
  rows.push({...rows[0]}); await save();
  await assert.rejects(verifyScopedCheckpoint(root), /duplicate-path/);
  rows.pop();
  for (const path of ['../escape','/absolute','C:/drive','a\\b','a//b','a/./b','a/../b','a\0b',
    'CON','con.txt','aux/report','COM9.log','LPT1','end.','end ','a<b','a>b','a"b','a|b','a?b','a*b','a\u001fb']) {
    rows[0].path = path; await save();
    await assert.rejects(verifyScopedCheckpoint(root), /invalid-path/);
  }
  rows[0].path = 'added.txt'; rows[0].after = 'ABC'; await save();
  await assert.rejects(verifyScopedCheckpoint(root), /invalid-file-hash/);
  rows[0].after = 123; await save();
  await assert.rejects(verifyScopedCheckpoint(root), /invalid-file-hash/);
  rows[0].after = sha('added'); rows.push({...rows[0], path:'ADDED.TXT'}); await save();
  await assert.rejects(verifyScopedCheckpoint(root), /duplicate-path/);
  await writeFile(join(root, 'checkpoint.json'), JSON.stringify({files:[]}));
  await assert.rejects(verifyScopedCheckpoint(root), /invalid-files-array/);
});

test('CLI exits nonzero for missing or tampered copies', async t => {
  const {root} = await fixture(t);
  const cli = join(import.meta.dirname, '..', 'scripts', 'verify-scoped-checkpoint.mjs');
  await rm(join(root, 'after', 'added.txt'));
  let result = spawnSync(process.execPath, [cli, root], {encoding:'utf8'});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /"verified":false/);
  assert.doesNotMatch(result.stderr, /added.txt/);
  await writeFile(join(root, 'after', 'added.txt'), 'tampered');
  result = spawnSync(process.execPath, [cli, root], {encoding:'utf8'});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /hash-mismatch/);
});

test('rejects a linked ancestor without touching its target', async t => {
  const {root,rows,save} = await fixture(t);
  const target = join(root, 'target');
  await mkdir(target);
  const link = join(root, 'after', 'linked');
  try { await symlink(target, link, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) {
    if (['EPERM','EACCES','ENOTSUP'].includes(error.code)) return t.skip('link creation unavailable');
    throw error;
  }
  rows.push({path:'linked/file.txt', before:null, after:sha('x')}); await save();
  await assert.rejects(verifyScopedCheckpoint(root), /linked-path/);
});
