import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { join } from 'node:path';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url),
  React = require('react');
const Link = { __esModule: true, ...(await import('vinext/shims/link')) };
const compiled = await build({
  stdin: {
    contents: `export * from './lib/local-mr-study'; export * from './lib/native-mr-position'; export {readLocalStudy} from './lib/local-imaging-study'; export {default as Workbench,LoadedNativeMr} from './app/native-mr-workbench';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});
let active = false,
  cursor = 0,
  slots = [],
  checks = 0;
let captureWorkbenchCleanup = false,
  workbenchCleanup;
const hooks = {
  ...React,
  useState(value) {
    if (!active) return React.useState(value);
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value;
    return [
      slots[i],
      (v) => {
        slots[i] = typeof v === 'function' ? v(slots[i]) : v;
      },
    ];
  },
  useRef(value) {
    if (!active) return React.useRef(value);
    const i = cursor++;
    return (slots[i] ??= { current: value });
  },
  useEffect(fn, deps) {
    if (!active) return React.useEffect(fn, deps);
    if (captureWorkbenchCleanup) workbenchCleanup = fn();
  },
};
const scope = { exports: {} };
const pendingDigests = [];
const readers = [];
class ControlledFileReader {
  result = null;
  error = null;
  aborts = 0;
  constructor() {
    readers.push(this);
  }
  readAsArrayBuffer(file) {
    this.file = file;
    if (file.startError) throw file.startError;
  }
  abort() {
    this.aborts++;
    this.onabort?.();
  }
  finish(bytes) {
    this.result = bytes;
    this.onload?.();
  }
  fail(error) {
    this.error = error;
    this.onerror?.();
  }
}
runInNewContext(compiled.outputFiles[0].text, {
  module: scope,
  exports: scope.exports,
  require: (id) =>
    id === 'react' ? hooks : id === 'next/link' ? Link : require(id),
  ArrayBuffer,
  Uint8Array,
  Uint16Array,
  Int16Array,
  Uint8ClampedArray,
  DataView,
  FileReader: ControlledFileReader,
  TextDecoder,
  crypto: {
    subtle: {
      digest(...args) {
        const pending = webcrypto.subtle.digest(...args);
        pendingDigests.push(pending);
        return pending;
      },
    },
  },
  console,
  FormData: class {
    constructor(form) {
      this.fields = form.fields;
    }
    get(name) {
      return this.fields[name];
    }
  },
  fetch() {
    throw Error('Unexpected upload');
  },
  localStorage: {
    setItem() {
      throw Error('Unexpected persistence');
    },
  },
});
const api = scope.exports,
  hash = (b) => createHash('sha256').update(b).digest('hex');
const same = (a, b) => {
  checks++;
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)),
  );
};
const check = (v) => {
  checks++;
  assert(v);
};
const fails = async (fn) => {
  checks++;
  await assert.rejects(fn);
};
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
function fixture() {
  return {
    schema: 'vm-native-mr/1',
    release: 'NOT_FOR_PUBLICATION',
    modality: 'MR',
    privacyCertified: false,
    clinicalApproved: false,
    atlasRegistration: null,
    units: 'stored-MR-signal',
    order: 'column-row-slice',
    scalarType: 'uint16',
    dimensions: [4, 3, 3],
    spacing: [3, 2],
    directions: [
      [0, 1, 0],
      [-1, 0, 0],
    ],
    positions: [
      [50, 40, 30],
      [50, 40, 33.6],
      [50, 40, 37.2],
    ],
    thickness: 3,
    window: [0, 35],
    sourceSha256: 'a'.repeat(64),
    bodySha256: '',
  };
}
function encode(
  header = fixture(),
  values = Uint16Array.from({ length: 36 }, (_, i) => i),
) {
  const body = Buffer.from(values.buffer, values.byteOffset, values.byteLength);
  const h = Buffer.from(JSON.stringify({ ...header, bodySha256: hash(body) }));
  const start = Math.ceil((16 + h.length) / 8) * 8;
  const bytes = Buffer.alloc(start + body.length);
  bytes.write('VMMR0001');
  bytes.writeUInt32LE(h.length, 8);
  bytes.writeUInt32LE(body.length, 12);
  h.copy(bytes, 16);
  body.copy(bytes, start);
  return ab(bytes);
}
const packet = encode(),
  study = await api.readNativeMr(packet);
same(study.dimensions, [4, 3, 3]);
same(api.nativeMrPoint(study, 1, 2, 1), { lps: [46, 43, 33.6], signal: 21 });
same(api.nativeMrEdges(study), ['A', 'P', 'L', 'R']);
check(Math.abs(study.centreSpacing - 3.6) < 1e-10);
same(
  Array.from(api.renderNativeMr(study, 0, 0, 35).slice(0, 8)),
  [0, 0, 0, 255, 7, 7, 7, 255],
);
same(
  Array.from(api.renderNativeMr(study, 0, 0, 35, true).slice(0, 4)),
  [255, 255, 255, 255],
);
const signed = fixture();
signed.scalarType = 'int16';
same(
  (
    await api.readNativeMr(
      encode(
        signed,
        Int16Array.from({ length: 36 }, (_, i) => i - 18),
      ),
    )
  ).range,
  [-18, 17],
);
const oblique = fixture(),
  a = Math.sqrt(0.5);
oblique.directions = [
  [a, a, 0],
  [0, 0, 1],
];
oblique.positions = [0, 1, 2].map((k) => [
  50 + 3.6 * k * a,
  40 - 3.6 * k * a,
  30,
]);
const obliqueStudy = await api.readNativeMr(encode(oblique));
const p = api.nativeMrPoint(obliqueStudy, 1, 2, 1);
[50 + 6.6 * a, 40 - 0.6 * a, 34].forEach((n, i) =>
  check(Math.abs(p.lps[i] - n) < 1e-9),
);
same(api.nativeMrEdges(obliqueStudy), ['RA', 'LP', 'I', 'S']);
const obliquePositions = api.nativeMrPositions(obliqueStudy);
obliquePositions.forEach(({ position }, index) =>
  check(Math.abs(position - (10 * a + 3.6 * index)) < 1e-9),
);
same(
  obliquePositions.map(({ previousSpacing, nextSpacing }) =>
    [previousSpacing, nextSpacing].map((n) =>
      n === null ? null : Number(n.toFixed(3)),
    ),
  ),
  [
    [null, 3.6],
    [3.6, 3.6],
    [3.6, null],
  ],
);
obliquePositions.forEach(({ previousGap, nextGap }) => {
  if (previousGap !== null) check(Math.abs(previousGap - 0.6) < 1e-9);
  if (nextGap !== null) check(Math.abs(nextGap - 0.6) < 1e-9);
});
const overlapPositions = api.nativeMrPositions({
  ...obliqueStudy,
  thickness: 4,
});
check(Math.abs(overlapPositions[1].previousGap + 0.4) < 1e-9);
check(Math.abs(overlapPositions[1].nextGap + 0.4) < 1e-9);
const slightOffset = structuredClone(oblique);
slightOffset.positions[1][0] += 0.002 * a;
slightOffset.positions[1][1] -= 0.002 * a;
const offsetStudy = await api.readNativeMr(encode(slightOffset));
const offsetPositions = api.nativeMrPositions(offsetStudy);
check(Math.abs(offsetPositions[1].previousSpacing - 3.602) < 1e-9);
check(Math.abs(offsetPositions[1].nextSpacing - 3.598) < 1e-9);
check(Math.abs(offsetPositions[1].previousGap - 0.602) < 1e-9);
check(Math.abs(offsetPositions[1].nextGap - 0.598) < 1e-9);
for (const change of [
  (h) => (h.modality = 'CT'),
  (h) => (h.units = 'HU'),
  (h) => (h.clinicalApproved = true),
  (h) => (h.privacyCertified = true),
  (h) => (h.atlasRegistration = {}),
  (h) => (h.patientName = 'must-not-copy'),
  (h) => (h.dimensions = [4, 3, 4]),
  (h) => (h.spacing = [0, 2]),
  (h) =>
    (h.directions = [
      [1, 0, 0],
      [1, 0, 0],
    ]),
  (h) => (h.positions[1] = h.positions[0]),
  (h) => (h.positions[1] = [50, 40, 34]),
  (h) => (h.positions[1] = [51, 40, 33.6]),
  (h) => h.positions.pop(),
  (h) => (h.thickness = 0),
  (h) => (h.window = [1, 1]),
  (h) => (h.sourceSha256 = 'unknown'),
  (h) => (h.order = 'slice-row-column'),
]) {
  const h = fixture();
  change(h);
  await fails(() => api.readNativeMr(encode(h)));
}
const damaged = packet.slice(0);
new Uint8Array(damaged)[damaged.byteLength - 1] ^= 1;
await fails(() => api.readNativeMr(damaged));
await fails(() => api.readNativeMr(packet.slice(0, -1)));
await fails(() => api.readLocalStudy(packet));
const fakeCt = packet.slice(0);
new Uint8Array(fakeCt).set(new TextEncoder().encode('VMATLAS1'));
await fails(() => api.readNativeMr(fakeCt));
for (const point of [
  [-1, 0, 0],
  [4, 0, 0],
  [0, 3, 0],
  [0, 0, 3],
  [0.2, 0, 0],
]) {
  checks++;
  assert.throws(() => api.nativeMrPoint(study, ...point));
}
check(hash(new Uint8Array(packet)) === hash(new Uint8Array(encode())));
const { renderToStaticMarkup } = require('react-dom/server');
const html = renderToStaticMarkup(
  React.createElement(api.LoadedNativeMr, { study, close() {} }),
);
check(html.includes('Native MRI slice'));
check(html.includes('not interpolated'));
check(html.includes('Acquired MRI position') && html.includes('projected LPS'));
check(html.includes('Acquired slice 2 of 3; projected LPS 33.600 mm'));
check(html.includes('Nominal thickness 3.000 mm'));
check(!html.includes('<details open'));
check(html.includes('Unreviewed'));
check(html.includes('Stored signal'));
check(
  html.includes('role="alert"') &&
    html.includes('Source provenance is unverified'),
);
check(
  html.indexOf('class="native-mr-provenance"') >= 0 &&
    html.indexOf('class="native-mr-provenance"') <
      html.indexOf('aria-label="MRI controls"'),
);
check(
  renderToStaticMarkup(React.createElement(api.Workbench)).includes(
    'accept=".vmmr"',
  ),
);
function tree() {
  active = true;
  cursor = 0;
  const result = api.LoadedNativeMr({
    study,
    close() {
      closed++;
    },
  });
  active = false;
  return result;
}
function walk(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, out));
    return out;
  }
  out.push(node);
  walk(node.props?.children, out);
  return out;
}
const find = (predicate) => {
  const result = walk(tree()).find(predicate);
  assert(result, 'Expected real component control');
  return result;
};
let closed = 0;
slots = [];
find((n) => n.props?.['aria-label'] === 'Next native slice').props.onClick();
same(slots[0], 2);
check(
  find((n) => n.props?.['aria-label'] === 'Next native slice').props.disabled,
);
find(
  (n) => n.props?.['aria-label'] === 'Previous native slice',
).props.onClick();
same(slots[0], 1);
const target = () => find((n) => n.props?.className === 'local-slice-target');
target().props.onKeyDown({ key: 'PageUp', preventDefault() {} });
same(slots[0], 0);
target().props.onKeyDown({ key: 'ArrowLeft', preventDefault() {} });
same(slots[1], [1, 1]);
target().props.onClick({
  detail: 1,
  clientX: 200,
  clientY: 150,
  currentTarget: {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 150 }),
  },
});
same(slots[1], [3, 2]);
target().props.onClick({ detail: 0 });
same(slots[1], [3, 2]);
find((n) => n.props?.['aria-label'] === 'Native MRI slice').props.onChange({
  target: { value: '2' },
});
same(slots[0], 2);
const positionSelect = () =>
  find((n) => n.props?.['aria-label'] === 'Acquired MRI position');
same(positionSelect().type, 'select');
same(positionSelect().props.value, 2);
positionSelect().props.onChange({ target: { value: '0' } });
same(slots[0], 0);
positionSelect().props.onChange({ target: { value: '1.5' } });
same(slots[0], 0);
positionSelect().props.onChange({ target: { value: '3' } });
same(slots[0], 0);
positionSelect().props.onChange({ target: { value: '1' } });
same(slots[0], 1);
check(
  walk(tree()).some(
    (n) => n.type === 'p' && n.props?.className === 'native-mr-gap',
  ),
);
find((n) => n.type === 'form').props.onSubmit({
  preventDefault() {},
  currentTarget: { fields: { low: '10', high: '5' } },
});
same(slots[2], [0, 35]);
check(slots[4].includes('must exceed'));
find((n) => n.type === 'form').props.onSubmit({
  preventDefault() {},
  currentTarget: { fields: { low: '5', high: '25' } },
});
same(slots[2], [5, 25]);
find((n) => n.props?.children === 'Reset display').props.onClick();
same(slots[2], [0, 35]);
// The browser keeps uncontrolled input edits when a form's key is unchanged.
// Reset must remount even if validation failed and the applied range never changed.
const defaultFormKey = find((n) => n.type === 'form').key;
find((n) => n.type === 'form').props.onSubmit({
  preventDefault() {},
  currentTarget: { fields: { low: '30', high: '10' } },
});
same(slots[2], [0, 35]);
find((n) => n.props?.children === 'Reset display').props.onClick();
check(find((n) => n.type === 'form').key !== defaultFormKey);
same(slots[2], [0, 35]);
same(slots[4], '');
same(slots[1], [3, 2]);
find((n) => n.props?.children === 'Close local MRI').props.onClick();
same(closed, 1);
// Exercise the actual import callbacks with controlled FileReader events.
function opener() {
  active = true;
  cursor = 0;
  captureWorkbenchCleanup = true;
  const result = api.Workbench();
  captureWorkbenchCleanup = false;
  active = false;
  return result;
}
const openerControl = (predicate) => {
  const result = walk(opener()).find(predicate);
  assert(result, 'Expected real import control');
  return result;
};
slots = [];
const importChange = openerControl((n) => n.props?.type === 'file').props
  .onChange;
const loadFile = (file) =>
  importChange({ target: { files: [file], value: 'synthetic' } });
const settle = async () => {
  // Cross-realm file promises and WebCrypto each enqueue their own continuations.
  for (let turn = 0; turn < 4; turn++) {
    await new Promise(setImmediate);
    await Promise.all(pendingDigests);
  }
};
loadFile({ size: packet.byteLength });
const cancelledReader = readers.at(-1);
check(slots[1]);
openerControl((n) => n.props?.children === 'Cancel').props.onClick();
same(cancelledReader.aborts, 1);
same([slots[0], slots[1], slots[2]], [null, false, '']);
cancelledReader.finish(packet);
await settle();
same([slots[0], slots[1], slots[2]], [null, false, '']);
const signedPacket = encode(
  signed,
  Int16Array.from({ length: 36 }, (_, i) => i - 18),
);
loadFile({ size: packet.byteLength });
const replacedReader = readers.at(-1);
loadFile({ size: signedPacket.byteLength });
const nextReader = readers.at(-1);
same(replacedReader.aborts, 1);
nextReader.finish(signedPacket);
await settle();
same(slots[0].range, [-18, 17]);
replacedReader.fail(Error('Synthetic late read failure'));
await settle();
same(slots[0].range, [-18, 17]);
same([slots[1], slots[2]], [false, '']);
const closeLoaded = openerControl((n) => n.type === api.LoadedNativeMr).props
  .close;
// A retained input callback can race a close; close must abort that read too.
loadFile({ size: packet.byteLength });
const closedReader = readers.at(-1);
closeLoaded();
same(closedReader.aborts, 1);
closedReader.finish(packet);
await settle();
same([slots[0], slots[1], slots[2]], [null, false, '']);
loadFile({
  size: packet.byteLength,
  startError: Error('Synthetic read start failure'),
});
await settle();
same(slots[4].current, null);
check(
  slots[2].includes('Cannot read this MRI packet') &&
    slots[2].includes('Source provenance is not checked'),
);
loadFile({ size: signedPacket.byteLength });
const afterStartError = readers.at(-1);
afterStartError.finish(signedPacket);
await settle();
same(slots[0].range, [-18, 17]);
same([slots[1], slots[2]], [false, '']);
// A fabricated packet can be internally consistent, including its claimed source hash.
// Admission must keep the source-provenance warning visible and assistive-announced.
const fabricated = fixture();
fabricated.sourceSha256 = 'f'.repeat(64);
const fabricatedPacket = encode(
  fabricated,
  Uint16Array.from({ length: 36 }, (_, i) => 100 + i),
);
loadFile({ size: fabricatedPacket.byteLength });
readers.at(-1).finish(fabricatedPacket);
await settle();
same(slots[0].sourceSha256, fabricated.sourceSha256);
const fabricatedLoaded = openerControl((n) => n.type === api.LoadedNativeMr);
const fabricatedHtml = renderToStaticMarkup(
  React.createElement(api.LoadedNativeMr, fabricatedLoaded.props),
);
check(
  fabricatedHtml.includes('role="alert"') &&
    fabricatedHtml.includes('Source provenance is unverified'),
);
check(
  fabricatedHtml.includes('does not authenticate the source') &&
    fabricatedHtml.includes('privacy or clinical clearance'),
);
openerControl((n) => n.type === api.LoadedNativeMr).props.close();
const priorReaders = readers.length;
loadFile({ size: api.LOCAL_MR_MAX_BYTES + 1 });
same(readers.length, priorReaders);
check(slots[2].includes('128 MiB'));
same(slots[0], null);
loadFile({ size: packet.byteLength });
const unmountedReader = readers.at(-1);
workbenchCleanup();
same(unmountedReader.aborts, 1);
const unmountedState = [slots[0], slots[1], slots[2]];
unmountedReader.fail(Error('Synthetic late unmounted failure'));
await settle();
same([slots[0], slots[1], slots[2]], unmountedState);
let privateFrames = 0;
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? null : process.argv[i + 1];
};
if (arg('--packet')) {
  const actual = await api.readNativeMr(ab(await readFile(arg('--packet'))));
  const source = JSON.parse(
    await readFile(
      join(arg('--source-packet'), 'MRI_STACK_MANIFEST.json'),
      'utf8',
    ),
  );
  same(
    actual.sourceSha256,
    source.files.find((f) => f.name === 'native-mr-stack.nii.gz').sha256,
  );
  same(actual.dimensions, source.dataShapeColumnsRowsSlices);
  same(actual.positions, source.positionsLpsMm);
  const count = actual.dimensions[0] * actual.dimensions[1];
  for (let k = 0; k < actual.dimensions[2]; k++) {
    same(
      hash(
        new Uint8Array(
          actual.values.buffer,
          actual.values.byteOffset + k * count * 2,
          count * 2,
        ),
      ),
      source.frames[k].decodedPixelSha256,
    );
    same(api.renderNativeMr(actual, k, ...actual.window).length, count * 4);
  }
  privateFrames = actual.dimensions[2];
}
console.log(
  JSON.stringify({
    checks,
    privateFrames,
    ctAdmissionUnchanged: true,
    browserOrClinicalValidation: false,
  }),
);
