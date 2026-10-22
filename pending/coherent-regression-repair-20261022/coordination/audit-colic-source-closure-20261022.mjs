import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const sourcePath=base+'/PRODUCT_SOURCE_V5.json';
assert.equal(sha(read(sourcePath)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
const source=json(sourcePath),queue=json(source.queue);
const witness=source.website+'/tests/colic-adapter-inverse.test.mjs';
assert.equal(sha(read(witness)),'8780092a4889681421adb5f696f06f28cdb5a29c157ba31271b38c1cf3ded0ff');
const rows=[...read(witness).toString('utf8').matchAll(/^ \['([^']+)',(\d+),'([a-f0-9]{64})','([a-f0-9]{64})'\],?$/gm)];
assert.equal(rows.length,13);
const result=[];
for(const [,name,hunks,patchSha,expected] of rows){
 const relative='tests/'+name,actual=sha(read(source.website+'/'+relative));
 const q=queue.repairs.find(row=>row.path===relative);
 const possible=[q?.beforePath,
  'F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/'+relative,
  'F:/VisibleMedicine/website/'+relative].filter(Boolean);
 const authenticatedPreimages=[...new Set(possible)].filter(path=>fs.existsSync(path)&&sha(read(path))===expected);
 result.push({path:relative,originalHunks:Number(hunks),originalPatchSha256:patchSha,originalForwardSha256:expected,
  actualV5Sha256:actual,alreadyExact:actual===expected,authenticatedPreimages,
  selectedRepair:q?{from:q.beforePath,to:q.proposal,beforeSha256:q.beforeSha256,codeSha256:q.proposalSha256}:null});
}
const directory='F:/VisibleMedicine/staging/20261022-colic-source-closure-audit';
assert(!fs.existsSync(directory));fs.mkdirSync(directory);
const report={at:new Date().toISOString(),sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),
 witnessSha256:sha(read(witness)),rows:result,alreadyExact:result.filter(row=>row.alreadyExact).length,
 sourceChangesNeedingAuthenticatedInverse:result.filter(row=>!row.alreadyExact).length,
 limits:'Source-hash audit only; no test execution, byte rewrite, native/whole-suite or clinical approval.'};
fs.writeFileSync(directory+'/RESULT.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:directory+'/RESULT.json',sha256:sha(read(directory+'/RESULT.json')),
 alreadyExact:report.alreadyExact,changed:result.filter(row=>!row.alreadyExact)}));
