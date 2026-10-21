import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/staging/20261021-source190-website/website';
const proposal='F:/VisibleMedicine/staging/20261021-local-r2-persistence-proposal';
const stage='F:/VisibleMedicine/staging/20261021-local-r2-persistence-application-v2';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const changes=[['scripts/stage-clinical-review-candidate-local.mjs','95a49ed55e773e157a2951422005e67171f9457709dc5f8bb283f25d4b79d5b5','daf8450193dda4b64d798e5989d1988f46530c325c3f4d71e1f5a2e3ecf1c868'],['scripts/local-r2-persistence.mjs',null,'6e36899805273d4d8f916ace6605474c11e60c1c38c03b914a8886f07fc75c67'],['tests/local-r2-persistence.test.mjs',null,'be5abd2e6aaf45c2c6423883d219bb84e7ae714baa0ebc4a3ccd6e9a3ca0edad']];
assert(changes.every(([,before,after])=>(before===null||/^[a-f0-9]{64}$/.test(before))&&/^[a-f0-9]{64}$/.test(after)));
const patch=['*** Begin Patch'];
for(const [p,before,after]of changes){
 const b=read(proposal+'/'+p);assert.equal(sha(b),after,p);const target=site+'/'+p;
 if(before){assert.equal(sha(read(target)),before,p);const dest=stage+'/preimages/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(target,dest,fs.constants.COPYFILE_EXCL);const d=spawnSync('git',['diff','--no-index','--no-ext-diff','--text',target,proposal+'/'+p],{windowsHide:true,encoding:'utf8'});assert.equal(d.status,1);const lines=d.stdout.replaceAll('\r\n','\n').split('\n');patch.push('*** Update File: '+target,...lines.slice(lines.findIndex(l=>l.startsWith('@@'))).filter(l=>!l.startsWith('\\ No newline')).map(l=>l.startsWith('@@')?'@@':l).filter((l,i,a)=>i<a.length-1||l!==''));}
 else{assert(!fs.existsSync(target));patch.push('*** Add File: '+target,...b.toString().replaceAll('\r\n','\n').replace(/\n$/,'').split('\n').map(l=>'+'+l));}
}
patch.push('*** End Patch');fs.writeFileSync(stage+'/ADMISSION.json',JSON.stringify({changes:changes.map(([path,beforeSha256,proposedSha256])=>({path,beforeSha256,proposedSha256})),canonicalInstalled:false},null,2)+'\n',{flag:'wx'});fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({stage,site,atlas:'F:/VisibleMedicine/staging/20261021-atlas-combined-source'},null,2)+'\n',{flag:'wx'});console.log(patch.join('\n'));
