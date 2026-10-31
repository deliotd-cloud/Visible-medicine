import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release23-main';let code=fs.readFileSync(root+'/check-head-candidate.mjs','utf8').replaceAll('20261031-head-clear-focus','20261031-head-clear-final');
assert.equal(code.split('const roots=').length,2);code=code.replace(/const roots=\[.*\];/,"const roots=['tests/head-layout-history-adapter.test.mjs','tests/head-toolbar-compact.test.mjs'];");fs.writeFileSync(root+'/check-head-final.mjs',code,{flag:'wx'});
