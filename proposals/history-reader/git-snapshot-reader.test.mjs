import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openGitSnapshot, parseTree, verifyObject } from './git-snapshot-reader.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const sourceReader = 'G:/VisibleMedicine-temp/staging/20261031-release14-shoulder-ready/website/tests/git-object-reader.mjs';
const { createGitObjectReader } = await import(pathToFileURL(sourceReader).href);
const oid = (type, bytes) => createHash('sha1').update(`${type} ${bytes.length}\0`).update(bytes).digest('hex');
const treeEntry = (mode, name, hash = 'a'.repeat(40)) =>
  Buffer.concat([Buffer.from(`${mode} ${name}\0`), Buffer.from(hash, 'hex')]);
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 100_000 }).trim();

test('synthetic metadata rejects mutation, malformed records, unsafe paths and wrong types', () => {
  const bytes = Buffer.from('tree ' + 'a'.repeat(40) + '\n');
  const id = oid('commit', bytes);
  assert.deepEqual(verifyObject('commit', id, bytes), bytes);
  assert.throws(() => verifyObject('commit', id, Buffer.concat([bytes, Buffer.from('x')])), /hash mismatch/);
  assert.throws(() => verifyObject('tree', id, bytes), /hash mismatch/);
  const rawTree = treeEntry('100644', 'safe.txt');
  assert.throws(() => verifyObject('tree', oid('tree', rawTree), Buffer.concat([rawTree, Buffer.from('x')])), /hash mismatch/);
  assert.throws(() => verifyObject('commit', 'HEAD', bytes), /exact lowercase/);
  for (const entry of [
    Buffer.from('100644 broken\0'), treeEntry('120000', 'link'),
    treeEntry('160000', 'submodule'), treeEntry('100644', '..'),
    treeEntry('100644', 'a/b'), treeEntry('100644', 'CON'),
    treeEntry('100644', 'back\\slash'),
    Buffer.concat([treeEntry('100644', 'dup'), treeEntry('100644', 'dup')]),
  ]) assert.throws(() => parseTree(entry));
  assert.deepEqual(parseTree(treeEntry('100644', 'safe.txt'))[0],
    { mode: '100644', name: 'safe.txt', oid: 'a'.repeat(40) });
});

test('real small Git fixture yields exact recursive blob map and rejects missing paths and commits', async () => {
  const fixture = mkdtempSync(join(here, '.fixture-'));
  assert(resolve(fixture).startsWith(resolve(here) + sep), 'Fixture cleanup must stay inside proposal');
  let snapshot;
  try {
    git(fixture, 'init', '-q');
    git(fixture, 'config', 'user.email', 'fixture@example.invalid');
    git(fixture, 'config', 'user.name', 'Fixture');
    mkdirSync(join(fixture, 'nested'));
    writeFileSync(join(fixture, 'a.txt'), 'one');
    writeFileSync(join(fixture, 'nested', 'b.txt'), 'two');
    git(fixture, 'add', '--', 'a.txt', 'nested/b.txt');
    git(fixture, 'commit', '-qm', 'fixture');
    const commit = git(fixture, 'rev-parse', 'HEAD');
    snapshot = await openGitSnapshot({ cwd: fixture, commit, createBlobReader: createGitObjectReader });
    assert.deepEqual(snapshot.paths().sort(), ['a.txt', 'nested/b.txt']);
    assert.equal(snapshot.oidFor('a.txt'), git(fixture, 'rev-parse', 'HEAD:a.txt'));
    assert.equal((await snapshot.read('nested/b.txt')).toString(), 'two');
    await assert.rejects(snapshot.read('absent.txt'), /Missing Git snapshot path/);
    await assert.rejects(snapshot.read('nested'), /Missing Git snapshot path/);
    await assert.rejects(snapshot.read('../a.txt'), /Unsafe Git path/);
    await snapshot.close(); snapshot = undefined;
    await assert.rejects(openGitSnapshot({ cwd: fixture, commit: 'f'.repeat(40), createBlobReader: createGitObjectReader }));
    await assert.rejects(openGitSnapshot({ cwd: fixture, commit: git(fixture, 'rev-parse', 'HEAD:a.txt'), createBlobReader: createGitObjectReader }));
    const malformed = execFileSync('git', ['hash-object', '-t', 'commit', '--literally', '-w', '--stdin'],
      { cwd: fixture, input: 'parent ' + commit + '\n', encoding: 'utf8' }).trim();
    await assert.rejects(openGitSnapshot({ cwd: fixture, commit: malformed, createBlobReader: createGitObjectReader }), /Malformed Git commit tree header/);
  } finally {
    await snapshot?.close();
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('real fixture limits refuse metadata and blob over budget', async () => {
  const fixture = mkdtempSync(join(here, '.fixture-'));
  assert(resolve(fixture).startsWith(resolve(here) + sep));
  let snapshot;
  try {
    git(fixture, 'init', '-q');
    git(fixture, 'config', 'user.email', 'fixture@example.invalid');
    git(fixture, 'config', 'user.name', 'Fixture');
    writeFileSync(join(fixture, 'big.txt'), '123456789');
    git(fixture, 'add', '--', 'big.txt');
    git(fixture, 'commit', '-qm', 'fixture');
    const commit = git(fixture, 'rev-parse', 'HEAD');
    await assert.rejects(openGitSnapshot({ cwd: fixture, commit, createBlobReader: createGitObjectReader, maxObjectBytes: 8 }));
    snapshot = await openGitSnapshot({ cwd: fixture, commit, createBlobReader: createGitObjectReader, maxBlobBytes: 8 });
    await assert.rejects(snapshot.read('big.txt'), /byte limit/);
  } finally {
    await snapshot?.close();
    rmSync(fixture, { recursive: true, force: true });
  }
});
