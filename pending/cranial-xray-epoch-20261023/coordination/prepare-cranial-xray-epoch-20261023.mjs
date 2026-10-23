// Isolated test-only source-epoch repair; no normal Website operation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261023-cranial-xray-epoch',site=stage+'/website';
const receipt='F:/VisibleMedicine/staging/20261023-head-pan-bound/SOURCE_BOUND.json';
assert.equal(sha(read(receipt)),'d41eecb7d72f96eaa52b4ac494646e58cbd075f32ad337b26d309ff277fa1d2a');
const parent=json(receipt);assert(!fs.existsSync(stage));assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
fs.mkdirSync(site,{recursive:true});
const paths=['package.json','tsconfig.json','tests/clinical-review-intracranial-arterial-xray.test.ts','tests/atlas-emitted-teaching.ts','tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs','tests/fixtures/current-atlas-delivery.json'];
const rows=paths.map(p=>{const r=parent.sourceRows.find(r=>r.path===p);assert(r);assert.equal(sha(read(parent.website+'/'+p)),r.sha256);const to=site+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent.website+'/'+p,to,fs.constants.COPYFILE_EXCL);return r;});
fs.mkdirSync(site+'/tests/fixtures/cranial-xray-before');
fs.copyFileSync(site+'/tests/clinical-review-intracranial-arterial-xray.test.ts',site+'/tests/fixtures/cranial-xray-before/clinical-review-intracranial-arterial-xray.test.ts.raw',fs.constants.COPYFILE_EXCL);
const links=['atlas-review','public','lib','app','components','.local','node_modules'];
for(const p of links){assert(fs.statSync(parent.website+'/'+p).isDirectory());fs.symlinkSync(parent.website+'/'+p,site+'/'+p,'junction');}
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),website:site,parentReceipt:receipt,parentReceiptSha256:sha(read(receipt)),parentWebsite:parent.website,atlas:parent.atlas,rows,readOnlyParentDirectoryJunctions:links,productChanged:false,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,selectedInputs:rows.length,productChanged:false}));
