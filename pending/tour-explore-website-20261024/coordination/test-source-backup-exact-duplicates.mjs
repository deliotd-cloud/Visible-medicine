import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {consolidateExactSourceDuplicates} from './source-backup-exact-duplicates.mjs';

const sha256 = b => createHash('sha256').update(b).digest('hex');
const fixture = (entries, options = {}) => {
  const bytes = new Map(entries.map(([p, content]) => [p, Buffer.from(content)]));
  const files = entries.map(([path]) => ({path, bytes: bytes.get(path).length, sha256: sha256(bytes.get(path))}));
  return {files, inheritedPaths: files.map(r => r.path), newPaths: [], protectedPaths: [],
    targetCount: files.length, maxOmissions: files.length - 1,
    bytesFor: p => bytes.get(p), ...options};
};

test('omits only exact inherited duplicates and returns immutable source aliases', () => {
  const input = fixture([['b.txt', 'same'], ['c.txt', 'other'], ['a.txt', 'same']],
    {targetCount: 2, maxOmissions: 1});
  const before = structuredClone({...input, bytesFor: null});
  const result = consolidateExactSourceDuplicates(input);
  assert.deepEqual(result.selectedRows.map(r => r.path), ['c.txt', 'a.txt']);
  assert.deepEqual(result.aliases, [{omittedPath: 'b.txt', retainedPath: 'a.txt',
    bytes: 4, sha256: sha256(Buffer.from('same'))}]);
  assert.deepEqual({...input, bytesFor: null}, before);
  assert.notEqual(result.selectedRows[0], input.files[1]);
});

test('new and protected paths stay, with aliases pointing at retained bytes', () => {
  const input = fixture([['old-a', 'x'], ['new-b', 'x'], ['old-c', 'x'], ['old-d', 'x']],
    {inheritedPaths: ['old-a', 'old-c', 'old-d'], newPaths: ['new-b'],
      protectedPaths: ['old-c'], targetCount: 2, maxOmissions: 2});
  const result = consolidateExactSourceDuplicates(input);
  assert.deepEqual(result.selectedRows.map(r => r.path), ['new-b', 'old-c']);
  assert.deepEqual(result.aliases.map(r => [r.omittedPath, r.retainedPath]),
    [['old-a', 'new-b'], ['old-d', 'new-b']]);
});

test('protected and new entries can anchor all eligible inherited duplicates', () => {
  const input = fixture([['old-a', 'x'], ['new-b', 'x'], ['old-c', 'x'], ['old-d', 'z']],
    {inheritedPaths: ['old-a', 'old-c', 'old-d'], newPaths: ['new-b'],
      protectedPaths: ['old-c'], targetCount: 3, maxOmissions: 1});
  const result = consolidateExactSourceDuplicates(input);
  assert.deepEqual(result.selectedRows.map(r => r.path), ['new-b', 'old-c', 'old-d']);
  assert.equal(result.aliases[0].retainedPath, 'new-b');
});

test('target, cap, and duplicate availability fail closed', () => {
  const input = fixture([['a', 'x'], ['b', 'x'], ['c', 'y']]);
  assert.throws(() => consolidateExactSourceDuplicates({...input, targetCount: 1, maxOmissions: 1}), /omission cap/);
  assert.throws(() => consolidateExactSourceDuplicates({...input, targetCount: 1, maxOmissions: 2}), /Insufficient/);
  for (const n of [0, -1, 6000, 1.5, NaN]) {
    assert.throws(() => consolidateExactSourceDuplicates({...input, targetCount: n}), /target count/);
  }
  for (const n of [-1, 3, 1.5, NaN]) {
    assert.throws(() => consolidateExactSourceDuplicates({...input, maxOmissions: n}), /omission cap/);
  }
});

test('duplicate, missing, unsafe, and unpartitioned paths fail closed', () => {
  const input = fixture([['a', 'x'], ['b', 'x']]);
  assert.throws(() => consolidateExactSourceDuplicates({...input, files: [input.files[0], input.files[0]]}), /Duplicate selected path/);
  assert.throws(() => consolidateExactSourceDuplicates({...input, protectedPaths: ['missing']}), /missing selected path/);
  assert.throws(() => consolidateExactSourceDuplicates({...input, inheritedPaths: ['a']}), /partition/);
  assert.throws(() => consolidateExactSourceDuplicates({...input, inheritedPaths: ['a', 'a']}), /duplicate path/);
  assert.throws(() => consolidateExactSourceDuplicates({...input, files: [{...input.files[0], path: '../secret'}, input.files[1]]}), /Unsafe selected path/);
  assert.throws(() => consolidateExactSourceDuplicates({...input, files: [{...input.files[0], path: 'scan.dcm'}, input.files[1]]}), /Unsafe selected path/);
});

test('declared digest, byte count, and callback bytes are checked for every row', () => {
  const input = fixture([['a', 'x'], ['b', 'x']]);
  assert.throws(() => consolidateExactSourceDuplicates({...input,
    files: [{...input.files[0], sha256: '0'.repeat(64)}, input.files[1]]}), /Digest mismatch/);
  assert.throws(() => consolidateExactSourceDuplicates({...input,
    files: [{...input.files[0], bytes: 2}, input.files[1]]}), /Byte count mismatch/);
  assert.throws(() => consolidateExactSourceDuplicates({...input, bytesFor: () => undefined}), /must return bytes/);
  assert.throws(() => consolidateExactSourceDuplicates({...input,
    bytesFor: p => p === 'b' ? Buffer.from('y') : Buffer.from('x')}), /Digest mismatch/);
});

test('5999-row gate is retained without widening it', () => {
  const row = {path: 'a', bytes: 0, sha256: sha256(Buffer.alloc(0))};
  const files = Array.from({length: 6000}, (_, i) => ({...row, path: `p${i}`}));
  assert.throws(() => consolidateExactSourceDuplicates({files, inheritedPaths: [], newPaths: [], protectedPaths: [],
    targetCount: 5999, maxOmissions: 1, bytesFor: () => Buffer.alloc(0)}), /backup gate/);
});
