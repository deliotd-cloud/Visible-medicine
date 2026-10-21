import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';

const site='F:/VisibleMedicine/website';
const stage='F:/VisibleMedicine/staging/20261021-psoas-salivary-epoch-application';
const psoas='F:/VisibleMedicine/staging/20261021-psoas-current-epoch-proposal';
const salivary='F:/VisibleMedicine/staging/20261021-salivary-cache-epoch-proposal';
const priorPath='F:/VisibleMedicine/staging/20261021-runtime-license-and-build-application/SOURCE_INPUTS_AFTER.json';
assert.equal(sha(read(priorPath)),'1b6149e6acea7e37df75085566d934b38ac818b91fa85b5585cd51a901a4ea4b');
const prior=json(priorPath);assert.equal(prior.length,5154);
const source='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const review='34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f';
const spec=[
 [psoas,'tests/clinical-review-psoas-xray.test.ts','7687a4b56ee61dcb46603cdcab5b7e273b2f7cfa7456a854f859b37cb2cf9af4','48bd7232dc16e830cd5f8a7be95ab6ead9de41d9365ff55815457360f49dff16'],
 [psoas,'tests/fixtures/clinical-review-psoas-xray.original.raw',null,'7687a4b56ee61dcb46603cdcab5b7e273b2f7cfa7456a854f859b37cb2cf9af4'],
 [psoas,'tests/clinical-review-psoas-current-preservation.test.mjs',null,'ce84fc5cc359907e07bffd364cb00de7c9c2b3a232254956d04d35fd60aece51'],
 [salivary,'tests/clinical-review-salivary-stylohyoid-quiz.test.ts','c4e18aeb9ce2056cb50fcef3a665de0356f91b88ff78992a928b7346f3ca2362','a6fea25a4dd1bde5c87d02cf993459a44c255a735e73ef9e0e7b20331309696a'],
 [salivary,'tests/clinical-review-git-root-preservation.test.mjs','d7bd7c4e5abb369c00a69cf049d02848f77064b14f757573297393eac6bab4a1','59bf61933c8a8944bb7da9bd10cdb517c93ddd65af74ef34b0934c66389397a2'],
 [salivary,'tests/atlas190-current-delivery.test.mjs','1788fce7a307bc36145b20a570e3783a4c496cb1f06e26f8faf1b38195db93ef','8b6e741d1565be147f25258163ffdc00830aafcca2f4a04b39a0f4edbd5e62cf'],
 [salivary,'tests/fixtures/salivary-cache-epoch-20261021/original.ts.raw',null,'c4e18aeb9ce2056cb50fcef3a665de0356f91b88ff78992a928b7346f3ca2362'],
 [salivary,'tests/fixtures/salivary-cache-epoch-20261021/git-root-preservation.original.mjs.raw',null,'d7bd7c4e5abb369c00a69cf049d02848f77064b14f757573297393eac6bab4a1'],
 [salivary,'tests/fixtures/salivary-cache-epoch-20261021/atlas190-current-delivery.original.mjs.raw',null,'1788fce7a307bc36145b20a570e3783a4c496cb1f06e26f8faf1b38195db93ef'],
 [salivary,'tests/salivary-cache-epoch-adapter.mjs',null,'8a84ac8dfe143a07113ca237e31ab1443ffe8a80a79c6a9559adef4362aedab0'],
 [salivary,'tests/salivary-cache-epoch-preservation.test.mjs',null,'f17f2181b380bae251927bda8feeca6e214a251444e8c0e8fb50bf29121cd1e4'],
 [salivary,'tests/salivary-cache-guard-adaptation.test.mjs',null,'fb0a1ad5a1fb5e2a1c2598acdc96cc3dbb7bf1dade9859e5e3b2a5bfb144c468'],
];
const save=(name,value)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
function environment(){
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),source);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain=v1']).toString().trim(),'');
 const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,review);assert.equal(bound.inputs.length,1710);
 for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 process.kill(266712,0);
}
function exact(rows){for(const r of rows)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);}
if(process.argv[2]==='patch'){
 environment();exact(prior);assert(!fs.existsSync(stage));
 assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.inflight.heavyJobRunning,false);
 assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.namedInputs,5161);
 assert.equal(json('F:/VisibleMedicine/staging/20261021-remaining-native-matrix/RESULT.json').sourceInputsUnchanged,true);
 const preserved=json('CURRENT_CHECKPOINT.json').activeWork.preservedSourcePaths.map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
 assert.equal(preserved.length,7);fs.mkdirSync(stage);
 const patch=['*** Begin Patch'];
 for(const [from,p,before,after] of spec){
  assert(p.startsWith('tests/'));const proposed=read(from+'/'+p);assert.equal(sha(proposed),after,p);
  const text=new TextDecoder('utf-8',{fatal:true}).decode(proposed);assert(!text.includes('\r'));assert(text.endsWith('\n'));
  const target=site+'/'+p;
  if(before){
   assert.equal(sha(read(target)),before,p);const backup=stage+'/preimages/'+p;
   fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(target,backup,fs.constants.COPYFILE_EXCL);
   const diff=spawnSync('git',['diff','--no-index','--no-ext-diff','--text',target,from+'/'+p],{encoding:'utf8',windowsHide:true,maxBuffer:2e6});
   assert.equal(diff.status,1);const lines=diff.stdout.replaceAll('\r\n','\n').split('\n');const start=lines.findIndex(l=>l.startsWith('@@'));assert(start>=0);
   patch.push('*** Update File: '+target,...lines.slice(start).filter(l=>!l.startsWith('\\ No newline')).map(l=>l.startsWith('@@')?'@@':l).filter((l,i,a)=>i<a.length-1||l!==''));
  }else{
   assert(!fs.existsSync(target),p);patch.push('*** Add File: '+target,...text.slice(0,-1).split('\n').map(l=>'+'+l));
  }
 }
 patch.push('*** End Patch');save('PREPARATION.json',{at:new Date().toISOString(),source,review,priorPath,priorSha256:sha(read(priorPath)),preserved,paths:spec.map(([from,p,before,after])=>({path:p,proposal:from+'/'+p,before,after})),ownerPreviewPid:266712,canonicalApplied:false,nativeExecuted:false});
 console.log(patch.join('\n'));
}else if(process.argv[2]==='emit'){
 // Emit one reviewed file at a time to keep transport below tool output limits.
 // The initial combined patch was refused before any source change.
 const plan=json(stage+'/PREPARATION.json'),index=Number(process.argv[3]);
 assert(Number.isSafeInteger(index)&&index>=0&&index<plan.paths.length);environment();
 for(const r of prior){const change=plan.paths.find(p=>p.path===r.path);const actual=sha(read(site+'/'+r.path));assert(actual===r.sha256||change&&actual===change.after,r.path);}
 exact(plan.preserved);const r=plan.paths[index],target=site+'/'+r.path,proposed=read(r.proposal);assert.equal(sha(proposed),r.after);
 const patch=['*** Begin Patch'];
 if(r.before){
  assert.equal(sha(read(target)),r.before);const result=spawnSync('git',['diff','--no-index','--no-ext-diff','--text',target,r.proposal],{encoding:'utf8',windowsHide:true,maxBuffer:2e6});assert.equal(result.status,1);
  const lines=result.stdout.replaceAll('\r\n','\n').split('\n'),start=lines.findIndex(l=>l.startsWith('@@'));assert(start>=0);
  patch.push('*** Update File: '+target,...lines.slice(start).filter(l=>!l.startsWith('\\ No newline')).map(l=>l.startsWith('@@')?'@@':l).filter((l,i,a)=>i<a.length-1||l!==''));
 }else{assert(!fs.existsSync(target));patch.push('*** Add File: '+target,...proposed.toString().slice(0,-1).split('\n').map(l=>'+'+l));}
 patch.push('*** End Patch');console.log(patch.join('\n'));
}else{
 assert.equal(process.argv[2],'verify');const plan=json(stage+'/PREPARATION.json');environment();
 const next=new Map(prior.map(r=>[r.path,r]));
 for(const r of plan.paths){assert.equal(sha(read(site+'/'+r.path)),r.after,r.path);next.set(r.path,{path:r.path,bytes:read(site+'/'+r.path).length,sha256:r.after});}
 const rows=[...next.values()].sort((a,b)=>a.path.localeCompare(b.path));assert.equal(rows.length,5162);
 const verify=()=>{environment();exact(rows);exact(plan.preserved);};verify();
 save('SOURCE_INPUTS_AFTER.json',rows);save('PRESERVED_SOURCE_AFTER.json',plan.preserved);
 const nativeRoots=['tests/clinical-review-psoas-current-preservation.test.mjs','tests/salivary-cache-epoch-preservation.test.mjs','tests/salivary-cache-guard-adaptation.test.mjs','tests/clinical-review-git-root-preservation.test.mjs','tests/atlas190-current-delivery.test.mjs','tests/clinical-review-psoas-xray.test.ts','tests/clinical-review-salivary-stylohyoid-quiz.test.ts'];
 async function execute(label,args){
  verify();const log=stage+'/'+label+'.log',output=fs.createWriteStream(log,{flags:'wx'});
  const child=spawn(process.execPath,args,{cwd:site,env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  save(label+'.started.json',{at:new Date().toISOString(),driver:process.pid,pid:child.pid,args,source,review});
  console.log(JSON.stringify({phase:'running',label,stage,pid:child.pid,driver:process.pid}));
  let pending='',launchError=null;
  child.stdout.on('data',b=>{output.write(b);pending+=b.toString();const lines=pending.split('\n');pending=lines.pop()??'';for(const l of lines)if(/^(?:not )?ok \d+ - /.test(l))console.log(l.slice(0,240));});
  child.stderr.on('data',b=>output.write(b));child.once('error',e=>launchError=String(e));
  const terminal=await new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal})));
  await new Promise((resolve,reject)=>{output.once('error',reject);output.end(resolve);});
  const text=read(log).toString(),counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...text.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];if(matches.length)counts[key]=Number(matches.at(-1)[1]);}
  let inputError=null;try{verify();}catch(e){inputError=String(e);}
  const result={at:new Date().toISOString(),...terminal,launchError,log,logSha256:sha(read(log)),counts,source,review,sourceInputsUnchanged:inputError===null,inputError};save(label+'.json',result);
  assert.equal(inputError,null);assert.equal(launchError,null);assert.equal(terminal.signal,null);assert.equal(terminal.code,0,'Inspect retained '+label+' failure');return result;
 }
 const native=await execute('native',['--test','--experimental-strip-types','--test-reporter=tap','--test-concurrency=1',...nativeRoots]);
 assert.equal(native.counts.tests,17);assert.equal(native.counts.pass,17);assert.equal(native.counts.fail,0);assert.equal(native.counts.skipped,0);assert.equal(native.counts.cancelled,0);
 const types=await execute('types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);verify();
 const result={at:new Date().toISOString(),source,review,canonicalInstalled:true,paths:plan.paths,controlledInputs:5162,preservedInputs:7,namedInputs:5169,sourceSnapshot:stage+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(stage+'/SOURCE_INPUTS_AFTER.json')),preservedSnapshot:stage+'/PRESERVED_SOURCE_AFTER.json',native,types,wholeOriginalAssertionsRetained:true,sourceRolesSeparate:true,reviewBindingsUnchanged:1710,allOtherInputsUnchanged:true,ownerPreviewRestarted:false,ownerFormsRefreshed:false,ownerDecisionsChanged:false,fullSuitePassingClaim:false,clinicalApproval:false};save('APPLICATION.json',result);console.log(JSON.stringify(result));
}
