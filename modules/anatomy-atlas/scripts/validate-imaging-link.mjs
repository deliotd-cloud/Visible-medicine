import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/anatomy-coordinates'; export * from './lib/anatomy-link-registry'; export * from './lib/imaging-sync'; export { structures } from './app/anatomy-data';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const a = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);
const read = async (path) =>
  JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));
const catalog = await read('public/models/bodyparts3d/full-body/catalog.json');
const manifest = await read('public/models/bodyparts3d/manifest.json');
const body = a.bodyLinkEntries(catalog),
  shoulder = a.shoulderLinkEntries(manifest, a.structures);
const bodyIds = body.map((e) => e.id),
  shoulderIds = shoulder.map((e) => e.id);
let checks = 0;
const check = (value, message) => {
  checks++;
  assert.ok(value, message);
};
const same = (left, right, message) => {
  checks++;
  assert.deepEqual(left, right, message);
};
const throws = (fn, message) => {
  checks++;
  assert.throws(fn, undefined, message);
};
const near = (left, right, message, tolerance = 1e-5) =>
  left.forEach((v, k) =>
    check(
      Math.abs(v - right[k]) < tolerance,
      `${message}: axis ${k}, ${v} vs ${right[k]}`,
    ),
  );
same(
  body.length,
  823,
  'Every admitted body representation has a reference entry',
);
same(shoulder.length, 9, 'Every shoulder representation has a reference entry');
for (const [data, entries] of [
  [catalog, body],
  [manifest, shoulder],
]) {
  const transform = a.referenceTransform(data.coordinateSystem);
  for (const entry of entries) {
    same(entry.reference.frame, a.REFERENCE_FRAME);
    same(entry.reference.kind, 'surface-bounds-centre');
    near(
      transform.toReference(transform.toScene(entry.reference.point)),
      entry.reference.point,
      'Reference centre round trip',
    );
    check(
      entry.sources.length > 0 &&
        entry.sources.every(
          (s) => /^FJ\d+M?$/.test(s.file) && /^[a-f0-9]{64}$/.test(s.sha256),
        ),
      'Hash-backed sources',
    );
    check(
      !('frameOfReferenceUid' in entry.reference),
      'Reference anatomy never claims a patient frame',
    );
  }
  const bounds =
    data.structures?.map((s) => s.bounds) ?? data.parts.map((p) => p.bounds);
  for (const b of bounds)
    for (let corner = 0; corner < 8; corner++) {
      const p = [0, 1, 2].map((k) => ((corner >> k) & 1 ? b.max[k] : b.min[k]));
      near(
        transform.toScene(transform.toReference(p)),
        p,
        'All surface-bound corners round trip',
      );
    }
}
const identity = {
  unitsPerMillimetre: 1,
  sourceToSceneColumnMajor: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
};
const unit = a.referenceTransform(identity);
near(unit.toScene([1, 2, 3]), [1, 2, 3], 'Known identity transform');
const bt = a.referenceTransform(catalog.coordinateSystem);
near(bt.toScene([100, -50, 800]), [1, 0, 0], 'Reference +X is scene left');
near(
  bt.toScene([0, 50, 800]),
  [0, 0, -1],
  'Reference posterior is negative scene Z',
);
near(bt.toScene([0, -50, 900]), [0, 1, 0], 'Reference superior is scene up');
for (const invalid of [
  null,
  [],
  [0, 0],
  [0, 0, NaN],
  [0, 0, Infinity],
  ['1', 0, 0],
  [1e9, 0, 0],
]) {
  check(!a.finitePoint(invalid), 'Malformed point rejected');
  throws(() => unit.toReference(invalid));
}
for (const index of [0, 5, 10, 15]) {
  const broken = structuredClone(identity);
  broken.sourceToSceneColumnMajor[index] = 0;
  throws(
    () => a.referenceTransform(broken),
    'Singular/non-affine matrix rejected',
  );
}
for (const value of [0, -1, NaN, Infinity, 2])
  throws(() =>
    a.referenceTransform({ ...identity, unitsPerMillimetre: value }),
  );
const reflected = structuredClone(identity);
reflected.sourceToSceneColumnMajor[0] = -1;
throws(() => a.referenceTransform(reflected), 'Laterality reflection rejected');
const shear = structuredClone(identity);
shear.sourceToSceneColumnMajor[4] = 0.1;
throws(() => a.referenceTransform(shear), 'Shear rejected');
throws(
  () => a.bodyLinkEntries({ ...catalog, sourceVersion: '5.0' }),
  'Cannot silently reuse a changed reference frame',
);
throws(() =>
  a.shoulderLinkEntries({ ...manifest, version: '5.0' }, a.structures),
);
const hashSet = (entries) =>
  entries.flatMap((e) => e.sources.map((s) => s.file + ':' + s.sha256)).sort();
