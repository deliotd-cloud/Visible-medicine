import fs from'node:fs';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';import{hash,json}from'./bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-pharyngeal-mri-native',sf=stage+'/SOURCE_CANDIDATE.json',v=json(stage+'/VERIFICATION_SUMMARY.json');
assert.equal(hash(sf),v.source.sha256);assert(v.passingForStatedScope);const source=json(sf),built=json(v.checks.build.path);assert.equal(hash(v.checks.build.path),v.checks.build.sha256);assert(built.passing&&built.process.terminalObserved&&built.process.exitCode===0);
const artifacts=json(stage+'/BUILD_ARTIFACTS.json');for(const r of artifacts.files)assert.equal(hash(source.atlas+'/'+r.path),r.sha256,r.path);const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
save(stage+'/EXPORT_BUILD_ARTIFACTS.json',{root:source.atlas,files:artifacts.files});save(stage+'/BUILD_VERIFIED.json',{passing:true,fullNativeBuildPassed:true,source:v.source,run:built,artifacts:{path:stage+'/EXPORT_BUILD_ARTIFACTS.json',sha256:hash(stage+'/EXPORT_BUILD_ARTIFACTS.json')},types:v.types});
for(const prefix of ['export','run']){
 const from=prefix+'-forehead-runtime'+(prefix==='export'?'s':'-exports')+'-20261027.mjs',to=prefix+'-pharyngeal-runtime'+(prefix==='export'?'s':'-exports')+'-20261027.mjs';let text=fs.readFileSync(from,'utf8');
 for(const[a,b]of [['20261027-forehead-runtime-exports','20261027-pharyngeal-runtime-exports'],['20261027-forehead-nerve-us-native','20261027-pharyngeal-mri-native'],['ce861516a2c68803726f9b1222fdf8d403a714960fea67ca8f2fe0e5d66b871a',hash(sf)],['pendingForeheadNerveUltrasound','pendingPharyngealMri']]){assert(text.includes(a));text=text.replaceAll(a,b);}
 if(prefix==='export')text=text.replaceAll('forehead-runtime-export','pharyngeal-runtime-export').replace('20261027-coccygeus-runtime-exports/public/atlas-runtime/','20261027-forehead-runtime-exports/public/atlas-runtime/');
 else text=text.replace('74acc9b52c5fe0143d1664af17ccf73e5002ad46360d5cb1e32e56d8e85760e5',hash(stage+'/BUILD_VERIFIED.json')).replace('export-forehead-runtimes-20261027.mjs','export-pharyngeal-runtimes-20261027.mjs');
 fs.writeFileSync(to,text,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});
}
console.log(JSON.stringify({prepared:true,source:v.source,build:hash(stage+'/BUILD_VERIFIED.json')}));
