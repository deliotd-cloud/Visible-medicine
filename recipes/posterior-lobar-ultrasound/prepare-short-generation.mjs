import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us';
let text=fs.readFileSync(root+'/generate.mjs','utf8');
for(const [before,after]of [['0076bdcfae170aa7b9ebde87a521dd0da65734502f573c5eb933563fe4ef0f9d','44d14e43fe2c3b3bd07cac9d25d9379e144deeb54f602ccc5e4ec678b73e646b'],["'/GEN-'","'/GEN-SHORT-'"],["'/GENERATION.json'","'/GENERATION-SHORT.json'"]]){assert.equal(text.split(before).length,2);text=text.replace(before,after);}
fs.writeFileSync(root+'/generate-short.mjs',text,{flag:'wx'});
