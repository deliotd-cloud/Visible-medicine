import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
let text=fs.readFileSync('run-tongue-website-verification-20261026.mjs','utf8');
text=text.replaceAll('20261026-tongue-website','20261027-coccygeus-website').replaceAll('verify-tongue-website-content-20261026.mjs','verify-coccygeus-website-content-20261027.mjs').replaceAll("kind:'tongue-website-'+phase","kind:'coccygeus-website-'+phase");
const start=text.indexOf('const roots=['),end=text.indexOf('let command,heap',start);assert(start>=0&&end>start);
const roots=['tests/clinical-review-integration.test.ts','tests/clinical-review-model-inspection.test.mjs','tests/atlas-body-learning-component.test.mjs','tests/atlas-issue-integration.test.mjs','tests/clinical-review-inbox-link-context.test.mjs','tests/atlas-on-demand-teaching.test.ts','tests/regional-tour-entry-delivery.test.mjs','tests/atlas-tour-completion.test.mjs','tests/head-native-history-current-transition.test.mjs','tests/desktop-learning-row-history.test.mjs','tests/drawable-epoch-current-admission.test.mjs'];
text=text.slice(0,start)+'const roots='+JSON.stringify(roots)+';\n'+text.slice(end);
fs.writeFileSync('run-coccygeus-website-verification-20261027.mjs',text,{flag:'wx'});execFileSync(process.execPath,['--check','run-coccygeus-website-verification-20261027.mjs'],{windowsHide:true});
console.log(JSON.stringify({wholeRoots:roots.length,fullTypesAndBuild:true}));
