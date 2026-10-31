import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {restorePancreaticPortalCandidate} from './clinical-pancreatic-portal-composition.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex'),name='clinical-review-portal-venous-xray.test.ts';
const current=read('./'+name),before=read('./fixtures/portal-before-shoulder-source-1031.ts.raw'),frozen=read('./fixtures/pancreatic-portal-frozen/'+name+'.raw');
test('later shoulder source bridge preserves every preceding portal assertion and frozen theorem',()=>{
 assert.equal(sha(before),'2c9e5f98988eeb9276e09acccf1ea5461aec00f98c9dc8af8b009c9f2add5ba5');
 assert.deepEqual(restorePancreaticPortalCandidate(name,current,frozen),restorePancreaticPortalCandidate(name,before,frozen));
});
test('current portal source refuses dropped current or historical assertions and extra bytes',()=>{
 for(const bad of [Buffer.concat([current,Buffer.from('// foreign')]),Buffer.from(current.toString().replace('assert.deepEqual(imported.structures,live.structures);','')),Buffer.from(current.toString().replace('assert.deepEqual(admissionImport.structures,current.structures);','')),Buffer.from(current.toString().replace('placements:9936,changed:4','placements:9935,changed:4'))])assert.throws(()=>restorePancreaticPortalCandidate(name,bad,frozen));
});
