import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const old='G:/VisibleMedicine-temp/staging/20261031-release-partition9-ready',root='G:/VisibleMedicine-temp/staging/20261031-release-partition9-title-ready';
const oldSource='70e03cd8861bfd818b124d95beb358198495cd3948b0584df0a5b166e61bc1fb';
if(process.argv[2]!=='finish'){
 for(const name of ['compose.mjs','focused.mjs']){let text=fs.readFileSync(old+'/'+name,'utf8').replaceAll(old,root);
  if(name==='compose.mjs')text=text.replaceAll('97e13cb09ebfd3efb5d83735b6a1395b60a2c3769a5b9ce7e546f521e86dcc4b','80a610d494949b964ad4be4fbc29cd14e313cd22a8d0618dee6f83108fdf794b');
  fs.writeFileSync(root+'/'+name,text,{flag:'wx'});
 }
}else{
 const source=hash(root+'/SOURCE.json');
 for(const name of ['prepare-queue.mjs','save.mjs']){
  let text=fs.readFileSync(old+'/'+name,'utf8').replaceAll(old,root).replaceAll(oldSource,source).replaceAll('70e03cd8',source.slice(0,8));
  if(name==='save.mjs'){
   const marker="const at=new Date().toISOString();write(cp+'/INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));";
   assert(text.includes(marker));
   text=text.replace(marker,marker+"\nwrite(cp+'/PRIOR_FOCUSED_FAILURE.json',read('"+old+"/FOCUSED_RESULT.json'));\nwrite(cp+'/prior-failure/runner.stdout.log',read('"+old+"/focused/runner.stdout.log'));\n");
   text=text.replace("['compose.mjs','focused.mjs','prepare-queue.mjs','release-queue.mjs','save.mjs']","['prepare.mjs','compose.mjs','focused.mjs','prepare-queue.mjs','release-queue.mjs','save.mjs']");
  }
  fs.writeFileSync(root+'/'+name,text,{flag:'wx'});
 }
 console.log(JSON.stringify({source}));
}
