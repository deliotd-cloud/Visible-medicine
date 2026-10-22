import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const sha=b=>createHash('sha256').update(b).digest('hex');
const recorded=JSON.parse(fs.readFileSync(website+'/atlas-review/integration-inputs.json'));
let source=fs.readFileSync(website+'/scripts/bind-clinical-review.mjs','utf8');
for(const line of ["import { readFileSync, writeFileSync, readdirSync } from 'node:fs';","import { createHash } from 'node:crypto';"]){assert.equal(source.split(line).length,2);source=source.replace(line,'');}
function replay(readOwnWrites){
 const writes=new Map();
 const read=path=>readOwnWrites&&writes.has(path)?Buffer.from(writes.get(path)):fs.readFileSync(join(website,path));
 new Function('readFileSync','writeFileSync','readdirSync','createHash','console',source)(read,
  (path,value)=>writes.set(path,value),(path,options)=>fs.readdirSync(join(website,path),options),createHash,{log(){}});
 assert.equal(writes.size,4);
 return JSON.parse(writes.get('atlas-review/integration-inputs.json'));
}
const fake=replay(false),real=replay(true);
assert.deepEqual(fake.inputs,real.inputs,'Same-run derived writes cannot change the integration-input list');
const previous=new Map(recorded.inputs.map(row=>[row.path,row.sha256]));
const replayed=new Map(real.inputs.map(row=>[row.path,row.sha256]));
assert.equal(previous.size,recorded.inputs.length);assert.equal(replayed.size,real.inputs.length);
const result={at:new Date().toISOString(),recorded:{sha256:recorded.sha256,count:recorded.inputs.length},
 replay:{sha256:real.sha256,count:real.inputs.length},
 missingFromBinder:recorded.inputs.filter(row=>!replayed.has(row.path)),
 missingFromRecorded:real.inputs.filter(row=>!previous.has(row.path)),
 changed:real.inputs.filter(row=>previous.has(row.path)&&previous.get(row.path)!==row.sha256),
 equalSortedRows:sha(JSON.stringify([...recorded.inputs].sort((a,b)=>a.path.localeCompare(b.path))))===sha(JSON.stringify(real.inputs)),
 sourceBinderSha256:sha(fs.readFileSync(website+'/scripts/bind-clinical-review.mjs')),
 candidateChanged:false,ownerPreviewChanged:false,realFilesystemWrites:0};
const stage='F:/VisibleMedicine/staging/20261022-current-binder-diagnosis';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
fs.writeFileSync(stage+'/EVIDENCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
