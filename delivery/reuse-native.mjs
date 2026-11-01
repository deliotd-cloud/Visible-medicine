import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {nativeHead,nativeTree,safeChild} from './plan.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261101-focus-native-runtime';
export const receiptPath=root+'/RUNTIME_COMPLETE.json';
const fixed={
 'PLAN.json':'44f846cf4ca6429c27c33de5eb63aeb98f6c760dfb4d4e62f05f3c359e09f5bd',
 'RESULT.json':'39c5e07011c3ae04f21105a4566249b369d20ac2ecd7674c90c8cd72e5632d12',
 'RUNTIME_COMPLETE.json':'44ab99296ee9009883601e82af54fabb6efed6f5b3c17e021b009d0f5e52c7a7',
 'VALIDATION_PREFLIGHT.json':'8f1d4912d49511343a7996bab1222f7abbf2ed34468bc5113a12af7b62734980',
 'native-build-TERMINAL.json':'fb82594309d049dec126ed5aa2e9adce5c54661156fadb3cf36056d1254a74e6',
 'native-export-TERMINAL.json':'bba1057338de72e2486c218567d630d5be89c05a09bd7a18e93569be6bc12ce8',
};
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const exportPath=root+'/export/public/atlas-runtime/head-neck';
const expectedRuns=[['native-build',['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],['native-export',['scripts/export-head-neck-module.mjs',exportPath]]];
export function validateReuseFacts({plan,result,runtime,manifest,inputs,terminals,preflight,hashAt}){
 assert.equal(plan.native.head,nativeHead);assert.equal(plan.native.tree,nativeTree);
 assert.equal(runtime.source.head,nativeHead);assert.equal(runtime.source.tree,nativeTree);assert.equal(runtime.source.path,plan.native.path);
 assert.equal(runtime.export,exportPath);assert.equal(runtime.manifest.path,exportPath+'/manifest.json');
 assert.equal(runtime.manifest.sha256,hashAt(runtime.manifest.path));
 assert.equal(runtime.sourceInputs,1608);assert.equal(runtime.files,222);
 assert.equal(runtime.nativeRuntimeBuilt,true);assert.equal(runtime.fullNativeTypes,false);assert.equal(runtime.installed,false);
 assert.equal(runtime.jobCapMiB,2048);assert.equal(runtime.freeReserveMiB,2048);
 assert.equal(manifest.sourceCommit,nativeHead);assert.equal(manifest.region,'head-neck');
 assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
 assert.equal(manifest.files.length,222);assert.equal(inputs.length,1608);
 assert.equal(manifest.files.filter(row=>row.path==='source-inputs.json').length,1);
 assert.equal(inputs.filter(row=>row.path==='app/study-return-focus.ts').length,1);
 assert.equal(result.passing,true);assert.equal(result.supervisor.code,0);assert(!result.supervisor.signal&&!result.supervisor.error);
 assert.equal(result.process.terminalObserved,true);assert.equal(result.process.exitCode,0);assert.equal(result.process.interrupted,false);
 assert.equal(preflight.sameNativeCommandAndAudits,true);assert.equal(preflight.stricterJobCap,true);assert.equal(preflight.unchangedFreeReserveMiB,2048);
 assert.deepEqual(runtime.runs.map(row=>[row.name,row.args]),expectedRuns);
 assert.deepEqual(terminals.map(row=>[row.name,row.args]),expectedRuns);
 for(let i=0;i<2;i++){
  const a=runtime.runs[i],b=terminals[i];assert.deepEqual(a,b);
  assert.equal(b.code,0);assert.equal(b.signal,null);assert.equal(b.error,null);
  assert.equal(b.logSha256,hashAt(root+'/'+b.name+'.log'));
 }
 for(const row of manifest.files){const file=safeChild(exportPath,row.path);assert.equal(hashAt(file),row.sha256,'Changed runtime artifact: '+row.path);}
 for(const row of inputs){const file=safeChild(plan.native.path,row.path);assert.equal(hashAt(file),row.sha256,'Changed native source input: '+row.path);}
 const expectedRecipes=new Map([['build-export.mjs','5b14bad3fadb2c39f881c15473cf45e1d833fec7bdf9128a205e90c7521abee6'],['window.mjs','8b8d9f1d9604a40f65e55a52a5ba9e4d119e6541f07c866fc1766e9ef4760512'],['run-guarded.mjs','7c9c3d0811cf02052361161ddfff147d03877bbf5dd200e8e64ebd47c9301700'],['restart.mjs','871b6f4c16ccaabd51e383206e51dd09e29d5f03539bc70654a337685324a233'],['stop.ps1','d194fe0f664e0020ea5f1e8c7c8e8450ef4ab8fc46abd065bef8e3819c388a6f']]);
 assert.equal(preflight.recipes.length,expectedRecipes.size);
 for(const row of preflight.recipes){const name=path.basename(row.path);assert.equal(row.path,root+'/'+name);assert.equal(row.sha256,expectedRecipes.get(name),'Changed prior recipe');assert.equal(hashAt(row.path),row.sha256);expectedRecipes.delete(name);}
 assert.equal(expectedRecipes.size,0);
 return {source:nativeHead,tree:nativeTree,files:manifest.files.length,sourceInputs:inputs.length,manifestSha256:runtime.manifest.sha256,receiptSha256:fixed['RUNTIME_COMPLETE.json'],reused:true,nativeBuildExecutedInAttempt:false};
}
export function verifyNativeReuse(given,expectedNative){
 assert.equal(given,receiptPath,'Explicit exact reuse receipt required');
 assert.equal(fs.realpathSync(given),fs.realpathSync(receiptPath));
 for(const [name,expected] of Object.entries(fixed))assert.equal(sha(root+'/'+name),expected,'Changed prior receipt: '+name);
 const plan=json(root+'/PLAN.json'),result=json(root+'/RESULT.json'),runtime=json(receiptPath),preflight=json(root+'/VALIDATION_PREFLIGHT.json');
 const manifest=json(exportPath+'/manifest.json'),inputs=json(exportPath+'/source-inputs.json');
 const terminals=['native-build','native-export'].map(name=>json(root+'/'+name+'-TERMINAL.json'));
 assert.equal(plan.native.path,expectedNative);
 const git=(...args)=>execFileSync('git',['-C',expectedNative,...args],{encoding:'utf8',windowsHide:true}).trim();
 assert.equal(git('rev-parse','HEAD'),nativeHead);assert.equal(git('rev-parse','HEAD^{tree}'),nativeTree);
 assert.equal(git('status','--porcelain','--untracked-files=all'),'','Native source must remain clean');
 for(const row of manifest.files){const real=fs.realpathSync(safeChild(exportPath,row.path));assert(real.startsWith(fs.realpathSync(exportPath)+path.sep),'Runtime artifact escaped export root');}
 for(const row of inputs){const real=fs.realpathSync(safeChild(expectedNative,row.path));assert(real.startsWith(fs.realpathSync(expectedNative)+path.sep),'Source input escaped native root');}
 const checked=validateReuseFacts({plan,result,runtime,manifest,inputs,terminals,preflight,hashAt:sha});
 return {...checked,exportPath,receiptPath};
}
