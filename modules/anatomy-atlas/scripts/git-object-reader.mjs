// Test-only, exact Git blob reads. No working-tree fallback or persisted cache.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

export function createGitObjectReader({ cwd, maxBytes = 16000000, spawnProcess = spawn }) {
  assert(Number.isSafeInteger(maxBytes) && maxBytes >= 0, 'Invalid Git blob limit');
  assert(typeof spawnProcess === 'function', 'Invalid Git process factory');
  let child, closed = false, terminalError, done = Promise.resolve();
  let active, timer, headerLength = 0;
  const headerBytes = Buffer.alloc(256);
  const queue = [];
  function fail(error) {
    terminalError ||= error;
    closed = true;
    clearTimeout(timer);
    active?.reject(terminalError);
    active = undefined;
    for (const request of queue.splice(0)) request.reject(terminalError);
    headerLength = 0;
    child?.kill();
  }
  function advance() {
    if (closed || active || !queue.length) return;
    active = queue.shift();
    headerLength = 0;
    timer = setTimeout(() => fail(new Error('Git blob read timed out')), 15000);
    timer.unref();
    child.stdin.write(active.oid + '\n', error => { if (error) fail(error); });
  }
  function consume(chunk) {
    if (closed) return;
    try {
      assert(active, 'Unexpected Git output');
      let offset = 0;
      while (offset < chunk.length) {
        if (active.size === undefined) {
          const newline = chunk.indexOf(10, offset);
          const end = newline < 0 ? chunk.length : newline;
          const count = end - offset;
          assert(headerLength + count < 256, 'Invalid Git header length');
          chunk.copy(headerBytes, headerLength, offset, end);
          headerLength += count;
          if (newline < 0) return;
          const header = headerBytes.toString('ascii', 0, headerLength);
          const match = /^([a-f0-9]{40}) blob (0|[1-9][0-9]*)$/.exec(header);
          assert(match && match[1] === active.oid, 'Missing, non-blob or mismatched Git object');
          active.size = Number(match[2]);
          assert(Number.isSafeInteger(active.size) && active.size <= maxBytes, 'Git blob exceeds byte limit');
          active.bytes = Buffer.alloc(active.size);
          active.received = 0;
          offset = newline + 1;
          continue;
        }
        if (active.received < active.size) {
          const count = Math.min(active.size - active.received, chunk.length - offset);
          chunk.copy(active.bytes, active.received, offset, offset + count);
          active.received += count;
          offset += count;
          if (active.received < active.size) return;
          if (offset === chunk.length) return;
        }
        assert(chunk[offset] === 10, 'Invalid Git content terminator');
        assert(offset + 1 === chunk.length, 'Unexpected trailing Git output');
        const bytes = active.bytes;
        const digest = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
        assert.equal(digest, active.oid, 'Git blob content hash mismatch');
        const request = active;
        active = undefined;
        headerLength = 0;
        clearTimeout(timer);
        request.resolve(bytes);
        advance();
        return;
      }
    } catch (error) { fail(error); }
  }
  function start() {
    child = spawnProcess('git', ['cat-file', '--batch'], {
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
