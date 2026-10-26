import fs from 'node:fs';import assert from 'node:assert/strict';
let s=fs.readFileSync('run-admitted-nine-root-lanes-20261026.mjs','utf8');
for(const [a,b]of [['20261026-nine-root-epoch-runner-v5-proposal','20261026-nine-root-epoch-runner-v6-proposal'],['51bb3425e632e659d99187065211a2b4b24236a1772fec6c4fbb306fba72e629','39b6caa5208c8c3379c1f82daf146a47263c31b5f699487f69e51de0219d11d2'],['bada9911bb222cd1bf9e8acc5418cf56175b49ee7ba01e0263ffccecb98ac33a','c8b714e06bbe67f14677732d2dcbc625154150f7af7f24168ba92a0f1aa21489']]){assert.equal(s.split(a).length,2);s=s.replace(a,b);}
fs.writeFileSync('run-admitted-nine-root-v6-lanes-20261026.mjs',s,{flag:'wx'});
