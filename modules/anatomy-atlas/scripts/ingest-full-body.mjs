import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import {
  mergeVertices,
  mergeGeometries,
} from 'three/addons/utils/BufferGeometryUtils.js';
import {
  archiveReader,
  conceptMap,
  parallelMap,
  sourceTable,
} from './bodyparts-archive.mjs';
import { recoverySelections } from './anatomy-recovery.mjs';
import { gapSelections } from './gap-recovery.mjs';
import { inventorySelections } from './inventory-selections.mjs';
import { neuroSelections } from './neuro-selections.mjs';
import { axialSelections } from './axial-selections.mjs';
import { headDetailSelections } from './head-detail-selections.mjs';
import { junctionSelections } from './junction-selection.mjs';
import { mesentericSelections } from './mesenteric-selections.mjs';
import { pancreaticSelections } from './pancreatic-selections.mjs';
import { thoracicSelections } from './thoracic-selections.mjs';
import { handVascularSelections } from './hand-vascular-selections.mjs';
import { handVenousSelections } from './hand-venous-selections.mjs';
import { footVascularSelections } from './foot-vascular-selections.mjs';
import { ocularSelections } from './ocular-selections.mjs';

const [isa, partof, isaZip, partofZip] = await Promise.all([
  conceptMap('isa'),
  conceptMap('partof'),
  archiveReader('isa'),
  archiveReader('partof'),
]);
const out = path.resolve('public/models/bodyparts3d/full-body');
await fs.mkdir(out, { recursive: true });
const selections = [];
const previous = JSON.parse(
  await fs.readFile(path.join(out, 'catalog.json'), 'utf8').catch(() => '{}'),
);
function addAtomic(root, system) {
  const used = new Set(),
    allowed = new Set(isa.get(root).files);
  for (const file of isa.get(root).files) {
    if (used.has(file)) continue;
    const candidates = [...isa.values()].filter(
      (r) =>
        r.files.includes(file) &&
        r.files.every((f) => allowed.has(f) && !used.has(f)),
    );
    candidates.sort(
      (a, b) =>
        a.files.length - b.files.length ||
        Number(/^(right|left) /.test(b.name)) -
          Number(/^(right|left) /.test(a.name)) ||
        b.name.length - a.name.length,
    );
    const record = candidates[0];
    if (!record) throw new Error(`No atomic identity for ${file}`);
    record.files.forEach((f) => used.add(f));
    selections.push({
      fma: record.id,
      name: record.name,
      system,
      tree: 'isa',
      files: record.files,
    });
  }
}
addAtomic('FMA5018', 'skeleton');
addAtomic('FMA5022', 'muscles');
addAtomic('FMA65132', 'nerves');
// IS-A muscle roots omit named heads/parts. Include these explicit source concepts,
// never infer a whole muscle from a partial surface or invent absent tissue.
const dissectionParts = {
  'shoulder-arm': [
    'FMA34680',
    'FMA34681',
    'FMA34682',
    'FMA34683',
    'FMA34684',
    'FMA34685',
    'FMA37684',
    'FMA37685',
    'FMA37686',
    'FMA37687',
    'FMA37695',
    'FMA37696',
    'FMA37697',
    'FMA37698',
    'FMA37699',
    'FMA37700',
  ],
  spine: [
    'FMA33581',
    'FMA33583',
    'FMA33584',
    'FMA33585',
    'FMA33586',
    'FMA33587',
  ],
  forearm: [
    'FMA38560',
    'FMA38561',
    'FMA38562',
    'FMA38563',
    'FMA38617',
    'FMA38618',
    'FMA38619',
    'FMA38620',
  ],
  thigh: [
    'FMA38928',
    'FMA38929',
    'FMA38930',
    'FMA38931',
    'FMA38932',
    'FMA38933',
    'FMA38934',
    'FMA38935',
    'FMA45888',
    'FMA45889',
    'FMA45891',
    'FMA45892',
  ],
  leg: ['FMA45957', 'FMA45958', 'FMA45960', 'FMA45961'],
  hand: ['FMA46121', 'FMA46122', 'FMA46123', 'FMA46124'],
  foot: [
    'FMA45971',
    'FMA45972',
    'FMA45973',
    'FMA45974',
    'FMA46018',
    'FMA46019',
    'FMA46020',
    'FMA46021',
  ],
};
for (const [region, ids] of Object.entries(dissectionParts))
  for (const fma of ids) {
    const r = isa.get(fma);
    if (!r) throw new Error(`Missing dissection source ${fma}`);
    if (
      selections.some(
        (s) => s.tree === 'isa' && s.files.some((f) => r.files.includes(f)),
      )
    )
      throw new Error(`Overlapping dissection source ${fma}`);
    selections.push({
      fma,
      name: r.name,
      system: 'muscles',
      tree: 'isa',
      files: r.files,
      region,
      dissection: true,
    });
  }
