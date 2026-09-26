import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, writeFile, unlink, rm, realpath } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGitObjectReader } from './git-object-reader.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixturePrefix = 'git-object-reader-test-';

test('real Git objects retain original bytes with parallel reads, strict limits and explicit closure', { timeout: 30000 }, async () => {
  const local = join(root, '.local');
  await mkdir(local, { recursive: true });
  const fixture = await mkdtemp(join(local, fixturePrefix));
  const readers = [];
  const git = (...args) => execFileSync('git', args, {
    cwd: fixture, windowsHide: true, encoding: 'utf8',
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const reader = options => {
    const instance = createGitObjectReader({ cwd: fixture, ...options });
    readers.push(instance);
    return instance;
  };
  // Wrap calls so both synchronous input rejection and rejected promises count.
  const rejectsRead = (instance, oid) => assert.rejects(
    Promise.resolve().then(() => instance.readBlob(oid)),
  );
  try {
    git('init', '--quiet');
    const originals = new Map([
      ['plain.txt', Buffer.from('original committed text\n')],
      ['empty.bin', Buffer.alloc(0)],
      ['binary.bin', Buffer.from([0, 255, 128, 1, 13, 10, 0, 254])],
      ['newlines.txt', Buffer.from('first\n\nthird\r\nlast\n')],
      ['embedded-nul.txt', Buffer.from('before\0between\n\0after')],
      ['multi-chunk.bin', Buffer.from(Array.from({ length: 300 * 1024 }, (_, index) => index % 256))],
      ['oversized.bin', Buffer.alloc(256, 173)],
    ]);
    // Disable newline conversion locally; exact Git bytes are the test input.
    git('config', 'core.autocrlf', 'false');
    for (const [name, bytes] of originals) await writeFile(join(fixture, name), bytes);
    git('add', '--', ...originals.keys());
    git('-c', 'user.name=Object reader fixture', '-c', 'user.email=fixture@example.invalid',
      'commit', '--quiet', '-m', 'Original byte fixtures');
    const commitOid = git('rev-parse', 'HEAD');
    const treeOid = git('rev-parse', 'HEAD^{tree}');
    const blobs = new Map([...originals.keys()].map(name => [name, git('rev-parse', `HEAD:${name}`)]));
    for (const [index, name] of [...originals.keys()].entries()) {
      if (index % 2) await unlink(join(fixture, name));
      else await writeFile(join(fixture, name), Buffer.from('dirty replacement\0\n'));
    }

    const live = reader();
    // Interleave duplicate and different IDs to catch request/response pairing bugs.
    const requests = [...originals.keys(), ...[...originals.keys()].reverse(),
      'empty.bin', 'binary.bin', 'plain.txt', 'binary.bin', 'embedded-nul.txt', 'multi-chunk.bin'];
    const results = await Promise.all(requests.map(name => live.readBlob(blobs.get(name))));
    for (const [index, bytes] of results.entries()) {
      assert(Buffer.isBuffer(bytes), 'readBlob returns a Buffer');
      assert.deepEqual(bytes, originals.get(requests[index]), `${requests[index]} retains exact committed bytes`);
    }
    // A caller changing its result must not corrupt a later read of that object.
    results[0].fill(0);
    assert.deepEqual(await live.readBlob(blobs.get('plain.txt')), originals.get('plain.txt'));
    await live.close();
    await live.close();
    await rejectsRead(live, blobs.get('plain.txt'));

    const malformed = ['', 'HEAD', 'HEAD:plain.txt', commitOid.slice(0, -1), commitOid + '0',
      'g'.repeat(40), blobs.get('plain.txt') + '\n', '0'.repeat(40) + '\0', null, 42];
    for (const oid of malformed) {
      const instance = reader();
      await rejectsRead(instance, oid);
      await instance.close();
      await instance.close();
    }
    for (const oid of ['0'.repeat(40), commitOid, treeOid]) {
      const instance = reader();
      await rejectsRead(instance, oid);
      await instance.close();
      await instance.close();
      await rejectsRead(instance, blobs.get('empty.bin'));
    }
    const bounded = reader({ maxBytes: 8 });
    assert.deepEqual(await bounded.readBlob(blobs.get('empty.bin')), originals.get('empty.bin'));
    assert.deepEqual(await bounded.readBlob(blobs.get('binary.bin')), originals.get('binary.bin'), 'exact byte limit is admitted');
    await rejectsRead(bounded, blobs.get('oversized.bin'));
    await bounded.close();
    await bounded.close();
    await rejectsRead(bounded, blobs.get('empty.bin'));

    const neverUsed = reader();
    await neverUsed.close();
    await neverUsed.close();
    await rejectsRead(neverUsed, blobs.get('plain.txt'));

    const pending = reader();
    const pendingResults = Promise.allSettled([
      pending.readBlob(blobs.get('multi-chunk.bin')),
      pending.readBlob(blobs.get('binary.bin')),
      pending.readBlob(blobs.get('empty.bin')),
    ]);
    await pending.close();
    for (const result of await pendingResults)
      assert.equal(result.status, 'rejected', 'close rejects active and queued reads');
    await pending.close();
    await rejectsRead(pending, blobs.get('plain.txt'));

    // A nonexistent cwd triggers the real child-process spawn error without
    // changing PATH or relying on child timing; its pending read must settle.
    const missingCwd = reader({ cwd: join(fixture, 'does-not-exist') });
    await rejectsRead(missingCwd, blobs.get('plain.txt'));
    await missingCwd.close();
    await missingCwd.close();
    await rejectsRead(missingCwd, blobs.get('plain.txt'));
  } finally {
    // Attempt every close even when an assertion fails; do not leak cat-file jobs.
    const closures = await Promise.allSettled(readers.map(instance => instance.close()));
    const actual = await realpath(fixture), actualLocal = await realpath(local);
    const rel = relative(actualLocal, actual);
    assert(!isAbsolute(rel) && !rel.startsWith('..') && dirname(actual) === actualLocal
      && basename(actual).startsWith(fixturePrefix) && resolve(actual) !== resolve(actualLocal),
    'cleanup confined to this generated test fixture');
    await rm(actual, { recursive: true, force: true });
    for (const closure of closures) assert.equal(closure.status, 'fulfilled', 'reader cleanup succeeds');
  }
});