for (const entry of shoulder) {
  const resolved = a.resolveLinkedStructure(entry.id, body, bodyIds);
  same(
    hashSet(resolved.candidates),
    hashSet([entry]),
    'Cross-view mappings use identical OBJ source hashes',
  );
  // GLB positions are float32; separately scaled exports round differently. This is an export check, not clinical tolerance.
  if (resolved.status === 'selected')
    near(
      entry.reference.point,
      resolved.candidates[0].reference.point,
      'Same anatomical reference centre across independently scaled scenes',
      0.001,
    );
}
for (const entry of body) {
  const exact = a.resolveLinkedStructure(entry.id, body, bodyIds);
  same(exact.status, 'selected');
  same(exact.mapping, 'exact');
  same(exact.candidates[0].id, entry.id);
  same(a.resolveLinkedStructure(entry.id, body, []).status, 'out-of-scope');
  for (const region of catalog.regions) {
    const scope = catalog.structures
      .filter((s) => s.regions.includes(region.id))
      .map((s) => s.id);
    same(
      a.resolveLinkedStructure(entry.id, body, scope).status,
      scope.includes(entry.id) ? 'selected' : 'out-of-scope',
    );
  }
}
for (const relation of a.shoulderBodyRelations) {
  const forward = a.resolveLinkedStructure(relation.shoulder, body, bodyIds);
  same(
    forward.status,
    relation.kind === 'alias' ? 'selected' : 'choice-required',
  );
  for (const id of relation.body) {
    const reverse = a.resolveLinkedStructure(id, shoulder, shoulderIds);
    same(
      reverse.status,
      relation.kind === 'alias' ? 'selected' : 'choice-required',
    );
    same(reverse.mapping, relation.kind === 'alias' ? 'alias' : 'aggregate');
  }
}
const deltoid = a.shoulderBodyRelations[1];
same(
  a.resolveLinkedStructure(
    deltoid.shoulder,
    body,
    bodyIds.filter((id) => id !== deltoid.body[0]),
  ).status,
  'out-of-scope',
  'No partial-group substitution across scope',
);
same(
  a.resolveLinkedStructure(
    deltoid.shoulder,
    body.filter((e) => e.id !== deltoid.body[0]),
    bodyIds,
  ).status,
  'unknown-structure',
  'No incomplete-group substitution',
);
same(
  a.resolveLinkedStructure('vm:anatomy:unknown', body, bodyIds).status,
  'unknown-structure',
);
const request = (id = bodyIds[0], messageId = crypto.randomUUID()) => ({
  version: 1,
  origin: 'imaging',
  messageId,
  structureId: id,
});
for (const malformed of [
  null,
  [],
  {},
  'test',
  request(undefined, ''),
  { ...request(), version: 2 },
  { ...request(), version: '1' },
  { ...request(), origin: 'atlas' },
  request('FMA1'),
  request('vm:anatomy:' + 'a'.repeat(221)),
  { ...request(), normalizedSlice: 0.5 },
  { ...request(), referencePointLpsMm: [0, 0, 0] },
  { ...request(), frameOfReferenceUid: '1.2.3' },
  { ...request(), patientName: 'not allowed' },
]) {
  same(
    a.parseLinkedSelection(malformed),
    null,
    'Strict selection payload; no patient fields, slice guesses or coordinates',
  );
}
const bridge = a.createImagingBridge();
same(bridge.getAdapter(), null);
same(bridge.publish(body[0]), false);
let statusUpdates = 0;
const unsubscribe = bridge.subscribe(() => statusUpdates++);
const received = [],
  selected = [],
  resolutions = [];
