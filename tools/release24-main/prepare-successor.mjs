import fs from 'node:fs';import assert from 'node:assert/strict';
const r='G:/VisibleMedicine-temp/proposals/20261031-release24-main';
let code=fs.readFileSync(r+'/integrate.mjs','utf8');
const once=(b,a)=>{assert.equal(code.split(b).length,2,b);code=code.replace(b,a);};
once("parentPath='G:/VisibleMedicine-temp/staging/20261031-head-clear-final/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release24-repairs'","parentPath='G:/VisibleMedicine-temp/staging/20261031-release24-repairs/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release24-successor'");
once('76bc03dce3e3cd5ac0420f67a6bc1aed48dff24edd4efc9a815195addd139bff','2f9f4a2d5c4c8daa91b6d94bc8b85ee018ab6fdfefe1000cdce4535eac7c8dae');
const start=code.indexOf('const proposalDirs='),end=code.indexOf('assert.equal(new Set(patches',start);assert(start>0&&end>start);
code=code.slice(0,start)+`const proposalDirs=[['G:/VisibleMedicine-temp/proposals/20261031-pelvic-and-quiz-delivery','HANDOFF.json'],['G:/VisibleMedicine-temp/proposals/20261031-arterial-epoch-context','MANIFEST.json']];
for(const [p,file]of proposalDirs){const m=json(p+'/'+file);for(const row of m.files)patches.push({path:row.path,before:row.beforeSha256??null,after:row.afterSha256??row.newSha256,from:p+'/files/'+row.path});}
`+code.slice(end);
fs.writeFileSync(r+'/integrate-successor.mjs',code,{flag:'wx'});
let check=fs.readFileSync(r+'/check.mjs','utf8').replaceAll('20261031-release24-repairs','20261031-release24-successor');
const a=check.indexOf('const roots=['),b=check.indexOf(';for(const r of roots)',a);assert(a>0&&b>a);
check=check.slice(0,a)+`const roots=['tests/arterial-epoch-preservation.test.mjs','tests/clinical-review-longus-colli-quiz.test.ts','tests/clinical-review-suprahyoid-quiz.test.ts','tests/fda-reference-current-delivery.test.mjs']`+check.slice(b);
fs.writeFileSync(r+'/check-successor.mjs',check,{flag:'wx'});
console.log('Prepared isolated successor integration and four-root verification recipe');
