import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { sourceObjShape } from './source-surface-audit.mjs';

// A diagnostic orthographic source sheet, not a clinical diagram or angiogram.
const hash = (b) => createHash('sha256').update(b).digest('hex');
const prepBytes = await readFile('content/source-geometry-screen.json');
assert.equal(hash(prepBytes), '80a31dc88bc8e85561e5f3702b7697485ea547a4a85c7b3264ceb24291c66cd7', 'Pinned source preparation changed');
const prep = JSON.parse(prepBytes);
const candidates = [
  ['FJ1658', 'Right artery', '#00616c', '19a51b68f4f0f58bb86302bbf3d8eb39f26158e2f7d5cd752f85b3adf94eddaf'],
  ['FJ1658M', 'Left artery', '#00616c', '14087bbb463ac93b83165ac19c577188f0c4b07f89bed60e42a1197041ca7342'],
  ['FJ1674', 'Right capsule branch', '#b47a14', prep.files.find((f) => f.tree === 'isa' && f.file === 'FJ1674')?.sha256],
  ['FJ1674M', 'Left capsule branch', '#b47a14', prep.files.find((f) => f.tree === 'isa' && f.file === 'FJ1674M')?.sha256],
];
const shapes = [];
for (const [file, name, color, sha256] of candidates) {
  assert.match(sha256 ?? '', /^[a-f0-9]{64}$/);
  const bytes = await readFile(`../work/bodyparts3d/isa/${file}.obj`);
  assert.equal(hash(bytes), sha256, `Source changed: ${file}`);
  const shape = sourceObjShape(bytes);
  assert(shape.vertices.every((v) => v.length === 3 && v.every(Number.isFinite)));
  assert(shape.faces.every((f) => f.length === 3));
  shapes.push({ file, name, color, sha256, shape });
}
const views = [
  { title: 'Anterior projection', axes: [0, 2], labels: ['Right (-X)', 'Left (+X)', 'Superior (+Z)', 'Inferior (-Z)'] },
  { title: 'Axial projection', axes: [0, 1], labels: ['Right (-X)', 'Left (+X)', 'Posterior (+Y)', 'Anterior (-Y)'] },
  { title: 'Sagittal projection', axes: [1, 2], labels: ['Anterior (-Y)', 'Posterior (+Y)', 'Superior (+Z)', 'Inferior (-Z)'] },
];
const n = (v) => Number(v.toFixed(3));
let polygons = 0;
const panels = views.map(({ title, axes: [a, b], labels }, index) => {
  const vertices = shapes.flatMap((s) => s.shape.vertices);
  const minA = Math.min(...vertices.map((v) => v[a])), maxA = Math.max(...vertices.map((v) => v[a]));
  const minB = Math.min(...vertices.map((v) => v[b])), maxB = Math.max(...vertices.map((v) => v[b]));
  const scale = Math.min(284 / (maxA - minA), 276 / (maxB - minB));
  const cx = (minA + maxA) / 2, cy = (minB + maxB) / 2;
  const projection = (v) => [n(170 + (v[a] - cx) * scale), n(215 - (v[b] - cy) * scale)];
  const faces = shapes.flatMap((s) => s.shape.faces.map((f) => {
    const points = f.map((i) => projection(s.shape.vertices[i]));
    assert(points.every(([x, y]) => x >= 28 && x <= 312 && y >= 77 && y <= 353));
    polygons++;
    return `<polygon data-source="${s.file}" points="${points.map((p) => p.join(',')).join(' ')}" fill="${s.color}" fill-opacity="0.18" stroke="${s.color}" stroke-opacity="0.6" stroke-width="0.45"/>`;
  })).join('\n');
  // Shared source coordinates with no registration/reflection/repaired geometry.
  return `<g transform="translate(${30 + index * 350} 106)">
<rect width="340" height="400" rx="12" fill="white" stroke="#ccd9d6"/>
<text x="170" y="28" text-anchor="middle" font-size="17">${title}</text>
<text x="170" y="60" text-anchor="middle">${labels[2]}</text>
${faces}
<text x="12" y="372" font-size="12">${labels[0]}</text><text x="328" y="372" text-anchor="end" font-size="12">${labels[1]}</text>
<text x="170" y="393" text-anchor="middle" font-size="12">${labels[3]} / 10 mm</text>
<path d="M ${n(170 - 5 * scale)} 375 h ${n(10 * scale)}" stroke="#102e32" stroke-width="2"/>
</g>`;
}).join('\n');
assert.equal(polygons, views.length * shapes.reduce((sum, s) => sum + s.shape.faces.length, 0));
const output = `<svg xmlns="http://www.w3.org/2000/svg" width="1110" height="654" viewBox="0 0 1110 654" role="img" aria-labelledby="title desc">
<title id="title">Anterior choroidal candidates — source-only review</title>
<desc id="desc">Three transparent orthographic projections of four original BodyParts3D meshes. Overlap is projection, not lumen continuity. These candidates are not admitted to the atlas.</desc>
<rect width="1110" height="654" fill="#f1f5f2"/>
<g font-family="system-ui, sans-serif" fill="#102e32" font-size="14">
<text x="30" y="36" font-size="23">Anterior choroidal candidates: source-only review</text>
<text x="30" y="61">Teal: parent arteries / Gold: source-labelled internal-capsule branches / Original millimetre coordinates</text>
<text x="30" y="84">Not admitted. No vessel lumen, supply territory, patient registration or clinical accuracy is established.</text>
${panels}
<text x="30" y="534">Sagittal left/right projections superimpose; this sheet has no depth sorting, occlusion or brain/ICA context.</text>
<text x="30" y="557">Geometric extrema are not certified anatomical endpoints. Use the paired-source audit and radiologist review.</text>
<text x="30" y="580">Sources: FJ1658 / FJ1658M (418 triangles each); FJ1674 / FJ1674M (346 triangles each).</text>
<text x="30" y="605">BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International</text>
<text x="30" y="628">Licence: https://creativecommons.org/licenses/by/4.0/ — Original orthographic derivative; source meshes unchanged.</text>
</g></svg>\n`;
const destination = 'docs/anterior-choroidal-source-projections.svg';
if (process.argv.includes('--check')) assert.equal((await readFile(destination, 'utf8')).replaceAll('\r\n', '\n'), output, 'Review projection is stale');
else await writeFile(destination, output, { flag: 'wx' });
console.log(JSON.stringify({ destination, sha256: hash(output), views: views.length, sourceFiles: shapes.map(({ file, sha256 }) => ({ file, sha256 })), polygons, admissions: 0, clinicalValidation: false }));
