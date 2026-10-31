import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const recipes='G:/VisibleMedicine-temp/proposals/20261031-release20-main',root='G:/VisibleMedicine-temp/staging/20261031-release20-initial';
const sh=createHash('sha256').update(fs.readFileSync(root+'/SOURCE.json')).digest('hex');
let text=fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-release18-main/check-release19.mjs','utf8');
text=text.replaceAll('20261031-release19-initial','20261031-release20-initial').replace('9f4a686e1611d66f3c2392bdcc6a6ad83100a55fcdcbb6e06c4a1581334e6f46',sh);
const roots=['tests/head-practice-exit.test.mjs','tests/head-practice-exit-preservation.test.mjs','tests/head-teaching-current.test.ts','tests/head-review-sections-preservation.test.mjs','tests/reasoning-current-source-epoch.test.mjs','tests/clinical-review-abdominal-vessel-reasoning.test.ts','tests/clinical-review-reasoning.test.ts','tests/clinical-review-coronary-sinus-xray.test.ts'];
const a=text.indexOf('const roots=['),b=text.indexOf(';',a);assert(a>0&&b>a);text=text.slice(0,a)+'const roots='+JSON.stringify(roots)+text.slice(b);
fs.writeFileSync(recipes+'/check.mjs',text,{flag:'wx'});console.log(JSON.stringify({sourceSha256:sh,roots}));
