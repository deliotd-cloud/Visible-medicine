/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled real component callbacks; no browser/GPU validation. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { resolve, dirname } from 'node:path';
import { build } from './workspace-component-test-build.mjs';
const directory = process.argv[2];
if (!directory)
  throw Error(
    'Supply the synthetic fixture directory from validate-local-comparison-export.py',
  );
const require = createRequire(import.meta.url),
  React = require('react');
const Link = await import('vinext/shims/link');
const compiled = await build({
  stdin: {
    contents: `export * from './lib/local-mask-comparison'; export * from './lib/local-imaging-study'; export * from './lib/local-candidate-review'; export {LoadedStudy} from './app/local-imaging-workbench';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  platform: 'node',
  format: 'cjs',
  bundle: true,
  write: false,
  plugins: [
    {
      name: 'gpu-boundary-only',
      setup(b) {
        b.onLoad({ filter: /anatomy-canvas\.tsx$/ }, () => ({
          contents: 'export const AnatomyCanvas=()=>null;',
          loader: 'tsx',
        }));
      },
    },
  ],
});
let active = false,
  cursor = 0,
  slots = [],
  effects = [],
  checks = 0;
const shim = {
  ...React,
  useState(value) {
    if (!active) return React.useState(value);
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value;
    return [
      slots[i],
      (value) => {
        slots[i] = typeof value === 'function' ? value(slots[i]) : value;
      },
    ];
  },
  useRef(value) {
    if (!active) return React.useRef(value);
    const i = cursor++;
    if (!(i in slots)) slots[i] = { current: value };
    return slots[i];
  },
  useEffect(fn, deps) {
    if (!active) return React.useEffect(fn, deps);
    effects.push(fn);
  },
  useMemo: (fn, deps) => (active ? fn() : React.useMemo(fn, deps)),
  useCallback: (fn, deps) => (active ? fn : React.useCallback(fn, deps)),
};
const scope = { exports: {} };
const env = {
  module: scope,
  exports: scope.exports,
  require: (id) =>
    id === 'react' ? shim : id === 'next/link' ? Link : require(id),
  ArrayBuffer,
  Uint8Array,
  Uint16Array,
  Uint32Array,
  Float32Array,
  Int16Array,
  DataView,
  TextDecoder,
  TextEncoder,
  crypto: webcrypto,
  setTimeout,
  clearTimeout,
  console,
  URL,
  Blob,
  confirm: () => false,
  fetch() {
    throw Error('Unexpected network request');
  },
  localStorage: {
    setItem() {
      throw Error('Unexpected persistence');
    },
  },
};
runInNewContext(compiled.outputFiles[0].text, env);
const api = scope.exports;
const same = (a, b) => {
  checks++;
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)),
  );
};
const check = (value) => {
  checks++;
  assert(value);
};
const fails = async (fn) => {
  checks++;
  await assert.rejects(fn);
};
const ab = (bytes) =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const bytes = await readFile(resolve(directory, 'comparison.vmcompare'));
const baselineBytes = await readFile(resolve(directory, 'baseline.vmatlas'));
const hash = (data) => createHash('sha256').update(data).digest('hex');
const baselineHash = hash(baselineBytes);
const study = await api.readLocalStudy(ab(baselineBytes));
const parsed = await api.readLocalComparison(ab(bytes), study);
const candidatePoint = parsed.layers.find((l) => l.role === 'candidate')
  .focuses[0].lps;
const candidateMark = {
  structureId: parsed.structureId,
  maskSha256: parsed.candidateMaskSha256,
  action: 'include',
  lps: candidatePoint,
};
const candidateFeedback = api.localCandidateReviewExport(study, parsed, [
  candidateMark,
  { ...candidateMark, action: 'exclude' },
]);
same(candidateFeedback.schema, 'vm-local-candidate-review/1');
same(candidateFeedback.candidateMaskSha256, parsed.candidateMaskSha256);
same(candidateFeedback.baselineMaskSha256, parsed.baselineMaskSha256);
same(
  candidateFeedback.comparisonManifestSha256,
  parsed.comparisonManifestSha256,
);
same(candidateFeedback.marks[0].lps, candidatePoint);
same(candidateFeedback.approval, false);
checks++;
assert.notEqual(candidateFeedback.marks[0].lps, candidatePoint);
for (const altered of [
  { ...candidateMark, maskSha256: parsed.baselineMaskSha256 },
  { ...candidateMark, structureId: 'cth.foreign' },
  { ...candidateMark, action: 'approve' },
  { ...candidateMark, lps: [NaN, 0, 0] },
  { ...candidateMark, lps: [1e6, 0, 0] },
]) {
  checks++;
  assert.throws(() => api.localCandidateReviewExport(study, parsed, [altered]));
}
for (const altered of [
  { ...parsed, baselineMaskSha256: '0'.repeat(64) },
  { ...parsed, sourceCtSha256: '0'.repeat(64) },
  { ...parsed, sourceAnnotationSha256: '0'.repeat(64) },
  { ...parsed, comparisonManifestSha256: 'invalid' },
  { ...parsed, requestSha256: 'invalid' },
]) {
  checks++;
  assert.throws(() =>
    api.localCandidateReviewExport(study, altered, [candidateMark]),
  );
}
for (const marks of [[], Array(501).fill(candidateMark)]) {
  checks++;
  assert.throws(() => api.localCandidateReviewExport(study, parsed, marks));
}
checks++;
assert.throws(() => api.localReviewExport(study, [candidateMark]));
if (process.argv[3] === '--write-feedback') {
  const output = resolve(process.argv[4]);
  assert.equal(dirname(output), resolve(directory));
  await writeFile(output, JSON.stringify(candidateFeedback), { flag: 'wx' });
  console.log(
    JSON.stringify({
      syntheticCandidateFeedbackExported: true,
      checks,
      clinicalApprovalAdded: false,
    }),
  );
  process.exit(0);
}
same(parsed.counts, {
  baseline: 2,
  candidate: 2,
  added: 1,
  removed: 1,
  warnings: 2,
});
same(
  parsed.layers.map((l) => l.role),
  ['candidate', 'added', 'removed', 'warnings'],
);
const mutate = (change, bodyChange) => {
  const length = bytes.readUInt32LE(8),
    start = Math.ceil((16 + length) / 8) * 8;
  const h = JSON.parse(bytes.subarray(16, 16 + length)),
    body = Buffer.from(bytes.subarray(start));
  change(h);
  bodyChange?.(h, body);
  h.bodySha256 = hash(body);
  const header = Buffer.from(JSON.stringify(h)),
    bodyStart = Math.ceil((16 + header.length) / 8) * 8;
  const result = Buffer.alloc(bodyStart + body.length);
  result.write('VMCMP001');
  result.writeUInt32LE(header.length, 8);
  result.writeUInt32LE(body.length, 12);
  header.copy(result, 16);
  body.copy(result, bodyStart);
  return ab(result);
};
for (const change of [
  (h) => (h.schema = 'other'),
  (h) => (h.approval = true),
  (h) => (h.viewerValidated = true),
  (h) => (h.coordinateSystem = 'RAS-mm'),
  (h) => (h.sourceCtSha256 = '0'.repeat(64)),
  (h) => (h.sourceAnnotationSha256 = '0'.repeat(64)),
  (h) => (h.baselineMaskSha256 = '0'.repeat(64)),
  (h) => (h.structureId = 'cth.foreign'),
  (h) => h.originLps[0]++,
  (h) => (h.stepsLps[0][0] *= -1),
  (h) => h.dimensions[2]++,
  (h) => h.counts.baseline++,
  (h) => h.counts.added++,
  (h) => (h.counts.candidate = -1),
  (h) => (h.protectedSources = []),
  (h) => (h.protectedSources[0].sha256 = '0'.repeat(64)),
  (h) => h.layers.push(h.layers[0]),
  (h) => (h.layers[0].colour = '#ffffff'),
  (h) => h.layers[0].mask.offset++,
  (h) => h.layers[0].mask.bytes++,
  (h) => (h.layers[0].positions = h.layers[1].positions),
  (h) => (h.layers[0].cropStart[2] = -1),
  (h) => h.layers[0].focuses[0].sourceK++,
  (h) => (h.layers[0].focuses[0].lps[0] += 100),
  (h) => h.layers[0].focuses.pop(),
  (h) => (h.layers[0].surfaceMethod = 'smoothed'),
  (h) => (h.protectedRegions = []),
  (h) => h.protectedRegions.push(h.protectedRegions[0]),
  (h) => {
    h.layers[1].role = 'removed';
    h.layers[1].colour = api.comparisonColours.removed;
    h.layers[2].role = 'added';
    h.layers[2].colour = api.comparisonColours.added;
  },
])
  await fails(() => api.readLocalComparison(mutate(change), study));
for (const change of [
  (h, b) => (b[h.layers[0].mask.offset] ^= 128), // Tail bits cannot masquerade as real voxels.
  (h, b) => b.writeUInt32LE(9999999, h.layers[0].indices.offset),
  (h, b) => b.writeFloatLE(NaN, h.layers[0].positions.offset),
  (h, b) => b.writeFloatLE(9999999, h.layers[0].positions.offset),
  (h, b) => (b[h.layers[3].flags.offset] = 7),
  (h, b) => (b[h.layers[3].flags.offset] = 0),
  (h, b) => (b[h.layers[3].flags.offset] = 4), // Cannot hide known accepted-mask overlap.
])
  await fails(() =>
    api.readLocalComparison(
      mutate(() => {}, change),
      study,
    ),
  );
const corrupt = Buffer.from(bytes);
corrupt[corrupt.length - 1] ^= 1;
await fails(() => api.readLocalComparison(ab(corrupt), study));
await fails(() =>
  api.readLocalComparison(ab(bytes.subarray(0, bytes.length - 1)), study),
);
await fails(() =>
  api.readLocalComparison(
    new ArrayBuffer(api.LOCAL_COMPARISON_MAX_BYTES + 1),
    study,
  ),
);
for (const name of ['identity', 'empty']) {
  const result = await api.readLocalComparison(
    ab(await readFile(resolve(directory, name + '.vmcompare'))),
    study,
  );
  same(result.counts.added, 0);
  same(result.counts.removed, name === 'identity' ? 0 : 2);
  same(
    api.comparisonLayers(result, 'changes').length,
    name === 'identity' ? 0 : 1,
  );
}
same(api.comparisonLayers(parsed, 'baseline'), []);
same(
  api.comparisonLayers(parsed, 'changes').map((l) => l.role),
  ['added', 'removed'],
);
same(
  api.comparisonLayers(parsed, 'candidate').map((l) => l.role),
  ['candidate'],
);
same(
  api.comparisonLayers(parsed, 'warnings').map((l) => l.role),
  ['warnings'],
);
const first = api.comparisonFocus(parsed, -1, 1),
  last = api.comparisonFocus(parsed, 99, -1);
check(Math.abs(study.volume.lpsToIndex(first)[2] - 2) < 1e-6);
check(Math.abs(study.volume.lpsToIndex(last)[2] - 4) < 1e-6);
same(api.comparisonFocus(parsed, 4, 1), null);
same(api.comparisonFocus(parsed, 2, -1), null);
checks++;
assert.throws(() =>
  api.renderComparisonSlice(
    study,
    'axial',
    first,
    study.window,
    parsed.layers,
    NaN,
  ),
);
for (const plane of ['axial', 'coronal', 'sagittal']) {
  const base = api.renderLocalSlice(study, plane, last, study.window, null, 0);
  same(
    api.renderComparisonSlice(
      study,
      plane,
      last,
      study.window,
      parsed.layers,
      0,
    ),
    base,
  );
  const result = api.renderComparisonSlice(
    study,
    plane,
    last,
    study.window,
    api.comparisonLayers(parsed, 'changes'),
    0.5,
  );
  check(result.some((v, i) => v !== base[i]));
  check(result.every((v, i) => i % 4 !== 3 || v === base[i]));
}
// Drive real JSX callback wiring with controlled hooks; no DOM, GPU, or file upload.
const text = (node) =>
  typeof node === 'string' || typeof node === 'number'
    ? String(node)
    : Array.isArray(node)
      ? node.map(text).join('')
      : text(node?.props?.children ?? '');
const all = (node) =>
  !node || typeof node !== 'object'
    ? []
    : Array.isArray(node)
      ? node.flatMap(all)
      : [node, ...all(node.props?.children)];
let closed = 0;
const render = () => {
  active = true;
  cursor = 0;
  effects = [];
  const tree = api.LoadedStudy({ study, close: () => closed++ });
  active = false;
  return tree;
};
let tree = render();
const button = (label) =>
  all(tree).find((n) => n.props?.onClick && text(n) === label);
const select = (label) =>
  all(tree)
    .find((n) => n.type === 'label' && text(n).startsWith(label))
    ?.props.children.find((n) => n.type === 'select');
const attachment = () =>
  all(tree).find((n) => n.type === 'input' && n.props.accept === '.vmcompare');
const load = (file) =>
  attachment().props.onChange({
    target: { files: file ? [file] : [], value: '' },
  });
const file = (data) => ({
  size: data.byteLength,
  arrayBuffer: async () => ab(data),
});
const settled = async () => {
  for (let i = 0; i < 100; i++) {
    await new Promise((r) => setTimeout(r, 5));
    tree = render();
    if (!attachment().props.disabled) return;
  }
  throw Error('Comparison load did not finish');
};
const initialDetails = all(tree).filter((n) => n.type === 'details');
const markup = require('react-dom/server').renderToStaticMarkup(
  React.createElement(api.LoadedStudy, { study, close() {} }),
);
check(markup.includes('Compare candidate'));
check(!/<details[^>]*\bopen\b/.test(markup));
check(initialDetails.every((n) => !n.props.open));
same(
  initialDetails.map((n) => text(n.props.children[0])),
  ['Image controls', 'Compare candidate', 'Mark corrections · 0'],
);
select('Click action').props.onChange({ target: { value: 'include' } });
tree = render();
const slice = () =>
  all(tree).find(
    (n) => typeof n.type === 'function' && n.type.name === 'SlicePane',
  );
slice().props.pick(first, true);
tree = render();
check(text(tree).includes('Mark corrections · 1'));
load(file(bytes));
await settled();
check(text(tree).includes('Unapproved comparison'));
check(!select('Click action').props.disabled);
check(text(tree).includes('Reviewing: Candidate'));
same(
  slice().props.comparison.map((l) => l.role),
  ['added', 'removed'],
);
slice().props.pick(first, true);
tree = render();
check(text(tree).includes('Mark corrections · 0')); // Switching version resets marking to navigation.
select('Click action').props.onChange({ target: { value: 'exclude' } });
tree = render();
slice().props.pick(first, true);
tree = render();
same(slice().props.marks.length, 1);
same(slice().props.marks[0].maskSha256, parsed.candidateMaskSha256);
check(text(tree).includes('Baseline: 1 marks · Candidate: 1 marks'));
// Actual local download callback: no network or persistence is substituted.
let downloaded, downloadName;
env.URL = {
  createObjectURL(blob) {
    downloaded = blob;
    return 'blob:synthetic-review';
  },
  revokeObjectURL() {},
};
env.document = {
  createElement() {
    return {
      click() {
        downloadName = this.download;
      },
    };
  },
};
button('Export review marks').props.onClick();
same(downloadName, 'visible-medicine-candidate-review.json');
same(JSON.parse(await downloaded.text()).schema, 'vm-local-candidate-review/1');
const candidateSlots = slots;
slots = [];
cursor = 0;
active = true;
const candidatePane = slice().type(slice().props);
active = false;
slots = candidateSlots;
const glyphs = all(candidatePane).filter(
  (n) => n.props?.className === 'local-review-point',
);
same(glyphs.length, 1);
same(glyphs[0].props['data-action'], 'exclude');
select('Click action').props.onChange({ target: { value: 'include' } });
tree = render();
slice().props.pick(first, true);
tree = render();
same(slice().props.marks.length, 2);
button('Undo mark').props.onClick();
tree = render();
same(slice().props.marks.length, 1);
button('Clear marks').props.onClick();
tree = render();
same(slice().props.marks.length, 1);
env.confirm = () => true;
button('Clear marks').props.onClick();
tree = render();
same(slice().props.marks.length, 0);
check(text(tree).includes('Baseline: 1 marks · Candidate: 0 marks'));
select('Click action').props.onChange({ target: { value: 'exclude' } });
tree = render();
slice().props.pick(first, true);
tree = render();
env.confirm = () => false;
const scene = all(tree).find(
  (n) => typeof n.type === 'function' && n.type.name === 'StudyScene',
);
same(
  scene.props.comparison.map((l) => l.role),
  ['added', 'removed'],
);
// Run the real scene and surface element constructors, without invoking a WebGL canvas.
const savedSlots = slots;
slots = [];
cursor = 0;
active = true;
const sceneTree = scene.type(scene.props);
const surfaces = all(sceneTree).filter(
  (n) => typeof n.type === 'function' && n.type.name === 'Surface',
);
check(surfaces.filter((n) => n.props.selected).length === 2);
const added = surfaces.find((n) => n.props.structure.role === 'added');
cursor = 0;
slots = [];
const mesh = added.type(added.props);
active = false;
slots = savedSlots;
mesh.props.onClick({ stopPropagation() {}, point: { toArray: () => last } });
tree = render();
same(slice().props.focus, last);
same(slice().props.selected.id, 'cth.target');
select('Comparison overlay').props.onChange({ target: { value: 'warnings' } });
tree = render();
same(
  slice().props.comparison.map((l) => l.role),
  ['warnings'],
);
select('Comparison overlay').props.onChange({ target: { value: 'baseline' } });
tree = render();
same(slice().props.comparison, null);
check(!select('Click action').props.disabled);
check(text(tree).includes('Reviewing: Baseline'));
same(slice().props.marks.length, 1);
same(slice().props.marks[0].maskSha256, parsed.baselineMaskSha256);
button('Export review marks').props.onClick();
same(downloadName, 'visible-medicine-local-review.json');
same(JSON.parse(await downloaded.text()).schema, 'vm-local-review/1');
button('Next changed slice').props.onClick();
tree = render();
same(select('Comparison overlay').props.value, 'changes');
button('Remove comparison').props.onClick();
tree = render();
check(slice().props.comparison); // Declining discard preserves candidate and marks.
same(slice().props.marks.length, 1);
load(file(bytes));
tree = render();
same(slice().props.marks.length, 1); // Replacement also requires explicit discard.
button('Close local study').props.onClick();
same(closed, 0);
env.confirm = () => true;
button('Remove comparison').props.onClick();
tree = render();
same(slice().props.comparison, null);
check(text(tree).includes('Mark corrections · 1'));
// Stale load, replacement, and unmount guards.
let finish;
load({
  size: bytes.length,
  arrayBuffer: () =>
    new Promise((r) => {
      finish = r;
    }),
});
tree = render();
check(attachment().props.disabled);
button('Cancel comparison load').props.onClick();
tree = render();
finish(ab(bytes));
await settled();
check(!text(tree).includes('Unapproved comparison'));
load(file(corrupt));
await settled();
check(text(tree).includes('Cannot verify'));
load({
  size: api.LOCAL_COMPARISON_MAX_BYTES + 1,
  arrayBuffer() {
    throw Error('Oversized file should not be read');
  },
});
tree = render();
check(text(tree).includes('64 MiB'));
load(file(bytes));
await settled();
const other = all(tree).find(
  (n) => n.props?.onClick && text(n).startsWith('Synthetic cth.accepted'),
);
other.props.onClick();
tree = render();
same(slice().props.comparison, null);
load(undefined);
tree = render();
check(text(tree).includes('Compare candidate · loaded')); // Cancelling the chooser preserves the attachment.
button('Remove comparison').props.onClick();
tree = render();
check(!text(tree).includes('Unapproved comparison'));
load({
  size: bytes.length,
  arrayBuffer: () =>
    new Promise((r) => {
      finish = r;
    }),
});
tree = render();
effects[0]()(); // Real comparison-generation cleanup on unmount.
finish(ab(bytes));
await new Promise((r) => setTimeout(r, 30));
tree = render();
check(!text(tree).includes('Unapproved comparison'));
same(hash(baselineBytes), baselineHash);
// Candidate-only feedback also guards study closure and page unload.
slots = [];
tree = render();
load(file(bytes));
await settled();
select('Click action').props.onChange({ target: { value: 'include' } });
tree = render();
slice().props.pick(first, true);
tree = render();
check(text(tree).includes('Baseline: 0 marks · Candidate: 1 marks'));
env.confirm = () => false;
button('Close local study').props.onClick();
same(closed, 0);
let unloadHandler, removedHandler;
env.addEventListener = (event, fn) => {
  if (event === 'beforeunload') unloadHandler = fn;
};
env.removeEventListener = (event, fn) => {
  if (event === 'beforeunload') removedHandler = fn;
};
const cleanup = effects[1]();
let prevented = false;
unloadHandler({
  preventDefault() {
    prevented = true;
  },
});
check(prevented);
cleanup();
check(removedHandler === unloadHandler);
env.confirm = () => true;
button('Close local study').props.onClick();
same(closed, 1);
console.log(
  JSON.stringify({
    schema: 'vm-local-comparison-viewer-validation/1',
    checks,
    syntheticOnly: true,
    browserOrGpuValidated: false,
    clinicalApprovalAdded: false,
  }),
);
