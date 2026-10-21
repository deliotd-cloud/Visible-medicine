// Correct main's unnecessary historical-packet rejection; preserve the full original test.
import assert from 'node:assert/strict';import{readFileSync,existsSync}from'node:fs';import{createHash}from'node:crypto';
const site='F:/VisibleMedicine/website',root='F:/VisibleMedicine/staging/20261021-shoulder-muscle-minimal-proposal';assert(!existsSync(root));
const sha=b=>createHash('sha256').update(b).digest('hex');
const name='clinical-review-shoulder-muscle-xray.test.ts';
const rawPath='tests/fixtures/shoulder-muscle-before-role-20261021.test.ts.raw',original=readFileSync(site+'/'+rawPath);
assert.equal(sha(original),'8267d8e7f5122069157815b17290d58b5f614937d182a5ca93529c881309d352');
const edits=[
 ["import {emittedTeaching} from './atlas-emitted-teaching.ts';","import {emittedTeaching} from './atlas-emitted-teaching.ts';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
 ["const atlas='F:/VisibleMedicine/atlas';",'const atlas=currentAtlasDeliveryRoot();'],
 ["const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';","const liveCommit='190a63238eadcf906abe89dcbb6a67c88afe70b9';"]
];
let candidate=original.toString();for(const [before,after]of edits){assert.equal(candidate.split(before).length,2);candidate=candidate.replace(before,after);}
const guard=`import assert from 'node:assert/strict';import test from 'node:test';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');const edits=${JSON.stringify(edits)};
test('complete original shoulder muscle theorem retains all assertions beyond three source-root seams',()=>{
 const raw=readFileSync(new URL('./fixtures/shoulder-muscle-before-role-20261021.test.ts.raw',import.meta.url));assert.equal(sha(raw),'${sha(original)}');
 let expected=raw.toString();for(const [before,after]of edits){assert.equal(expected.split(before).length,2);expected=expected.replace(before,after);}
 const actual=readFileSync(new URL('./${name}',import.meta.url),'utf8');assert.equal(actual,expected);
 let inverse=actual;for(const [before,after]of edits.toReversed()){assert.equal(inverse.split(after).length,2);inverse=inverse.replace(after,before);}assert.equal(sha(Buffer.from(inverse)),sha(raw));
 for(const refusal of ['forged.draft.checks.foreign=true','request(staleDecision),storage)).status,409','request(approval),storage)).status,422','forgedApproval:16,storageCalls:0']){assert(actual.includes(refusal));assert.throws(()=>assert.equal(actual.replace(refusal,''),expected));}
 assert.throws(()=>assert.equal(actual+'\\nconst unknown=true;\\n',expected));
});
`;
const values=[{path:'tests/'+name,b:Buffer.from(candidate)},{path:'tests/shoulder-muscle-role-preservation-20261021.test.mjs',b:Buffer.from(guard)}];
const proposal={schema:'visible-medicine.main-shoulder-muscle-minimal/1',websiteHeadAtObservation:'b953ff3f5f1891599cb6e91cb91311d9d6006270',source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',review:'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f',proposedPaths:values.map(({path,b})=>({path,preimageSha256:sha(readFileSync(site+'/'+path)),candidateSha256:sha(b),candidateBytes:b.length})),diagnosis:'Actual38/37/1 exposed an unnecessary assertion added by main, not a product failure: unchanged source/content/checklist packets can remain identical across commits and must not be labelled stale solely by chronology. Restore every original historical/current graph, full-packet equality and refusal assertion. Only live190 pin, checked source root and its import differ from the complete original. Original38/37/1 receipt retained.',scope:'Two test-only paths; original raw witness unchanged. No product, source teaching, clinical or permission edit.'};
const patch=['*** Begin Patch'];for(const {path,b}of [...values,{path:'PROPOSAL.json',b:Buffer.from(JSON.stringify(proposal,null,2)+'\n')}])patch.push('*** Add File: '+root+'/'+path,...b.toString().trimEnd().split('\n').map(l=>'+'+l));patch.push('*** End Patch');console.log(patch.join('\n'));
