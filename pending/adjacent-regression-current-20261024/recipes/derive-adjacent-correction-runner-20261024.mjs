// Exact mechanical derivation: only affected roots, source and phase selection.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const from='run-adjacent-regression-current-20261024.mjs',to='run-adjacent-regression-correction-20261024.mjs';let text=fs.readFileSync(from,'utf8');const original=text;
const seams=[
 ["assert(['baseline','current'].includes(phase));","assert.equal(phase,'current-v2');"],
 ["const roots=phase==='baseline'?oldRoots.filter(p=>!alreadyCurrent.includes(p)):[...oldRoots,'tests/adjacent-shoulder-source-roles.test.mjs','tests/adjacent-clinical-source-roles.test.mjs','tests/adjacent-current-tour-source-roles.test.mjs','tests/lower-limb-current-source-roles.test.mjs','tests/lower-limb-pin-history-source-roles.test.mjs'];", "const roots=['tests/clinical-review-continuous-guided-playback.test.ts','tests/adjacent-current-tour-source-roles.test.mjs','tests/release-epoch-composition-preservation.test.mjs','tests/renal-tour-epoch-admission.test.mjs','tests/atlas-label-keyboard.test.ts','tests/arterial-history-preservation.test.mjs','tests/lower-limb-current-source-roles.test.mjs'];"],
 ["json(stage+'/CANDIDATE_INPUTS.json')","json(stage+'/CANDIDATE_INPUTS.v2.json')"],
];for(const[a,b]of seams){assert.equal(text.split(a).length,2);text=text.replace(a,b);}fs.writeFileSync(to,text,{flag:'wx'});
const sha=b=>createHash('sha256').update(b).digest('hex');fs.writeFileSync('F:/VisibleMedicine/staging/20261024-adjacent-regression-current/CORRECTION_RUNNER.json',JSON.stringify({from,to,fromSha256:sha(original),toSha256:sha(text),seams,affectedRoots:7,previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({runner:to,affectedRoots:7}));
