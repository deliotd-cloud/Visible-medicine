import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261028-head-search-comparison',site=stage+'/website',file='tests/head-learning-search-context.test.ts';
const sha=t=>createHash('sha256').update(t).digest('hex'),before=fs.readFileSync(site+'/'+file,'utf8');let text=before;const seams=[];
function edit(a,b){assert.equal(text.split(a).length,2);text=text.replace(a,b);seams.push([a,b]);}
const first="import assert from 'node:assert/strict';";
edit(first,first+"\nimport {headGuidedComparisonForStep} from '../lib/head-guided-comparison.ts';");
const old="    assert.deepEqual(links,[...(view==='all'||view==='3D'?[target.atlasHref!]:[]),...(view==='all'||view==='CT'?[target.ctHref!]:[]),...(view==='all'||view==='MRI'?[target.mriHref!]:[])]);";
edit(old,"    const comparison=headGuidedComparisonForStep('deep-grey','deep-left-caudate');assert(comparison);\n"+old.replace('[])]);','[]),comparison.activityHref]);'));
let restored=text;for(const[a,b]of seams.toReversed()){assert.equal(restored.split(b).length,2);restored=restored.replace(b,a);}assert.equal(restored,before);
fs.writeFileSync(site+'/'+file,text);
const receipt=stage+'/PRODUCT_CHANGE.json',change=JSON.parse(fs.readFileSync(receipt));change.changed.push(file);change.contextTestAdjustment={path:file,before:sha(before),after:sha(text),seams,purpose:'Retain exact selected-modality destinations and append the newly authorized canonical comparison action; all links must still target the same step.'};change.allOriginalTestAssertionsPreserved=false;change.originalTestsRecoverable=true;fs.writeFileSync(receipt,JSON.stringify(change,null,2)+'\n');
console.log(JSON.stringify({file,after:sha(text)}));
