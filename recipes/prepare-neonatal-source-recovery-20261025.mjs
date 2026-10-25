import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const sourceFile='F:/VisibleMedicine/staging/20261025-neonatal-current-final-website/SOURCE_CANDIDATE.json';
const baselineFile='F:/VisibleMedicine/staging/20261025-checklist-child-env-website/SOURCE_CANDIDATE.json';
assert.equal(hash(sourceFile),'7f105c077fa9813868dc25efd849ebb7ac20934162cc8e9d8431f540ef2fd0e4');
assert.equal(hash(baselineFile),'90d21dddfcdffbe42dd6265facb532655c73ff93d85c29acdfd1ded76bb8a509');
const source=json(sourceFile),baseline=json(baselineFile),directory='F:/VisibleMedicine/staging/20261025-neonatal-source-recovery';
assert(!fs.existsSync(directory));fs.mkdirSync(directory,{recursive:true});
const patched=['tests/neonatal-inbox-contexts.mjs','tests/clinical-review-neonatal-cranial-us.test.ts','tests/cranial-tour-current-epoch.test.mjs'];
const whole=['tests/neonatal-review-input-path.test.mjs','tests/restore-pre-tour-head-entry.mjs','tests/restore-neonatal-reasoning-role.mjs'];
let patch='';
for(const p of patched){
 const old=baseline.sourceRows.find(r=>r.path===p),now=source.sourceRows.find(r=>r.path===p);assert(old&&now);assert.equal(hash(baseline.website+'/'+p),old.sha256);assert.equal(hash(source.website+'/'+p),now.sha256);
 const run=spawnSync('git',['--no-pager','diff','--no-index','--no-ext-diff','--text','--unified=0','--',baseline.website+'/'+p,source.website+'/'+p],{encoding:'utf8',maxBuffer:4e6,windowsHide:true,env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_OPTIONAL_LOCKS:'0'}});
 assert.equal(run.status,1);assert(!run.error);assert.match(run.stdout,/^diff --git /);
 const lines=run.stdout.split('\n');lines[0]='diff --git a/'+p+' b/'+p;
 const minus=lines.findIndex(s=>s.startsWith('--- ')),plus=lines.findIndex(s=>s.startsWith('+++ '));assert(minus>0&&plus===minus+1);lines[minus]='--- a/'+p;lines[plus]='+++ b/'+p;patch+=lines.join('\n');
}
assert(!patch.includes('GIT binary patch'));fs.writeFileSync(directory+'/neonatal-review-tests.patch',patch,{flag:'wx'});
for(const p of whole){fs.mkdirSync(path.dirname(directory+'/website/'+p),{recursive:true});fs.copyFileSync(source.website+'/'+p,directory+'/website/'+p,fs.constants.COPYFILE_EXCL);}
const spec={schema:'vm-neonatal-source-recovery-spec/1',baselineSourceSha256:hash(baselineFile),candidateSourceSha256:hash(sourceFile),patchSha256:hash(directory+'/neonatal-review-tests.patch'),patched:patched.map(p=>({path:p,beforeSha256:baseline.sourceRows.find(r=>r.path===p).sha256,afterSha256:source.sourceRows.find(r=>r.path===p).sha256})),whole:whole.map(p=>({path:p,sha256:source.sourceRows.find(r=>r.path===p).sha256})),localFixture:{path:'tests/fixtures/neonatal-reasoning-before/clinical-review-neonatal-cranial-us.test.ts.raw',sha256:'7ef70ac4d6acfebf71f71c0acda604abf731b953d09162363166153b20482268'},rawFixtureIncluded:false,scope:'Incremental test and test-input guard source only; exact retained local baseline and prior filtered supplements required. No complete medical fixtures, private references/configuration, generated Review/source context, models, runtime or Git ancestry included.'};
fs.writeFileSync(directory+'/RECOVERY_SPEC.json',JSON.stringify(spec,null,2)+'\n',{flag:'wx'});
fs.copyFileSync('restore-neonatal-review-tests.mjs',directory+'/restore-neonatal-review-tests.mjs',fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({directory,specSha256:hash(directory+'/RECOVERY_SPEC.json'),patchBytes:Buffer.byteLength(patch),selectedWhole:whole.length,patched:patched.length}));
