import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
export const stage='F:/VisibleMedicine/staging/20261024-pancreatic-us-website',site=stage+'/website';
export function sourceRows(){
 const prep=json(stage+'/PREPARATION.json'),manifest=json(site+'/atlas-review/manifest.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
 const paths=new Set(prep.baseSourceRows.map(r=>r.path));
 for(const p of ['atlas-review/manifest.json','atlas-review/integration-inputs.json',...manifest.files.map(r=>'atlas-review/'+r.path),'public/atlas-review-viewer/manifest.json',...viewer.files.map(r=>'public/atlas-review-viewer/'+r.path)])paths.add(p);
 for(const n of ['shoulder','head-neck','lower-limb','female-pelvis']){
  const base='public/atlas-runtime/'+n+'/';paths.add(base+'manifest.json');
  for(const r of json(site+'/'+base+'manifest.json').files)paths.add(base+r.path);
 }
 for(const p of ['tests/head-layout-history-adapter.mjs','tests/head-layout-history-adapter.test.mjs','tests/head-layout-current-delivery.test.mjs','tests/orbital-ct-current-source-role.mjs','tests/orbital-ct-current-source-role.test.mjs','tests/orbital-ct-website-composition.test.mjs','tests/fixtures/current-atlas-delivery-studio-b79.mjs.raw'])paths.add(p);
 for(const p of ['tests/toolbar-current-source-role.mjs','tests/toolbar-current-source-role.test.mjs','tests/toolbar-website-composition.test.mjs'])paths.add(p);
 for(const p of ['tests/pancreatic-us-current-source-role.mjs','tests/pancreatic-us-current-source-role.test.mjs','tests/pancreatic-us-website-composition.test.mjs','tests/pancreatic-us-review-pager-history.mjs'])paths.add(p);
 if(fs.existsSync(stage+'/HEAD_HISTORY_INTEGRATION.json'))for(const p of json(stage+'/HEAD_HISTORY_INTEGRATION.json').files)paths.add(p.path);
 return [...paths].sort().map(p=>{const stat=fs.lstatSync(site+'/'+p);assert(stat.isFile()&&!stat.isSymbolicLink(),p);return{path:p,bytes:stat.size,sha256:hash(site+'/'+p)};});
}
