import {fileURLToPath} from 'node:url';
import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {historicalNonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {currentBindings,delivery,pins} from './atlas-spinal-study-specimen-fixture.ts';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const original={
  'app/body-content.ts':'361d9ad7ef7bed7df0fe36f1e5e21a4f93f6b5fcf1176726109f090a545d5fce',
  'content/spinal-disc-function.ts':'1d7d5f9883edea19a2339dd0c7da90d711ea9df6c3dfede922dd380ca307d4ef',
  'lib/spinal-disc-function.ts':'402ffd000cf3566b9bee54b71bf3e6a135846ce5a0b77245f94b6deae0fd3607',
};
const phrases=[
  'This source-labelled cervical disc participates in load transfer during neck movement.',
  'This source-labelled thoracic disc contributes to load transfer within the thoracic column.',
  'This source-labelled lumbar disc helps distribute loads between vertebral bodies.',
  'one source level remains unresolved.',
  'Source names do not automatically assign a two-vertebra patient imaging interval.',
  'Revision-bound radiologist review is pending.',
  'Case, Atlas and lecture access remain independent.',
  'https://anatomy.ttuhscep.edu/anatomytables/joints_back.html',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC2078298/',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC7311578/',
  'https://pubmed.ncbi.nlm.nih.gov/8951017/',
];
for(const epoch of ['transition','current'] as const)test(`${epoch} spinal Function remains source labelled without geometry or access claims`,()=>{
  const {inputs,runtime}=delivery(epoch);
  if(epoch==='transition')pins(inputs,original,epoch);
  else currentBindings(inputs,Object.keys(original));
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const emitted=runtime();
  for(const marker of phrases)assert.ok(emitted.includes(marker),`${epoch}: ${marker}`);
});
const website=fileURLToPath(new URL('../',import.meta.url));
const historicalNonregional='8d4d4abaa3c47259fb31d2c14f920c29f40ef28f';
const currentSource=CURRENT_ATLAS_REVISION;
const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const saved=(path:string)=>execFileSync('git',['show',`${historicalNonregional}:${path}`],{cwd:website,windowsHide:true,maxBuffer:32e6});
test('the original nonregional modules remain bound to their coherent saved export',()=>{
  const inventory=JSON.parse(saved('lib/atlas-model-inventory.json').toString());
  const sources=inventory.sources.filter((source:{module:string})=>source.module!=='head-neck');
  assert.deepEqual(sources,historicalNonregionalAtlasSources);
  for(const source of sources){
    const bytes=saved(`public/atlas-runtime/${source.module}/manifest.json`);
    assert.equal(digest(bytes),source.manifestSha256,source.module);
    const manifest=JSON.parse(bytes.toString());
    assert.equal(manifest.sourceCommit,source.sourceCommit,source.module);
  }
});
test('current spinal delivery retains the original model preservation proof',()=>{
  const previous=JSON.parse(execFileSync('git',['show','f7a09832ded47c0405ef378ad1d6a3f4ff223964:lib/atlas-model-inventory.json'],{cwd:website,encoding:'utf8',windowsHide:true}));
  const current=JSON.parse(readFileSync(website+'lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
});
test('current nonregional module manifests bind exact admitted Atlas source and emitted runtime bytes',()=>{
  const inventory=JSON.parse(readFileSync(website+'lib/atlas-model-inventory.json','utf8'));
  const expected={
    shoulder:{sha256:validateCurrentAtlasDelivery().documents['public/atlas-runtime/shoulder/manifest.json'],modelPaths:1},
    'female-pelvis':{sha256:validateCurrentAtlasDelivery().documents['public/atlas-runtime/female-pelvis/manifest.json'],modelPaths:2},
    'lower-limb':{sha256:validateCurrentAtlasDelivery().documents['public/atlas-runtime/lower-limb/manifest.json'],modelPaths:5},
  } as const;
  const sources=inventory.sources.filter((source:{module:string})=>source.module!=='head-neck');
  assert.deepEqual(sources.map((source:{module:string})=>source.module),Object.keys(expected));
  for(const source of sources){
    const expectedModule=expected[source.module as keyof typeof expected];
    const base=website+`public/atlas-runtime/${source.module}/`;
    const bytes=readFileSync(base+'manifest.json');
    assert.equal(digest(bytes),expectedModule.sha256,source.module);
    assert.equal(source.manifestSha256,expectedModule.sha256,source.module);
    assert.equal(source.sourceCommit,currentSource,source.module);
    assert.equal(source.modelPaths,expectedModule.modelPaths,source.module);
    const manifest=JSON.parse(bytes.toString());
    assert.equal(manifest.sourceCommit,currentSource,source.module);
    for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false,`${source.module}: ${flag}`);
    const runtime=(manifest.files as {path:string;bytes:number;sha256:string}[]).filter(file=>/\.(js|css|html)$/.test(file.path));
    assert.ok(runtime.length>0,`${source.module} emitted runtime`);
    for(const file of runtime){
      const data=readFileSync(base+file.path);
      assert.equal(data.length,file.bytes,`${source.module}: ${file.path}`);
      assert.equal(digest(data),file.sha256,`${source.module}: ${file.path}`);
    }
  }
});
