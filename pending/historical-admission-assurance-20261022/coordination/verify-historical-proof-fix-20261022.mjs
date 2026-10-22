import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-historical-admission-assurance',first=json(root+'/combined/TERMINAL.json');
assert.equal(first.code,1);assert.deepEqual(first.commands[0].counts,{tests:86,pass:85,fail:1,cancelled:0,skipped:0,todo:0});
assert.deepEqual(first.commands[0].failed,['four complete original live-source roots retain every assertion outside exact current-role seams']);assert.deepEqual(first.sourceDrift,[]);
const path='tests/historical-admission-role-preservation.test.mjs',source=json(root+'/SOURCE.json'),before=read(root+'/preservation-before-order-fix.mjs');
assert.equal(sha(before),source.sourceRows.find(r=>r.path===path).sha256);
const from="  let inverse=after.toString();for(const[from,to]of [...row.seams].reverse()){assert.equal(inverse.split(to).length,2);inverse=inverse.replace(to,from);}assert.equal(inverse,before.toString());}",
 to="  const inverseSeams=row.name==='posterior-fossa-coverage.test.mjs'?row.seams:[...row.seams].reverse();\n  let inverse=after.toString();for(const[from,to]of inverseSeams){assert.equal(inverse.split(to).length,2);inverse=inverse.replace(to,from);}assert.equal(inverse,before.toString());}";
assert.equal(before.toString().split(from).length,2);assert.equal(read(source.website+'/'+path).toString(),before.toString().replace(from,to));
const result={at:new Date().toISOString(),firstNative:first.commands[0].counts,originalFailurePreserved:true,beforeSha256:sha(before),afterSha256:sha(read(source.website+'/'+path)),
 correction:'Only the new four-root whole-source witness changes: invert the specific overlapping posterior-fossa string-literal seam before its contained live assertion. Every original assertion/root and all product files remain unchanged.',
 productChanged:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/PROOF_FIX.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PROOF_FIX.json',sha256:sha(read(root+'/PROOF_FIX.json')),exactSingleWitnessCorrection:true}));