for (const fma of ['FMA13373', 'FMA13374']) {
  const r = partof.get(fma);
  selections.push({
    fma,
    name: r.name,
    system: 'muscles',
    tree: 'partof',
    files: r.files,
    region: 'thorax',
    dissection: true,
  });
}
// Whole compound organs remain single selectable identities. Do not label their
// source components as independently validated substructures.
const organIds = [
  'FMA7088',
  'FMA7309',
  'FMA7310',
  'FMA7197',
  'FMA7198',
  'FMA7148',
  'FMA7200',
  'FMA7201',
  'FMA7202',
  'FMA7204',
  'FMA7205',
  'FMA15900',
  'FMA7131',
  'FMA7394',
];
for (const fma of organIds) {
  const r = partof.get(fma);
  if (!r) throw new Error(`Missing organ ${fma}`);
  selections.push({
    fma,
    name: r.name,
    system: 'organs',
    tree: 'partof',
    files: r.files,
  });
}
for (const fma of ['FMA7196', 'FMA15629', 'FMA15630']) {
  const r = isa.get(fma);
  selections.push({
    fma,
    name: r.name,
    system: 'organs',
    tree: 'isa',
    files: r.files,
  });
}
const brain = partof.get('FMA50801');
selections.push({
  fma: brain.id,
  name: brain.name,
  system: 'nerves',
  tree: 'partof',
  files: brain.files,
});
// FJ1737 has conflicting source labels: spinal cord vs central canal. It is NOT
// promoted to an anatomically complete cord. Display the narrower source identity.
const canal = isa.get('FMA78497');
selections.push({
  fma: canal.id,
  name: canal.name,
  system: 'nerves',
  tree: 'isa',
  files: canal.files,
  coverageNote:
    'Central canal representation only; this is not a complete spinal cord or spinal-nerve model.',
});
const recovered = [
  ...recoverySelections(isa, partof),
  ...gapSelections(isa),
  ...inventorySelections(isa, partof),
  ...neuroSelections(isa),
  ...axialSelections(isa),
  ...headDetailSelections(isa),
  ...junctionSelections(isa),
  ...mesentericSelections(isa),
  ...pancreaticSelections(isa),
  ...thoracicSelections(isa),
  ...handVascularSelections(isa),
  ...handVenousSelections(isa),
  ...footVascularSelections(isa),
  ...ocularSelections(isa),
];
// Separate an already included component from an aggregate without duplicating
// its surface. Preserve the aggregate's public ID and record the adaptation.
for (const child of recovered) {
  if (selections.some((s) => s.fma === child.fma))
    throw new Error(`Duplicate recovery ${child.fma}`);
  for (const parent of selections) {
    const shared = parent.files.filter((f) => child.files.includes(f));
    if (!shared.length) continue;
    if (parent.system !== 'organs' || parent.files.length <= shared.length)
      throw new Error(
        `Unexpected recovery overlap: ${parent.name} / ${child.name}`,
      );
    parent.files = parent.files.filter((f) => !shared.includes(f));
    parent.coverageNote =
      `${parent.coverageNote ?? ''} Display aggregate excludes the separately selectable ${child.name} surface. Source coordinates are unchanged.`.trim();
  }
  selections.push(child);
}
const regions = [
  {
    id: 'head-neck',
    name: 'Head & neck',
    description: 'Skull, cervical anatomy, brain and selected cranial nerves',
  },
  {
    id: 'thorax',
    name: 'Thorax',
    description: 'Rib cage, heart, lungs and chest muscles',
  },
  {
    id: 'abdomen',
    name: 'Abdomen',
    description: 'Abdominal organs and wall muscles',
  },
  {
    id: 'pelvis',
    name: 'Pelvis & hip',
    description: 'Pelvic bones, bladder and pelvic muscles',
  },
  {
    id: 'shoulder-arm',
    name: 'Shoulder & arm',
    description: 'Shoulder girdle and upper arm',
  },
  {
    id: 'forearm',
    name: 'Elbow & forearm',
    description: 'Radius, ulna and forearm muscles',
  },
  {
    id: 'hand',
    name: 'Wrist & hand',
    description: 'Carpal bones, digits and hand muscles',
  },
  { id: 'thigh', name: 'Hip & thigh', description: 'Femur and thigh muscles' },
  {
    id: 'leg',
    name: 'Knee & leg',
    description: 'Patella, tibia, fibula and lower-leg muscles',
  },
  {
    id: 'foot',
    name: 'Ankle & foot',
    description: 'Tarsal bones, toes and foot muscles',
  },
  {
    id: 'spine',
    name: 'Spine & back',
    description: 'Vertebral column and back musculature',
  },
];
const muscleRegions = [
  ['hand', 'FMA37372'],
  ['forearm', 'FMA37371'],
  ['shoulder-arm', 'FMA37370'],
  ['shoulder-arm', 'FMA33531'],
  ['foot', 'FMA37369'],
  ['leg', 'FMA22471'],
  ['thigh', 'FMA22470'],
  ['pelvis', 'FMA19086'],
  ['head-neck', 'FMA9616'],
  ['head-neck', 'FMA9617'],
  ['spine', 'FMA22594'],
  ['abdomen', 'FMA9620'],
  ['thorax', 'FMA9619'],
];
function regionOf(record, bounds) {
  const name = record.name;
  if (record.region) return record.region;
  if (/perineal/.test(name)) return 'pelvis';
  if (record.system === 'nerves')
    return /canal/.test(name) ? 'spine' : 'head-neck';
  if (record.system === 'organs')
    return /lung|heart|trachea|esophagus/.test(name)
      ? 'thorax'
      : /^urinary bladder$/.test(name)
        ? 'pelvis'
        : 'abdomen';
  if (record.system === 'muscles')
    for (const [region, fma] of muscleRegions)
      if (record.files.some((f) => isa.get(fma)?.files.includes(f)))
        return region;
  if (/vertebra|atlas|axis|sacrum|coccyx/.test(name)) return 'spine';
  if (/rib|sternum/.test(name)) return 'thorax';
  if (/scapula|clavicle|humerus/.test(name)) return 'shoulder-arm';
  if (/radius|ulna/.test(name)) return 'forearm';
  if (/femur/.test(name)) return 'thigh';
  if (/tibia|fibula|patella/.test(name)) return 'leg';
  if (/hip bone|ilium|ischium|pubis/.test(name)) return 'pelvis';
  if (/foot|toe|tarsal|talus|calcaneus|cuneiform|cuboid/.test(name))
    return 'foot';
  if (
    /hand|finger|thumb|carpal|scaphoid|lunate|triquetr|pisiform|trapez|capitate|hamate/.test(
      name,
    )
  )
    return 'hand';
  const c = bounds.getCenter(new THREE.Vector3());
  if (c.z > 1320) return 'head-neck';
  if (c.z < 190) return 'foot';
  if (c.z < 550) return 'leg';
  if (c.z < 880) return Math.abs(c.x) > 190 ? 'hand' : 'thigh';
  if (Math.abs(c.x) > 220) return 'forearm';
  if (c.z < 970) return 'pelvis';
  if (c.z < 1120) return 'abdomen';
  return 'thorax';
}
const jobs = [
  ...new Map(
    selections.flatMap((r) =>
      r.files.map((file) => [`${r.tree}/${file}`, { tree: r.tree, file }]),
    ),
  ).values(),
];
console.log(
  `Retrieving ${jobs.length} source entries for ${selections.length} selectable structures`,
);
let completed = 0;
const raw = await parallelMap(jobs, 8, async (job) => {
  const bytes = await (job.tree === 'isa' ? isaZip : partofZip).get(job.file);
  if (++completed % 80 === 0)
    console.log(`Verified ${completed}/${jobs.length} source entries`);
  return [
    `${job.tree}/${job.file}`,
    { bytes, hash: createHash('sha256').update(bytes).digest('hex') },
  ];
});
const rawMap = new Map(raw),
  loader = new OBJLoader();
