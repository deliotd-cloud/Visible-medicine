// Separate version-3 specimen. NEVER append these surfaces to the version-4 body.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  BufferGeometry,
  Float32BufferAttribute,
} from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { archiveReader, parallelMap } from './bodyparts-archive.mjs';
import { legacyBase, legacyTable } from './audit-legacy-anatomy.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

const out = 'public/models/bodyparts3d-v3/back-layers',
  retained = 'content/sources/bodyparts3d-v3-back-layers';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const namesBytes = Buffer.from(await legacyTable('parts_list_e.txt'));
const names = new Map(
  namesBytes
    .toString()
    .trim()
    .split(/\r?\n/)
    .map((row) => row.split('\t')),
);
const muscles = [...names].filter(
  ([, name]) =>
    /^(right|left) (latissimus dorsi|multifidus|rhomboid major|rhomboid minor)$/.test(
      name,
    ) ||
    /^(ascending|transverse|descending) part of (right|left) trapezius$/.test(
      name,
    ),
);
const bones = [...names].filter(
  ([, name]) =>
    /^(right|left) (scapula|humerus|clavicle|hip bone)$/.test(name) ||
    /^(occipital bone|atlas|axis|sacrum)$/.test(name) ||
    /^[a-z]+ (cervical|thoracic|lumbar) vertebra$/.test(name),
);
assert.equal(muscles.length, 14);
assert.equal(bones.length, 34);
const archive = await archiveReader(
  'legacy3',
  legacyBase + 'BodyParts3D_3.0_obj_99.zip',
);
await mkdir(out, { recursive: true });
await mkdir(retained, { recursive: true });
const evidence = {};
for (const [file, url] of [
  ['source-readme.html', legacyBase + 'README_e.html'],
  [
    'license-deed.html',
    'https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en',
  ],
  [
    'license-legalcode.html',
    'https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode.ja',
  ],
]) {
  const r = await fetch(url);
  assert(r.ok);
  const bytes = Buffer.from(await r.arrayBuffer());
  evidence[file] = { url, sha256: hash(bytes) };
  await writeFile(`${retained}/${file}`, bytes);
}
assert(
  (await readFile(`${retained}/source-readme.html`, 'utf8')).includes(
    'Attribution-Share Alike 2.1 Japan',
  ),
);
await writeFile(`${retained}/parts_list_e.txt`, namesBytes);
const license = 'CC BY-SA 2.1 JP',
  licenseUrl = 'https://creativecommons.org/licenses/by-sa/2.1/jp/';
const credit =
  'BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan';
