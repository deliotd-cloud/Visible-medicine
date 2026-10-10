import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, writeFile, unlink, rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve, sep} from 'node:path';
import {readNamedObjObjects} from './open3dmodel-obj-source.mjs';

const staging = 'F:/VisibleMedicine/staging/20261003-plexus-conversion';
const base = existsSync('F:/VisibleMedicine/staging') ? staging : tmpdir();

async function withObj(source, check) {
  if (base === staging) await mkdir(base, {recursive: true});
  const dir = await mkdtemp(join(base, 'obj-parser-test-'));
  const path = join(dir, 'fixture.obj');
  assert.equal(resolve(path).startsWith(resolve(dir) + sep), true);
  try {
    await writeFile(path, source, 'utf8');
    await check(path);
  } finally {
    await unlink(path);
    await rmdir(dir);
  }
}

test('streams selected named objects with global positive, negative, and v/vt/vn face tokens', async () => {
  await withObj([
    '# synthetic source',
    'mtllib sample.mtl second.mtl',
    'o skip me',
    'v 1 2 3', 'v 4 5 6', 'v 7 8 9',
    'vt .2 .4', 'vn 0 0 1',
    'f 1/1/1 2//1 3/2/1',
    'o kept name',
    'v -1 0 1', 'v -2 0 2', 'v -3 0 3', 'v -4 0 4',
    'f 4/1/1 5//1 6/2 7',
    'f -4 -3/-1 -2//1 -1/2/1',
  ].join('\n'), async path => {
    const report = await readNamedObjObjects(path, {selectName: name => name === 'kept name'});
    assert.deepEqual(report.objects, [{
      name: 'kept name', startLine: 10,
      vertices: [[-1, 0, 1], [-2, 0, 2], [-3, 0, 3], [-4, 0, 4]],
      faces: [[0, 1, 2, 3], [0, 1, 2, 3]],
    }]);
    assert.deepEqual(report.inventory, [
      {name: 'skip me', startLine: 3, vertices: 3, faces: 1, faceSizes: {'3': 1}, crossObjectReferences: 0},
      {name: 'kept name', startLine: 10, vertices: 4, faces: 2, faceSizes: {'4': 2}, crossObjectReferences: 0},
    ]);
    assert.equal(report.totalVertices, 7);
    assert.equal(report.totalFaces, 3);
    assert.deepEqual(report.materialLibraries, ['sample.mtl', 'second.mtl']);
  });
});

test('validates skipped objects and does not retain their geometry', async () => {
  await withObj('o skipped\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 99\no kept\nv 0 0 0\n', async path => {
    await assert.rejects(readNamedObjObjects(path, {selectName: name => name === 'kept'}), /:5: position index "99" out of range/);
  });
});

test('rejects duplicate and empty names', async () => {
  await withObj('o one\no one\n', async path => {
    await assert.rejects(readNamedObjObjects(path), /:2: duplicate object name "one"/);
  });
  await withObj('o # unnamed\n', async path => {
    await assert.rejects(readNamedObjObjects(path), /:1: empty object name/);
  });
});

test('rejects nonfinite coordinates and invalid face indices', async () => {
  for (const [source, error] of [
    ['o a\nv 1e309 0 0', /:2: vertex requires exactly three finite/],
    ['o a\nv 0 0 NaN', /:2: vertex requires exactly three finite/],
    ['o a\nv 1 2 3 2', /:2: vertex requires exactly three finite/],
    ['v 1 2 3\no a', /:1: vertex before named object/],
    ['o a\nv 0 0 0\nf 0 1 1', /:3: invalid position index "0"/],
    ['o a\nv 0 0 0\nf 1.5 1 1', /:3: noninteger position index/],
    ['o a\nv 0 0 0\nf -2 1 1', /:3: position index "-2" out of range/],
    ['o a\nv 0 0 0\nf 1 1', /:3: face has fewer than three/],
    ['f 1 1 1', /:1: face before named object/],
  ]) {
    await withObj(source, async path => {
      await assert.rejects(readNamedObjObjects(path), error);
    });
  }
});

test('rejects cross-object references, including valid negative indices in skipped objects', async () => {
  await withObj('o first\nv 0 0 0\nv 1 0 0\nv 0 1 0\no skipped\nv 0 0 1\nf -4 -1 -1\n', async path => {
    await assert.rejects(readNamedObjObjects(path, {selectName: name => name === 'first'}), /:7: face in object "skipped" references position 1 outside that object/);
  });
});
