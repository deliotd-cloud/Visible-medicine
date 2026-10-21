import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-source190-website',prep=json(stage+'/PREPARATION.json'),site=prep.site;
assert(prep.sourceOriginalPreserved&&!prep.canonicalInstalled);
const previous='485df97c2530e8e81a8d39a5ee61073ce76d93db',source=prep.sourceCommit;
const original=read(prep.original+'/scripts/import-clinical-review.mjs').toString(),current=read(site+'/scripts/import-clinical-review.mjs').toString();
assert.equal(original.split(previous).length,2);assert.equal(current,original.replace(previous,source));assert.equal(current.replace(source,previous),original);
const coverage='F:/VisibleMedicine/staging/20261021-atlas190-website-admission/coverage',candidate=json(coverage+'/candidate-manifest.json');assert.equal(candidate.sourceRevision,source);assert.equal(candidate.sourceInputs,168);
const copied=[];
for(const row of candidate.sourceArtifacts){const name=path.basename(row.path),bytes=read(coverage+'/'+name);assert.equal(sha(bytes),row.sha256);fs.copyFileSync(coverage+'/'+name,site+'/'+row.path);copied.push({path:row.path,sha256:sha(bytes)});}
assert.equal(sha(read(coverage+'/index.json')),candidate.indexSha256);fs.copyFileSync(coverage+'/index.json',site+'/docs/anatomy-coverage/index.json');
const commands=[],log=stage+'/STOCK_IMPORT.log',fd=fs.openSync(log,'wx');
function run(args){const start=Date.now(),r=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,VM_ATLAS_SOURCE_REPO:prep.atlas,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'}});commands.push({args,code:r.status,signal:r.signal,durationMs:Date.now()-start});assert.equal(r.status,0,args[0]);}
try{
 assert(!fs.existsSync(site+'/atlas-review'));run(['scripts/import-clinical-review.mjs',prep.atlas]);
 run(['scripts/atlas-model-inventory.mjs']);const inventory=json(site+'/lib/atlas-model-inventory.json'),before=json(prep.original+'/lib/atlas-model-inventory.json');assert.deepEqual(inventory.models,before.models);assert.equal(inventory.models.length,137);
 for(const item of inventory.sources)assert.equal(item.sourceCommit,source);
 run(['scripts/check-anatomy-coverage.mjs','--source-root',prep.atlas,'--check']);
 const review=json(site+'/atlas-review/manifest.json'),snapshot=json(site+'/docs/anatomy-coverage/index.json');assert.equal(review.revision,source);assert.equal(snapshot.sourceRevision,source);
 const imports=Object.keys(snapshot.evidence.sourceInputs).sort().flatMap(p=>{const f=review.files.find(r=>r.path===p);return f?[{path:p,sourceSha256:f.sourceSha256,importedSha256:f.importedSha256}]:[];});assert.equal(imports.length,142);
 for(const p of Object.keys(snapshot.evidence.sourceInputs)){const f=review.files.find(r=>r.path===p);if(f)assert.equal(f.sourceSha256,snapshot.evidence.sourceInputs[p]);}
 const pinPlan={coverageSource:source,coverageSnapshot:sha(JSON.stringify(snapshot)),coverageImported:sha(JSON.stringify(imports)),coveragePackage:snapshot.evidence.sourceInputs['package.json'],privateModelInventory:sha(read(site+'/lib/atlas-model-inventory.json')),importedRows:imports.length,metadataRows:168-imports.length,sourceFiles:review.files.length};
 fs.writeFileSync(stage+'/NATIVE_PIN_PLAN.json',JSON.stringify(pinPlan,null,2)+'\n',{flag:'wx'});
 for(const row of json(stage+'/ORIGINAL_485_INPUTS.json'))assert.equal(sha(read(prep.original+'/'+row.path)),row.sha256,'Closed485unchanged:'+row.path);
 assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),source);assert.equal(runGit(['-C',prep.atlas,'status','--porcelain=v1','--untracked-files=all']).toString().trim(),'');
 fs.closeSync(fd);fs.writeFileSync(stage+'/STOCK_IMPORT.json',JSON.stringify({commands,source,copiedCoverage:copied,log,logSha256:sha(read(log)),pinPlan,all137ModelsUnchanged:true,original485Unchanged:true,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(pinPlan));
}catch(error){fs.closeSync(fd);fs.writeFileSync(stage+'/STOCK_IMPORT_FAILURE.json',JSON.stringify({commands,error:String(error),log,logSha256:sha(read(log)),canonicalInstalled:false},null,2)+'\n',{flag:'wx'});throw error;}
