// Main-owned contained source fixture and one bounded real catalogue feature root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261023-regional-reference-current-role',site=root+'/website';
const receipt='F:/VisibleMedicine/staging/20261023-release-epoch-successor/SOURCE.json';
assert.equal(sha(read(receipt)),'0dd282c43570998f10d8497fd32f6bcca12ea122f81aec8efd8cdc06379a1512');
const source=json(receipt),target='tests/regional-reference-review-index.test.ts';
if(process.argv.includes('--prepare')){
 assert(!fs.existsSync(root));fs.mkdirSync(root);
 const selected=source.sourceRows.filter(r=>/^(?:tests|lib|atlas-review)\//.test(r.path)||['package.json','AGENTS.md','public/atlas-review-viewer/manifest.json'].includes(r.path)||/^public\/atlas-runtime\/[^/]+\/(?:manifest|source-inputs)\.json$/.test(r.path));
 for(const row of selected){assert(!/\.(?:glb|dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path));const bytes=read(source.website+'/'+row.path);assert.equal(sha(bytes),row.sha256,row.path);const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes,{flag:'wx'});}
 fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
 fs.copyFileSync(site+'/'+target,root+'/regional-reference-review-index.before.test.ts.raw',fs.constants.COPYFILE_EXCL);
 const prep={at:new Date().toISOString(),website:site,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),nativeAtlas:source.atlas,nativeRevision:source.atlasHead,nativeTree:source.atlasTree,selectedInputs:selected,originalTarget:target,originalSha256:sha(read(site+'/'+target)),scope:'Exact source/metadata-only catalogue feature harness, no model binaries, imaging pixels, host Website or runtime rendering. Runs the actual unchanged production catalogue and Review-index builders on synthetic knee metadata. No production or source-pin change, normal preview, approval or registration.'};
 fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PREPARATION.json',selectedPaths:selected.length,sourceOnly:true,previewChanged:false}));
}else if(process.argv.includes('--admit-closed56')){
 const from='F:/VisibleMedicine/staging/20261023-closed56-current-role';
 assert.equal(sha(read(from+'/focused.tap')),'407d89382690936dcbf04752895ab44df91739e2f2762b3767c2a689497d78bb');
 assert.equal(sha(read(from+'/regression.tap')),'8f96dd80a4b9fb691a283b6fe629eb2fdd88450d127dce1bc3f5a7cc364f0281');
 const names=['tests/closed56-family-source-inverse.mjs','tests/closed56-current-role.test.mjs','tests/fixtures/closed56-family-source-inverse-before-current.mjs.raw','tests/fixtures/closed56-femoral-epoch-current-2381.mjs.raw'];
 const helper=read(from+'/'+names[0]),before=read(site+'/'+names[0]);assert.equal(sha(helper),'3220ab5b39e7b2cc59e02288dbacba1be8f1f734653bd78908e11352fe7d07c3');
 assert.equal(sha(before),source.sourceRows.find(r=>r.path===names[0]).sha256);assert.deepEqual(read(from+'/'+names[2]),before);
 const oldText=before.toString(),afterText=helper.toString(),start=oldText.indexOf(' const after='),end=oldText.indexOf(" assert(!prior.includes('familyRefusal')",start),a=afterText.indexOf(' const currentRole=['),b=afterText.indexOf(" assert(!prior.includes('familyRefusal')",a);
 assert(start>0&&end>start&&a>0&&b>a);assert.equal(sha(afterText.slice(a,b)),'9f638639248463236e2dd34dc876080058f8683c44a0e102fbc9a9861a45fa0c');
 assert.deepEqual(Buffer.from(afterText.slice(0,a)+oldText.slice(start,end)+afterText.slice(b)),before,'Complete original helper preserved');
 const femoral=read(site+'/tests/closed56-femoral-epoch.test.mjs').toString().replaceAll('\r\n','\n');assert.equal(sha(femoral),'d15ee270c69672f141592ab25b9ce48e1cd4fa969b31177e3d8c047a2ced92f7');assert.equal(read(from+'/'+names[3]).toString().replaceAll('\r\n','\n'),femoral);
 const rows=[];for(const name of names){const data=read(from+'/'+name),dest=site+'/'+name;if(name!==names[0])assert(!fs.existsSync(dest));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(from+'/'+name,dest);rows.push({path:name,bytes:data.length,sha256:sha(data)});}
 for(const name of ['tests/closed56-whole-role-transition-20261021.test.mjs','tests/closed57-original-tests.test.mjs'])assert.equal(sha(read(site+'/'+name)),source.sourceRows.find(r=>r.path===name).sha256,'Original consumer unchanged: '+name);
 fs.writeFileSync(root+'/CLOSED56_ADMISSION.json',JSON.stringify({at:new Date().toISOString(),source:from,rows,completeOriginalHelperInverse:true,originalConsumerFilesUnchanged:2,workerEvidence:'Eight focused cases used a stage-only import redirect; main will run both unchanged original consumers with the helper actually installed here.',previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({admitted:rows.length,originalConsumersUntouched:2,previewChanged:false}));
}else{
 const baseline=process.argv.includes('--baseline')||process.argv.includes('--disk-baseline'),support=process.argv.includes('--support'),name=support?'support':process.argv.includes('--disk-baseline')?'disk-baseline':baseline?'baseline':'candidate';
 const env=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree});Object.assign(env,{NODE_OPTIONS:'--max-old-space-size=128',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'});
 env.VM_CLOSED56_SOURCE_ROOT=site;
 const targets=support?['tests/disk-catalogue-test-loader.test.mjs','tests/closed56-whole-role-transition-20261021.test.mjs','tests/closed57-original-tests.test.mjs','tests/closed56-current-role.test.mjs']:[target];
 const args=['--max-old-space-size=128','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',...targets];
 const result=spawnSync(process.execPath,args,{cwd:site,env,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});
 const log=(result.stdout??'')+(result.stderr??'');fs.writeFileSync(root+'/'+name+'.tap',log,{flag:'wx'});
 const counts=Object.fromEntries([...log.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],+m[2]]));
 const outcome={at:new Date().toISOString(),args,exitCode:result.status,signal:result.signal,error:result.error?.message,heapMiB:128,counts,log:root+'/'+name+'.tap',logSha256:sha(read(root+'/'+name+'.tap')),sourceReceiptSha256:sha(read(receipt)),targetSha256:sha(read(site+'/'+target)),resourceFailure:/heap out of memory|Reached heap limit|not enough memory/i.test(log),containedFeatureOnly:true,previewChanged:false,installed:false,wholeSuitePassing:false};
 fs.writeFileSync(root+'/'+name+'.json',JSON.stringify(outcome,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(outcome));
 assert.equal(result.error,undefined);assert.equal(outcome.resourceFailure,false,'Retain resource refusal without increasing heap or retrying');
 assert.equal(result.status,baseline?1:0,log);assert.equal(counts.fail,baseline?1:0);assert.equal(counts.skipped,0);assert.equal(counts.cancelled,0);
 if(baseline){assert(log.includes('canonical catalogue yields all 35 exact public draft links'));assert(log.includes('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'));}
}
