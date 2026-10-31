import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const root='G:/VisibleMedicine-temp/proposals/20261031-small-cardiac-runtime-compare',baseline='G:/VisibleMedicine-temp/staging/20261031-visual-ct-guidance-ready';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),ref=p=>({path:p,sha256:sha(p)});
assert.equal(spawnSync(process.execPath,['--check',root+'/compare.mjs'],{windowsHide:true}).status,0);
const source=baseline+'/SOURCE_PREPARED.json',state=baseline+'/VERIFICATION_STATE.json';
assert.equal(JSON.parse(fs.readFileSync(state)).passed,false,'This negative case requires the actually unverified baseline');
const args=['--max-old-space-size=64',root+'/compare.mjs',
 '--before='+baseline+'/atlas','--after=G:/VisibleMedicine-temp/proposals/20261031-small-cardiac-imaging/atlas',
 '--overlay=F:/VisibleMedicine/recovery/checkpoints/20261031-small-cardiac-imaging-prepared/OVERLAY.json',
 '--before-source='+source,'--after-source='+source,'--before-source-sha='+sha(source),'--after-source-sha='+sha(source),
 '--before-state='+state,'--before-state-sha='+sha(state)];
const result=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,maxBuffer:100000});
assert.equal(result.status,1);assert.equal(result.signal,null);assert.match(result.stderr,/Visual-CT baseline is not verified/);
fs.writeFileSync(root+'/NEGATIVE_INPUT.log',result.stdout+result.stderr,{flag:'wx'});
const review={at:new Date().toISOString(),script:ref(root+'/compare.mjs'),handoff:ref(root+'/HANDOFF.md'),syntaxPassed:true,
 actualUnverifiedBaselineRejected:true,negativeLog:ref(root+'/NEGATIVE_INPUT.log'),state:ref(state),bundlesExecuted:false,fullRuntime:false,
 mainReview:'Corrected unsupported manifest schema and packet teachingTabs location; verified current data shape, sourceRows and generated report contract. Added ordered-success/log/prepared-source checks. The complete positive runtime comparison remains required.',
 intendedSelections:108,intendedTopics:972,clinicalApproval:false,installed:false};
fs.writeFileSync(root+'/MAIN_REVIEW.json',JSON.stringify(review,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(review));
