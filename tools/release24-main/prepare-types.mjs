import fs from 'node:fs';import assert from 'node:assert/strict';
const work='G:/VisibleMedicine-temp/proposals/20261031-release24-main';
let code=fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-release23-main/check-final-types.mjs','utf8');
code=code.replaceAll('20261031-head-clear-final','20261031-release24-successor').replace('76bc03dce3e3cd5ac0420f67a6bc1aed48dff24edd4efc9a815195addd139bff','95c8c8e702868a6b051b2289f34a23753854ad1d73605cbb4bb073a0c6887382');
const before="assert(json('G:/VisibleMedicine-temp/staging/20261031-release21-final/verification-twentytwo/STATE.json').terminal);";
assert.equal(code.split(before).length,2);code=code.replace(before,"assert(json(stage+'/FOCUSED.json').result.process.terminalObserved);assert(json('G:/VisibleMedicine-temp/staging/20261031-release24-repairs/FOCUSED.json').result.process.terminalObserved);");
assert(code.includes('heap:3072,aggregate:3584,minimum:5632'));
fs.writeFileSync(work+'/check-types.mjs',code,{flag:'wx'});console.log('Prepared full unchanged-project TypeScript verification after both native test groups finish');
