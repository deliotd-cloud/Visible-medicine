import fs from 'node:fs';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-release18-main';
let code=fs.readFileSync(root+'/integrate-initial.mjs','utf8');
code=code.replace("parentPath='G:/VisibleMedicine-temp/staging/20261031-release16-final/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release18-initial'","parentPath='G:/VisibleMedicine-temp/staging/20261031-release18-initial/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release18-combined'");
code=code.replace('ec5e332400ad3744044342deb9f7c6d80de0d1ab432107f96c0a5d221faecc8b','e82ff1d95774fc56c2c376f1d86e0a3ea2754592b663fbfbeec178a67266372b');
const start=code.indexOf("const proposals=['SPINAL_COMPOSITION.json'"),end=code.indexOf('assert.equal(new Set',start);assert(start>0&&end>start);
code=code.slice(0,start)+`const inputs=[
 ['G:/VisibleMedicine-temp/proposals/20261031-release18-continuous-review','05214fe4de31753866d8ebd5e10d008ee79f9c5265b0b1c2d0fd91333ea21144'],
 ['G:/VisibleMedicine-temp/proposals/20261031-release18-preservation','444eb3bf5bb71d2178d5e40c2870900fac0e598a50cfdc72aaa6dd7b512f260a'],
 ['G:/VisibleMedicine-temp/proposals/20261031-release18-shoulder-preservation','84bc2601de9f55f7a38a80ea6c8e7747f840b53f1521f6529ffea57c040da3b7'],
];
const proposals=inputs.map(([p])=>p+'/MANIFEST.json'),rows=[];
for(const [p,digest]of inputs){
 assert.equal(hash(p+'/MANIFEST.json'),digest);const m=json(p+'/MANIFEST.json');
 for(const r of m.files){const before=r.before??m.before?.[r.path]??null;rows.push({path:r.path,before,after:r.after??r.sha256,from:p+'/'+r.path});}
 for(const [name,origin]of Object.entries(m.witnessOrigins??{}))assert.equal(hash(origin),hash(p+'/'+name),name+' authentic saved witness');
}
const benchmark='G:/VisibleMedicine-temp/proposals/20261031-hand-pilot-native/attempt-1jYbKo/RESULT.json';
`+code.slice(end);
code=code.replace('vm-release-eighteen-initial-successor/1','vm-release-eighteen-combined-successor/1');
fs.writeFileSync(root+'/integrate-combined.mjs',code,{flag:'wx'});console.log('Prepared combined successor with three independently hashed proposals.');
