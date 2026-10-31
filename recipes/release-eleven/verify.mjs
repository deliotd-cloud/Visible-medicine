import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition11-repairs',pin=root+'/SOURCE.json',composition=json(root+'/COMPOSITION.json'),source=json(pin),site=source.website;
assert.equal(hash(pin),composition.source.sha256);assert.equal(source.parent.sha256,'cf3faf8f249686f28885eafe388e1d834608f09e9fd59bda49d133963d19c7a2');assert.equal(hash(source.historicalEnvironment.path),source.historicalEnvironment.sha256);
const extraRoots=['tests/head-teaching-review-recovery-lifecycle.test.ts','tests/native-head-toolbar-compact.test.mjs','tests/complete-release-five-followups-preservation.test.mjs','tests/atlas-body-learning-component.test.mjs'];
const runs=[{name:'adjacent',command:'--experimental-strip-types --test --test-concurrency=1 --test-reporter=tap '+extraRoots.join(' ')},{name:'partition-11',command:'scripts/run-website-tests.mjs --run --partition 11/32'}];
const state={at:new Date().toISOString(),coordinatorPid:process.pid,source:composition.source,current:null,completed:[],terminal:false,wholeSuitePassing:false,installed:false};
const save=()=>fs.writeFileSync(root+'/RUN_STATE.json',JSON.stringify(state,null,2)+'\n');assert(!fs.existsSync(root+'/RUN_STATE.json'));save();
const verify=()=>{assert.equal(hash(pin),composition.source.sha256);for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);};
const env={...json(source.historicalEnvironment.path).environment,VM_CURRENT_SOURCE_RECEIPT:pin,VM_CURRENT_SOURCE_SHA256:composition.source.sha256,VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:site,TEMP:root+'/tmp',TMP:root+'/tmp'};
try{
 for(const run of runs){
  verify();const dir=root+'/'+run.name;state.current={name:run.name,dir,started:new Date().toISOString()};save();console.log(JSON.stringify({starting:run.name}));
  const result=await guarded({site,dir,command:run.command,heap:1024,aggregate:2048,minimum:4096,extraEnv:env});verify();
  const output=fs.existsSync(dir+'/runner.stdout.log')?fs.readFileSync(dir+'/runner.stdout.log','utf8'):'';let counts=null;
  if(run.name==='adjacent'){
   counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...output.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];counts[key]=matches.length===1?Number(matches[0][1]):null;}
  }else if(output.trim().startsWith('{')){const receipt=json(JSON.parse(output).output+'/receipt.json');counts=receipt.counts;assert.equal(receipt.testInputDrift,false);assert.equal(receipt.publicPreviewAssetDrift,false);}
  const passed=result.passing&&counts?.tests>0&&counts.tests===counts.pass&&['fail','cancelled','skipped','todo'].every(key=>counts[key]===0);
  const file=root+'/'+run.name.toUpperCase()+'_RESULT.json';fs.writeFileSync(file,JSON.stringify({...result,passed,counts,at:new Date().toISOString(),source:composition.source,command:run.command,sourceUnchanged:true,wholeSuitePassing:false,installed:false},null,2)+'\n',{flag:'wx'});
  state.completed.push({name:run.name,passing:passed,result:{path:file,sha256:hash(file)}});state.current=null;save();console.log(JSON.stringify({finished:run.name,passing:passed,counts}));
  if(!passed){state.stopReason='Inspect this terminal result before source changes or rerun';process.exitCode=1;break;}
 }
 state.terminal=true;state.finished=new Date().toISOString();save();
}catch(error){state.terminal=true;state.finished=new Date().toISOString();state.error=String(error);save();throw error;}
