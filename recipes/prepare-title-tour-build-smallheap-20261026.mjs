import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261025-regional-title-native';
const dir=stage+'/checks/build-largejob-admission-refused';assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(dir+'/RESULT.json',JSON.stringify({at:new Date().toISOString(),passing:false,admitted:false,availableMiB:4943,requiredMiB:6144,jobMiB:4096,systemReserveMiB:2048,actualBuildStarted:false,sourceUnchanged:true,observation:'Actual memoryGate stdout and terminal exit1; supervisor was not launched.',ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
let s=fs.readFileSync('build-title-tour-native-20261025.mjs','utf8');
for(const[a,b]of [['build-low-memory-attempt-1','build-smallheap-attempt-1'],['build-stock-low-memory.mjs','build-stock-smallheap.mjs'],['--max-old-space-size=1024','--max-old-space-size=768'],['heap:1024,aggregate:3072','heap:768,aggregate:3072']]){assert(s.includes(a));s=s.replaceAll(a,b);}
// Admission precedes create-only runner materialization, allowing an honest no-launch refusal.
const pos=s.indexOf("const script=stage+'/build-stock-smallheap.mjs';");assert(pos>=0);
s=s.slice(0,pos)+"const {memoryGate}=await import('./native-website-integration-stage-20261025.mjs');memoryGate(5120);"+s.slice(pos);
fs.writeFileSync('build-title-tour-native-smallheap-20261026.mjs',s,{flag:'wx'});
const original=json(stage+'/BUILD_RETRY_RATIONALE.json');
fs.writeFileSync(stage+'/BUILD_SMALLHEAP_RATIONALE.json',JSON.stringify({at:new Date().toISOString(),prior:{path:stage+'/BUILD_RETRY_RATIONALE.json',sha256:hash(stage+'/BUILD_RETRY_RATIONALE.json')},largerJobRefusal:{path:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json')},reason:'Available RAM does not currently admit4GiB aggregate plus2GiB reserve. A768MiB V8 heap may reduce the near-limit3GiB peak. Cause remains unclassified; preserve any new failure.',priorPeakPrivateMiB:original.sampledPeakAggregatePrivateMiB,heapMiB:768,aggregateMiB:3072,admissionMiB:5120,reserveMiB:2048,commitCeilingPercent:90,sameStockBuildAndHooks:true,sourceAndDependenciesUnchanged:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:true,driver:'build-title-tour-native-smallheap-20261026.mjs',sourceUnchanged:true}));
