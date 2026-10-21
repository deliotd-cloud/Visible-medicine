// Main-owned before-hash assembly of reviewed independent test-only proposals.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-clinical-assurance-combined-lf';
const previous='F:/VisibleMedicine/staging/20261021-clinical-review-contract-batch';
const parent=json(previous+'/MANIFEST.json');
assert.equal(sha(read(previous+'/MANIFEST.json')),'55edce0463c9066deb4a706091bcd8341fb6ddda98756360935987e2341538b1');
const site=parent.site,atlas=parent.atlas;
const proposals='F:/VisibleMedicine/staging/20261021-';
const entries=parent.files.filter(row=>row.path!=='.gitattributes').map(row=>({...row,origin:previous+'/files/'+row.path}));
const extra=[
 ['forearm-xray-contract-proposal','clinical-review-forearm-vascular-xray.test.ts','1e609a7bd8a18d032a3d586c1bab99cc3ebed8f4c4b5477bcf0e055110eeb058','59af4032c50b8352a1664d9296f522d2dd63bb0fbda5653ccd7c26168103bc62'],
 ['forearm-xray-contract-proposal','forearm-admission-import-history.mjs','d6b519e7a24b27163b8417fa46829dd41dc8978a97b58df1b7ae453d75c86629',null],
 ['forearm-xray-contract-proposal','forearm-xray-preservation.test.mjs','41b999b07c36480e8b4fa85a34e532218c9a2666022d5a6a4543aff3f0b2a791',null],
 ['forearm-xray-contract-proposal','fixtures/clinical-review-forearm-vascular-xray.original.ts.raw','59af4032c50b8352a1664d9296f522d2dd63bb0fbda5653ccd7c26168103bc62',null],
 ['clinical-git-root-proposal','clinical-review-salivary-stylohyoid-quiz.test.ts','13e34a676028b2f622f9f703d4f196da3810c4c3108475b82c2c5146155f124f','7ae70f87540ce1cefa82437e9578b13ec3fddfc5ff2a2a9ccdd23e5ba4ae30d2'],
 ['clinical-git-root-proposal','clinical-review-teaching-heading.test.ts','802d91134bc1cf1f39373cf33cd103dde8a78c92094386ab7051726366014d12','228eaa9986e7730815905d9ea11feb896a4effec5f1f64a1c0b1b1e25c8caef6'],
 ['clinical-git-root-proposal','clinical-review-git-root-preservation.test.mjs','872c394d575408abedc9a6944d2823451eb19edf865e5194508f4e022054f72e',null],
 ['clinical-git-root-proposal','fixtures/clinical-review-salivary-stylohyoid-quiz.before-git-root.ts.raw','7ae70f87540ce1cefa82437e9578b13ec3fddfc5ff2a2a9ccdd23e5ba4ae30d2',null],
 ['clinical-git-root-proposal','fixtures/clinical-review-teaching-heading.before-git-root.ts.raw','228eaa9986e7730815905d9ea11feb896a4effec5f1f64a1c0b1b1e25c8caef6',null],
];
const quizzes=[
 ['lacrimal','2134305fe2af059f405b463dfa6158a5c2e05396628fde97ddd24210df695abe','3b51b64724f350e97be48685e093ad5c1db12b4feb0b7a66a6acace7fd92815e'],
 ['laryngeal-framework','63cc3f0c56b554f6a7ca0030eaeef44ff919dc7ec3f0d3c66ac8354f57e91deb','b214fbac93ea5d89394ad35e2ad1eea2ee4a02cca74b9fdd2aaf643b33776d62'],
 ['laryngeal-muscle','806646d125fa5772174a46f3976c162a095755e257d15b961536536eff8f0aec','bb5bc9c86e1e18ccbaae4a66a6e5d3f68a2ece9db2f4018e4d688989bc07ec8f'],
 ['neuro-organ','b9d7df5eea3dff6c4c363f9cd1fdbaceec472566c30bf81b4aa04ed2a6518e4b','81d41673fce49bca55901ccb9d374ae1fa8a62847563c2597b594be9729c10ef'],
 ['ocular-support','a29ccee61b27faf00d925fafc8b00e0d5b64eda4ebd6481b8b1ff4d16b7e5101','c0b8e103a75f6e1cc4dfbcb120aabeb272fc2b1d5ac63d69695c5b4059845701'],
 ['scapular-muscle','f85cabca7802609c6fd339256b87422922862a6cd235b75f8b7cbba8d9720b1a','2ef7cd0048c472defaee2062e510be0008dd9c88d3151fbd4f0738eb3b7c8f15'],
];
for(const [name,post,old] of quizzes){
 extra.push(['clinical-current-quiz-batch','clinical-review-'+name+'-quiz.test.ts',post,old]);
 extra.push(['clinical-current-quiz-batch','fixtures/clinical-review-'+name+'-quiz.original.ts.raw',old,null]);
}
extra.push(['clinical-current-quiz-batch','clinical-current-quiz-preservation.test.mjs','b7ef46cdeb1c22340ce0f007b18cf02743fa5c81c21d58067743b2f0548587af',null]);
for(const [origin,p,hash,before] of extra)entries.push({path:'tests/'+p,origin:proposals+origin+'/tests/'+p,sha256:hash,beforeSha256:before});
assert.equal(entries.length,33);assert.equal(new Set(entries.map(row=>row.path)).size,33);
const before=p=>fs.existsSync(site+'/'+p)?sha(read(site+'/'+p)):null;
for(const row of entries){assert.equal(sha(read(row.origin)),row.sha256,row.path+' reviewed postimage');assert.equal(before(row.path),row.beforeSha256,row.path+' frozen preimage');}
assert(!fs.existsSync(stage));
const attrs=read(site+'/.gitattributes');assert.equal(sha(attrs),'4f5d1c31e7e089798fa300e6043d18d2e5aa074162dba58bc9a874e4a598ee62');
const executables=entries.filter(row=>!row.path.startsWith('tests/fixtures/')).map(row=>row.path);
assert.equal(executables.length,22);
const nextAttrs=Buffer.concat([attrs,Buffer.from('\n# Exact reviewed clinical admission, root and router proof sources retain LF on checkout.\n'+executables.map(p=>p+' text eol=lf').join('\n')+'\n')]);
assert.deepEqual(nextAttrs.subarray(0,attrs.length),attrs);
fs.mkdirSync(stage);
const save=(relative,b)=>{const to=stage+'/'+relative;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});assert.equal(sha(read(to)),sha(b));};
for(const row of entries){save('files/'+row.path,read(row.origin));if(row.beforeSha256)save('originals/'+row.path,read(site+'/'+row.path));}
save('files/.gitattributes',nextAttrs);save('originals/.gitattributes',attrs);
entries.push({path:'.gitattributes',beforeSha256:sha(attrs),sha256:sha(nextAttrs),appendOnly:true});
const actualModules=entries.filter(row=>row.beforeSha256&&row.path.endsWith('.test.ts')||row.path==='tests/clinical-review-entry-track.test.mjs').map(row=>row.path).sort();
assert.equal(actualModules.length,14);
const pureModules=['tests/elbow-us-followup-preservation.test.mjs','tests/genicular-current-preservation.test.mjs',
 'tests/forearm-xray-preservation.test.mjs','tests/clinical-review-git-root-preservation.test.mjs','tests/clinical-current-quiz-preservation.test.mjs'];