const sourceCenter = [0, -50, 800],
  scale = 0.01;
const matrix = new THREE.Matrix4()
  .makeRotationX(-Math.PI / 2)
  .multiply(
    new THREE.Matrix4().makeTranslation(...sourceCenter.map((v) => -v)),
  );
matrix.premultiply(new THREE.Matrix4().makeScale(scale, scale, scale));
const bundles = new Map(),
  catalog = [],
  excluded = [];
const quarantine = new Set(['FMA37388', 'FMA37389', 'FMA46633', 'FMA46634']);
for (const record of selections) {
  const sourceBounds = new THREE.Box3(),
    geometries = [];
  const sources = [];
  for (const file of record.files) {
    const { bytes, hash } = rawMap.get(`${record.tree}/${file}`),
      object = loader.parse(bytes.toString());
    sourceBounds.expandByObject(object);
    sources.push({ file, sha256: hash });
    object.traverse((mesh) => {
      if (!mesh.isMesh) return;
      let g = mesh.geometry.clone();
      g.deleteAttribute('normal');
      g.deleteAttribute('uv');
      g = mergeVertices(g, 0.0001);
      g.computeVertexNormals();
      g.applyMatrix4(matrix);
      geometries.push(g);
    });
  }
  const region = regionOf(record, sourceBounds);
  if (quarantine.has(record.fma)) {
    excluded.push({
      fmaId: record.fma,
      name: record.name,
      sources,
      sourceTree: record.tree,
      reason:
        'Source laterality/position discrepancy flagged by spatial checks; withheld pending expert review. No automatic reflection or relabelling.',
    });
    for (const geometry of geometries) geometry.dispose();
    continue;
  }
  const laterality = /\bright\b/.test(record.name)
    ? 'right'
    : /\bleft\b/.test(record.name)
      ? 'left'
      : record.system === 'organs'
        ? 'unpaired'
        : sourceBounds.min.x < 0 && sourceBounds.max.x > 0
          ? 'midline'
          : 'unspecified';
  const slug = record.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const category =
    record.category ??
    (record.system === 'skeleton'
      ? 'bone'
      : record.system === 'muscles'
        ? 'muscle'
        : record.system === 'nerves'
          ? /nerve/.test(record.name)
            ? 'nerve'
            : /canal/.test(record.name)
              ? 'space'
              : 'organ'
          : 'organ');
  const prior = previous.structures?.find((s) => s.fmaId === record.fma);
  const id =
    prior?.id ?? `vm:anatomy:body:${region}:${laterality}:${category}:${slug}`;
  const geometry = mergeGeometries(geometries);
  geometry.computeBoundingBox();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  mesh.name = record.fma;
  mesh.userData = { structureId: id, fmaId: record.fma };
  const bundle =
    prior?.bundle ??
    `${region}-${record.system}${record.ocularRecovery ? '-ocular-detail' : record.footVascularRecovery ? '-foot-vascular' : record.handVenousRecovery ? '-hand-venous' : record.handVascularRecovery ? '-hand-vascular' : record.thoracicRecovery ? '-thoracic-detail' : record.pancreaticRecovery ? '-visceral-detail' : record.mesentericRecovery ? '-mesenteric' : record.junctionRecovery ? '-junction' : record.headDetailRecovery ? '-head-detail' : record.axialRecovery ? '-axial-detail' : record.neuroRecovery ? '-deep-brain' : record.inventoryRecovery ? '-inventory' : record.gapRecovery ? '-gaps' : record.recovery ? '-recovery' : record.dissection ? '-dissection' : ''}`;
  if (!bundles.has(bundle)) bundles.set(bundle, new THREE.Group());
  bundles.get(bundle).add(mesh);
  const box = geometry.boundingBox,
    center = box.getCenter(new THREE.Vector3());
  const position = geometry.getAttribute('position');
  let best = Infinity,
    anchor = center.clone();
  for (let i = 0; i < position.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(position, i),
      d = p.distanceToSquared(center);
    if (d < best) {
      best = d;
      anchor = p;
    }
  }
  const extraRegions =
    region === 'spine'
      ? /cervical|atlas|axis/.test(record.name)
        ? ['head-neck']
        : /thoracic/.test(record.name)
          ? ['thorax']
          : /lumbar/.test(record.name)
            ? ['abdomen']
            : /sacrum|coccyx/.test(record.name)
              ? ['pelvis']
              : []
      : [];
  extraRegions.push(...(record.extraRegions ?? []));
  if (/femur/.test(record.name)) extraRegions.push('pelvis', 'leg');
  if (/humerus/.test(record.name)) extraRegions.push('forearm');
  if (/hip bone|sacrum|psoas major/.test(record.name))
    extraRegions.push('thigh');
  if (
    /gluteus|obturator|piriformis|gemellus|quadratus femoris|iliacus/.test(
      record.name,
    )
  )
    extraRegions.push('pelvis');
  const canonical =
    /right (scapula|clavicle|humerus|supraspinatus|infraspinatus muscle|subscapularis|teres minor)$/.test(
      record.name,
    )
      ? `vm:anatomy:upper-limb:shoulder:right:${category}:${record.name
          .replace(/^right /, '')
          .replace(/ muscle$/, '')
          .replace(/ /g, '-')}`
      : id;
  mesh.userData.structureId = canonical;
  catalog.push({
    id: canonical,
    fmaId: record.fma,
    name: record.name[0].toUpperCase() + record.name.slice(1),
    sourceName: record.name,
    system: record.system,
    category,
    laterality,
    region,
    regions: [...new Set([region, ...extraRegions])],
    bundle,
    nodeName: record.fma,
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
    center: center.toArray(),
    anchor: anchor.toArray(),
    sourceTree: record.tree,
    sources,
    coverageNote: record.coverageNote ?? null,
    provenance: {
      method: 'licensed-source-mesh',
      license: 'CC-BY-4.0',
      sourceVersion: '4.0',
      recovered: !!record.recovery,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
  });
}
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const bundleManifest = [];
for (const [id, group] of bundles) {
  const bytes = Buffer.from(
    await new GLTFExporter().parseAsync(group, { binary: true }),
  );
  if (bytes.length > 24 * 1024 * 1024) throw new Error('Asset exceeds 24 MB');
  await fs.writeFile(path.join(out, `${id}.glb`), bytes);
  bundleManifest.push({
    id,
    url: `/models/bodyparts3d/full-body/${id}.glb`,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    structures: group.children.length,
  });
}
await fs.writeFile(
  path.join(out, 'catalog.json'),
  JSON.stringify(
    {
      version: 2,
      sourceVersion: '4.0',
      license: 'CC-BY-4.0',
      credit:
        'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
      sources: { isa: isaZip.source, partof: partofZip.source },
      coordinateSystem: {
        source: 'mm, X left / Y posterior / Z superior',
        scene: 'X left / Y superior / Z anterior',
        sourceCenter,
        unitsPerMillimetre: scale,
        sourceToSceneColumnMajor: matrix.toArray(),
      },
      coverage: {
        nerves:
          'Brain aggregate, selected deep-brain surfaces and cranial/orbital nerves. Internal nuclei and connections are incomplete. Central canal only, not a complete cord; no brachial/lumbosacral plexus or limb peripheral nerves.',
        organs:
          'Selected adult-male organs, including a limited male reproductive and ocular subset, plus 28 source-labelled secondary teeth (no third molars or internal tooth layers). No complete internal-layer, female or variant anatomy.',
        vessels:
          'Selected major artery and vein segments, not a complete vascular tree. No lymphatic anatomy or independently reviewed branching/continuity.',
        connective:
          'Selected cartilages, 22 source-labelled intervertebral discs, membranes, tendons and ligaments; wrist flexor retinacula, iliotibial tracts, linea alba, orbital tendinous rings and trochleae. One disc level is unresolved; most joint capsules, fascia and ligament systems remain absent.',
      },
      regions,
      bundles: bundleManifest,
      structures: catalog,
      excluded,
    },
    null,
    2,
  ),
);
await fs.writeFile(
  path.join(out, 'source-map-isa.tsv'),
  await sourceTable('isa_element_parts.txt'),
);
console.log(
  JSON.stringify(
    {
      structures: catalog.length,
      systems: Object.fromEntries(
        [
          'skeleton',
          'muscles',
          'nerves',
          'organs',
          'vessels',
          'connective',
        ].map((s) => [s, catalog.filter((r) => r.system === s).length]),
      ),
      regions: regions.map((r) => ({
        name: r.name,
        count: catalog.filter((s) => s.regions.includes(r.id)).length,
      })),
      bundles: bundleManifest.length,
      megabytes: bundleManifest.reduce((s, b) => s + b.bytes, 0) / 1e6,
    },
    null,
    2,
  ),
);
