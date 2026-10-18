import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('intracranial admission preserves the complete original historical case with only evidence-read substitutions',()=>{
 const original=readFileSync(new URL('./fixtures/atlas-intracranial-arterial-ultrasound.original.mjs',import.meta.url));
 const admitted=readFileSync(new URL('./fixtures/current-proof-corrections/atlas-intracranial-arterial-ultrasound.test.mjs.raw',import.meta.url));
 assert.equal(sha(original),'bace41ed0ee46b5f7851d279351caf3686a40caf518359c6732098660626dc46');
 assert.equal(sha(admitted),'40ccdc8f1a234171c5b3c26f66fcd14107dfca843ca906a1f2ae557b91177302');
 const marker="test('exact intracranial ultrasound delivery, lesson transition and Review refusal'";
 const before=original.toString(),after=admitted.toString();
 assert(before.includes(marker)&&after.includes(marker));
 let expected=before.slice(before.indexOf(marker));
 const substitutions=[
  ["sha(readFileSync(resolve(root, 'atlas-review', row.path)))","sha(historicalRead('atlas-review/' + row.path))"],
  ['const bytes = readFileSync(resolve(root, base, row.path));','const bytes = historicalRead(base + row.path);'],
  ['const working = readFileSync(resolve(atlas, row.path));','const {bytes: working} = historicalInput(row);'],
  ['[{path, sha256: sha(readFileSync(resolve(atlas, path)))}]','[{path, sha256: sha(historicalInput(inputs.find(row => row.path === path)).bytes)}]'],
  ['path => readFileSync(resolve(root, path)));','path => historicalRead(path));'],
 ];
 for(const [from,to]of substitutions){assert.equal(expected.split(from).length,2,from);expected=expected.replace(from,to);}
 const boundary=after.indexOf('// Independent current admission;');assert(boundary>after.indexOf(marker));
 assert.equal(after.slice(after.indexOf(marker),boundary).trimEnd(),expected.trimEnd(),
  'All historical specifications, lessons/worksheets, negatives, stale writes, emitted limits and model proofs remain exact');
 assert(after.includes("assert.equal(current.source, CURRENT_ATLAS_REVISION);"));
 assert(after.includes('for (const row of currentReview.files)'));
 assert(after.includes('for (const {region, base, manifest, inputs} of currentRegions)'));
 assert(after.includes("assert.equal((await api.postBodyDecision(request, storage)).status, 409,"));
 assert(!/\btest\.(?:skip|todo|only)\s*\(/.test(after));
});
