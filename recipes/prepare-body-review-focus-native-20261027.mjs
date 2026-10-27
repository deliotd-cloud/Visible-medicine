import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
let text=fs.readFileSync('prepare-pharyngeal-mri-native-20261027.mjs','utf8');
for(const[a,b]of [['20261027-pharyngeal-mri-native','20261027-body-review-focus-native'],['a28d03acf07da97a927073d4794abf3b5ce907f7','a4d349d10feab2210b937441ac2ff7dace717ac6']]){assert(text.includes(a));text=text.replaceAll(a,b);}
const out='prepare-body-review-focus-native-stage-20261027.mjs';fs.writeFileSync(out,text,{flag:'wx'});
execFileSync(process.execPath,['--check',out],{windowsHide:true});
