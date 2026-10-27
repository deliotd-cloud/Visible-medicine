import fs from 'node:fs';import assert from 'node:assert/strict';
let text=fs.readFileSync('run-head-selection-verification-20261027.mjs','utf8');
function replace(from,to){assert.equal(text.split(from).length,2,from);text=text.replace(from,to)}
replace('20261027-head-history-regression-website','20261027-guided-focus-website');
const start=text.indexOf('// The original eleven-root diagnostic'),end=text.indexOf('let command,heap');
text=text.slice(0,start)+"const roots=['tests/head-atlas-focus.test.ts','tests/head-guided-lifecycle.test.ts','tests/head-guided-parent-lifecycle.test.ts','tests/head-guided-steps.test.ts','tests/head-guided-playback.test.ts','tests/head-tour-playback.test.ts','tests/head-tour-playback-ui.test.ts','tests/head-tour-playback-parent.test.ts','tests/head-image-history.test.ts','tests/head-view-history-client.test.mjs','tests/head-unmapped-selection-history.test.ts','tests/head-native-history-current-transition.test.mjs','tests/desktop-learning-row-history.test.mjs','tests/drawable-epoch-current-admission.test.mjs'];\n"+text.slice(end);
replace("kind:'head-selection-history-'+phase","kind:'guided-focus-'+phase");
fs.writeFileSync('run-guided-focus-verification-20261027.mjs',text,{flag:'wx'});
