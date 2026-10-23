// Source-only, thin UI copy candidate. No generated module edits or live cutover.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='F:/VisibleMedicine/staging/20261023-modality-help-clarity',site=root+'/website';
const sourceReceipt='F:/VisibleMedicine/staging/20261023-current-ui-delivery/SOURCE_CURRENT.json';
const read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(read(sourceReceipt)),'bd073fb1d6134af415e8b77f82ba218a1756e47af2c2ab503459e711ea8a6cc8');
const source=JSON.parse(read(sourceReceipt)),phase=process.argv[2];
const files=['components/AtlasWorkspaceNavigation.tsx','components/AtlasRegionNavigation.tsx','tests/atlas-workspace-simplification.test.ts'];
if(phase==='prepare'){
  assert(!fs.existsSync(root));fs.mkdirSync(root);
  for(const p of files){const row=source.sourceRows.find(r=>r.path===p);assert(row);assert.equal(sha(read(source.website+'/'+p)),row.sha256);fs.mkdirSync(path.dirname(site+'/'+p),{recursive:true});fs.copyFileSync(source.website+'/'+p,site+'/'+p,fs.constants.COPYFILE_EXCL);fs.writeFileSync(root+'/'+p.replaceAll('/','__')+'.before.raw',read(site+'/'+p),{flag:'wx'});}
  for(const[name,target]of [['lib',source.website+'/lib'],['node_modules','F:/VisibleMedicine/website/node_modules']])fs.symlinkSync(target,site+'/'+name,'junction');
  fs.copyFileSync(source.website+'/package.json',site+'/package.json',fs.constants.COPYFILE_EXCL);
  fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),website:site,sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),files:files.map(p=>({path:p,sha256:sha(read(site+'/'+p))})),unchangedLibraryReadThrough:source.website+'/lib',previewChanged:false,installed:false},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({phase,root,files:files.length}));
}else{
  assert(['red','green'].includes(phase));const dir=root+'/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir);
  const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');
  const args=['--max-old-space-size=128','--experimental-strip-types','--test','tests/atlas-workspace-simplification.test.ts'];
  const start={at:new Date().toISOString(),phase,command:[process.execPath,...args],cwd:site,expectedExit:phase==='red'?1:0};fs.writeFileSync(dir+'/STARTED.json',JSON.stringify(start,null,2)+'\n',{flag:'wx'});
  const r=spawnSync(process.execPath,args,{cwd:site,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=128',RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',out,err],windowsHide:true});fs.closeSync(out);fs.closeSync(err);
  fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify({...start,finished:new Date().toISOString(),exit:r.status,signal:r.signal,error:r.error?String(r.error):null,stdoutSha256:sha(read(dir+'/stdout.log')),stderrSha256:sha(read(dir+'/stderr.log'))},null,2)+'\n',{flag:'wx'});
  if(phase==='red')assert.match(read(dir+'/stdout.log').toString(),/one closed native disclosure/);
  console.log(JSON.stringify({phase,exit:r.status,expected:start.expectedExit,receipt:dir+'/TERMINAL.json'}));assert.equal(r.status,start.expectedExit);
}
