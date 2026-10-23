import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-loader-preservation',site=root+'/website';
const receipt='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/SOURCE.json';
assert.equal(sha(read(receipt)),'65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522');
const source=json(receipt);
if(process.argv.includes('--prepare')){
 assert(!fs.existsSync(root));fs.mkdirSync(root);
 const names=['package.json','AGENTS.md','tests/atlas-learning-loader-preservation.test.mjs','tests/learning-frame-loader-transition.mjs','tests/extra-expansion-adoption-source-proof.mjs','tests/extra-expansion-adoption.test.mjs','tests/atlas-runtime-expansion-loader.mjs','tests/atlas-nonhead-comparison-ui.test.mjs','tests/atlas-shoulder-navigation-current.test.mjs','tests/nonhead-frame-migration.test.mjs','tests/fixtures/live-learning-original-nonhead-test.mjs.raw','tests/fixtures/live-learning-original-nonhead-migration.mjs.raw','tests/fixtures/nonhead-frame-migration/original.json',...['atlas-nonhead-comparison-ui.test.mjs','atlas-shoulder-navigation-current.test.mjs','nonhead-frame-migration.test.mjs'].map(p=>'tests/preimages/'+p+'.before-extra-expansion.raw')];
 const selected=names.map(name=>{const r=source.sourceRows.find(r=>r.path===name);assert(r,name);const b=read(source.website+'/'+name);assert.equal(sha(b),r.sha256,name);const dest=site+'/'+name;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b,{flag:'wx'});return r;});
 fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
 const original='tests/atlas-learning-loader-preservation.test.mjs',archive='tests/fixtures/learning-loader-preservation-before-expansion.test.mjs.raw';
 fs.writeFileSync(site+'/'+archive,read(site+'/'+original),{flag:'wx'});
 const prep={at:new Date().toISOString(),website:site,frozenWebsite:source.website,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),selectedInputs:selected,original,archive,originalSha256:sha(read(site+'/'+original)),scope:'Pure source-text preservation tests only. No components/models rendered, no production source, permission, runtime or preview edit.'};
 fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PREPARATION.json',sha256:sha(read(root+'/PREPARATION.json')),originalSha256:prep.originalSha256,selectedPaths:selected.length}));
}else{
 const before=process.argv.includes('--baseline'),args=['--test','--test-reporter=tap','--test-concurrency=1','tests/atlas-learning-loader-preservation.test.mjs','tests/extra-expansion-adoption.test.mjs',...(before?[]:['tests/learning-loader-preservation-composition.test.mjs'])];
 const r=spawnSync(process.execPath,args,{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=128',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'}});
 const log=(r.stdout??'')+(r.stderr??''),name=before?'baseline-red':'candidate-green';fs.writeFileSync(root+'/'+name+'.tap',log,{flag:'wx'});assert.equal(r.error,undefined);assert.equal(r.status,before?1:0,log);
 const pass=Number(log.match(/^# pass (\d+)/m)?.[1]),fail=Number(log.match(/^# fail (\d+)/m)?.[1]);assert.equal(fail,before?3:0);assert.equal(pass,before?4:9);assert.equal(Number(log.match(/^# skipped (\d+)/m)?.[1]),0);
 const report={at:new Date().toISOString(),args,exitCode:r.status,pass,fail,expectedBaselineFailure:before,heapMiB:128,log:root+'/'+name+'.tap',sha256:sha(read(root+'/'+name+'.tap')),sourceOnlyNotViewerAcceptance:true,previewChanged:false};
 fs.writeFileSync(root+'/'+name+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
}
