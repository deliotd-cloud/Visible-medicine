// Isolated proposal. Pair with tests/git-object-reader.mjs from the website checkout.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
const oidPattern = /^[a-f0-9]{40}$/;
const decoder = new TextDecoder('utf-8', { fatal: true });
const forbiddenName = /[\\/:*?"<>|\x00-\x1f\x7f]/;
const reservedName = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

function fullOid(value) {
  assert(typeof value === 'string' && oidPattern.test(value), 'Expected an exact lowercase 40-character commit or object ID');
}

function safeComponent(value) {
  assert(value && value !== '.' && value !== '..' && !forbiddenName.test(value) &&
    !reservedName.test(value) && !/[. ]$/.test(value) && value.normalize('NFC') === value,
  'Unsafe Git path component');
}

function safePath(value) {
  assert(typeof value === 'string' && value.length && value.split('/').every(part => {
    try { safeComponent(part); return true; } catch { return false; }
  }), 'Unsafe Git path');
}

export function verifyObject(type, oid, bytes) {
  fullOid(oid);
  assert(type === 'commit' || type === 'tree', 'Unsupported metadata object type');
  assert(Buffer.isBuffer(bytes), 'Expected raw Git object bytes');
  const actual = createHash('sha1').update(`${type} ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(actual, oid, `Git ${type} content hash mismatch`);
  return bytes;
}

export function parseTree(bytes) {
  assert(Buffer.isBuffer(bytes), 'Expected raw Git tree bytes');
  const entries = [];
  const names = new Set();
  for (let at = 0; at < bytes.length;) {
    const space = bytes.indexOf(32, at);
    const nul = bytes.indexOf(0, space + 1);
    assert(space > at && nul > space + 1 && nul + 21 <= bytes.length, 'Malformed Git tree entry');
    const mode = bytes.toString('ascii', at, space);
    assert(['100644', '100755', '40000'].includes(mode), 'Unsupported Git tree entry type');
    const name = decoder.decode(bytes.subarray(space + 1, nul));
    safeComponent(name);
    assert(!names.has(name), 'Duplicate Git tree path');
    names.add(name);
    const oid = bytes.subarray(nul + 1, nul + 21).toString('hex');
    entries.push({ mode, name, oid });
    at = nul + 21;
  }
  return entries;
}

function createMetadataReader(cwd, maxBytes) {
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
    timer = setTimeout(() => fail(new Error('Git metadata read timed out')), 15000);
    timer.unref();
    child.stdin.write(active.oid + '\n', error => { if (error) fail(error); });
  }
  function consume(chunk) {
    if (closed) return;
    try {
      assert(active, 'Unexpected Git metadata output');
      let offset = 0;
      while (offset < chunk.length) {
        if (active.size === undefined) {
          const newline = chunk.indexOf(10, offset);
          const end = newline < 0 ? chunk.length : newline;
          const count = end - offset;
          assert(headerLength + count < 256, 'Invalid Git metadata header length');
          chunk.copy(headerBytes, headerLength, offset, end);
          headerLength += count;
          if (newline < 0) return;
          const header = headerBytes.toString('ascii', 0, headerLength);
          const match = /^([a-f0-9]{40}) (commit|tree) (0|[1-9][0-9]*)$/.exec(header);
          assert(match && match[1] === active.oid && match[2] === active.type,
            'Missing, wrong-type or mismatched Git metadata object');
          active.size = Number(match[3]);
          assert(Number.isSafeInteger(active.size) && active.size <= maxBytes,
            'Git metadata exceeds byte limit');
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
          if (active.received < active.size || offset === chunk.length) return;
        }
        assert(chunk[offset] === 10, 'Invalid Git metadata terminator');
        assert(offset + 1 === chunk.length, 'Unexpected trailing Git metadata output');
        const bytes = verifyObject(active.type, active.oid, active.bytes);
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
    child = spawn('git', ['cat-file', '--batch'], {
      cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'],
      env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
    });
    done = new Promise(resolve => child.once('close', () => {
      if (!closed) fail(new Error('Git metadata reader exited unexpectedly'));
      resolve();
    }));
    child.on('error', fail);
    child.stdin.on('error', fail);
    child.stdout.on('error', fail);
    child.stdout.on('data', consume);
  }
  return {
    read(type, oid) {
      assert(type === 'commit' || type === 'tree', 'Unsupported metadata object type');
      fullOid(oid);
      if (closed) return Promise.reject(terminalError || new Error('Git metadata reader is closed'));
      return new Promise((resolve, reject) => {
        queue.push({ type, oid, resolve, reject });
        try { if (!child) start(); advance(); } catch (error) { fail(error); }
      });
    },
    async close() {
      if (!closed) fail(new Error('Git metadata reader is closed'));
      await done;
    },
  };
}

export async function openGitSnapshot({ cwd, commit, createBlobReader,
  maxMetadataBytes = 16_000_000, maxObjectBytes = 4_000_000,
  maxEntries = 20_000, maxDepth = 32, maxBlobBytes = 16_000_000 }) {
  fullOid(commit);
  assert(typeof createBlobReader === 'function', 'Existing Git blob reader is required');
  for (const limit of [maxMetadataBytes, maxObjectBytes, maxEntries, maxDepth, maxBlobBytes])
    assert(Number.isSafeInteger(limit) && limit > 0, 'Invalid snapshot limit');
  let metadataBytes = 0;
  const metadataReader = createMetadataReader(cwd, maxObjectBytes);
  const readMetadata = async (type, oid) => {
    const bytes = await metadataReader.read(type, oid);
    metadataBytes += bytes.length;
    assert(metadataBytes <= maxMetadataBytes, 'Snapshot metadata exceeds byte limit');
    return bytes;
  };
  const paths = new Map();
  const seenTrees = new Set();
  async function walk(treeOid, prefix, depth) {
    assert(depth <= maxDepth, 'Snapshot tree depth exceeds limit');
    // Repeated subtree IDs are valid at distinct paths; only the path depth and
    // total entry/byte budgets bound traversal.
    const raw = await readMetadata('tree', treeOid);
    for (const entry of parseTree(raw)) {
      const path = prefix + entry.name;
      assert(paths.size + seenTrees.size < maxEntries, 'Snapshot entry count exceeds limit');
      if (entry.mode === '40000') {
        seenTrees.add(path);
        await walk(entry.oid, path + '/', depth + 1);
      } else {
        assert(!paths.has(path), 'Duplicate snapshot path');
        paths.set(path, entry.oid);
      }
    }
  }
  try {
    const rawCommit = await readMetadata('commit', commit);
    const firstLine = rawCommit.toString('utf8').split('\n', 1)[0];
    const match = /^tree ([a-f0-9]{40})$/.exec(firstLine);
    assert(match, 'Malformed Git commit tree header');
    await walk(match[1], '', 0);
  } finally {
    await metadataReader.close();
  }
  const blobReader = createBlobReader({ cwd, maxBytes: maxBlobBytes });
  let closed = false;
  return {
    commit,
    size: paths.size,
    paths: () => [...paths.keys()],
    oidFor(path) { safePath(path); return paths.get(path); },
    async read(path) {
      safePath(path);
      assert(!closed, 'Snapshot is closed');
      const oid = paths.get(path);
      assert(oid, 'Missing Git snapshot path');
      return blobReader.readBlob(oid);
    },
    async close() { if (!closed) { closed = true; await blobReader.close(); } },
  };
}
