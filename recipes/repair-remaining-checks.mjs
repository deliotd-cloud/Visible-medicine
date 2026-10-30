import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const root='G:/VisibleMedicine-temp/staging/20261030-quick-review',site=root+'/website',sha=b=>createHash('sha256').update(b).digest('hex');
const edit=(p,fn)=>{const f=site+'/'+p,b=fs.readFileSync(f,'utf8');fs.mkdirSync(path.dirname(root+'/before/'+p),{recursive:true});fs.writeFileSync(root+'/before/'+p,b,{flag:'wx'});fs.writeFileSync(f,fn(b));};
edit('tests/clinical-review-inbox-pagination-focus.test.mjs',text=>{assert.equal(text.split('cleanup = dispose;').length,2);return text.replace('cleanup = dispose;','cleanup = () => { for (const slot of slots) slot?.dispose?.(); };');});
const p='lib/clinical-review-inbox-contract.ts',current=fs.readFileSync(site+'/'+p),earlier=fs.readFileSync('F:/VisibleMedicine/staging/20261024-lower-arterial-website/website/'+p);
assert.equal(current.toString().split('|foot').length,2);assert.equal(current.toString().replace('|foot',''),earlier.toString());
edit('tests/clinical-review-inbox-short-desktop.test.mjs',text=>{
 const marker="read=p=>readInboxHistoricalSource(p,root)";assert.equal(text.split(marker).length,2);
 return text.replace(marker,`read=p=>{const bytes=readInboxHistoricalSource(p,root);if(p!=='${p}')return bytes;assert.equal(sha(bytes),'${sha(current)}','Exact later foot-route admission');const restored=Buffer.from(bytes.toString().replace('|foot',''));assert.equal(sha(restored),'${sha(earlier)}','Historical contract with every other byte unchanged');return restored;}`);
});
console.log('Preserved historical route contract and repaired complete effect cleanup.');
