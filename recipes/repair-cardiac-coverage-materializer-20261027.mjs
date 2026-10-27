import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const from='prepare-cardiac-imaging-coverage-20261027.mjs',to='prepare-cardiac-imaging-coverage-v3-20261027.mjs';let s=fs.readFileSync(from,'utf8');
function one(a,b){assert.equal(s.split(a).length,2);s=s.replace(a,b);}
one("const proposal='F:/VisibleMedicine/staging/20261027-cardiac-imaging-coverage-proposal';","const proposal='F:/VisibleMedicine/staging/20261027-cardiac-imaging-coverage-proposal-v3';");
one('].sort((a,b)=>b[0].length-a[0].length);',"].map(([a,b])=>[a.replaceAll(String.fromCharCode(92),'/'),b.replaceAll(String.fromCharCode(92),'/')]).sort((a,b)=>b[0].length-a[0].length);");
fs.writeFileSync(to,s,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});const r=execFileSync(process.execPath,[to],{windowsHide:true,encoding:'utf8'});console.log(r);
