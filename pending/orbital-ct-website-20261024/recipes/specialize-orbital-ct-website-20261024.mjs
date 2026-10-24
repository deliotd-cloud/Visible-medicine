// Mechanical specializations of existing verified integration tools.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-orbital-ct-website';
const records=[];
function derive(from,to,seams){
 const before=fs.readFileSync(from,'utf8');let after=before;
 for(const [a,b]of seams){assert(after.includes(a),a);after=after.replaceAll(a,b);}
 let inverse=after;for(const [a,b]of [...seams].reverse())inverse=inverse.replaceAll(b,a);
 assert.equal(inverse,before);fs.writeFileSync(to,after,{flag:'wx'});
 records.push({from,to,beforeSha256:hash(from),afterSha256:hash(to),seams,wholeInverseVerified:true});
}
derive('admit-cervical-vascular-coverage-20261024.mjs','admit-orbital-ct-coverage-20261024.mjs',[
 ['20261024-cervical-vascular-website','20261024-orbital-ct-website'],
]);
derive('check-cervical-vascular-website-types-20261024.mjs','check-orbital-ct-website-types-20261024.mjs',[
 ['20261024-cervical-vascular-website','20261024-orbital-ct-website'],
 ["assert(fs.existsSync(stage+'/VALIDATION_SLOT_ACQUIRED.json'));","assert.equal(json(index).activeWork.current.activeExecutionSessions.length,0);"],
 ["'cervical-vascular-website-types'","'orbital-ct-website-types'"],
 ["'atlas-review/lib/cervical-vascular-reasoning.ts',","'atlas-review/lib/cervical-vascular-reasoning.ts','atlas-review/lib/body-orbital-ct.ts',"],
]);
fs.writeFileSync(stage+'/TOOLS_TRANSITION.json',JSON.stringify({at:new Date().toISOString(),records,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({derived:records.length,previewChanged:false}));
