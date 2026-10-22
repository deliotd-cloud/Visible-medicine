import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const staged='F:/VisibleMedicine/staging/20261022-head-pilot-history-followups/tests';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceReceipt=readFileSync('F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V5.json');
assert.equal(sha(sourceReceipt),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
const rows=new Map(JSON.parse(sourceReceipt).sourceRows.map(row=>[row.path,row.sha256]));
for(const file of [
 'head-neck-pilot-history-preservation.test.mjs',
 'head-pilot-delivery-role-preservation-20261021.test.mjs',
 'head-neck-pilot.test.ts',
 'head-neck-pilot-current.test.mjs',
])assert.equal(sha(readFileSync(join(website,'tests',file))),rows.get('tests/'+file),
 `Frozen V5 input: ${file}`);
const reports=[];
for(const [file,expectedTests] of [
 ['head-neck-pilot-history-preservation.test.mjs',4],
 ['head-pilot-delivery-role-preservation-20261021.test.mjs',2],
]){
 const bytes=readFileSync(join(staged,file));
 const baseline=readFileSync(join(website,'tests',file));
 const testUrl=pathToFileURL(join(website,'tests',file)).href;
 let source=bytes.toString('utf8').replace(/^import .*;\r?\n/gm,'');
 source=source.replaceAll('import.meta.url',JSON.stringify(testUrl));
 let count=0;
 const pending=[];
 const historical= file.startsWith('head-pilot-delivery')
  ? await import(pathToFileURL(join(website,'tests','historical-head-pilot-87-read.mjs')).href)
  : {};
 const test=(title,fn)=>{
  const result=fn();
  pending.push(Promise.resolve(result).then(()=>reports.push({file,title,pass:true})));
  count++;
 };
 const execute=new Function('assert','createHash','readFileSync','test','Buffer',
  'createClosedHead87Reader','readHead87File','listHead87Directory','historicalHead87Runtime',source);
 execute(assert,createHash,readFileSync,test,Buffer,
  historical.createClosedHead87Reader,historical.readHead87File,historical.listHead87Directory,
  historical.historicalHead87Runtime);
 await Promise.all(pending);
 assert.equal(count,expectedTests);
 reports.push({file,baselineSha256:sha(baseline),codeSha256:sha(bytes),executedTheorems:count});
}
console.log(JSON.stringify({kind:'source-only reconstructed original theorem',sourceReceiptSha256:sha(sourceReceipt),reports},null,2));
