// Reproduce the ANAT-03 source-only candidate index. No geometry is altered.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { targets } from '../20261022-lower-limb-nerve-inventory/target-plan.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const sourceDir = join(here, '../20261019-open3dmodel-lower-limb-source');
const sha256 = b => createHash('sha256').update(b).digest('hex');
const source = JSON.parse(readFileSync(join(sourceDir, 'inventory.json')));
if (sha256(readFileSync(join(sourceDir, 'inventory.json'))) !== 'be9db6387b1d8b570db26e02a69b6e7153d50bb26ff178f6e8b2f5c27f78067f') throw Error('Prior original inventory changed');
const glbPath = join(here, 'leg-nerves.glb');
const bytes = readFileSync(glbPath);
const expected = '105d6806a75d8dc7ed60ad9e70d9b8e8202fd6d55e7cad7ff12fc4fd9aad26d8';
if (sha256(bytes) !== expected) throw Error('Original GLB digest changed');
if (bytes.toString('utf8', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw Error('Invalid GLB header');
const jsonLength = bytes.readUInt32LE(12);
if (bytes.toString('utf8', 16, 20) !== 'JSON') throw Error('Missing GLB JSON chunk');
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
if (gltf.nodes.length !== 27 || gltf.meshes.length !== 26 || gltf.scenes[0].nodes.join(',') !== '26') throw Error('GLB scene structure changed');
const root = gltf.nodes[26];
const byName = new Map(gltf.nodes.slice(0, 26).map((node, index) => [node.name, { index, node }]));
const rightName = {
  femoral: ['Femoral_nerve.r'],
  obturator: ['Obturator_nerve.r'],
  sciatic: ['Sciatic_nerve.r'],
  'common-fibular': ['Common_fibular_nerve.r'],
  'superficial-fibular': ['Superficial_fibular_nerve.r'],
  'deep-fibular': ['Deep_fibular_nerve.r'],
  tibial: ['Tibial_nerve.r'],
  saphenous: ['Saphenous_nerve_(Medial_crural_cutaneous_branches).r', 'Saphenous_branch_of_Femoralis_nerve.r'],
  sural: ['Sural_nerve.r'],
  'medial-plantar': ['Medial_plantar_nerve.r'],
  'lateral-plantar': ['Lateral_plantar_nerve.r'],
  'lateral-femoral-cutaneous': ['Lateral_femoral_cuteneous_nerve.r'],
  'posterior-femoral-cutaneous': ['Posterior_cutaneous_nerve_of_the_thigh.r'],
};
const leftName = {
  femoral: ['Left femoral nerve L2-L4'],
  sciatic: ['Left sciatic nerve L4-S3'],
  'common-fibular': ['Left common fibular nerve'],
  'superficial-fibular': ['Left superficial fibular lateral calf nerve', 'Left superficial fibular dorsal branch 3', 'Left superficial fibular dorsal branch 4', 'Left superficial fibular dorsal branch 5'],
  'deep-fibular': ['Left deep fibular anterior calf nerve', 'Left deep fibular first web branch'],
  tibial: ['Left tibial nerve'],
  saphenous: ['Left saphenous sensory branch'],
};
const sourceObjects = new Map(source.neuralNameCandidates.map(o => [o.name, o]));
function glbComponent(name) {
  const hit = byName.get(name);
  if (!hit) throw Error(`GLB node missing: ${name}`);
  const mesh = gltf.meshes[hit.node.mesh];
  if (mesh.name !== name || mesh.primitives.length !== 1) throw Error(`Mesh identity mismatch: ${name}`);
  const primitive = mesh.primitives[0];
  const accessor = gltf.accessors[primitive.attributes.POSITION];
  if (gltf.accessors[primitive.indices].count % 3 || accessor.type !== 'VEC3' || !accessor.min?.every(Number.isFinite) || !accessor.max?.every(Number.isFinite)) throw Error(`Non-triangle or non-finite accessor: ${name}`);
  return { nodeIndex: hit.index, meshIndex: hit.node.mesh, sourceLabel: name,
    vertexCount: accessor.count, faceCount: gltf.accessors[primitive.indices].count / 3,
    localBounds: { min: accessor.min, max: accessor.max } };
}
const major = targets.filter(t => t.batch === 1);
if (major.length !== 13) throw Error('Target plan changed');
const rows = major.map(t => {
  const key = t.key.slice('lln-target:'.length);
  const sourceNames = rightName[key];
  if (!sourceNames) throw Error(`No prior-source mapping: ${key}`);
  const heldRight = sourceNames.map(name => {
    const o = sourceObjects.get(name);
    if (!o) throw Error(`Prior source object missing: ${name}`);
    return { sourceLabel: name, vertices: o.vertices, faces: o.faces };
  });
  const acquiredLeft = (leftName[key] ?? []).map(glbComponent);
  return { key: t.key, targetName: t.name, currentAtlas: 'absent-in-pinned-inventory',
    acquiredOriginal: acquiredLeft.length ? { side: 'left', components: acquiredLeft,
      status: 'source-acquired-not-admitted', componentIdentity: 'source GLB node and mesh names only; anatomical extent unreviewed' } : null,
    heldOriginal: { side: 'right', source: 'Open3DModel July2025-labeled OBJ archive acquired 2026-10-19',
      status: 'held-license-scope-and-spatial-review', components: heldRight },
    outstanding: acquiredLeft.length ? 'Verify topology, landmarks, continuity, orientation and clinical identity; retain left source frame.' : 'No CC0 component with this exact major name in the acquired GLB; seek a compatible original.' };
});
const out = {
  schema: 'visible-medicine.anat-03-source-acquisition/1',
  acquisitionDate: '2026-10-26',
  atlasSource: { path: 'F:/VisibleMedicine/staging/20261025-regional-title-native/atlas', head: 'a01ea4a00740dee0905204a33893761b8ae1ff1e', receiptSha256: '05215efe28eba7f4381fd87daf9212604a123fa1b2b0b810658232743573c1d6' },
  priorAbsenceEvidence: { path: 'F:/VisibleMedicine/recovery/checkpoints/20261022-lower-limb-nerve-coverage/checkpoint.json', sourceHead: '2381efe43b75f8a7fb768a069eecd7268c508dac', targetPlanSha256: '64318525c66efc50a038e443d259632e00f69e0f7b212d5088a3413f6ab71ffd', lowerLimbNervousRoots: 0, nestedPlacements: 0 },
  acquiredOriginal: { path: glbPath.replaceAll('\\', '/'), url: 'https://www.innerscene.com/api/library/leg-nerves-60edf433/download',
    page: 'https://www.innerscene.com/tools/library/3d-parts/leg-nerves-60edf433',
    terms: 'https://www.innerscene.com/tools/library/terms', license: 'CC0 1.0 per exact part page and library terms',
    publisherAuthorshipClaim: 'Innerscene - original model; independently unverified',
    publisherMetadataFileHashMatches: true, upstreamDerivationIndependentlyExcluded: false,
    rightsStatus: 'Part-specific publisher CC0 claim supports commercial reuse if original authorship claim is sound; no independent exclusion of upstream BY/SA geometry.',
    bytes: bytes.length, sha256: sha256(bytes),
    format: 'glTF 2.0 binary GLB', generator: gltf.asset.generator, nodeCount: gltf.nodes.length, meshCount: gltf.meshes.length,
    embeddedProvenance: 'No creator, source URL, copyright, asset extras, or upstream references in GLB JSON; only Blender exporter generator.',
    sourceFrame: { pageUnits: 'metres at real-world scale (publisher claim)', gltfCoordinateConvention: 'Y-up by glTF 2.0 default; no asset-level anatomical axis declaration', rootTranslation: root.translation, dimensionsPageMetres: [0.251, 0.236, 1.058], atlasRegistration: null },
    clinicalApproval: false, atlasAdmission: false },
  heldOriginal: { path: join(sourceDir, 'lower-limb.obj').replaceAll('\\', '/'), priorInventorySha256: 'be9db6387b1d8b570db26e02a69b6e7153d50bb26ff178f6e8b2f5c27f78067f', sha256: source.obj.sha256,
    archiveSha256: source.archive.sha256, license: 'CC BY-SA 4.0 on publisher lower-limb OBJ page', reason: 'Main to review exact source lineage and ShareAlike scope before any import; independent right-side source and frame.' },
  majorTargetCount: major.length, acquiredNamedTargetCount: rows.filter(r => r.acquiredOriginal).length,
  rows,
  limits: ['Source node labels are not clinical identification or complete nerve boundaries.', 'No geometric repair, mirroring, alignment or patient-space registration.', 'No Atlas catalogue or learner asset changed.']
};
writeFileSync(join(here, 'candidate-index.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ majorTargets: out.majorTargetCount, acquiredNamedTargets: out.acquiredNamedTargetCount, glbSha256: out.acquiredOriginal.sha256 }));
