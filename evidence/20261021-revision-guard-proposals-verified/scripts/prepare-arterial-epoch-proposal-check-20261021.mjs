import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/staging/20261021-source190-website/website';
const stage='F:/VisibleMedicine/staging/20261021-arterial-history-epoch-proposal';
const proposed=stage+'/tests/arterial-history-preservation.test.mjs';
assert.equal(sha(read(proposed)),'df883d11222ff04c055769a7f6eca5526e0bbf16031cd5e974e2585aa4ee8fb4');
const files=[
 ['tests/atlas-arterial-evidence-limits.test.mjs','840d4ecb8bef4c4bf725f1cecd39fa6e53dfa9a7c4d2922a750851509806451a','tests/atlas-arterial-evidence-limits.test.mjs'],
 ['tests/fixtures/atlas-arterial-evidence-limits-before-current-admission.txt','b15cda66fe97f25d6a6a61126f14e87e1f4c7a30d31a27f03ae42fd7238e9c15','tests/fixtures/atlas-arterial-evidence-limits-before-current-admission.txt'],
 ['tests/arterial-history-preservation.test.mjs','5333cc9866b6d7bbf84d3c3790d8012cd9189f1639030f6812e62c9f56225225','preimages/arterial-history-preservation.test.mjs'],
];
const copies=[];
for(const [p,expected,to]of files){
 const b=read(site+'/'+p);assert.equal(sha(b),expected,p);assert(b.length<100000&&!b.includes(0));
 const target=stage+'/'+to;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b,{flag:'wx'});
 copies.push({source:p,path:to,bytes:b.length,sha256:expected});
}
const native='F:/VisibleMedicine/staging/20261021-source190-website/website/.local/website-test-runs/2026-10-21T05-37-11-497Z-a5ab569e-0361-46d1-91d6-64fd8586c1c0';
assert(!fs.existsSync(native+'/receipt.json'),'Use terminal suite state if it has already completed');
const started=json(native+'/started.json');assert.equal(started.runnerPid,263984);
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({stage,site:stage,atlas:'F:/VisibleMedicine/staging/20261021-atlas-combined-source',
 actualCandidate:site,source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',copies,
 purpose:'One isolated lightweight Node/FS/string history-guard case only; no imported project resolver, geometry or build. The live full-suite candidate and its source remain untouched.',
 candidateEdited:false,privateDataCopied:false,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,copies:copies.length,candidateEdited:false,isolatedLightweightGuardOnly:true}));
