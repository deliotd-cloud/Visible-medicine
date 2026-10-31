import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release20-main';let text=fs.readFileSync(root+'/check.mjs','utf8');
text=text.replaceAll('20261031-release20-initial','20261031-release20-followup').replace('8532b8971db6e4d480645b61354e7fa1b291fe5c8e4862c9e677e1fa67f99edc','a70e361cc0ade780d58f34512702d71b2d5abe36a4c4dee48380e981f59487b2');
const a=text.indexOf('const roots=['),b=text.indexOf(';',a);assert(a>0&&b>a);text=text.slice(0,a)+'const roots='+JSON.stringify(['tests/clinical-review-reasoning.test.ts','tests/clinical-review-imaging-status.test.ts'])+text.slice(b);
fs.writeFileSync(root+'/check-followup.mjs',text,{flag:'wx'});console.log('Prepared two focused followup roots.');
