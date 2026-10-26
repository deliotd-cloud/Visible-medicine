// Exact inverse of the sole V2 candidate source change; never edits a file.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const after='fb94fc338b4abe8bf175177ec13c8a6836190bf96b5f7b2b182d7a07b7e36500';
const before='94bf4bc21b560d360de76178b2a6d36b675aff0a8fca3c87d7c95ab1fe93971c';
const begin='export function diagnosticContextInput(name,bytes){\n';
const end=' bytes=authenticateArterialCollector(name,bytes);\n';
const previous=" if(name==='tests/adjacent-current-tour-source-roles.test.mjs'||name==='tests/adjacent-current-role-inverse.mjs')\n  bytes=restoreAdjacentRegionalQueryLayer(name,bytes);\n";
export function restoreV2(bytes){
 assert(Buffer.isBuffer(bytes));assert.equal(sha(bytes),after,'Exact V2 source only');
 const source=bytes.toString('utf8');assert.deepEqual(Buffer.from(source),bytes);
 assert.equal(source.split(begin).length,2);assert.equal(source.split(end).length,2);
 const a=source.indexOf(begin)+begin.length,b=source.indexOf(end,a);assert(b>a);
 const restored=Buffer.from(source.slice(0,a)+previous+source.slice(b));
 assert.equal(sha(restored),before,'Complete first proposal source restored');return restored;
}
