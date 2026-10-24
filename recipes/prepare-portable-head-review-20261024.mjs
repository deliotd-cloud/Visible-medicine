// Finite physical test surface: exact frozen legacy graph beside unfiltered current tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const stage='F:/VisibleMedicine/staging/20261024-head-review-portable-main-v2',root=stage+'/candidate';
const worker='F:/VisibleMedicine/staging/20261024-head-review-legacy-fixture-snapshot/candidate/tests/fixtures/head-review-before-guided';
const fixture=root+'/tests/fixtures/head-review-before-guided';
const site='F:/VisibleMedicine/staging/20261024-coherent-harness-website/website';
const prep=site+'/../PREPARATION.json',prepHash='1cbbdc7afc84674eef4288504865fa08e6e40570c0c39b379c201e4a52ac285b';
const read=file=>fs.readFileSync(file),json=file=>JSON.parse(read(file)),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pin=file=>({path:file,bytes:fs.statSync(file).size,sha256:sha(read(file))});
const save=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
function copy(from,to){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),sha(read(from)));}
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
assert(memory.AvailableMBytes>=1024&&memory.PercentCommittedBytesInUse<=90,'Finite TS/React surface preparation admission');
assert(!fs.existsSync(stage+'/PREPARATION.json'));assert(!fs.existsSync(stage+'/STARTED.json'));save(stage+'/STARTED.json',{at:new Date().toISOString(),memory,minimumMiB:1024,scope:'Finite source mirror; no full Website snapshot or application build'});
try{
  assert.equal(sha(read(prep)),prepHash);const currentRows=new Map(json(prep).sourceRows.map(row=>[row.path,row]));
  const beforeReceipt='F:/VisibleMedicine/staging/20261024-practice-actions-website/SOURCE_BOUND.json';
  assert.equal(sha(read(beforeReceipt)),'dc0532736094fcd7225e1229af3a41322aacc591789bf1179c44476b98b7077e');
  const before=json(beforeReceipt),beforeRows=new Map(before.sourceRows.map(row=>[row.path,row]));
  const manifestBytes=read(worker+'/manifest.json');assert.equal(sha(manifestBytes),'c6880b41ec988457d6113cca19d52f4948a404e1334ef03f034a6758b8d9896e');
  const manifest=JSON.parse(manifestBytes);assert.equal(manifest.sourceRows.length,17);assert.equal(manifest.modulePaths.length,16);
  for(const row of manifest.sourceRows){
    const original=beforeRows.get(row.path);assert.equal(original?.sha256,row.sha256);assert.equal(original.bytes,row.bytes);
    const bytes=read(worker+'/'+row.fixture);assert.equal(sha(bytes),row.sha256);assert.equal(bytes.length,row.bytes);
    assert.deepEqual(bytes,read(before.website+'/'+row.path));copy(worker+'/'+row.fixture,fixture+'/'+row.fixture);
  }
  copy(worker+'/manifest.json',fixture+'/manifest.json');
  const preimages=[];
  for(const relative of ['tests/head-mri-comparison-page.test.ts','tests/head-guided-review-page-history.test.mjs']){
    const before=site+'/'+relative;assert.equal(sha(read(before)),currentRows.get(relative)?.sha256);
    copy(before,stage+'/preimage/'+relative+'.raw');
    preimages.push({path:relative,original:pin(stage+'/preimage/'+relative+'.raw'),candidate:pin(root+'/'+relative),
      restore:'Restore the whole original only while the exact controller digest still matches; original14-case bytes are also immutable in the fixture and execute unchanged.'});
  }
  assert.equal(preimages[0].original.sha256,'4ec8991cd826c4b614b780607b74584c4bd8bec2544782c02c31944c79351363');
  const currentTest='tests/head-guided-review-current-page.test.ts',page='app/workspace/atlas-review/head-learning/page.tsx';
  const currentSource=read(site+'/'+currentTest).toString();
  const currentLibs=new Set([...manifest.modulePaths.filter(name=>name.startsWith('lib/')),
    ...[...currentSource.matchAll(/from ['"]\.\.\/(lib\/[^'"]+)['"]/g)].map(match=>match[1])]);
  // Close the current pure graph as well: inline `import {type ...}` may
  // retain an empty side-effect import under native Node stripping.
  for(const relative of currentLibs){
    assert(currentLibs.size<=64,'Bounded head-only pure closure');
    assert(/^lib\/head-[A-Za-z0-9_.-]+\.(?:ts|mjs|json)$/.test(relative),'No broad application graph');
    const row=currentRows.get(relative);assert(row);assert(row.bytes<256*1024);assert.equal(sha(read(site+'/'+relative)),row.sha256);
    if(relative.endsWith('.json'))continue;
    const source=read(site+'/'+relative).toString();
    for(const match of source.matchAll(/^(?:import|export)(?!\s+type\b).*?from ['"](\.[^'"]+)['"]/gm)){
      const stem=path.posix.normalize(path.posix.join(path.posix.dirname(relative),match[1]));
      const resolved=[stem,stem+'.ts',stem+'.mjs',stem+'.json'].find(name=>currentRows.has(name));
      assert(resolved,'Unbound current pure import: '+stem);currentLibs.add(resolved);
    }
  }
  const currentInputs=[];
  for(const relative of [currentTest,page,'package.json',...currentLibs]){
    const row=currentRows.get(relative);assert(row,'Exact current fixture input: '+relative);assert.equal(sha(read(site+'/'+relative)),row.sha256);
    copy(site+'/'+relative,root+'/'+relative);currentInputs.push(row);
  }
  fs.symlinkSync(site+'/node_modules',root+'/node_modules','junction');
  const files=[];
  function inventory(directory,prefix=''){
    for(const item of fs.readdirSync(directory,{withFileTypes:true})){
      if(item.name==='node_modules'){assert(item.isSymbolicLink());continue;}
      const relative=prefix+item.name;assert(!item.isSymbolicLink(),'Only the explicit locked dependency junction');
      if(item.isDirectory())inventory(directory+'/'+item.name,relative+'/');
      else files.push({path:relative,bytes:fs.statSync(directory+'/'+item.name).size,sha256:sha(read(directory+'/'+item.name))});
    }
  }
  inventory(root);assert(files.reduce((sum,row)=>sum+row.bytes,0)<5*1024*1024,'Finite surface only');
  save(stage+'/PREPARATION.json',{schema:'vm-portable-head-review-test-surface/1',at:new Date().toISOString(),root,files:files.sort((a,b)=>a.path.localeCompare(b.path)),
    beforeReceipt:pin(beforeReceipt),coherentPreparation:pin(prep),manifestSha256:sha(manifestBytes),preimages,currentInputs,
    proofOfOldEvaluatedClosure:pin('F:/VisibleMedicine/staging/20261024-head-review-historical-closure/TERMINAL.json'),
    frozenCases:14,currentCases:13,controls:4,fullOriginalFrozenTestSha256:preimages[0].original.sha256,
    fixturesContainDataOrModels:false,scope:'Exact before Page/original test/actually evaluated pure graph; mocked page components, not an old real app. Current13 scenarios remain whole and unfiltered.',
    previewChanged:false,installed:false,fullWebsiteAccepted:false});
  console.log(JSON.stringify({stage,files:files.length,bytes:files.reduce((sum,row)=>sum+row.bytes,0),preparationSha256:sha(read(stage+'/PREPARATION.json'))}));
}catch(error){save(stage+'/FAILURE.json',{at:new Date().toISOString(),message:error.message,stack:error.stack,accepted:false});throw error;}
