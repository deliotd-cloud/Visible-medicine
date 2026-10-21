import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-review-destination-application',prep=json(stage+'/PREPARATION.json'),proposal='F:/VisibleMedicine/staging/20261021-review-nav-harness-proposal';
const spec=[
 ['tests/siteframe-focus-lifecycle.test.mjs','a4ce563e5e725d7b1e71906d5f1968dcb962fa78c85e24869187f80adb1dc908','6b21f953f8eb654c1c2ed3cc122741ccf4b2d0e26929d63ee809e20a28b63b5b'],
 ['tests/workspace-utilities-dismissal.test.mjs','e51e1c845ec7f64946cb860f154d9c5bda1d0063e3ac4d626e7150078b449202','0b06f9be790ceb6f9e2bad8d984d78dd279c9502227197b1742c328c486f6cf4'],
 ['tests/desktop-workspace-simplification.test.ts','9a1f3e90e1a895c37d06f4ab61510ea2bd0296422b1448b916d9cea6d47f0036','0b30894747d65a9da04e07c443fb367d7f838283291dbbac6295db01ac6bd02b']];
const inverse=spawnSync(process.execPath,[proposal+'/verify-inverse.mjs'],{windowsHide:true,encoding:'utf8'});assert.equal(inverse.status,0,inverse.stderr);
let patch='*** Begin Patch\n';const changes=[];
for(const[p,before,after]of spec){assert.equal(sha(read(prep.site+'/'+p)),before);assert.equal(sha(read(proposal+'/preimages/'+p)),before);assert.equal(sha(read(proposal+'/postimages/'+p)),after);
 const to=stage+'/preimages/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,read(prep.site+'/'+p),{flag:'wx'});
 const diff=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--no-color','--',proposal+'/preimages/'+p,proposal+'/postimages/'+p],{windowsHide:true,encoding:'utf8',maxBuffer:4e6});assert.equal(diff.status,1);
 patch+='*** Update File: '+prep.site+'/'+p+'\n'+diff.stdout.slice(diff.stdout.indexOf('@@')).replace(/^@@.*$/gm,'@@').replace(/\r\n/g,'\n').replace(/\n?$/,'\n');changes.push({path:p,beforeSha256:before,sha256:after});
}patch+='*** End Patch\n';
fs.writeFileSync(stage+'/HARNESS_ADMISSION.json',JSON.stringify({changes,wholeOriginalInversesPassed:true,inverseVerifierSha256:sha(read(proposal+'/verify-inverse.mjs')),outputSha256:sha(inverse.stdout),allRegistrationsAndAssertionsPreserved:true,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});fs.writeFileSync(stage+'/HARNESS_ADMISSION.patch',patch,{flag:'wx'});console.log(patch);
