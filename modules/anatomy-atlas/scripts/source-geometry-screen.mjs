import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

export const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');
export const sourceKey = ({ tree, file }) => `${tree}/${file}`;
export const candidateDefinitions = [
  {
    tree: 'isa',
    id: 'FMA7041',
    name: 'short ciliary nerve',
    files: ['FJ1319', 'FJ1370'],
  },
  {
    tree: 'isa',
    id: 'FMA50146',
    name: 'branch of right anterior choroidal artery to posterior limb of right internal capsule',
    files: ['FJ1674'],
  },
  {
    tree: 'isa',
    id: 'FMA50147',
    name: 'branch of left anterior choroidal artery to posterior limb of left internal capsule',
    files: ['FJ1674M'],
  },
];

export function screenTargets(context) {
  const { records, policy, inventory } = context;
  const heldBy = new Map();
  for (const definition of records.filter((r) => r.files.length)) {
    for (const component of policy.inspect(definition).components) {
      const key = sourceKey({ tree: definition.tree, file: component.file });
      if (!heldBy.has(key)) heldBy.set(key, new Set());
      for (const id of component.heldBy) heldBy.get(key).add(id);
    }
  }
  for (const candidate of candidateDefinitions) {
    const definition = records.find(
      (r) => r.tree === candidate.tree && r.id === candidate.id,
    );
    assert(definition, 'Missing candidate definition');
    assert.equal(definition.name, candidate.name);
    assert.deepEqual(
      definition.files,
      candidate.files,
      'Do not split a source definition',
    );
    assert.equal(
      inventory.records.find(
        (r) => r.tree === candidate.tree && r.id === candidate.id,
      )?.status,
      'unused-available',
    );
    policy.assertNoKnownHolds([candidate]);
  }
  const candidateKeys = new Set(
    candidateDefinitions.flatMap((c) =>
      c.files.map((file) => sourceKey({ tree: c.tree, file })),
    ),
  );
  const allKeys = new Set([...heldBy.keys(), ...candidateKeys]);
  const targets = inventory.assets
    .filter((a) => allKeys.has(sourceKey(a)))
    .map((a) => ({
      tree: a.tree,
      file: a.file,
      bytes: a.bytes,
      crc32: a.crc32,
      heldBy: [...(heldBy.get(sourceKey(a)) ?? [])].sort(),
      candidateFor: candidateDefinitions
        .filter((c) => c.tree === a.tree && c.files.includes(a.file))
        .map((c) => c.id),
    }));
  assert.equal(
    targets.length,
    allKeys.size,
    'Every held/candidate file needs archive evidence',
  );
  assert.equal(new Set(targets.map(sourceKey)).size, targets.length);
  return targets;
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++)
      value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  }
  return (value ^ 0xffffffff) >>> 0;
}

export function inspectSourceBytes(target, bytes, inventory) {
  assert.equal(
    bytes.length,
    target.bytes,
    'Source size differs from pinned inventory',
  );
  assert.equal(
    crc32(bytes),
    target.crc32,
    'Source CRC differs from pinned inventory',
  );
  const rawHash = sha256(bytes),
    fingerprint = geometryFingerprint(bytes);
  const recorded = inventory.assets.find(
    (a) => sourceKey(a) === sourceKey(target),
  );
  assert(recorded, 'Unknown asset');
  if (recorded.sha256)
    assert.equal(rawHash, recorded.sha256, 'Source hash changed');
  if (recorded.geometrySha256)
    assert.equal(fingerprint, recorded.geometrySha256, 'Geometry hash changed');
  const shape = sourceObjShape(bytes);
  return {
    ...target,
    sha256: rawHash,
    geometrySha256: fingerprint,
    bounds: { min: shape.min, max: shape.max },
    centre: shape.centre,
    extent: shape.extent,
    sourceXDistribution: {
      negative: shape.vertices.filter((v) => v[0] < 0).length,
      zero: shape.vertices.filter((v) => v[0] === 0).length,
      positive: shape.vertices.filter((v) => v[0] > 0).length,
    },
    // Full topology is bounded to the four new candidates. Held files are not repaired.
    topology: target.candidateFor.length ? sourceTopology(shape) : null,
    vertices: shape.vertices.length,
    triangles: shape.faces.length,
    degenerateTriangles: shape.triangles.filter((t) => t.degenerate).length,
  };
}

