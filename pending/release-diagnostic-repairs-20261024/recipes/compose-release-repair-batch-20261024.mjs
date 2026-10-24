// Partial test-repair tree only. Never edits the running or installed Website.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {replacementSeams as b79Seams} from 'file:///F:/VisibleMedicine/staging/20261024-release-repair-batch/b79-back/repair.v2.mjs';
import {replacementSeams as ae84Seams} from 'file:///F:/VisibleMedicine/staging/20261024-release-repair-batch/ae84/produce.v2.mjs';
const root='F:/VisibleMedicine/staging/20261024-release-repair-batch/main',candidate=root+'/candidate';
const parentPath='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/SOURCE_BOUND.json';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
assert(!fs.existsSync(root+'/COMPOSED.json'));
assert.equal(sha(read(parentPath)),'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
const parent=json(parentPath),sourceRows=new Map(parent.sourceRows.map(r=>[r.path,r])),records=new Map(),outputs=new Map();
function add(file,seams){
 assert(/^tests\/[a-z0-9-]+(?:\.test)?\.(?:mjs|ts)$/.test(file));
 if(!records.has(file)){const before=read(parent.website+'/'+file);assert.equal(sha(before),sourceRows.get(file).sha256,file);records.set(file,{path:file,beforeSha256:sha(before),seams:[]});outputs.set(file,before);}
 const row=records.get(file);let text=outputs.get(file).toString();
 for(const [a,b]of seams){assert(a.length&&b.length&&a!==b);assert.equal(text.split(a).length,2,'Unique source seam: '+file+':'+a.slice(0,60));text=text.replace(a,b);row.seams.push([a,b]);}
 outputs.set(file,Buffer.from(text));
}
const prefix=file=>{const text=outputs.has(file)?outputs.get(file).toString():read(parent.website+'/'+file).toString();const first=text.slice(0,text.indexOf('\n')+1);add(file,[[first,"import {restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';\n"+first]]);};
for(const [name,seams]of Object.entries(b79Seams))add('tests/'+name,seams.map(({a,b})=>[a,b]));
for(const row of json('F:/VisibleMedicine/staging/20261024-release-repair-batch/b79-back/GENERATED.json').rows)assert.equal(sha(outputs.get(row.path)),row.afterSha256);
add('tests/ae84-metadata-closure.test.mjs',ae84Seams);
assert.equal(sha(outputs.get('tests/ae84-metadata-closure.test.mjs')),'1697815f590b76473843d2a07ab39715cf99ad55ca4caa4d065f99514dfe9f66');
const coverage=json('F:/VisibleMedicine/staging/20261024-release-coverage-count-proposal/HANDOFF.json');
for(const row of coverage.changes){add(row.path,row.seams);assert.equal(sha(outputs.get(row.path)),row.afterSha256);}
const arterial='tests/atlas-arterial-evidence-limits.test.mjs';
add(arterial,[
 ["  assert.equal(CURRENT_ATLAS_REVISION,'2381efe43b75f8a7fb768a069eecd7268c508dac');","  assert.equal(CURRENT_ATLAS_REVISION,'6e810b188dde401f6c19a970928f316a479696df');"],
 ["  assert.deepEqual(pin.runtimeSources,{'head-neck':CURRENT_ATLAS_REVISION,\n    shoulder:historical,'lower-limb':historical,'female-pelvis':historical});","  assert.deepEqual(pin.runtimeSources,{'head-neck':CURRENT_ATLAS_REVISION,\n    shoulder:CURRENT_ATLAS_REVISION,'lower-limb':CURRENT_ATLAS_REVISION,'female-pelvis':CURRENT_ATLAS_REVISION});"],
 ["    wrong.runtimeSources[name]=name==='head-neck'?historical:CURRENT_ATLAS_REVISION;","    wrong.runtimeSources[name]=historical;"],
]);
const history='tests/arterial-history-preservation.test.mjs';prefix(history);
add(history,[
 ['function nativeSource6d7(bytes){',"function nativeSource6d7(bytes){\n bytes=restoreReleaseDiagnosticContext('tests/atlas-arterial-evidence-limits.test.mjs',bytes);"],
 [' const text=readFileSync(admitted).toString(),native='," const text=restoreReleaseDiagnosticContext('tests/atlas-arterial-evidence-limits.test.mjs',readFileSync(admitted)).toString(),native="],
]);
const shared='tests/adjacent-current-role-inverse.mjs';prefix(shared);
add(shared,[['export function restoreAdjacentSharedRole(name,bytes){', 'export function restoreAdjacentSharedRole(name,bytes){bytes=restoreReleaseDiagnosticContext(name,bytes);']]);
const adjacent='tests/adjacent-current-tour-source-roles.test.mjs';prefix(adjacent);
add(adjacent,[["sha(read('adjacent-current-role-inverse.mjs'))","sha(restoreReleaseDiagnosticContext('tests/adjacent-current-role-inverse.mjs',read('adjacent-current-role-inverse.mjs')))" ]]);
for(const [file,fn]of [['tests/complete-release-followup-preservation.test.mjs','original'],['tests/complete-release-five-followups-preservation.test.mjs','inverse']]){
 prefix(file);add(file,[[`function ${fn}(row,bytes){`,`function ${fn}(row,bytes){if(row.path==='${arterial}')bytes=restoreReleaseDiagnosticContext(row.path,bytes);`]]);
}
const recordList=[...records.values()];assert.equal(recordList.length,11);
for(const row of recordList){
 const bytes=outputs.get(row.path);row.afterSha256=sha(bytes);let inverse=bytes.toString();
 for(const [a,b]of row.seams.toReversed()){assert.equal(inverse.split(b).length,2);inverse=inverse.replace(b,a);}
 assert.deepEqual(Buffer.from(inverse),read(parent.website+'/'+row.path),'Whole frozen source inverse '+row.path);
 fs.mkdirSync(path.dirname(candidate+'/'+row.path),{recursive:true});fs.writeFileSync(candidate+'/'+row.path,bytes,{flag:'wx'});
}
const unchangedSupport='tests/arterial-current-role-inverse.mjs';
assert.equal(sha(read(parent.website+'/'+unchangedSupport)),sourceRows.get(unchangedSupport).sha256);
fs.copyFileSync(parent.website+'/'+unchangedSupport,candidate+'/'+unchangedSupport,fs.constants.COPYFILE_EXCL);
fs.mkdirSync(candidate+'/tests/fixtures',{recursive:true});
const fixture={schema:'vm-release-diagnostic-source-inverse-1',parentReceipt:parentPath,parentSha256:sha(read(parentPath)),records:recordList};
fs.writeFileSync(candidate+'/tests/fixtures/release-diagnostic-repair-20261024.json',JSON.stringify(fixture,null,2)+'\n',{flag:'wx'});
const manifest={at:new Date().toISOString(),kind:'partial-test-only-source-repair-tree',parentReceipt:parentPath,parentSha256:sha(read(parentPath)),parentWebsite:parent.website,candidate,changedTestPaths:recordList.map(r=>r.path),unchangedSupport,recordsFixture:candidate+'/tests/fixtures/release-diagnostic-repair-20261024.json',recordsFixtureSha256:sha(read(candidate+'/tests/fixtures/release-diagnostic-repair-20261024.json')),originalBodiesAndNegativesRecovered:true,arterialWrongFamilyForgedForAllFour:true,newCandidateIntegrated:false,originalAffectedSuitesRun:false,productionSourceChanged:false,frozenCandidateChanged:false,previewChanged:false,installed:false,clinicalApproval:false,patientSpaceRegistration:false};
fs.writeFileSync(root+'/COMPOSED.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({composition:root+'/COMPOSED.json',sha256:sha(read(root+'/COMPOSED.json')),changedTests:11,partialOnly:true,previewChanged:false}));
