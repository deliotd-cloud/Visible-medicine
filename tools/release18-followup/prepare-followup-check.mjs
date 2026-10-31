import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release18-main';
let code=fs.readFileSync(root+'/check-combined.mjs','utf8');
code=code.replaceAll('20261031-release18-combined','20261031-release18-followup').replace('0d00a5413e4c9d6aff5dcfa6e37762fdf88750274dad473833d027278d933e60','3ec8df9072c64c1e72f69313e94e6b8e81ecbb72c287df00f5a724e1a1140c43');
const start=code.indexOf('const roots=['),end=code.indexOf(';\nconst result=',start);assert(start>0&&end>start);
code=code.slice(0,start)+'const roots='+JSON.stringify(['tests/clinical-review-abdominal-spatial-reasoning.test.ts','tests/clinical-review-foot-depth.test.ts','tests/adjacent-current-tour-source-roles.test.mjs','tests/release18-continuous-helper-preservation.test.mjs'])+code.slice(end);
fs.writeFileSync(root+'/check-followup.mjs',code,{flag:'wx'});console.log('Prepared four focused roots with unchanged memory limits.');
