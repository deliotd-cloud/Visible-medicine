import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release18-main';let code=fs.readFileSync(root+'/check-initial.mjs','utf8');
code=code.replace('20261031-release18-initial','20261031-release18-combined').replace('e82ff1d95774fc56c2c376f1d86e0a3ea2754592b663fbfbeec178a67266372b','0d00a5413e4c9d6aff5dcfa6e37762fdf88750274dad473833d027278d933e60');
const start=code.indexOf('const roots='),end=code.indexOf('\nconst result=',start);assert(start>0&&end>start);
const roots=[
 'tests/clinical-review-spinal-disc-ultrasound.test.ts',
 'tests/spinal-current-runtime-inverse-1031.test.mjs',
 'tests/clinical-imaging-role-preservation-20261021.test.mjs',
 'tests/limb-suprahyoid-role-preservation-20261021.test.mjs',
 'tests/current-review-rebinding.test.mjs',
 'tests/clinical-review-leg-arterial-xray.test.ts',
 'tests/body-learning-layout-history-preservation.test.mjs',
 'tests/connective-xray-original-preservation.test.mjs',
 'tests/clinical-review-continuous-guided-playback.test.ts',
 'tests/playback-reasoning-epoch.test.mjs',
 'tests/tour-playback-source-role-inverse.test.mjs',
 'tests/nine-history-original-adjacent-current-tour-source-roles.mjs',
 'tests/tour-playback-role-inverse.test.mjs',
 'tests/release-epoch-composition-preservation.test.mjs',
 'tests/renal-tour-epoch-admission.test.mjs',
 'tests/keyboard-teaching-source-role.test.mjs',
 'tests/lower-limb-current-source-roles.test.mjs',
];
code=code.slice(0,start)+'const roots='+JSON.stringify(roots)+';'+code.slice(end);
fs.writeFileSync(root+'/check-combined.mjs',code,{flag:'wx'});console.log(JSON.stringify({roots:roots.length}));
