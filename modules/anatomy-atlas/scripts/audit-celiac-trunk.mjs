// Source-only diagnostic. This script never admits, repairs or registers anatomy.
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {build} from './workspace-test-build.mjs';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
import {archiveReader, cache} from './bodyparts-archive.mjs';
import {geometryFingerprint} from './anatomy-inventory.mjs';
import {sourceObjShape, sourceBoundsNear, sourceTriangleSet} from './source-surface-audit.mjs';
import {sourceTopology} from './source-topology.mjs';
import {spatialDistanceIndex, uniqueSourceVertices, distanceSummary} from './source-spatial-math.mjs';
import {shapeCandidate, compareTranslatedShape} from './vessel-shape-math.mjs';

const hash = b => createHash('sha256').update(b).digest('hex');
const baselineCommit = 'af0f5866ea01b6979cdac2ad16ad23dccf275d8a';
execFileSync('git', ['merge-base','--is-ancestor',baselineCommit,'HEAD']);
const pins = [
  ['isa', 'BP10622', '7c0030c4502c344512b92428a3bb856d45cab28783f1a2019d2caeba09043d10'],
  ['partof', 'BP10650', 'f70068564c53bd6297ebcd1f129e6af6c6441b9a7f2a771ac6e466dde7bfaf1e'],
];
const current = await loadCurrentSourceHolds();
const compiled = await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {nestedStudyTargets} from './lib/nested-anatomy';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',metafile:true});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const display = api.bodyDisplayCatalog(current.catalog), nested = api.nestedStudyTargets(display);
const shoulder = JSON.parse(await readFile('public/models/bodyparts3d/manifest.json'));
assert.equal(display.structures.length, 1104, 'Re-review changed root scope');
assert.equal(nested.length, 104, 'Re-review changed reachable nested scope');
const inputPaths = new Set(['package-lock.json','public/models/bodyparts3d/manifest.json']);
for (const name of Object.keys(compiled.metafile.inputs)) {
  if (name === '<stdin>') continue;
  assert(name.startsWith('workspace-test:'), 'Unexpected compiled input namespace');
  const relative = path.relative(process.cwd(), name.slice('workspace-test:'.length)).replaceAll('\\','/');
  assert(!relative.startsWith('../') && !path.isAbsolute(relative));
  inputPaths.add(relative);
}
async function pinHelper(file) {
  if (inputPaths.has(file)) return;
  inputPaths.add(file);
  const text = await readFile(file,'utf8');
  for (const match of text.matchAll(/^import\s+(?:(?!;)[\s\S])*?\sfrom\s+['"](\.\.?\/[^'"]+)['"]/gm)) {
    const child = path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
    assert(!child.startsWith('../'));
    await pinHelper(child);
  }
}
await pinHelper('scripts/audit-celiac-trunk.mjs');
const computationInputs = await Promise.all([...inputPaths].sort().map(async file => ({path:file,sha256:hash((await readFile(file,'utf8')).replace(/\r\n/g,'\n'))})));
const candidates = [];
for (const [tree, representation, sha256] of pins) {
  const definition = current.records.find(r => r.tree === tree && r.id === 'FMA14812');
  assert.deepEqual(definition, {id:'FMA14812',name:'celiac trunk',representation,files:['FJ3421'],tree});
  current.policy.assertNoKnownHolds([definition]);
  const archiveEvidence = current.inventory.archives.find(a => a.tree === tree);
  const archive = await archiveReader(tree, archiveEvidence.url);
  const directory = [...archive.entries].filter(([name]) => name.endsWith('.obj')).sort(([a],[b]) => a.localeCompare(b));
  assert.equal(directory.length, archiveEvidence.entryCount);
  assert.equal(hash(JSON.stringify(directory)), archiveEvidence.directorySha256);
  const bytes = await archive.get('FJ3421');
  assert.equal(hash(bytes), sha256);
  const shape = sourceObjShape(bytes);
  assert(shape.vertices.every(v => v.length === 3 && v.every(Number.isFinite)));
  assert(shape.faces.every(f => f.length === 3 && f.every(i => Number.isInteger(i) && i >= 0 && i < shape.vertices.length)));
  candidates.push({tree,file:'FJ3421',definition,sha256,bytes:bytes.length,sourceArchive:archive.source,
    archiveDirectorySha256:archiveEvidence.directorySha256,archiveEntry:archive.entries.get('FJ3421.obj'),
    geometrySha256:geometryFingerprint(bytes),bounds:{min:shape.min,max:shape.max},topology:sourceTopology(shape),
    shape,triangles:sourceTriangleSet(shape),nearest:spatialDistanceIndex(shape)});
}
const assets = new Map();
function add(structure, scope) {
  for (const source of structure.sources) {
    const key = structure.sourceTree + '/' + source.file;
    if (assets.has(key)) assert.equal(assets.get(key).sha256, source.sha256);
    else assets.set(key, {tree:structure.sourceTree,file:source.file,sha256:source.sha256,owners:[]});
    assets.get(key).owners.push({scope,id:structure.id,fmaId:structure.fmaId});
  }
}
display.structures.forEach(s => add(s, 'root'));
nested.forEach(t => add(t.structure, 'nested:' + t.study));
shoulder.parts.forEach(p => add({id:p.structureId,fmaId:p.fmaId,sourceTree:'isa',sources:[{file:p.sourceFile.replace(/\.obj$/,''),sha256:p.sourceSha256}]}, 'shoulder'));
const screen = [], comparisons = [], matches = [];
const samples = s => {const p = uniqueSourceVertices(s), stride = Math.max(1,Math.ceil(p.length / 128)); return p.filter((_,i) => i % stride === 0);};
// Both trees are independently pinned; compare the ISA shape to current surfaces
// once, after proving exact geometry identity of the two source representations.
assert.equal(candidates[0].geometrySha256, candidates[1].geometrySha256);
assert.deepEqual(candidates[0].shape.vertices, candidates[1].shape.vertices);
assert.deepEqual(candidates[0].shape.faces, candidates[1].shape.faces);
const c = candidates[0];
assert.equal(assets.size, 1818, 'Re-review changed source coverage');
for (const asset of assets.values()) {
  const bytes = await readFile(`${cache}/${asset.tree}/${asset.file}.obj`);
  assert.equal(hash(bytes), asset.sha256, `Changed source ${asset.tree}/${asset.file}`);
  const shape = sourceObjShape(bytes), fingerprint = geometryFingerprint(bytes);
  const direct = asset.file === c.file && candidates.some(p => p.tree === asset.tree);
  const exact = fingerprint === c.geometrySha256;
  if (direct || exact) matches.push({asset:asset.tree+'/'+asset.file,direct,exact,owners:asset.owners});
  const near = sourceBoundsNear(c.shape, shape, 1.01), comparable = shapeCandidate(c.shape, shape);
  screen.push({...asset,geometrySha256:fingerprint,bounds:{min:shape.min,max:shape.max},triangles:shape.faces.length,near,comparable});
  if (!near && !comparable) continue;
  const triangles = sourceTriangleSet(shape);
  comparisons.push({asset:asset.tree+'/'+asset.file,owners:asset.owners,near,comparable,
    sharedTriangles:[...c.triangles].filter(t => triangles.has(t)).length,
    candidateToSource:distanceSummary(uniqueSourceVertices(c.shape),spatialDistanceIndex(shape)),
    sourceToCandidate:distanceSummary(samples(shape),c.nearest),
    translatedDiagnostic:comparable ? compareTranslatedShape(c.shape,shape) : null});
}
// Freeze the actual rejection evidence, not just a successful audit execution.
const duplicateLike = comparisons.filter(r => r.sharedTriangles > 0 &&
  r.candidateToSource.maxMm < 0.02 && r.sourceToCandidate.maxMm < 0.02);
