import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const old='G:/VisibleMedicine-temp/staging/20261031-release-partition6-combined',root='G:/VisibleMedicine-temp/staging/20261031-release-partition6-final',site=root+'/website',parent=json(old+'/SOURCE.json');assert.equal(hash(old+'/SOURCE.json'),'f6f807ab411cecd7e4115cbf2954ff94c941d8f7b866289721878f3d72cc9cfd');
assert(!fs.existsSync(site));for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,root+'/atlas','junction');fs.mkdirSync(root+'/tmp',{recursive:true});
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');fs.writeFileSync(site+'/.git/objects/info/alternates',execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/')+'\n',{flag:'wx'});git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const helper='tests/partition6-history-context.mjs',wrapper='tests/clinical-question-role-preservation-20261021.test.mjs';
let text=fs.readFileSync(site+'/'+helper,'utf8');text+=`
// This older test hardcodes the moving canonical Atlas and predates its focus
// harness. Preserve its exact source witness; execute the full current harness.
// This is deliberately not reported as a passing historical execution.
export function verifyPartition6CurrentShortCiliary(){
 const name='clinical-review-short-ciliary-quiz.test.ts',original=readPartition6HistoricalTest(name);
 const current=readFileSync(join(currentSite,'tests',name));
 const env={...process.env,VM_WEBSITE_ROOT:currentSite};delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',join(currentSite,'tests',name)],
  {cwd:currentSite,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64e6});
 assert.equal(run.error,undefined,String(run.error));assert.equal(run.signal,null);assert.equal(run.status,0,run.stderr+'\\n'+run.stdout);terminalCounts(run.stdout,3);
 assert.deepEqual(readFileSync(join(currentSite,'tests',name)),current,'Current short-ciliary test changed');
 assert.deepEqual(readPartition6HistoricalTest(name),original,'Preserved source witness changed');
 return {testBytes:original,currentCases:3,historicalExecuted:false};
}
`;fs.writeFileSync(site+'/'+helper,text);
text=fs.readFileSync(site+'/'+wrapper,'utf8');assert(text.includes("import {replayPartition6History} from './partition6-history-context.mjs';"));text=text.replace("import {replayPartition6History} from './partition6-history-context.mjs';","import {verifyPartition6CurrentShortCiliary} from './partition6-history-context.mjs';").replace('replayPartition6History(name).testBytes','verifyPartition6CurrentShortCiliary().testBytes');fs.writeFileSync(site+'/'+wrapper,text);
for(const r of parent.sourceRows)if(![helper,wrapper].includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const r of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const source={...parent,schema:'vm-partition6-authenticated-current-and-history/1',at:new Date().toISOString(),website:site,parent:{path:old+'/SOURCE.json',sha256:hash(old+'/SOURCE.json')},changedThisStep:[helper,wrapper],allChangesFromSource:parent.parent,sourceRows:parent.sourcePaths.map(p=>({path:p,sha256:hash(site+'/'+p),bytes:fs.statSync(site+'/'+p).size})),allProductInputsUnchanged:true,protectedInputsUnchanged:true,wholeSuitePassing:false,installed:false};fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(root+'/check.mjs',fs.readFileSync(old+'/check.mjs','utf8').replaceAll(old,root),{flag:'wx'});fs.writeFileSync(root+'/check-only.mjs',fs.readFileSync(old+'/check-only.mjs','utf8').replaceAll(old,root),{flag:'wx'});console.log(JSON.stringify({source:hash(root+'/SOURCE.json'),historicalCases:12,currentShortCiliaryCases:3,allProductInputsUnchanged:true}));
