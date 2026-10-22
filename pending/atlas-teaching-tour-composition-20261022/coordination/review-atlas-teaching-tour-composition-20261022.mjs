import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-atlas-teaching-tour-composition';
const candidate=stage+'/atlas',epoch='2381efe43b75f8a7fb768a069eecd7268c508dac';
const git=(...args)=>execFileSync('git',args,{cwd:candidate,windowsHide:true,encoding:'utf8',maxBuffer:64e6}).trim();
const old=p=>runGit(['-C',candidate,'show',epoch+':'+p]);
const checks=[];
for(const phase of ['final','metadata-repair']){
  const result=json(`${stage}/composition-evidence/${phase}/RESULT.json`);assert(result.success);
  for(const row of result.checks){assert.equal(row.exitCode,0);assert.equal(sha(read(row.log)),row.logSha256);checks.push({...row,phase});}
}
const count=log=>{
  const raw=read(log).toString('utf8'),get=name=>{const values=[...raw.matchAll(new RegExp('^(?:#|ℹ) '+name+' (\\d+)\\r?$','gm'))];assert.equal(values.length,1,name+': exact native terminal count');return Number(values[0][1]);};
  const result={tests:get('tests'),pass:get('pass'),fail:get('fail'),cancelled:get('cancelled'),skipped:get('skipped'),todo:get('todo')};
  assert.equal(result.tests,result.pass);for(const key of ['fail','cancelled','skipped','todo'])assert.equal(result[key],0);
  assert.equal(get('suites'),0,'These focused logs have no suite records');
  const records=[...raw.matchAll(/^(?:ok \d+ - |✔ )/gm)];assert.equal(records.length,result.tests,'Native result records agree with terminal counters');return result;
};
const native=checks.filter(r=>r.command.includes('--test')).map(row=>({log:row.log,...count(row.log)}));
const workerPaths=['hamstring-portable-evidence','hamstring-library-evidence'];
for(const folder of workerPaths){
  const result=json(`${stage}/${folder}/RESULT.json`);assert.equal(result.status,'focused-pass-uncommitted');
  for(const [p,hash] of Object.entries(result.changedScripts))assert.equal(sha(read(candidate+'/'+p)),hash);
  for(const row of result.checks){const log=`${stage}/${folder}/${row.log}`;assert.equal(sha(read(log)),row.logSha256);assert.equal(row.exitCode,0);
    if(row.nativeTests){const counts=count(log);assert.equal(counts.tests,row.nativeTests);native.push({log,...counts});}}
}
const preparation=json(stage+'/PREPARATION.json');
assert.equal(git('rev-parse','HEAD'),epoch);assert.equal(git('rev-parse',epoch+'^{tree}'),preparation.tree);
for(const row of preparation.overlay){
  const current=read(candidate+'/'+row.path);
  if(row.path==='app/anatomy-data.ts')assert.equal(sha(current.toString().replace("'../lib/legacy-shoulder-references.ts'","'../lib/legacy-shoulder-references'")),row.sha256);
  else if(row.path==='lib/legacy-shoulder-references.ts')assert.equal(sha(current.toString().replace("'../app/anatomy-data.ts'","'../app/anatomy-data'").replace("'./legacy-shoulder-bone-references.ts'","'./legacy-shoulder-bone-references'").replace("'./legacy-shoulder-muscle-references.ts'","'./legacy-shoulder-muscle-references'")),row.sha256);
  else if(!['scripts/pin-hamstring-tours.mjs','scripts/test-hamstring-tours.mjs','scripts/test-legacy-shoulder-references.mjs'].includes(row.path))assert.equal(sha(current),row.sha256,row.path);
}
const ts=createRequire(candidate+'/package.json')('typescript');
function testBodies(text){const source=ts.createSourceFile('tests.mjs',text.replaceAll('\r\n','\n'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),rows=[];
 function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(source)==='test')rows.push(node.arguments.map(a=>a.getText(source)));ts.forEachChild(node,visit);}visit(source);return rows;}
