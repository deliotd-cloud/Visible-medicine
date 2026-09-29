import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

test('regional correction preserves old models and binds the reviewed lower-neck and celiac implementation',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'6e76d15024ebbd296bfd642ce2ba66d4f1aa116ab2b737f26046cf306a48df73');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'922b99a18d917376ba14493e2743ae4d09b84988');
  assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
  assert.equal(manifest.regionalScopes.length,12);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,hash] of Object.entries({
    'content/lower-neck-study-pins.json':'1e6dab5b8cad36ddd54c6734c2ae0f8f3370f366390e631ff1e3fb8da4990843',
    'content/lower-neck-study.ts':'792618b31ed43df22c4bff4c1ff8a1649166a6353044a9b4ae75289bfe79cb0d',
    'lib/lower-neck-study.ts':'13e3a214881916a0ab260743cc6a9e7aa77edd33ff2ca5add220e46d4cfa1b4d',
    'lib/body-display-catalog.ts':'b5dc9cf1cf661bda6a232cfaeccf8473c6eba19da2975107d91e29ac21bcdef8',
    'lib/abdominal-arterial.ts':'23f20b2c03f6b4e2fbe13d47de0af0ba0ad25e36dc8baae4439b43448531fe03',
    'lib/central-vessel-imaging.ts':'d350763dc2518e42b158d907e8289e7b7e50bc45c53314a25160c0924d4fa4bb',
  })) assert.equal(inputs.find(f=>f.path===path)?.sha256,hash);
  const runtime=manifest.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return b.toString();}).join('\n');
  assert(runtime.includes('lower-neck-vessels-scalenes'));assert(runtime.includes('celiac-display-corrected'));
  const correction=JSON.parse(readFileSync(base+'models/bodyparts3d/celiac-display/display-correction.json','utf8'));
  assert.deepEqual(correction.replacement,{...correction.original,bundle:'celiac-display-corrected'});
  const bytes=readFileSync(base+'models/bodyparts3d/celiac-display/celiac-display.glb');
  assert.equal(bytes.length,5604);assert.equal(sha(bytes),'4f431242839c255ae2320b4004c537a4c2defb7d0cd7b51fdea60f7ba3c09e8f');
  const prior=JSON.parse(execFileSync('git',['show','0755514ba326eb5d70c20da229cd26ebff64ee4d:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models).filter((m:{sha256:string})=>m.sha256!==correction.bundle.sha256&&m.sha256!=='4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12'),prior.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
});
