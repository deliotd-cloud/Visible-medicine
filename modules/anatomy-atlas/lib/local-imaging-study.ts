import {
  createResliceGrid,
  prepareVolume,
  renderReslice,
  validateWindow,
  type ImageWindow,
  type PreparedVolume,
  type ResliceGrid,
  type Vec3,
} from './volume-reslice';
import type { ImagePlane } from './imaging-comparison';

export const LOCAL_STUDY_MAX_BYTES = 256 * 1024 * 1024;
export type LocalStructure = {
  id: string;
  label: string;
  colour: string;
  sourceSha256: string;
  parentId: string | null;
  voxelCount: number;
  cropStart: Vec3;
  cropSize: Vec3;
  focusLps: Vec3;
  mask: Uint8Array;
  positions: Float32Array;
  indices: Uint32Array;
};
export type LocalStudy = {
  sourceAnnotationSha256: string;
  sourceCtSha256: string;
  volume: PreparedVolume;
  window: ImageWindow;
  structures: readonly LocalStructure[];
  grids: Record<ImagePlane, ResliceGrid>;
};
type BinaryBlock = { offset: number; bytes: number };
type StructureManifest = Omit<
  LocalStructure,
  'mask' | 'positions' | 'indices'
> & {
  mask: BinaryBlock;
  positions: BinaryBlock;
  indices: BinaryBlock;
  approval: string;
  surfaceMethod: string;
};
const sha = (x: unknown): x is string =>
  typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const vec = (x: unknown): x is Vec3 =>
  Array.isArray(x) && x.length === 3 && x.every(Number.isFinite);
const count = (x: unknown): x is number =>
  Number.isSafeInteger(x) && Number(x) >= 0;
const product = (v: Vec3) => v[0] * v[1] * v[2];
const fail = (): never => {
  throw new Error('Invalid, changed or unsupported local study');
};

