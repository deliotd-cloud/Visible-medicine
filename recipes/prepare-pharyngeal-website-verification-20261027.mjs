import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash} from './bounded-source-hash-20261026.mjs';
const proposal='F:/VisibleMedicine/staging/20261027-pharyngeal-website-test-proposal/verify-pharyngeal-website-content-20261027.mjs';
assert.equal(hash(proposal),'1042d48aa8982aabf74e8c6b86fd26a8d6efccc41bbee5e05fd6be452bb1d162');
fs.copyFileSync(proposal,'verify-pharyngeal-website-content-20261027.mjs',fs.constants.COPYFILE_EXCL);
let driver=fs.readFileSync('run-forehead-website-verification-20261027.mjs','utf8');
for(const[a,b]of [['20261027-forehead-nerve-us-website','20261027-pharyngeal-mri-website'],['verify-forehead-website-content-20261027.mjs','verify-pharyngeal-website-content-20261027.mjs'],["kind:'forehead-website-'","kind:'pharyngeal-website-'"]]){assert.equal(driver.split(a).length,2);driver=driver.replace(a,b);}
fs.writeFileSync('run-pharyngeal-website-verification-20261027.mjs',driver,{flag:'wx'});
for(const p of ['verify-pharyngeal-website-content-20261027.mjs','run-pharyngeal-website-verification-20261027.mjs'])execFileSync(process.execPath,['--check',p],{windowsHide:true});
console.log(JSON.stringify({prepared:true,workerProposalExact:true,focusedWholeRoots:6}));
