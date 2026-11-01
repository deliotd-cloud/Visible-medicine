import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261101-focus-native-runtime',plan=json(root+'/PLAN.json'),atlas=plan.native.path;
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true}).trim();
assert.equal(git('rev-parse','HEAD'),plan.native.head);assert.equal(git('rev-parse','HEAD^{tree}'),plan.native.tree);assert.equal(git('status','--porcelain'),'');
const build=path.resolve(atlas,'.sites-runtime/head-neck-module');let ancestor=build;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
const real=fs.realpathSync(ancestor),base=fs.realpathSync(atlas);assert(real===base||real.startsWith(base+path.sep),'Output must stay inside source checkout');
const runs=[];function run(name,args){const result=spawnSync(process.execPath,['--max-old-space-size=1536',...args],{cwd:atlas,windowsHide:true,encoding:'utf8',maxBuffer:8e6});const log=root+'/'+name+'.log';fs.writeFileSync(log,(result.stdout??'')+'\n'+(result.stderr??''),{flag:'wx'});const terminal={name,args,code:result.status,signal:result.signal,error:result.error?String(result.error):null,logSha256:hash(log)};fs.writeFileSync(root+'/'+name+'-TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});assert.equal(result.status,0,name+' failed');assert(!result.error&&!result.signal);runs.push(terminal);console.log(name+' passed');}
run('native-build',['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']);
const channel=json(build+'/selection-channel.json');assert.equal(channel.sourceCommit,plan.native.head);
const inputs=json(build+'/source-inputs.json');assert(inputs.some(row=>row.path==='app/study-return-focus.ts'));for(const row of inputs)assert.equal(hash(atlas+'/'+row.path),row.sha256,row.path);
const target=root+'/export/public/atlas-runtime/head-neck';assert(!fs.existsSync(target));
run('native-export',['scripts/export-head-neck-module.mjs',target]);
const manifest=json(target+'/manifest.json');assert.equal(manifest.sourceCommit,plan.native.head);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
for(const row of manifest.files){assert(!row.path.includes('..')&&!path.isAbsolute(row.path)&&!row.path.includes(':'));assert.equal(hash(target+'/'+row.path),row.sha256);}
assert.equal(git('status','--porcelain'),'');
const report={at:new Date().toISOString(),source:plan.native,export:target,manifest:{path:target+'/manifest.json',sha256:hash(target+'/manifest.json')},sourceInputs:inputs.length,files:manifest.files.length,runs,sameBuildCommandAndAudits:true,heapMiB:1536,jobCapMiB:2048,freeReserveMiB:2048,nativeRuntimeBuilt:true,fullNativeTypes:false,websiteBuilt:false,installed:false,clinicalApproval:false,patientSpaceRegistration:false};
fs.writeFileSync(root+'/RUNTIME_COMPLETE.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({nativeRuntimeBuilt:true,source:plan.native.head,files:manifest.files.length,installed:false}));
