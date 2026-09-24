import type { Vec3 } from './volume-reslice';

export const LOCAL_MR_MAX_BYTES = 128 * 1024 * 1024;
export type NativeMrStudy = {
  dimensions: Vec3;
  spacing: readonly [number, number]; // column, row; mm
  directions: readonly [Vec3, Vec3];
  positions: readonly Vec3[];
  thickness: number;
  centreSpacing: number;
  values: Uint16Array | Int16Array;
  range: readonly [number, number];
  window: readonly [number, number]; // low, high; stored signal
  sourceSha256: string;
};
const fail = (): never => {
  throw new Error('Invalid or unsupported private MRI packet');
};
const vector = (v: unknown): v is Vec3 =>
  Array.isArray(v) &&
  v.length === 3 &&
  v.every((n) => Number.isFinite(n) && Math.abs(n) < 1e6);
const dot = (a: Vec3, b: Vec3) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const sha = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);

// JSON.parse keeps the last duplicate member. Check decoded names in every
// object first, so escaped spellings cannot override a privacy or hash claim.
const parseUniqueHeader = (json: string) => {
  let cursor = 0;
  const whitespace = () => {
    while (/^[\t\n\r ]$/.test(json[cursor] ?? '')) cursor++;
  };
  const string = (): string => {
    if (json[cursor] !== '"') fail();
    const start = cursor++;
    while (cursor < json.length) {
      const char = json[cursor++];
      if (char === '"') return JSON.parse(json.slice(start, cursor));
      if (char === '\\') cursor++; // Skip the escaped character, including a quote.
    }
    return fail();
  };
  const numberToken = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
  const value = (depth: number): void => {
    if (depth > 128) fail();
    whitespace();
    if (json[cursor] === '{') {
      cursor++;
      whitespace();
      const names = new Set<string>();
      if (json[cursor] === '}') {
        cursor++;
        return;
      }
      while (true) {
        whitespace();
        const name = string();
        if (names.has(name))
          throw new Error('Duplicate private MRI JSON header property');
        names.add(name);
        whitespace();
        if (json[cursor++] !== ':') fail();
        value(depth + 1);
        whitespace();
        const end = json[cursor++];
        if (end === '}') return;
        if (end !== ',') fail();
      }
    }
    if (json[cursor] === '[') {
      cursor++;
      whitespace();
      if (json[cursor] === ']') {
        cursor++;
        return;
      }
      while (true) {
        value(depth + 1);
        whitespace();
        const end = json[cursor++];
        if (end === ']') return;
        if (end !== ',') fail();
      }
    }
    if (json[cursor] === '"') {
      string();
      return;
    }
    for (const literal of ['true', 'false', 'null']) {
      if (json.startsWith(literal, cursor)) {
        cursor += literal.length;
        return;
      }
    }
    numberToken.lastIndex = cursor;
    const number = numberToken.exec(json);
    if (!number) return fail();
    cursor = numberToken.lastIndex;
  };
  value(0);
  whitespace();
  if (cursor !== json.length) fail();
  return JSON.parse(json);
};

