import assert from 'node:assert/strict';
import {adjacentRolePath} from './adjacent-role-context.mjs';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreHandCurrentRole} from './hand-current-role-inverse.mjs';
import {restoreClinicalStructureCurrentRole} from './clinical-structure-current-role-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const parent=adjacentRolePath('VM_ADJACENT_CLINICAL_WEBSITE');
const proofBytes=readFileSync(adjacentRolePath('VM_ADJACENT_CLINICAL_PROOF'));
assert.equal(sha(proofBytes),'11adb4df96f62ad19a9afcf7941b0e939ec32d7b317fe640342603aa12d3d251',
 'Independent parent proof is exact');
const proof=JSON.parse(proofBytes);
assert.equal(proof.parentReceiptSha256,'d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2');
assert.equal(proof.atlasHead,'b79e110d2d28f18993263926ba35aa7a3f478b20');
assert.equal(proof.atlasTree,'0dd97cc55ef9aff3493b91752309d1d661c0b0c8');
const cases=[
 ['clinical-review-hand-arterial-xray.test.ts',restoreHandCurrentRole],
 ['clinical-review-axillary-branch-xray.test.ts',bytes=>restoreClinicalStructureCurrentRole('clinical-review-axillary-branch-xray.test.ts',bytes)],
 ['clinical-review-girdle-muscle-xray.test.ts',bytes=>restoreClinicalStructureCurrentRole('clinical-review-girdle-muscle-xray.test.ts',bytes)],
];

for(const [name,inverse] of cases){
 test(`${name}: exact b79 source role restores complete independent parent theorem`,()=>{
  const path='tests/'+name;
  const row=proof.sourceRows.find(item=>item.path===path);
  assert(row,`${path}: parent proof row`);
  assert.equal(proof.sourceRows.filter(item=>item.path===path).length,1);
  const parentBytes=readFileSync(parent+'/'+path);
  const fixture=readFileSync(new URL('./fixtures/adjacent-b79-preimage/'+name+'.raw',import.meta.url));
  assert.equal(sha(parentBytes),row.sha256,`${path}: independently retained parent`);
  assert.equal(parentBytes.length,row.bytes,`${path}: parent length`);
  assert.deepEqual(fixture,parentBytes,`${path}: raw fixture has independent provenance`);
  const current=readFileSync(new URL('./'+name,import.meta.url));
  assert.deepEqual(inverse(current),parentBytes,`${path}: whole original theorem and refusals restored`);
  const changed=Buffer.from(current);changed[changed.length-2]^=1;
  assert.throws(()=>inverse(changed),{name:'AssertionError'},`${path}: unknown edit refused before inverse`);
  const removed=Buffer.from(current.toString().replace('assert.deepEqual(', 'void('));
  assert.notDeepEqual(removed,current,`${path}: an assertion was actually removed`);
  assert.throws(()=>inverse(removed),{name:'AssertionError'},`${path}: removed assertion refused before inverse`);
 });
}

test('undeclared clinical source roles are refused',()=>{
 assert.throws(()=>restoreClinicalStructureCurrentRole('foreign.test.ts',Buffer.alloc(0)),{name:'AssertionError'});
});
