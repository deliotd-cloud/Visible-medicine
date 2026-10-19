import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { atlasModules } from '../lib/catalog.ts';
const runtime=new URL('../public/atlas-runtime/shoulder/',import.meta.url);

test('shoulder module inventory is exact and contains no patient files',async()=>{
  const manifest=JSON.parse(await readFile(new URL('manifest.json',runtime),'utf8'));
  assert.match(manifest.sourceCommit,/^[a-f0-9]{40}$/);
  assert.equal(manifest.structures,9); assert.equal(manifest.clinicalApproved,false);
  assert.equal(manifest.patientDataIncluded,false);
  const found:string[]=[];
  async function walk(base:URL,prefix='') {
    for(const item of await readdir(base,{withFileTypes:true})) {
      assert(!item.isSymbolicLink());
      const path=prefix+item.name;
      if(item.isDirectory()) await walk(new URL(item.name+'/',base),path+'/');
      else found.push(path);
    }
  }
  await walk(runtime);
  assert.deepEqual(found.sort(),['manifest.json',...manifest.files.map((f:{path:string})=>f.path)].sort());
  for(const file of manifest.files) {
    assert(!file.path.includes('..') && !file.path.startsWith('/'));
    assert(!/\.(dcm|nii|nrrd|vmatlas|vmmr|vmcompare|map)(\.|$)/i.test(file.path));
    const bytes=await readFile(new URL(file.path,runtime));
    assert.equal(bytes.length,file.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
  }
  assert.equal(found.filter(p=>p.endsWith('.glb')).length,1);
});
test('module assets and attribution resolve inside the website',async()=>{
  const html=await readFile(new URL('index.html',runtime),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert(match[1].startsWith('/atlas-runtime/shoulder/'));
    await readFile(new URL(match[1].slice('/atlas-runtime/shoulder/'.length),runtime));
  }
  const licenses=JSON.parse(await readFile(new URL('bundled-dependencies.json',runtime),'utf8'));
  assert(licenses.length>10);
  for(const entry of licenses) assert(['MIT','ISC','Apache-2.0','BSD-2-Clause','BSD-3-Clause','CC0-1.0','0BSD'].includes(entry.license));
  const notices=await readFile(new URL('BUNDLED_NOTICES.txt',runtime),'utf8');
  for(const entry of licenses) assert(notices.includes(entry.name+'@'+entry.version));
  assert((await readFile(new URL('models/bodyparts3d/credits.html',runtime),'utf8')).includes('CC BY 4.0'));
});
test('website uses one real shoulder and does not imply a scan connection',async()=>{
  const entries=atlasModules.filter(m=>m.slug==='shoulder-3d');
  assert.equal(entries.length,1); assert.equal(entries[0].images,0); assert.equal(entries[0].structures,9);
  const source=await readFile(new URL('../app/atlas/shoulder-3d/page.tsx',import.meta.url),'utf8');
  assert.equal((source.match(/<iframe\b/g)||[]).length,1);
  assert(source.includes('src={moduleHref}'));
  assert(source.includes('No scan or spatial registration is connected'));
  assert(!source.includes('postMessage') && !source.includes('iframe src={'));
});
