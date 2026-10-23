// Public-source quarantine only. Never executes publisher code or installs assets.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261023-fda-shoulder-source';
const commit='fc9f3e56b104c06759750495be1f8dd5d53c1741';
const rows=[
 ['LICENSE',7048,'0e259d42c996742e9e3cba14c677129b2c1b6311'],
 ['README.md',1729,'6accf22968d19218be7500ec4430493882aa7e22'],
 ['Human Shoulder Finite Element Model ReadMe.docx',323670,'c6d3f7c75e29561a6ffd066465188621c5b5cd48'],
 ['Male-Shoulder.inp',59793091,'2341fbdf78044053e73877dcfb8d1928858be907'],
];
assert(!fs.existsSync(root));fs.mkdirSync(root);
const files=[];
for(const [name,bytes,blob]of rows){
 const url=`https://raw.githubusercontent.com/OSEL-DAM/ShoulderFiniteElementModel/${commit}/${encodeURIComponent(name)}`;
 const response=await fetch(url);assert(response.ok,`${name}: HTTP ${response.status}`);
 const data=Buffer.from(await response.arrayBuffer());assert.equal(data.length,bytes);
 assert.equal(createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex'),blob);
 fs.writeFileSync(root+'/'+name,data,{flag:'wx'});
 files.push({name,bytes,gitBlob:blob,sha256:createHash('sha256').update(data).digest('hex'),url});
}
const receipt={schema:'visible-medicine-public-model-quarantine/1',at:new Date().toISOString(),repository:'https://github.com/OSEL-DAM/ShoulderFiniteElementModel',commit,files,declaredLicense:'CC0-1.0',source:'https://cdrh-rst.fda.gov/human-shoulder-finite-element-model',status:'quarantined-not-admitted',publisherCodeExecuted:false,abaqusRequiredForTextInspection:false,clinicalApproval:false,registeredToBodyParts3D:false,patientSpaceRegistration:false,installed:false,previewChanged:false};
fs.writeFileSync(root+'/ACQUIRED.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,commit,files:files.map(({name,bytes,sha256})=>({name,bytes,sha256})),status:receipt.status}));
