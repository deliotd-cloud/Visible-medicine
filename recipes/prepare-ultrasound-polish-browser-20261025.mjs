import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261025-ultrasound-polished-website-v2';
let recipe=fs.readFileSync(new URL('./preview-ultrasound-website-20261025.mjs',import.meta.url),'utf8');
recipe=recipe.replaceAll('20261025-ultrasound-local-website','20261025-ultrasound-polished-website-v2').replaceAll('55926','55927').replaceAll('db06a6b990a137958ca4d856b3dad1ce2d6b8439b4116f8b39b753a26dfea34f','631a7021667cd9989ff1d564f0881068ef58201dd0b5a53e5be8e723aed777fa');
fs.writeFileSync(new URL('./preview-ultrasound-polish-20261025.mjs',import.meta.url),recipe,{flag:'wx'});
const base=stage+'/qa-data',folder=base+'/synthetic';assert(!fs.existsSync(base));fs.mkdirSync(folder,{recursive:true});
const previous='F:/VisibleMedicine/staging/20261025-ultrasound-local-website/qa-data/synthetic',study=json(previous+'/ultrasound-atlas.json');
for(const frame of study.frames){assert.equal(hash(previous+'/'+frame.image.file),frame.image.sha256);fs.copyFileSync(previous+'/'+frame.image.file,folder+'/'+frame.image.file,fs.constants.COPYFILE_EXCL);frame.annotations.push({id:'edge-target',label:'Synthetic edge target',polygon:[[.03,.03],[.12,.03],[.12,.12],[.03,.12]],notes:['Peripheral annotation to verify bounded pan.']},{id:'concave-target',label:'Synthetic concave target',polygon:[[.68,.74],[.94,.74],[.94,.8],[.74,.8],[.74,.96],[.68,.96]],notes:['Concave L outline: its label must remain inside its polygon.']});}
fs.writeFileSync(folder+'/ultrasound-atlas.json',JSON.stringify(study,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(base+'/RECEIPT.json',JSON.stringify({at:new Date().toISOString(),folder,manifestSha256:hash(folder+'/ultrasound-atlas.json'),parent:previous,syntheticOnly:true,noMedicalPixels:true,sourceCandidateSha256:hash(stage+'/SOURCE_CANDIDATE.json')},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({folder,sourceCandidateSha256:hash(stage+'/SOURCE_CANDIDATE.json')}));
