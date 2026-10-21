import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',candidate=base+'source190-website',prep=json(candidate+'/PREPARATION.json'),proposal=base+'review-destination-ui-proposal',stage=base+'review-destination-application';
const rows=json(candidate+'/SOURCE_INPUTS_AFTER.json');assert.equal(rows.length,5095);for(const row of rows)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
assert(fs.existsSync(base+'source190-desktop-qa/STOPPED.json'),'Stop owned QA server first');assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const spec=[
 ['app/layout.tsx','ea5fa4acdb32e28b27b453e71817ae3b3decf9f63a53154cfa3d561956d7d513','27fe8a8ba3ea547d88f0e2f5f489bad1380ebe5f53507e8ef4cad2e97fb2ac15'],
 ['components/SiteHeader.tsx','ab71e13765bb490f5f891d933f09b40987c9643f4e4bee1ba7c2471fa94feeec','f989c863450e3338c5b9d757016afe927013489e662edc587b86e0a0f3d5011a'],
 ['components/SiteFrame.tsx','8a507e7acbbd860ac69e64ff54a7253b92e357c0d4a3ab58e878570ff3007c10','95f085172adcc7ae788a35c14092fac67e2bcf8bdeb8b01733fb0b0d95bd3f57'],
 ['lib/review-destination.ts',null,'232bcb96a6737dfe0e85752e7f467681cbbcf605fb0f6e5e07b74449bbc5bd3b'],
];
let patch='*** Begin Patch\n';const changes=[];
for(const[p,before,after]of spec){
 const post=read(proposal+'/postimages/'+p);assert.equal(sha(post),after);
 if(before){const bytes=read(prep.site+'/'+p);assert.equal(sha(bytes),before);assert.equal(sha(read(proposal+'/preimages/'+p)),before);const target=stage+'/preimages/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});
  const diff=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--no-color','--',proposal+'/preimages/'+p,proposal+'/postimages/'+p],{windowsHide:true,encoding:'utf8',maxBuffer:4e6});assert.equal(diff.status,1);
  const hunks=diff.stdout.slice(diff.stdout.indexOf('@@')).replace(/^@@.*$/gm,'@@').replace(/^\\ No newline at end of file\r?\n/gm,'');assert(hunks.startsWith('@@\n'));
  patch+='*** Update File: '+prep.site+'/'+p+'\n'+hunks.replace(/\r\n/g,'\n').replace(/\n?$/,'\n');
 }else{assert(!fs.existsSync(prep.site+'/'+p));patch+='*** Add File: '+prep.site+'/'+p+'\n'+post.toString().replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n').map(l=>'+'+l).join('\n')+'\n';}
 changes.push({path:p,beforeSha256:before,proposedSha256:after});
}
const raw=read(proposal+'/tests/review-destination.test.mjs').toString();assert.equal(sha(raw),'a9e35bef4041832d08339432f9934019579b4bd59f6e37925bc3d7ce8027c152');
let test=raw;for(const [from,to]of [["'../postimages/lib/review-destination.ts'","'../lib/review-destination.ts'"],['`../postimages/${path}`','`../${path}`']]){assert.equal(test.split(from).length,2);test=test.replace(from,to);}assert(!fs.existsSync(prep.site+'/tests/review-destination.test.mjs'));
patch+='*** Add File: '+prep.site+'/tests/review-destination.test.mjs\n'+test.replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch\n';
fs.writeFileSync(stage+'/ADMISSION.patch',patch,{flag:'wx'});fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({stage,site:prep.site,atlas:prep.atlas,source:prep.sourceCommit,review:json(prep.site+'/atlas-review/manifest.json').websiteIntegrationSha256,originalInputs:5095,changes,proposalTestBridgeOnly:true,privateStateCopied:false,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
console.log(patch);
