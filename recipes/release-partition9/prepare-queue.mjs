import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition9-title-ready';
let script=fs.readFileSync('G:/VisibleMedicine-temp/staging/20261031-release-partition8-ready/release-queue.mjs','utf8');
script=script.replaceAll('G:/VisibleMedicine-temp/staging/20261031-release-partition8-ready',root)
 .replaceAll('1bd8a279d88605eb2b230e5df7ae27905ba64217f4761f43eafec23a990522a1','0d4856c755796a748b38c530679e9a6bd30efc7906272a23bf8a2eff5ddaf5a1');
const before='const order=[...Array.from({length:25},(_,i)=>i+8),1,2,3,4,5,6];';
assert(script.includes(before));script=script.replace(before,"assert(json(root+'/FOCUSED_RESULT.json').passed);\nconst order=[...Array.from({length:24},(_,i)=>i+9),1,2,3,4,5,6,8];");
assert(!script.includes('release-partition8-ready'));
fs.writeFileSync(root+'/release-queue.mjs',script,{flag:'wx'});
console.log('Prepared the current-source sequential queue; launch requires focused checks to pass.');