/** No network, persistence or release approval. A file's claimed review status is not authentication. */
export async function readLocalStudy(buffer: ArrayBuffer): Promise<LocalStudy> {
  if (
    !(buffer instanceof ArrayBuffer) ||
    buffer.resizable ||
    buffer.byteLength < 24 ||
    buffer.byteLength > LOCAL_STUDY_MAX_BYTES
  )
    fail();
  if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) fail();
  const bytes = new Uint8Array(buffer),
    data = new DataView(buffer);
  if (new TextDecoder().decode(bytes.subarray(0, 8)) !== 'VMATLAS1') fail();
  const headerSize = data.getUint32(8, true),
    bodySize = data.getUint32(12, true);
  const bodyStart = Math.ceil((16 + headerSize) / 8) * 8;
  if (
    headerSize > 1024 * 1024 ||
    headerSize < 2 ||
    bodyStart + bodySize !== bytes.length
  )
    fail();
  const h = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(
      bytes.subarray(16, 16 + headerSize),
    ),
  );
  if (
    !h ||
    h.schema !== 'vm-local-study/1' ||
    h.release !== 'NOT_FOR_PUBLICATION' ||
    h.modality !== 'CT' ||
    h.viewerValidated !== false ||
    h.privacyCertified !== false ||
    h.coordinateSystem !== 'LPS-mm' ||
    h.spatialRelationship !== 'same-source-grid' ||
    !sha(h.sourceAnnotationSha256) ||
    !sha(h.bodySha256)
  )
    fail();
  const digest = [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', bytes.subarray(bodyStart)),
    ),
  ]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  if (digest !== h.bodySha256) fail();
  const ranges: [number, number][] = [];
  const block = (b: { offset: number; bytes: number }, expected?: number) => {
    if (
      !b ||
      !count(b.offset) ||
      !count(b.bytes) ||
      b.bytes < 1 ||
      b.offset % 8 ||
      b.offset + b.bytes > bodySize ||
      (expected !== undefined && b.bytes !== expected)
    )
      fail();
    ranges.push([b.offset, b.offset + b.bytes]);
    return bodyStart + b.offset;
  };
  const v = h.volume;
  if (
    !v ||
    v.type !== 'int16' ||
    v.units !== 'HU' ||
    !sha(v.sourceSha256) ||
    !vec(v.dimensions) ||
    !v.dimensions.every(
      (n: number) => Number.isInteger(n) && n > 0 && n <= 4096,
    )
  )
    fail();
  const scalarOffset = block(v.data, product(v.dimensions) * 2);
  const volume = prepareVolume({
    ...v,
    values: new Int16Array(buffer, scalarOffset, product(v.dimensions)),
  });
  validateWindow(h.window);
  if (
    !Array.isArray(h.structures) ||
    h.structures.length < 1 ||
    h.structures.length > 128
  )
    fail();
  const ids = new Set<string>();
  let totalVertices = 0;
  const structures: LocalStructure[] = h.structures.map(
    (s: StructureManifest) => {
      if (
        !s ||
        typeof s.id !== 'string' ||
        !/^cth\.[a-z0-9_.]{1,120}$/.test(s.id) ||
        ids.has(s.id) ||
        typeof s.label !== 'string' ||
        !/^[A-Za-z0-9 (),./–—-]{1,120}$/.test(s.label) ||
        !/^#[a-fA-F0-9]{6}$/.test(s.colour) ||
        !sha(s.sourceSha256) ||
        s.approval !== 'source-mask-accepted' ||
        s.surfaceMethod !== 'binary-0.5-isosurface-no-smoothing'
      )
        fail();
      ids.add(s.id);
      if (
        s.parentId != null &&
        (typeof s.parentId !== 'string' ||
          !/^cth\.[a-z0-9_.]{1,120}$/.test(s.parentId) ||
          s.parentId === s.id)
      )
        fail();
      if (
        !vec(s.cropStart) ||
        !vec(s.cropSize) ||
        !vec(s.focusLps) ||
        !count(s.voxelCount) ||
        s.voxelCount < 1
      )
        fail();
      if (
        s.cropStart.some(
          (n: number, i: number) =>
            !count(n) ||
            !count(s.cropSize[i]) ||
            s.cropSize[i] < 1 ||
            n + s.cropSize[i] > volume.dimensions[i],
        )
      )
        fail();
      const maskOffset = block(s.mask, Math.ceil(product(s.cropSize) / 8));
      const positionOffset = block(s.positions),
        indexOffset = block(s.indices);
      if (
        s.positions.bytes % 12 ||
        s.indices.bytes % 12 ||
        s.positions.bytes > 24e6 ||
        s.indices.bytes > 24e6
      )
        fail();
      const positions = new Float32Array(
        buffer,
        positionOffset,
        s.positions.bytes / 4,
      );
      const indices = new Uint32Array(buffer, indexOffset, s.indices.bytes / 4);
      totalVertices += positions.length / 3;
      if (
        totalVertices > 2e6 ||
        positions.length < 9 ||
        indices.length < 3 ||
        positions.some((n) => !Number.isFinite(n) || Math.abs(n) > 1e7) ||
        indices.some((n) => n >= positions.length / 3)
      )
        fail();
      const mask = new Uint8Array(buffer, maskOffset, s.mask.bytes);
      const tailBits = product(s.cropSize) % 8;
      if (tailBits && mask[mask.length - 1] >> tailBits) fail();
      let foreground = 0;
      for (const byte of mask) {
        let b = byte;
        while (b) {
          b &= b - 1;
          foreground++;
        }
      }
      if (foreground !== s.voxelCount || s.voxelCount > product(s.cropSize))
        fail();
      const structure: LocalStructure = Object.freeze({
        id: s.id,
        label: s.label,
        colour: s.colour,
        sourceSha256: s.sourceSha256,
        voxelCount: s.voxelCount,
        parentId: s.parentId ?? null,
        cropStart: Object.freeze([...s.cropStart]) as Vec3,
        cropSize: Object.freeze([...s.cropSize]) as Vec3,
        focusLps: Object.freeze([...s.focusLps]) as Vec3,
        mask,
        positions,
        indices,
      });
      if (!maskAtIndex(structure, volume.lpsToIndex(structure.focusLps)))
        fail();
      return structure;
    },
  );
  ranges.sort((a, b) => a[0] - b[0]);
  if (ranges.some((r, i) => i > 0 && ranges[i - 1][1] > r[0])) fail();
  for (const structure of structures) {
    const visited = new Set([structure.id]);
    let parent = structure.parentId;
    while (parent && ids.has(parent)) {
      if (visited.has(parent)) fail();
      visited.add(parent);
      parent = structures.find((s) => s.id === parent)!.parentId;
    }
  }
  return Object.freeze({
    sourceAnnotationSha256: h.sourceAnnotationSha256,
    sourceCtSha256: v.sourceSha256,
    volume,
    window: Object.freeze({ ...h.window }),
    structures: Object.freeze(structures),
    grids: {
      axial: createResliceGrid(volume, 'axial', 384),
      coronal: createResliceGrid(volume, 'coronal', 384),
      sagittal: createResliceGrid(volume, 'sagittal', 384),
    },
  });
}

