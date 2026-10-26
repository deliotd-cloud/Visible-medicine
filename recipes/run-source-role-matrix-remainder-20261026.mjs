import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {finished} from 'node:stream/promises';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded} from './run-small-native-task-guarded-20261025.mjs';

const directory='F:/VisibleMedicine/staging/20261026-authentic-role-matrix-remainder';
const triagePath='F:/VisibleMedicine/staging/20261026-first-shard-failure-triage/TRIAGE.json';
const triageSha='a45fb6af530a19e24de9c7fd09eb9b20950afd735e50490d40cb8d4bf55bcae2';
const sourcePath='F:/VisibleMedicine/staging/20261026-local-reference-inbox-v3/SOURCE_CANDIDATE.json';
const sourceSha='f5606522b5c87ec40a8f75c76fa47aad6da672cb073542729595ca2c8203292f';
const counters=['tests','pass','fail','cancelled','skipped','todo'];
const expectedCounts=[4,4,5,1,1,1,1,4,12];
const expectedRoots=['adjacent-clinical-source-roles.test.mjs','adjacent-current-tour-source-roles.test.mjs','adjacent-shoulder-source-roles.test.mjs','arterial-epoch-preservation.test.mjs','atlas-arterial-evidence-limits.test.mjs','atlas-cervical-projection-xray.test.mjs','atlas-current-history-wave4-contract.test.mjs','atlas-deep-brain-practice.test.ts','atlas-delivery-access-sql.test.mjs'];
assert.equal(hash(triagePath),triageSha);assert.equal(hash(sourcePath),sourceSha);
const triage=json(triagePath),source=json(sourcePath);
const git=(root,...args)=>execFileSync('git',['--no-replace-objects','-C',root,...args],{windowsHide:true,encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).trim();
function verifySource(s){for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);for(const d of s.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}assert.equal(git(s.atlas,'rev-parse','HEAD'),s.atlasHead);assert.equal(git(s.atlas,'status','--porcelain'),'');}
function verifyArtifacts(group){for(const r of triage.contextCandidateMap.checkedArtifacts[group])assert.equal(hash(r.path),r.sha256,r.path);}
function parseTap(text,expected){const count={};for(const k of counters){const m=[...text.matchAll(new RegExp('^# '+k+' (\\d+)\\r?$','gm'))];assert.equal(m.length,1,'One outer '+k+' footer');count[k]=Number(m[0][1]);}assert.equal(count.tests,expected,'Every original parent case executes');assert.equal([...text.matchAll(/^TAP version 13\r?$/gm)].length,1);const plan=[...text.matchAll(/^1\.\.(\d+)\r?$/gm)];assert.equal(plan.length,1);assert.equal(Number(plan[0][1]),expected);const points=[...text.matchAll(/^(?:not )?ok (\d+)(?:\s|$)/gm)];assert.deepEqual(points.map(m=>Number(m[1])),Array.from({length:expected},(_,i)=>i+1));return count;}
function lane(index){const name=expectedRoots[index],row=triage.rows.find(r=>r.root==='tests/'+name);assert(row?.contextGroup);assert.equal(hash(source.website+'/'+row.root),row.rootSha256);let site=source.website,atlas=source.atlas,role='current collector; explicit historical operands';if(name==='adjacent-shoulder-source-roles.test.mjs'){site=triage.role727.website;atlas=triage.role727.atlas;role='unchanged whole original727 role; no currenta01 credit';assert.equal(hash(site+'/'+row.root),row.rootSha256);}return {index,row,site,atlas,role,expected:expectedCounts[index]};}
if(process.argv[2]==='child'){
 const n=Number(process.argv[3]);assert(Number.isInteger(n)&&n>=0&&n<9);const l=lane(n),evidence=directory+'/roots/'+String(n+1).padStart(2,'0');fs.mkdirSync(evidence,{recursive:true});verifyArtifacts(l.row.contextGroup);
 if(n===2){assert.equal(hash(triage.role727.sourceReceipt.path),triage.role727.sourceReceipt.sha256);verifySource(json(triage.role727.sourceReceipt.path));}
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(path|systemroot|windir|comspec|pathext|temp|tmp|os|processor_architecture|number_of_processors)$/i.test(k)));
 Object.assign(env,{NODE_OPTIONS:'--max-old-space-size=768',GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',NO_COLOR:'1',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',VM_ATLAS_SOURCE_REPO:l.atlas,ATLAS_SOURCE_REPO:l.atlas,...triage.contextCandidateMap.env[l.row.contextGroup]});
 const out=fs.createWriteStream(evidence+'/raw.tap',{flags:'wx'}),err=fs.createWriteStream(evidence+'/stderr.log',{flags:'wx'});
 const args=['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',l.row.root];
 const child=spawn(process.execPath,args,{cwd:l.site,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);fs.writeFileSync(evidence+'/HANDLE.json',JSON.stringify({pid:child.pid,parentPid:process.pid,args,site:l.site,role:l.role,env},null,2)+'\n',{flag:'wx'});
 let error;child.once('error',e=>error=String(e));const terminal=await new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal,error:error??null})));await Promise.all([finished(out),finished(err)]);
 let counts=null,validationError=null;try{assert.equal(hash(l.site+'/'+l.row.root),l.row.rootSha256);verifyArtifacts(l.row.contextGroup);if(n===2)verifySource(json(triage.role727.sourceReceipt.path));counts=parseTap(fs.readFileSync(evidence+'/raw.tap','utf8'),l.expected);}catch(e){validationError=String(e);}
 const passing=terminal.code===0&&!terminal.signal&&!terminal.error&&!validationError&&counts?.pass===l.expected&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0;
 const result={at:new Date().toISOString(),root:l.row.root,sourceSha256:l.row.rootSha256,role:l.role,site:l.site,terminal,counts,validationError,passing,tap:{path:evidence+'/raw.tap',sha256:hash(evidence+'/raw.tap')},wholeOriginalRootExecuted:true,originalDiagnosticCountsUnchanged:true,noCurrentA01HistoricalCredit:true};fs.writeFileSync(evidence+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({root:l.row.root,passing,counts,validationError}));process.exitCode=passing?0:1;
}else{
 assert.equal(process.argv.length,2);assert(!fs.existsSync(directory));verifySource(source);fs.mkdirSync(directory);const before=json('CURRENT_CHECKPOINT.json');assert.deepEqual(before.activeWork.current.activeExecutionSessions,[]);assert.equal(before.activeWork.current.ownerPreviewPolicy.restartPermitted,false);before.activeWork.current.activeExecutionSessions=[{kind:'authentic-role-matrix-four-remaining-whole-roots',driverPid:process.pid,evidence:directory,sourceSha256:sourceSha}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(before,null,2)+'\n');
 const results=[];try{for(let n=5;n<9;n++){const l=lane(n);global.gc();const run=await guarded({site:source.website,dir:directory+'/guards/'+String(n+1).padStart(2,'0'),command:fs.realpathSync(import.meta.filename).replaceAll('\\','/')+' child '+n,heap:768,aggregate:2048,minimum:4096});const rp=directory+'/roots/'+String(n+1).padStart(2,'0')+'/RESULT.json',r=fs.existsSync(rp)?json(rp):null;results.push({root:l.row.root,run,receipt:r?{path:rp,sha256:hash(rp)}:null,counts:r?.counts??null,passing:run.passing&&r?.passing===true});console.log(JSON.stringify(results.at(-1)));if(run.process?.interrupted)break;}
 verifySource(source);const result={at:new Date().toISOString(),source:{path:sourcePath,sha256:sourceSha},triage:{path:triagePath,sha256:triageSha},results,passing:results.length===4&&results.every(r=>r.passing),outerCases:results.reduce((n,r)=>n+(r.counts?.tests??0),0),historicalChildCasesNotAdded:true,originalFirstShard:{roots:75,tests:237,pass:224,fail:13,skipped:0},wholeStockSuitePassing:false,normalPreviewChanged:false};fs.writeFileSync(directory+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:directory+'/RESULT.json',sha256:hash(directory+'/RESULT.json'),passing:result.passing,cases:result.outerCases}));process.exitCode=result.passing?0:1;
 }finally{const i=json('CURRENT_CHECKPOINT.json');assert.equal(i.activeWork.current.activeExecutionSessions[0]?.driverPid,process.pid);i.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');}
}