const state = {
  enabled: false,
  disabled: false,
  entries: body,
  allowedIds: bodyIds,
  onSelect: (id) => {
    selected.push(id);
    same(
      bridge.publish(body[0]),
      false,
      'Incoming selection cannot echo out synchronously',
    );
  },
};
const adapter = bridge.registerAdapter({
  id: 'test-ct',
  label: 'Test only',
  modality: 'CT',
  onAtlasSelection: (event) => {
    received.push(event);
    same(
      adapter.selectStructure(event).status,
      'invalid',
      'Reject atlas-origin echo',
    );
    same(
      adapter.selectStructure(request(event.structureId, event.messageId))
        .status,
      'duplicate',
      'Same-ID echo blocked',
    );
    same(
      adapter.selectStructure(request()).status,
      'duplicate',
      'Synchronous new-ID echo blocked',
    );
    event.anatomy.name = 'mutated external copy';
  },
});
same(bridge.getAdapter().modality, 'CT');
same(adapter.selectStructure(request()).status, 'no-atlas');
const detach = bridge.attachAtlas(
  a.createAtlasReceiver(
    () => state,
    (r) => resolutions.push(r),
  ),
);
throws(
  () => bridge.attachAtlas(() => ({ status: 'selected' })),
  'Ambiguous second atlas rejected',
);
throws(() =>
  bridge.registerAdapter({
    id: 'test2',
    label: 'Second',
    modality: 'US',
    onAtlasSelection() {},
  }),
);
same(adapter.selectStructure(request()).status, 'paused');
same(selected.length, 0);
state.enabled = true;
state.disabled = true;
same(adapter.selectStructure(request()).status, 'paused');
same(selected.length, 0);
state.disabled = false;
const first = request();
same(adapter.selectStructure(first).status, 'selected');
same(selected.length, 1);
same(adapter.selectStructure(first).status, 'duplicate');
same(selected.length, 1);
same(
  adapter.selectStructure(request(deltoid.shoulder)).status,
  'choice-required',
);
same(selected.length, 1, 'Grouped request never auto-selects first component');
state.allowedIds = [];
same(adapter.selectStructure(request()).status, 'out-of-scope');
same(selected.length, 1);
state.allowedIds = bodyIds;
same(bridge.publish(body[0]), true);
same(received.length, 1);
check(
  body[0].name !== 'mutated external copy',
  'External listener cannot mutate catalogue',
);
same(
  adapter.selectStructure(
    request(received[0].structureId, received[0].messageId),
  ).status,
  'duplicate',
  'Asynchronous same-ID echo blocked',
);
same(
  adapter.selectStructure(
    Object.defineProperty(request(), 'version', {
      get() {
        throw Error('bad getter');
      },
    }),
  ).status,
  'invalid',
  'Malformed object cannot break viewer',
);
for (let i = 0; i < 300; i++)
  same(
    adapter.selectStructure(request(bodyIds[0], 'bounded-' + i)).status,
    'selected',
    'Bounded replay cache continues to accept new user events',
  );
detach();
same(adapter.selectStructure(request()).status, 'no-atlas');
adapter.dispose();
same(bridge.getAdapter(), null);
same(adapter.selectStructure(request()).status, 'disconnected');
same(bridge.publish(body[0]), false);
same(statusUpdates, 2);
unsubscribe();
for (const invalid of [
  { id: '', label: 'a', modality: 'CT' },
  { id: 'ok', label: '', modality: 'CT' },
  { id: 'ok', label: 'a', modality: 'PET' },
  { id: 'ok', label: 'a', modality: 'CT', onAtlasSelection: 3 },
])
  throws(() => bridge.registerAdapter(invalid));
bridge.registerAdapter({
  id: 'broken',
  label: 'Broken',
  modality: 'MRI',
  onAtlasSelection() {
    throw Error('adapter failure');
  },
});
same(bridge.publish(body[0]), false);
same(bridge.getAdapter(), null, 'Broken synchronous adapter disconnects');
bridge.registerAdapter({
  id: 'async',
  label: 'Async',
  modality: 'US',
  async onAtlasSelection() {
    throw Error('async failure');
  },
});
same(bridge.publish(body[0]), true);
await new Promise((resolve) => setTimeout(resolve, 0));
same(
  bridge.getAdapter(),
  null,
  'Broken asynchronous adapter disconnects without an unhandled rejection',
);
let rejectOld;
const old = bridge.registerAdapter({
  id: 'old',
  label: 'Old',
  modality: 'CT',
  onAtlasSelection() {
    return new Promise((_, reject) => {
      rejectOld = reject;
    });
  },
});
bridge.publish(body[0]);
old.dispose();
const replacement = bridge.registerAdapter({
  id: 'replacement',
  label: 'Replacement',
  modality: 'MRI',
  onAtlasSelection() {},
});
rejectOld(Error('late rejection'));
await new Promise((resolve) => setTimeout(resolve, 0));
same(
  bridge.getAdapter().id,
  'replacement',
  'Late failures do not disconnect replacement adapters',
);
replacement.dispose();
same(statusUpdates, 2, 'Unsubscribed listeners are not notified');
console.log(
  `Imaging-link validation: ${checks.toLocaleString()} assertions passed; ${body.length} body and ${shoulder.length} shoulder reference identities. No acquired scans or patient registration tested.`,
);
