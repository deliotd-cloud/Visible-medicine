import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261024-release-repair-batch/main',manifest=JSON.parse(fs.readFileSync(root+'/COMPOSED.json'));
const dir=root+'/checks';assert(!fs.existsSync(dir));fs.mkdirSync(dir);
const sha=b=>createHash('sha256').update(b).digest('hex');
const check=(label,args)=>{
 const child=spawnSync(process.execPath,args,{cwd:manifest.candidate,windowsHide:true,maxBuffer:16e6,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=128'}});
 const out=child.stdout??Buffer.alloc(0),err=child.stderr??Buffer.alloc(0);fs.writeFileSync(dir+'/'+label+'.stdout.log',out,{flag:'wx'});fs.writeFileSync(dir+'/'+label+'.stderr.log',err,{flag:'wx'});
 const result={label,args,code:child.status,signal:child.signal,error:child.error?String(child.error):null,stdoutSha256:sha(out),stderrSha256:sha(err)};
 fs.writeFileSync(dir+'/'+label+'.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});return {...result,out};
};
const syntax=[];for(const file of [...manifest.changedTestPaths,'tests/release-diagnostic-context-inverse.mjs','tests/release-diagnostic-context-inverse.test.mjs']){
 const r=check('syntax-'+file.slice(6).replaceAll('.','-'),['--experimental-strip-types','--check',file]);syntax.push({path:file,code:r.code});if(r.code!==0){console.error(JSON.stringify({syntaxFailure:file,evidence:dir}));process.exit(1);}
}
const result=check('pure-source-inverses',['--test','--test-reporter=spec','tests/release-diagnostic-context-inverse.test.mjs']);
const text=result.out.toString().replace(/\u001b\[[0-9;]*m/g,''),counts={};for(const m of text.matchAll(/^ℹ (tests|pass|fail|cancelled|skipped|todo) (\d+)$/gm))counts[m[1]]=Number(m[2]);
const terminal={at:new Date().toISOString(),code:result.code,counts,syntax,composition:root+'/COMPOSED.json',compositionSha256:sha(fs.readFileSync(root+'/COMPOSED.json')),actualOriginalMedicalSuitesRun:false,currentProductionDeliveryRetested:false,partialOnly:true,fullRunCandidateChanged:false,previewChanged:false,installed:false,limits:'Lightweight exact source inverses and syntax only. Two unchanged historical inverse functions are exercised for the arterial row; not their complete test roots. Original affected integration/medical/native suites remain for serial QA.'};
fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(terminal));process.exitCode=result.code===0&&counts.tests===counts.pass&&counts.fail+counts.skipped+counts.cancelled===0?0:1;
