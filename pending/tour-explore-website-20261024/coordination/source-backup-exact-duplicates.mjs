// Pure selection for a source-only backup. The caller owns source and Git validation.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const safePath = p => typeof p === 'string' && p.length > 0 && !p.startsWith('/') &&
  !/^[A-Za-z]:/.test(p) && !/[\\\x00-\x1f]/.test(p) &&
  p.split('/').every(part => part && part !== '.' && part !== '..') &&
  !p.startsWith('.source-backup/') &&
  !/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|\.vinext|node_modules|\.git)(?:\/|$)|\.(?:glb|dcm|dicom|nii(?:\.gz)?|nrrd|sqlite(?:3)?|db)$/i.test(p);

function pathSet(paths, label, known) {
  assert(Array.isArray(paths), `${label} must be an array`);
  const set = new Set();
  for (const p of paths) {
    assert(safePath(p), `${label}: unsafe path`);
    assert(!set.has(p), `${label}: duplicate path ${p}`);
    assert(known.has(p), `${label}: missing selected path ${p}`);
    set.add(p);
  }
  return set;
}

/**
 * Consolidate byte-identical inherited source paths before calling backup().
 *
 * `files` is the proposed new snapshot's selected-source rows. `inheritedPaths`
 * and `newPaths` must partition it exactly; the latter and all protected paths
 * are never omitted. `bytesFor(path)` supplies actual snapshot bytes. No input,
 * local file, Git state, or remote state is changed.
 *
 * The caller must preserve the parent commit and record returned aliases in its
 * recovery receipt; aliases are not a substitute for the prior source manifest.
 */
export function consolidateExactSourceDuplicates({
  files, inheritedPaths, newPaths, protectedPaths, targetCount, maxOmissions, bytesFor,
}) {
  assert(Array.isArray(files) && files.length > 0 && files.length < 6000,
    'Selected source count must remain within backup gate');
  assert(typeof bytesFor === 'function', 'bytesFor callback required');
  assert(Number.isSafeInteger(targetCount) && targetCount > 0 && targetCount < 6000 && targetCount <= files.length,
    'Invalid target count');
  assert(Number.isSafeInteger(maxOmissions) && maxOmissions >= 0 && maxOmissions <= files.length - 1,
    'Invalid omission cap');
  const needed = files.length - targetCount;
  assert(needed <= maxOmissions, 'Target exceeds omission cap');

  const rows = new Map();
  for (const row of files) {
    assert(row && typeof row === 'object' && safePath(row.path), 'Unsafe selected path');
    assert(!rows.has(row.path), `Duplicate selected path ${row.path}`);
    assert(Number.isSafeInteger(row.bytes) && row.bytes >= 0, `Invalid byte count ${row.path}`);
    assert(typeof row.sha256 === 'string' && /^[0-9a-f]{64}$/.test(row.sha256),
      `Invalid SHA-256 ${row.path}`);
    rows.set(row.path, row);
  }
  const known = new Set(rows.keys());
  const inherited = pathSet(inheritedPaths, 'inheritedPaths', known);
  const newlyAdded = pathSet(newPaths, 'newPaths', known);
  const protectedSet = pathSet(protectedPaths, 'protectedPaths', known);
  assert(inherited.size + newlyAdded.size === files.length &&
    [...inherited].every(p => !newlyAdded.has(p)), 'Inherited and new paths must partition snapshot');

  // Validate every row, including paths we ultimately retain. A matching digest
  // alone is never accepted as proof of identical bytes.
  const groups = new Map();
  for (const row of files) {
    const value = bytesFor(row.path);
    assert(value instanceof Uint8Array, `bytesFor must return bytes for ${row.path}`);
    const bytes = Buffer.from(value);
    assert.equal(bytes.length, row.bytes, `Byte count mismatch ${row.path}`);
    assert.equal(digest(bytes), row.sha256, `Digest mismatch ${row.path}`);
    const key = `${row.bytes}:${row.sha256}`;
    const group = groups.get(key) ?? [];
    group.push({path: row.path, bytes});
    groups.set(key, group);
  }

  const candidates = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const first = group[0].bytes;
    assert(group.every(entry => first.equals(entry.bytes)),
      'Declared duplicate group has divergent actual bytes');
    const sorted = group.map(entry => entry.path).sort();
    const mandatory = sorted.filter(p => newlyAdded.has(p) || protectedSet.has(p));
    const retained = mandatory[0] ?? sorted[0];
    for (const p of sorted) {
      if (p !== retained && inherited.has(p) && !protectedSet.has(p)) {
        candidates.push({omittedPath: p, retainedPath: retained,
          bytes: rows.get(p).bytes, sha256: rows.get(p).sha256});
      }
    }
  }
  candidates.sort((a, b) => a.omittedPath.localeCompare(b.omittedPath, 'en'));
  assert(candidates.length >= needed, 'Insufficient exact inherited duplicates for target');
  const aliases = candidates.slice(0, needed);
  const omitted = new Set(aliases.map(row => row.omittedPath));
  const selectedRows = files.filter(row => !omitted.has(row.path)).map(row => ({...row}));
  assert.equal(selectedRows.length, targetCount);
  assert([...protectedSet, ...newlyAdded].every(p => !omitted.has(p)), 'Mandatory source omitted');
  return {selectedRows, aliases};
}
