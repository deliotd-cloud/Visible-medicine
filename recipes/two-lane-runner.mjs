// Proposal only. Run after main installs the current test and seals a successor receipt.
// node two-lane-runner.mjs <successor-receipt> <receipt-sha256> <new-evidence-directory>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,relative as pathRelative} from 'node:path';
import {pathToFileURL} from 'node:url';
const {guarded}=await import(pathToFileURL('C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-small-native-task-guarded-20261025.mjs'));

const historicalPath='F:/VisibleMedicine/staging/20261025-guided-comparison-title-website/SOURCE_CANDIDATE.json';
const historicalSha='7cc6069153af7e9d439296549df2d21da343d9545327d4ab77ce9398b6e950e2';
const samePath='F:/VisibleMedicine/staging/20261025-nasal-bone-website/SOURCE_CANDIDATE.json';
const sameSha='dac446fa73f452af6b073409af5908e7c8d1b7ad5ec42c7269937b39b23803d7';
const accessPath='F:/VisibleMedicine/staging/20261025-compact-access-website/SOURCE_CANDIDATE.json';
const accessSha='78fb4e35a0c9a20347232edfd881f4aeb19ad280fe0d1c6523e699c3496876c1';
const historicalRootSha='6e1ba842cb4d2fdf2370c12df9ccbb1a42785369d7e042db6ed3b67048e99275';
const historicalPinSha='295bc97ae6c860708bc8b43bbd416c2c00507b03612948e914a820c572cb88ce';
const currentTestProposal='F:/VisibleMedicine/staging/20261025-current-delivery-epoch-review/current-binding-contract.test.mjs';
const currentTestSha='dd37bd580970921b1a81f3584dcf06b69cc6ffcd05f50ab794ab380c33ad7af0';
const archive='tests/fixtures/current-atlas-delivery-27b-45.mjs.raw';
const rootTest='tests/current-atlas-delivery.test.mjs';
const pinPath='tests/fixtures/current-atlas-delivery.json';
const [currentPath,currentSha,evidence,mode,laneName]=process.argv.slice(2);
assert(currentPath&&/^[a-f0-9]{64}$/.test(currentSha??'')&&evidence?.startsWith('F:/VisibleMedicine/staging/'));
assert(!/\s/.test(currentPath+evidence),'Guard command paths must contain no spaces');
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const save=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const sealed=(file,digest)=>{assert.equal(hash(file),digest,`Receipt changed: ${file}`);return json(file);};
const current=sealed(currentPath,currentSha),historical=sealed(historicalPath,historicalSha);
const row=(receipt,path)=>{const matches=receipt.sourceRows.filter(r=>r.path===path);assert.equal(matches.length,1,`One source row: ${path}`);return matches[0];};
const fileAt=(receipt,path)=>{
  assert(typeof path==='string'&&!path.includes('\\'),'Unsafe source path');
  const parts=path.split('/');
  assert(parts.every(part=>part&&part!=='.'&&part!=='..'&&
    (/^[A-Za-z0-9_.-]+$/.test(part)||/^\[(?:[A-Za-z_][A-Za-z0-9_]*|\.\.\.[A-Za-z_][A-Za-z0-9_]*)\]$/.test(part))),
    'Unsafe source path');
  const site=resolve(receipt.website),file=resolve(site,...parts),within=pathRelative(site,file);
  assert(within&&within!=='..'&&!within.startsWith('..\\')&&!within.startsWith('../')&&!/^[A-Za-z]:/.test(within),'Source escapes Website');
  let step=site;
  for(const part of parts){step=resolve(step,part);assert(!fs.lstatSync(step).isSymbolicLink(),`Symlink source path: ${step}`);}
  assert(fs.lstatSync(file).isFile(),file);return file;
};
function verifyReceipt(receipt,path,digest){
  assert.equal(hash(path),digest,'Receipt bytes');
  const expectedSite=path===historicalPath?'F:/VisibleMedicine/staging/20261025-guided-comparison-title-website/website':
    path===samePath?'F:/VisibleMedicine/staging/20261025-nasal-bone-website/website':
    path===accessPath?'F:/VisibleMedicine/staging/20261025-compact-access-website/website':current.website;
  assert.equal(resolve(receipt.website),resolve(expectedSite));
  for(const source of receipt.sourceRows){
    const file=fileAt(receipt,source.path),stat=fs.statSync(file);
    assert.equal(stat.size,source.bytes,source.path);assert.equal(hash(file),source.sha256,source.path);
  }
  for(const dep of receipt.dependencies??[]){assert.equal(hash(dep.file),dep.sha256,dep.file);assert.equal(hash(dep.entry),dep.entrySha256,dep.entry);}
}
function verifyNative(receipt,head,tree){
  const git=(...args)=>execFileSync('git',['-C',receipt.atlas,...args],{encoding:'utf8',env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},windowsHide:true}).trim();
  assert.equal(receipt.atlasHead,head);assert.equal(receipt.atlasTree,tree);
  assert.equal(git('rev-parse','HEAD'),head);assert.equal(git('rev-parse','HEAD^{tree}'),tree);
  assert.equal(git('status','--porcelain=v1'),'',`Native checkout must be clean: ${receipt.atlas}`);
}
function verify(){
  verifyReceipt(historical,historicalPath,historicalSha);
  verifyReceipt(current,currentPath,currentSha);
  verifyNative(historical,'27b341001718b7d5bb4f45aad0c8d8784e287c3b','32d418c517d3959089d443e2d374e362dc723157');
  verifyNative(current,'7e2552a300df29faf346be146929ffc727880ec5','c756d5a038cca7d8fac429b908925c63915dc519');
  assert.equal(hash(fileAt(historical,rootTest)),historicalRootSha);
  assert.equal(row(historical,rootTest).sha256,historicalRootSha);
  assert.equal(hash(fileAt(historical,pinPath)),historicalPinSha);
  assert.equal(row(historical,pinPath).sha256,historicalPinSha);
  assert.equal(hash(currentTestProposal),currentTestSha,'Staged current proposal changed');
  const expectedCurrentTest=currentTestSha;
  assert.equal(hash(fileAt(current,rootTest)),expectedCurrentTest,'Installed current whole root');
  assert.equal(row(current,rootTest).sha256,expectedCurrentTest);
  assert.equal(hash(fileAt(current,archive)),historicalRootSha,'Archived historical whole root');
  assert.equal(row(current,archive).sha256,historicalRootSha);
  const pin=json(fileAt(current,pinPath));
  assert.equal(pin.source,current.atlasHead);assert.equal(pin.sourceTree,current.atlasTree);
  assert.equal(row(current,pinPath).sha256,hash(fileAt(current,pinPath)));
  assert.equal(current.reviewSourceFiles,1614);assert.equal(current.protectedReviewInputs,1818);
  // Historical receipt uses protectedReviewInputsUnchanged and has no Review count field.
  // Count the real manifest/binding whose exact bytes were authenticated above.
  assert.equal(json(fileAt(historical,'atlas-review/manifest.json')).files.length,1612);
  assert.equal(json(fileAt(historical,'atlas-review/integration-inputs.json')).inputs.length,1816);
  assert.equal(historical.protectedReviewInputsUnchanged,1816);
  // Exactly the three reviewed paths are admitted; 78fb is a test-only parent.
  let parent;
  if(current.parentSha256===accessSha){
    assert.equal(resolve(current.parent),resolve(accessPath));
    parent=sealed(accessPath,accessSha);
    verifyReceipt(parent,accessPath,accessSha);
    assert.equal(parent.atlasHead,current.atlasHead);
    assert.equal(parent.atlasTree,current.atlasTree);
    assert.equal(parent.parentSha256,sameSha);
    assert.equal(resolve(parent.parent),resolve(samePath));
    // The successor may replace the whole root and add its exact archive only.
    assert.notEqual(resolve(current.website),resolve(parent.website));
    assert.equal(resolve(current.atlas),resolve(parent.atlas));
    assert.equal(current.sourceRows.length,parent.sourceRows.length+1);
    for(const old of parent.sourceRows){
      if(old.path===rootTest)continue;
      assert.deepEqual(row(current,old.path),old,`Unchanged parent source row: ${old.path}`);
    }
    assert.equal(row(parent,rootTest).sha256,historicalRootSha);
    assert.equal(row(current,archive).sha256,historicalRootSha);
  }else if(current.parentSha256===sameSha){
    assert.equal(resolve(current.parent),resolve(samePath));
    parent=sealed(samePath,sameSha);
  }else{
    assert.equal(current.parentSha256,historicalSha,'Unsupported current receipt ancestry shape');
    assert.equal(resolve(current.parent),resolve(historicalPath));
  }
  if(parent){
    assert.equal(parent.atlasHead,current.atlasHead);
    assert.equal(parent.atlasTree,current.atlasTree);
    if(parent.parentSha256===sameSha){
      const nasal=sealed(samePath,sameSha);
      verifyReceipt(nasal,samePath,sameSha);
      assert.equal(nasal.parentSha256,historicalSha);
      assert.equal(resolve(nasal.parent),resolve(historicalPath));
    }else{
      assert.equal(parent.parentSha256,historicalSha);
      assert.equal(resolve(parent.parent),resolve(historicalPath));
    }
  }
}
const lanes={historical:{receipt:historical,site:historical.website,expected:45},current:{receipt:current,site:current.website,expected:29}};
function summary(tap){
  const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
    const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];
    assert.equal(matches.length,1,`One TAP ${key} terminal`);counts[key]=Number(matches[0][1]);
  }return counts;
}
if(mode==='child'){
  assert(laneName in lanes);verify();const lane=lanes[laneName];
  const run=spawnSync(process.execPath,['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',rootTest],{cwd:lane.site,env:process.env,windowsHide:true,shell:false,encoding:'utf8',maxBuffer:64e6});
  fs.writeFileSync(evidence+'/whole-root.tap',run.stdout??'',{flag:'wx'});
  fs.writeFileSync(evidence+'/whole-root.stderr.log',run.stderr??'',{flag:'wx'});
  const counts=summary(run.stdout??'');
  const passing=run.status===0&&!run.signal&&!run.error&&counts.tests===lane.expected&&counts.pass===lane.expected&&['fail','cancelled','skipped','todo'].every(k=>counts[k]===0);
  verify();save(evidence+'/ROOT_RESULT.json',{lane:laneName,sourceReceipt:laneName==='historical'?historicalPath:currentPath,sourceSha256:laneName==='historical'?historicalSha:currentSha,rootSha256:hash(fileAt(lane.receipt,rootTest)),expected:lane.expected,counts,status:run.status,signal:run.signal,error:run.error?String(run.error):null,passing,completeTap:evidence+'/whole-root.tap',allSourceRowsVerifiedBeforeAndAfter:true});
  process.exitCode=passing?0:1;
}else{
  assert(!mode&&!laneName);verify();assert(!fs.existsSync(evidence));fs.mkdirSync(evidence,{recursive:true});
  const results=[];
  for(const name of ['historical','current']){
    const lane=lanes[name],dir=evidence+'/'+name;
    const command=`${process.argv[1].replaceAll('\\','/')} ${currentPath} ${currentSha} ${dir} child ${name}`;
    const guardedResult=await guarded({site:lane.site,dir,command,heap:768,aggregate:2048,minimum:4096,extraEnv:{VM_ATLAS_SOURCE_REPO:lane.receipt.atlas,ATLAS_SOURCE_REPO:lane.receipt.atlas,VM_WEBSITE_ROOT:lane.site,...(name==='current'?{VM_CURRENT_SOURCE_RECEIPT:currentPath,VM_CURRENT_SOURCE_SHA256:currentSha}:{})}});
    verify();const root=fs.existsSync(dir+'/ROOT_RESULT.json')?json(dir+'/ROOT_RESULT.json'):null;
    const result={lane:name,guarded:guardedResult,root,passing:guardedResult.passing&&root?.passing===true};
    save(evidence+'/'+name+'-result.json',result);results.push(result);
    if(!result.passing)break;
  }
  const passing=results.length===2&&results.every(r=>r.passing);
  save(evidence+'/RESULT.json',{at:new Date().toISOString(),currentReceipt:currentPath,currentSha256:currentSha,historicalReceipt:historicalPath,historicalSha256:historicalSha,results:results.map(r=>({lane:r.lane,passing:r.passing})),passing,allWholeRootsUnfiltered:true,serialContainedJobs:true,clinicalPrivacyReleaseApproval:false});
  console.log(JSON.stringify({result:evidence+'/RESULT.json',passing,results:results.map(r=>({lane:r.lane,passing:r.passing}))}));
  process.exitCode=passing?0:1;
}
