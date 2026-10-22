// Diagnose every still-unrechecked root from the last broad failure audit.
// The selected candidate and canonical preview are read-only throughout.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-remaining-native-recheck';
const receipt='F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/SOURCE_V2.json';
assert.equal(sha(read(receipt)),'d388db43518ff7ccd443a8e7977e7ac67b2f49a696eb294529992ba64fc4132d');
const source=json(receipt),auditPath='F:/VisibleMedicine/staging/20261022-remaining-native-priority-audit/AUDIT.json';
assert.equal(sha(read(auditPath)),'0210f09978cfc02a1ba8c21da96764ea21345e09bf6b5e233bf53c9b9ae0c4ad');
const prior=json('F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/verification-v2/TERMINAL.json');
assert.equal(prior.code,0);const previousRoots=new Set(prior.commands[0].args.filter(p=>p.startsWith('tests/')));
const tests=[...new Set(json(auditPath).groups.flatMap(g=>g.paths))].filter(p=>!previousRoots.has(p));assert.equal(tests.length,20);
const verify=()=>{
 for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);
 assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(json('F:/VisibleMedicine/website/atlas-review/manifest.json').websiteIntegrationSha256,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
};verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const args=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests];
const env=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree});
const out=fs.createWriteStream(root+'/stdout.tap',{flags:'wx'}),err=fs.createWriteStream(root+'/stderr.log',{flags:'wx'});
const child=spawn(process.execPath,args,{cwd:source.website,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
child.stdout.pipe(out);child.stderr.pipe(err);
const started={at:new Date().toISOString(),runnerPid:process.pid,pid:child.pid,args,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),roots:tests,
 sourceFrozen:true,ownerPreviewChanged:false,wholeSuitePassing:false};
fs.writeFileSync(root+'/STARTED.json',JSON.stringify(started,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase:'native-recheck-started',pid:child.pid,roots:tests.length,evidence:root}));
const outcome=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
const tap=read(root+'/stdout.tap').toString(),counts=Object.fromEntries([...tap.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],+m[2]]));
const failures=[...tap.matchAll(/^not ok \d+ - (.*)$/gm)].map(m=>m[1]);
verify();const result={...started,at:new Date().toISOString(),...outcome,terminal:true,counts,failures,sourceDrift:[],
 stdoutSha256:sha(read(root+'/stdout.tap')),stderrSha256:sha(read(root+'/stderr.log')),canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/TERMINAL.json',sha256:sha(read(root+'/TERMINAL.json')),...outcome,counts,failures,sourceDrift:[]}));
process.exitCode=outcome.code??1;
