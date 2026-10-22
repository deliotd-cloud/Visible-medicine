import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreHeadToolsTestRole} from './head-tools-test-source-role.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const expected={"head-filtered-layout.test.mjs":"151e0511ce7ce925ff7a58469100759586f7aae3b40b85458db4da1ae7c05e3e","head-disclosure-current-delivery.test.mjs":"6feb900f5db6124b287629a669267736baf22751d3142aea15f8d4eda87d0e31"};
for(const [name,digest] of Object.entries(expected)){
 const actual=readFileSync(new URL('./'+name,import.meta.url));
 test(name+': entire earlier contract is reconstructed and authenticated',()=>assert.equal(sha(restoreHeadToolsTestRole(name,actual)),digest));
 test(name+': appended unknown source is refused',()=>assert.throws(()=>restoreHeadToolsTestRole(name,Buffer.concat([actual,Buffer.from('\nconst forged=true;\n')]))));
 test(name+': changed assertion is refused',()=>assert.throws(()=>restoreHeadToolsTestRole(name,Buffer.from(actual.toString().replace('assert.equal','assert.notEqual')))));
}
test('unknown historical test role is refused',()=>assert.throws(()=>restoreHeadToolsTestRole('unknown.test.mjs',Buffer.from(''))));