export function buildGeometryScreen(context, targets, files) {
  const { inventory, catalog, records, evidence } = context;
  assert.deepEqual(
    files.map(sourceKey),
    targets.map(sourceKey),
    'Missing/reordered file evidence',
  );
  for (let i = 0; i < targets.length; i++) {
    for (const field of [
      'tree',
      'file',
      'bytes',
      'crc32',
      'heldBy',
      'candidateFor',
    ])
      assert.deepEqual(files[i][field], targets[i][field]);
    for (const field of ['sha256', 'geometrySha256'])
      assert.match(files[i][field], /^[a-f0-9]{64}$/);
  }
  const displayed = new Map();
  for (const structure of catalog.structures) {
    for (const source of structure.sources) {
      const key = sourceKey({ tree: structure.sourceTree, file: source.file });
      if (!displayed.has(key)) displayed.set(key, []);
      displayed.get(key).push(structure.id);
    }
  }
  const fingerprints = new Map(
    inventory.assets
      .filter((a) => a.geometrySha256)
      .map((a) => [sourceKey(a), { ...a, heldBy: [] }]),
  );
  for (const file of files) fingerprints.set(sourceKey(file), file);
  const unknownDisplayed = [...displayed.keys()].filter(
    (key) => !fingerprints.has(key),
  );
  assert.deepEqual(
    unknownDisplayed,
    [],
    'Displayed source fingerprint coverage is incomplete',
  );
  const evaluated = files.map((file) => ({
    ...file,
    sameTreeAliases: records
      .filter((r) => r.tree === file.tree && r.files.includes(file.file))
      .map((r) => ({
        id: r.id,
        name: r.name,
        componentCount: r.files.length,
      })),
    exactGeometryMatches: [...fingerprints.values()]
      .filter(
        (other) =>
          sourceKey(other) !== sourceKey(file) &&
          other.geometrySha256 === file.geometrySha256,
      )
      .map((other) => ({
        tree: other.tree,
        file: other.file,
        heldBy: other.heldBy,
        displayedBy: displayed.get(sourceKey(other)) ?? [],
      })),
    displayedBy: displayed.get(sourceKey(file)) ?? [],
    admitted: false,
  }));
  const candidates = candidateDefinitions.map((definition) => {
    const components = evaluated.filter((f) =>
      f.candidateFor.includes(definition.id),
    );
    assert.deepEqual(
      components.map((f) => f.file),
      definition.files,
    );
    const conflict = components.some(
      (f) =>
        f.heldBy.length ||
        f.displayedBy.length ||
        f.exactGeometryMatches.some(
          (m) => m.heldBy.length || m.displayedBy.length,
        ),
    );
    return {
      ...definition,
      decision: conflict
        ? 'exact-held-or-displayed-match-requires-adjudication'
        : 'adjacency-endpoints-and-anatomical-extent-review-required',
      admissionApproved: false,
    };
  });
  const held = evaluated.filter((f) => f.heldBy.length);
  return {
    schemaVersion: 1,
    evidence,
    license: inventory.license,
    credit: inventory.credit,
    licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
    releaseNotesUrl:
      'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/release_4.0_e.html',
    archives: inventory.archives,
    summary: {
      evaluatedFiles: evaluated.length,
      verifiedSourceBytes: evaluated.reduce((n, f) => n + f.bytes, 0),
      heldFiles: held.length,
      previouslyUnfingerprintedHeldFiles: held.filter(
        (f) =>
          !inventory.assets.find((a) => sourceKey(a) === sourceKey(f))
            .geometrySha256,
      ).length,
      candidateDefinitions: candidates.length,
      candidateFiles: evaluated.filter((f) => f.candidateFor.length).length,
      displayedSourceFilesScreened: displayed.size,
      indexedFingerprintsScreened: fingerprints.size,
      candidateFilesWithExactHeldOrDisplayedMatch: evaluated.filter(
        (f) =>
          f.candidateFor.length &&
          f.exactGeometryMatches.some(
            (m) => m.heldBy.length || m.displayedBy.length,
          ),
      ).length,
      heldFilesWithExactDisplayedMatch: held.filter((f) =>
        f.exactGeometryMatches.some((m) => m.displayedBy.length),
      ).length,
      admissions: 0,
    },
    candidates,
    files: evaluated,
    clinicalValidation: false,
    admissionsChanged: false,
    limitations: [
      'A separate preparatory screen: does not modify the historical inventory, catalogue, importer policy or displayed anatomy.',
      'Exact geometry hashes retain vertex/face order, coordinates and winding; they do not detect reindexed, reversed, translated, mirrored or near-coincident surfaces.',
      'All current displayed source files have indexed fingerprints; non-displayed archive files without fingerprints remain unknown, except the 48 held and four candidate files checked here.',
      'Topology is measured only for the four candidates; manifold topology is not a self-intersection proof or anatomical validation.',
      'Positive source X is the source left-side convention, not an independently validated anatomical label. The short ciliary source remains one paired, unsided definition; no sided identity is invented.',
      'No attachment, ganglion-to-globe continuity, vascular territory, branch completeness, patient registration or clinical accuracy has been validated.',
      'Existing central-canal and whole-spinal-cord identities must remain distinct despite any source geometry match. A finding does not authorize deletion, relabelling, repair or admission.',
    ],
  };
}
