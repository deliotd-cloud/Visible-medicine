// Isolated proposal. Pair with tests/git-object-reader.mjs from the website checkout.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
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

async function gitRawObject(cwd, type, oid, maxBytes) {
  const { stdout } = await execFileAsync('git', ['cat-file', type, oid], {
    cwd, encoding: 'buffer', windowsHide: true, timeout: 15000,
    maxBuffer: maxBytes + 1,
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
  });
  assert(stdout.length <= maxBytes, 'Git metadata exceeds byte limit');
  return verifyObject(type, oid, stdout);
}

export async function openGitSnapshot({ cwd, commit, createBlobReader,
  maxMetadataBytes = 16_000_000, maxObjectBytes = 4_000_000,
  maxEntries = 20_000, maxDepth = 32, maxBlobBytes = 16_000_000 }) {
  fullOid(commit);
  assert(typeof createBlobReader === 'function', 'Existing Git blob reader is required');
  for (const limit of [maxMetadataBytes, maxObjectBytes, maxEntries, maxDepth, maxBlobBytes])
    assert(Number.isSafeInteger(limit) && limit > 0, 'Invalid snapshot limit');
  let metadataBytes = 0;
  const readMetadata = async (type, oid) => {
    const bytes = await gitRawObject(cwd, type, oid, Math.min(maxObjectBytes, maxMetadataBytes - metadataBytes));
    metadataBytes += bytes.length;
    assert(metadataBytes <= maxMetadataBytes, 'Snapshot metadata exceeds byte limit');
    return bytes;
  };
  const rawCommit = await readMetadata('commit', commit);
  const firstLine = rawCommit.toString('utf8').split('\n', 1)[0];
  const match = /^tree ([a-f0-9]{40})$/.exec(firstLine);
  assert(match, 'Malformed Git commit tree header');
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
  await walk(match[1], '', 0);
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
