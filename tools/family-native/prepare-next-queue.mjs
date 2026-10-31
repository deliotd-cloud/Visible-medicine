import fs from 'node:fs';import assert from 'node:assert/strict';const root='G:/VisibleMedicine-temp/proposals/20261031-family-main';let code=fs.readFileSync(root+'/prepare-queue-inner.mjs','utf8');for(const[a,b]of[
 ["process.argv[2]??'G:/VisibleMedicine-temp/staging/20261031-release14-family-ready'","process.argv[2]??'G:/VisibleMedicine-temp/staging/20261031-release14-family-epoch-ready'"],
 ["process.argv[3]??'1f6874549fe853ca1827117a647bd3995d16b996ffe03fd7f422e97f80a288e0'","process.argv[3]??'162396d752cd48e440f89dc51b953947380ffcd4fbae7cd697677be89d7580a1'"],
 ['Array.from({length:18},(_,n)=>n+15),...Array.from({length:14},(_,n)=>n+1)','Array.from({length:17},(_,n)=>n+16),...Array.from({length:15},(_,n)=>n+1)'],['first:15','first:16']
 ]){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}fs.writeFileSync(root+'/prepare-next-queue-inner.mjs',code,{flag:'wx'});await import('./prepare-next-queue-inner.mjs');
