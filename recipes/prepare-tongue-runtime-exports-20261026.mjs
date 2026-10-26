import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261026-tongue-imaging-native',sf=stage+'/SOURCE_CANDIDATE.json',v=json(stage+'/VERIFICATION_SUMMARY.json');
assert.equal(hash(sf),'a3d4688d49f2cce6eb16c0418d46c776c51d386e315a3933d1b69ad4a13e3e38');assert.equal(hash(sf),v.source.sha256);assert(v.passingForStatedScope);const source=json(sf);
const build=json(v.checks.build.path);assert(build.passing&&build.process.terminalObserved&&build.process.exitCode===0);
const artifacts=json(stage+'/BUILD_ARTIFACTS.json');for(const r of artifacts.files)assert.equal(hash(source.atlas+'/'+r.path),r.sha256,r.path);
const save=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx'});
save(stage+'/EXPORT_BUILD_ARTIFACTS.json',{root:source.atlas,files:artifacts.files});
save(stage+'/BUILD_VERIFIED.json',{passing:true,fullNativeBuildPassed:true,source:v.source,run:build,artifacts:{path:stage+'/EXPORT_BUILD_ARTIFACTS.json',sha256:hash(stage+'/EXPORT_BUILD_ARTIFACTS.json')},types:v.types});
const swaps=[['20261026-quick-check-runtime-exports','20261026-tongue-runtime-exports'],['20261026-quick-check-focus-native','20261026-tongue-imaging-native'],['27154852c2f5a1578a6e896a917bf7fd12c9e11d3c2dc97d261bebd51113ceba',hash(sf)],['pendingQuickCheckFocus','pendingTongueImaging']];
for(const [old,newFile]of [['export-quick-check-runtimes-20261026.mjs','export-tongue-runtimes-20261026.mjs'],['run-quick-check-runtime-exports-20261026.mjs','run-tongue-runtime-exports-20261026.mjs']]){
 let text=fs.readFileSync(old,'utf8');for(const[from,to]of swaps){assert(text.includes(from));text=text.replaceAll(from,to);}
 if(old.startsWith('export-')){text=text.replaceAll('quick-check-runtime-export','tongue-runtime-export').replaceAll('20261026-title-tour-runtime-exports/public/atlas-runtime/','20261026-quick-check-runtime-exports/public/atlas-runtime/').replace('all6410sourceAnd215publicAndProductionArtifactBytesUnchanged','allPinnedSourceAndPublicAndProductionArtifactBytesUnchanged');}
 else{text=text.replace('ba8ad08dd25db60b79d3184363ec10b240fa808bae3cfe301c94d889f548ba3d',hash(stage+'/BUILD_VERIFIED.json')).replace('export-quick-check-runtimes-20261026.mjs','export-tongue-runtimes-20261026.mjs');}
 fs.writeFileSync(newFile,text,{flag:'wx'});execFileSync(process.execPath,['--check',newFile],{windowsHide:true});
}
console.log(JSON.stringify({source:v.source,build:hash(stage+'/BUILD_VERIFIED.json'),artifacts:artifacts.files.length,recipesPrepared:true}));
