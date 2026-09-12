import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { atlasModules } from '../lib/catalog.ts';
const runtime = new URL('../public/atlas-runtime/lower-limb/',import.meta.url);
const sha = (bytes:Uint8Array) => createHash('sha256').update(bytes).digest('hex');
test('lower limb inventory binds 67 surfaces and all five original bundles',async()=>{
  const manifest = JSON.parse(await readFile(new URL('manifest.json',runtime),'utf8'));
  assert.match(manifest.sourceCommit,/^[a-f0-9]{40}$/);
  assert.equal(manifest.region,'independent-right-lower-limb');
  assert.equal(manifest.structures,67); assert.equal(manifest.scopes,5); assert.equal(manifest.studies,26);
  assert.equal(manifest.draftTeachingSelections,67); assert.equal(manifest.clinicalDraftSelections,65);
  for(const key of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection']) assert.equal(manifest[key],false);
  const found:string[]=[];
  async function walk(base:URL,prefix='') {
    for(const item of await readdir(base,{withFileTypes:true})) {
      assert(!item.isSymbolicLink());
      if(item.isDirectory()) await walk(new URL(item.name+'/',base),prefix+item.name+'/'); else found.push(prefix+item.name);
    }
  }
  await walk(runtime);
  assert.deepEqual(found.sort(),['manifest.json',...manifest.files.map((f:{path:string})=>f.path)].sort());
  for(const file of manifest.files) {
    assert(!file.path.includes('..')&&!file.path.startsWith('/'));
    assert(!/\.(dcm|nii|nrrd|stl|vmatlas|vmmr|vmcompare|map)(\.|$)/i.test(file.path));
    const bytes=await readFile(new URL(file.path,runtime));
    assert.equal(bytes.length,file.bytes); assert.equal(sha(bytes),file.sha256);
  }
  const kneeBytes=await readFile(new URL('models/um-knee/catalog.json',runtime));
  const knee=JSON.parse(kneeBytes.toString()),limb=JSON.parse(await readFile(new URL('models/um-limb/catalog.json',runtime),'utf8'));
  assert.equal(limb.companionKneeCatalogSha256,sha(kneeBytes));
  assert.equal(new Set([...knee.structures,...limb.structures].map(s=>s.id)).size,67);
  assert.equal(found.filter(p=>p.endsWith('.glb')).length,5);
  for(const b of [knee.bundle,...limb.bundles]) assert.equal(sha(await readFile(new URL(b.url.slice(1),runtime))),b.sha256);
});
test('module delivers its assets and full compatible notices',async()=>{
  assert((await readFile(new URL('../.gitattributes',import.meta.url),'utf8')).includes('public/atlas-runtime/lower-limb/** -text'));
  const html=await readFile(new URL('index.html',runtime),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert(match[1].startsWith('/atlas-runtime/lower-limb/'));
    await readFile(new URL(match[1].slice('/atlas-runtime/lower-limb/'.length),runtime));
  }
  const deps=JSON.parse(await readFile(new URL('bundled-dependencies.json',runtime),'utf8'));
  const notices=await readFile(new URL('BUNDLED_NOTICES.txt',runtime),'utf8');
  assert(deps.length>10);
  for(const d of deps) { assert(['MIT','ISC','Apache-2.0','BSD-2-Clause','BSD-3-Clause','CC0-1.0','0BSD'].includes(d.license)); assert(notices.includes(d.name+'@'+d.version)); }
  const model=await readFile(new URL('MODEL_NOTICE.md',runtime),'utf8');
  assert(model.includes('CC0 1.0')&&model.includes('Jeevaraaj')&&model.includes('67 source STL'));
});
test('one compact lower-limb route declares actual scope and absent imaging',async()=>{
  const entries=atlasModules.filter(m=>m.slug==='lower-limb-3d');
  assert.equal(entries.length,1); assert.equal(entries[0].images,0); assert.equal(entries[0].structures,67);
  const page=await readFile(new URL('../app/atlas/lower-limb-3d/page.tsx',import.meta.url),'utf8');
  assert.equal((page.match(/<iframe\b/g)||[]).length,1);
  assert(page.includes('src="/atlas-runtime/lower-limb/index.html"'));
  assert(page.includes('No scan or spatial registration is connected'));
  assert(page.includes('lecture access remains separate'));
  const frame=await readFile(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');
  assert(frame.includes("pathname === '/atlas/lower-limb-3d'"));
});
