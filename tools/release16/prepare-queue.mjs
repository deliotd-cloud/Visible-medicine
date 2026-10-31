import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release16-main';let code=fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-family-main/prepare-next-queue-inner.mjs','utf8');
const from="assert(/^G:\\/VisibleMedicine-temp\\/staging\\/20261031-release14-[a-z-]+$/.test(stage));";
assert(code.includes(from));code=code.replace(from,"assert(stage==='G:/VisibleMedicine-temp/staging/20261031-release16-final');");
code=code.replace('Array.from({length:17},(_,n)=>n+16),...Array.from({length:15},(_,n)=>n+1)','Array.from({length:16},(_,n)=>n+17),...Array.from({length:16},(_,n)=>n+1)').replace('first:16','first:17');
fs.writeFileSync(root+'/prepare-queue-inner.mjs',code,{flag:'wx'});await import('./prepare-queue-inner.mjs');
