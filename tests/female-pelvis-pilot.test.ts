import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { atlasModules } from '../lib/catalog.ts';
const runtime = new URL('../public/atlas-runtime/female-pelvis/',import.meta.url);
const sha = (bytes:Uint8Array) => createHash('sha256').update(bytes).digest('hex');

test('pelvic export inventory binds the single original model and excludes private artifacts',async()=>{
  assert((await readFile(new URL('../.gitattributes',import.meta.url),'utf8')).includes('public/atlas-runtime/female-pelvis/** -text'));
  const manifest = JSON.parse(await readFile(new URL('manifest.json',runtime),'utf8'));
  assert.match(manifest.sourceCommit,/^[a-f0-9]{40}$/);
  assert.equal(manifest.region,'independent-female-pelvis');
  assert.equal(manifest.structures,41); assert.equal(manifest.studies,8); assert.equal(manifest.draftTeachingSelections,41);
  for (const key of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection']) assert.equal(manifest[key],false);
  const found:string[] = [];
  async function walk(base:URL,prefix='') {
    for (const item of await readdir(base,{withFileTypes:true})) {
      assert(!item.isSymbolicLink());
      const path = prefix + item.name;
      if (item.isDirectory()) await walk(new URL(item.name+'/',base),path+'/'); else found.push(path);
    }
  }
  await walk(runtime);
  assert.deepEqual(found.sort(),['manifest.json',...manifest.files.map((f:{path:string})=>f.path)].sort());
  for (const file of manifest.files) {
    assert(!file.path.includes('..') && !file.path.startsWith('/'));
    assert(!/\.(dcm|nii|nrrd|vmatlas|vmmr|vmcompare|map)(\.|$)/i.test(file.path));
    const bytes = await readFile(new URL(file.path,runtime));
    assert.equal(bytes.length,file.bytes); assert.equal(sha(bytes),file.sha256);
  }
  assert.equal(found.filter(p=>p.endsWith('.glb')).length,1);
  assert.equal(sha(await readFile(new URL('models/hra-pelvis/pelvis.glb',runtime))),'f18f1f0e3c6e8c0562b6b66864a8d786ffdb9e6a688da9288550fad6e491b866');
});

test('pelvic module assets and commercial notices are delivered with the site',async()=>{
  const html = await readFile(new URL('index.html',runtime),'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert(match[1].startsWith('/atlas-runtime/female-pelvis/'));
    await readFile(new URL(match[1].slice('/atlas-runtime/female-pelvis/'.length),runtime));
  }
  const licenses = JSON.parse(await readFile(new URL('bundled-dependencies.json',runtime),'utf8'));
  const notices = await readFile(new URL('BUNDLED_NOTICES.txt',runtime),'utf8');
  assert(licenses.length>10);
  for (const entry of licenses) {
    assert(['MIT','ISC','Apache-2.0','BSD-2-Clause','BSD-3-Clause','CC0-1.0','0BSD'].includes(entry.license));
    assert(notices.includes(entry.name+'@'+entry.version));
  }
  const modelNotice = await readFile(new URL('models/hra-pelvis/NOTICE.md',runtime),'utf8');
  assert(modelNotice.includes('CC BY 4.0') && modelNotice.includes('Kristen Browne') && modelNotice.includes('modifications'));
  assert((await readFile(new URL('LICENSES/CC-BY-4.0.txt',runtime),'utf8')).length>1000);
});

test('catalogue has one pelvic module with clear coverage and no claimed scan connection',async()=>{
  const entries = atlasModules.filter(m=>m.slug==='female-pelvis-3d');
  assert.equal(entries.length,1); assert.equal(entries[0].images,0); assert.equal(entries[0].structures,41);
  const page = await readFile(new URL('../app/atlas/female-pelvis-3d/page.tsx',import.meta.url),'utf8');
  assert.equal((page.match(/<iframe\b/g)||[]).length,1);
  assert(page.includes('src="/atlas-runtime/female-pelvis/index.html"'));
  assert(page.includes('No scan or spatial registration is connected'));
  assert(page.includes('introductory draft teaching for all 41 selections'));
  assert(page.includes('Imaging-topic coverage remains partial and clinical review is pending'));
  assert(page.includes('lecture access remains separate'));
  assert(!page.includes('postMessage') && !page.includes('iframe src={'));
  const frame = await readFile(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');
  assert(frame.includes("pathname === '/atlas/female-pelvis-3d'"));
});
