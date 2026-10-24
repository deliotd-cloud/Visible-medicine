import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(readFileSync(p));
test('the fresh765 theorem retains the complete original5f3 body and helper outside three explicit source/count seams',()=>{
 const currentReceipt='F:/VisibleMedicine/staging/20261024-guided-review-navigation/SOURCE_BOUND.json',oldReceipt='F:/VisibleMedicine/staging/20261024-guided-review-completeness/PROOF_BOUND.json';
 assert.equal(sha(readFileSync(currentReceipt)),'c5fceb2bc64d8b0d4464b3da940bd3721111657d9a4d57f2dbf5b8b30fe0b6f3');assert.equal(sha(readFileSync(oldReceipt)),'58f9008850632b65a0919114fe59c1acab82ac862132f68c0af9c6f1645b8960');
 const current=json(currentReceipt),old=json(oldReceipt),theorem='tests/guided-review-completeness.test.mjs',helper='tests/guided-review-completeness.mjs';
 const preserved=readFileSync(new URL('./fixtures/guided-review-completeness-5f3.mjs.raw',import.meta.url));assert.equal(sha(preserved),old.sourceRows.find(r=>r.path===theorem)?.sha256);assert.deepEqual(preserved,readFileSync(old.website+'/'+theorem));
 const fresh=readFileSync(new URL('./guided-review-completeness-765.test.mjs',import.meta.url),'utf8');let inverse=fresh;
 for(const [from,to]of [[current.atlasHead,old.atlasHead],[current.atlasTree,old.atlasTree],['assert.equal(manifest.files.length,1601)','assert.equal(manifest.files.length,1599)']]){assert.equal(inverse.split(from).length,2,from);inverse=inverse.replace(from,to);}
 assert.equal(inverse.replaceAll('\r\n','\n'),preserved.toString().replaceAll('\r\n','\n'),'No assertion, negative mutation, parser call, native source execution or historical membership check is removed');
 const helperBytes=readFileSync(new URL('./guided-review-completeness.mjs',import.meta.url));assert.equal(sha(helperBytes),old.sourceRows.find(r=>r.path===helper)?.sha256);
 assert.equal(current.atlasHead,'7659453d7d99da78742b06ee6e6665a467e5d972');assert.equal(old.atlasHead,'5f3c0a9518b03ae23f3992129a09c4b6edeeda2b');assert.notEqual(current.reviewBindingSha256,JSON.parse(readFileSync(old.website+'/atlas-review/integration-inputs.json')).sha256);
});
