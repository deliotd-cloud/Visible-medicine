import assert from 'node:assert/strict';import test from 'node:test';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import {restorePriorShoulderFamily} from './shoulder-source-family-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');const edits=[["import {emittedTeaching} from './atlas-emitted-teaching.ts';","import {emittedTeaching} from './atlas-emitted-teaching.ts';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],["const atlas='F:/VisibleMedicine/atlas';","const atlas=currentAtlasDeliveryRoot();"],["const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';","const liveCommit='190a63238eadcf906abe89dcbb6a67c88afe70b9';"]];
test('complete original shoulder muscle theorem retains all assertions beyond three source-root seams',()=>{
 const raw=readFileSync(new URL('./fixtures/shoulder-muscle-before-role-20261021.test.ts.raw',import.meta.url));assert.equal(sha(raw),'8267d8e7f5122069157815b17290d58b5f614937d182a5ca93529c881309d352');
 let expected=raw.toString();for(const [before,after]of edits){assert.equal(expected.split(before).length,2);expected=expected.replace(before,after);}
 const actual=restorePriorShoulderFamily('clinical-review-shoulder-muscle-xray.test.ts',readFileSync(new URL('./clinical-review-shoulder-muscle-xray.test.ts',import.meta.url))).toString('utf8');assert.equal(actual,expected);
 let inverse=actual;for(const [before,after]of edits.toReversed()){assert.equal(inverse.split(after).length,2);inverse=inverse.replace(after,before);}assert.equal(sha(Buffer.from(inverse)),sha(raw));
 for(const refusal of ['forged.draft.checks.foreign=true','request(staleDecision),storage)).status,409','request(approval),storage)).status,422','forgedApproval:16,storageCalls:0']){assert(actual.includes(refusal));assert.throws(()=>assert.equal(actual.replace(refusal,''),expected));}
 assert.throws(()=>assert.equal(actual+'\nconst unknown=true;\n',expected));
});
