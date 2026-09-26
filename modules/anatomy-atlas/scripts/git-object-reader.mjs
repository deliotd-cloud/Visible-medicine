// Test-only, exact Git blob reads. No working-tree fallback or persisted cache.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

export function createGitObjectReader({ cwd, maxBytes = 16000000 }) {
  assert(Number.isSafeInteger(maxBytes) && maxBytes >= 0, 'Invalid Git blob limit');
  let child, closed = false, terminalError, done = Promise.resolve();
  let buffered = Buffer.alloc(0), active, timer;
  const queue = [];
  function fail(error) {
    terminalError ||= error;
    closed = true;
    clearTimeout(timer);
    active?.reject(terminalError);
    active = undefined;
    for (const request of queue.splice(0)) request.reject(terminalError);
    buffered = Buffer.alloc(0);
    child?.kill();
  }
  function advance() {
    if (closed || active || !queue.length) return;
    active = queue.shift();
    timer = setTimeout(() => fail(new Error('Git blob read timed out')), 15000);
    timer.unref();
    child.stdin.write(active.oid + '\n', error => { if (error) fail(error); });
  }
  function consume(chunk) {
    if (closed) return;
    buffered = Buffer.concat([buffered, chunk]);
    try {
      assert(active, 'Unexpected Git output');
      if (active.size === undefined) {
        const newline = buffered.indexOf(10);
        assert(newline < 256 && (newline >= 0 || buffered.length < 256), 'Invalid Git header length');
        if (newline < 0) return;
        const header = buffered.subarray(0, newline).toString('ascii');
        const match = /^([a-f0-9]{40}) blob (0|[1-9][0-9]*)$/.exec(header);
        assert(match && match[1] === active.oid, 'Missing, non-blob or mismatched Git object');
        active.size = Number(match[2]);
        assert(Number.isSafeInteger(active.size) && active.size <= maxBytes, 'Git blob exceeds byte limit');
        buffered = buffered.subarray(newline + 1);
      }
      assert(buffered.length <= active.size + 1, 'Unexpected trailing Git output');
      if (buffered.length < active.size + 1) return;
      assert(buffered[active.size] === 10, 'Invalid Git content terminator');
      const bytes = buffered.subarray(0, active.size);
      const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      assert.equal(hash, active.oid, 'Git blob content hash mismatch');
      const request = active;
      active = undefined;
      buffered = Buffer.alloc(0);
      clearTimeout(timer);
      request.resolve(Buffer.from(bytes));
      advance();
    } catch (error) { fail(error); }
  }
  function start() {
    child = spawn('git', ['cat-file', '--batch'], {
      cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'],
      env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
    });
    done = new Promise(resolve => child.once('close', () => {
      if (!closed) fail(new Error('Git reader exited unexpectedly'));
      resolve();
    }));
    child.on('error', fail);
    child.stdin.on('error', fail);
    child.stdout.on('error', fail);
    child.stdout.on('data', consume);
  }
  return {
    readBlob(oid) {
      if (closed) return Promise.reject(terminalError || new Error('Git reader is closed'));
      if (typeof oid !== 'string' || !/^[a-f0-9]{40}$/.test(oid))
        return Promise.reject(new Error('Expected a full lowercase SHA-1 object ID'));
      return new Promise((resolve, reject) => {
        queue.push({ oid, resolve, reject });
        try { if (!child) start(); advance(); } catch (error) { fail(error); }
      });
    },
    async close() {
      if (!closed) fail(new Error('Git reader is closed'));
      await done;
    },
  };
}
