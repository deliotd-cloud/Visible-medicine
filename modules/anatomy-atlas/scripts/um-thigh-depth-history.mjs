import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname,relative} from 'node:path';

// Exact saved ten-muscle milestone. Current deep-hip tests independently prove
// that these20 contexts and all24 calf contexts remain byte-exact in teaching.
export const umThighDepthMilestone='d5e5641e600eb6cfaf77ecde760cca81721e2c66';
const cache=new Map();
export function umThighDepthMilestoneText(path){
 if(!cache.has(path))cache.set(path,execFileSync('git',['show',umThighDepthMilestone+':'+path],{encoding:'utf8',windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return cache.get(path);
}
export function umThighDepthMilestonePlugin(){return {name:'exact-saved-thigh-depth',setup(api){
 api.onLoad({filter:/[\\/](?:app|lib|content)[\\/]/},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');
  if(!/^(?:app|lib|content)\//u.test(path)||path.split('/').includes('..'))return;
  assert(!path.includes('node_modules/'));
  return {contents:umThighDepthMilestoneText(path),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':path.endsWith('.ts')?'ts':'js',resolveDir:dirname(args.path)};
 });
 }};}
export function umThighDepthMilestoneRead(path,encoding){
 const name=String(path).replaceAll('\\','/');
 if(!/^(?:app|content|lib)\//u.test(name))return readFileSync(path,encoding);
 const text=umThighDepthMilestoneText(name);return encoding==='utf8'?text:Buffer.from(text);
}
