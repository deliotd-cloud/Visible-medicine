// Preserve the exact verified isolated Atlas source; never touches the owner preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-renal-tour-source-candidate',atlas=stage+'/atlas';
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-source-verified';
assert(!fs.existsSync(root));
const git=args=>runGit(['-C',atlas,...args]).toString();
const baseline='389bd0ca846a42c7f21055f55904bcf5df81a09f';
assert.equal(git(['rev-parse','HEAD']).trim(),baseline);
const result=json(stage+'/verification-final/TERMINAL.json');
assert.equal(result.code,0);assert.equal(result.commands.length,9);assert(result.commands.every(c=>c.code===0));
assert.deepEqual(result.sourceDrift,[]);
for(const c of result.commands)for(const stream of ['stdout','stderr'])assert.equal(sha(read(`${stage}/verification-final/${c.label}.${stream}.log`)),c[stream+'Sha256']);
const bound=json(stage+'/verification-bound/TERMINAL.json');
assert(bound.commands.slice(0,5).every(c=>c.code===0));
for(const c of bound.commands.slice(0,5))for(const stream of ['stdout','stderr'])assert.equal(sha(read(`${stage}/verification-bound/${c.label}.${stream}.log`)),c[stream+'Sha256']);
const reg=JSON.parse(read(result.priorRegistration));
assert.equal(reg.affectedReviewPackets,5);assert.equal(reg.unchangedReviewPackets,1099);assert.equal(reg.unchangedTopicPlacements,9936);
assert.equal(reg.smoothCameraAndPlaybackPreserved,true);
const player=read(result.priorPlayer).toString();assert(player.includes('tests 75')&&player.includes('pass 75')&&player.includes('fail 0'));
const substantive=['content/body-renderer-revision.json','content/body-review-display-pins.json','content/renal-tour-pins.json','lib/regional-tours.ts','lib/renal-tour.ts','scripts/pin-renal-tour.mjs','scripts/test-renal-tour-registration.mjs','scripts/test-renal-tour-source.mjs','scripts/test-renal-tour-wholebody-admission.mjs','scripts/test-whole-body-guided-learning.mjs'].sort();
const initial=git(['status','--porcelain=v1']).trimEnd().split('\n').filter(Boolean).map(s=>s.slice(3).trim());
assert(initial.every(p=>substantive.includes(p)||p==='content/review-revisions.json'));
const inputs=json(stage+'/verification-final/INPUTS.json').before;
for(const p of [...substantive,'content/review-revisions.json']){const row=inputs.find(r=>r.path===p);assert(row);assert.equal(sha(read(atlas+'/'+p)),row.sha256,p);}
assert.equal(git(['diff','--name-only','--','public/models']).trim(),'');
fs.mkdirSync(root,{recursive:true});
const rows=[];
for(const p of [...substantive,'content/review-revisions.json']){
 const b=read(atlas+'/'+p),dest=root+'/local-exact-source/'+p;fs.mkdirSync(dest.slice(0,dest.lastIndexOf('/')),{recursive:true});fs.writeFileSync(dest,b,{flag:'wx'});
 rows.push({path:p,bytes:b.length,sha256:sha(b)});
}
git(['add','--',...substantive,'content/review-revisions.json']);
assert.deepEqual(git(['diff','--cached','--name-only']).trim().split('\n').sort(),substantive);
git(['commit','-m','Bind existing renal guided tour to exact reviewed source records']);
assert.equal(git(['status','--porcelain=v1']).trim(),'');
const head=git(['rev-parse','HEAD']).trim(),tree=git(['rev-parse','HEAD^{tree}']).trim();
assert.deepEqual(git(['diff-tree','--no-commit-id','--name-only','-r',head]).trim().split('\n').sort(),substantive);
for(const row of rows)assert.equal(sha(read(atlas+'/'+row.path)),row.sha256,'Commit must not mutate verified source bytes.');
const receipt={schema:'vm-renal-source-verified/1',at:new Date().toISOString(),atlas,baseline,head,tree,clean:true,sourceRows:rows,verifiedSourceRowsUnchanged:true,
 finalVerification:{path:stage+'/verification-final/TERMINAL.json',sha256:sha(read(stage+'/verification-final/TERMINAL.json'))},
 priorBoundVerification:{path:stage+'/verification-bound/TERMINAL.json',sha256:sha(read(stage+'/verification-bound/TERMINAL.json')),wholeBodyRevisionFailureRetained:true},
 initialOldDisplayPinRefusal:stage+'/verification/TERMINAL.json',registration:reg,playerTests:75,playerPass:75,
 changedFiles:substantive,geometryChanged:false,newMedicalClaims:false,canonicalInstalled:false,websiteImportPending:true,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),head,tree,clean:true,paths:substantive.length,ownerPreviewChanged:false}));
