import {spawnSync} from 'node:child_process';
const tests=['atlas-runtime-expansion-binding.test.mjs','clinical-review-nasal-bone-surface-imaging.test.ts','colic-fa1-historical-closure.test.mjs','current-atlas-delivery-help-transition.test.mjs'].map(p=>'tests/'+p);
const r=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',...tests],{cwd:'G:/VisibleMedicine-temp/staging/20261031-release-partition5/website',stdio:'inherit',windowsHide:true,env:process.env});
if(r.error)throw r.error;if(r.signal)throw Error(r.signal);process.exitCode=r.status===0?0:1;
