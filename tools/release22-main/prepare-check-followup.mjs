import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release22-main';let code=fs.readFileSync(root+'/check-repairs.mjs','utf8');
code=code.replace("root='G:/VisibleMedicine-temp/staging/20261031-release21-repairs'","root='G:/VisibleMedicine-temp/staging/20261031-release21-followup'").replace('d1d66172d076c92f6d32167ad98f487e22d6c13ac6e942d072557421771c3c77','d32838ba53f570721d3dc230e573a0395d61e7ec28be85029a532059de069c98');
const a=code.indexOf('const roots='),b=code.indexOf('\nconst result=',a);assert(a>0&&b>a);code=code.slice(0,a)+"const roots=['tests/atlas-navigation.test.ts','tests/public-copy-review.test.ts','tests/site-image.test.mjs'];"+code.slice(b);
fs.writeFileSync(root+'/check-followup.mjs',code,{flag:'wx'});
