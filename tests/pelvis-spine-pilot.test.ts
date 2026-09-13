import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {atlasModules} from '../lib/catalog.ts';
test('pelvis and spine expose complete contained scopes without imaging or review approval',async()=>{
  const runtime=new URL('../public/atlas-runtime/head-neck/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',runtime),'utf8'));
  const frame=await readFile(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');
  for(const[region,roots,nested,specimens]of [['pelvis',81,4,6],['spine',115,0,1]] as const){
    const entries=atlasModules.filter(m=>m.slug===region+'-3d');assert.equal(entries.length,1);assert.equal(entries[0].structures,roots);assert.equal(entries[0].images,0);
    const scope=manifest.regionalScopes.find((s:{region:string})=>s.region===region);assert(scope);
    assert.equal(new Set(scope.regionalIds).size,roots);assert.equal(scope.nestedTargets.length,nested);assert.equal(scope.independentSpecimens.length,specimens);
    for(const bundle of scope.bundles)assert(manifest.modelBundles.some((b:{url:string;sha256:string;bytes:number})=>b.url===bundle.url&&b.sha256===bundle.sha256&&b.bytes===bundle.bytes));
    const page=await readFile(new URL('../app/atlas/'+region+'-3d/page.tsx',import.meta.url),'utf8');
    assert.equal((page.match(/<iframe\b/g)||[]).length,1);assert(page.includes('src="/atlas-runtime/head-neck/index.html?region='+region+'"'));
    assert(frame.includes("pathname === '/atlas/"+region+"-3d'"));
    for(const phrase of ['No scan or spatial registration is connected','lecture access remains separate','not registered to the main body'])assert(page.includes(phrase));
  }
  for(const path of ['models/bodyparts3d-v3/back-layers/NOTICE.md','models/bodyparts3d-v3/back-layers/license-legalcode.html','models/bodyparts3d-v3/back-layers/specimen-data.ts.txt','models/hra-pelvis/source-metadata.json','models/um-limb/MODEL_NOTICE.md','LICENSES/um-lower-limb-v1-2/readme.txt'])assert(manifest.files.some((f:{path:string})=>f.path===path));
  for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false);
});
