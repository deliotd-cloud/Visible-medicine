// A separate source candidate; never changes installed Atlas/website or owner preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const source='F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/atlas';
const target='F:/VisibleMedicine/staging/20261022-renal-tour-source-candidate/atlas';
assert(!fs.existsSync(target));assert.equal(runGit(['-C',source,'rev-parse','HEAD']).toString().trim(),'389bd0ca846a42c7f21055f55904bcf5df81a09f');assert.equal(runGit(['-C',source,'status','--porcelain']).toString().trim(),'');
runGit(['clone','--shared',source,target]);fs.symlinkSync('F:/VisibleMedicine/atlas/node_modules',target+'/node_modules','junction');
const p=json('CURRENT_CHECKPOINT.json').activeWork.current;
assert.equal(p.sourceReceiptSha256,'67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed');
const current=json(p.sourceReceipt),roots=json('F:/VisibleMedicine/staging/20261022-head-tools-consumer-admission/native-wider/INPUTS.json').tests.map(r=>r.path);
const already=json('F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor/NATIVE_PLAN.json').tests;
const tests=[...new Set([...roots,...already])].sort();assert(tests.length<=200);
for(const t of tests)assert(current.sourceRows.some(r=>r.path===t),t);
const root='F:/VisibleMedicine/staging/20261022-renal-tour-source-candidate';
fs.writeFileSync(root+'/BROAD_NATIVE_PLAN.json',JSON.stringify({sourceReceipt:p.sourceReceipt,sourceReceiptSha256:p.sourceReceiptSha256,evidence:root+'/native-website-predecessor',tests,
 scope:'Reassess corrected historical/current-source consumers and native head behavior against the exact immutable6182website before any further Atlas import. Prior failures remain evidence; not a whole-suite or clinical certificate.'},null,2)+'\n',{flag:'wx'});
const receipt={at:new Date().toISOString(),source,target,head:runGit(['-C',target,'rev-parse','HEAD']).toString().trim(),tree:runGit(['-C',target,'rev-parse','HEAD^{tree}']).toString().trim(),websiteSource:p.sourceReceipt,websiteSourceSha256:sha(read(p.sourceReceipt)),broadNativeRoots:tests.length,canonicalInstalled:false,ownerPreviewChanged:false};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
