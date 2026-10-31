import fs from 'node:fs';import assert from 'node:assert/strict';
const work='G:/VisibleMedicine-temp/proposals/20261031-release24-main';
let check=fs.readFileSync(work+'/check-final.mjs','utf8');
const a=check.indexOf('const roots=['),b=check.indexOf(';for(const r of roots)',a);assert(a>0&&b>a);check=check.slice(0,a)+`const roots=['tests/corpus-xray-v2-current-delivery.test.mjs']`+check.slice(b);check=check.replace("dir:root+'/focused-1'","dir:root+'/corpus-isolated-1'").replaceAll("root+'/FOCUSED.json'","root+'/CORPUS_ISOLATED.json'").replaceAll("root+'/FOCUSED.json'","root+'/CORPUS_ISOLATED.json'");fs.writeFileSync(work+'/check-corpus-isolated.mjs',check,{flag:'wx'});
let types=fs.readFileSync(work+'/check-types.mjs','utf8').replaceAll('20261031-release24-successor','20261031-release24-final').replace('95c8c8e702868a6b051b2289f34a23753854ad1d73605cbb4bb073a0c6887382','d263623090a6e6872c47da7d70c3f2402c32b8caf7adec2e89ebdf2cf7a2b10a');
fs.writeFileSync(work+'/check-final-types.mjs',types,{flag:'wx'});
console.log('Prepared isolated corpus and full final-source types checks');
