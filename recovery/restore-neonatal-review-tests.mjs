import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [baseline,destination]=process.argv.slice(2),bundle=path.dirname(fileURLToPath(import.meta.url));
assert(baseline&&destination&&path.isAbsolute(baseline)&&path.isAbsolute(destination),'Explicit absolute local baseline and new scratch output required');
assert(!fs.existsSync(destination),'Never overwrite existing work');
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),spec=JSON.parse(fs.readFileSync(bundle+'/RECOVERY_SPEC.json'));
assert.equal(spec.schema,'vm-neonatal-source-recovery-spec/1');assert.equal(spec.patched.length,3);assert.equal(spec.whole.length,3);
const relative=p=>assert(/^tests\/[a-z0-9./-]+$/.test(p)&&p.split('/').every(v=>v&&v!=='.'&&v!=='..'));
assert.equal(sha(bundle+'/neonatal-review-tests.patch'),spec.patchSha256);
for(const r of spec.patched){relative(r.path);assert.equal(sha(baseline+'/'+r.path),r.beforeSha256,r.path);}
for(const r of spec.whole){relative(r.path);assert.equal(sha(bundle+'/website/'+r.path),r.sha256,r.path);}
fs.mkdirSync(destination,{recursive:true});
for(const r of spec.patched){fs.mkdirSync(path.dirname(destination+'/'+r.path),{recursive:true});fs.copyFileSync(baseline+'/'+r.path,destination+'/'+r.path,fs.constants.COPYFILE_EXCL);}
const git=args=>execFileSync('git',['-C',destination,...args],{windowsHide:true,stdio:'pipe',env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1'}});
git(['init','-q']);git(['config','--local','core.autocrlf','false']);git(['apply','--unidiff-zero','--whitespace=nowarn',bundle+'/neonatal-review-tests.patch']);
for(const r of spec.patched)assert.equal(sha(destination+'/'+r.path),r.afterSha256,r.path);
for(const r of spec.whole){fs.mkdirSync(path.dirname(destination+'/'+r.path),{recursive:true});fs.copyFileSync(bundle+'/website/'+r.path,destination+'/'+r.path,fs.constants.COPYFILE_EXCL);assert.equal(sha(destination+'/'+r.path),r.sha256);}
const {restorePreNeonatalReasoningRole}=await import(pathToFileURL(destination+'/tests/restore-neonatal-reasoning-role.mjs'));
const fixture=restorePreNeonatalReasoningRole(fs.readFileSync(destination+'/tests/clinical-review-neonatal-cranial-us.test.ts','utf8'));
relative(spec.localFixture.path);fs.mkdirSync(path.dirname(destination+'/'+spec.localFixture.path),{recursive:true});fs.writeFileSync(destination+'/'+spec.localFixture.path,fixture,{flag:'wx'});assert.equal(sha(destination+'/'+spec.localFixture.path),spec.localFixture.sha256);
console.log(JSON.stringify({restoredSourceFiles:6,reconstructedLocalFixture:true,fixtureWasNotInBackup:true,exactBaselineRequired:true,wholePrivateOrRunnableBackup:false}));
