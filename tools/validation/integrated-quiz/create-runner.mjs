import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const original='G:/VisibleMedicine-temp/staging/20261029-native-successor-generation/launch-contained-v6.mjs';
const bytes=fs.readFileSync(original);assert.equal(createHash('sha256').update(bytes).digest('hex'),'88fd89239cf02d5cb3f3f1efa84eb861eda865df6d66e9797bbdfd850705ced4');
const parts=bytes.toString().split("const exactSite='G:/VisibleMedicine-temp/staging/20261029-combined-native-successor/atlas';");assert.equal(parts.length,2);
const prefix=parts[0];
const tail=String.raw`
import path from 'node:path';
import {createRequire} from 'node:module';
const stage='G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-native',site=stage+'/atlas';
const root='G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-generation';
const save=(p,v)=>fs.writeFileSync(root+'/'+p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert.equal(hash('G:/VisibleMedicine-temp/staging/20261029-native-successor-generation/parse-supervisor.ps1'),'d17c4bea3a7a44315d166aa6c2c79971a56bb2999a81381f78b5f52dda14f0c7');
assert.equal(hash(stage+'/PREPARATION.json'),'4d95d5118e72c3dac24afaf6eab142a3699b5322bd88f6a2f5698d265da3b2f5');
const source=json(stage+'/PREPARATION.json');assert.equal(hash(source.parent.path),source.parent.sha256);
const parent=json(source.parent.path),expected=new Map(parent.sourceRows.map(r=>[r.path,r.sha256]));
for(const r of source.changes){assert.equal(expected.get(r.path)??null,r.beforeSha256);expected.set(r.path,r.sha256);}
assert.equal(expected.size,6490);assert.deepEqual([...expected].sort(([a],[b])=>a.localeCompare(b)),source.sourceRows.map(r=>[r.path,r.sha256]).sort(([a],[b])=>a.localeCompare(b)));
const commands=[
 ['regional-write','scripts/regional-teaching-snapshots.mjs'],['regional-check','scripts/regional-teaching-snapshots.mjs --check'],
 ['display-write','scripts/generate-body-review-display-pins.mjs'],['display-check','scripts/generate-body-review-display-pins.mjs --check'],
 ['reviews-write','scripts/review-revisions.mjs'],['reviews-check','scripts/review-revisions.mjs --check'],
 ['renderer-write','scripts/body-renderer-revisions.mjs'],['renderer-check','scripts/body-renderer-revisions.mjs --check'],
 ['nested-write','scripts/generate-nested-review-bindings.mjs'],['nested-check','scripts/generate-nested-review-bindings.mjs --check'],
];
const permitted=new Set([...expected.keys()].filter(p=>p.startsWith('content/regional-teaching/')&&p.endsWith('.json')));
for(const p of ['lib/regional-teaching-imports.ts','content/body-review-display-pins.json','content/review-revisions.json','content/body-renderer-revision.json','content/nested-review-bindings.json'])permitted.add(p);
const pinnedResumeReceipts=Object.freeze([]);
const prior=[];
for(const [attempt,command]of commands){
 const f=root+'/'+attempt+'/RESULT.json';if(!fs.existsSync(f))break;
 const pin=pinnedResumeReceipts.find(r=>r.attempt===attempt);assert(pin&&/^[a-f0-9]{64}$/.test(pin.sha256),'Existing step requires an independently verified resume pin: '+attempt);assert.equal(hash(f),pin.sha256);
 const r=json(f);assert(r.passing&&r.command===command&&r.supervisor?.code===0&&r.process?.terminalObserved&&r.process.exitCode===0&&!r.process.interrupted);
 const seen=new Set();for(const row of r.generated){assert(permitted.has(row.path)&&expected.has(row.path)&&!seen.has(row.path));seen.add(row.path);assert.equal(expected.get(row.path),row.beforeSha256);assert(/^[a-f0-9]{64}$/.test(row.sha256));expected.set(row.path,row.sha256);}prior.push(attempt);
}
function validateRequest({site:requested,command,attempt}){assert.equal(requested,site);assert(commands.some(row=>row[1]===command));assert.match(attempt,/^[a-z][a-z0-9-]{1,63}$/);assert.equal(fs.realpathSync.native(site).replaceAll('\\','/').toLowerCase(),site.toLowerCase());return{site,command,dir:root+'/'+attempt};}
for(const[,command]of commands)validateRequest({site,command,attempt:'scope-check'});
for(const command of ['scripts/build-clinical-review-viewer.mjs','scripts/run-website-tests.mjs --run','scripts/regional-teaching-snapshots.mjs; whoami'])assert.throws(()=>validateRequest({site,command,attempt:'bad-command'}));
assert.throws(()=>validateRequest({site:'F:/VisibleMedicine/atlas',command:commands[0][1],attempt:'bad-site'}));assert.throws(()=>validateRequest({site,command:commands[0][1],attempt:'../../escape'}));
function verifySource(){for(const[p,h]of expected){const file=site+'/'+p;assert.equal(fs.realpathSync.native(file).toLowerCase(),path.resolve(file).toLowerCase(),'Source escape: '+p);assert.equal(hash(file),h,p);}const extra=execFileSync('git',['-C',site,'ls-files','--others','--exclude-standard'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/).filter(Boolean);assert(extra.every(p=>expected.has(p)),'Unexpected source');}
const req=createRequire(site+'/package.json');
assert.equal(hash('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json'),'cbda14f0489c2c66474f1d8b47b7171aab52130ca68749fe78219773cf650f56');
const pinnedDependencies=json('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json').dependencyFiles;
const deps=[process.execPath,req.resolve('esbuild/package.json'),req.resolve('esbuild'),req.resolve('@esbuild/win32-x64/esbuild.exe'),req.resolve('typescript/package.json'),req.resolve('typescript')].map(p=>({path:fs.realpathSync.native(p),sha256:hash(p)}));assert.deepEqual(deps,pinnedDependencies);
assert(!json(site+'/tsconfig.json').extends);verifySource();
save('ADMISSION-'+Date.now()+'.json',{at:new Date().toISOString(),site,sourcePreparation:{path:stage+'/PREPARATION.json',sha256:hash(stage+'/PREPARATION.json')},sourceFiles:expected.size,dependencyFiles:deps,profileSha256:hash(process.argv[1]),nativeJobMiB:1024,heapMiB:384,minimumMiB:3072,freeFloorMiB:2048,prior,fullBuildPassed:false,installed:false});
console.log(JSON.stringify({verifiedSourceFiles:expected.size,dependencyFiles:deps.length,resumeAfter:prior}));
if(process.argv[2]==='--verify-only'){console.log(JSON.stringify({verified:true,generationStarted:false}));process.exit(0);}
async function run(request){const verified=validateRequest(request),lock=root+'/GENERATOR.lock',fd=fs.openSync(lock,'wx');try{fs.writeSync(fd,JSON.stringify({pid:process.pid,at:new Date().toISOString(),...verified}));fs.fsyncSync(fd);verifySource();for(const d of deps)assert.equal(hash(d.path),d.sha256);return await guarded({...verified,heap:384,aggregate:1024,minimum:3072,maxMinutes:10,extraEnv:{TEMP:root+'/temp',TMP:root+'/temp'}});}finally{fs.closeSync(fd);fs.unlinkSync(lock);}}
for(const[attempt,command]of commands){
 if(prior.includes(attempt))continue;
 let r;try{r=await run({site,attempt,command});}catch(e){save('REFUSAL-'+Date.now()+'.json',{at:new Date().toISOString(),attempt,command,message:e.message,memory:e.memory??null,minimum:e.minimum??null});console.log(JSON.stringify({stopped:true,attempt,message:e.message,memory:e.memory??null}));process.exitCode=75;break;}
 const changes=[];for(const[p,h]of expected){const current=hash(site+'/'+p);if(current!==h){assert(permitted.has(p),'Unexpected generator write: '+p);changes.push({path:p,beforeSha256:h,sha256:current,bytes:fs.statSync(site+'/'+p).size});}}
 const extra=execFileSync('git',['-C',site,'ls-files','--others','--exclude-standard'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/).filter(Boolean);assert(extra.every(p=>expected.has(p)));
 save(attempt+'/RESULT.json',{...r,at:new Date().toISOString(),command,generated:changes,fullBuildPassed:false,installed:false});console.log(JSON.stringify({attempt,passing:r.passing,changedFiles:changes.length,exit:r.process?.exitCode}));if(!r.passing){process.exitCode=1;break;}for(const row of changes)expected.set(row.path,row.sha256);
}
`;
const root='G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-generation';assert(!fs.existsSync(root));fs.mkdirSync(root+'/temp',{recursive:true});
fs.writeFileSync(root+'/launch-contained.mjs',prefix+tail,{flag:'wx'});
console.log(JSON.stringify({runner:root+'/launch-contained.mjs',sha256:createHash('sha256').update(prefix+tail).digest('hex')}));
