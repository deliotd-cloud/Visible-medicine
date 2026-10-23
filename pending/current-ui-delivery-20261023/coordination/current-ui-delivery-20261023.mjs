// Main-owned test-delivery successor. No runtime installation or access grant.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const parentReceipt='F:/VisibleMedicine/staging/20261023-review-bound-ui-website/SOURCE_BOUND.json';
const root='F:/VisibleMedicine/staging/20261023-current-ui-delivery',site=root+'/website';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(read(parentReceipt)),'b7e4b807f9323b864ca67bbf2148a6213c94e454a0e727dc7cbe92f5b23efecf');
const source=json(parentReceipt),phase=process.argv[2];
const slab=Buffer.alloc(65536);function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const git=(repo,...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',windowsHide:true}).trim();
function checkNative(){assert.equal(git(source.atlas,'rev-parse','HEAD'),source.atlasHead);assert.equal(git(source.atlas,'rev-parse','HEAD^{tree}'),source.atlasTree);assert.equal(git(source.atlas,'status','--porcelain'),'');}
if(phase==='prepare'){
  assert(!fs.existsSync(root));fs.mkdirSync(root);checkNative();
  git('F:/VisibleMedicine/website','clone','--shared','--no-checkout','F:/VisibleMedicine/website',site);git(site,'read-tree','HEAD');
  for(const row of source.sourceRows){const from=source.website+'/'+row.path;assert.equal(hash(from),row.sha256);const target=containedTarget(site,row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(from,target,fs.constants.COPYFILE_EXCL);assert.equal(hash(target),row.sha256);}
  fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');fs.symlinkSync(source.atlas,root+'/atlas','junction');
  for(const file of ['tests/current-atlas-delivery.test.mjs','tests/current-atlas-delivery.mjs','tests/fixtures/current-atlas-delivery.json'])fs.writeFileSync(root+'/'+file.replaceAll('/','__')+'.before.raw',read(site+'/'+file),{flag:'wx'});
  write(root+'/PREPARATION.json',{at:new Date().toISOString(),parentReceipt,parentReceiptSha256:sha(read(parentReceipt)),website:site,sourcePaths:source.sourcePaths,atlas:source.atlas,atlasHead:source.atlasHead,atlasTree:source.atlasTree,previewChanged:false,installed:false});
  console.log(JSON.stringify({phase,sourcePaths:source.sourcePaths,receipt:root+'/PREPARATION.json',previewChanged:false}));
}else if(phase==='capture'){
  assert(!fs.existsSync(root+'/CAPTURE.json'));checkNative();
  // The sealed complete delivery must still exist before deriving its test pin.
  for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
  const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
  const names=['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',...modules.flatMap(n=>['manifest.json','source-inputs.json'].map(f=>'public/atlas-runtime/'+n+'/'+f))];
  const docs=Object.fromEntries(names.map(p=>[p,sha(read(site+'/'+p))]));
  const review=json(site+'/atlas-review/manifest.json'),inputs=json(site+'/atlas-review/integration-inputs.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
  assert.equal(review.revision,source.atlasHead);assert.equal(review.files.length,1567);assert.equal(inputs.inputs.length,1734);assert.equal(sha(JSON.stringify(inputs.inputs)),inputs.sha256);assert.equal(viewer.websiteIntegrationSha256,inputs.sha256);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
  const runtimeSources=Object.fromEntries(modules.map(n=>[n,json(site+'/public/atlas-runtime/'+n+'/manifest.json').sourceCommit]));
  assert.equal(runtimeSources['head-neck'],source.atlasHead);assert.equal(runtimeSources.shoulder,source.atlasHead);
  for(const n of ['lower-limb','female-pelvis'])assert.equal(runtimeSources[n],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  const pin={schema:'vm-current-atlas-test-delivery-2',source:source.atlasHead,sourceTree:source.atlasTree,runtimeSources,reviewIntegration:inputs.sha256,reviewSourceFiles:review.files.length,viewerFiles:viewer.files.length,viewerPackages:viewer.packages.length,documents:docs};
  const file='tests/fixtures/current-atlas-delivery.json',old=json(site+'/'+file);assert.equal(old.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
  const history=site+'/tests/fixtures/current-ui-delivery-before-9e14';assert(!fs.existsSync(history));fs.mkdirSync(history);
  for(const [from,to]of [['tests__fixtures__current-atlas-delivery.json.before.raw','pin.json.raw'],['tests__current-atlas-delivery.test.mjs.before.raw','contract.test.mjs.raw'],['tests__current-atlas-delivery.mjs.before.raw','validator.mjs.raw']])fs.copyFileSync(root+'/'+from,history+'/'+to,fs.constants.COPYFILE_EXCL);
  fs.writeFileSync(site+'/'+file,JSON.stringify(pin,null,2)+'\n');
  write(root+'/CAPTURE.json',{at:new Date().toISOString(),parentReceipt,parentReceiptSha256:sha(read(parentReceipt)),fixture:file,previousSha256:sha(read(root+'/tests__fixtures__current-atlas-delivery.json.before.raw')),sha256:sha(read(site+'/'+file)),pin,priorFixturePreserved:true,completeSealedDeliveryVerifiedBeforeCapture:true,permissionOrClinicalOrReleaseApprovalSupplied:false,previewChanged:false,installed:false});
  console.log(JSON.stringify({phase,fixtureSha256:sha(read(site+'/'+file)),source:pin.source,runtimeSources,sourceFiles:pin.reviewSourceFiles,inputs:inputs.inputs.length}));
}else{
  const specs={
    stale:{args:['--max-old-space-size=128','--test','tests/current-atlas-delivery.test.mjs'],expected:1},
    current:{args:['--max-old-space-size=128','--test','tests/current-atlas-delivery.test.mjs'],expected:0},
    transition:{args:['--max-old-space-size=128','--test','tests/current-ui-delivery-transition.test.mjs'],expected:0},
    'lecture-stale':{args:['--max-old-space-size=128','scripts/lecture-body-catalog.mjs','--check'],expected:1},
    'lecture-generate':{args:['--max-old-space-size=128','scripts/lecture-body-catalog.mjs'],expected:0},
    'lecture-check':{args:['--max-old-space-size=128','scripts/lecture-body-catalog.mjs','--check'],expected:0},
    'lecture-tests':{args:['--max-old-space-size=128','--test','--test-concurrency=1',...['reference','content','integration','related','ui','preservation','loader-preservation'].map(n=>'tests/lecture-body-'+n+'.test.mjs')],expected:0},
    prebuild:{args:['--max-old-space-size=128',path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'run','prebuild'],expected:0},
    build:{args:['--max-old-space-size=384','node_modules/vinext/dist/cli.js','build'],expected:0},
  },spec=specs[phase];assert(spec,'Unknown phase');
  const dir=root+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
  if(phase==='lecture-generate')fs.writeFileSync(root+'/lecture-body-catalog.before.json.raw',read(site+'/lib/lecture-body-catalog.json'),{flag:'wx'});
  if(phase==='build')assert(!fs.existsSync(site+'/dist'),'Fresh build output required');
  const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');
  const start={at:new Date().toISOString(),command:[process.execPath,...spec.args],cwd:site,phase,expectedExit:spec.expected};write(dir+'/STARTED.json',start);
  const r=spawnSync(process.execPath,spec.args,{cwd:site,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+(phase==='build'?384:128),VM_ATLAS_SOURCE_REPO:source.atlas,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',out,err],windowsHide:true});fs.closeSync(out);fs.closeSync(err);
  write(dir+'/TERMINAL.json',{...start,finished:new Date().toISOString(),exit:r.status,signal:r.signal,error:r.error?String(r.error):null,stdoutSha256:sha(read(dir+'/stdout.log')),stderrSha256:sha(read(dir+'/stderr.log')),previewChanged:false,installed:false});
  if(phase==='stale')assert.match(read(dir+'/stdout.log').toString(),/Current delivery changed/);
  if(phase==='lecture-stale')assert.match(read(dir+'/stderr.log').toString(),/Generated body catalogue is stale/);
  console.log(JSON.stringify({phase,exit:r.status,expected:spec.expected,receipt:dir+'/TERMINAL.json'}));assert.equal(r.status,spec.expected);
}
