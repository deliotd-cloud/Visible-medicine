import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const proposal='F:/VisibleMedicine/staging/20261024-adjacent-native-execution';
const output='F:/VisibleMedicine/staging/20261024-guided-review-completeness';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),hash=p=>sha(read(p));
const parentPath='F:/VisibleMedicine/staging/20261024-tour-explore-website/SOURCE_BOUND.json';
assert.equal(hash(parentPath),'014cbdb76e216f2a6e64f2feddac63126517111bc8e093e0cd41ed984c8c1c80');
const parent=json(parentPath),receipt=json(proposal+'/RECEIPT.json'),final=json(proposal+'/FINAL_VALIDATION.json');
assert.equal(hash(proposal+'/FINAL_VALIDATION.json'),'8e67dacb12b1f0bd459450515de1d6e088ee48d7caa420b1752d4ef98e25a15c');
assert.equal(receipt.files.length,24);assert.equal(final.roots,16);assert.equal(final.cases,37);assert.equal(final.pass,37);assert.equal(final.fail,0);
const permitted=new Map(receipt.files.map(r=>[r.path,r]));
assert.equal(permitted.size,24);
const changes=[];
for(const row of parent.sourceRows){
 assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);
 const current=hash(proposal+'/website/'+row.path),changed=permitted.get(row.path);
 if(changed){assert.equal(changed.parentSha256,row.sha256);assert.equal(current,changed.currentSha256);changes.push(row.path);}
 else assert.equal(current,row.sha256,'Unassigned source changed: '+row.path);
}
const additions=[];
for(const row of receipt.files){
 assert(row.path.startsWith('tests/')&&!row.path.split('/').includes('..'));
 assert.equal(hash(proposal+'/website/'+row.path),row.currentSha256);
 if(row.parentSha256===null){assert(!parent.sourceRows.some(p=>p.path===row.path));additions.push(row.path);}
}
assert.equal(changes.length+additions.length,24);
const known=new Set([...parent.sourceRows.map(r=>r.path),...additions]);
const actual=[];
function walk(dir,prefix=''){
 for(const row of fs.readdirSync(dir,{withFileTypes:true})){
  const p=prefix+row.name;
  if(p==='node_modules'){assert(fs.lstatSync(dir+'/'+row.name).isSymbolicLink());continue;}
  assert(!row.isSymbolicLink(),'Unexpected source link: '+p);
  if(row.isDirectory())walk(dir+'/'+row.name,p+'/');else {assert(row.isFile());actual.push(p);}
 }
}
walk(proposal+'/website');
// The original keyboard negative test intentionally retains three files per
// native child. Admit only the three observed directories, after checking their
// exact mutation script and expected failing-child evidence; not an ignore glob.
const negativeDirectories=['2IX4z2','9GJVb9','HcvEnM'].map(suffix=>'.local/keyboard-epoch-refusal-'+suffix);
const negativeEvidence=[];
const originalPreload=read(proposal+'/website/'+negativeDirectories[0]+'/forge-review-geometry.mjs');
assert(originalPreload.toString().includes('"vm:anatomy:upper-limb:shoulder:right:bone:scapula"'));
assert(originalPreload.toString().includes("geometry='0'.repeat(64)"));
for(const dir of negativeDirectories){
 const base=proposal+'/website/'+dir,result=json(base+'/RESULT.json'),tap=read(base+'/child.tap').toString();
 assert.equal(result.exitCode,1);assert.equal(result.expectedRefusal,true);assert.equal(result.productFilesEdited,false);
 assert.equal(result.logSha256,hash(base+'/child.tap'));
 assert.match(tap,/^# fail 1$/m);assert.match(tap,/^# pass 0$/m);assert.match(tap,/^# cancelled 0$/m);
 assert(tap.includes('0'.repeat(64)));assert.deepEqual(read(base+'/forge-review-geometry.mjs'),originalPreload);
 for(const name of ['RESULT.json','child.tap','forge-review-geometry.mjs']){
  known.add(dir+'/'+name);negativeEvidence.push({path:dir+'/'+name,sha256:hash(base+'/'+name),testEvidenceOnly:true});
 }
}
assert.deepEqual(actual.sort(),[...known].sort(),'No undeclared product or generated additions beyond authenticated negative-test evidence');
for(const group of ['logs','scripts'])for(const row of receipt[group])assert.equal(hash(proposal+'/'+row.path),row.sha256,row.path);
assert.equal(hash(proposal+'/MAIN_REVIEW.json'),receipt.mainReviewSha256);
const roots=[];
for(const result of final.results){
 const log=proposal+'/'+result.log;assert.equal(hash(log),result.logSha256);
 const record=json(log),row=(record.rows??[record]).find(row=>row.root===result.root);assert(row,result.root);
 assert.equal(row.sourceSha256,hash(proposal+'/website/'+result.root));assert.equal(row.sourceSha256,result.sourceSha256);
 assert.equal(row.pid,result.pid);assert.equal(row.exitCode,0);assert.equal(result.exitCode,0);
 assert.equal(row.atlasHead,receipt.atlasHead);assert.equal(row.atlasTree,receipt.atlasTree);
 assert.equal(hash(row.stdout),row.stdoutSha256);assert.equal(hash(row.stderr),row.stderrSha256);assert.equal(hash(row.stdout),result.tapSha256);
 const tap=read(row.stdout).toString(),count=k=>Number(tap.match(new RegExp('^# '+k+' (\\d+)','m'))?.[1]??-1);
 assert.equal(count('tests'),result.cases);assert.equal(count('pass'),result.cases);assert.equal(count('fail'),0);assert.equal(count('skipped'),0);assert.equal(count('cancelled'),0);
 roots.push({root:result.root,cases:result.cases,pid:result.pid,log,logSha256:hash(log),tapSha256:hash(row.stdout),stderrSha256:hash(row.stderr)});
}
assert.equal(roots.reduce((n,r)=>n+r.cases,0),37);
const earlier='F:/VisibleMedicine/recovery/checkpoints/20261021-four-modules-verified';
assert.equal(hash(earlier+'/checkpoint.json'),'254fc6b66c9cafa4358914654d7880736f02a5578fa47627a7fd43f5c9ebc85e');
const committed=json(earlier+'/evidence/COMMITTED.json');
assert.equal(committed.commit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(committed.tree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');
assert.equal(execFileSync('git',['-C',parent.atlas,'rev-parse',`${committed.commit}^{tree}`],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim(),committed.tree);
const oldManifest=earlier+'/evidence/module-manifests/shoulder.json';
const originalExport='F:/VisibleMedicine/staging/20261021-four-module-admission-v2/export/public/atlas-runtime/shoulder';
const fixtures=proposal+'/website/tests/fixtures/renal-epoch-preimage';
assert.equal(hash(oldManifest),'85230df1327b2913bf35cd7071d1a488f47ad7f0885b8640f25ba688895b5bca');
assert.deepEqual(read(oldManifest),read(originalExport+'/manifest.json'));assert.deepEqual(read(oldManifest),read(fixtures+'/shoulder-190a-manifest.json.raw'));
const expectedInput=json(oldManifest).files.find(r=>r.path==='source-inputs.json');assert(expectedInput);
assert.equal(expectedInput.sha256,'70bc33c2ee27fdad088cce874c3f93980715241fdc901947547b089ec8fa37ce');assert.equal(expectedInput.bytes,154396);
assert.equal(hash(originalExport+'/source-inputs.json'),expectedInput.sha256);assert.deepEqual(read(originalExport+'/source-inputs.json'),read(fixtures+'/shoulder-190a-source-inputs.json.raw'));
const inventory=json(originalExport+'/source-inputs.json');assert.equal(inventory.length,1120);assert(!inventory.some(r=>r.path==='lib/regional-tours.ts'));
const value={at:new Date().toISOString(),proposal,receiptSha256:hash(proposal+'/RECEIPT.json'),finalSha256:hash(proposal+'/FINAL_VALIDATION.json'),
 parentReceipt:parentPath,parentReceiptSha256:hash(parentPath),historicalSource:receipt.atlasHead,historicalTree:receipt.atlasTree,
 changedTestPaths:changes,newTestPaths:additions,allOtherParentSourceRowsExact:true,noUndeclaredProductSourceAdditions:true,negativeEvidence,roots,cases:37,
 auditInitialFailure:'The first scope audit correctly found nine extra .local files. They are the original keyboard test\'s three retained expected-refusal child evidence sets; final audit authenticates each exact path, script and failing result rather than ignoring .local.',
 independentShoulderProvenance:{checkpoint:earlier+'/checkpoint.json',checkpointSha256:hash(earlier+'/checkpoint.json'),manifestSha256:hash(oldManifest),inputsSha256:expectedInput.sha256,source:committed.commit,tree:committed.tree,inputRows:1120,regionalInputAbsent:true},
 limitations:['Historical 5e75 focused execution, not current 5f3 acceptance or the complete historic suite.',
 'Per-run imported-helper closures were not sealed by the worker. Final source and log integrity are now independently checked; not a new all-16 execution.',
 'Original guide helper admits omitted additions. Current successor supplements it with a separate complete-membership proof, never silently substitutes a current source into historical theorems.',
 'All 24 proposed test edits remain isolated and unintegrated into the current Website. No clinical, privacy, release or registration approval.'],
 productChanges:false,previewChanged:false,installed:false};
fs.writeFileSync(output+'/ADJACENT_AUDIT.json',JSON.stringify(value,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({auditedRoots:roots.length,cases:37,testEdits:24,productChanges:false,independentShoulderProvenance:true,report:output+'/ADJACENT_AUDIT.json'}));
