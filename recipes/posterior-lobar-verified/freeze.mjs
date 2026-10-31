import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us',site=root+'/atlas';
const baseline=json(root+'/BASELINE.json'),generation=json(root+'/GENERATION-THIRD.json'),validation=json(root+'/FULL_VALIDATION.json'),impact=json(root+'/REVIEW_IMPACT.json');
const ref=p=>({path:p,sha256:hash(p)}),git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true,maxBuffer:4e6}).trim();
assert(generation.passed&&validation.passed&&impact.passed);
for(const r of [...generation.results,...validation.results]){assert.equal(r.status,0);assert.equal(hash(r.log.path),r.log.sha256);}
for(const r of validation.source)assert.equal(hash(r.path),r.sha256);
assert.equal(git('rev-parse','HEAD'),baseline.sourceHead);
assert.equal(hash(site+'/content/cerebral-lobar-imaging.ts'),'44d14e43fe2c3b3bd07cac9d25d9379e144deeb54f602ccc5e4ec678b73e646b');
assert.equal(impact.identicalLessons,968);assert.equal(impact.changes.lessons.length,4);
const expected=['content/cerebral-lobar-imaging.ts','content/body-renderer-revision.json','docs/nested-review-validation.json','scripts/cerebral-lobar-imaging-history.mjs','scripts/validate-cerebral-lobar-imaging.mjs','scripts/validate-nested-teaching.mjs','scripts/test-neonatal-lobar-ultrasound-history.mjs'];
const changed=[];
for(const row of baseline.sourceRows){assert.equal(hash(baseline.source+'/'+row.path),row.sha256,row.path);if(hash(site+'/'+row.path)!==row.sha256)changed.push(row.path);}
assert.equal(git('ls-files','--others','--exclude-standard'),'');assert.deepEqual(changed.sort(),expected.sort());git('diff','--check');
const sourceRows=baseline.sourceRows.map(r=>({path:r.path,sha256:hash(site+'/'+r.path),bytes:fs.statSync(site+'/'+r.path).size}));
const out={schema:'vm-isolated-atlas-candidate/1',at:new Date().toISOString(),site,base:{head:baseline.sourceHead,tree:baseline.sourceTree,receipt:ref(root+'/BASELINE.json')},changes:expected.map(p=>({path:p,sha256:hash(site+'/'+p),bytes:fs.statSync(site+'/'+p).size})),sourceRows,verification:{generation:ref(root+'/GENERATION-THIRD.json'),validation:ref(root+'/FULL_VALIDATION.json'),reviewImpact:ref(root+'/REVIEW_IMPACT.json'),research:ref(root+'/RESEARCH.json')},canonicalUnchanged:true,websiteImported:false,installed:false,clinicalApproval:false,wholeSuitePassing:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({source:ref(root+'/SOURCE.json'),changes:expected.length,unchangedLessons:968}));
