import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release21-main';let text=fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-release20-main/check-followup.mjs','utf8');
text=text.replaceAll('20261031-release20-followup','20261031-release20-final').replace('a70e361cc0ade780d58f34512702d71b2d5abe36a4c4dee48380e981f59487b2','d538614316ced49e4151e03cb3a5f7594f79dc896b97248b69fc06450108fc92');
const a=text.indexOf('const roots=['),b=text.indexOf(';',a);assert(a>0&&b>a);text=text.slice(0,a)+'const roots='+JSON.stringify(['tests/clinical-review-leg-venous-xray.test.ts','tests/clinical-review-upper-limb-completion-quiz.test.ts'])+text.slice(b);
fs.writeFileSync(root+'/check-final.mjs',text,{flag:'wx'});console.log('Prepared final two partition20 delivery checks.');
