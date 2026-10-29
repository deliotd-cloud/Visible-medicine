import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync,spawnSync} from 'node:child_process';import {createRequire} from 'node:module';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const stage='G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-native',atlas=stage+'/atlas';
const parentFile='F:/VisibleMedicine/recovery/checkpoints/20261029-native-generation-verified/SOURCE_AFTER_GENERATION.json';
assert.equal(hash(parentFile),'acebaab2382fec27f5af122496be6b13372e7dca6d58c5e96a5f581765297a75');
const parent=json(parentFile),expected=new Map(parent.sourceRows.map(r=>[r.path,r.sha256]));
assert(!fs.existsSync(stage));assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.currentCapacityDecision.useGAuthorized,true);
const contain=(base,p)=>{assert(!path.isAbsolute(p)&&!p.includes('\\')&&!p.split('/').some(s=>['','.','..'].includes(s)));const result=path.resolve(base,p);assert(result.startsWith(path.resolve(base)+path.sep));return result;};
const changes=[],proposals=[];
for(const[name,pin]of [['limbic-quiz','2879168a836e33b355dbbc7c6ae886b01e182e63777f6c20996479ec38de0af9'],['quick-check-order','2ec52301bf66d50b8a18dbf41fa66144474d2525379545a03f931a2f9006222e']]){
 const cp='F:/VisibleMedicine/recovery/checkpoints/20261029-'+name;assert.equal(hash(cp+'/checkpoint.json'),pin);const p=json(cp+'/checkpoint.json');proposals.push({path:cp+'/checkpoint.json',sha256:pin});
 for(const row of p.files.filter(r=>!r.path.startsWith('tools/'))){const file=row.path==='scripts/test-quick-check-order-component.mjs'?'scripts/test-structure-quick-check.mjs':row.path;assert.equal(hash(cp+'/source/'+row.path),row.sha256);changes.push({path:file,proposalPath:row.path,from:cp+'/source/'+row.path,beforeSha256:expected.get(file)??null,sha256:row.sha256,bytes:row.bytes});}
}
assert.equal(changes.length,9);assert.equal(new Set(changes.map(r=>r.path)).size,9);
assert.equal(expected.get('lib/limbic-landmarks.ts'),'d31ea68bd362db13907de78743f138c8f7cae518895303cefc03370a821c650f');
assert.equal(expected.get('app/structure-quick-check.tsx'),'ed5d2a9ba608f6cb9d53360c936ff676b0982febb57de27c187ebd89760d0355');
assert.equal(expected.get('scripts/test-structure-quick-check.mjs'),'551f363f6f1d745d6680d3ea3e13242fcd3e394b96b6af0ecd12fdc00da0fe51');
for(const r of parent.sourceRows)assert.equal(hash(contain(parent.atlas,r.path)),r.sha256,r.path);
const free=()=>{const d=fs.statfsSync('G:/');return d.bavail*d.bsize;};assert(free()>parent.sourceRows.reduce((n,r)=>n+r.bytes,0)+512*1048576);
fs.mkdirSync(stage,{recursive:true});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
assert.equal(git('-C',parent.atlas,'rev-parse','HEAD'),parent.parentHead);
git('clone','--shared','--no-checkout','--',parent.atlas,atlas);git('-C',atlas,'config','--local','core.autocrlf','false');git('-C',atlas,'read-tree','HEAD');
for(const r of parent.sourceRows){assert(free()>r.bytes+512*1048576);const to=contain(atlas,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(contain(parent.atlas,r.path),to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),r.sha256);}
for(const r of changes){const to=contain(atlas,r.path);if(r.beforeSha256)assert.equal(hash(to),r.beforeSha256);else assert(!fs.existsSync(to));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(r.from,to);assert.equal(hash(to),r.sha256);expected.set(r.path,r.sha256);}
assert.equal(expected.size,6490);
fs.symlinkSync(fs.realpathSync.native(parent.atlas+'/node_modules'),atlas+'/node_modules','junction');fs.mkdirSync(stage+'/temp');
const ts=createRequire(atlas+'/package.json')('typescript'),config=ts.readConfigFile(atlas+'/tsconfig.json',ts.sys.readFile);assert(!config.error);const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,atlas);assert.equal(parsed.errors.length,0);const names=new Set(parsed.fileNames.map(p=>path.resolve(p)));for(const r of changes.filter(r=>r.path.startsWith('scripts/fixtures/')))assert(!names.has(path.resolve(atlas,r.path)));
const results=[];
for(const script of ['scripts/test-limbic-quiz.mjs','scripts/test-quick-check-choice-order.mjs','scripts/test-structure-quick-check.mjs']){
 const args=script.includes('limbic')?['--test','--test-reporter=tap',script]:[script];
 const run=spawnSync(process.execPath,['--max-old-space-size=96',...args],{cwd:atlas,windowsHide:true,encoding:'utf8',maxBuffer:1048576,env:{...process.env,TEMP:stage+'/temp',TMP:stage+'/temp',VM_ATLAS_SOURCE_ROOT:atlas}});const log=stage+'/'+path.basename(script)+'.log';fs.writeFileSync(log,(run.stdout??'')+(run.stderr??''),{flag:'wx'});results.push({script,exitCode:run.status,signal:run.signal,log,sha256:hash(log)});assert.equal(run.status,0,script+' failed; see '+log);assert.equal(run.signal,null);
}
for(const[p,h]of expected)assert.equal(hash(atlas+'/'+p),h,p);for(const r of parent.sourceRows)assert.equal(hash(parent.atlas+'/'+r.path),r.sha256,r.path);
const sourceRows=[...expected].sort(([a],[b])=>a.localeCompare(b)).map(([p,h])=>({path:p,sha256:h,bytes:fs.statSync(atlas+'/'+p).size}));
const prep={schema:'vm-integrated-quiz-native/1',at:new Date().toISOString(),atlas,parent:{path:parentFile,sha256:hash(parentFile)},parentHead:parent.parentHead,sourceRows,sourceFiles:sourceRows.length,changes,proposals,focusedTests:results,fixtureInputsExcluded:3,fullTypesPassed:false,allOtherParentSourceExact:true,publicAssetsUnchanged:true,stockGenerationPending:true,fullBuildPassed:false,installed:false,ownerPreviewChanged:false,note:'New exact proposal component regression occupies the existing stock test path; no duplicate component test is added. Original test fixture remains plain text.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({stage,sourceFiles:6490,changedFiles:9,focusedTests:results.map(r=>({script:r.script,exitCode:r.exitCode})),preparationSha256:hash(stage+'/PREPARATION.json')}));
