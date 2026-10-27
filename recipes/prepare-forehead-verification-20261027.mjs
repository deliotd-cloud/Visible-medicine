import fs from 'node:fs';
import assert from 'node:assert/strict';
const from='run-tongue-native-checks-20261026.mjs';
let code=fs.readFileSync(from,'utf8');
const edits=[
  ['20261026-tongue-imaging-native','20261027-forehead-nerve-us-native'],
  ["[['scripts/test-tongue-imaging.mjs'],['scripts/test-tongue-imaging-transition.mjs'],","[['scripts/test-forehead-nerve-ultrasound.mjs'],"],
  ["kind:'tongue-imaging-native-'","kind:'forehead-nerve-us-native-'"]
];
for(const [a,b] of edits){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}
fs.writeFileSync('run-forehead-native-checks-20261027.mjs',code,{flag:'wx'});
