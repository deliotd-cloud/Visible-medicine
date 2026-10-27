import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-coccygeus-tour-native',sf=stage+'/SOURCE_CANDIDATE.json',v=json(stage+'/VERIFICATION_SUMMARY.json');
assert.equal(hash(sf),'e3d72e9052a335242a8ef2de79de0fd804cafd2a16adc4d20d44b6bd48f74937');assert.equal(hash(sf),v.source.sha256);assert(v.passingForStatedScope);
const source=json(sf),build=json(v.checks.build.path);assert.equal(hash(v.checks.build.path),v.checks.build.sha256);assert(build.passing&&build.process.terminalObserved&&build.process.exitCode===0);
const artifacts=json(stage+'/BUILD_ARTIFACTS.json');for(const r of artifacts.files)assert.equal(hash(source.atlas+'/'+r.path),r.sha256,r.path);
const save=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx'});
save(stage+'/EXPORT_BUILD_ARTIFACTS.json',{root:source.atlas,files:artifacts.files});
save(stage+'/BUILD_VERIFIED.json',{passing:true,fullNativeBuildPassed:true,source:v.source,run:build,artifacts:{path:stage+'/EXPORT_BUILD_ARTIFACTS.json',sha256:hash(stage+'/EXPORT_BUILD_ARTIFACTS.json')},types:v.types});
for(const [old,file] of [['export-tongue-runtimes-20261026.mjs','export-coccygeus-runtimes-20261027.mjs'],['run-tongue-runtime-exports-20261026.mjs','run-coccygeus-runtime-exports-20261027.mjs']]){
 let text=fs.readFileSync(old,'utf8');
 const swaps=[['20261026-tongue-runtime-exports','20261027-coccygeus-runtime-exports'],['20261026-tongue-imaging-native','20261027-coccygeus-tour-native'],['a3d4688d49f2cce6eb16c0418d46c776c51d386e315a3933d1b69ad4a13e3e38',hash(sf)],['pendingTongueImaging','pendingCoccygeusTour']];
 for(const [a,b]of swaps){assert(text.includes(a));text=text.replaceAll(a,b);}
 if(old.startsWith('export-')){
  text=text.replaceAll('tongue-runtime-export','coccygeus-runtime-export').replace('20261026-quick-check-runtime-exports/public/atlas-runtime/','20261026-tongue-runtime-exports/public/atlas-runtime/');
  text=text.replace('for(const p of [dir,moduleDir,target])',"for(const p of [dir,...(kind==='head-neck'?[]:[moduleDir]),target])");
  const begin="state('build',true);global.gc();const built=await guarded(",end="verify();save('BUILD_RESULT.json',built);";
  const start=text.indexOf(begin),finish=text.indexOf(end,start);assert(start>=0&&finish>start);
  const original=text.slice(start,finish);
  const fresh=original.replace("state('build',true);global.gc();const built=",'built=');
  text=text.slice(0,start)+"state('build',true);global.gc();let built;if(kind==='head-neck'){const receipt=stage+'/checks/module-1/RESULT.json';assert.equal(hash(receipt),'7623b363963cd3ee962846090168d886c9dec86845f46b0987c73d4fadbaee80');built=json(receipt);assert(built.passing&&built.process.terminalObserved&&built.process.exitCode===0);assert(fs.existsSync(moduleDir));save('REUSED_BUILD.json',{receipt,sha256:hash(receipt),unchangedSourceHead:source.head,sourceInputsVerifiedBelow:true});}else{"+fresh+"}"+text.slice(finish);
 }else{
  text=text.replace('90a2449c38748d1580dd1b2db8abcd88c93291f14d722368e8e401e39c54da73',hash(stage+'/BUILD_VERIFIED.json')).replace('export-tongue-runtimes-20261026.mjs','export-coccygeus-runtimes-20261027.mjs');
 }
 fs.writeFileSync(file,text,{flag:'wx'});execFileSync(process.execPath,['--check',file],{windowsHide:true});
}
console.log(JSON.stringify({source:v.source,build:hash(stage+'/BUILD_VERIFIED.json'),artifacts:artifacts.files.length,reuseHeadNeck:true,recipesPrepared:true}));
