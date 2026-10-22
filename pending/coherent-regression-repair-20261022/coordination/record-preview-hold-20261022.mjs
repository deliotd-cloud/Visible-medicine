import fs from 'node:fs';
import {json} from './source-only-backup-20261019.mjs';
const pointer=json('CURRENT_CHECKPOINT.json');
const policy={at:new Date().toISOString(),source:'Owner reply to call_f26fe6f3248e48bfb3a9733920eb57b8',
 instruction:'Keep the current preview unchanged',restartPermitted:false,ownerTabRefreshPermitted:false,
 websiteCutoverPermitted:false,goalPaused:false,isolatedDevelopmentPermitted:true,
 next:'Continue isolated development/testing and source recovery. Do not restart/install into the normal website or repeatedly ask for restart; wait for a new owner instruction.'};
pointer.activeWork.current.ownerPreviewPolicy=policy;
pointer.activeWork.current.beforeFurtherWork='Poll exact live native session14480; keep V5 immutable until actual172-root terminal. Normal website is explicitly held unchanged by owner. Diagnose later failures and select the24-repair plan; no second heavy job, normal-preview restart/cutover or tab refresh.';
pointer.activeWork.updated=policy.at;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify(policy));
