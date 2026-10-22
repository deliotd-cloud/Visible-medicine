import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const stage=dirname(fileURLToPath(import.meta.url));
const name='clinical-review-thoracic-eus.test.ts';
const selected='F:/VisibleMedicine/staging/20261022-runtime-historical-consumers-batch3/tests/'+name;
const frozen='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/tests/'+name;
const queuePath='F:/VisibleMedicine/staging/20261022-clinical-runtime-family-consolidated/QUEUE.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const raw=readFileSync(join(stage,'RAW','tests',name));
const code=readFileSync(join(stage,'CODE','tests',name));
const queue=JSON.parse(readFileSync(queuePath));
const row=queue.repairs.find(item=>item.path==='tests/'+name);
assert(row);
assert.equal(row.proposal,selected);
assert.equal(row.proposalSha256,'4dcf1c38e50481d714db68ef0844f7178f1b5f5e294cc137d6e87827a8ad89b8');
assert.equal(sha(raw),row.proposalSha256);
assert.deepEqual(raw,readFileSync(selected),'complete selected 161-code preimage');
assert.equal(sha(readFileSync(frozen)),row.beforeSha256,'unchanged frozen original');
assert.equal(row.beforeSha256,'ec671a5e732fc1919c746dc9ffd79b8b26e622ac971289976039733e813e89ca');
const seams=[
 ['const deliveryPin=validateCurrentAtlasDelivery(),currentSource=CURRENT_ATLAS_REVISION;',
  'const pin=validateCurrentAtlasDelivery(),currentSource=CURRENT_ATLAS_REVISION;'],
 ['assert.equal(deliveryPin.source,currentSource);','assert.equal(pin.source,currentSource);'],
 ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);',
  'assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);'],
];
function inverse(bytes){
 let text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 for(const [current,prior] of seams){
  assert.equal(text.split(current).length,2,`exact unique inverse: ${current}`);
  text=text.replace(current,prior);
 }
 return Buffer.from(text);
}
assert.deepEqual(inverse(code),raw,'entire proposed CODE reconstructs selected 4dcf preimage');
assert.notDeepEqual(inverse(Buffer.concat([code,Buffer.from('\n// append mutant\n')])),raw,'append mutant refused');
const text=code.toString('utf8');
assert.throws(()=>inverse(Buffer.from(text.replace('const deliveryPin=','const alteredDeliveryPin='))),/exact unique inverse/,'missing binding seam refused');
assert.throws(()=>inverse(Buffer.from(text.replace('assert.equal(deliveryPin.source,currentSource);',
 'assert.equal(deliveryPin.source,currentSource);\n assert.equal(deliveryPin.source,currentSource);'))),/exact unique inverse/,'duplicate assertion seam refused');
assert.equal(text.split('validateCurrentAtlasDelivery()').length,2,'one unchanged strict validation call');
assert.equal(text.split("const pin=json('atlas-review/content/central-vessel-imaging-pins.json');").length,2,'original clinical pin intact');
assert.equal(text.split('deliveryPin.').length,3,'exact source and runtime-family uses');
console.log(`SOURCE-ONLY PASS selected=${sha(raw)} CODE=${sha(code)} frozen=${row.beforeSha256}`);
