// Source-derived review projections; no invented anatomy or patient images.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { dorsalPenileSources } from './dorsal-penile-sources.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const check = process.argv.includes('--check');
const retained = 'content/prototypes/dorsal-penile-source-condition';
await mkdir(retained, { recursive: true });
await mkdir('docs/reviews', { recursive: true });
const report = await readFile(check ? `${retained}/originals.json` : '../work/DORSAL-PENILE-ORIGINALS-20260924.json');
assert.equal(hash(report), '082cd414f2088fb5cdb7643f66e0ea285842e6045698535c42c2f3ce505cb2d9');
async function retain(path, bytes) {
  if (check) return assert.deepEqual(await readFile(path), bytes);
  try { await writeFile(path, bytes, { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; assert.deepEqual(await readFile(path), bytes); }
}
await retain(`${retained}/originals.json`, report);
const colors = ['#286fa3', '#b64f22', '#df9d25', '#873f81', '#b47aaa'];
const layers = [];
const corpus = JSON.parse(await readFile('public/models/bodyparts3d/corpus-spongiosum/catalog.json')).structures;
assert.equal(corpus.length, 1);
for (const source of corpus[0].sources) {
  const bytes = await readFile(`../work/bodyparts3d/isa/${source.file}.obj`);
  assert.equal(hash(bytes), source.sha256);
  layers.push({ file: source.file, sha256: source.sha256, label: 'Existing bulb/shaft source (context only)', color: '#819294', opacity: 0.19, shape: sourceObjShape(bytes) });
}
let colorIndex = 0;
for (const group of dorsalPenileSources) for (const source of group.sources) {
  const bytes = await readFile(`../work/bodyparts3d/isa/${source.file}.obj`);
  assert.equal(hash(bytes), source.sha256);
  await retain(`${retained}/${source.file}.obj`, bytes);
  layers.push({ file: source.file, sha256: source.sha256, label: `${group.id} / ${source.file}: ${group.name}`, color: colors[colorIndex++], opacity: 1, shape: sourceObjShape(bytes) });
}
const all = layers.flatMap(layer => layer.shape.vertices);
const esc = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900"><rect width="1440" height="900" fill="#fafaf8"/><g font-family="Arial, sans-serif" fill="#163841">';
svg += '<text x="24" y="34" font-size="24">Dorsal penile vessels — original-source review</text><text x="24" y="62" font-size="15">Five supplied pieces; not admitted. Colours distinguish files, not validated arterial branches.</text>';
layers.forEach((layer, i) => { svg += `<text x="24" y="${91 + 22*i}" font-size="14" fill="${layer.color}">${esc(layer.label)}</text>`; });
const panes = [];
for (const [index, axes] of [[0, [0, 2]], [1, [1, 2]], [2, [0, 1]]]) {
  const [h,v] = axes, x = 24 + index*472, y = 266, width = 448, height = 503;
  const min = axes.map(a => Math.min(...all.map(p => p[a]))), max = axes.map(a => Math.max(...all.map(p => p[a])));
  const scale = Math.min((width-40)/(max[0]-min[0]), (height-40)/(max[1]-min[1]));
  const label = `${'XYZ'[h]}/${'XYZ'[v]}`;
  panes.push({ axes: label, minMm: min, maxMm: max, pixelsPerMm: scale });
  svg += `<text x="${x}" y="246" font-size="16">${label} projection · complete extents</text><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white" stroke="#d7dfe1"/>`;
  for (const layer of layers) {
    let d = '';
    for (const face of layer.shape.faces) {
      const p = face.map(i => layer.shape.vertices[i]), [a,b,c] = p;
      if ((b[h]-a[h])*(c[v]-a[v]) - (b[v]-a[v])*(c[h]-a[h]) <= 0) continue;
      d += 'M' + p.map(point => `${(x+width/2+(point[h]-(min[0]+max[0])/2)*scale).toFixed(3)},${(y+height/2-(point[v]-(min[1]+max[1])/2)*scale).toFixed(3)}`).join('L') + 'Z';
    }
    svg += `<path d="${d}" fill="${layer.color}" fill-opacity="${layer.opacity}"/>`;
  }
}
svg += '<text x="24" y="800" font-size="14">Source axes: +X left, +Y posterior, +Z superior. Overlaid projections cannot establish intersection or continuity.</text>';
svg += '<text x="24" y="826" font-size="14">No trimming, repair, bridges, inferred branches, CT/MRI registration or clinical approval. Corporal/glans context is incomplete.</text>';
svg += '<text x="24" y="852" font-size="14">BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</text>';
svg += '<text x="24" y="876" font-size="13">https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html · Original mesh coordinates and faces retained.</text></g></svg>';
const png = await sharp(Buffer.from(svg)).png().toBuffer();
const evidence = { originalsReportSha256: hash(report), sources: layers.map(({shape, ...layer}) => layer), panes, imageSha256: hash(png), geometryModified: false, admitted: false, clinicalApproved: false };
await retain('docs/reviews/dorsal-penile-source.png', png);
await retain('docs/reviews/dorsal-penile-source.json', Buffer.from(JSON.stringify(evidence, null, 2)+'\n'));
console.log(JSON.stringify({ image: 'docs/reviews/dorsal-penile-source.png', sha256: hash(png), retainedOriginals: 5, check }));
