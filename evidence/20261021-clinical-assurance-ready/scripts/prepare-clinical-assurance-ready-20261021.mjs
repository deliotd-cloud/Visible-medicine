// Final test-only admission batch; composes two separately reviewed proposals.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-clinical-assurance-ready';
const prior='F:/VisibleMedicine/staging/20261021-clinical-assurance-combined-lf';
const base=json(prior+'/MANIFEST.json');
assert.equal(sha(read(prior+'/MANIFEST.json')),'a432d6cbbb0cb6e8aa56e34533299cbcf8217166e97915205a8b12270fe5905a');
const site=base.site,atlas=base.atlas,files=base.files.filter(row=>row.path!=='.gitattributes').map(row=>({...row,origin:prior+'/files/'+row.path}));
const families=[
 ['internal-iliac-ultrasound','d463ac9cde2fe0ceeb1edf2a348c679b3ddc16bb644050aa8af228bf1874dc3d','61cf9e46f449ff2f842d6c8e47da95b7fc2bcab49dd4a1c60e7115678f792e5a'],
 ['pectoral-ultrasound','3d243b0041685bcaac16eb271be4f7d6891a2485f7fbfeff406e53b83ba0d1fc','815c986d956ea88382005a5a5170d888f4f61903ed30ffe0fb0abebcd3193317'],
 ['orbital-support-quiz','fe12516289eb6a2c6d971d3d0e44b186d6cfba00beda3deda7bc95150a436954','a32c560ec260c8e61d5323f3b2b6609fe835605c5787acc0165c5a218432d94a'],
 ['root-cuff-xray','d2c4793602ca673a0ed31b050304a74f523941cd47730ed02fb4f900ae2b258e','2c93c2858c3182fca210eefd015354cb33649f33292b75fe8c41297293c5ebb5'],
 ['iliac-xray','421e61f85dce6d50bb7a1dff92d9e7e8af40f207e3f12650a5c741787e7b955b','a7286bfc1a0b77f08d55df7059d41a9a4ab7cf7d52e21cba04a7d179218fb77e'],
];
const imaging='F:/VisibleMedicine/staging/20261021-clinical-current-imaging-batch';
for(const [name,post,old] of families){
 files.push({path:'tests/clinical-review-'+name+'.test.ts',origin:imaging+'/tests/clinical-review-'+name+'.test.ts',sha256:post,beforeSha256:old});
 files.push({path:'tests/fixtures/clinical-review-'+name+'.original.ts.raw',origin:imaging+'/tests/fixtures/clinical-review-'+name+'.original.ts.raw',sha256:old,beforeSha256:null});
}
files.push({path:'tests/clinical-current-imaging-preservation.test.mjs',origin:imaging+'/tests/clinical-current-imaging-preservation.test.mjs',sha256:'4a975560f129067bc08d572efe500209363d8107a234df861214edd32824b56c',beforeSha256:null});
const hepatic='F:/VisibleMedicine/staging/20261021-hepatic-xray-contract-proposal';
for(const [name,post,old] of [
 ['clinical-review-hepatic-venous-xray.test.ts','182d5a2130226f0deaa4b32ae8458c804a8a05f72d44bb619fa62b786b29edb5','0e1caf978b937fc60ee32aa4410b2e5e99e706866c8be4d330181fcc3225c8b1'],
 ['hepatic-admission-import-history.mjs','1b59db5168de418dc208334df0db8e53b907d270faed7df8144205536054148f',null],
 ['hepatic-xray-preservation.test.mjs','e425bc21bc5f8046da4a4d49b3f07af27486a24994a4546be332119cfbf7099d',null],
 ['fixtures/clinical-review-hepatic-venous-xray.original.ts.raw','0e1caf978b937fc60ee32aa4410b2e5e99e706866c8be4d330181fcc3225c8b1',null],
])files.push({path:'tests/'+name,origin:hepatic+'/tests/'+name,sha256:post,beforeSha256:old});
const current=p=>fs.existsSync(site+'/'+p)?sha(read(site+'/'+p)):null;
assert.equal(files.length,48);assert.equal(new Set(files.map(row=>row.path)).size,48);
assert(!fs.existsSync(stage));
for(const row of files){assert.equal(sha(read(row.origin)),row.sha256,row.path+' final reviewed bytes');assert.equal(current(row.path),row.beforeSha256,row.path+' frozen original');}
const attrs=read(site+'/.gitattributes');assert.equal(sha(attrs),'4f5d1c31e7e089798fa300e6043d18d2e5aa074162dba58bc9a874e4a598ee62');
const executable=files.filter(row=>!row.path.startsWith('tests/fixtures/'));
assert.equal(executable.length,31);
const nextAttrs=Buffer.concat([attrs,Buffer.from('\n# Exact reviewed clinical admission and history proofs retain LF; raw fixtures remain -text.\n'+executable.map(row=>row.path+' text eol=lf').join('\n')+'\n')]);
fs.mkdirSync(stage);const save=(p,b)=>{const to=stage+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});assert.equal(sha(read(to)),sha(b));};
for(const row of files){save('files/'+row.path,read(row.origin));if(row.beforeSha256)save('originals/'+row.path,read(site+'/'+row.path));}
save('files/.gitattributes',nextAttrs);save('originals/.gitattributes',attrs);
files.push({path:'.gitattributes',beforeSha256:sha(attrs),sha256:sha(nextAttrs),appendOnly:true});
const actualModules=[...base.actualModules,...families.map(([name])=>'tests/clinical-review-'+name+'.test.ts'),'tests/clinical-review-hepatic-venous-xray.test.ts'].sort();
const pureModules=[...base.pureModules,'tests/clinical-current-imaging-preservation.test.mjs','tests/hepatic-xray-preservation.test.mjs'];
assert.equal(actualModules.length,20);assert.equal(pureModules.length,7);
for(const row of files){
 assert(row.path==='.gitattributes'||/\.test\.(?:ts|mjs)$|\.mjs$/.test(row.path)||/^tests\/fixtures\/.+\.raw$/.test(row.path),'Every admitted fixture is inventoried by the stock runner');
 if(row.path.endsWith('.raw')){const b=read(stage+'/files/'+row.path);assert(!b.includes(0)&&b.length<16*1024*1024);new TextDecoder('utf-8',{fatal:true}).decode(b);}
}
const manifest={schema:'vm-clinical-assurance-ready/1',at:new Date().toISOString(),site,atlas,source:base.source,files,actualModules,pureModules,
 scope:'49 exact before-hash guarded Website test/fixture/attribute paths.20real corpus modules,7pure guards,4strict historical helpers,17rawfixtures. No source/runtime/teaching/review data changes. Intracranial whole-catalogue test explicitly excluded, not silently repinned.',
 actualCorpusModulesPassed:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,fullGoalActive:true};
