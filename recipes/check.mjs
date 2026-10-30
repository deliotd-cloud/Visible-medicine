import fs from 'node:fs';
import assert from 'node:assert/strict';
import { guarded } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-quick-review',site=root+'/website',phase=process.argv[2],attempt=Number(process.argv[3]??1);
assert(Number.isSafeInteger(attempt)&&attempt>0);
assert(['focused','types','build'].includes(phase));
let command,heap=1536,aggregate=2048,minimum=4096;
if(phase==='focused') {
  const tests=fs.readdirSync(site+'/tests').filter(p=>/^clinical-review-(inbox|quick-start).*\.test\.mjs$/.test(p)).sort();
  fs.writeFileSync(root+'/FOCUSED_ROOTS-'+attempt+'.json',JSON.stringify(tests,null,2)+'\n',{flag:'wx'});
  command='--test --test-concurrency=1 --test-reporter=tap '+tests.map(p=>'tests/'+p).join(' ');
} else {
  const out=root+'/'+phase+'-full-attempt-'+attempt;fs.mkdirSync(out);
  const source=phase==='types'?'G:/VisibleMedicine-temp/staging/20261029-combined-website-full-types/types-full-attempt-1/checker.mjs':'F:/VisibleMedicine/staging/20261030-release-validation/website-build.mjs';
  fs.copyFileSync(source,out+'/checker.mjs',fs.constants.COPYFILE_EXCL);
  command=out+'/checker.mjs';heap=phase==='types'?3072:1536;aggregate=3584;minimum=5632;
}
const result=await guarded({site,dir:root+'/checks/'+phase+'-attempt-'+attempt,command,heap,aggregate,minimum,extraEnv:{TEMP:root,TMP:root,VM_ATLAS_SOURCE_REPO:'G:/VisibleMedicine-temp/staging/20261029-mandible-combined-native/atlas'}});
fs.writeFileSync(root+'/'+phase.toUpperCase()+'_RESULT-'+attempt+'.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({phase,passing:result.passing}));process.exitCode=result.passing?0:1;
