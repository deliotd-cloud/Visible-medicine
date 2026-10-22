// Create-only, local Atlas candidate; never installs into the running website.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const source='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate';
const target=stage+'/atlas';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(cwd,args)=>execFileSync('git',args,{cwd,windowsHide:true,encoding:'utf8',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
assert.equal(git(source,['rev-parse','HEAD']),baseline);
assert.equal(git(source,['status','--porcelain']),'');
const resume=process.argv.length===3&&process.argv[2]==='--resume-exact-baseline';
assert(process.argv.length===2||resume,'Only an explicit exact-baseline resume is accepted');
assert(!fs.existsSync(stage)||resume,'Candidate is create-only');
assert(!fs.existsSync(stage+'/PREPARATION.json'),'Completed preparation is immutable');
if(!resume){
  fs.mkdirSync(stage,{recursive:true});
  git(stage,['clone','--shared','--no-checkout',source,target]);
  git(target,['-c','core.autocrlf=false','checkout','--detach',baseline]);
}
assert.equal(git(target,['rev-parse','HEAD']),baseline);
assert.equal(git(target,['status','--porcelain']),'');
assert.deepEqual(fs.readFileSync(source+'/package-lock.json'),fs.readFileSync(target+'/package-lock.json'));
// Local installed dependencies only. No install/network or external path alias.
if(!resume)fs.cpSync(source+'/node_modules',target+'/node_modules',{recursive:true,errorOnExist:true,force:false});
else assert(fs.statSync(target+'/node_modules/typescript/lib/tsc.js').isFile());
const paths=git(target,['ls-files','-z']).split('\0').filter(Boolean);
const records=paths.map(path=>({path,bytes:fs.statSync(target+'/'+path).size,sha256:sha(fs.readFileSync(target+'/'+path))}));
const lineEndingDifferences=[];
for(const row of records){
  const original=fs.readFileSync(source+'/'+row.path),copy=fs.readFileSync(target+'/'+row.path);
  if(sha(original)===row.sha256)continue;
  assert(!original.includes(0)&&!copy.includes(0),'Binary source differs: '+row.path);
  assert.equal(original.toString('utf8').replaceAll('\r\n','\n'),copy.toString('utf8').replaceAll('\r\n','\n'),row.path);
  lineEndingDifferences.push({path:row.path,canonicalSha256:sha(original),candidateSha256:row.sha256});
}
const receipt={schemaVersion:1,at:new Date().toISOString(),baseline,source,target,tree:git(target,['rev-parse','HEAD^{tree}']),records,
  dependencyLockSha256:sha(fs.readFileSync(target+'/package-lock.json')),dependencies:'local physical copy; no install or network',lineEndingDifferences,
  installed:false,previewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({target,baseline,trackedPaths:records.length,receipt:stage+'/PREPARATION.json',previewChanged:false}));