save('MANIFEST.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
save('PREPARATION.json',Buffer.from(JSON.stringify({stage,site,atlas,scope:'Pure/source-metadata/fresh checkout only until existing full Website and queued dental steps are terminal.'},null,2)+'\n'));
const seed=stage+'/checkout-seed',checkout=stage+'/checkout-proof';
const git=(cwd,args)=>execFileSync('git',['-C',cwd,...args],{windowsHide:true,stdio:['pipe','pipe','pipe']});
fs.mkdirSync(seed);git(seed,['init','-q']);git(seed,['config','core.autocrlf','true']);
for(const row of files){const to=seed+'/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,read(stage+'/files/'+row.path),{flag:'wx'});}
git(seed,['add','--',...files.map(row=>row.path)]);git(seed,['-c','user.name=Local checkout proof','-c','user.email=checkout-proof@localhost','commit','-qm','Local final clinical assurance byte proof']);
execFileSync('git',['clone','--quiet','--no-checkout','--local',seed,checkout],{windowsHide:true,stdio:['pipe','pipe','pipe']});
git(checkout,['config','core.autocrlf','true']);git(checkout,['checkout','-q','HEAD']);
for(const row of files){assert.equal(sha(read(checkout+'/'+row.path)),row.sha256,row.path+' fresh checkout');assert.equal(current(row.path),row.beforeSha256,row.path+' frozen untouched');}
for(const row of executable)execFileSync(process.execPath,['--experimental-strip-types','--check',checkout+'/'+row.path],{windowsHide:true,stdio:['pipe','pipe','pipe']});
const proof={at:new Date().toISOString(),shippingPaths:49,actualModules:20,pureModules:7,syntaxFiles:31,rawFixtures:17,
 freshAutocrlfCheckoutByteIdentical:true,allRawFixturesCoveredByStockInventory:true,frozenPreimagesUnchanged:true,
 manifestSha256:sha(read(stage+'/MANIFEST.json')),actualCorpusModulesPassed:false,canonicalInstalled:false};
save('ASSEMBLY_CHECKOUT_SYNTAX.json',Buffer.from(JSON.stringify(proof,null,2)+'\n'));console.log(JSON.stringify(proof));