assert.deepEqual(duplicateLike.map(r => r.asset).sort(), ['isa/FJ1846','isa/FJ2013']);
assert(duplicateLike.every(r => r.owners.every(o => o.fmaId === 'FMA50737')));
assert.equal(matches.length, 0, 'An exact/direct match changes the adjudication evidence');
const report = {schemaVersion:1,decision:'do-not-admit-near-duplicate',baselineCommit,
  baselineMeaning:'Audited ancestor, not an assertion that current HEAD equals the baseline; exact computation inputs and coverage are pinned below.',
  computationInputNormalization:'UTF-8 text, CRLF normalized to LF; raw OBJ/archive checks remain byte-exact',computationInputs,
  license:current.catalog.license,credit:current.catalog.credit,evidence:current.evidence,
  rootSelections:display.structures.length,nestedSelections:nested.length,shoulderSourceParts:shoulder.parts.length,
  screenedFiles:screen.length,candidates:candidates.map(({shape,triangles,nearest,...r}) => r),
  exactCrossTreeGeometry:true,matches,comparisons,screen,admitted:false,clinicalApproval:false,
  limitations:['Finite/topology diagnostics are not proof of self-intersection freedom or anatomical correctness.',
    'All current root, reachable nested and shoulder source files were hash-verified. Separate v3/HRA/UM specimen frames are excluded.',
    'Distances use every candidate unique vertex and at most 128 target vertex samples; unsigned distances cannot prove continuous contact or intersections.',
    'Same coordinates and triangle indices across trees do not authorize double admission. No geometry repair, invented connectors, registration or clinical approval.']};
const output = 'docs/celiac-trunk-source-audit.json';
if (process.argv.includes('--check')) assert.deepEqual(report,JSON.parse(await readFile(output)));
else await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,root:report.rootSelections,nested:report.nestedSelections,files:screen.length,
  matches,comparisons:comparisons.length,shared:comparisons.filter(r => r.sharedTriangles),
  translated:comparisons.filter(r => r.translatedDiagnostic?.similar),admitted:false}));
