import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyPlanShape,assertPinnedPlanBytes,assertReporterPin} from './bounded-stock-campaign.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const roots=['tests/a.test.mjs','tests/b.test.mjs'];
const stockArgs=['--test','--experimental-strip-types','--test-concurrency=1','tests/*.test.ts','tests/*.test.mjs'];
const execution={args:stockArgs,executedRoots:roots,coveredByImport:[],mirror:{active:false}};
const shard={index:0,roots,rootSha256:sha(JSON.stringify(roots))};
test('exact stock bijection admits both physical roots',()=>{
 assert.doesNotThrow(()=>verifyPlanShape(roots,execution,[shard],[]));
});
test('false covered alias cannot omit an unrelated root',()=>{
 const wrapper='tests/atlas-glottic-muscle-imaging.test.ts';
 const target='tests/atlas-glottic-muscle-imaging.test.mjs';
 const unrelated='tests/other.test.mjs';
 const hash='a3d30dd530ad31ccc4e55b60c16cd68bddf421ad77a661340d1bbc414e880e0b';
 const e={args:stockArgs,executedRoots:[wrapper,target],
  coveredByImport:[{path:unrelated,via:wrapper,wrapperSha256:hash}],
  mirror:{active:true,eligible:true,capability:{supported:true}}};
 const s={index:0,roots:[wrapper,target],rootSha256:sha(JSON.stringify([wrapper,target]))};
 assert.throws(()=>verifyPlanShape([wrapper,target,unrelated],e,[s],[{path:wrapper,sha256:hash}]),/Foreign import coverage/);
});
test('duplicate, missing and nonsequential shards refuse',()=>{
 const duplicate=[{index:0,roots:[roots[0],roots[0]],rootSha256:sha(JSON.stringify([roots[0],roots[0]]))}];
 const missing=[{index:0,roots:[roots[0]],rootSha256:sha(JSON.stringify([roots[0]]))}];
 const wrongIndex=[{index:1,...shard}];wrongIndex[0].index=1;
 assert.throws(()=>verifyPlanShape(roots,execution,duplicate,[]));
 assert.throws(()=>verifyPlanShape(roots,execution,missing,[]));
 assert.throws(()=>verifyPlanShape(roots,execution,wrongIndex,[]),/sequential/);
});
test('changed PLAN SHA and reporter mismatch refuse',()=>{
 const bytes=Buffer.from('{"plan":"original"}');
 assert.doesNotThrow(()=>assertPinnedPlanBytes(bytes,sha(bytes)));
 assert.throws(()=>assertPinnedPlanBytes(Buffer.from('{"plan":"changed"}'),sha(bytes)),/mismatch/);
 assert.throws(()=>assertReporterPin({path:'reporter.mjs',sha256:'0'.repeat(64)},'reporter.mjs','1'.repeat(64)),/hash mismatch/);
});