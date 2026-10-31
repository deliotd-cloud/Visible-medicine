import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-visual-ct-guidance-ready',site=root+'/atlas';
const ref=p=>({path:p,sha256:hash(p)}),git=(where,...args)=>execFileSync('git',['-C',where,...args],{encoding:'utf8',windowsHide:true,maxBuffer:4e6}).trim();
const prepared=json(root+'/SOURCE_PREPARED_REFERENCE_HISTORY.json'),baseline=json(root+'/BASELINE.json'),state=json(root+'/VERIFICATION_REFERENCE_HISTORY_STATE.json'),impact=json(root+'/REVIEW_IMPACT.json');
assert.equal(hash(root+'/SOURCE_PREPARED_REFERENCE_HISTORY.json'),'1d4ce710b556516a76dfe2ca1566db8f0fcda9a8b7308bad593d184162ebcc86');
assert(state.terminal&&state.passed&&state.state==='passed');assert.equal(state.completed.length,13);assert(impact.passed);
for(const [i,r]of state.completed.entries()){assert.equal(r.index,i);assert.equal(r.status,0);assert.equal(r.error,null);assert.equal(r.signal,null);assert.equal(hash(r.log.path),r.log.sha256);}
assert.equal(impact.identicalLessons,969);assert.equal(impact.changes.lessons.length,3);assert.equal(impact.changes.teachingRevisions.length,3);assert.equal(impact.changes.geometryRevisions.length,108);
const generated=['content/body-renderer-revision.json','docs/nested-review-validation.json'];
for(const row of prepared.sourceRows)assert.equal(hash(site+'/'+row.path),generated.includes(row.path)?state.generated[row.path]:row.sha256,row.path);
for(const row of baseline.sourceRows)assert.equal(hash(baseline.source+'/'+row.path),row.sha256,row.path);
// A regenerated report can be byte-identical when topic counts do not change.
// Verify every generated output above; stage only actual changes from the pinned baseline.
const changedGenerated=generated.filter(p=>{const row=baseline.sourceRows.find(r=>r.path===p);assert(row,'Generated baseline required: '+p);return row.sha256!==state.generated[p];});
const expected=[...prepared.authoredFiles.map(r=>r.path),...changedGenerated].sort(),tracked=git(site,'diff','--name-only').split(/\r?\n/).filter(Boolean),added=git(site,'ls-files','--others','--exclude-standard').split(/\r?\n/).filter(Boolean);
assert.deepEqual([...tracked,...added].sort(),expected);assert.equal(git(site,'diff','--cached','--name-only'),'');git(site,'diff','--check');
assert.equal(git(site,'rev-parse','HEAD'),baseline.sourceHead);assert.equal(git('F:/VisibleMedicine/atlas','rev-parse','HEAD'),'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');assert.equal(git('F:/VisibleMedicine/atlas','status','--porcelain'),'');
const source={schema:'vm-isolated-visual-ct-candidate/1',at:new Date().toISOString(),site,base:prepared.base,sourceRows:prepared.sourceRows.map(r=>({path:r.path,sha256:hash(site+'/'+r.path),bytes:fs.statSync(site+'/'+r.path).size})),changes:expected.map(p=>({path:p,sha256:hash(site+'/'+p),bytes:fs.statSync(site+'/'+p).size})),verification:{admissionPlan:ref('G:/VisibleMedicine-temp/proposals/20261031-current-history-checks/REFERENCE_PLAN.json'),state:ref(root+'/VERIFICATION_REFERENCE_HISTORY_STATE.json'),impact:ref(root+'/REVIEW_IMPACT.json'),prepared:ref(root+'/SOURCE_PREPARED_REFERENCE_HISTORY.json')},canonicalUnchanged:true,websiteImported:false,installed:false,clinicalApproval:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
for(const key of ['user.name','user.email'])git(site,'config',key,git('F:/VisibleMedicine/atlas','config',key));
git(site,'switch','-c','codex/visual-ct-guidance-20261031');git(site,'add','--',...expected);assert.deepEqual(git(site,'diff','--cached','--name-only').split(/\r?\n/).sort(),expected);
git(site,'commit','-m','Clarify visual pathway CT teaching with primary references');assert.equal(git(site,'status','--porcelain'),'');
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const result={at:new Date().toISOString(),source:ref(root+'/SOURCE.json'),head:git(site,'rev-parse','HEAD'),tree:git(site,'rev-parse','HEAD^{tree}'),parent:git(site,'rev-parse','HEAD^'),branch:git(site,'branch','--show-current'),checks:13,changedLessons:3,unchangedLessons:969,canonicalUnchanged:true,websiteImported:false,installed:false,clinicalApproval:false};
fs.writeFileSync(root+'/COMMIT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