/** Nearest-neighbour labels; interpolation must never invent a partial label. */
export function maskAtIndex(s: LocalStructure, point: Vec3) {
  if (!vec(point)) return false;
  const i = Math.floor(point[0] + 0.5) - s.cropStart[0];
  const j = Math.floor(point[1] + 0.5) - s.cropStart[1];
  const k = Math.floor(point[2] + 0.5) - s.cropStart[2];
  if (
    i < 0 ||
    j < 0 ||
    k < 0 ||
    i >= s.cropSize[0] ||
    j >= s.cropSize[1] ||
    k >= s.cropSize[2]
  )
    return false;
  const n = i + s.cropSize[0] * (j + s.cropSize[1] * k);
  return Boolean(s.mask[n >> 3] & (1 << (n & 7)));
}

export function pickLocalStructure(
  study: LocalStudy,
  point: Vec3,
  preferred?: string,
) {
  const index = study.volume.lpsToIndex(point);
  const hits = study.structures.filter((s) => maskAtIndex(s, index));
  return (
    hits.find((s) => s.id === preferred) ??
    hits.sort(
      (a, b) => a.voxelCount - b.voxelCount || a.id.localeCompare(b.id),
    )[0] ??
    null
  );
}

export function localCrosshair(grid: ResliceGrid, point: Vec3) {
  const zero = grid.point(0, 0, 0);
  const delta = point.map((n, i) => n - zero[i]);
  return {
    x: delta.reduce((n, v, i) => n + v * grid.u[i], 0) / grid.pixelSpacing,
    y: delta.reduce((n, v, i) => n + v * grid.v[i], 0) / grid.pixelSpacing,
    slice: grid.sliceForPoint(point),
  };
}

/** Fit inside the measured pane without distorting physical pixel aspect. */
export function fitLocalSlice(
  width: number,
  height: number,
  grid: Pick<ResliceGrid, 'width' | 'height'>,
) {
  if (
    ![width, height, grid.width, grid.height].every(
      (n) => Number.isFinite(n) && n > 0,
    )
  )
    return { width: 0, height: 0 };
  const scale = Math.min(width / grid.width, height / grid.height);
  return { width: grid.width * scale, height: grid.height * scale };
}

export function renderLocalSlice(
  study: LocalStudy,
  plane: ImagePlane,
  focus: Vec3,
  window: ImageWindow,
  selected: LocalStructure | null,
  opacity = 0.3,
) {
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) fail();
  const grid = study.grids[plane],
    slice = grid.sliceForPoint(focus);
  const rgba = renderReslice(study.volume, grid, slice, window);
  if (selected && opacity > 0) {
    const colour = [1, 3, 5].map((i) =>
      parseInt(selected.colour.slice(i, i + 2), 16),
    );
    for (let y = 0; y < grid.height; y++)
      for (let x = 0; x < grid.width; x++) {
        if (
          !maskAtIndex(
            selected,
            study.volume.lpsToIndex(grid.point(x, y, slice)),
          )
        )
          continue;
        const offset = (x + y * grid.width) * 4;
        for (let c = 0; c < 3; c++)
          rgba[offset + c] = Math.round(
            rgba[offset + c] * (1 - opacity) + colour[c] * opacity,
          );
      }
  }
  return rgba;
}

export type LocalReviewMark = {
  structureId: string;
  maskSha256: string;
  action: 'include' | 'exclude';
  lps: Vec3;
};
export function localReviewExport(
  study: LocalStudy,
  marks: readonly LocalReviewMark[],
) {
  if (marks.length > 500) fail();
  for (const mark of marks) {
    if (!mark || !vec(mark.lps)) fail();
    const structure = study.structures.find((s) => s.id === mark.structureId);
    const index = study.volume.lpsToIndex(mark.lps);
    if (
      !structure ||
      structure.sourceSha256 !== mark.maskSha256 ||
      !['include', 'exclude'].includes(mark.action) ||
      !vec(mark.lps) ||
      index.some((n, i) => n < -0.5 || n >= study.volume.dimensions[i] - 0.5)
    )
      fail();
  }
  return {
    schema: 'vm-local-review/1',
    release: 'NOT_FOR_PUBLICATION',
    approval: false,
    sourceAnnotationSha256: study.sourceAnnotationSha256,
    sourceCtSha256: study.sourceCtSha256,
    coordinateSystem: 'LPS-mm',
    marks: marks.map((m) => ({ ...m, lps: [...m.lps] })),
  };
}
