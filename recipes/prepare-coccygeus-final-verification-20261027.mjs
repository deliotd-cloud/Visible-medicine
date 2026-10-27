import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
for(const[from,to]of [['verify-coccygeus-website-content-20261027.mjs','verify-coccygeus-final-content-20261027.mjs'],['run-coccygeus-website-verification-20261027.mjs','run-coccygeus-final-verification-20261027.mjs']]){
 let text=fs.readFileSync(from,'utf8').replaceAll('20261027-coccygeus-website','20261027-coccygeus-final-website');
 if(from.startsWith('verify-')){text=text.replace('parent=json(source.parent)','parent=json(source.originalWebsiteParent??source.parent)').replace('assert.equal(hash(source.parent),source.parentSha256);','assert.equal(hash(source.originalWebsiteParent??source.parent),source.originalWebsiteParentSha256??source.parentSha256);');}
 else text=text.replace('verify-coccygeus-website-content-20261027.mjs','verify-coccygeus-final-content-20261027.mjs');
 fs.writeFileSync(to,text,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});
}
console.log('Final verification recipes prepared');
