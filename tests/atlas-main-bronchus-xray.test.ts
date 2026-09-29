import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('sided main-bronchus X-ray drafts retain their source bindings and release boundaries',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'4c546a73ea08bac20bc887ceda2abfd1e7e83557849311e14231ad5c4ac29b7f');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'2c9d80ba1eaba9f520a7da9ac7fcb1201ca42a65');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'content/main-bronchus-xray.ts':'20f0d740967f88c06c28a09d1ea7f9becae8fd3299756c178c8898d46294f683',
    'lib/main-bronchus-xray.ts':'5d5530f56c2a54843cb284f7ff83b03c5de5f651d9031aa870526acb2afcf9d6',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const marker of ['FMA7395','FMA7396','visible right main-bronchial air column',
    'visible left main-bronchial air column','X-ray orientation · draft',
    'No X-ray image, detector geometry or registered correspondence is loaded',
    'Imaging-atlas and paid-lecture access remain independent',
    'https://ehealth.kcl.ac.uk/tel/radiology/CXR/03-02-lungs.html',
    'https://www.radiologymasterclass.co.uk/tutorials/chest/chest_home_anatomy/chest_anatomy_page1',
  ])assert.ok(runtime.includes(marker),marker);
  const before=JSON.parse(execFileSync('git',['show','d3e48f4ff3b6012af76c5eb27a61a743f02aa9fa:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
});
