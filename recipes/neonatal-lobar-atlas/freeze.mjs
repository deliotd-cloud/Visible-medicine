import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas',site=root+'/atlas';
const baseline=json(root+'/BASELINE.json'),remaining=json(root+'/REMAINING.json');
const workerRoot='G:/VisibleMedicine-temp/proposals/20261031-neonatal-lobar-history-impl';
const worker=json(workerRoot+'/RESULT.json');
assert(remaining.passed);
for(const [path,sha256] of Object.entries(worker.editedScriptsSha256))assert.equal(hash(site+'/'+path),sha256);
for(const command of Object.values(worker.commands)){
 assert.equal(command.exitCode,0);
 if(command.log)assert.equal(hash(command.log),command.logSha256);
}
const ref=path=>({path,sha256:hash(path)});
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true,maxBuffer:4e6}).trim();
assert.equal(git('rev-parse','HEAD'),baseline.sourceHead);
assert.equal(hash(site+'/content/cerebral-lobar-imaging.ts'),'4b4cea4eb72eae16e6956ef60274b33430c11a17afe807efc4911c4107a36827');
const expected=['content/cerebral-lobar-imaging.ts','content/body-renderer-revision.json','docs/nested-review-validation.json',
 'scripts/cerebral-lobar-imaging-history.mjs','scripts/validate-cerebral-lobar-imaging.mjs','scripts/validate-nested-teaching.mjs','scripts/test-neonatal-lobar-ultrasound-history.mjs'];
const changed=[];
for(const row of baseline.sourceRows){
 assert.equal(hash(baseline.source+'/'+row.path),row.sha256,'Canonical source changed: '+row.path);
 if(hash(site+'/'+row.path)!==row.sha256)changed.push(row.path);
}
changed.push(...git('ls-files','--others','--exclude-standard').split(/\r?\n/).filter(Boolean));
assert.deepEqual(changed.sort(),expected.sort());
git('diff','--check');
const generated=json(root+'/VALIDATION-TSX.json');
assert(generated.results.slice(0,6).every(r=>r.status===0));
const impact=json(root+'/REVIEW_IMPACT.json');assert(impact.passed&&impact.identicalLessons===968);
const sourceRows=[...baseline.sourceRows.map(row=>({path:row.path,sha256:hash(site+'/'+row.path),bytes:fs.statSync(site+'/'+row.path).size})),
 {path:'scripts/test-neonatal-lobar-ultrasound-history.mjs',sha256:hash(site+'/scripts/test-neonatal-lobar-ultrasound-history.mjs'),bytes:fs.statSync(site+'/scripts/test-neonatal-lobar-ultrasound-history.mjs').size}];
const out={schema:'vm-isolated-atlas-candidate/1',at:new Date().toISOString(),site,base:{head:baseline.sourceHead,tree:baseline.sourceTree,receipt:ref(root+'/BASELINE.json')},
 changes:expected.map(path=>({path,sha256:hash(site+'/'+path),bytes:fs.statSync(site+'/'+path).size})),sourceRows,
 verification:{generation:ref(root+'/VALIDATION-TSX.json'),worker:ref(workerRoot+'/RESULT.json'),remaining:ref(root+'/REMAINING.json'),reviewImpact:ref(root+'/REVIEW_IMPACT.json')},
 canonicalUnchanged:true,websiteImported:false,installed:false,clinicalApproval:false,wholeSuitePassing:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:ref(root+'/SOURCE.json'),changed:expected,canonicalUnchanged:true}));
