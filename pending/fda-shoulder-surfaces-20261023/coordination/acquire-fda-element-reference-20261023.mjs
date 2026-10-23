// Technical reference retained locally only, not an Atlas asset or redistributed image.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const url='https://docs.software.vt.edu/abaqusv2025/English/SIMA3DXRefImages/e3dsolid-node-face-num-nls.png';
const root='F:/VisibleMedicine/staging/20261023-fda-shoulder-surfaces';
const response=await fetch(url);assert(response.ok);
const b=Buffer.from(await response.arrayBuffer());assert(b.length<2e6);assert.equal(b.subarray(1,4).toString(),'PNG');
fs.writeFileSync(root+'/tetrahedron-reference.png',b,{flag:'wx'});
fs.writeFileSync(root+'/REFERENCE.json',JSON.stringify({url,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),localTechnicalInspectionOnly:true,redistributed:false,notAnAtlasAsset:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:root+'/tetrahedron-reference.png',bytes:b.length}));
