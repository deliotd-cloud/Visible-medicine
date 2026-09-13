import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {atlasModules} from '../lib/catalog.ts';
test('thorax is discoverable as a 3D pilot, not a patient-imaging collection',async()=>{
  const entries=atlasModules.filter(m=>m.slug==='thorax-3d');assert.equal(entries.length,1);
  assert.equal(entries[0].structures,157);assert.equal(entries[0].images,0);assert.equal(entries[0].modality,'3D');
  const page=await readFile(new URL('../app/atlas/thorax-3d/page.tsx',import.meta.url),'utf8');
  assert.equal((page.match(/<iframe\b/g)||[]).length,1);
  assert(page.includes('src="/atlas-runtime/head-neck/index.html?region=thorax"'));
  assert(page.includes('No scan or spatial registration is connected'));assert(page.includes('lecture access remains separate'));
  const frame=await readFile(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');assert(frame.includes("pathname === '/atlas/thorax-3d'"));
});
test('thorax shares audited assets while retaining its own root and nested identities',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
  const scope=manifest.regionalScopes.find((s:{region:string})=>s.region==='thorax');assert(scope);
  assert.equal(new Set(scope.regionalIds).size,157);assert.equal(scope.nestedTargets.length,9);
  assert.deepEqual([...new Set(scope.nestedTargets.map((t:{study:string})=>t.study))].sort(),['cardiac','pulmonary']);
  for(const b of scope.bundles)assert(manifest.modelBundles.some((m:{url:string;sha256:string;bytes:number})=>m.url===b.url&&m.sha256===b.sha256&&m.bytes===b.bytes));
  assert.equal(new Set(manifest.modelBundles.map((b:{url:string})=>b.url)).size,130);
  for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false);
});
