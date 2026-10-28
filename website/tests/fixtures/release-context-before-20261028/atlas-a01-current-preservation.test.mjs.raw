import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const sha=b=>createHash('sha256').update(b).digest('hex');
const inverseBytes=readFileSync(new URL('./fixtures/atlas-727-originals/ROLE_INVERSE.json',import.meta.url));
assert.equal(sha(inverseBytes),'4a1fca2496868dcc011c4c3b2c16c9743a87d16d534f7a2768f663ab511e2a46','Exact reviewed inverse map');
const inverse=JSON.parse(inverseBytes);
const expected=['atlas-arterial-current-delivery.test.mjs','atlas-cervical-current-delivery.test.mjs'];
test('both distinct a01 whole roots retain the complete unchanged 727 originals and exact inverse',()=>{
 assert.equal(inverse.schema,'vm-a01-role-exact-inverse/1');
 assert.deepEqual(inverse.rows.map(row=>row.name),expected);
 for(const row of inverse.rows){
  const old=readFileSync(new URL('./'+row.name,import.meta.url));
  const raw=readFileSync(new URL('./fixtures/atlas-727-originals/'+row.name+'.raw',import.meta.url));
  const candidate=readFileSync(new URL('./'+row.candidate,import.meta.url));
  assert(old.equals(raw),'Installed original and frozen raw are byte-exact: '+row.name);
  assert.equal(sha(raw),row.sourceSha256);
  let changed=candidate.toString('utf8');
  assert.equal(changed.split("'./a01-delivery-binding.mjs'").length-1,1,'Integration helper import');
  changed=changed.replace("'./a01-delivery-binding.mjs'","'../a01-delivery-binding.mjs'");
  assert.equal(sha(Buffer.from(changed)),row.semanticSha256,'Only relocation from proved semantic source');
  if(row.name.startsWith('atlas-arterial')){
   const marker="import {assertArterialRoleIdentity,assertCurrentArterialPrefix} from './arterial-delivery-roles.mjs';";
   const prefix=raw.toString('utf8').split(marker)[0];
   assert(changed.startsWith(prefix),'All original setup and first five cases remain byte-exact');
  }
  for(const {before,after} of [...row.changes].reverse()){
   assert.equal(changed.split(after).length-1,1,'One exact substitution to reverse');
   changed=changed.replace(after,before);
  }
  assert.equal(sha(Buffer.from(changed)),row.sourceSha256,'Full original restored');
  assert.equal((candidate.toString('utf8').match(/^test\('/gm)||[]).length,row.name.startsWith('atlas-arterial')?6:1,'All cases retained');
 }
});
