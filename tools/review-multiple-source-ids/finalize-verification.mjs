import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-review-multiple-source-ids';
const read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex'),ref=p=>({path:p,sha256:sha(read(p))});
const original=JSON.parse(read(root+'/VERIFICATION.json')),proposal=JSON.parse(read(root+'/PROPOSAL.json'));
assert.equal(sha(read(original.proposal.path)),original.proposal.sha256);
for(const row of proposal.rows){assert.equal(sha(read(proposal.base+'/'+row.path)),row.before);assert.equal(sha(read(root+'/website/'+row.path)),row.after);}
const parse=result=>{
 assert.equal(sha(read(result.log.path)),result.log.sha256);
 const output=read(result.log.path).toString(),counts={};
 for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
  const found=[...output.matchAll(new RegExp('^ℹ '+key+' (\\d+)\\r?$','gm'))];assert.equal(found.length,1,key);counts[key]=Number(found[0][1]);
 }
 const cases=output.slice(0,output.indexOf('ℹ tests '));
 return {...result,counts,passedNames:[...cases.matchAll(/^✔ (.+) \([\d.]+ms\)\r?$/gm)].map(m=>m[1]),failed:[...cases.matchAll(/^✖ (.+) \([\d.]+ms\)\r?$/gm)].map(m=>m[1])};
};
const before=parse(original.before),after=parse(original.after);
assert.equal(before.status,1);assert.equal(after.status,0);
assert.deepEqual(before.counts,{tests:14,pass:12,fail:2,cancelled:0,skipped:0,todo:0});
assert.deepEqual(after.counts,{tests:14,pass:14,fail:0,cancelled:0,skipped:0,todo:0});
assert.equal(after.passedNames.length,14);
assert.deepEqual(before.failed,['dedicated shoulder multi-ID source groups have readable labels without losing exact review context','different multi-ID source groups with identical titles remain individually selectable']);
for(const result of [before,after]){assert.equal(result.signal,null);assert.equal(result.error,null);}
const result={...original,at:new Date().toISOString(),initial:ref(root+'/VERIFICATION.json'),before,after,passed:true,error:null,reporterCorrection:'Actual Node default spec reporter was parsed; original logs and outcomes preserved. Tests were not rerun.',executedTestRuns:2};
fs.writeFileSync(root+'/VERIFICATION_FINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:true,before:before.counts,after:after.counts,rerun:false}));
