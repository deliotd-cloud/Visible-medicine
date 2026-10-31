import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release14-followups-main';let code=fs.readFileSync(root+'/integrate-hand.mjs','utf8');
for(const[a,b]of [
 ["const parentPath='G:/VisibleMedicine-temp/staging/20261031-release14-followups/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release14-hand-ready'","const parentPath='G:/VisibleMedicine-temp/staging/20261031-release14-hand-ready/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release14-shoulder-ready'"],
 ['6a21a5eddba962704eccc1151cfb34ffa763d703abe6cd6e9ba9633a1411512b','bfaf0828c239c0ea21a569e68704b55decb40f5930280d61753132b601143f4a'],
 ['20261031-release14-hand-successor/MANIFEST.json','20261031-release14-shoulder-successor/MANIFEST.json'],
 ['vm-release-fourteen-hand-successor/1','vm-release-fourteen-shoulder-successor/1']
]){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}fs.writeFileSync(root+'/integrate-shoulder.mjs',code,{flag:'wx'});await import('./integrate-shoulder.mjs');
