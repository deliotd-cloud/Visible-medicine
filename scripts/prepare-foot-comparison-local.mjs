import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

// Run only in the isolated proposal; private-assets must never enter public/ or Git.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (key, fallback) => { const i=process.argv.indexOf(key); return i<0?fallback:process.argv[i+1]; };
const source = resolve(arg('--source','G:/VisibleMedicine-temp/staging/20261029-foot-interossei'));
const atlas = resolve(arg('--atlas','F:/VisibleMedicine/atlas'));
const assetRoot = join(root, 'private-assets');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifySha256(bytes, expected, label) {
  assert.match(expected, /^[a-f0-9]{64}$/, `Invalid SHA-256 pin: ${label}`);
  assert.equal(hash(bytes), expected, `SHA-256 mismatch: ${label}`);
  return bytes;
}
export function verifyPinnedBytes(bytes, pin, label) {
  assert(pin && Number.isSafeInteger(pin.bytes) && /^[a-f0-9]{64}$/.test(pin.sha256), `Missing or invalid pin: ${label}`);
  assert.equal(bytes.length, pin.bytes, `Byte count mismatch: ${label}`);
  return verifySha256(bytes, pin.sha256, label);
}
// Fixed field order and sorted input names make the recipe reproducible without
// hashing final assets, whose URLs already contain the revision.
export function calculateRevision({checkpointSha256, packageSha256, preparerSha256, authenticatedInputs}) {
  for (const value of [checkpointSha256, packageSha256, preparerSha256]) assert.match(value, /^[a-f0-9]{64}$/);
  const inputs = [...authenticatedInputs].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  assert.equal(new Set(inputs.map(input=>input.path)).size, inputs.length, 'Duplicate revision input');
  for (const input of inputs) { assert.equal(typeof input.path, 'string'); assert.match(input.sha256, /^[a-f0-9]{64}$/); }
  const recipe = {schema:'vm-foot-comparison-revision/1',checkpointSha256,packageSha256,preparerSha256,authenticatedInputs:inputs};
  return {revision:hash(Buffer.from(JSON.stringify(recipe))),recipe};
}
async function prepare() {
const checkpoint = await readFile('F:/VisibleMedicine/recovery/checkpoints/20261029-foot-interossei-source-review/checkpoint.json');
const checkpointSha256=hash(checkpoint);
verifySha256(checkpoint, '48fc781ac53962857e502626ded4ade1c4a9faeafae65652cdd060aeacbcc2fc','trusted checkpoint');
const trustedCheckpoint=JSON.parse(checkpoint);
const packageBytes=await readFile(trustedCheckpoint.package.path);
verifySha256(packageBytes,trustedCheckpoint.package.sha256,'trusted PACKAGE.json');
const packageInventory = JSON.parse(packageBytes);
const inventory = new Map(packageInventory.files.map(f => [f.path, f]));
const sourceReviewBytes=verifyPinnedBytes(await readFile(join(source,'REVIEW_PACKET.json')),inventory.get('REVIEW_PACKET.json'),'REVIEW_PACKET.json');
const sourceReview=JSON.parse(sourceReviewBytes);
const vendorPins=new Map(sourceReview.inputs.filter(f=>f.path.startsWith('node_modules/three/')).map(f=>[f.path,f]));
const assets = new Map();
async function add(name, path, inventoryPath) {
  assert(!assets.has(name) && /^[A-Za-z0-9_.-]+$/.test(name));
  const bytes = await readFile(path);
  if (inventoryPath) verifyPinnedBytes(bytes, inventory.get(inventoryPath), inventoryPath);
  assets.set(name, bytes);
}
for (const [detail, dir] of [['99', source], ['95', join(source, 'detail95')]]) {
  await add(`model-${detail}.json`, join(dir, 'review/model.json'), `${detail === '99' ? '' : 'detail95/'}review/model.json`);
  await add(`review-packet-${detail}.json`, join(dir, 'REVIEW_PACKET.json'), `${detail === '99' ? '' : 'detail95/'}REVIEW_PACKET.json`);
  for (const id of ['FMA74140','FMA74141',...Array.from({length:10},(_,i)=>`FMA${24507+i}`)])
    await add(`original-${detail}-${id}.obj`, join(dir,'original',`${id}.obj`), `${detail === '99' ? '' : 'detail95/'}original/${id}.obj`);
}
for (const [name,path] of [['NOTICE.md','NOTICE.md'],['source-readme.html','original/source-readme.html'],['license-deed.html','original/license-deed.html'],['license-legalcode.html','original/license-legalcode.html'],['parts-list.txt','original/parts_list_e.txt'],['composite-parts.txt','original/composite_parts.txt']])
  await add(name, join(source,path), path);
for (const [name,path] of [['three.module.js','build/three.module.js'],['three.core.js','build/three.core.js'],['OrbitControls.js','examples/jsm/controls/OrbitControls.js'],['THREE_LICENSE.txt','LICENSE']]) {
  const bytes=await readFile(join(atlas,'node_modules/three',path)),pin=vendorPins.get('node_modules/three/'+path);
  verifyPinnedBytes(bytes,pin,`reviewed vendor: ${path}`);
  assets.set(name,bytes);
}
const originalHtml=verifyPinnedBytes(await readFile(join(source,'review/index.html')),inventory.get('review/index.html'),'review/index.html');
const originalViewer=verifyPinnedBytes(await readFile(join(source,'review/viewer.js')),inventory.get('review/viewer.js'),'review/viewer.js');
const preparerSha256=hash(await readFile(fileURLToPath(import.meta.url)));
const authenticatedInputs=[...inventory.values()].map(pin=>({path:`package/${pin.path}`,sha256:pin.sha256}));
authenticatedInputs.push(...[...vendorPins.values()].map(pin=>({path:`vendor/${pin.path}`,sha256:pin.sha256})));
const {revision,recipe}=calculateRevision({checkpointSha256,packageSha256:trustedCheckpoint.package.sha256,preparerSha256,authenticatedInputs});
const base='/api/atlas-review/source-comparisons/foot/';
const url=name=>`${base}${name}?revision=${revision}`;
// Three's module has a relative nested import. Pin it to the same private route.
assets.set('three.module.js',Buffer.from(assets.get('three.module.js').toString().replaceAll("'./three.core.js'",`'${url('three.core.js')}'`)));
let html=originalHtml.toString('utf8');
html=html.replaceAll('/vendor/three.module.js',url('three.module.js')).replaceAll('/vendor/OrbitControls.js',url('OrbitControls.js'))
  .replaceAll('/NOTICE.md',url('NOTICE.md')).replaceAll('/REVIEW_PACKET.json',url('review-packet-99.json'))
  .replaceAll('/viewer.js',url('viewer.js'));
const additions=`<p><a href="${url('model-99.json')}">Download compact model</a> · <a href="${url('model-95.json')}">Download detail model</a></p><p>Original v3 specimens, both reductions (CC BY-SA 2.1 Japan):</p><ul>${['99','95'].flatMap(detail=>['FMA74140','FMA74141',...Array.from({length:10},(_,i)=>`FMA${24507+i}`)].map(id=>`<li><a download href="${url(`original-${detail}-${id}.obj`)}">${detail}% reduction · ${id}.obj</a></li>`)).join('')}</ul><p><a href="${url('source-readme.html')}">Source README</a> · <a href="${url('license-deed.html')}">Licence deed</a> · <a href="${url('license-legalcode.html')}">Full legal code</a> · <a href="${url('parts-list.txt')}">Parts list</a> · <a href="${url('composite-parts.txt')}">Composite parts</a> · <a href="${url('THREE_LICENSE.txt')}">Viewer library licence</a></p><p>Each group retains small fragments and duplicate faces. Individual muscle segmentation and source-to-v4 or patient registration are unproved. This is an inspection specimen, not a clinical or commercial approval.</p>`;
html=html.replace('</details>',additions+'</details>');
html=html.replace('<label>Side',`<p><a href="${url('index.html')}&detail=99">Compact view</a> · <a href="${url('index.html')}&detail=95">Detail view</a></p><label>Side`);
assets.set('index.html',Buffer.from(html));
let viewer=originalViewer.toString('utf8');
viewer=viewer.replace('a[href="/REVIEW_PACKET.json"]','a[href*="/review-packet-99.json"]');
viewer=viewer.replaceAll("'/model95.json'",`'${url('model-95.json')}'`).replaceAll("'/model.json'",`'${url('model-99.json')}'`)
  .replaceAll("'/REVIEW_PACKET_95.json'",`'${url('review-packet-95.json')}'`).replaceAll("'/REVIEW_PACKET.json'",`'${url('review-packet-99.json')}'`);
assets.set('viewer.js',Buffer.from(viewer));
const model99=JSON.parse(assets.get('model-99.json')), model95=JSON.parse(assets.get('model-95.json'));
assert.equal(model99.structures.length,12); assert.equal(model95.structures.length,12);
assert.equal(hash(assets.get('model-99.json')),'e86bd6ed1a30385ee64d530b110878712d516707a07c09895a57e721673ee080');
assert.equal(hash(assets.get('model-95.json')),'c6f414119bba9be4bb381ba20bd018224e21af6f852853ac8292a736b69cb560');
await mkdir(assetRoot,{recursive:true});
for(const [name,bytes] of assets) await writeFile(join(assetRoot,name),bytes);
const manifest={schemaVersion:1,purpose:'held-v3-foot-source-inspection',revision,revisionRecipe:recipe,sourceCheckpointSha256:checkpointSha256,admissions:0,clinicalValidation:false,registered:false,sourceGeometryChanged:false,license:'CC BY-SA 2.1 Japan',credit:model99.notice.credit,compactModelSha256:hash(assets.get('model-99.json')),detailModelSha256:hash(assets.get('model-95.json')),files:[...assets].map(([name,bytes])=>({name,bytes:bytes.length,sha256:hash(bytes)}))};
await writeFile(join(root,'lib/foot-comparison-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(join(assetRoot,'HASHES.json'),JSON.stringify({schema:'vm-private-foot-assets/1',revision,files:manifest.files},null,2)+'\n');
await writeFile(join(assetRoot,'assets.ts'),"import 'server-only';\n// Gzip transport only; delivery verifies uncompressed source SHA-256. Copy into an ignored private server directory when integrating.\nexport const footComparisonAssets: Record<string,string> = "+JSON.stringify(Object.fromEntries([...assets].map(([name,bytes])=>[name,gzipSync(bytes,{level:9}).toString('base64')])))+';\n');
console.log(JSON.stringify({revision,assets:assets.size,modelBytes:[assets.get('model-99.json').length,assets.get('model-95.json').length],privateAssets:assetRoot}));
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) await prepare();