const manifest={schema:'vm-clinical-assurance-combined/1',at:new Date().toISOString(),site,atlas,source:parent.source,
 parentManifest:sha(read(previous+'/MANIFEST.json')),files:entries,actualModules,pureModules,
 scope:'34 staged Website test/fixture/attribute paths;22LF executables and11byte-exact raw fixtures. Separate actual historical9f API and checked-current delivery,14original corpus modules retained. Salivary test-source CRLF representation explicitly inverted; source artifacts themselves are compared raw.',
 actualCorpusModulesPassed:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,fullGoalActive:true};
save('MANIFEST.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
save('PREPARATION.json',Buffer.from(JSON.stringify({stage,site,atlas,scope:'Combined pure/metadata/syntax/check-out only; existing full Website and dental jobs keep the heavy slot.'},null,2)+'\n'));
// Actual fresh checkout with host-independent executable EOL and immutable raw evidence.
const repo=stage+'/checkout-seed',checkout=stage+'/checkout-proof';
const git=(cwd,args)=>execFileSync('git',['-C',cwd,...args],{windowsHide:true,stdio:['pipe','pipe','pipe']});
fs.mkdirSync(repo);git(repo,['init','-q']);git(repo,['config','core.autocrlf','true']);
for(const row of entries){const to=repo+'/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,read(stage+'/files/'+row.path),{flag:'wx'});}
git(repo,['add','--',...entries.map(row=>row.path)]);
git(repo,['-c','user.name=Local checkout proof','-c','user.email=checkout-proof@localhost','commit','-qm','Local combined clinical assurance byte proof']);
execFileSync('git',['clone','--quiet','--no-checkout','--local',repo,checkout],{windowsHide:true,stdio:['pipe','pipe','pipe']});
git(checkout,['config','core.autocrlf','true']);git(checkout,['checkout','-q','HEAD']);
for(const row of entries){assert.equal(sha(read(checkout+'/'+row.path)),row.sha256,row.path+' fresh checkout');assert.equal(before(row.path),row.beforeSha256,row.path+' frozen untouched');}
for(const p of executables)execFileSync(process.execPath,['--experimental-strip-types','--check',checkout+'/'+p],{windowsHide:true,stdio:['pipe','pipe','pipe']});
const result={at:new Date().toISOString(),shippingPaths:34,actualModules:14,syntaxChecked:22,rawFixtures:11,
 actualFreshAutocrlfCheckoutMatchesAllPaths:true,wholeOriginalAttributesByteIdentical:true,frozenPreimagesUnchanged:true,
 manifestSha256:sha(read(stage+'/MANIFEST.json')),actualCorpusModulesPassed:false,canonicalInstalled:false};
save('ASSEMBLY_CHECKOUT_SYNTAX.json',Buffer.from(JSON.stringify(result,null,2)+'\n'));console.log(JSON.stringify(result));
