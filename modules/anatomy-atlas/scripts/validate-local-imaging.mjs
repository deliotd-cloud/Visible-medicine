import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { build } from 'esbuild';

const result = await build({
  stdin: {
    contents: `export * from './lib/local-imaging-study'; export { default as Workbench } from './app/local-imaging-workbench'; export { createElement } from 'react'; export { renderToStaticMarkup } from 'react-dom/server';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  packages: 'external',
  loader: { '.css': 'empty' },
  alias: { 'next/link': 'vinext/shims/link' },
});
const temporary = new URL(
  '../node_modules/.vm-local-imaging-test.mjs',
  import.meta.url,
);
await writeFile(temporary, result.outputFiles[0].text);
const hash = (b) => createHash('sha256').update(b).digest('hex');
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(a, b);
};
const near = (a, b, tolerance = 1e-7) => {
  checks++;
  assert(Math.abs(a - b) < tolerance);
};
const truth = (value) => {
  checks++;
  assert(value);
};
const fails = async (fn) => {
  checks++;
  await assert.rejects(fn);
};
try {
  const a = await import(temporary.href);
  // An intentionally small, anisotropic LPS phantom: no patient data is committed.
  const fixture = () => {
    const body = [];
    const block = (array) => {
      while (body.length % 8) body.push(0);
      const bytes = new Uint8Array(
        array.buffer,
        array.byteOffset,
        array.byteLength,
      );
      const entry = { offset: body.length, bytes: bytes.length };
      body.push(...bytes);
      return entry;
    };
    const toLps = (p) => [10 + p[0] * 2, 20 + p[1] * 3, 30 + p[2] * 4];
    const h = {
      schema: 'vm-local-study/1',
      release: 'NOT_FOR_PUBLICATION',
      modality: 'CT',
      coordinateSystem: 'LPS-mm',
      spatialRelationship: 'same-source-grid',
      viewerValidated: false,
      privacyCertified: false,
      sourceAnnotationSha256: 'a'.repeat(64),
      window: { center: 35, width: 80, function: 'LINEAR', inverted: false },
      volume: {
        dimensions: [3, 3, 3],
        originLps: [10, 20, 30],
        stepsLps: [
          [2, 0, 0],
          [0, 3, 0],
          [0, 0, 4],
        ],
        units: 'HU',
        type: 'int16',
        data: block(Int16Array.from({ length: 27 }, (_, i) => i - 13)),
        sourceSha256: 'b'.repeat(64),
      },
      structures: [],
    };
    for (const [id, parentId] of [
      ['cth.parent', null],
      ['cth.child', 'cth.parent'],
    ]) {
      const p = [
        [0.5, 1, 1],
        [1.5, 1, 1],
        [1, 0.5, 1],
        [1, 1.5, 1],
        [1, 1, 0.5],
        [1, 1, 1.5],
      ].flatMap(toLps);
      h.structures.push({
        id,
        parentId,
        label: id === 'cth.parent' ? 'Parent structure' : 'Child structure',
        colour: '#16c6b2',
        sourceSha256: 'c'.repeat(64),
        approval: 'source-mask-accepted',
        surfaceMethod: 'binary-0.5-isosurface-no-smoothing',
        voxelCount: 1,
        cropStart: [1, 1, 1],
        cropSize: [1, 1, 1],
        focusLps: toLps([1, 1, 1]),
        mask: block(new Uint8Array([1])),
        positions: block(new Float32Array(p)),
        indices: block(
          new Uint32Array([
            0, 2, 4, 2, 1, 4, 1, 3, 4, 3, 0, 4, 2, 0, 5, 1, 2, 5, 3, 1, 5, 0, 3,
            5,
          ]),
        ),
      });
    }
    return { h, body: Uint8Array.from(body) };
  };
  const pack = (f, mutate = () => {}) => {
    mutate(f.h, f.body);
    f.h.bodySha256 = hash(f.body);
    const header = new TextEncoder().encode(JSON.stringify(f.h)),
      start = Math.ceil((16 + header.length) / 8) * 8;
    const buffer = new ArrayBuffer(start + f.body.length),
      bytes = new Uint8Array(buffer),
      v = new DataView(buffer);
    bytes.set(new TextEncoder().encode('VMATLAS1'));
    v.setUint32(8, header.length, true);
    v.setUint32(12, f.body.length, true);
    bytes.set(header, 16);
    bytes.set(f.body, start);
    return buffer;
  };
  const s = await a.readLocalStudy(pack(fixture()));
  same(s.reviewTargetIds, []);
  same(s.structures[0].reviewStatus, 'source-mask-accepted');
  const draftFixture = fixture();
  Object.assign(draftFixture.h, {
    schema: 'vm-local-study/2',
    reviewMode: 'mixed-draft-review',
    reviewTargetIds: ['cth.child'],
  });
  draftFixture.h.structures[1].approval = 'draft-unapproved';
  const draft = await a.readLocalStudy(pack(draftFixture));
  same(draft.reviewTargetIds, ['cth.child']);
  same(draft.structures[1].reviewStatus, 'draft-unapproved');
  for (const mutate of [
    (h) => (h.schema = 'vm-local-study/1'),
    (h) => (h.reviewTargetIds = []),
    (h) => (h.reviewTargetIds = ['cth.parent']),
    (h) => (h.reviewTargetIds = ['cth.child', 'cth.child']),
    (h) => (h.reviewMode = 'accepted-only'),
  ]) {
    await fails(() =>
      a.readLocalStudy(pack(structuredClone(draftFixture), mutate)),
    );
  }
  same(a.fitLocalSlice(100, 100, { width: 80, height: 40 }), {
    width: 100,
    height: 50,
  });
  same(a.fitLocalSlice(100, 25, { width: 80, height: 40 }), {
    width: 50,
    height: 25,
  });
  same(a.fitLocalSlice(0, 100, { width: 80, height: 40 }), {
    width: 0,
    height: 0,
  });
  same(s.structures.length, 2);
  same(s.volume.values[0], -13);
  same(s.volume.values[26], 13);
  same(a.pickLocalStructure(s, [12, 23, 34]).id, 'cth.child');
  same(a.pickLocalStructure(s, [12, 23, 34], 'cth.parent').id, 'cth.parent');
  same(a.pickLocalStructure(s, [10, 20, 30]), null);
  same(a.maskAtIndex(s.structures[0], [1, 1, 1]), true);
  same(a.maskAtIndex(s.structures[0], [0.49, 1, 1]), false);
  same(a.maskAtIndex(s.structures[0], [1.49, 1, 1]), true);
  same(a.maskAtIndex(s.structures[0], [1.5, 1, 1]), false);
  for (const plane of ['axial', 'coronal', 'sagittal']) {
    const g = s.grids[plane],
      p = g.point(1, 1, 1),
      cross = a.localCrosshair(g, p);
    near(cross.x, 1);
    near(cross.y, 1);
    same(cross.slice, 1);
    const base = a.renderLocalSlice(s, plane, [12, 23, 34], s.window, null, 0);
    const overlay = a.renderLocalSlice(
      s,
      plane,
      [12, 23, 34],
      s.window,
      s.structures[0],
      0.8,
    );
    same(base.length, g.width * g.height * 4);
    truth(base.some((v, i) => v !== overlay[i]));
  }
  const mark = {
    structureId: 'cth.child',
    maskSha256: 'c'.repeat(64),
    action: 'include',
    lps: [12, 23, 34],
  };
  const review = a.localReviewExport(s, [mark]);
  same(review.approval, false);
  same(review.marks[0], mark);
  truth(review.marks[0].lps !== mark.lps);
  for (const invalid of [
    { ...mark, lps: [NaN, 0, 0] },
    { ...mark, lps: [-100, 0, 0] },
    { ...mark, maskSha256: 'd'.repeat(64) },
    { ...mark, action: 'approve' },
  ]) {
    checks++;
    assert.throws(() => a.localReviewExport(s, [invalid]));
  }
  for (const change of [
    (h) => (h.release = 'APPROVED'),
    (h) => (h.viewerValidated = true),
    (h) => (h.privacyCertified = true),
    (h) => (h.coordinateSystem = 'RAS-mm'),
    (h) => (h.modality = 'MR'),
    (h) => (h.volume.dimensions[0] = 0),
    (h) => (h.volume.dimensions[1] = 5000),
    (h) => (h.volume.stepsLps[1] = [2, 0, 0]),
    (h) => (h.volume.originLps[0] = null),
    (h) => (h.volume.data.offset = 1),
    (h) => (h.volume.data.bytes = 2),
    (h) => (h.window.width = 0),
    (h) => (h.structures = []),
    (h) => (h.structures[1].id = h.structures[0].id),
    (h) => (h.structures[0].parentId = 'cth.child'),
    (h) => (h.structures[0].parentId = 'cth.parent'),
    (h) => (h.structures[0].label = '<script>'),
    (h) => (h.structures[0].approval = 'draft'),
    (h) => (h.structures[0].focusLps = [10, 20, 30]),
    (h) => (h.structures[0].cropStart[0] = 3),
    (h) => (h.structures[0].voxelCount = 2),
    (h) => (h.structures[0].mask.offset = h.volume.data.offset),
    (h, b) => (b[h.structures[0].mask.offset] = 2),
    (h, b) =>
      new DataView(b.buffer).setFloat32(
        h.structures[0].positions.offset,
        NaN,
        true,
      ),
    (h, b) =>
      new DataView(b.buffer).setUint32(
        h.structures[0].indices.offset,
        99999,
        true,
      ),
  ])
    await fails(() => a.readLocalStudy(pack(fixture(), change)));
  const corrupt = pack(fixture());
  new Uint8Array(corrupt)[corrupt.byteLength - 1] ^= 1;
  await fails(() => a.readLocalStudy(corrupt));
  await fails(() => a.readLocalStudy(corrupt.slice(1)));
  await fails(() => a.readLocalStudy(new ArrayBuffer(0)));
  const html = a.renderToStaticMarkup(a.createElement(a.Workbench));
  truth(html.includes('Not for publication'));
  truth(html.includes('type="file"'));
  truth(!html.includes('<canvas'));
  const source = await readFile(
    new URL('../app/local-imaging-workbench.tsx', import.meta.url),
    'utf8',
  );
  truth(
    !/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|sendBeacon/.test(
      source,
    ),
  );
  truth(source.includes('beforeunload'));
  truth(source.includes('source mask is unchanged'));
  // Optional actual private package: prints only aggregate QA, never pixels or identifiers.
  const pathIndex = process.argv.indexOf('--study');
  let privateStudy = null;
  if (pathIndex >= 0) {
    assert(process.argv[pathIndex + 1], 'Missing private package path');
    const file = await readFile(process.argv[pathIndex + 1]);
    const actual = await a.readLocalStudy(
      file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    );
    const compareIndex = process.argv.indexOf('--compare');
    if (compareIndex >= 0) {
      const priorFile = await readFile(process.argv[compareIndex + 1]);
      const prior = await a.readLocalStudy(
        priorFile.buffer.slice(
          priorFile.byteOffset,
          priorFile.byteOffset + priorFile.byteLength,
        ),
      );
      const bytes = (v) => Buffer.from(v.buffer, v.byteOffset, v.byteLength);
      truth(bytes(actual.volume.values).equals(bytes(prior.volume.values)));
      same(actual.volume.dimensions, prior.volume.dimensions);
      same(actual.volume.originLps, prior.volume.originLps);
      same(actual.volume.stepsLps, prior.volume.stepsLps);
      for (const original of prior.structures) {
        const current = actual.structures.find((s) => s.id === original.id);
        truth(!!current);
        same(current.reviewStatus, original.reviewStatus);
        same(current.sourceSha256, original.sourceSha256);
        same(current.cropStart, original.cropStart);
        same(current.cropSize, original.cropSize);
        for (const field of ['mask', 'positions', 'indices'])
          truth(bytes(current[field]).equals(bytes(original[field])));
      }
    }
    for (const structure of actual.structures) {
      truth(
        a.maskAtIndex(structure, actual.volume.lpsToIndex(structure.focusLps)),
      );
      same(
        a.pickLocalStructure(actual, structure.focusLps, structure.id).id,
        structure.id,
      );
      for (let i = 0; i < structure.positions.length; i += 3) {
        const index = actual.volume.lpsToIndex([
          ...structure.positions.subarray(i, i + 3),
        ]);
        for (let axis = 0; axis < 3; axis++) {
          // Binary 0.5 isosurfaces land at integer/half-integer voxel coordinates.
          near(index[axis] * 2, Math.round(index[axis] * 2), 0.002);
          truth(
            index[axis] >= structure.cropStart[axis] - 0.501 &&
              index[axis] <=
                structure.cropStart[axis] + structure.cropSize[axis] - 0.499,
          );
        }
      }
      for (const plane of ['axial', 'coronal', 'sagittal']) {
        const g = actual.grids[plane],
          p = a.localCrosshair(g, structure.focusLps);
        truth(p.x >= 0 && p.x < g.width && p.y >= 0 && p.y < g.height);
        const image = a.renderLocalSlice(
          actual,
          plane,
          structure.focusLps,
          actual.window,
          structure,
        );
        same(image.length, g.width * g.height * 4);
      }
    }
    privateStudy = {
      structures: actual.structures.length,
      triangles: actual.structures.reduce(
        (n, s) => n + s.indices.length / 3,
        0,
      ),
      sha256: hash(file),
      pixelDataLogged: false,
    };
  }
  console.log(
    JSON.stringify({
      checks,
      privateStudy,
      browserOrClinicalValidation: false,
    }),
  );
} finally {
  await unlink(temporary);
}