assert.deepEqual(testBodies(read(candidate+'/scripts/test-legacy-shoulder-references.mjs').toString()),testBodies(read('F:/VisibleMedicine/staging/20261022-legacy-shoulder-ct-evidence/scripts/test-legacy-shoulder-references.mjs').toString()));
const priorHistorical=old('scripts/test-whole-body-guided-learning.mjs').toString().replaceAll('\r\n','\n');
const currentHistorical=read(candidate+'/scripts/test-whole-body-guided-learning.mjs').toString().replaceAll('\r\n','\n');
const interactionBody=text=>{const start=text.indexOf('const deferred=[]');return text.slice(start,text.indexOf('console.log(JSON.stringify(',start));};
assert.equal(interactionBody(currentHistorical),interactionBody(priorHistorical));
const originalPackage=JSON.parse(old('package.json')),currentPackage=json(candidate+'/package.json');
const aliases=['legacy-shoulder-references:test','hamstring-tours:test','atlas-teaching-tour-composition:test'];
const packageInverse=structuredClone(currentPackage);for(const key of aliases){assert(!Object.hasOwn(originalPackage.scripts,key));assert(Object.hasOwn(packageInverse.scripts,key));delete packageInverse.scripts[key];}assert.deepEqual(packageInverse,originalPackage);
assert.deepEqual(read(candidate+'/package-lock.json'),old('package-lock.json'));
const revisions=json(candidate+'/content/review-revisions.json'),oldRevisions=JSON.parse(old('content/review-revisions.json'));
assert.equal(revisions.modelHash,oldRevisions.modelHash);assert.deepEqual(revisions.display,oldRevisions.display);
assert.deepEqual(Object.keys(revisions.revisions),Object.keys(oldRevisions.revisions));
for(const [id,value] of Object.entries(revisions.revisions)){assert.equal(value.geometry,oldRevisions.revisions[id].geometry);assert.equal(value.imaging,null);assert.notEqual(value.teaching,oldRevisions.revisions[id].teaching);}
const renderer=json(candidate+'/content/body-renderer-revision.json');assert.notEqual(renderer.sha256,JSON.parse(old('content/body-renderer-revision.json')).sha256);
assert.equal(git('status','--porcelain','--','public/models'),'');
const trackedChanges=git('diff',epoch,'--name-only').split('\n').filter(Boolean);
const untracked=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean);
const files=[...new Set([...trackedChanges,...untracked])].sort();assert.equal(files.length,22);
const sourceRows=files.map(p=>({path:p,bytes:read(candidate+'/'+p).length,sha256:sha(read(candidate+'/'+p)),generated:p.startsWith('content/')}));
const preimages=[];for(const p of trackedChanges){const bytes=old(p),destination=stage+'/composition-preimage/'+p;fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes,{flag:'wx'});preimages.push({key:p,path:destination,sha256:sha(bytes)});}
for(const p of ['F:/VisibleMedicine/website','F:/VisibleMedicine/atlas']){const actual=execFileSync('git',['rev-parse','HEAD'],{cwd:p,encoding:'utf8',windowsHide:true}).trim();assert.equal(actual,p.endsWith('/website')?'b953ff3f5f1891599cb6e91cb91311d9d6006270':'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');}
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:preparation.baseline,encoding:'utf8',windowsHide:true}).trim(),'');
const evidenceFiles=[stage+'/PREPARATION.json',...checks.flatMap(r=>[r.log]),
  ...['admission','metadata','metadata-repair','final'].flatMap(phase=>[`${stage}/composition-evidence/${phase}/RESULT.json`,...json(`${stage}/composition-evidence/${phase}/RESULT.json`).checks.map(r=>r.log)]),
  ...workerPaths.flatMap(folder=>[`${stage}/${folder}/RESULT.json`,...json(`${stage}/${folder}/RESULT.json`).checks.map(r=>`${stage}/${folder}/${r.log}`)])];
// The first failed native import attempt is retained, never represented as passing.
evidenceFiles.push(`${stage}/composition-evidence/metadata/03.log`);
const report={schema:'vm.atlas-teaching-tour-main-review/1',at:new Date().toISOString(),candidate,baseline:epoch,
  baselineTree:preparation.tree,sourceRows,preimages,checks,native,nativePassing:native.reduce((n,r)=>n+r.pass,0),
  currentComposition:{rootSelections:1104,topicPlacements:9936,changedTeachingPlacements:89,changedReviewSnapshots:22,unchangedReviewSnapshots:1082,newTourSourceIdentities:10,previousToursPreserved:51,currentTours:53,newStops:8,pendingTeachingPlacements:525},
  metadata:{bodyDisplayPins:1104,changedPins:22,shoulderTeachingRevisions:9,shoulderGeometryAndImagingUnchanged:true,rootRendererFiles:renderer.dependencies.length,rootRendererSha256:renderer.sha256,generatedByExistingProducers:true},
  mainCorrection:'Native review generator exposed extensionless reference imports. Explicit .ts imports restore native Node resolution; existing five reference test bodies remain exact. Failed attempt retained.',
  historicalScope:'One 51-tour/309-stop test replays1231exact baseline inputs with its full original interaction/assertion body preserved. Current53-tour data/Review, library and regional-player tests are independent; synthetic components are not real browser/GPU evidence.',
  localEvidence:[...new Set(evidenceFiles)].map(p=>({path:p,sha256:sha(read(p))})),
  limitations:['No full project types/build/browser or complete release-suite acceptance.','No fresh exported Review/runtime bindings or Website import; this is an isolated source composition.','All new teaching/tours remain drafts, source-linked semantics are not patient-space registration.','No new package/font/model/texture/dataset; existing source geometry, lockfile, access and specialist boundaries unchanged.','No private decision writes, approval, preview restart/install/refresh or public deployment.'],
  coherentSourceComposition:true,reviewRuntimeBindingPending:true,installed:false,previewChanged:false,clinicalApproval:false,spatialRegistration:false,wholeSuitePassing:false};
fs.writeFileSync(stage+'/MAIN_REVIEW.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({mainReview:stage+'/MAIN_REVIEW.json',sha256:sha(read(stage+'/MAIN_REVIEW.json')),nativePassing:report.nativePassing,sourcePaths:sourceRows.length,rootRendererSha256:renderer.sha256,previewChanged:false}));
