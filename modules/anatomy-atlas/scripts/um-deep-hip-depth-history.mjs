import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
// Exact completed deep-hip teaching epoch. Later independent foot depth must
// not rewrite that transition or silently alter its accepted test inputs.
export const umDeepHipDepthMilestone='05596d396d104a65cdd7a1fdf770505c3dfb3139';
export const umDeepHipDepthMilestoneText=path=>execFileSync('git',['show',umDeepHipDepthMilestone+':'+path],{encoding:'utf8',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
export function umDeepHipDepthMilestonePlugin(){return {name:'exact-saved-deep-hip-depth',setup(api){
 for(const path of ['content/um-limb-teaching.ts','content/um-limb-teaching-bindings.v1.json','content/um-calf-depth.ts','content/body-renderer-revision.json','lib/specimen-review-material.ts','lib/specimen-review.ts','lib/specimen-depth-scope.ts','lib/um-proximal-guided-dissection.ts','lib/um-distal-guided-dissection.ts','lib/um-limb-guided-dissection.ts'])
  api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:execFileSync('git',['show',umDeepHipDepthMilestone+':'+path],{encoding:'utf8',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
}};}