/** Separate from CT admission. No registration, reslicing, persistence or network. */
export async function readNativeMr(
  buffer: ArrayBuffer,
): Promise<NativeMrStudy> {
  if (
    !(buffer instanceof ArrayBuffer) ||
    buffer.resizable ||
    buffer.byteLength < 24 ||
    buffer.byteLength > LOCAL_MR_MAX_BYTES
  )
    fail();
  if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) fail();
  const bytes = new Uint8Array(buffer),
    view = new DataView(buffer);
  if (new TextDecoder().decode(bytes.subarray(0, 8)) !== 'VMMR0001') fail();
  const headerSize = view.getUint32(8, true),
    bodySize = view.getUint32(12, true);
  const start = Math.ceil((16 + headerSize) / 8) * 8;
  if (
    headerSize < 2 ||
    headerSize > 131072 ||
    start + bodySize !== buffer.byteLength ||
    bodySize % 2
  )
    fail();
  // The preparer writes zero alignment bytes. Reject unclaimed payload outside
  // the JSON header and hashed scalar body, even though this gap is at most 7 B.
  if (bytes.subarray(16 + headerSize, start).some((byte) => byte !== 0)) fail();
  const h = parseUniqueHeader(
    new TextDecoder('utf-8', { fatal: true }).decode(
      bytes.subarray(16, 16 + headerSize),
    ),
  );
  const keys = [
    'schema',
    'release',
    'modality',
    'privacyCertified',
    'clinicalApproved',
    'atlasRegistration',
    'units',
    'order',
    'scalarType',
    'dimensions',
    'spacing',
    'directions',
    'positions',
    'thickness',
    'window',
    'sourceSha256',
    'bodySha256',
  ];
  if (
    !h ||
    Object.keys(h).length !== keys.length ||
    keys.some((k) => !(k in h)) ||
    h.schema !== 'vm-native-mr/1' ||
    h.release !== 'NOT_FOR_PUBLICATION' ||
    h.modality !== 'MR' ||
    h.privacyCertified !== false ||
    h.clinicalApproved !== false ||
    h.atlasRegistration !== null ||
    h.units !== 'stored-MR-signal' ||
    h.order !== 'column-row-slice' ||
    !['uint16', 'int16'].includes(h.scalarType) ||
    !sha(h.sourceSha256) ||
    !sha(h.bodySha256)
  )
    fail();
  if (
    !vector(h.dimensions) ||
    !h.dimensions.every(
      (n: number, i: number) =>
        Number.isInteger(n) &&
        n >= (i === 2 ? 2 : 1) &&
        n <= (i === 2 ? 512 : 2048),
    ) ||
    h.dimensions.reduce((a: number, b: number) => a * b, 1) * 2 !== bodySize
  )
    fail();
  if (
    !Array.isArray(h.spacing) ||
    h.spacing.length !== 2 ||
    !h.spacing.every(
      (n: number) => Number.isFinite(n) && n >= 0.001 && n <= 100,
    ) ||
    !Array.isArray(h.directions) ||
    h.directions.length !== 2 ||
    !h.directions.every(vector)
  )
    fail();
  const [u, v] = h.directions as [Vec3, Vec3];
  if (
    Math.abs(dot(u, u) - 1) > 1e-5 ||
    Math.abs(dot(v, v) - 1) > 1e-5 ||
    Math.abs(dot(u, v)) > 1e-5
  )
    fail();
  const normal: Vec3 = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  if (
    !Array.isArray(h.positions) ||
    h.positions.length !== h.dimensions[2] ||
    !h.positions.every(vector) ||
    !Number.isFinite(h.thickness) ||
    h.thickness <= 0 ||
    h.thickness > 100
  )
    fail();
  const positions = h.positions as Vec3[];
  const gaps = positions.slice(1).map((p, i) => {
    const delta = p.map((n, k) => n - positions[i][k]) as unknown as Vec3;
    const gap = dot(delta, normal);
    if (
      gap <= 0.001 ||
      gap > 100 ||
      Math.hypot(...delta.map((n, k) => n - gap * normal[k])) > 0.01
    )
      fail();
    return gap;
  });
  const centreSpacing = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (gaps.some((g) => Math.abs(g - centreSpacing) > 0.01)) fail();
  if (
    !Array.isArray(h.window) ||
    h.window.length !== 2 ||
    !h.window.every(Number.isFinite) ||
    h.window[1] <= h.window[0] ||
    h.window[0] < -65536 ||
    h.window[1] > 131072
  )
    fail();
  const digest = Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', bytes.subarray(start)),
    ),
    (n) => n.toString(16).padStart(2, '0'),
  ).join('');
  if (digest !== h.bodySha256) fail();
  const values =
    h.scalarType === 'uint16'
      ? new Uint16Array(buffer, start, bodySize / 2)
      : new Int16Array(buffer, start, bodySize / 2);
  let min = Infinity,
    max = -Infinity;
  for (const n of values) {
    min = Math.min(min, n);
    max = Math.max(max, n);
  }
  if (max <= min) fail();
  return Object.freeze({
    dimensions: Object.freeze([...h.dimensions]) as Vec3,
    spacing: Object.freeze([...h.spacing]) as unknown as [number, number],
    directions: Object.freeze([
      Object.freeze([...u]),
      Object.freeze([...v]),
    ]) as unknown as [Vec3, Vec3],
    positions: Object.freeze(
      positions.map((p) => Object.freeze([...p]) as Vec3),
    ),
    thickness: h.thickness,
    centreSpacing,
    values,
    range: Object.freeze([min, max]) as [number, number],
    window: Object.freeze([...h.window]) as [number, number],
    sourceSha256: h.sourceSha256,
  });
}

export function nativeMrPoint(
  study: NativeMrStudy,
  column: number,
  row: number,
  slice: number,
) {
  if (
    ![column, row, slice].every(
      (n, i) => Number.isInteger(n) && n >= 0 && n < study.dimensions[i],
    )
  )
    fail();
  const lps = study.positions[slice].map(
    (n, axis) =>
      n +
      column * study.spacing[0] * study.directions[0][axis] +
      row * study.spacing[1] * study.directions[1][axis],
  ) as unknown as Vec3;
  return {
    lps,
    signal:
      study.values[
        column + study.dimensions[0] * (row + study.dimensions[1] * slice)
      ],
  };
}

/** Labels denote the direction toward each image edge, including obliquity. */
export function nativeMrEdges(study: NativeMrStudy) {
  const label = (d: Vec3, sign: number) =>
    d
      .map((v, i) => ({ value: v * sign, axis: i }))
      .filter((x) => Math.abs(x.value) > 0.2)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .map((x) => (x.value > 0 ? ['L', 'P', 'S'] : ['R', 'A', 'I'])[x.axis])
      .join('');
  return [
    label(study.directions[0], -1),
    label(study.directions[0], 1),
    label(study.directions[1], -1),
    label(study.directions[1], 1),
  ];
}

export function renderNativeMr(
  study: NativeMrStudy,
  slice: number,
  low: number,
  high: number,
  inverted = false,
) {
  if (
    !Number.isInteger(slice) ||
    slice < 0 ||
    slice >= study.dimensions[2] ||
    ![low, high].every(Number.isFinite) ||
    high <= low
  )
    fail();
  const count = study.dimensions[0] * study.dimensions[1],
    rgba = new Uint8ClampedArray(count * 4);
  for (let i = 0; i < count; i++) {
    const value = Math.round(
      Math.max(
        0,
        Math.min(1, (study.values[slice * count + i] - low) / (high - low)),
      ) * 255,
    );
    rgba[i * 4] =
      rgba[i * 4 + 1] =
      rgba[i * 4 + 2] =
        inverted ? 255 - value : value;
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}
