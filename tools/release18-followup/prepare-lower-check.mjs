import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release18-main';
let code=fs.readFileSync(root+'/check-followup.mjs','utf8');
code=code.replaceAll('20261031-release18-followup','20261031-release18-final').replace('3ec8df9072c64c1e72f69313e94e6b8e81ecbb72c287df00f5a724e1a1140c43','bbebe31d1d2b296937a02d773fd3a09164d2c4ede68f46e52eb5c254321cde02');
const start=code.indexOf('const roots=['),end=code.indexOf(';\nconst result=',start);assert(start>0&&end>start);
const roots=JSON.parse(fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-release18-lower/MANIFEST.json')).focusedRoots;assert.equal(roots.length,4);
code=code.slice(0,start)+'const roots='+JSON.stringify(roots)+code.slice(end);
fs.writeFileSync(root+'/check-lower.mjs',code,{flag:'wx'});console.log('Prepared lower native checks; launch only after current partition ends.');
