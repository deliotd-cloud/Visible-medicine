import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { hash, json } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';

const stage='G:/VisibleMedicine-temp/staging/20261029-complete-selfchecks-native',atlas=stage+'/atlas';
const proposal='G:/VisibleMedicine-temp/staging/20261029-final-selfcheck-proposal';
const parentFile='G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-native/PREPARATION.json';
assert.equal(hash(parentFile),'4d95d5118e72c3dac24afaf6eab142a3699b5322bd88f6a2f5698d265da3b2f5');
const parent=json(parentFile),expected=new Map(parent.sourceRows.map(r=>[r.path,r.sha256]));
assert.equal(expected.size,6490);assert(!fs.existsSync(stage));
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.currentCapacityDecision.useGAuthorized,true);
const comparisonFile=proposal+'/COMPARISON-1793302580638.json',comparison=json(comparisonFile);
assert.equal(comparison.quizPlacements,16);assert.equal(comparison.unchangedNonQuizLessons,128);assert.equal(comparison.mutatedSourcesRejected,64);
for(const r of comparison.sourceInputs)assert.equal(hash(r.path),r.sha256,r.path);
const paths=[
 'lib/pelvic-veins.ts','lib/corpus-spongiosum.ts','lib/circumflex-femoral.ts','lib/anterior-cardiac-vein.ts','lib/foot-sesamoid-teaching.ts','content/foot-sesamoid-teaching.ts',
 'scripts/test-pelvic-vein-quiz.mjs','scripts/test-remaining-selfchecks.mjs',
 'scripts/fixtures/pelvic-veins.before.ts.txt','scripts/fixtures/corpus-spongiosum.before.ts.txt','scripts/fixtures/circumflex-femoral.before.ts.txt','scripts/fixtures/anterior-cardiac-vein.before.ts.txt','scripts/fixtures/foot-sesamoid-teaching.before.ts.txt','scripts/fixtures/foot-sesamoid-content.before.ts.txt',
];
const changes=paths.map(p=>({path:p,from:proposal+'/'+p,beforeSha256:expected.get(p)??null,sha256:hash(proposal+'/'+p),bytes:fs.statSync(proposal+'/'+p).size}));
assert.equal(changes.length,14);assert.equal(changes.filter(r=>r.beforeSha256===null).length,8);
const contain=(base,p)=>{assert(!path.isAbsolute(p)&&!p.includes('\\')&&!p.split('/').some(s=>['','.','..'].includes(s)));const result=path.resolve(base,p);assert(result.startsWith(path.resolve(base)+path.sep));return result;};
for(const r of parent.sourceRows)assert.equal(hash(contain(parent.atlas,r.path)),r.sha256,r.path);
const free=()=>{const d=fs.statfsSync('G:/');return d.bavail*d.bsize;};assert(free()>parent.sourceRows.reduce((n,r)=>n+r.bytes,0)+512*1048576);
fs.mkdirSync(stage,{recursive:true});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
assert.equal(git('-C',parent.atlas,'rev-parse','HEAD'),parent.parentHead);
git('clone','--shared','--no-checkout','--',parent.atlas,atlas);git('-C',atlas,'config','--local','core.autocrlf','false');git('-C',atlas,'read-tree','HEAD');
for(const r of parent.sourceRows){assert(free()>r.bytes+512*1048576);const to=contain(atlas,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(contain(parent.atlas,r.path),to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),r.sha256);}
for(const r of changes){const to=contain(atlas,r.path);if(r.beforeSha256)assert.equal(hash(to),r.beforeSha256);else assert(!fs.existsSync(to));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(r.from,to);assert.equal(hash(to),r.sha256);expected.set(r.path,r.sha256);}
assert.equal(expected.size,6498);
fs.symlinkSync(fs.realpathSync.native(parent.atlas+'/node_modules'),atlas+'/node_modules','junction');fs.mkdirSync(stage+'/temp');
const ts=createRequire(atlas+'/package.json')('typescript'),config=ts.readConfigFile(atlas+'/tsconfig.json',ts.sys.readFile);assert(!config.error);const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,atlas);assert.equal(parsed.errors.length,0);
const names=new Set(parsed.fileNames.map(p=>path.resolve(p)));for(const r of changes.filter(r=>r.path.startsWith('scripts/fixtures/')))assert(!names.has(path.resolve(atlas,r.path)));
const results=[];
for(const script of ['scripts/test-pelvic-vein-quiz.mjs','scripts/test-remaining-selfchecks.mjs']){
 const run=spawnSync(process.execPath,['--max-old-space-size=96','--test','--test-reporter=tap',script],{cwd:atlas,windowsHide:true,encoding:'utf8',maxBuffer:1048576,env:{...process.env,TEMP:stage+'/temp',TMP:stage+'/temp',VM_ATLAS_SOURCE_ROOT:atlas}});
 const log=stage+'/'+path.basename(script)+'.log';fs.writeFileSync(log,(run.stdout??'')+(run.stderr??''),{flag:'wx'});results.push({script,exitCode:run.status,signal:run.signal,log,sha256:hash(log)});assert.equal(run.status,0,script+' failed; see '+log);assert.equal(run.signal,null);
}
for(const[p,h]of expected)assert.equal(hash(atlas+'/'+p),h,p);for(const r of parent.sourceRows)assert.equal(hash(parent.atlas+'/'+r.path),r.sha256,r.path);
for(const r of comparison.sourceInputs)assert.equal(hash(r.path),r.sha256,r.path);
const sourceRows=[...expected].sort(([a],[b])=>a.localeCompare(b)).map(([p,h])=>({path:p,sha256:h,bytes:fs.statSync(atlas+'/'+p).size}));
const prep={schema:'vm-complete-selfchecks-native/1',at:new Date().toISOString(),atlas,parent:{path:parentFile,sha256:hash(parentFile)},comparisonParent:parent.parent,parentHead:parent.parentHead,sourceRows,sourceFiles:sourceRows.length,changes,proposalComparison:{path:comparisonFile,sha256:hash(comparisonFile)},references:{path:proposal+'/SOURCE_NOTES.json',sha256:hash(proposal+'/SOURCE_NOTES.json')},focusedTests:results,fixtureInputsExcluded:6,allOtherParentSourceExact:true,publicAssetsUnchanged:true,newQuizPlacements:16,expectedQuizChangesSinceGeneratedParent:20,fullTypesPassed:false,stockGenerationPending:true,fullBuildPassed:false,installed:false,ownerPreviewChanged:false,clinicalApproval:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,sourceFiles:6498,changedFiles:14,focusedTests:results.map(r=>({script:r.script,exitCode:r.exitCode})),preparationSha256:hash(stage+'/PREPARATION.json')}));
