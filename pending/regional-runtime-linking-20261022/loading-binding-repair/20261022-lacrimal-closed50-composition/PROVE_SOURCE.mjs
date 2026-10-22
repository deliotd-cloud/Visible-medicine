import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {dirname, join} from 'node:path';

const stage=dirname(fileURLToPath(import.meta.url));
const site='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const candidate='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytes=path=>readFileSync(path);
const raw=bytes(join(stage,'RAW/tests/lacrimal-current-transition.test.mjs'));
const code=bytes(join(stage,'CODE/tests/lacrimal-current-transition.test.mjs'));
const live=bytes(join(site,'tests/lacrimal-current-transition.test.mjs'));
const receipt=bytes(join(candidate,'PRODUCT_SOURCE_V6.json'));
assert.equal(sha(raw),'31c6b7e117eb98032ea3374cac36ee3ce0d0a33db39034884b4697297c059917','RAW identity');
assert.equal(sha(code),'05e1c9cb23419576462928813a24c65bf0c95a216ab8a85e191e564284a209ca','CODE identity');
assert.equal(sha(receipt),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c','V6 source receipt identity');
assert.deepEqual(raw,live,'Frozen candidate lacrimal preimage');
assert.equal(sha(bytes(join(site,'tests/deep-plantar-current-transition.test.mjs'))),'7829cee2a88f7df10b326bcc9efa0dd786bbaed4f64757fe3754bd94b0ff5845','V6 deep source identity');

const rawText=raw.toString(),codeText=code.toString();
const first="test('closed50 keeps every original proof byte and only declared test seams change'";
const next="\ntest('current51 retains 71 required and eight optional scopes with unchanged owners and acceptance'";
const rawStart=rawText.indexOf(first),codeStart=codeText.indexOf(first);
const rawEnd=rawText.indexOf(next,rawStart),codeEnd=codeText.indexOf(next,codeStart);
assert(rawStart>=0&&codeStart>=0&&rawEnd>rawStart&&codeEnd>codeStart,'Exact theorem boundaries');
assert.equal(codeText.slice(0,codeStart),rawText.slice(0,rawStart),'Unchanged test prefix');
assert.equal(codeText.slice(codeEnd),rawText.slice(rawEnd),'Unchanged subsequent theorem tail');
assert.deepEqual(Buffer.from(codeText.slice(0,codeStart)+rawText.slice(rawStart,rawEnd)+codeText.slice(codeEnd)),live,'Full CODE-to-V6 lacrimal inverse');

const base=pathToFileURL(site+'/').href;
const h50=await import(base+'tests/historical-lacrimal-delivery-50.mjs');
const h51=await import(base+'tests/historical-radial-eus-delivery-51.mjs');
const h53=await import(base+'tests/historical-head-manual-recovery-delivery-53.mjs');
const inputHashes=new Map(JSON.parse(h51.readRevision51('atlas-review/integration-inputs.json')).inputs.map(row=>[row.path,row.sha256]));
const read=path=>{
 const prior=h51.readRevision51(path),expected=inputHashes.get(path);
 if(!expected||sha(prior)===expected)return prior;
 const historical=h53.readRevision53(path);
 assert.equal(sha(historical),expected,path+' exact delivery51 input');
 if(path==='app/atlas/head-neck-3d/head-learning.css'){
  const current=bytes(join(site,path));
  assert.equal(sha(current),'70eb06e2246820bf4b752aa857a4ddeb67f105bfe31361469bd9cb81afd5db83','Exact later CSS source');
  assert.deepEqual(current.subarray(0,historical.length),historical,'Exact later-to-delivery51 CSS inverse');
  assert.match(current.subarray(historical.length).toString(),/^\r?\n\/\* Append to head-learning\.css after source-bound integration checks\./);
 }
 return historical;
};
const sourceLine=codeText.match(/^const source='([0-9a-f]{40})';$/m);
assert(sourceLine,'Bound lacrimal source declaration');
assert.equal(sourceLine[1],'c5a09df8939dfaeaf76119ba5507c552721c3a30');
const callback=new Function('test','assert','revision50','readRevision50','validateRevision50Delivery','validateCurrentAtlasDelivery','read','sha','execFileSync',
 "const source='"+sourceLine[1]+"';\n"+codeText.slice(codeStart,codeEnd));
const run=(oldReader,currentReader)=>{
 let calls=0;
 callback((name,body)=>{assert.equal(name,'closed50 keeps every original proof byte and only declared test seams change');calls++;body();},
  assert,h50.revision50,oldReader,h50.validateRevision50Delivery,h51.validateRevision51Delivery,currentReader,sha,execFileSync);
 assert.equal(calls,1,'Actual first callback executed once');
};
const originalCwd=process.cwd();
try{
 process.chdir(site);
 run(h50.readRevision50,read);
 console.log('PASS actual staged closed50 callback against frozen V6');
 const flip=buffer=>{const changed=Buffer.from(buffer);changed[0]^=1;return changed;};
 assert.throws(()=>run(path=>path==='tests/deep-plantar-current-transition.test.mjs'?flip(h50.readRevision50(path)):h50.readRevision50(path),read));
 console.log('PASS frozen50 one-byte mutation refused');
 assert.throws(()=>run(h50.readRevision50,path=>path==='tests/deep-plantar-current-transition.test.mjs'?flip(read(path)):read(path)));
 console.log('PASS V6 deep one-byte mutation refused');
 console.log('PASS full CODE-to-V6 inverse and unchanged subsequent theorem tail');
}finally{process.chdir(originalCwd);}
