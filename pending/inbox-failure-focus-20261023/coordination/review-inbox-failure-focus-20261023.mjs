// Main-owned isolated preparation. Never changes the owner preview or sealed parent.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-review-inbox-failure-focus';
const parent='F:/VisibleMedicine/staging/20261023-current-ui-delivery';
const receipt=fs.readFileSync(parent+'/SOURCE_CURRENT.json');
const sha=data=>createHash('sha256').update(data).digest('hex');
assert.equal(sha(receipt),'bd073fb1d6134af415e8b77f82ba218a1756e47af2c2ab503459e711ea8a6cc8');
const source=JSON.parse(receipt),site=stage+'/website';
const files=['components/ClinicalReviewInbox.tsx','components/clinical-review-inbox.css','package.json',
  'tests/clinical-review-inbox-auto-return.test.mjs','tests/clinical-review-inbox-pagination-focus.test.mjs',
  'tests/clinical-review-inbox-filter-recovery.test.mjs','tests/clinical-review-ui-simplification.test.ts'];
if(process.argv.includes('--supplement-config')){
  assert(fs.existsSync(stage+'/PREPARATION.json'));
  const file='tsconfig.json',bytes=fs.readFileSync(source.website+'/'+file),row=source.sourceRows.find(r=>r.path===file);
  assert.equal(sha(bytes),row.sha256);assert(!fs.existsSync(site+'/'+file));
  fs.writeFileSync(site+'/'+file,bytes,{flag:'wx'});
  fs.writeFileSync(stage+'/SUPPLEMENTAL_INPUTS.json',JSON.stringify({at:new Date().toISOString(),parentReceiptSha256:sha(receipt),sourceRows:[row],reason:'Thin preparation omitted the unchanged project JSX configuration. Two original esbuild-based component harnesses therefore used classic JSX and failed before assertions. Copy the exact parent configuration, without changing product or old tests.',oldFailureLogsPreserved:true},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({addedUnchangedConfig:file,sha256:row.sha256,existingTestsOrProductChanged:false}));process.exit(0);
}
assert(!fs.existsSync(stage));fs.mkdirSync(site,{recursive:true});
const rows=[];
for(const file of files){
  const bytes=fs.readFileSync(source.website+'/'+file),row=source.sourceRows.find(r=>r.path===file);
  assert.equal(sha(bytes),row.sha256,file);const target=site+'/'+file;
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});rows.push({...row});
}
fs.copyFileSync(site+'/components/ClinicalReviewInbox.tsx',stage+'/ClinicalReviewInbox.before.raw',fs.constants.COPYFILE_EXCL);
for(const name of ['lib','node_modules'])fs.symlinkSync(source.website+'/'+name,site+'/'+name,'junction');
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),parent:source.website,parentReceipt:parent+'/SOURCE_CURRENT.json',parentReceiptSha256:sha(receipt),site,sourceRows:rows,readThroughJunctions:['lib','node_modules'],thinSourceOnly:true,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,site,copied:rows.length,generatedOrPrivateInputsChanged:false,previewChanged:false}));
