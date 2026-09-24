import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { build } from 'esbuild';
import { Box3, Matrix4, Vector3 } from 'three';
import { archiveReader, parallelMap } from './bodyparts-archive.mjs';
import { loadCurrentSourceHolds, composeSourceHoldPolicy } from './current-source-holds.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import {
  sourceObjShape,
  mergeSourceShapes,
  sourceBoundsNear,
  sourceTriangleSet,
} from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import {
  spatialDistanceIndex,
  uniqueSourceVertices,
  distanceSummary,
} from './source-spatial-math.mjs';
import {
  shapeCandidate,
  compareTranslatedShape,
} from './vessel-shape-math.mjs';

// A bounded proposal, not permission to admit source anatomy into the viewer.
const proposed = [['FMA43908', 'FJ2066'], ['FMA43907', 'FJ2131']];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const loaded = await loadCurrentSourceHolds();
// Replay the pre-disposition audit, never the export admission gate. The new
// identity/extent hold is derived from this evidence, not retroactively part of it.
// Other policy changes must fail the pinned baseline rather than being ignored.
const dispositionPath = 'docs/tibial-recurrent-source-disposition.json';
const baselineSupplemental = loaded.supplemental.filter(s => s.evidence !== dispositionPath);
const supplementalEvidence = loaded.supplementalEvidence.filter(s => s.path !== dispositionPath);
assert.deepEqual(supplementalEvidence.map(s => s.path), [
  'docs/limbic-landmark-source-audit.json', 'docs/pelvic-vein-source-audit.json',
  'docs/collicular-brachia-source-audit.json', 'docs/deep-leg-vein-source-audit.json',
]);
const policy = composeSourceHoldPolicy((await loadSourceHolds()).policy, loaded.records, baselineSupplemental);
const {
  catalog: raw,
  records,
  inventory,
  evidence,
} = loaded;
const compiled = await build({
  stdin: {
    contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog'",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const { bodyDisplayCatalog } = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const full = bodyDisplayCatalog(raw);
assert.equal(full.structures.length, 1104, 'Historical audit requires its exact source baseline');
// Preserve the audited baseline after any subsequent reviewed admission.
const catalog = {
  ...full,
  structures: full.structures.filter((s) => s.bundle !== 'tibial-recurrent-arteries'),
  bundles: full.bundles.filter((b) => b.id !== 'tibial-recurrent-arteries'),
};
const definitions = proposed.map(([id, file]) => {
  const d = records.find((r) => r.tree === 'isa' && r.id === id);
  assert(d, `Missing definition ${id}`);
  assert.deepEqual(d.files, [file], `Changed complete concept ${id}`);
  return d;
});
policy.assertNoKnownHolds(definitions);
if (process.argv.includes('--fetch')) {
  const reader = await archiveReader('isa');
  await parallelMap(proposed, 4, async ([, file]) => {
    const pin = inventory.assets.find(
      (a) => a.tree === 'isa' && a.file === file,
    );
    const entry = reader.entries.get(file + '.obj');
    assert.equal(entry.unpacked, pin.bytes);
    assert.equal(entry.crc, pin.crc32);
    await reader.get(file);
  });
}
const shapeCache = new Map();
async function shape(tree, file, sha) {
  const key = `${tree}/${file}`;
  if (!shapeCache.has(key)) {
    const bytes = await readFile(`../work/bodyparts3d/${key}.obj`);
    const pin = inventory.assets.find(
      (a) => a.tree === tree && a.file === file,
    );
    assert(pin?.available);
    assert.equal(bytes.length, pin.bytes);
    assert.equal(crc32(bytes), pin.crc32);
    shapeCache.set(key, { bytes, shape: sourceObjShape(bytes) });
  }
  const cached = shapeCache.get(key);
  if (sha) assert.equal(hash(cached.bytes), sha);
  return cached;
}
const groups = [];
for (const definition of definitions) {
  const file = definition.files[0],
    { bytes, shape: geometry } = await shape('isa', file);
  const side = definition.name.includes('right') ? 'right' : 'left';
  assert(definition.name.includes(side));
  const fingerprint = geometryFingerprint(bytes);
  groups.push({
    id: definition.id,
    name: definition.name,
    side,
    file,
    sha256: hash(bytes),
    bytes: bytes.length,
    crc32: crc32(bytes),
    geometrySha256: fingerprint,
    definition,
    partOfDefinition:
      records.find((r) => r.tree === 'partof' && r.id === definition.id) ??
      null,
    topology: sourceTopology(geometry),
    sourceBounds: { min: geometry.min, max: geometry.max },
    lateralityConsistent: geometry.vertices.every((p) =>
      side === 'right' ? p[0] < 0 : p[0] > 0,
    ),
    directOwners: catalog.structures
      .filter(
        (s) => s.sourceTree === 'isa' && s.sources.some((f) => f.file === file),
      )
      .map((s) => s.id),
    exactInventoryMatches: inventory.assets.filter(
      (a) => a.geometrySha256 === fingerprint && a.representedBy.length,
    ),
    holdScreen: policy.inspect(definition),
    admissionApproved: false,
  });
}
const inverse = new Matrix4()
  .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const samples = (s) => {
  const v = uniqueSourceVertices(s),
    stride = Math.max(1, Math.ceil(v.length / 128));
  return v.filter((_, i) => i % stride === 0);
};
const screened = [],
  comparisons = [];
// Screen every current held component across both source trees, not only aliases.
const heldKeys = new Map();
for (const definition of records.filter(r=>r.files.length)) {
  for (const component of policy.inspect(definition).components) {
    const key=definition.tree+'/'+component.file;
    if(!heldKeys.has(key))heldKeys.set(key,{tree:definition.tree,file:component.file,heldBy:new Set()});
    for(const id of component.heldBy)heldKeys.get(key).heldBy.add(id);
  }
}
const heldTargets=[];
for(const held of heldKeys.values()){
  const {bytes,shape:s}=await shape(held.tree,held.file);
  heldTargets.push({id:'held:'+held.tree+'/'+held.file,fmaId:'held:'+held.tree+'/'+held.file,
    system:'vessels',sourceTree:held.tree,sources:[{file:held.file,sha256:hash(bytes)}],
    targetKind:'held',heldBy:[...held.heldBy].sort(),group:{sourceBounds:{min:s.min,max:s.max}}});
}
const targets = [
  ...heldTargets,
  ...catalog.structures.map((s) => ({ ...s, targetKind: 'existing' })),
  ...groups.map((g) => ({
    id: g.id,
    fmaId: g.id,
    system: 'vessels',
    sourceTree: 'isa',
    sources: [{ file: g.file, sha256: g.sha256 }],
    targetKind: 'proposal',
    group: g,
  })),
];
for (const owner of targets) {
  const bounds =
    owner.targetKind !== 'existing'
      ? owner.group.sourceBounds
      : (() => {
          const box = new Box3(
            new Vector3(...owner.bounds.min),
            new Vector3(...owner.bounds.max),
          ).applyMatrix4(inverse);
          return {
            min: box.min.toArray(),
            max: box.max.toArray(),
            extent: box.getSize(new Vector3()).toArray(),
          };
        })();
  const candidates = groups.filter(
    (g) =>
      g.id !== owner.fmaId &&
      (sourceBoundsNear(
        { min: g.sourceBounds.min, max: g.sourceBounds.max },
        bounds,
        1.01,
      ) ||
        (owner.system === 'vessels' &&
          shapeCandidate(
            {
              ...g.sourceBounds,
              extent: g.sourceBounds.max.map(
                (n, i) => n - g.sourceBounds.min[i],
              ),
            },
            { ...bounds, extent: bounds.max.map((n, i) => n - bounds.min[i]) },
          ))),
  );
  screened.push({
    id: owner.id,
    targetKind: owner.targetKind,
    recordSha256: hash(JSON.stringify(owner)),
    candidateIds: candidates.map((g) => g.id),
  });
  if (!candidates.length) continue;
  const reference = mergeSourceShapes(
    await Promise.all(
      owner.sources.map(
        async (f) => (await shape(owner.sourceTree, f.file, f.sha256)).shape,
      ),
    ),
  );
  const nearestReference = spatialDistanceIndex(reference),
    triangles = sourceTriangleSet(reference);
  for (const g of candidates) {
    const candidate = (await shape('isa', g.file, g.sha256)).shape;
    comparisons.push({
      candidate: g.id,
      reference: owner.id,
      referenceFma: owner.fmaId,
      targetKind: owner.targetKind,
      exactSharedTriangles: [...sourceTriangleSet(candidate)].filter((t) =>
        triangles.has(t),
      ).length,
      candidateToReference: distanceSummary(
        samples(candidate),
        nearestReference,
      ),
      referenceToCandidate: distanceSummary(
        samples(reference),
        spatialDistanceIndex(candidate),
      ),
      translatedDiagnostic:
        owner.system === 'vessels' && shapeCandidate(candidate, reference)
          ? compareTranslatedShape(candidate, reference)
          : null,
    });
  }
}
const result = {
  schemaVersion: 1,
  baselineSourceCommit: 'b2cc6a7e20241d41d5a0748ea26de78c98ee8728',
  sourceArchive:
    'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',
  license: catalog.license,
  credit: catalog.credit,
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  evidence,
  supplementalEvidence,
  groups,
  heldComponentCount: heldTargets.length,
  screened,
  comparisons,
  geometryModified: false,
  admissionApproved: false,
  clinicalApproval: false,
  limitations: [
    'Complete IS-A membership, archive CRC/size, topology, laterality, direct ownership, exact triangles and bounded unsigned distances are diagnostic evidence, not clinical approval.',
    'Neither topology nor sampled proximity proves freedom from self-intersection, donor-specific vessel identity, anastomosis, continuous lumen, perfusion territory or a surgical plane.',
    'All current held-component envelopes and vessel-shape alternatives are screened across both trees; bounded comparisons are not a proof of clinical identity.',
    'No repair, bridging, fitting, source mirroring, face removal or runtime anatomy admission is performed by this audit. Nearby surfaces and isolated fragments require a separate disposition.',
  ],
};
const text = JSON.stringify(result, null, 2) + '\n',
  output = 'docs/tibial-recurrent-source-audit.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(output, 'utf8')).replace(/\r\n/g, '\n'), text);
else await writeFile(output, text, { flag: 'wx' });
console.log(
  JSON.stringify({
    auditSha256: hash(text),
    baselineSelections: catalog.structures.length,
    comparisons: comparisons.length,
    groups: groups.map((g) => ({
      id: g.id,
      file: g.file,
      name: g.name,
      closed: g.topology.closedOrientedManifold,
      components: g.topology.components.map((c) => c.triangles),
      side: g.lateralityConsistent,
      owners: g.directOwners.length,
      exactMatches: g.exactInventoryMatches.length,
    })),
    flags: comparisons.filter(
      (c) => c.exactSharedTriangles || c.translatedDiagnostic?.similar,
    ),
  }),
);
