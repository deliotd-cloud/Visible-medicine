import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const site='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const frame=readFileSync(site+'tests/fixtures/atlas-runtime-expansion-before-20261022/AtlasRuntimeFrame.tsx.raw');
const binder=readFileSync(site+'tests/fixtures/atlas-runtime-expansion-before-20261022/bind-clinical-review.mjs.raw');
const checks=[
 {
  name:'c4a',binding:'tests/fixtures/drawable-epoch-preimage/documents/atlas-review/integration-inputs.json',
  alternative:path=>new Set(['atlas-review/app/body-explorer.css','docs/anatomy-coverage/index.json','lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs']).has(path)?
   'tests/fixtures/drawable-epoch-preimage/binding-inputs/'+path+'.raw':
   new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json','atlas-review/content/regional-teaching/abdomen.json']).has(path)?
   'tests/fixtures/colic-fa1-preimage/binding-inputs/'+path+'.raw':path,
 },
 {
  name:'fa1',binding:'tests/fixtures/colic-fa1-preimage/documents/atlas-review/integration-inputs.json.raw',
  alternative:path=>new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json',
   'atlas-review/content/regional-teaching/abdomen.json','docs/anatomy-coverage/index.json',
   'lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs']).has(path)?
   'tests/fixtures/colic-fa1-preimage/binding-inputs/'+path+'.raw':path,
 },
];
for(const check of checks){
 const binding=JSON.parse(readFileSync(site+check.binding));
 assert.equal(binding.inputs.length,1719,check.name+': unchanged row count');
 const failures=[];
 for(const row of binding.inputs){
  const bytes=row.path==='components/AtlasRuntimeFrame.tsx'?frame:
   row.path==='scripts/bind-clinical-review.mjs'?binder:
   readFileSync(site+check.alternative(row.path));
  if(sha(bytes)!==row.sha256)failures.push(row.path);
 }
 console.log(check.name+': '+(1719-failures.length)+'/1719 historical binding rows closed');
 if(failures.length)console.log(check.name+' unmatched: '+failures.join(', '));
 assert.deepEqual(failures,[],check.name+': complete original binding history');
}
