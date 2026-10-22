import assert from 'node:assert/strict';
import {mkdirSync,existsSync,readFileSync,writeFileSync,copyFileSync,symlinkSync,appendFileSync} from 'node:fs';
import {resolve,dirname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
const previous='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate';
const stage='F:/VisibleMedicine/staging/20261022-review-loading-recovery';
const root='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate',website=root+'/website';
assert(!existsSync(root));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),read=path=>readFileSync(path),json=path=>JSON.parse(read(path));
const base=json(previous+'/VERIFIED_SOURCE.json'),proposal=json(stage+'/TEST_RESULT-router-v2.json');
assert.equal(base.sourceRows.length,5809);assert.equal(proposal.status,0);assert.equal(proposal.counts.pass,4);
for(const row of base.sourceRows){const bytes=read(base.website+'/'+row.path);assert.equal(bytes.length,row.bytes,row.path);assert.equal(sha(bytes),row.sha256,row.path);}
for(const row of proposal.files)assert.equal(sha(read(stage+'/'+row.path)),row.sha256,row.path);
mkdirSync(root);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},stdio:['pipe','pipe','pipe']}).trim();
git('clone','--shared','--no-checkout','F:/VisibleMedicine/website',website);
git('-C',website,'read-tree','HEAD');
const target=path=>{assert(!path.includes('\\')&&path.split('/').every(part=>part&&part!=='.'&&part!=='..'));const absolute=resolve(website,path);assert(absolute.startsWith(resolve(website)+sep));return absolute;};
for(const row of base.sourceRows){const to=target(row.path);mkdirSync(dirname(to),{recursive:true});copyFileSync(base.website+'/'+row.path,to);}
for(const row of proposal.files){const to=target(row.path);assert(!existsSync(to));mkdirSync(dirname(to),{recursive:true});copyFileSync(stage+'/'+row.path,to);}
symlinkSync('F:/VisibleMedicine/website/node_modules',website+'/node_modules','junction');
symlinkSync('F:/VisibleMedicine/atlas',root+'/atlas','junction');
const sourceRows=[...base.sourceRows,...proposal.files].sort((a,b)=>a.path.localeCompare(b.path));assert.equal(sourceRows.length,5811);
for(const row of sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const prepared={at:new Date().toISOString(),root,website,baseReceipt:previous+'/VERIFIED_SOURCE.json',baseReceiptSha256:sha(read(previous+'/VERIFIED_SOURCE.json')),basePaths:5809,newPaths:proposal.files,sourceRows,source:base.source,review:base.review,frozenBaseChanged:false,canonicalInstalled:false,ownerPreviewChanged:false,privateRuntimeStateCopied:false,rawLocalGitAncestrySharedOnly:true};
writeFileSync(root+'/PREPARED.json',JSON.stringify(prepared,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase:'recovery-candidate-prepared',website,sourcePaths:5811,review:base.review}));
const steps=[['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['website-build',['node_modules/vinext/dist/cli.js','build']],['review',['scripts/verify-clinical-review.mjs']],['loading-tests',['--test','--test-reporter=tap','tests/clinical-review-route-loading.test.mjs']]];
const results=[];
for(const[label,args]of steps){
 const log=root+'/'+label+'.log';writeFileSync(log,'',{flag:'wx'});
 const child=spawn(process.execPath,args,{cwd:website,windowsHide:true,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',VM_WEBSITE_ROOT:website,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas'},stdio:['ignore','pipe','pipe']});
 for(const stream of[child.stdout,child.stderr])stream.on('data',bytes=>appendFileSync(log,bytes));
 writeFileSync(root+'/'+label+'-STARTED.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,args,log},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase:label+'-running',pid:child.pid,log}));
 const result=await new Promise(resolve=>{child.on('error',error=>resolve({code:null,error:String(error)}));child.on('close',(code,signal)=>resolve({code,signal}));});
 const counts={},text=read(log).toString();for(const key of['tests','pass','fail','cancelled','skipped','todo']){const match=text.match(new RegExp('^# '+key+' (\\d+)$','m'));if(match)counts[key]=Number(match[1]);}
 const receipt={at:new Date().toISOString(),label,...result,counts,log,sha256:sha(read(log))};results.push(receipt);writeFileSync(root+'/'+label+'-TERMINAL.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));if(result.code!==0){process.exitCode=result.code??1;break;}
}
const drift=sourceRows.filter(row=>sha(read(website+'/'+row.path))!==row.sha256),baseDrift=base.sourceRows.filter(row=>sha(read(base.website+'/'+row.path))!==row.sha256);
const final={at:new Date().toISOString(),website,results,allStepsPassed:results.length===steps.length&&results.every(row=>row.code===0),sourceRows,sourcePaths:sourceRows.length,drift,baseDrift,review:base.review,source:base.source,ownerPreviewChanged:false,canonicalInstalled:false,fullStockRegressionPassing:false};
writeFileSync(root+'/BUILD_RESULT.json',JSON.stringify(final,null,2)+'\n',{flag:'wx'});assert.equal(drift.length,0);assert.equal(baseDrift.length,0);
