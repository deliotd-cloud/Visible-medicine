// Main-owned test-only proposal emitter. Existing clinical/source content is not edited.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const site='F:/VisibleMedicine/website',stage='F:/VisibleMedicine/staging/20261021-shoulder-muscle-role-proposal';
assert(!existsSync(stage));
const p='tests/clinical-review-shoulder-muscle-xray.test.ts',original=readFileSync(site+'/'+p);
const sha=b=>createHash('sha256').update(b).digest('hex');
const edits=[
 ["import {emittedTeaching} from './atlas-emitted-teaching.ts';", "import {emittedTeaching} from './atlas-emitted-teaching.ts';\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
 ["const atlas='F:/VisibleMedicine/atlas';",'const atlas=currentAtlasDeliveryRoot();'],
 ["const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';","const liveCommit='190a63238eadcf906abe89dcbb6a67c88afe70b9';"],
 ['assert.deepEqual(current.regionalTours,live.regionalTours);assert.deepEqual(live.regionalTours,old.regionalTours);','assert.deepEqual(current.regionalTours,live.regionalTours);assert.deepEqual(epoch.regionalTours,old.regionalTours);'],
 ['assert.equal(current.regionalTours.length,51);','assert.equal(old.regionalTours.length,51);'],
 ['assert.equal(current.regionalTours.reduce((count:number,tour:any)=>count+tour.steps.length,0),309);','assert.equal(old.regionalTours.reduce((count:number,tour:any)=>count+tour.steps.length,0),309);'],
 ["  assert.deepEqual(after,historical,`${structure.id}: immutable introduced Review packet`);", "  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),historical.topics.find((row:any)=>row.tab==='xray'),`${structure.id}: immutable introduced X-ray topic`);\n  assert.equal(await current.parseBodyReviewResponse(historical,structure.id),null,'Historical authored packet cannot be reused as current');"],
 ['   assert.deepEqual(after[key],before[key],`${structure.id}: ${key} retained`);','   assert.deepEqual(historical[key],before[key],`${structure.id}: historical ${key} retained`);'],
 ["  assert.deepEqual(after.topics.filter((row:any)=>row.tab!=='xray'),\n   before.topics.filter((row:any)=>row.tab!=='xray'));", "  assert.deepEqual(historical.topics.filter((row:any)=>row.tab!=='xray'),\n   before.topics.filter((row:any)=>row.tab!=='xray'));"],
];
let candidate=original.toString();
for(const [before,after]of edits){assert.equal(candidate.split(before).length,2,before);candidate=candidate.replace(before,after);}
const raw='tests/fixtures/shoulder-muscle-before-role-20261021.test.ts.raw';
const guardPath='tests/shoulder-muscle-role-preservation-20261021.test.mjs';
const guard=`import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const edits=${JSON.stringify(edits,null,2)};
test('complete shoulder muscle original survives only declared historical/current roles',()=>{
 const raw=readFileSync(new URL('./fixtures/shoulder-muscle-before-role-20261021.test.ts.raw',import.meta.url));
 assert.equal(sha(raw),'${sha(original)}');let expected=raw.toString();
 for(const [before,after]of edits){assert.equal(expected.split(before).length,2);expected=expected.replace(before,after);}
 const actual=readFileSync(new URL('./clinical-review-shoulder-muscle-xray.test.ts',import.meta.url),'utf8');
 assert.equal(actual,expected);let inverse=actual;
 for(const [before,after]of edits.toReversed()){assert.equal(inverse.split(after).length,2);inverse=inverse.replace(after,before);}
 assert.equal(sha(Buffer.from(inverse)),sha(raw));
 for(const refusal of ["forged.draft.checks.foreign=true","request(staleDecision),storage)).status,409","request(approval),storage)).status,422","forgedApproval:16,storageCalls:0"]){
  assert(actual.includes(refusal));assert.throws(()=>assert.equal(actual.replace(refusal,''),expected));
 }
 assert.throws(()=>assert.equal(actual+'\\nconst unknown=true;\\n',expected));
});
`;
const rows=[{path:p,bytes:Buffer.from(candidate),preimageSha256:sha(original)},{path:raw,bytes:original,preimageSha256:null},{path:guardPath,bytes:Buffer.from(guard),preimageSha256:null}];
const proposal={schema:'visible-medicine.main-shoulder-muscle-role-proposal/1',websiteHeadAtObservation:'b953ff3f5f1891599cb6e91cb91311d9d6006270',source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',review:'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f',proposedPaths:rows.map(({bytes,...r})=>({...r,candidateSha256:sha(bytes),candidateBytes:bytes.length})),diagnosis:'Keep immutable eb34 introduction and c978 baseline. Historical51-tour/309-stop graph and unchanged non-Xray fields belong to the introduction epoch, not later current190. Current full catalogue,1104packets,all answers/topics and synthetic refusals remain compared with independent Website-bound current Git replay. Every original source/model pin,146mesh check,9936placement/16change count and64malformed/16stale/16forged/16approval refusal totals remain. No observed count or fingerprint repin.',limits:'Main-authored staged proposal only; no source-only guard or actual native pass yet. No product/content/model/private or approval edit.'};
const patch=['*** Begin Patch'];
for(const {path,bytes}of [...rows,{path:'PROPOSAL.json',bytes:Buffer.from(JSON.stringify(proposal,null,2)+'\n')}]){assert(bytes.toString().endsWith('\n'));patch.push('*** Add File: '+stage+'/'+path,...bytes.toString().slice(0,-1).split('\n').map(l=>'+'+l));}
patch.push('*** End Patch');console.log(patch.join('\n'));
