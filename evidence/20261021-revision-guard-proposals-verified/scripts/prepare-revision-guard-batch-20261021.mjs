import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v2';
const harness='F:/VisibleMedicine/staging/20261021-coverage-epoch-proposal/native-check';
const candidate='F:/VisibleMedicine/staging/20261021-source190-website/website';
const old=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
const inputs=new Map(old.map(r=>[r.path,r]));assert.equal(old.length,5107);assert(!fs.existsSync(stage));
const paths=['tests/anatomy-coverage-revision-admission.test.mjs','tests/current-190-coverage.test.mjs',
 'tests/fixtures/closed485-original/anatomy-coverage-revision-admission.test.mjs.raw',
 'tests/atlas-arterial-evidence-limits.test.mjs','tests/arterial-history-preservation.test.mjs',
 'tests/atlas-guided-camera.test.ts'];
const bindings=new Set(json(candidate+'/atlas-review/integration-inputs.json').inputs.map(r=>r.path));
const changes=paths.map(p=>{
 assert(!bindings.has(p),'Review input must not silently change: '+p);
 const before=fs.existsSync(candidate+'/'+p)?read(candidate+'/'+p):null;
 if(before)assert.equal(sha(before),inputs.get(p)?.sha256,p);else assert(!inputs.has(p));
 const after=read(harness+'/'+p);assert(after.length<100000&&!after.includes(0));
 return {path:p,from:harness+'/'+p,beforeSha256:before?sha(before):null,sha256:sha(after),bytes:after.length};
});
assert.equal(changes.filter(r=>r.beforeSha256===null).length,2);
const receipts=[...['COVERAGE_NATIVE_EPOCHS','ARTERIAL190_GRAPH_WITNESS','ARTERIAL190_WHOLE_HISTORY'].map(label=>[label,harness+'/'+label+'.json']),
 ['CAMERA_LEGACY_CURRENT_ZOOM','F:/VisibleMedicine/staging/20261021-camera-zoom-contract-proposal/CAMERA_LEGACY_CURRENT_ZOOM.json']].map(([label,file])=>{
 const r=json(file);assert.equal(r.code,0);assert.equal(sha(read(r.log)),r.logSha256);
 assert(r.footer.includes('ℹ fail 0')&&r.footer.includes('ℹ skipped 0'));return {file,sha256:sha(read(file)),label,footer:r.footer,logSha256:r.logSha256};
});
const prior=json('F:/VisibleMedicine/staging/20261021-arterial190-epoch-proposal/PREPARATION.json');
const subject=changes.find(r=>r.path==='tests/atlas-arterial-evidence-limits.test.mjs');
const after=read(subject.from).toString(),before=read(candidate+'/'+subject.path).toString();
assert.equal(after.replace(prior.subjectVersionChange.after,prior.subjectVersionChange.before),before);
fs.mkdirSync(stage);
const result={at:new Date().toISOString(),stage,site:candidate,atlas:'F:/VisibleMedicine/staging/20261021-atlas-combined-source',
 source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',review:'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f',
 previousSourceInputs:5107,proposedSourceInputs:5109,changes,receipts,
 scope:'Four existing test-only sources and two new test/immutable-original fixture paths. All four original coverage tests execute unchanged in their exact closed485 epoch; two current190 coverage checks stay separate. Corrected arterial source differs by one exact current-epoch assertion; its whole inverse, prior epochs and original refusal/storage assertions remain. Camera preserves its entire three-test legacy/current source via exact inverse and adds a strict fourth-argument contract and negative case. Nine bounded native registrations pass, with four original child tests explicitly checked by their wrapper; keep those units separate.',
 limits:'No new learner/Review/runtime/geometry/access dependency. The whole standalone seven-case arterial module has not been rerun after this test-only proposal; its five expensive unchanged bodies already ran in the frozen complete suite. Full suite still pending; NOT post-fix whole-suite acceptance or source installation. Changed TypeScript camera test requires fresh types after heavy slot is released. Earlier v1 batch is superseded; do not apply it.',
 freshTypesRequiredBeforeCutover:true,
 candidateEdited:false,canonicalInstalled:false,privateDataCopied:false,publicDeployment:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,existing:4,added:2,proposedInputs:5109,proofReceipts:4,candidateEdited:false}));
