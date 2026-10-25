import fs from 'node:fs';import assert from 'node:assert/strict';import {hash} from './seal-simple-website-successor.mjs';
const sourceFile='F:/VisibleMedicine/staging/20261025-canonical-csp-website/SOURCE_CANDIDATE.json',sourceSha='b21223ba0c84a9cf6b56e9a1956a2c13fad03f66353197acde115bc1e0eb0c90';assert.equal(hash(sourceFile),sourceSha);
for(const [input,output,kind]of [
 ['check-tour-neck-renal-types-full-types-20261025.mjs','check-canonical-csp-full-types-20261025.mjs','types'],
 ['build-tour-neck-renal-website-v2-20261025.mjs','build-canonical-csp-website-20261025.mjs','build']]){
 assert(!fs.existsSync(output));let text=fs.readFileSync(input,'utf8');
 assert(text.includes('20261025-tour-neck-renal-types-website'));text=text.replaceAll('20261025-tour-neck-renal-types-website','20261025-canonical-csp-website');
 assert.equal(text.split('04659d023c2fb36b0ee03ae47583aefa31478653abbf7f461759df62d4629fbf').length,2);text=text.replace('04659d023c2fb36b0ee03ae47583aefa31478653abbf7f461759df62d4629fbf',sourceSha);
 if(kind==='build'){
  text=text.replaceAll('build-attempt-2','build-attempt-1');
  const old='F:/VisibleMedicine/staging/20261025-tour-reading-types-shadow/checks/attempt-1/RESULT.json';assert.equal(text.split(old).length,2);text=text.replace(old,'F:/VisibleMedicine/staging/20261025-canonical-csp-website/checks/focused-attempt-1/RESULT.json');
  assert.equal(text.split('counts.pass===8').length,2);text=text.replace('counts.pass===8','counts.pass===4');
 }
 fs.writeFileSync(output,text,{flag:'wx'});console.log(JSON.stringify({kind,recipe:output,sha256:hash(output),sourceSha256:sourceSha,fullScopeAndOriginalBuildPrebuildUnchanged:true}));
}
