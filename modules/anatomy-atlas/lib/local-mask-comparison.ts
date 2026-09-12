import {
  maskAtIndex,
  renderLocalSlice,
  type LocalStudy,
  type LocalStructure,
} from './local-imaging-study';
import type { ImagePlane } from './imaging-comparison';
import type { ImageWindow, Vec3 } from './volume-reslice';

export const LOCAL_COMPARISON_MAX_BYTES = 64 * 1024 * 1024;
export const comparisonColours = {
  candidate: '#65a9e8',
  added: '#39c992',
  removed: '#ff6d85',
  warnings: '#f5ca60',
} as const;
export type ComparisonRole = keyof typeof comparisonColours;
export type ComparisonMode = 'baseline' | 'changes' | 'candidate' | 'warnings';
export type ComparisonLayer = Pick<
  LocalStructure,
  | 'mask'
  | 'cropStart'
  | 'cropSize'
  | 'positions'
  | 'indices'
  | 'voxelCount'
  | 'colour'
> & {
  role: ComparisonRole;
  flags?: Uint8Array;
  focuses: readonly { sourceK: number; lps: Vec3 }[];
};
export type LocalComparison = {
  structureId: string;
  candidateMaskSha256: string;
  comparisonManifestSha256: string;
  counts: Readonly<Record<'baseline' | ComparisonRole, number>>;
  layers: readonly ComparisonLayer[];
  protectedRegionCount: number;
};
const fail = (): never => {
  throw new Error(
    'Comparison is invalid, changed or does not match the loaded baseline',
  );
};
const sha = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const count = (v: unknown): v is number =>
  Number.isSafeInteger(v) && Number(v) >= 0;
const vec = (v: unknown): v is Vec3 =>
  Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
const product = (v: Vec3) => v[0] * v[1] * v[2];
const sameVector = (a: unknown, b: Vec3) =>
  vec(a) && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
const bit = (mask: Uint8Array, n: number) =>
  Boolean(mask[n >> 3] & (1 << (n & 7)));

