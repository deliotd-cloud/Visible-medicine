import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const from='run-find-keyboard-website-verification-20261027.mjs',to='run-cardiac-imaging-website-verification-20261027.mjs';
let s=fs.readFileSync(from,'utf8').replaceAll('find-keyboard','cardiac-imaging');
const start=s.indexOf('const roots=['),end=s.indexOf('\nlet command',start);assert(start>0&&end>start);
const roots=['tests/clinical-review-integration.test.ts','tests/clinical-review-model-inspection.test.mjs','tests/atlas-body-learning-component.test.mjs','tests/atlas-on-demand-teaching.test.ts','tests/clinical-review-inbox-link-context.test.mjs','tests/atlas-issue-integration.test.mjs','tests/lecture-body-preservation.test.mjs','tests/lecture-save-preservation.test.mjs','tests/lecture-context-editor.test.mjs'];
s=s.slice(0,start)+'const roots='+JSON.stringify(roots)+';'+s.slice(end);fs.writeFileSync(to,s,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});console.log(JSON.stringify({prepared:to,roots:roots.length}));
