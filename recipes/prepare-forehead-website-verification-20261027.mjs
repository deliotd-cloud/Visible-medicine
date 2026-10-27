import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash} from './bounded-source-hash-20261026.mjs';
const proposal='F:/VisibleMedicine/staging/20261027-forehead-website-test-proposal/verify-forehead-website-content.mjs';
assert.equal(hash(proposal),'baf8fb8ae62694b0a459ba5138c5f892fef054c282a815ac17e93ac194b35ef4');
fs.copyFileSync(proposal,'verify-forehead-website-content-20261027.mjs',fs.constants.COPYFILE_EXCL);
let driver=fs.readFileSync('run-tongue-website-verification-20261026.mjs','utf8');
for(const[a,b]of [['20261026-tongue-website','20261027-forehead-nerve-us-website'],['verify-tongue-website-content-20261026.mjs','verify-forehead-website-content-20261027.mjs'],["kind:'tongue-website-'","kind:'forehead-website-'"]]){assert.equal(driver.split(a).length,2);driver=driver.replace(a,b);}
fs.writeFileSync('run-forehead-website-verification-20261027.mjs',driver,{flag:'wx'});
for(const p of ['verify-forehead-website-content-20261027.mjs','run-forehead-website-verification-20261027.mjs'])execFileSync(process.execPath,['--check',p],{windowsHide:true});
console.log(JSON.stringify({prepared:true,workerProposalExact:true,focusedWholeRoots:6}));
