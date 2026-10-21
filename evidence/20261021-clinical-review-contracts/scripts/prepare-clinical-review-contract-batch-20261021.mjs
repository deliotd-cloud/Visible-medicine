// Main-owned mechanical assembly; never edits the frozen or installed Website.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-clinical-review-contract-batch';
const site='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const atlas='F:/VisibleMedicine/staging/20261020-inbox-material-source';
const prefix='F:/VisibleMedicine/staging/20261021-';
const entries=[
 ['review-entry-router-proposal','tests/clinical-review-entry-track.test.mjs','0eacc6627a7cac95757d50b5c860a3f8fd0137a9b6fba2002981257627a54baa','c82af1e3d4221b37b4876608950d9c312bf18b0ab5d6b26d2e94560e705b2f2c'],
 ['elbow-review-contract-proposal','tests/clinical-review-elbow-us-followup.test.ts','666eadec1b2b71bed584db21d022a5af97d4e6f5e8b589ab0c7d77704b63800e','aad244f03fc81cec834dbed52eed7681f8a680f6d6d52cc82a9c17cde84fab0c'],
 ['elbow-review-contract-proposal','tests/elbow-admission-import-history.mjs','f994bb22c3e12330d82fe9c25d33e1a48a2bee8dd9ebf47a3b5d222ca004232d',null],
 ['elbow-review-contract-proposal','tests/elbow-us-followup-preservation.test.mjs','b2127dac886e0811462cfef39cd885e3d118cb13db442e01a573d307d1a9dff5',null],
 ['elbow-review-contract-proposal','tests/fixtures/clinical-review-elbow-us-followup.original.ts.raw','aad244f03fc81cec834dbed52eed7681f8a680f6d6d52cc82a9c17cde84fab0c',null],
 ['foot-girdle-contract-proposal','tests/clinical-review-foot-quiz.test.ts','5bb7ce5a0c6390fd7fa3d48d8c73ba7fe8695fb6a91da74e064bc6e4ca49ba06','154d68039e1e7a44a126d1de942fdf48644a3da2dc59cbcb5f4d9edf2641feea'],
 ['foot-girdle-contract-proposal','tests/clinical-review-girdle-ultrasound.test.ts','722906110b3645683062088fd0cd7968ac6c574ae6b60d6079d3c1fdb019b676','109393c2242920ea67e2e97fc5c0d65a87b07b84b1a98934251e07f00619fc5d'],
 ['foot-girdle-contract-proposal','tests/girdle-admission-import-history.mjs','b0939abb987a31cfaa07d656e9382d24af39f9bf23359a4b15bc9695b619a71e',null],
 ['genicular-contract-proposal','tests/clinical-review-genicular-ultrasound.test.ts','1383901d9479d17f9321eb97386ede8e1dc4ce59e3016b4d2899a00ac2fe229e','9f58d0e61113b327695d6cb6c98bd89062e00d5b64c2228ff7636dee9def3f10'],
 ['genicular-contract-proposal','tests/genicular-current-preservation.test.mjs','8ada261f1a0568b8afc4eb4b507a651419ae2680a719ea221d7ae8c4064c0279',null],
 ['genicular-contract-proposal','tests/fixtures/clinical-review-genicular-ultrasound-before-current.ts.raw','9f58d0e61113b327695d6cb6c98bd89062e00d5b64c2228ff7636dee9def3f10',null],
];
assert(!fs.existsSync(stage),'Create-only assembly');
const before=p=>fs.existsSync(site+'/'+p)?sha(read(site+'/'+p)):null;
for(const [origin,p,expected,old] of entries){
 assert.equal(sha(read(prefix+origin+'/'+p)),expected,p+' reviewed candidate');
 assert.equal(before(p),old,p+' frozen preimage');
}
const attrs=read(site+'/.gitattributes');
assert.equal(sha(attrs),'4f5d1c31e7e089798fa300e6043d18d2e5aa074162dba58bc9a874e4a598ee62');
const executables=entries.map(row=>row[1]).filter(p=>!p.startsWith('tests/fixtures/'));
assert.equal(executables.length,9);
const appended='\n# Exact reviewed clinical admission and router proof sources retain LF on checkout.\n'
 +executables.map(p=>p+' text eol=lf').join('\n')+'\n';
