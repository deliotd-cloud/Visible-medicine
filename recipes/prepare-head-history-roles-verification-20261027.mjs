import fs from 'node:fs';import assert from 'node:assert/strict';
let text=fs.readFileSync('run-head-selection-verification-20261027.mjs','utf8');
function replace(from,to){assert.equal(text.split(from).length,2,from);text=text.replace(from,to)}
replace('20261027-head-history-regression-website','20261027-head-history-roles-website');
replace("assert(['tests','types','build'].includes(phase))","assert(['tests','types'].includes(phase))");
const start=text.indexOf('// The original eleven-root diagnostic'),end=text.indexOf('let command,heap');
text=text.slice(0,start)+"const roots=['tests/head-native-history-current-transition.test.mjs','tests/desktop-learning-row-history.test.mjs','tests/drawable-epoch-current-admission.test.mjs'];\n"+text.slice(end);
replace('counts.tests>=10','counts.tests>=5');
replace("kind:'head-selection-history-'+phase","kind:'head-history-roles-'+phase");
fs.writeFileSync('run-head-history-roles-verification-20261027.mjs',text,{flag:'wx'});
