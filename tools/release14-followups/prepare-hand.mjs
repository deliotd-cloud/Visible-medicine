import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release14-followups-main';let code=fs.readFileSync(root+'/prepare.mjs','utf8');
for(const[a,b]of [
 ["const parentPath='G:/VisibleMedicine-temp/staging/20261031-release14-inverses/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release14-followups'","const parentPath='G:/VisibleMedicine-temp/staging/20261031-release14-followups/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release14-hand-ready'"],
 ['79e1fd2c00d770a75ff365ba761423b7f37bc42006b38c3eb9b0650458ed0079','6a21a5eddba962704eccc1151cfb34ffa763d703abe6cd6e9ba9633a1411512b'],
 ["'G:/VisibleMedicine-temp/proposals/20261031-release14-composition-successor/MANIFEST.json','G:/VisibleMedicine-temp/proposals/20261031-release14-forearm-successor/MANIFEST.json','G:/VisibleMedicine-temp/proposals/20261031-release14-diagnostic-successors/MANIFEST.json'","'G:/VisibleMedicine-temp/proposals/20261031-release14-hand-successor/MANIFEST.json'"],
 ['patches.length>=3','patches.length>=1'],
 ['vm-release-fourteen-followup-successor/1','vm-release-fourteen-hand-successor/1']
]){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}fs.writeFileSync(root+'/integrate-hand.mjs',code,{flag:'wx'});await import('./integrate-hand.mjs');
