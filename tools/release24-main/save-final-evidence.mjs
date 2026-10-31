import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {backup,read,json,runGit} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import {hash} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const recipes='G:/VisibleMedicine-temp/proposals/20261031-release24-main',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release24-progress',stage='G:/VisibleMedicine-temp/staging/20261031-release24-complete-repairs';
const ref=p=>({path:p,sha256:hash(p)}),write=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(b)?b:JSON.stringify(b,null,2)+'\n',{flag:'wx'});},copy=(a,b)=>{write(b,read(a));assert.equal(hash(a),hash(b));};
assert.equal(hash(stage+'/SOURCE.json'),'324a9f6be1bddc0befbda2b3fcda19a1dff32ebb10ce7e9f1f231d41ad1b821a');
const s=json(stage+'/SOURCE.json'),selected=new Map(),chain=['repairs','successor','final','regional','complete-repairs'];
for(const row of s.sourceRows)assert.equal(hash(s.website+'/'+row.path),row.sha256,row.path);
assert(json(stage+'/FOCUSED.json').result.passing);
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),s.websiteHead);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),s.atlasHead);
for(const suffix of chain){
 const dir='G:/VisibleMedicine-temp/staging/20261031-release24-'+suffix;
 for(const file of ['SOURCE.json','COMPOSITION.json','FOCUSED.json','focused-1/runner.stdout.log','focused-1/runner.stderr.log','focused-1/PROCESS-TERMINAL.json'])copy(dir+'/'+file,cp+'/verified/'+suffix+'/'+file);
 for(const r of json(dir+'/COMPOSITION.json').patches){assert(r.path.startsWith('tests/'));selected.set('website/'+r.path,s.website+'/'+r.path);}
}
for(const file of ['RESULT.json','checker.mjs','evidence/runner.stdout.log','evidence/runner.stderr.log','evidence/PROCESS-TERMINAL.json'])copy('G:/VisibleMedicine-temp/staging/20261031-release24-final/types-full-attempt-2/'+file,cp+'/verified/full-types/'+file);
copy(recipes+'/HRA_RESULT.json',cp+'/verified/HRA_RESULT.json');copy(stage+'/HISTORICAL_ENVIRONMENT.json',cp+'/verified/HISTORICAL_ENVIRONMENT.json');
for(const name of fs.readdirSync(recipes).filter(n=>n.endsWith('.mjs')))selected.set('tools/release24-main/'+name,recipes+'/'+name);
for(const [p,from]of selected){assert(p.startsWith('website/tests/')||p.startsWith('tools/release24-main/'));copy(from,cp+'/source-final/'+p);}
const baseline=json('G:/VisibleMedicine-temp/staging/20261031-head-clear-final/SOURCE.json'),typed=json('G:/VisibleMedicine-temp/staging/20261031-release24-final/SOURCE.json');
const changed=parent=>{const old=new Map(parent.sourceRows.map(r=>[r.path,r.sha256]));return s.sourceRows.filter(r=>old.get(r.path)!==r.sha256).map(r=>r.path).concat(parent.sourceRows.filter(r=>!s.sourceRows.some(n=>n.path===r.path)).map(r=>'removed:'+r.path));};
const buildDelta=changed(baseline),typesDelta=changed(typed);assert(buildDelta.every(p=>p.startsWith('tests/')));assert(typesDelta.every(p=>p.startsWith('tests/')&&/\.(mjs|json)$/.test(p)));
const proof={at:new Date().toISOString(),source:ref(stage+'/SOURCE.json'),sourceRows:s.sourceRows.length,protectedInputs:s.inputs,review:s.review,originalPartition23:{tests:267,pass:254,fail:13},finalFocused:{tests:6,pass:6,fail:0,skip:0},historicalHra:{tests:8,pass:8},arterialAndPelvicFollowup:{tests:5,pass:5},fullTypes:{receipt:ref(cp+'/verified/full-types/RESULT.json'),passing:true,source:ref('G:/VisibleMedicine-temp/staging/20261031-release24-final/SOURCE.json'),subsequentChangedPaths:typesDelta,exactCurrentSourceRerun:false},priorBuild:{receipt:ref('G:/VisibleMedicine-temp/staging/20261031-head-clear-final/website-build-1/RESULT.json'),subsequentChangedPaths:buildDelta,productFilesUnchanged:true},installed:false,wholeSuitePassing:false,clinicalApproval:false};
write(cp+'/VERIFIED_PROGRESS.json',proof);
const files=[...selected].map(([path,local])=>({path,sha256:hash(local),bytes:fs.statSync(local).size}));
const verifySource=()=>{for(const r of files)assert.equal(hash(selected.get(r.path)),r.sha256,r.path);};
const result=backup({root:recipes+'/github-final-recovery',repo:recipes+'/source-final-backup.git',branch:'backup/release24-final-checks-20261031',files,bytesFor:p=>read(selected.get(p)),sourceIdentity:{source:ref(stage+'/SOURCE.json'),review:s.review,websiteHead:s.websiteHead},scope:'Selected test repairs, historical/current-source proofs, and local verification recipes. Scoped source delta only; no scans, identifiers, model geometry, databases, secrets, generated runtime, or canonical Git ancestry. This backup is not release or clinical approval.',proof,verifySource});
assert(result.sourceBackupVerified);copy(recipes+'/github-final-recovery/github-backup.json',cp+'/github-final-backup.json');
console.log(JSON.stringify({saved:true,sourcePaths:files.length,backup:ref(cp+'/github-final-backup.json'),proof:ref(cp+'/VERIFIED_PROGRESS.json')}));
