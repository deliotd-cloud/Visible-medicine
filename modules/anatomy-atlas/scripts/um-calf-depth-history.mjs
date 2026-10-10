import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';

// Freeze the already-saved calf milestone; its original before/after assertions
// remain intact when later independent regional depth is added. Current thigh
// tests separately verify the full live transition, including unchanged calf.
export const umCalfDepthMilestone='5acfa46b7fcef876fc2f55f8ed122de46b29bb03';
export const umCalfDepthMilestoneText=path=>execFileSync('git',['show',umCalfDepthMilestone+':'+path],{encoding:'utf8',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
export function umCalfDepthMilestonePlugin(){return {name:'exact-saved-calf-depth',setup(api){
 for(const path of ['content/um-limb-teaching.ts','content/um-limb-teaching-bindings.v1.json','content/um-calf-depth.ts','content/body-renderer-revision.json','lib/specimen-review-material.ts','lib/specimen-review.ts'])
  api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:umCalfDepthMilestoneText(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
 }};}
