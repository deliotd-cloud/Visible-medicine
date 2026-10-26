// External, unexecuted proposal. One authenticated whole root per guarded job.
// node nine-root-epoch-runner.mjs <new-evidence-directory>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {dirname,isAbsolute,join,parse,relative,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const base=dirname(fileURLToPath(import.meta.url));
const configFile=join(base,'CONTEXTS.json');
const configSha='376b729b6f6a8bdfc5a1d355abb1fc8b02ed6a21e35644685f9c7e10d775261f';
const guardFile='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-small-native-task-guarded-20261025.mjs';
const guardSha='18a940c027d1c11a3164709b8fd42da2c34a264185eae7dd29e01f80e251820d';
const dependencyAlias=resolve('F:/VisibleMedicine/staging/20261025-native-integrated-website/website/node_modules');
const dependencyCanonical=resolve('F:/VisibleMedicine/website/node_modules');
const finiteLinkedPaths=new Set([
  'node_modules/@esbuild/win32-x64/esbuild.exe',
  'node_modules/@esbuild/win32-x64/package.json',
  'node_modules/esbuild/lib/main.js',
  'node_modules/esbuild/package.json',
]);
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const save=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const runnerSha=process.env.VM_NINE_ROOT_RUNNER_SHA;
assert(/^[0-9a-f]{64}$/i.test(runnerSha??''),'Exact reviewed runner SHA required');
function runnerIdentity(){assert.equal(hash(fileURLToPath(import.meta.url)),runnerSha.toLowerCase(),'Runner bytes changed');exactFile(guardFile,guardSha);}
runnerIdentity();
assert.equal(hash(configFile),configSha,'Exact external context config changed');
const config=json(configFile),h=config.historical;
const finiteJunctions=[
  {root:resolve(h.arterialWebsite),rootTarget:resolve('F:/VisibleMedicine/website/node_modules'),canonicalFileRoot:resolve('F:/VisibleMedicine/website/node_modules')},
  {root:resolve(h.arterialNative),rootTarget:resolve('F:/VisibleMedicine/staging/20261024-practice-actions/atlas/node_modules'),canonicalFileRoot:resolve('F:/VisibleMedicine/atlas/node_modules')},
].map(item=>({...item,alias:join(item.root,'node_modules')}));
assert.equal(config.schema,'vm-nine-root-epoch-contexts/1');
assert.equal(config.lanes.length,9);
const [evidence,mode,laneIndex]=process.argv.slice(2);
assert(evidence&&isAbsolute(evidence)&&resolve(evidence).startsWith(resolve('F:/VisibleMedicine/staging')+sep),'Fresh staging evidence directory required');
assert(!/\s/.test(evidence),'Supervisor command paths cannot contain whitespace');
function exactFile(file,digest){assert.equal(hash(noLinks(file)),digest,file);}
function noLinks(file,kind='file'){
  const absolute=resolve(file),base=parse(absolute).root,parts=absolute.slice(base.length).split(sep).filter(Boolean);
  let at=base;
  for(let i=0;i<parts.length;i++){
    at=join(at,parts[i]);const stat=fs.lstatSync(at);
    assert(!stat.isSymbolicLink(),`Symlink component: ${at}`);
    assert(i===parts.length-1?(kind==='file'?stat.isFile():stat.isDirectory()):stat.isDirectory(),`Wrong path type: ${at}`);
  }return absolute;
}
function within(root,relativePath){
  assert(typeof relativePath==='string'&&relativePath&&!relativePath.includes('\\')&&!isAbsolute(relativePath)&&
    !relativePath.split('/').some(part=>!part||part==='.'||part==='..'),'Unsafe relative path');
  const full=resolve(root,relativePath),inside=relative(root,full);
  assert(inside&&inside!=='..'&&!inside.startsWith('..'+sep)&&!isAbsolute(inside),'Escaping source path');
  return noLinks(full);
}
function declaredDependencyFile(d){
  const same=(a,b)=>resolve(a).toLowerCase()===resolve(b).toLowerCase();
  const name=d.name.split('/');
  assert(name.length===1||name.length===2,'Unexpected package name');
  assert(name.every((part,index)=>/^[A-Za-z0-9@._-]+$/.test(part)&&part!=='.'&&part!=='..'&&(index===0||!part.startsWith('@'))),'Unsafe package name');
  assert(same(d.file,join(dependencyAlias,...name,'package.json')),'Foreign dependency receipt path');
  noLinks(dirname(dependencyAlias),'dir');noLinks(dependencyCanonical,'dir');
  assert(fs.lstatSync(dependencyAlias).isSymbolicLink(),'Declared dependency alias must be a junction');
  assert(same(fs.realpathSync.native(dependencyAlias),dependencyCanonical),'Foreign dependency junction target');
  const suffix=[...name,'package.json'];let at=dependencyAlias;
  for(let i=0;i<suffix.length;i++){
    at=join(at,suffix[i]);const stat=fs.lstatSync(at);
    assert(!stat.isSymbolicLink(),`Nested dependency link: ${at}`);
    assert(i===suffix.length-1?stat.isFile():stat.isDirectory(),`Wrong dependency path type: ${at}`);
  }
  const canonicalFile=within(dependencyCanonical,suffix.join('/'));
  assert(same(fs.realpathSync.native(d.file),canonicalFile),'Foreign resolved dependency file');
  const packageRoot=join(dependencyCanonical,...name),entryRelative=relative(packageRoot,resolve(d.entry));
  assert(entryRelative&&entryRelative!=='..'&&!entryRelative.startsWith('..'+sep)&&!isAbsolute(entryRelative),'Foreign dependency entry');
  assert(same(within(packageRoot,entryRelative.replaceAll('\\','/')),d.entry),'Linked dependency entry');
  assert.equal(hash(canonicalFile),d.sha256,d.file);exactFile(d.entry,d.entrySha256);
}
function declaredDependencyJunction(){
  const command=`(Get-Item -LiteralPath '${dependencyAlias.replaceAll("'","''")}' -Force).LinkType`;
  const kind=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{encoding:'utf8',windowsHide:true}).trim();
  assert.equal(kind,'Junction','Declared dependency alias is not a Windows junction');
}
function finiteJunctionFor(root){return finiteJunctions.find(item=>resolve(item.root).toLowerCase()===resolve(root).toLowerCase());}
function checkFiniteJunctions(){
  for(const item of finiteJunctions){
    noLinks(dirname(item.alias),'dir');noLinks(item.rootTarget,'dir');noLinks(item.canonicalFileRoot,'dir');
    assert(fs.lstatSync(item.alias).isSymbolicLink(),`Declared finite alias is not linked: ${item.alias}`);
    const command=`(Get-Item -LiteralPath '${item.alias.replaceAll("'","''")}' -Force).LinkType`;
    const kind=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{encoding:'utf8',windowsHide:true}).trim();
    assert.equal(kind,'Junction',`Declared finite alias is not a Windows junction: ${item.alias}`);
    assert.equal(resolve(fs.realpathSync.native(item.alias)).toLowerCase(),item.rootTarget.toLowerCase(),`Foreign finite junction target: ${item.alias}`);
  }
}
function declaredFiniteFile(item,path){
  assert(finiteLinkedPaths.has(path),'Undeclared finite junction path');
  const suffix=path.slice('node_modules/'.length).split('/');
  const logicalFile=join(item.alias,...suffix),canonicalFile=within(item.canonicalFileRoot,suffix.join('/'));
  assert.equal(resolve(fs.realpathSync.native(logicalFile)).toLowerCase(),canonicalFile.toLowerCase(),`Foreign resolved finite file: ${path}`);
  return canonicalFile;
}
function git(root,...args){return execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();}
function native(root,head,tree){
  noLinks(root,'dir');assert.equal(git(root,'rev-parse','HEAD'),head);assert.equal(git(root,'rev-parse','HEAD^{tree}'),tree);
  assert.equal(git(root,'status','--porcelain=v1'),'',`Native checkout changed: ${root}`);
}
function receipt(role){
  noLinks(role.website,'dir');noLinks(role.native,'dir');exactFile(role.receipt,role.sha256);
  const r=json(role.receipt);assert.equal(resolve(r.website),resolve(role.website));assert.equal(resolve(r.atlas),resolve(role.native));
  assert.equal(r.atlasHead,role.head);assert.equal(r.sourceRows.length,role.sourceRows);assert.equal(r.dependencies.length,role.dependencies);
  const seen=new Set();for(const row of r.sourceRows){
    assert(!seen.has(row.path),`Duplicate source row: ${row.path}`);seen.add(row.path);
    const bytes=fs.readFileSync(within(role.website,row.path));
    assert.equal(bytes.length,row.bytes,row.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,row.path);
  }
  for(const d of r.dependencies){declaredDependencyFile(d);}
  assert.equal(hash(within(role.website,'tests/fixtures/current-atlas-delivery.json')),role.pinSha256);
  const pin=json(within(role.website,'tests/fixtures/current-atlas-delivery.json'));
  assert.equal(pin.source,role.head);assert.equal(pin.sourceTree,role.tree);
  native(role.native,role.head,role.tree);return r;
}
function finite(root,rows){
  noLinks(root,'dir');assert(Array.isArray(rows)&&rows.length>0);const seen=new Set();
  for(const row of rows){assert(!seen.has(row.path),`Duplicate finite row: ${row.path}`);seen.add(row.path);
    const item=finiteJunctionFor(root);
    const file=item&&finiteLinkedPaths.has(row.path)?declaredFiniteFile(item,row.path):within(root,row.path);
    const bytes=fs.readFileSync(file);assert.equal(bytes.length,row.bytes,row.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,row.path);
  }
}
function historical(){
  exactFile('F:/VisibleMedicine/staging/20261025-adjacent-role-proposal/REPORT.json','7216b39343d194910874abaa214cae40f370c5039e845b11452a648d43667dc8');
  exactFile('F:/VisibleMedicine/staging/20261025-arterial-role-website/LOCAL_TEST_CONFIGURATION.json','620bcdffb700603a203ae611a2609cac3f79d57f82dc1d52f94eab1da6462e28');
  exactFile('F:/VisibleMedicine/staging/20261025-cervical-role-website/LOCAL_TEST_CONFIGURATION.json','41f42bb87d53bebbab7441cecafde469ae6ebf066b836d58aaeaf52de7da2619');
  exactFile('F:/VisibleMedicine/staging/20261025-viewer-notice-role-website/LOCAL_TEST_CONFIGURATION.json','d43e25330207d9ea2b673d6b8c9768d23446a710128b7ec69e2ea17748335e82');
  exactFile(h.b79Receipt,h.b79ReceiptSha256);exactFile(join(h.b79Website,'tests/fixtures/current-atlas-delivery.json'),h.b79PinSha256);
  const b79=json(h.b79Receipt);assert.equal(resolve(b79.website),resolve(h.b79Website));assert.equal(b79.atlasHead,h.b79Head);assert.equal(b79.atlasTree,h.b79Tree);
  native(h.b79Native,h.b79Head,h.b79Tree);
  exactFile(h.adjacentTransition,h.adjacentTransitionSha256);
  exactFile(join(h.adjacent190aExport,'manifest.json'),h.adjacent190aManifestSha256);
  exactFile(join(h.adjacent190aExport,'source-inputs.json'),h.adjacent190aInputsSha256);
  exactFile(h.adjacent190aCheckpoint,h.adjacent190aCheckpointSha256);
  noLinks(h.adjacentClinicalWebsite,'dir');exactFile(h.adjacentClinicalProof,h.adjacentClinicalProofSha256);
  exactFile(h.arterialClosure,h.arterialClosureSha256);native(h.arterialNative,h.arterialHead,h.arterialTree);
  const a=json(h.arterialClosure);assert.equal(a.schema,'vm-arterial-finite-closure/1');
  const arterialRoots={historicalWebsite:h.arterialWebsite,historicalAtlas:h.arterialNative,installedWebsite:'F:/VisibleMedicine/website'};
  for(const scopes of Object.values(a.roles))for(const [scope,rows]of Object.entries(scopes)){assert(scope in arterialRoots);finite(arterialRoots[scope],rows);}
  exactFile(h.cervicalClosure,h.cervicalClosureSha256);native(h.cervicalNative,h.cervicalHead,h.cervicalTree);
  const c=json(h.cervicalClosure);assert.equal(c.schema,'vm-cervical-finite-closure/1');
  const cervicalRoots={historicalWebsite:h.cervicalWebsite,historicalAtlas:h.cervicalNative,historicalDependencies:h.cervicalDependencies};
  for(const [scope,rows]of Object.entries(c.scopes)){assert(scope in cervicalRoots);finite(cervicalRoots[scope],rows);}
  noLinks(h.cervicalEvidenceRoot,'dir');
  exactFile(h.noticeClosure,h.noticeClosureSha256);native(h.noticeNative,h.noticeNativeHead,h.noticeNativeTree);
  const n=json(h.noticeClosure);assert.equal(n.schema,'vm-viewer-notice-local-inputs/1');
  finite(h.noticeWebsite,n.roles.wave4.rows);
  exactFile(join(dirname(h.noticeClosure),'historical-tail.txt'),'fb0acbfee8b40326657abb39fb24d4ff74b02d79f1e424d44a4630610a016c42');
  exactFile(join(h.noticeWebsite,'../TEST_READY_SOURCE.json'),'bbd4ca357b137db79340eea3f4a681310fe3cbcedb51137af904078487523d1c');
  exactFile(join(h.arterialWebsite,'tests/atlas-arterial-evidence-limits.test.mjs'),'a6cbf916326c68b471e7cc16998e59715cb1dd4a44c32fff18fc975f096f58f3');
  exactFile(join(h.arterialWebsite,'tests/arterial-epoch-preservation.test.mjs'),'95b6fc4f9d3f5ecef3dd1c37c876fb959c89ad83107f66f343d5c00e041587be');
  exactFile(join(h.cervicalWebsite,'tests/atlas-cervical-projection-xray.test.mjs'),'428fb397b7d5efff567754844a282223ee8ce8068fc0eb599413cbd7fe0621df');
  exactFile(join(h.noticeWebsite,'tests/atlas-current-history-wave4-contract.test.mjs'),'67d44d60387a833b16726fdb090d9f28e8231af3f557b90c0a70d496f14eea05');
}
function verify(){
  runnerIdentity();assert.equal(hash(configFile),configSha);declaredDependencyJunction();checkFiniteJunctions();receipt(config.current);receipt(config.role727);historical();
  const stockRoots=fs.readdirSync(join(config.current.website,'tests')).filter(name=>/\.test\.(?:mjs|ts)$/.test(name));
  assert.equal(stockRoots.length,1336,'Stock discovery baseline changed');
  const names=new Set();for(const lane of config.lanes){
    assert(['current','role727'].includes(lane.site));assert(/^[A-Za-z0-9-]+\.test\.mjs$/.test(lane.root));
    const key=lane.site+':'+lane.root;assert(!names.has(key));names.add(key);
    const source=config[lane.site],root=within(source.website,'tests/'+lane.root);
    assert(stockRoots.includes(lane.root),`Nine-root stock discovery: ${lane.root}`);
    assert.equal(hash(root),lane.rootSha256,key);
    const other=config[lane.site==='current'?'role727':'current'];
    if(lane.site==='role727')assert.equal(hash(within(other.website,'tests/'+lane.root)),lane.rootSha256,'Complete current727 test bytes retained in e216');
  }
  assert.equal(config.lanes.filter(l=>l.site==='current').length,6);
  assert.equal(config.lanes.filter(l=>l.site==='role727').length,3);
}
const env={
  VM_ADJACENT_B79_WEBSITE:h.b79Website,VM_ADJACENT_B79_ATLAS:h.b79Native,VM_ADJACENT_B79_RECEIPT:h.b79Receipt,
  VM_ADJACENT_TRANSITION:h.adjacentTransition,VM_ADJACENT_190A_EXPORT:h.adjacent190aExport,VM_ADJACENT_190A_CHECKPOINT:h.adjacent190aCheckpoint,
  VM_ADJACENT_CLINICAL_WEBSITE:h.adjacentClinicalWebsite,VM_ADJACENT_CLINICAL_PROOF:h.adjacentClinicalProof,
  VM_ARTERIAL_HISTORICAL_WEBSITE:h.arterialWebsite,VM_ARTERIAL_HISTORICAL_ATLAS:h.arterialNative,VM_ARTERIAL_LOCAL_CLOSURE:h.arterialClosure,
  VM_CERVICAL_HISTORICAL_WEBSITE:h.cervicalWebsite,VM_CERVICAL_HISTORICAL_ATLAS:h.cervicalNative,
  VM_CERVICAL_LOCAL_CLOSURE:h.cervicalClosure,VM_CERVICAL_LOCAL_EVIDENCE_ROOT:h.cervicalEvidenceRoot,
  VM_NOTICE_WAVE4_WEBSITE:h.noticeWebsite,VM_NOTICE_WAVE4_ATLAS:h.noticeNative,
  VM_NOTICE_ADMISSION_WEBSITE:h.noticeAdmissionWebsite,VM_NOTICE_GUARD_WEBSITE:h.noticeGuardWebsite,
  VM_NOTICE_LOCAL_EVIDENCE:h.noticeClosure,
};
function counts(tap){const result={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
  const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,`One terminal ${key}`);result[key]=Number(matches[0][1]);
}return result;}
if(mode==='aux'){
  const index=Number(laneIndex);assert(Number.isInteger(index)&&index>=0&&index<3);verify();
  assert.equal(config.auxiliary.length,3);const lane=config.auxiliary[index],source=config.current;
  assert.deepEqual(config.auxiliary.map(r=>[r.root,r.expectedCases]),[['current-atlas-delivery.test.mjs',29],['release-diagnostic-context-inverse.test.mjs',29],['release-diagnostic-adjacent-current.test.mjs',3]]);
  assert.equal(process.env.VM_CURRENT_SOURCE_RECEIPT,source.receipt);assert.equal(process.env.VM_CURRENT_SOURCE_SHA256,source.sha256);
  assert.equal(hash(within(source.website,'tests/'+lane.root)),lane.rootSha256);
  const result=spawnSync(process.execPath,['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap','tests/'+lane.root],{cwd:source.website,env:process.env,windowsHide:true,shell:false,encoding:'utf8',maxBuffer:64e6});
  fs.writeFileSync(join(evidence,'whole-root.tap'),result.stdout??'',{flag:'wx'});fs.writeFileSync(join(evidence,'whole-root.stderr.log'),result.stderr??'',{flag:'wx'});
  let observed=null,parseError=null;try{observed=counts(result.stdout??'');}catch(error){parseError=String(error);}
  verify();const passing=result.status===0&&!result.signal&&!result.error&&!parseError&&observed.tests===lane.expectedCases&&observed.pass===lane.expectedCases&&['fail','cancelled','skipped','todo'].every(k=>observed[k]===0);
  save(join(evidence,'ROOT_RESULT.json'),{auxiliary:index,site:'current',root:'tests/'+lane.root,rootSha256:lane.rootSha256,expectedCases:lane.expectedCases,observed,status:result.status,signal:result.signal,error:result.error?String(result.error):null,parseError,passing,allSourceDependencyFiniteInputsStable:true});process.exitCode=passing?0:1;
}else if(mode==='child'){
  const index=Number(laneIndex);assert(Number.isInteger(index)&&index>=0&&index<9);verify();
  const lane=config.lanes[index],source=config[lane.site];
  if(lane.site==='current'){
    assert.equal(process.env.VM_CURRENT_SOURCE_RECEIPT,config.current.receipt);
    assert.equal(process.env.VM_CURRENT_SOURCE_SHA256,config.current.sha256);
  }else{
    assert.equal(process.env.VM_CURRENT_SOURCE_RECEIPT,undefined,'No 7e current receipt in 727 lane');
    assert.equal(process.env.VM_CURRENT_SOURCE_SHA256,undefined,'No 7e current SHA in 727 lane');
  }
  const result=spawnSync(process.execPath,['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap','tests/'+lane.root],{cwd:source.website,env:process.env,windowsHide:true,shell:false,encoding:'utf8',maxBuffer:64e6});
  fs.writeFileSync(join(evidence,'whole-root.tap'),result.stdout??'',{flag:'wx'});
  fs.writeFileSync(join(evidence,'whole-root.stderr.log'),result.stderr??'',{flag:'wx'});
  let observed=null,parseError=null;try{observed=counts(result.stdout??'');}catch(error){parseError=String(error);}
  verify();const passing=result.status===0&&!result.signal&&!result.error&&!parseError&&observed.tests===lane.expectedCases&&observed.pass===lane.expectedCases&&['fail','cancelled','skipped','todo'].every(k=>observed[k]===0);
  save(join(evidence,'ROOT_RESULT.json'),{lane:index,site:lane.site,root:'tests/'+lane.root,rootSha256:lane.rootSha256,expectedCases:lane.expectedCases,observed,status:result.status,signal:result.signal,error:result.error?String(result.error):null,parseError,passing,allSourceDependencyFiniteInputsStable:true});
  process.exitCode=passing?0:1;
}else if(mode==='preflight'){
  assert(!laneIndex);verify();assert(!fs.existsSync(evidence));fs.mkdirSync(evidence,{recursive:true});
  save(join(evidence,'PREFLIGHT.json'),{at:new Date().toISOString(),passing:true,runnerSha256:runnerSha.toLowerCase(),configSha256:configSha,guardSha256:guardSha,admittedRoots:config.lanes.length,rootsExecuted:0,wholeStockSuitePassing:false,clinicalPrivacyReleaseApproval:false});
  console.log(JSON.stringify({preflight:join(evidence,'PREFLIGHT.json'),passing:true,rootsExecuted:0}));
}else{
  assert(!mode&&!laneIndex);verify();assert(!fs.existsSync(evidence));fs.mkdirSync(evidence,{recursive:true});
  const {guarded}=await import(pathToFileURL(guardFile));const results=[];
  for(let i=0;i<config.lanes.length;i++){
    const lane=config.lanes[i],source=config[lane.site],dir=join(evidence,String(i+1).padStart(2,'0')+'-'+lane.root.replace('.test.mjs',''));
    const command=`${fileURLToPath(import.meta.url).replaceAll('\\','/')} ${dir.replaceAll('\\','/')} child ${i}`;
    const run=await guarded({site:source.website,dir,command,heap:768,aggregate:2048,minimum:4096,extraEnv:{...env,...(lane.site==='current'?{VM_CURRENT_SOURCE_RECEIPT:config.current.receipt,VM_CURRENT_SOURCE_SHA256:config.current.sha256}:{}),VM_NINE_ROOT_RUNNER_SHA:runnerSha,VM_ATLAS_SOURCE_REPO:source.native,ATLAS_SOURCE_REPO:source.native,VM_WEBSITE_ROOT:source.website}});
    verify();const root=fs.existsSync(join(dir,'ROOT_RESULT.json'))?json(join(dir,'ROOT_RESULT.json')):null;
    const result={lane:i,root:lane.root,site:lane.site,guarded:run,rootResult:root,passing:run.passing&&root?.passing===true};
    save(join(evidence,`lane-${i+1}.json`),result);results.push(result);
    if(!result.passing)break;
  }
  const passing=results.length===9&&results.every(r=>r.passing);
  save(join(evidence,'RESULT.json'),{at:new Date().toISOString(),passing,attempted:results.length,required:9,results:results.map(r=>({lane:r.lane,root:r.root,site:r.site,passing:r.passing})),stockEntries:1336,otherStockEntriesNotExecuted:1327,wholeStockSuitePassing:false,clinicalPrivacyReleaseApproval:false});
  console.log(JSON.stringify({result:join(evidence,'RESULT.json'),passing,attempted:results.length}));
  process.exitCode=passing?0:1;
}
