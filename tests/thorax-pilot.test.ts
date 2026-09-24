import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {atlasModules} from '../lib/catalog.ts';
test('thorax is discoverable as a 3D pilot, not a patient-imaging collection',async()=>{
  const entries=atlasModules.filter(m=>m.slug==='thorax-3d');assert.equal(entries.length,1);
  assert.equal(entries[0].structures,158);assert.equal(entries[0].images,0);assert.equal(entries[0].modality,'3D');
  const page=await readFile(new URL('../app/atlas/thorax-3d/page.tsx',import.meta.url),'utf8');
  assert.equal((page.match(/<iframe\b/g)||[]).length,1);
  assert(page.includes('src="/atlas-runtime/head-neck/index.html?region=thorax"'));
  assert(page.includes('No scan or spatial registration is connected'));assert(page.includes('lecture access remains separate'));
  const frame=await readFile(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');assert(frame.includes("pathname === '/atlas/thorax-3d'"));
});
test('thorax shares audited assets while retaining its own root and nested identities',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
  const scope=manifest.regionalScopes.find((s:{region:string})=>s.region==='thorax');assert(scope);
  assert.equal(new Set(scope.regionalIds).size,158);assert.equal(scope.nestedTargets.length,9);
  assert.deepEqual([...new Set(scope.nestedTargets.map((t:{study:string})=>t.study))].sort(),['cardiac','pulmonary']);
  for(const b of scope.bundles)assert(manifest.modelBundles.some((m:{url:string;sha256:string;bytes:number})=>m.url===b.url&&m.sha256===b.sha256&&m.bytes===b.bytes));
  assert.equal(new Set(manifest.modelBundles.map((b:{url:string})=>b.url)).size,134);
  for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false);
});

test('thorax respiratory source studies are available in the shared viewer',async()=>{
  const runtime=new URL('../public/atlas-runtime/head-neck/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',runtime),'utf8'));
  const inputs=JSON.parse(await readFile(new URL('source-inputs.json',runtime),'utf8')) as {path:string;sha256:string}[];
  assert.equal(inputs.find(input=>input.path==='content/thorax-respiratory-study.ts')?.sha256,
    '4631768eb5bf6e210231e0e3e9e3ba43a2fd6eccb23fda415c2964c964e9c0ba');
  const slider=(manifest.files as {path:string;sha256:string}[]).find(file=>/^assets\/slider-.*\.js$/.test(file.path));
  assert.ok(slider);
  const bytes=await readFile(new URL(slider.path,runtime));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),slider.sha256);
  const script=bytes.toString();
  const studies=script.match(/([\w$]+)=\[\{id:`respiratory-wall-overview`,title:`Respiratory wall layers & diaphragm`/);
  assert.ok(studies,'the wall overview is included in the emitted study catalog');
  assert.ok(script.includes('id:`respiratory-intercostal-comparison`,title:`Intercostal layer comparison`'));
  assert.ok(script.includes('id:`respiratory-diaphragm`,title:`Diaphragm source surface`'));
  assert.match(script,new RegExp(`for\\(let [\\w$]+ of ${studies[1]}\\).*thorax\\.focuses\\.push\\(\\{id:`));
  assert.ok(script.includes('requiredSourceBindings:'),'the focus list retains source guards');
});
