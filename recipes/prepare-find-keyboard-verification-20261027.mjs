import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {hash} from './bounded-source-hash-20261026.mjs';
const from='run-tour-step-website-verification-20261027.mjs',to='run-find-keyboard-website-verification-20261027.mjs';
const s=fs.readFileSync(from,'utf8').replaceAll('20261027-tour-step-integrated-website','20261027-find-keyboard-website').replaceAll('verify-tour-step-website-content-20261027.mjs','verify-find-keyboard-website-content-20261027.mjs').replaceAll('tour-step-website-','find-keyboard-website-');
fs.writeFileSync(to,s,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});console.log(JSON.stringify({prepared:to,sha256:hash(to)}));
