// Source-only inverse checks; never imports the candidate or application modules.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

const root='F:/VisibleMedicine/staging/20261024-review-links-harness-proposal';
const website='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const original=fs.readFileSync(root+'/preimage/tests/clinical-review-integration.test.ts');
const candidate=fs.readFileSync(root+'/candidate/tests/clinical-review-integration.test.ts');
const sha=b=>createHash('sha256').update(b).digest('hex');
const expected='f325ada3bb08468241ef7639fa5829673d2410de1688d7fa878a24d12e135627';
const marker='const priorMaterial = JSON.parse(';
const direct="import { reviewModelHref } from '../lib/clinical-review-links.ts';\n";
const setupBegin='// Node does not resolve the production module';
const text=candidate.toString(),start=text.indexOf(setupBegin),end=text.indexOf(marker);
assert(start>0&&end>start);
const setup=text.slice(start,end);
function originalInverse(bytes) {
  const value=bytes.toString();
  assert.equal(value.split(setup).length,2,'One exact reviewed setup seam');
  let restored=value.replace(setup,'');
  const seam="import { createHash } from 'node:crypto';";
  assert.equal(restored.split(seam).length,2,'One exact import seam');
  restored=restored.replace(seam,direct+seam);
  assert.equal(sha(restored),expected,'Complete original test, not an assertion excerpt');
  assert.deepEqual(Buffer.from(restored),original);
  return restored;
}

test('complete original file is reconstructed through two exact import/setup seams',()=>{
  assert.equal(sha(original),expected);
  assert.deepEqual(fs.readFileSync(website+'/tests/clinical-review-integration.test.ts'),original);
  originalInverse(candidate);
  assert.deepEqual(candidate.subarray(candidate.indexOf(marker)),original.subarray(original.indexOf(marker)));
  assert.equal((original.toString().match(/^test\(/mg)||[]).length,4);
  assert.equal((text.match(/^test\(/mg)||[]).length,4);
});
test('changed theorem, unreviewed setup and import drift are rejected',()=>{
  for(const changed of [text.replace('expectedVersion:0','expectedVersion:1'),
    text.replace('platform: \'neutral\'','platform: \'node\''),
    text.replace('import test from','import changed from'),text+'\n'])
    assert.throws(()=>originalInverse(Buffer.from(changed)));
});
test('seven exact dependency pins are the genuine bound Website inputs',()=>{
  const sourceBytes=fs.readFileSync('F:/VisibleMedicine/staging/20261024-pancreatic-us-website/SOURCE_BOUND.json');
  assert.equal(sha(sourceBytes),'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
  const rows=new Map(JSON.parse(sourceBytes).sourceRows.map(row=>[row.path,row]));
  const block=setup.match(/const linkSourceHashes: Record<string, string> = \{([\s\S]*?)\};/)[1];
  const pins=[...block.matchAll(/^  '([^']+)': '([a-f0-9]{64})',\r?$/mg)];
  assert.equal(pins.length,7); assert.equal(new Set(pins.map(row=>row[1])).size,7);
  for(const [,file,hash] of pins){
    const bytes=fs.readFileSync(website+'/'+file),row=rows.get(file);assert(row);
    assert.equal(hash,row.sha256);assert.equal(sha(bytes),hash);assert.equal(bytes.length,row.bytes);
  }
  assert.equal((setup.match(/checkLinkSources\(\);/g)||[]).length,2);
  assert(setup.includes("tsconfigRaw: {compilerOptions: {target: 'ES2022'}}"));
});
