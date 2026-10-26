// Test-only exact inverse of the later regional-query consumer layer.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pathRelease='release-to-lower';
const pathHelper='tests/adjacent-current-role-inverse.mjs';
const pathTest='tests/adjacent-current-tour-source-roles.test.mjs';
const rows=new Map([
 [pathRelease,{after:'55f6e6d1a38d66786421fa3f1a1289b1f4bca60e5561d81da8700722624bd4fb',before:'0bc8ab0d9928b19bac75b36ffc8a0870d0e6cc4b7aba5fd7487dce553fc49a9a',seams:[
  ["import {restoreRegionalQueryLoaderPreservationSource} from './regional-query-source-role.mjs';\n",''],
  ["if(row.path==='tests/atlas-learning-loader-preservation.test.mjs')bytes=Buffer.from(restoreRegionalQueryLoaderPreservationSource(bytes.toString()));",''],
 ]}],
 [pathHelper,{after:'b14c426e904c6d8fcec4c44aa19ae3f520f425f7c1a6facbc481edc6e72a0ad2',before:'064c45e32a766fe893bd07f72df6476da7bd8fd6231054b5f1c32223b7a43c46',seams:[
  ["import {restoreAdjacentRegionalQueryLayer} from './adjacent-regional-query-composition.mjs';\n",''],
  ['bytes=restoreAdjacentRegionalQueryLayer(name,bytes);bytes=restoreReleaseDiagnosticContext(name,bytes);','bytes=restoreReleaseDiagnosticContext(name,bytes);'],
 ]}],
 [pathTest,{after:'19a9686ecb9cea52f8ae5eabc0312473e518a41a3339e9acdbe3f68ad4e640d6',before:'66cb2d654960cb270564da64478a21672ff84fddba89b6b56f6a56d2450eb99c',seams:[
  ["import {restoreAdjacentRegionalQueryLayer} from './adjacent-regional-query-composition.mjs';\n",''],
  ["  const admitted=restoreAdjacentRegionalQueryLayer('tests/'+name,bytes);\n  assert.deepEqual(restoreAdjacentPortableRole(name,admitted),original);const changed=Buffer.from(bytes);changed[0]^=1;\n  if(name==='adjacent-current-tour-source-roles.test.mjs')assert.throws(()=>restoreAdjacentRegionalQueryLayer('tests/'+name,changed));\n  else assert.throws(()=>restoreAdjacentPortableRole(name,changed));",
   "  assert.deepEqual(restoreAdjacentPortableRole(name,bytes),original);const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>restoreAdjacentPortableRole(name,changed));"],
 ]}],
 ['tests/release-diagnostic-context-inverse.mjs',{after:'94bf4bc21b560d360de76178b2a6d36b675aff0a8fca3c87d7c95ab1fe93971c',before:'baec9aaf4dd35321d811f13f8b2a8dc1f0c6c10da9a9b8d4ae710cb646f06bdd',seams:[
  ["import {restoreAdjacentRegionalQueryLayer} from './adjacent-regional-query-composition.mjs';\n",''],
  [" if(name==='tests/adjacent-current-tour-source-roles.test.mjs'||name==='tests/adjacent-current-role-inverse.mjs')\n  bytes=restoreAdjacentRegionalQueryLayer(name,bytes);\n",''],
 ]}],
]);
export function restoreAdjacentRegionalQueryLayer(name,bytes){
 const row=rows.get(name);if(!row)return bytes;
 assert(Buffer.isBuffer(bytes),'Exact source bytes required');assert.equal(sha(bytes),row.after,'Only declared later source');
 let text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes,'Lossless UTF-8 source');
 for(const [after,before]of row.seams){assert.equal(text.split(after).length,2,'One exact regional-query composition seam: '+name);text=text.replace(after,before);}
 const restored=Buffer.from(text);assert.equal(sha(restored),row.before,'Complete prior source: '+name);return restored;
}