const notice = `# BodyParts3D version 3.0 — separate back-layers specimen\n\n${credit}\n\nLicence: ${licenseUrl}\nSource: ${legacyBase}\nExact archive: ${archive.source}\n\nThe original OBJ files and names table retain their source licence and notices. The converted GLB, catalogue selection and specimen data adaptations are distributed under CC BY-SA 2.1 Japan, not the application code licence. You may copy, adapt and redistribute these assets, including commercially, under that licence; retain credit and the licence and license adaptations accordingly. No additional restrictions or DRM are imposed on these assets. Website subscriptions or lecture terms must not restrict recipients' licensed asset rights.\n\nChanges by Visible Medicine: selected 48 independently named original surfaces, converted OBJ to GLB, assigned teaching colours, applied one uniform axis rotation/translation and unit conversion to ALL surfaces. All source faces retained. No mirroring, smoothing, sculpting, anatomical fitting, repair, segmentation or inter-version registration. Normals are rotated and normalized for display. This uses the official 99%-reduced archive. Vertex/normal index tuples are shared without coordinate welding; source face order is preserved. No additional agent-made decimation is applied.\n\nOne display unit = 100 source millimetres. Display (x,y,z) = (source x/100, (source z-1050)/100, -(source y+100)/100). Version-3 coordinates are NOT registered to the version-4 body or any patient. Original positions are retained. Clinical/anatomical validation pending; no complete deep-back muscle stack, thoracolumbar fascia, discs, spinal cord, nerve paths, validated attachments or surgical guidance. Bones are incomplete context only.\n\nNo warranties or endorsement. See the included source README and licence legal code for the governing terms.\n`;
await writeFile(`${retained}/NOTICE.md`, notice);
await writeFile(`${out}/NOTICE.md`, notice);
const parts = await parallelMap(
  [...muscles, ...bones],
  3,
  async ([fmaId, name]) => {
    assert.equal(names.get(fmaId), name);
    assert(archive.entries.has(fmaId + '.obj'), `Not atomic: ${fmaId}`);
    const bytes = await archive.get(fmaId);
    assert(
      bytes.toString().includes('CC Attribution-Share Alike 2.1 Japan'),
      'Missing asset-specific licence',
    );
    await writeFile(`${retained}/${fmaId}.obj`, bytes);
    const vertices = [],
      normals = [],
      faces = [];
    for (const line of bytes.toString().split(/\r?\n/)) {
      const [kind, ...values] = line.trim().split(/\s+/);
      if (kind === 'v' || kind === 'vn') {
        assert.equal(values.length, 3);
        const point = values.map(Number);
        assert(point.every(Number.isFinite));
        (kind === 'v' ? vertices : normals).push(point);
      } else if (kind === 'f') {
        assert.equal(
          values.length,
          3,
          'Only source triangles; no invented triangulation',
        );
        faces.push(
          values.map((value) => {
            const [v, , n] = value.split('/').map(Number);
            assert(v > 0 && n > 0);
            return [v - 1, n - 1];
          }),
        );
      }
    }
    const p = [],
      n = [],
      indices = [],
      tuples = new Map();
    for (const face of faces)
      for (const [v, normal] of face) {
        assert(vertices[v] && normals[normal]);
        const [x, y, z] = vertices[v],
          [nx, ny, nz] = normals[normal];
        const length = Math.hypot(nx, ny, nz);
        assert(length > 0, 'Zero source normal');
        const key = `${v}/${normal}`;
        if (!tuples.has(key)) {
          tuples.set(key, p.length / 3);
          p.push(x / 100, (z - 1050) / 100, -(y + 100) / 100);
          n.push(nx / length, nz / length, -ny / length);
        }
        indices.push(tuples.get(key));
      }
    assert(faces.length > 0);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(p, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(n, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingBox();
    const min = geometry.boundingBox.min.toArray(),
      max = geometry.boundingBox.max.toArray(),
      center = min.map((v, i) => (v + max[i]) / 2);
    const positions = geometry.getAttribute('position');
    let distance = Infinity,
      anchor;
    for (let i = 0; i < positions.count; i++) {
      const point = [positions.getX(i), positions.getY(i), positions.getZ(i)],
        d = point.reduce((s, v, k) => s + (v - center[k]) ** 2, 0);
      if (d < distance) {
        distance = d;
        anchor = point;
      }
    }
    const laterality = /\bright\b/.test(name)
      ? 'right'
      : /\bleft\b/.test(name)
        ? 'left'
        : 'midline';
    if (laterality !== 'midline')
      assert(
        laterality === 'left' ? center[0] > 0 : center[0] < 0,
        'Unexpected source laterality',
      );
    const tissue = muscles.some(([id]) => id === fmaId) ? 'muscle' : 'skeleton';
    const topology = sourceTopology(sourceObjShape(bytes));
    const color =
      tissue === 'skeleton'
        ? '#c5aa79'
        : name.includes('latissimus')
          ? '#b35c50'
          : name.includes('multifidus')
            ? '#98594e'
            : name.includes('rhomboid')
              ? '#bf7965'
              : name.includes('ascending')
                ? '#a95651'
                : name.includes('transverse')
                  ? '#c97970'
                  : '#cf9285';
    const mesh = new Mesh(
      geometry,
      new MeshStandardMaterial({ color, roughness: 0.78 }),
    );
    mesh.name = fmaId;
    mesh.userData = {
      fmaId,
      sourceVersion: '3.0',
      license,
      credit,
      licenseUrl,
      registration: 'none',
    };
    return {
      mesh,
      topology,
      sourceBytes: bytes.length,
      color,
      surface: {
        id: `bp3d3-back-layers-${fmaId}`,
        fmaId,
        name: name[0].toUpperCase() + name.slice(1),
        sourceName: name,
        slug: name.replaceAll(' ', '-'),
        tissue,
        laterality,
        bundle: 'bp3d3-back-layers',
        nodeName: fmaId,
        bounds: { min, max },
        center,
        anchor,
        sources: [{ file: fmaId, sha256: hash(bytes) }],
        triangles: faces.length,
        omittedSourceFaces: [],
        coverageNote:
          tissue === 'muscle'
            ? 'Whole version-3 source surface. Muscle/aponeurotic boundaries and attachment footprints are not validated.'
            : 'Partial skeletal context from the same version-3 source; not a separately validated attachment map.',
        sourceQuality: {
          components: topology.components.length,
          nonManifoldEdges: topology.nonManifoldEdges,
          zeroNormalVertices: 0,
        },
      },
    };
  },
);
const group = new Group();
parts.forEach((p) => group.add(p.mesh));
if (!globalThis.FileReader)
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((r) => {
        this.result = r;
        this.onloadend?.();
      });
    }
  };
const glb = Buffer.from(
  await new GLTFExporter().parseAsync(group, { binary: true }),
);
await writeFile(`${out}/back-layers.glb`, glb);
const source = {
  version: '3.0, OBJ 99% reduction',
  license,
  licenseUrl,
  credit,
  url: legacyBase + 'README_e.html',
  archive: archive.source,
  registration: 'none',
};
const catalog = {
  version: 1,
  specimenId: 'bp3d3-back-layers',
  source,
  displayTransformColumnMajor: [
    0.01, 0, 0, 0, 0, 0, -0.01, 0, 0, 0.01, 0, 0, 0, -10.5, -1, 1,
  ],
  structures: parts.map((p) => ({ ...p.surface, color: p.color })),
  bundles: [
    {
      id: 'bp3d3-back-layers',
      url: '/models/bodyparts3d-v3/back-layers/back-layers.glb',
      bytes: glb.length,
      sha256: hash(glb),
      structures: parts.length,
    },
  ],
};
await writeFile(`${out}/catalog.json`, JSON.stringify(catalog, null, 2) + '\n');
await writeFile(
  `${retained}/source-audit.json`,
  JSON.stringify(
    {
      source,
      evidence,
      namesSha256: hash(namesBytes),
      structures: parts.map((p) => ({
        id: p.surface.id,
        source: p.surface.sources[0],
        sourceBytes: p.sourceBytes,
        topology: p.topology,
        triangles: p.surface.triangles,
      })),
    },
    null,
    2,
  ) + '\n',
);
// Original selected OBJ files remain in the source backup. Link the official archive in the live viewer.
console.log(
  JSON.stringify({
    surfaces: parts.length,
    muscles: muscles.length,
    context: bones.length,
    glbBytes: glb.length,
    triangles: parts.reduce((n, p) => n + p.surface.triangles, 0),
    topology: parts.map((p) => ({
      id: p.surface.fmaId,
      components: p.topology.components.length,
      nonManifoldEdges: p.topology.nonManifoldEdges,
    })),
  }),
);
