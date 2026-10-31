import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-family-main';let code=fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-release14-followups-main/prepare-queue.mjs','utf8');
for(const [a,b] of [
 ["process.argv[2]??'G:/VisibleMedicine-temp/staging/20261031-release14-followups'","process.argv[2]??'G:/VisibleMedicine-temp/staging/20261031-release14-family-ready'"],
 ["process.argv[3]??'6a21a5eddba962704eccc1151cfb34ffa763d703abe6cd6e9ba9633a1411512b'","process.argv[3]??'1f6874549fe853ca1827117a647bd3995d16b996ffe03fd7f422e97f80a288e0'"],
 ['Array.from({length:19},(_,n)=>n+14),...Array.from({length:13},(_,n)=>n+1)','Array.from({length:18},(_,n)=>n+15),...Array.from({length:14},(_,n)=>n+1)'],
 ['first:14','first:15']
 ]){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}fs.writeFileSync(root+'/prepare-queue-inner.mjs',code,{flag:'wx'});await import('./prepare-queue-inner.mjs');
