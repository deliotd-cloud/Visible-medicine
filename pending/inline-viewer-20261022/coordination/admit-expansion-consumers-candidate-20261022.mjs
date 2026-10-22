import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate';
const candidate=root+'/website',site='F:/VisibleMedicine/website';
const prepared=json(root+'/PREPARED.json');assert(!fs.existsSync(root+'/CONSUMER_ADOPTION.json'));
const ssrRoot='F:/VisibleMedicine/staging/20261022-expansion-ssr-adoption',frameRoot='F:/VisibleMedicine/staging/20261022-expansion-frame-adoption';
const ssr=json(ssrRoot+'/HANDOFF.json'),frame=json(frameRoot+'/HANDOFF.json');
const expected=new Map(prepared.sourceRows.map(row=>[row.path,row]));
for(const row of ssr.copyToCandidateTests){assert.equal(sha(read(ssrRoot+'/'+row.path)),row.newSha256,row.path);if(row.preimageSha256){assert.equal(sha(read(site+'/'+row.path)),row.preimageSha256);assert.equal(sha(read(candidate+'/'+row.path)),row.preimageSha256);}}
for(const [relative,expectedSha]of Object.entries(frame.files))assert.equal(sha(read(frameRoot+'/'+relative)),expectedSha,relative);
const staged=new Map();
const add=(relative,from,hash)=>{assert(!staged.has(relative));const bytes=read(from);if(hash)assert.equal(sha(bytes),hash,relative);staged.set(relative,{path:relative,from,bytes:bytes.length,sha256:sha(bytes)});};
for(const row of ssr.copyToCandidateTests)add(row.path,ssrRoot+'/'+row.path,row.newSha256);
add('tests/atlas-runtime-expansion-adoption-proof.test.mjs',ssrRoot+'/tests/atlas-runtime-expansion-adoption-proof.test.mjs',ssr.stagingEvidence.proofSha256);
for(const row of ssr.copyToCandidateTests.filter(row=>row.preimageSha256))add('tests/preimages/'+row.path.slice(6)+'.raw',ssrRoot+'/tests/preimages/'+row.path.slice(6)+'.raw',row.preimageSha256);
for(const name of ['atlas-runtime-frame.test.mjs','atlas-body-learning-component.test.mjs','body-learning-layout-history-preservation.test.mjs']){
 const relative='tests/'+name;assert.equal(sha(read(candidate+'/'+relative)),sha(read(site+'/'+relative)),'Exact original candidate test '+name);
 add(relative,frameRoot+'/'+relative,frame.files[relative]);
 add('tests/fixtures/expansion-consumer-adoption-20261022/'+name+'.raw',site+'/'+relative,sha(read(candidate+'/'+relative)));
}
add('tests/expansion-frame-adoption-inverse.mjs',frameRoot+'/tests/expansion-frame-adoption-inverse.mjs',frame.files['tests/expansion-frame-adoption-inverse.mjs']);
assert.equal(staged.size,17);
const before=[];
for(const row of staged.values()){
 const to=path.resolve(candidate,row.path);assert(to.startsWith(path.resolve(candidate)+path.sep));
 const prior=expected.get(row.path)??null;
 if(prior)assert.equal(sha(read(to)),prior.sha256,row.path);
 else assert(!fs.existsSync(to),'Unknown candidate path '+row.path);
 fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.from,to);
 assert.equal(sha(read(to)),row.sha256,row.path);
 before.push({path:row.path,before:prior,after:{bytes:row.bytes,sha256:row.sha256}});
 expected.set(row.path,{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
assert.equal(expected.size,5766);
assert.equal(json(candidate+'/atlas-review/integration-inputs.json').sha256,prepared.binding.after,'Tests do not silently rebind Review');
const roots=['tests/atlas-runtime-frame.test.mjs','tests/atlas-body-learning-component.test.mjs','tests/body-learning-layout-history-preservation.test.mjs','tests/live-learning-consumer-loader-preservation.test.mjs','tests/atlas-runtime-expansion-adoption-proof.test.mjs'];
const command=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...roots];
const started=new Date().toISOString();
const result=spawnSync(process.execPath,command,{cwd:candidate,encoding:'utf8',windowsHide:true,maxBuffer:16e6,env:{...process.env,VM_WEBSITE_ROOT:candidate,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'}});
const log=(result.stdout??'')+(result.stderr??'');fs.writeFileSync(root+'/CONSUMER_TESTS.log',log,{flag:'wx'});
const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...log.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];counts[key]=matches.length?Number(matches.at(-1)[1]):null;}
const receipt={at:new Date().toISOString(),started,root,candidate,phase:result.status===0?'focused-consumer-checks-passed':'focused-consumer-checks-failed-retain-and-diagnose',
 source:prepared.installedSource,pendingReview:prepared.binding.after,stagedPaths:17,changedTests:7,changes:before,
 sourceRows:[...expected.values()].sort((a,b)=>a.path.localeCompare(b.path)),sourcePaths:expected.size,
 command:[process.execPath,...command],exitCode:result.status,counts,log:root+'/CONSUMER_TESTS.log',logSha256:sha(read(root+'/CONSUMER_TESTS.log')),
 review:'Main read complete seven actual test diffs, real SSR helper, exact Frame inverse and proof. Original source assertions remain; the Help text now retains Viewer help as its accessible name, and one mounted-frame/learning-session expansion unit is added. Three complete native original test preimages and four SSR originals are retained; none is replaced by a broad hash repin.',
 canonicalChanged:false,frozenFullSuiteCandidateChanged:false,ownerFormsTouched:false,nativeTeachingOriginalCohortsRun:false,fullTypes:false,websiteBuild:false,reviewViewerBuild:false,currentPinAdmission:false,fullSuitePassing:false,clinicalApproval:false,spatialRegistration:false};
fs.writeFileSync(root+'/CONSUMER_ADOPTION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/CONSUMER_ADOPTION.json',sha256:sha(read(root+'/CONSUMER_ADOPTION.json')),exitCode:result.status,counts,scope:'Five lightweight Frame/learning/history source-and-component roots, not a second broad or heavy validation job'}));
assert.equal(result.status,0,'Inspect retained CONSUMER_TESTS.log; do not repeat until a relevant correction');
assert(counts.tests>0&&counts.pass===counts.tests&&counts.fail===0&&counts.cancelled===0&&counts.skipped===0);
