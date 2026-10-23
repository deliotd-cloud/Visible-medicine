// Isolated Atlas authoring only; no Website import or preview mutation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const source='F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized/atlas';
const stage='F:/VisibleMedicine/staging/20261023-digital-vein-ultrasound',atlas=stage+'/atlas';
const git=(root,...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8',windowsHide:true,maxBuffer:16e6}).trim();
assert.equal(git(source,'rev-parse','HEAD'),'9e1407629bd6f85061537c9f013fd72e4543e0da');
assert.equal(git(source,'status','--porcelain'),'');
const finish=process.argv.includes('--finish-verified-copy');
const resume=process.argv.includes('--resume-line-endings')||finish;
if(!resume){
 assert(!fs.existsSync(stage));fs.mkdirSync(stage);
 execFileSync('git',['clone','--shared','--no-checkout',source,atlas],{windowsHide:true,stdio:'pipe'});
 git(atlas,'checkout','--detach','9e1407629bd6f85061537c9f013fd72e4543e0da');
}else{
 assert(!fs.existsSync(stage+'/PREPARED.json'));assert(!fs.existsSync(atlas+'/node_modules'));
 assert.equal(git(atlas,'rev-parse','HEAD'),git(source,'rev-parse','HEAD'));
 if(!finish)assert.equal(git(atlas,'status','--porcelain').length,0);
 const digest=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 if(!finish){fs.mkdirSync(stage+'/preparation-diagnostic');
 for(const p of ['package-lock.json','app/body-content.ts'])fs.copyFileSync(atlas+'/'+p,stage+'/preparation-diagnostic/'+p.replaceAll('/','_')+'.raw',fs.constants.COPYFILE_EXCL);
 fs.writeFileSync(stage+'/preparation-diagnostic/FAILURE.json',JSON.stringify({observedError:'RangeError: Array buffer allocation failed',phase:'After clean Git checkout, before dependency junction or source edits',actualDifference:'Clone inherited core.autocrlf=true; checked-out lock/app source became CRLF while preserved baseline is LF. Huge deepEqual Buffer diagnostic failed.',lockBefore:digest(atlas+'/package-lock.json'),lockBaseline:digest(source+'/package-lock.json'),heapRaised:false},null,2)+'\n',{flag:'wx'});
 git(atlas,'config','--local','core.autocrlf','false');}
 // Mechanical exact-byte restoration of this owned, still-clean staging clone.
 for(const p of git(source,'ls-files','-z').split('\0').filter(Boolean)){
  if(!finish)fs.copyFileSync(source+'/'+p,atlas+'/'+p);
  assert.equal(digest(atlas+'/'+p),digest(source+'/'+p),p);
 }
 // Rebuild only this clone's index after byte verification. No working-file reset.
 git(atlas,'read-tree','HEAD');
}
assert.equal(git(atlas,'status','--porcelain').length,0);
assert.equal(createHash('sha256').update(fs.readFileSync(atlas+'/package-lock.json')).digest('hex'),createHash('sha256').update(fs.readFileSync(source+'/package-lock.json')).digest('hex'));
fs.symlinkSync(source+'/node_modules',atlas+'/node_modules','junction');
fs.mkdirSync(stage+'/preimages');fs.copyFileSync(atlas+'/app/body-content.ts',stage+'/preimages/body-content.ts.raw',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),source,atlas,head:git(atlas,'rev-parse','HEAD'),tree:git(atlas,'rev-parse','HEAD^{tree}'),previewChanged:false,installed:false,dependenciesInstalled:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,atlas,previewChanged:false}));
