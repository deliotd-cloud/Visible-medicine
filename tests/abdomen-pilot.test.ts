import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {atlasModules} from '../lib/catalog.ts';

test('abdomen is a compact 3D pilot with separate specimens, not a cleared imaging case',async()=>{
  const entries=atlasModules.filter(m=>m.slug==='abdomen-3d');assert.equal(entries.length,1);
  assert.equal(entries[0].structures,106);assert.equal(entries[0].images,0);assert.equal(entries[0].modality,'3D');
  const page=await readFile(new URL('../app/atlas/abdomen-3d/page.tsx',import.meta.url),'utf8');
  assert.equal((page.match(/<iframe\b/g)||[]).length,1);
  assert(page.includes('src="/atlas-runtime/head-neck/index.html?region=abdomen"'));
  for(const text of ['No scan or spatial registration is connected','lecture access remains separate','CC BY-SA 2.1 Japan','not registered to the main body'])assert(page.includes(text));
  const frame=await readFile(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');assert(frame.includes("pathname === '/atlas/abdomen-3d'"));
});

test('abdomen includes its full root/nested closure and independently licensed source specimens',async()=>{
  const runtime=new URL('../public/atlas-runtime/head-neck/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',runtime),'utf8'));
  const scope=manifest.regionalScopes.find((s:{region:string})=>s.region==='abdomen');assert(scope);
  assert.equal(new Set(scope.regionalIds).size,106);assert.equal(scope.nestedTargets.length,16);
  assert.deepEqual([...new Set(scope.nestedTargets.map((t:{study:string})=>t.study))].sort(),['hepatic','pancreatic','renal']);
  assert.deepEqual(scope.independentSpecimens.map((s:{key:string;license:string;surfaceIds:string[];studyIds:string[]})=>[s.key,s.license,s.surfaceIds.length,s.studyIds.length]),[
    ['bp3d3-abdominal-wall','CC BY-SA 2.1 JP',29,7],['hra-united-female-v1.10-kidneys','CC BY 4.0',82,9],
  ]);
  for(const b of scope.bundles)assert(manifest.modelBundles.some((m:{url:string;sha256:string;bytes:number})=>m.url===b.url&&m.sha256===b.sha256&&m.bytes===b.bytes));
  for(const name of ['models/bodyparts3d-v3/abdominal-wall/NOTICE.md','models/bodyparts3d-v3/abdominal-wall/license-legalcode.html','models/bodyparts3d-v3/abdominal-wall/specimen-data.ts.txt','models/hra-renal/NOTICE.md','models/hra-renal/source-metadata.json']){
    assert(manifest.files.some((f:{path:string})=>f.path===name));assert((await readFile(new URL(name,runtime))).length>0);
  }
  const catalog=JSON.parse(await readFile(new URL('models/hra-renal/catalog.json',runtime),'utf8'));
  assert(!catalog.structures.some((s:{sourceName:string})=>['VH_F_outer_cortex_of_kidney_L','VH_F_renal_column_R','VH_F_left_renal_vein'].includes(s.sourceName)));
  for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false);
});
