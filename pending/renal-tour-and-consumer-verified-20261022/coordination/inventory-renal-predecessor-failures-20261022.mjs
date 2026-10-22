// Retain bounded diagnostics without weakening or editing any failed test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-tour-source-candidate/native-website-predecessor';
const result=json(root+'/TERMINAL.json'),tap=read(root+'/child.tap').toString();
assert.deepEqual(result.counts,{tests:751,pass:713,fail:38,cancelled:0,skipped:0,todo:0});assert.deepEqual(result.sourceDrift,[]);
const failures=[...tap.matchAll(/^not ok (.+)\r?\n\s+---[\s\S]*?\r?\n\s+\.\.\./gm)].map(m=>{
 const b=m[0],p=b.match(/website\\\\tests\\\\([^:'\n]+(?:\.mjs|\.ts))/)?.[1];assert(p,m[1]);
 const expected=b.match(/^\s+expected: (.+)$/m)?.[1],actual=b.match(/^\s+actual: (.+)$/m)?.[1];
 const sourceMismatch=expected==="'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'"&&actual==="'389bd0ca846a42c7f21055f55904bcf5df81a09f'";
 return {marker:m[1],path:'tests/'+p,expected:expected?.slice(0,200),actual:actual?.slice(0,200),diagnosticSha256:sha(Buffer.from(b)),
  observation:sourceMismatch?'First failing assertion pins predecessor6d7 while current admission is389; remaining assertions are not thereby certified.':'Requires exact diagnostic/source inspection; do not assume product or fixture defect.',
  classificationComplete:false};
});assert.equal(failures.length,38);
const paths=[...new Set(failures.map(f=>f.path))];
const out={at:new Date().toISOString(),terminal:root+'/TERMINAL.json',terminalSha256:sha(read(root+'/TERMINAL.json')),tapSha256:sha(read(root+'/child.tap')),counts:result.counts,
 failures,uniqueFailedRoots:paths.length,paths,sourceDrift:[],notAWholeSuiteRun:true,allFailuresDiagnosed:false,ownerPreviewChanged:false};
fs.writeFileSync(root+'/FAILURE_INVENTORY.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path:root+'/FAILURE_INVENTORY.json',sha256:sha(read(root+'/FAILURE_INVENTORY.json')),uniqueFailedRoots:paths.length,counts:result.counts,allFailuresDiagnosed:false}));
const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.renalPredecessorWider={terminal:true,result:root+'/TERMINAL.json',sha256:out.terminalSha256,counts:result.counts,
 inventory:root+'/FAILURE_INVENTORY.json',inventorySha256:sha(read(root+'/FAILURE_INVENTORY.json')),uniqueFailedRoots:paths.length,sourceDrift:[],allFailuresDiagnosed:false};
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
