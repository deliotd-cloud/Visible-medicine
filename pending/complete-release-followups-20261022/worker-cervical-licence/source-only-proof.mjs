import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
const parent='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance/website';
const atlas='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas';
const before=readFileSync(resolve(root,'atlas-cervical-epoch-preservation.test.mjs.raw'),'utf8');
const candidate=readFileSync(resolve(root,'tests/atlas-cervical-epoch-preservation.test.mjs'),'utf8');
const product=readFileSync(resolve(parent,'tests/atlas-cervical-projection-xray.test.mjs'),'utf8');
const original=readFileSync(resolve(parent,'tests/fixtures/atlas-cervical-projection-xray-before-epoch-20261022.test.mjs.raw'),'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const marker="test('actual licence witness accepts exact raw or documented Windows bytes and refuses all other representations'";
const importLine="import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n";
assert.equal(sha(before),'ff62e76523d50e2a9e476bf3d2bda53225a23a2ff7326bc58b2ce693ee994367');
assert.equal(sha(candidate),'bb3c2bb8b360b9d6bbba2e809525366afd5d827f27e9d61e54d01a78e2d28754');
assert.equal(sha(product),'428fb397b7d5efff567754844a282223ee8ce8068fc0eb599413cbd7fe0621df');
assert.equal(sha(original),'a5848c319f0df5d21105f2c7710b62a2d94c8858db4a63368ef3a9e826a9b06b');
assert.equal(candidate.split(marker).length,2);
assert.equal(before.split(marker).length,2);
assert.equal(candidate.split(importLine).length,2);
assert.equal(candidate.slice(0,candidate.indexOf(marker)).replace(importLine,''),before.slice(0,before.indexOf(marker)),
  'Every byte before the licence witness outside its named import seam is retained');
const inverse=candidate.slice(0,candidate.indexOf(marker)).replace(importLine,'')+before.slice(before.indexOf(marker));
assert.equal(inverse,before,'Full-file inverse across exactly two named seams');
for(const mutation of [
  candidate.replace('assert.equal(preserved, 9830);','assert.equal(preserved, 9829);'),
  candidate.replace("'90dea95329aea5015ce339e430d9f342090617c82ee48613e15dd2240f08b746'","'0'.repeat(64)"),
  candidate.replace('assert.throws(()=>witness(bytes));','assert.doesNotThrow(()=>witness(bytes));'),
]){
  assert.notEqual(mutation,candidate);
  assert.notEqual(sha(mutation),sha(candidate),'Unreviewed mutation refused by exact source pin');
}

const path='LICENSES/bodyparts3d-license-evidence.html';
const revision='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const raw=execFileSync('git',['--no-replace-objects','-C',atlas,'show',revision+':'+path]);
const checkout=readFileSync(resolve(atlas,path));
assert.equal(raw.length,14682);assert.equal(sha(raw),'7a873d9c6ed62578a7ee5603d68d6a8fbf6e3ccc0b52db6a3ad8b952f8cf7271');
const selected=new Set([207,208,209,211,212,213,214,215,216,217,218,219]);
let line=0;
const windows=Buffer.from(raw.toString('utf8').replace(/\n/g,()=>selected.has(++line)?'\r\n':'\n'));
assert.equal(line,256);assert.equal(windows.length,14694);
assert.equal(sha(windows),'90dea95329aea5015ce339e430d9f342090617c82ee48613e15dd2240f08b746');
assert.equal((windows.toString('utf8').match(/\r\n/g)||[]).length,12);
assert.ok(Buffer.from(windows.toString('utf8').replaceAll('\r\n','\n')).equals(raw));
assert.ok(checkout.equals(raw)||checkout.equals(windows));
const allConverted=Buffer.from(raw.toString('utf8').replaceAll('\n','\r\n'));
assert.equal(allConverted.length,14938);
assert.equal(sha(allConverted),'4ecfef8bf45fa5a211563ed11cf79ab0bcc6bb3819c3410a5c3e1c4ad71240d4');
assert.ok(!allConverted.equals(raw)&&!allConverted.equals(windows));

const code=product.match(/function witnessLicenceCheckout\(\) \{\n[\s\S]*?\n\}/)?.[0];
assert.ok(code);
const witness=(working,committed=raw)=>new Function('assert','sha','git','revision','readFileSync','resolve','sourceRepo',code+'\nreturn witnessLicenceCheckout();')(
  assert,sha,(commit,name)=>{assert.equal(commit,revision);assert.equal(name,path);return committed;},revision,
  name=>{assert.equal(name,atlas+'/'+path);return working;},(root,name)=>root+'/'+name,atlas);
for(const bytes of [raw,windows,checkout])assert.deepEqual(witness(bytes),{path,sha256:sha(raw)});
for(const bytes of [Buffer.concat([raw,Buffer.from(' ')]),allConverted,
  Buffer.concat([windows,Buffer.from('\nchanged source')]),Buffer.from(raw.toString('utf8').replace('\n','\r\n'))]){
  assert.ok(!bytes.equals(raw)&&!bytes.equals(windows));
  assert.throws(()=>witness(bytes));
}
assert.throws(()=>witness(raw,Buffer.concat([raw,Buffer.from(' ')])));
console.log(JSON.stringify({status:'source-only-pass',beforeSha256:sha(before),proposalSha256:sha(candidate),
  productSha256:sha(product),originalFixtureSha256:sha(original),fullFileInverse:true,
  rawSha256:sha(raw),windowsSha256:sha(windows),actualCheckoutSha256:sha(checkout),
  allNewlinesConvertedSha256:sha(allConverted),accepted:3,malformedRejected:4,foreignGitRejected:true}));
