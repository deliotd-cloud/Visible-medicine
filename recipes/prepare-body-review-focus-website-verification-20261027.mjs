import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
let text=fs.readFileSync('run-pharyngeal-website-verification-20261027.mjs','utf8');
for(const [a,b] of [['20261027-pharyngeal-mri-website','20261027-body-review-focus-website'],['verify-pharyngeal-website-content-20261027.mjs','verify-body-review-focus-website-content-20261027.mjs'],["kind:'pharyngeal-website-'","kind:'body-review-focus-website-'"]]){assert(text.includes(a));text=text.replaceAll(a,b);}
fs.writeFileSync('run-body-review-focus-website-verification-20261027.mjs',text,{flag:'wx'});execFileSync(process.execPath,['--check','run-body-review-focus-website-verification-20261027.mjs'],{windowsHide:true});