const nextAttrs=Buffer.concat([attrs,Buffer.from(appended)]);
assert.deepEqual(nextAttrs.subarray(0,attrs.length),attrs,'Whole original attributes retained byte-exact');
for(const p of executables)assert(!read(prefix+entries.find(row=>row[1]===p)[0]+'/'+p).includes(Buffer.from('\r\n')),p+' reviewed LF');
fs.mkdirSync(stage);fs.mkdirSync(stage+'/files');
const save=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});assert.equal(sha(read(p)),sha(b));};
const files=[];
for(const [origin,p,expected,old] of entries){
 save(stage+'/files/'+p,read(prefix+origin+'/'+p));
 if(old)save(stage+'/originals/'+p,read(site+'/'+p));
 files.push({path:p,origin:prefix+origin+'/'+p,beforeSha256:old,sha256:expected});
}
save(stage+'/files/.gitattributes',nextAttrs);save(stage+'/originals/.gitattributes',attrs);
files.push({path:'.gitattributes',beforeSha256:sha(attrs),sha256:sha(nextAttrs),appendOnly:true});
const manifest={schema:'vm-clinical-assurance-batch/1',at:new Date().toISOString(),site,atlas,
 source:'485df97c2530e8e81a8d39a5ee61073ce76d93db',files,
 scope:'Twelve staged test/fixture/attribute paths only. Keep genuine old elbow/girdle imports separate from checked current delivery; original security and revision-bound assertions retained. LF protection fixes fresh-Windows-checkout raw proof portability without normalizing historical raw fixtures.',
 actualCorpusModulesPassed:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,
 noFrozenOrInstalledMutations:true,fullGoalActive:true};
save(stage+'/MANIFEST.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
save(stage+'/PREPARATION.json',Buffer.from(JSON.stringify({stage,site,atlas,scope:'Pure assembly and checkout proof only; full corpus tests wait for existing Website and queued dental jobs.'},null,2)+'\n'));
// Real fresh Git checkout with Windows-style autocrlf, not just attribute text checks.
const repo=stage+'/checkout-seed',checkout=stage+'/checkout-proof';
const git=(cwd,args)=>execFileSync('git',['-C',cwd,...args],{windowsHide:true,stdio:['pipe','pipe','pipe']});
fs.mkdirSync(repo);git(repo,['init','-q']);git(repo,['config','core.autocrlf','true']);
for(const row of files)save(repo+'/'+row.path,read(stage+'/files/'+row.path));
git(repo,['add','--',...files.map(row=>row.path)]);
git(repo,['-c','user.name=Local checkout proof','-c','user.email=checkout-proof@localhost','commit','-qm','Local staged clinical checkout byte proof']);
execFileSync('git',['clone','--quiet','--no-checkout','--local',repo,checkout],{windowsHide:true,stdio:['pipe','pipe','pipe']});
git(checkout,['config','core.autocrlf','true']);git(checkout,['checkout','-q','HEAD']);
for(const row of files){assert.equal(sha(read(checkout+'/'+row.path)),row.sha256,row.path+' fresh checkout bytes');assert.equal(before(row.path),row.beforeSha256,row.path+' frozen untouched');}
const attr=git(checkout,['check-attr','text','eol','--',...executables]).toString();
assert.equal((attr.match(/: text: set/g)||[]).length,9);assert.equal((attr.match(/: eol: lf/g)||[]).length,9);
const receipt={at:new Date().toISOString(),paths:files.length,executableLfRules:9,freshAutocrlfCheckoutByteIdentical:true,
 rawFixtures:2,wholeOriginalAttributesByteIdentical:true,frozenPreimagesUnchanged:true,actualCorpusModulesPassed:false,
 manifestSha256:sha(read(stage+'/MANIFEST.json')),canonicalInstalled:false};
save(stage+'/ASSEMBLY_AND_CHECKOUT.json',Buffer.from(JSON.stringify(receipt,null,2)+'\n'));
console.log(JSON.stringify(receipt));
