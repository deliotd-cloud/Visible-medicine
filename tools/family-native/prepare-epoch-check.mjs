import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-family-main';let code=fs.readFileSync(root+'/check.mjs','utf8');for(const [a,b]of [
 ['20261031-release14-family-ready','20261031-release14-family-epoch-ready'],
 ['focused-family-1','focused-epoch-1'],
 ["tests/closed56-femoral-epoch.test.mjs'","tests/closed56-femoral-epoch.test.mjs tests/closed56-current-role.test.mjs'"]
 ]){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}fs.writeFileSync(root+'/check-epoch.mjs',code,{flag:'wx'});
