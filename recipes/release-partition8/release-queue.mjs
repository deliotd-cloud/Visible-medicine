import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition8-ready',pin=root+'/SOURCE.json',source=json(pin),site=source.website;
assert.equal(hash(pin),'1bd8a279d88605eb2b230e5df7ae27905ba64217f4761f43eafec23a990522a1');
const envFile='F:/VisibleMedicine/staging/20261030-release-repair-website/HISTORICAL_ENVIRONMENT_2.json';
assert.equal(hash(envFile),'bd5fc429483bc9cf7ba26ed5290b1c70bdd6e01cb74d8b9aa18b490dfae973f5');
assert(json('G:/VisibleMedicine-temp/staging/20261031-native-public-images-ready/RELEASE_QUEUE.json').terminal);
assert(json('G:/VisibleMedicine-temp/staging/20261031-head-focus-font-verified/BUILD_RESULT.json').process.terminalObserved);
const order=[...Array.from({length:25},(_,i)=>i+8),1,2,3,4,5,6];
const state={schema:'vm-frozen-release-queue/1',source:{path:pin,sha256:hash(pin)},at:new Date().toISOString(),coordinatorPid:process.pid,order,completed:[],current:null,terminal:false,wholeSuitePassing:false,requiredSeparateRerun:{partition:7,count:32,reason:'Historical spinal child requires3072MiB heap; prior2048MiB aggregate job exhausted memory. Re-run whole final-source partition7 at4096MiB aggregate only with6144MiB available, preserving2048MiB reserve. It is unresolved, not skipped or passed.'},configuration:{partition8:{heapMiB:1536,aggregateJobMiB:3072,minimumFreeMiB:5120},otherPartitions:{heapMiB:1024,aggregateJobMiB:2048,minimumFreeMiB:4096},minimumFreeMiB:4096,freeReserveMiB:2048,reason:'Sequential tests use the established smaller test job. This is independent of the failed full production compilation, not a reduced release gate.'}};
assert(!fs.existsSync(root+'/RELEASE_QUEUE.json'));fs.mkdirSync(root+'/tmp',{recursive:true});
const save=()=>fs.writeFileSync(root+'/RELEASE_QUEUE.json',JSON.stringify(state,null,2)+'\n');
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);};
try{
 for(const index of order){
  verify();const dir=root+'/partition-'+index;
  state.current={index,count:32,evidence:dir,started:new Date().toISOString()};save();console.log(JSON.stringify({partition:index,starting:true}));
  const result=await guarded({site,dir,command:'scripts/run-website-tests.mjs --run --partition '+index+'/32',heap:index===8?1536:1024,aggregate:index===8?3072:2048,minimum:index===8?5120:4096,extraEnv:{...json(envFile).environment,VM_CURRENT_SOURCE_RECEIPT:pin,VM_CURRENT_SOURCE_SHA256:hash(pin),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:site,TEMP:root+'/tmp',TMP:root+'/tmp'}});
  verify();const file=root+'/PARTITION_RESULT-'+index+'.json';fs.writeFileSync(file,JSON.stringify({...result,source:state.source,sourceUnchanged:true,partition:index,count:32,wholeSuitePassing:false},null,2)+'\n',{flag:'wx'});
  state.completed.push({index,passing:result.passing,result:{path:file,sha256:hash(file)}});state.current=null;save();console.log(JSON.stringify({partition:index,passing:result.passing}));
  if(!result.passing){state.stopReason='Partition failed; inspect terminal receipt before changing or retrying';process.exitCode=1;break;}
 }
 state.terminal=true;state.finished=new Date().toISOString();state.requiresAggregateReceiptAudit=true;save();
}catch(error){state.terminal=true;state.finished=new Date().toISOString();state.error=String(error);save();throw error;}
