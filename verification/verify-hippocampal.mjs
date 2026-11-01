import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const roots=[
 ['installed','F:/VisibleMedicine/website'],
 ['prepared','G:/VisibleMedicine-temp/staging/20261101-renal-website/website'],
];
const results=[];
const sha=value=>createHash('sha256').update(value).digest('hex');
for(const [kind,root] of roots){
 const clinical=await import(pathToFileURL(root+'/lib/head-hippocampal-clinical.ts'));
 const links=await import(pathToFileURL(root+'/lib/head-atlas-links.ts'));
 const packet=clinical.hippocampalClinicalPacket();
 const actual=sha(JSON.stringify(packet));
 const verified=await clinical.verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION);
 assert.equal(await clinical.verifiedHippocampalClinicalRevision('0'.repeat(64)),null);
 for(const key of ['clinicalApproval','publicationApproval','patientRegistration'])assert.equal(packet.content[key],false);
 results.push({kind,root,declared:clinical.HIPPOCAMPAL_CLINICAL_REVISION,actual,verified,
  files:['lib/head-hippocampal-clinical.ts','lib/head-atlas-links.ts','lib/head-atlas-import.ts','atlas-review/content/hippocampal-teaching.ts','atlas-review/content/cerebral-detail-ultrasound.ts'].map(file=>({path:file,sha256:sha(fs.readFileSync(root+'/'+file))})),
  invalidHeadRejected:true,clinicalApproval:false,publicationApproval:false,patientRegistration:false});
}
assert.notEqual(results[0].declared,results[0].actual);
assert.equal(results[0].verified,null);
assert.equal(results[1].declared,results[1].actual);
assert.equal(results[1].verified,results[1].actual);
assert.equal(results[0].actual,results[1].actual,'Candidate resolves the same installed packet, not different clinical content');
fs.writeFileSync(new URL('./HIPPOCAMPAL_SOURCE_CHECK.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),results,scope:'Read-only source execution; no scan opened, no decisions written, not a production build or installed repair.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(results.map(({kind,declared,actual,verified})=>({kind,declared,actual,verified}))));
