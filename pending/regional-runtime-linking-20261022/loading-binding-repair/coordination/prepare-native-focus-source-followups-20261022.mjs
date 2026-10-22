import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dirname} from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';

const stage='F:/VisibleMedicine/staging/20261022-native-focus-current-source-followups';
assert(!fs.existsSync(stage));
const receipt='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V6.json';
assert.equal(sha(read(receipt)),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c');
const source=json(receipt),website=source.website;
const pin=json(website+'/tests/fixtures/current-atlas-delivery.json');
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.reviewSourceFiles,1558);
const changes=[
 ["assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');",`assert.equal(pin.source,'${pin.source}');`],
 ["assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');",`assert.equal(pin.sourceTree,'${pin.sourceTree}');`],
 ['assert.equal(pin.reviewSourceFiles,1553);','assert.equal(pin.reviewSourceFiles,1558);'],
 ['assert.equal(binding.inputs.length,1710);','assert.equal(binding.inputs.length,1723);'],
];
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,'Exact current-role seam: '+from);return text.replace(from,to);};
const files=[];
function save(name,text){
 const path='tests/'+name,raw=read(website+'/'+path),code=Buffer.from(text);
 assert.equal(sha(raw),source.sourceRows.find(row=>row.path===path)?.sha256);
 assert(!raw.equals(code));
 for(const[kind,bytes]of[['RAW',raw],['CODE',code]]){const at=stage+'/'+kind+'/'+path;fs.mkdirSync(dirname(at),{recursive:true});fs.writeFileSync(at,bytes,{flag:'wx'});}
 files.push({path,rawSha256:sha(raw),codeSha256:sha(code),hunks:fullSourceInverse(raw,code)});
}
let focus=read(website+'/tests/native-focus-review-binding.test.mjs').toString();
for(const[from,to]of changes)focus=once(focus,from,to);
save('native-focus-review-binding.test.mjs',focus);
let witness=read(website+'/tests/head-binding-role-preservation-20261021.test.mjs').toString();
const start=witness.indexOf('const entries=['),end=witness.indexOf('\n];',start)+3;
assert(start>0&&end>start);
// Only replace the declared native-focus after-seams; all original offsets,
// before-buffers, other historical entries and mutation/refusal bodies remain.
const entries=JSON.parse(witness.slice(start+'const entries='.length,end-1));
const entry=entries.find(row=>row.name==='native-focus-review-binding.test.mjs');assert(entry);
for(const[from,to]of changes){
 const h=entry.hunks.filter(h=>h.after.includes(from));assert.equal(h.length,1);
 const oldAfter=h[0].after,newAfter=once(oldAfter,from,to);
 witness=once(witness,JSON.stringify(oldAfter),JSON.stringify(newAfter));h[0].after=newAfter;
}
save('head-binding-role-preservation-20261021.test.mjs',witness);
const result={at:new Date().toISOString(),sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),
 files,exactCurrentRoleSeams:changes,currentValidatorOrPinChanged:false,
 historicalOriginsAndRefusalsPreserved:true,sourceOnlyNotNativeAcceptance:true,
 candidateChanged:false,canonicalChanged:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/EVIDENCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,repairs:files.length,evidenceSha256:sha(read(stage+'/EVIDENCE.json')),candidateChanged:false}));
