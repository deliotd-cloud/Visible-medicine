import assert from 'node:assert/strict';
import fs from 'node:fs';
import {join} from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';

const stage='F:/VisibleMedicine/staging/20261022-ui-dependent-source-followups';
assert(!fs.existsSync(stage));
const receipt='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V5.json';
assert.equal(sha(read(receipt)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
const source=json(receipt),website=source.website;
const priorUi=read(website+'/tests/ui-teaching-current-delivery.test.mjs');
const laterUi=read('F:/VisibleMedicine/staging/20261022-corpus-ui-current-followups/CODE/tests/ui-teaching-current-delivery.test.mjs');
assert.equal(sha(priorUi),'8dac3b76e058953603aac3b7124fb19f3b754870cac0d88166ba2531efde13a8');
assert.equal(sha(laterUi),'89125a0699029efb7186800ba761ecbe0748c052753424fc02fc36231f5f5913');
const seams=[
 ['  assert.equal(delivery.reviewSourceFiles, 1558);','  assert.equal(delivery.reviewSourceFiles, 1553);'],
 ['  assert.equal(inputs.inputs.length, 1723);','  assert.equal(inputs.inputs.length, 1710);'],
 ['    assert.equal(runtime.sourceCommit, delivery.runtimeSources[name], name);','    assert.equal(runtime.sourceCommit, current, name);'],
];
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
let restored=laterUi.toString();for(const[from,to]of seams)restored=once(restored,from,to);
assert.deepEqual(Buffer.from(restored),priorUi);
const helper=`// Test-only exact later UI source inverse; never a delivery validator or runtime fallback.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function restoreUiV5Source(bytes){
 assert.equal(sha(bytes),'${sha(laterUi)}','Exact complete later UI source required');
 let text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);
 for(const[from,to]of ${JSON.stringify(seams)}){
  assert.equal(text.split(from).length,2,'One exact later UI seam');text=text.replace(from,to);
 }
 const restored=Buffer.from(text);
 assert.equal(sha(restored),'${sha(priorUi)}','Entire historical V5 UI source retained');return restored;
}
`;
const write=(relative,bytes,kind)=>{
 const at=join(stage,kind,relative);fs.mkdirSync(join(at,'..'),{recursive:true});fs.writeFileSync(at,bytes,{flag:'wx'});
};
write('tests/ui-current-v5-source-inverse.mjs',helper,'CODE');
const files=[];
function change(name,transform){
 const path='tests/'+name,raw=read(website+'/'+path);
 assert.equal(sha(raw),source.sourceRows.find(row=>row.path===path)?.sha256);
 const code=Buffer.from(transform(raw.toString()));assert(!code.equals(raw));
 write(path,raw,'RAW');write(path,code,'CODE');
 files.push({path,rawSha256:sha(raw),codeSha256:sha(code),hunks:fullSourceInverse(raw,code)});
}
change('ui-teaching-lifecycle-contract.test.mjs',text=>{
 text=once(text,"import { fileURLToPath } from 'node:url';","import { fileURLToPath } from 'node:url';\nimport {restoreUiV5Source} from './ui-current-v5-source-inverse.mjs';");
 text=once(text,"const candidateSha = '8dac3b76e058953603aac3b7124fb19f3b754870cac0d88166ba2531efde13a8';",
  "const candidateSha = '8dac3b76e058953603aac3b7124fb19f3b754870cac0d88166ba2531efde13a8';\n// The complete historical lifecycle is replayed only after the later source is authenticated.\nconst historicalUi = encoding => {const bytes=restoreUiV5Source(readFileSync(candidateUrl));return encoding?bytes.toString(encoding):bytes;};");
 const replacements=[['readFileSync(candidateUrl)', 'historicalUi()'],["readFileSync(candidateUrl, 'utf8')","historicalUi('utf8')"]];
 // Leave the helper's one actual-current read intact, and bind all original lifecycle bodies to its exact inverse.
 const split=text.indexOf('\nfunction replaceOnce');assert(split>0);
 let body=text.slice(split);for(const[from,to]of replacements){assert(body.includes(from));body=body.split(from).join(to);}
 return text.slice(0,split)+body+`\ntest('later UI source is authenticated before the full historical lifecycle replay',()=>{
 const bytes=readFileSync(candidateUrl);assert.equal(sha(bytes),'${sha(laterUi)}');
 assert.equal(sha(restoreUiV5Source(bytes)),candidateSha);
 assert.throws(()=>restoreUiV5Source(Buffer.concat([bytes,Buffer.from('\\n// unknown')])));
});\n`;
});
const pin=json(website+'/tests/fixtures/current-atlas-delivery.json');
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
const bindingBytes=read(website+'/atlas-review/integration-inputs.json');
assert.equal(JSON.parse(bindingBytes).inputs.length,1723);
change('current-delivery-admission-485.test.mjs',text=>{
 text=once(text,"import test from 'node:test';","import test from 'node:test';\nimport {restoreUiV5Source} from './ui-current-v5-source-inverse.mjs';");
 text=once(text,"assert.equal(readFileSync('tests/ui-teaching-current-delivery.test.mjs','utf8'),current,",
  "assert.equal(restoreUiV5Source(readFileSync('tests/ui-teaching-current-delivery.test.mjs')).toString(),current,");
 const replacements=[
  ["assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');",`assert.equal(pin.source,'${pin.source}');assert.equal(pin.sourceTree,'${pin.sourceTree}');`],
  ["assert.equal(pin.reviewIntegration,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');assert.equal(pin.reviewSourceFiles,1553);",`assert.equal(pin.reviewIntegration,'${pin.reviewIntegration}');assert.equal(pin.reviewSourceFiles,1558);`],
  ["assert.equal(sha(bytes),'69092b905e27e50b748a73344214a050e35cd4eb345bcebe19887b6867b8b82d');",`assert.equal(sha(bytes),'${sha(bindingBytes)}');`],
  ['assert.equal(binding.inputs.length,1710);','assert.equal(binding.inputs.length,1723);'],
 ];
 for(const[from,to]of replacements)text=once(text,from,to);return text;
});
change('head-disclosure-current-delivery.test.mjs',text=>{
 for(const[from,to]of[
  ["assert.equal(now.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(now.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');",`assert.equal(now.source,'${pin.source}');assert.equal(now.sourceTree,'${pin.sourceTree}');`],
  ['assert.equal(now.reviewSourceFiles,1553);assert.equal(binding.inputs.length,1710);', 'assert.equal(now.reviewSourceFiles,1558);assert.equal(binding.inputs.length,1723);'],
  ["assert.equal(binding.sha256,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');",`assert.equal(binding.sha256,'${pin.reviewIntegration}');`],
 ])text=once(text,from,to);
 return text;
});
const evidence={at:new Date().toISOString(),sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),files,
 additions:[{path:'tests/ui-current-v5-source-inverse.mjs',sha256:sha(Buffer.from(helper))}],
 reason:'Dependent complete-source witnesses must compose the new UI source; separately update exact current Review source/count seams while preserving every historical assertion and refusal.',
 sourceInverseVerified:true,currentPinAndValidatorsChanged:false,nativeExecuted:false,candidateChanged:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/EVIDENCE.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,repairs:files.length,additions:1,sourceOnly:true,evidenceSha256:sha(read(stage+'/EVIDENCE.json'))}));
