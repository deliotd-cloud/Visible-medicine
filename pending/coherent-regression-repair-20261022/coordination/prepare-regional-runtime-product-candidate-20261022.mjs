// Isolated product overlay: the test-only assembler retains its stricter boundary.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {materializeReviewedRegressionCandidate,containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';

const queue='F:/VisibleMedicine/staging/20261022-clinical-runtime-family-consolidated/QUEUE.json';
const stage='F:/VisibleMedicine/staging/20261022-regional-mri-runtime-linking';
const targetRoot='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const base='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const list=(root,relative='')=>fs.readdirSync(path.join(root,relative),{withFileTypes:true}).flatMap(item=>{
 const next=relative?relative+'/'+item.name:item.name;
 assert(!item.isSymbolicLink());return item.isDirectory()?list(root,next):[next];
}).sort();
const files=list(stage+'/CODE');
assert.equal(files.length,27,'Explicit nine existing production files, one helper, seventeen tests');
assert.equal(files.filter(p=>p.startsWith('lib/')).length,10);
assert.equal(files.filter(p=>p.startsWith('tests/')).length,17);
const additions=['lib/regional-atlas-runtime-binding.ts'];
const integration=json(base+'/atlas-review/integration-inputs.json');
const overlay=files.map(relative=>{
 assert.match(relative,/^(?:lib|tests)\/[a-z0-9-]+(?:\.test)?\.ts$/);
 const proposal=containedTarget(stage+'/CODE',relative),bytes=read(proposal);
 const original=base+'/'+relative,isNew=additions.includes(relative);
 assert.equal(fs.existsSync(original),!isNew);
 const beforeSha256=isNew?null:sha(read(stage+'/RAW/'+relative));
 if(!isNew)assert.equal(sha(read(original)),beforeSha256,relative+': frozen preimage');
 assert(!integration.inputs.some(row=>row.path===relative),'Bound Review input requires independent rebind: '+relative);
 return {path:relative,from:proposal,bytes:bytes.length,sha256:sha(bytes),beforeSha256};
});
const queueBytes=read(queue),q=JSON.parse(queueBytes);
assert.equal(q.repairs.length,161);assert.equal(q.additionalFiles.length,65);
const result=materializeReviewedRegressionCandidate({queuePath:queue,queueSha256:sha(queueBytes),expectedProposals:161,targetRoot});
const prepared=json(targetRoot+'/PREPARED.json'),rows=new Map(prepared.sourceRows.map(row=>[row.path,row]));
for(const row of overlay){
 const destination=containedTarget(result.website,row.path);
 if(row.beforeSha256!==null)assert.equal(sha(read(destination)),row.beforeSha256,'No overlapping staged repair: '+row.path);
 else assert(!fs.existsSync(destination));
 assert.equal(sha(read(row.from)),row.sha256,'Closed proposal bytes');
 fs.copyFileSync(row.from,destination);assert.equal(sha(read(destination)),row.sha256);
 rows.set(row.path,{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
const sourceRows=[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path));
for(const row of sourceRows)assert.equal(sha(read(result.website+'/'+row.path)),row.sha256,'Closed assembled source: '+row.path);
fs.writeFileSync(targetRoot+'/PRODUCT_SOURCE.json',JSON.stringify({at:new Date().toISOString(),website:result.website,
 queue,queueSha256:sha(queueBytes),testAssembly:targetRoot+'/PREPARED.json',overlay,sourceRows,
 reviewBindingInputsChanged:0,clinicalApproval:false,patientRegistration:false,canonicalOrFrozenEdited:false,ownerPreviewChanged:false,
 phase:'assembled-product-native-validation-pending'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...result,productFiles:overlay.length,sourcePaths:sourceRows.length,sourceReceipt:targetRoot+'/PRODUCT_SOURCE.json'}));
