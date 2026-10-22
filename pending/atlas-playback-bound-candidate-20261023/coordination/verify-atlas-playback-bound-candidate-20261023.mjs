import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-atlas-playback-bound-candidate',prep=json(root+'/PREPARATION.json'),site=prep.atlas;
const out=root+'/evidence';fs.mkdirSync(out,{recursive:true});
const checks=[];
for(const [name,args]of [
 ['renderer-check',['scripts/body-renderer-revisions.mjs','--check']],
 ['regular-tour-library-command',['--run-package']],
 ['display-pins-check',['scripts/generate-body-review-display-pins.mjs','--check']],
 ['nested-links-check',['scripts/generate-nested-review-bindings.mjs','--check']],
 ['renderer-review-scope',['scripts/test-renderer-review-scope.mjs']],
 ]){
 const entries=args[0]==='--run-package'?JSON.parse(read(site+'/package.json')).scripts['tour-library-pause:test'].split(' && ').map(entry=>{
  assert(entry.startsWith('node scripts/'));return entry.slice(5).split(' ');
 }):[args];
 for(let i=0;i<entries.length;i++){
  const argv=entries[i],r=spawnSync(process.execPath,argv,{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024,
   env:{...process.env,NODE_OPTIONS:'--max-old-space-size=256',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'}});
  const log=(r.stdout??'')+(r.stderr??''),p=out+'/'+name+(entries.length>1?'-'+i:'')+'.log';fs.writeFileSync(p,log,{flag:'wx'});
  checks.push({name,args:argv,exitCode:r.status,path:p,sha256:sha(read(p))});
  assert.equal(r.error,undefined);assert.equal(r.status,0,log);console.log(JSON.stringify({check:name,args:argv,exitCode:r.status}));
 }
}
const old=p=>runGit(['-C',site,'show',prep.baselineHead+':'+p]);
const before=JSON.parse(old('content/body-renderer-revision.json')),after=json(site+'/content/body-renderer-revision.json');
assert.deepEqual(before.entrypoints,after.entrypoints);assert.equal(after.dependencies.length,1492);
assert.deepEqual(before.dependencies.map(r=>r.path),after.dependencies.map(r=>r.path));
const changed=after.dependencies.filter((r,i)=>r.sha256!==before.dependencies[i].sha256);
assert.deepEqual(changed.map(r=>r.path).sort(),['app/eye-layers.tsx','app/ventricles.tsx','app/whole-body-guided-learning.tsx','package.json']);
for(const r of after.dependencies)assert.equal(sha(read(site+'/'+r.path).toString().replaceAll('\r\n','\n')),r.sha256,r.path);
assert.equal(sha(JSON.stringify(after.dependencies)),after.sha256);
const oldPackage=JSON.parse(old('package.json')),newPackage=json(site+'/package.json');
newPackage.scripts['tour-library-pause:test']=newPackage.scripts['tour-library-pause:test'].replace(' && node scripts/test-nested-tour-library-pause.mjs','');assert.deepEqual(newPackage,oldPackage);
const p='scripts/test-whole-body-guided-learning.mjs',text=read(site+'/'+p).toString(),start=text.indexOf('// This closed 2381 theorem still executes exact 2381 source.');
assert(start>=0);const end=text.indexOf("const css=readFileSync('app/whole-body-guided-learning.css'",start);assert(end>start);
const addition=text.slice(start,end);assert(addition.includes("assert.equal(text.split(addition).length,3"));
const restored=(text.slice(0,start)+text.slice(end)).replace('assert.deepEqual(historicalComponentInput(path),baselineBytes,','assert.deepEqual(readFileSync(args.path),baselineBytes,');
assert.deepEqual(Buffer.from(restored),old(p),'Every original historical assertion and interaction survives the complete inverse');
// Real current component allows only the two exact new signal props. Foreign
// markup must fail against the same immutable historical component bytes.
const component='app/whole-body-guided-learning.tsx',bytes=read(site+'/'+component),part=' initialGuidedLearningExpanded pauseRequest={pauseRequest}';
assert.equal(bytes.toString().split(part).length,3);const inverse=b=>Buffer.from(b.toString().replaceAll(part,' initialGuidedLearningExpanded'));
assert.deepEqual(inverse(bytes),old(component));
assert.notDeepEqual(inverse(Buffer.from(bytes.toString().replace(part,' initialGuidedLearningExpanded pauseRequest={999}'))),old(component));
assert.notDeepEqual(inverse(Buffer.from(bytes.toString()+'\n// foreign code\n')),old(component));
assert.notDeepEqual(Buffer.from(text.replace('assert.equal(text.split(addition).length,3','assert.equal(text.split(addition).length,2')),Buffer.from(text));
const allowed=new Set([...prep.sourceRows.map(r=>r.path),'package.json',p,'content/body-renderer-revision.json']);
const dirty=runGit(['-C',site,'status','--porcelain','-uall']).toString().trimEnd().split('\n').filter(Boolean).map(r=>r.slice(3));assert.equal(dirty.length,7);for(const p of dirty)assert(allowed.has(p),p);
runGit(['-C',site,'diff','--check']);
assert.equal(runGit(['-C',prep.baseline,'status','--porcelain']).toString().trim(),'');
const rows=[...allowed].sort().map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
const report={at:new Date().toISOString(),schema:'vm.atlas-playback-bound-verification/1',atlas:site,baseline:prep.baselineHead,baselineTree:prep.baselineTree,sourceRows:rows,checks,
 renderer:{sha256:after.sha256,priorSha256:before.sha256,dependencies:1492,changedInputs:changed,allDependencyBytesVerified:true},
 historicalProof:{originalWholeBodyTestInverse:true,onlyTwoSignalPropsPermitted:true,foreignCodeOrSubstitutionRefused:true,oldTheoremExecuted:true,currentRegressionSeparatelyExecuted:true},
 scopedReview:'Existing renderer-scope test compares every root, nested and specimen context. Only geometry/display revisions change; source, teaching, checklists, imaging blocks and material scoping remain intact. It does not read or migrate decisions.',
 currentChecksAreNotFullSuite:true,sourceOnlySparse:true,fullTypesBuildBrowserPending:true,matchingRuntimeReviewWebsiteBindingPending:true,clinicalApproval:false,patientSpaceRegistration:false,previewChanged:false,installed:false};
fs.writeFileSync(root+'/VERIFICATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/VERIFICATION.json',sha256:sha(read(root+'/VERIFICATION.json')),checks:checks.length,sourcePaths:rows.length,previewChanged:false}));
