import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const producer=process.argv.length===3&&process.argv[2]==='--producer-admission';
assert(process.argv.length===2||producer);
const stage='F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate',root=stage+'/atlas',out=stage+(producer?'/production-build-producer':'/production-build');
assert(JSON.parse(fs.readFileSync(stage+(producer?'/verification-producer':'/verification-wording')+'/TERMINAL.json')).allPassed);
assert(!fs.existsSync(out),'Build evidence is create-only');fs.mkdirSync(out);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean).sort();
const before=paths.map(path=>({path,sha256:sha(fs.readFileSync(root+'/'+path))}));
const stdout=fs.openSync(out+'/stdout.txt','wx'),stderr=fs.openSync(out+'/stderr.txt','wx');
const started=Date.now();let code=0;
try{execFileSync(process.execPath,['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build'],{
  cwd:root,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore',stdout,stderr],timeout:300000});}
catch(error){code=Number.isInteger(error.status)?error.status:-1;}
finally{fs.closeSync(stdout);fs.closeSync(stderr);}
const drift=before.filter(row=>sha(fs.readFileSync(root+'/'+row.path))!==row.sha256);
const result={at:new Date().toISOString(),root,code,elapsedMs:Date.now()-started,sourcePaths:before.length,sourceDrift:drift,
  head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim(),
  stdoutSha256:sha(fs.readFileSync(out+'/stdout.txt')),stderrSha256:sha(fs.readFileSync(out+'/stderr.txt')),
  passing:code===0&&drift.length===0,previewChanged:false,publicDeployment:false,clinicalApproval:false};
fs.writeFileSync(out+'/INPUTS.json',JSON.stringify(before,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(out+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));if(!result.passing)process.exitCode=1;