/** Checks file integrity and source consistency, not clinical accuracy or authorship. No I/O beyond the supplied buffer. */
export async function readLocalComparison(
  buffer: ArrayBuffer,
  study: LocalStudy,
): Promise<LocalComparison> {
  if (
    !(buffer instanceof ArrayBuffer) ||
    buffer.resizable ||
    buffer.byteLength < 24 ||
    buffer.byteLength > LOCAL_COMPARISON_MAX_BYTES
  )
    fail();
  if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) fail();
  const bytes = new Uint8Array(buffer),
    view = new DataView(buffer);
  if (new TextDecoder().decode(bytes.subarray(0, 8)) !== 'VMCMP001') fail();
  const headerSize = view.getUint32(8, true),
    bodySize = view.getUint32(12, true),
    start = Math.ceil((16 + headerSize) / 8) * 8;
  if (
    headerSize < 2 ||
    headerSize > 1024 * 1024 ||
    start + bodySize !== bytes.length
  )
    fail();
  const h = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(
      bytes.subarray(16, 16 + headerSize),
    ),
  );
  if (
    !h ||
    h.schema !== 'vm-local-comparison/1' ||
    h.release !== 'NOT_FOR_PUBLICATION' ||
    h.approval !== false ||
    h.viewerValidated !== false ||
    h.coordinateSystem !== 'LPS-mm' ||
    h.spatialRelationship !== 'same-source-grid'
  )
    fail();
  for (const key of [
    'sourceAnnotationSha256',
    'sourceCtSha256',
    'baselineMaskSha256',
    'candidateMaskSha256',
    'requestSha256',
    'comparisonManifestSha256',
    'bodySha256',
  ])
    if (!sha(h[key])) fail();
  const baseline =
    study.structures.find((s) => s.id === h.structureId) ?? fail();
  if (
    baseline.sourceSha256 !== h.baselineMaskSha256 ||
    study.sourceAnnotationSha256 !== h.sourceAnnotationSha256 ||
    study.sourceCtSha256 !== h.sourceCtSha256
  )
    fail();
  if (
    !sameVector(h.dimensions, study.volume.dimensions) ||
    !sameVector(h.originLps, study.volume.originLps) ||
    !Array.isArray(h.stepsLps) ||
    h.stepsLps.length !== 3 ||
    h.stepsLps.some(
      (v: unknown, i: number) => !sameVector(v, study.volume.stepsLps[i]),
    )
  )
    fail();
  const digest = [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', bytes.subarray(start)),
    ),
  ]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  if (digest !== h.bodySha256) fail();
  const protectedSources = study.structures.filter(
    (s) => s.id !== baseline.id && s.reviewStatus === 'source-mask-accepted',
  );
  if (
    !Array.isArray(h.protectedSources) ||
    h.protectedSources.length !== protectedSources.length ||
    new Set(
      h.protectedSources.map(
        (p: { structureId?: unknown } | null) => p?.structureId,
      ),
    ).size !== protectedSources.length ||
    h.protectedSources.some(
      (p: { structureId?: unknown; sha256?: unknown } | null) =>
        !p ||
        !protectedSources.some(
          (s) => s.id === p.structureId && s.sourceSha256 === p.sha256,
        ),
    )
  )
    fail();
  if (
    !Array.isArray(h.protectedRegions) ||
    h.protectedRegions.length > 16 ||
    new Set(h.protectedRegions.map((p: { id?: unknown } | null) => p?.id))
      .size !== h.protectedRegions.length ||
    h.protectedRegions.some(
      (p: { id?: unknown; sha256?: unknown } | null) =>
        !p ||
        typeof p.id !== 'string' ||
        !/^[a-z][a-z0-9_-]{0,79}$/.test(p.id) ||
        !sha(p.sha256),
    )
  )
    fail();
  const roles = Object.keys(comparisonColours) as ComparisonRole[];
  if (
    !h.counts ||
    ['baseline', ...roles].some((k) => !count(h.counts[k])) ||
    h.counts.baseline !== baseline.voxelCount ||
    Object.keys(h.counts).length !== 5 ||
    Object.values<number>(h.counts).reduce((a, b) => a + b, 0) > 16_000_000
  )
    fail();
  if (!Array.isArray(h.layers) || h.layers.length > 4) fail();
  const ranges: [number, number][] = [];
  const block = (b: { offset: number; bytes: number }, expected?: number) => {
    if (
      !b ||
      !count(b.offset) ||
      !count(b.bytes) ||
      b.offset % 8 ||
      !b.bytes ||
      b.offset + b.bytes > bodySize ||
      (expected !== undefined && b.bytes !== expected) ||
      ranges.some(([a, z]) => b.offset < z && b.offset + b.bytes > a)
    )
      fail();
    ranges.push([b.offset, b.offset + b.bytes]);
    return start + b.offset;
  };
  let vertices = 0;
  const layers: ComparisonLayer[] = [];
  for (const raw of h.layers) {
    if (
      !raw ||
      !roles.includes(raw.role) ||
      layers.some((l) => l.role === raw.role) ||
      raw.colour !== comparisonColours[raw.role as ComparisonRole] ||
      raw.surfaceMethod !== 'binary-0.5-isosurface-no-smoothing' ||
      !count(raw.voxelCount) ||
      raw.voxelCount < 1 ||
      raw.voxelCount !== h.counts[raw.role]
    )
      fail();
    if (
      !vec(raw.cropStart) ||
      !vec(raw.cropSize) ||
      raw.cropStart.some(
        (v: number, i: number) =>
          !count(v) ||
          !count(raw.cropSize[i]) ||
          raw.cropSize[i] < 1 ||
          v + raw.cropSize[i] > study.volume.dimensions[i],
      )
    )
      fail();
    const size = product(raw.cropSize),
      mask = new Uint8Array(
        buffer,
        block(raw.mask, Math.ceil(size / 8)),
        raw.mask.bytes,
      );
    let foreground = 0;
    const occupiedK = new Set<number>();
    for (let b = 0; b < mask.length; b++) {
      if (mask[b])
        for (let bitIndex = 0; bitIndex < 8; bitIndex++)
          if (mask[b] & (1 << bitIndex)) {
            const n = b * 8 + bitIndex;
            if (n >= size) fail();
            foreground++;
            occupiedK.add(
              raw.cropStart[2] +
                Math.floor(n / (raw.cropSize[0] * raw.cropSize[1])),
            );
          }
      if (b && b % 262144 === 0)
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    if (foreground !== raw.voxelCount) fail();
    if (
      !raw.positions ||
      !raw.indices ||
      raw.positions.bytes % 12 ||
      raw.indices.bytes % 12 ||
      raw.positions.bytes > 24_000_000 ||
      raw.indices.bytes > 24_000_000
    )
      fail();
    const positions = new Float32Array(
        buffer,
        block(raw.positions),
        raw.positions.bytes / 4,
      ),
      indices = new Uint32Array(
        buffer,
        block(raw.indices),
        raw.indices.bytes / 4,
      );
    vertices += positions.length / 3;
    if (vertices > 2_000_000 || indices.some((v) => v >= positions.length / 3))
      fail();
    for (let n = 0; n < positions.length; n += 3) {
      const p = [positions[n], positions[n + 1], positions[n + 2]] as Vec3;
      if (!p.every(Number.isFinite)) fail();
      const ijk = study.volume.lpsToIndex(p);
      if (
        ijk.some(
          (v, i) =>
            v < raw.cropStart[i] - 0.502 ||
            v > raw.cropStart[i] + raw.cropSize[i] - 0.498,
        )
      )
        fail();
    }
    const layer: ComparisonLayer = {
      role: raw.role,
      colour: raw.colour,
      voxelCount: raw.voxelCount,
      cropStart: Object.freeze([...raw.cropStart]) as Vec3,
      cropSize: Object.freeze([...raw.cropSize]) as Vec3,
      mask,
      positions,
      indices,
      focuses: [],
    };
    if (!Array.isArray(raw.focuses) || raw.focuses.length !== occupiedK.size)
      fail();
    let previous = -1;
    layer.focuses = Object.freeze(
      raw.focuses.map((f: { sourceK: number; lps: Vec3 }) => {
        if (
          !f ||
          !count(f.sourceK) ||
          f.sourceK <= previous ||
          !occupiedK.has(f.sourceK) ||
          !vec(f.lps)
        )
          fail();
        const ijk = study.volume.lpsToIndex(f.lps);
        if (
          Math.abs(ijk[2] - f.sourceK) > 1e-5 ||
          ijk.some((v) => Math.abs(v - Math.round(v)) > 1e-5) ||
          !maskAtIndex(layer, ijk)
        )
          fail();
        previous = f.sourceK;
        return Object.freeze({
          sourceK: f.sourceK,
          lps: Object.freeze([...f.lps]) as Vec3,
        });
      }),
    );
    if (raw.role === 'warnings') {
      layer.flags = new Uint8Array(buffer, block(raw.flags, size), size);
      for (let n = 0; n < size; n++)
        if (layer.flags[n] > 7 || Boolean(layer.flags[n]) !== bit(mask, n))
          fail();
    } else if (raw.flags !== undefined) fail();
    layers.push(Object.freeze(layer));
  }
  if (
    roles.some((r) => Boolean(h.counts[r]) !== layers.some((l) => l.role === r))
  )
    fail();
  const find = (role: ComparisonRole) => layers.find((l) => l.role === role);
  const hit = (role: ComparisonRole, p: Vec3) => {
    const l = find(role);
    return l ? maskAtIndex(l, p) : false;
  };
  // Prove voxel differences against the loaded baseline, not just a self-reported count.
  const each = async (
    s: Pick<LocalStructure, 'mask' | 'cropStart' | 'cropSize'>,
    visit: (p: Vec3, n: number) => void,
  ) => {
    const [sx, sy] = s.cropSize;
    for (let b = 0; b < s.mask.length; b++) {
      if (s.mask[b])
        for (let bitIndex = 0; bitIndex < 8; bitIndex++)
          if (s.mask[b] & (1 << bitIndex)) {
            const n = b * 8 + bitIndex;
            visit(
              [
                s.cropStart[0] + (n % sx),
                s.cropStart[1] + (Math.floor(n / sx) % sy),
                s.cropStart[2] + Math.floor(n / (sx * sy)),
              ],
              n,
            );
          }
      if (b && b % 262144 === 0)
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  };
  await each(baseline, (p) => {
    if (hit('removed', p) !== !hit('candidate', p)) fail();
  });
  for (const l of layers)
    await each(l, (p, n) => {
      const b = maskAtIndex(baseline, p),
        c = hit('candidate', p);
      if (l.role === 'candidate' && hit('added', p) !== !b) fail();
      if (l.role === 'added' && (b || !c)) fail();
      if (l.role === 'removed' && (!b || c)) fail();
      if (l.role === 'warnings') {
        const flags = l.flags![n],
          a = hit('added', p),
          r = hit('removed', p);
        if (
          (!a && !r) ||
          (flags & 1 && !a) ||
          (flags & 2 && !r) ||
          (flags & 4 && !h.protectedRegions.length)
        )
          fail();
        const overlap = protectedSources.some((s) => maskAtIndex(s, p));
        if (
          Boolean(flags & 1) !== (a && overlap) ||
          Boolean(flags & 2) !== (r && overlap)
        )
          fail();
      }
      if (l.role === 'added' || l.role === 'removed') {
        if (
          protectedSources.some((s) => maskAtIndex(s, p)) &&
          !hit('warnings', p)
        )
          fail();
      }
    });
  return Object.freeze({
    structureId: baseline.id,
    candidateMaskSha256: h.candidateMaskSha256,
    comparisonManifestSha256: h.comparisonManifestSha256,
    counts: Object.freeze({ ...h.counts }),
    layers: Object.freeze(layers),
    protectedRegionCount: h.protectedRegions.length,
  });
}

export function comparisonLayers(
  comparison: LocalComparison | null,
  mode: ComparisonMode,
): readonly ComparisonLayer[] {
  return (
    comparison?.layers.filter((l) =>
      mode === 'changes'
        ? l.role === 'added' || l.role === 'removed'
        : l.role === mode,
    ) ?? []
  );
}

export function comparisonFocus(
  comparison: LocalComparison,
  sourceK: number,
  direction: -1 | 1,
): Vec3 | null {
  const points = comparison.layers
    .filter((l) => l.role === 'added' || l.role === 'removed')
    .flatMap((l) => l.focuses)
    .sort((a, b) => a.sourceK - b.sourceK);
  return (
    (direction === 1
      ? points.find((p) => p.sourceK > sourceK + 1e-5)
      : points.findLast((p) => p.sourceK < sourceK - 1e-5)
    )?.lps ?? null
  );
}

export function renderComparisonSlice(
  study: LocalStudy,
  plane: ImagePlane,
  focus: Vec3,
  window: ImageWindow,
  layers: readonly ComparisonLayer[],
  opacity: number,
) {
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 0.8) fail();
  const output = renderLocalSlice(study, plane, focus, window, null, 0),
    grid = study.grids[plane],
    slice = grid.sliceForPoint(focus);
  const alpha = Math.max(0, Math.min(0.8, opacity));
  const colours = layers.map((l) =>
    [0, 2, 4].map((n) => parseInt(l.colour.slice(n + 1, n + 3), 16)),
  );
  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++) {
      const index = study.volume.lpsToIndex(grid.point(x, y, slice));
      const layerIndex = layers.findIndex((l) => maskAtIndex(l, index));
      if (layerIndex < 0) continue;
      const offset = 4 * (y * grid.width + x);
      for (let c = 0; c < 3; c++)
        output[offset + c] = Math.round(
          output[offset + c] * (1 - alpha) + colours[layerIndex][c] * alpha,
        );
    }
  return output;
}
