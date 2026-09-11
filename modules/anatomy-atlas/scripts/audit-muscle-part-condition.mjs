// Preliminary source-condition evidence only: no repair, runtime admission or clinical clearance.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const candidates = [
  ['FMA34690','FJ1447','e239a63adf99dfc094ece7efcd91ec7cd9ac802e9d7581141b311a7842fbbbe6',1846,13,9],
  ['FMA34691','FJ1447M','aab8ea03eed46a79b3f765ef539df785deb333e5079c21f8c7bec14444768a18',1846,13,9],
  ['FMA65198','FJ1514','af5d19e0450559eaeacd54e6d332c507acc9b0dc4675311094c6c3b9c9715a71',726,15,11],
  ['FMA65199','FJ1514M','f0db75e6d23cd0cf9642ae4bc28012713314678a92fc9cff7b0ce16a281990d9',726,15,11],
];
const h=await loadCurrentSourceHolds(), rows=[], outputDir='content/prototypes/muscle-part-condition';
const check=process.argv.includes('--check');
if(!check) await mkdir(outputDir);
for(const [id,file,sha256,triangles,components,duplicates] of candidates) {
  const definition=h.records.find(r=>r.tree==='isa'&&r.id===id);
  assert.deepEqual(definition.files,[file]);
  const path=outputDir+'/'+file+'.obj';
  const bytes=await readFile(check?path:'../work/bodyparts3d/isa/'+file+'.obj');
  assert.equal(hash(bytes),sha256);
  const shape=sourceObjShape(bytes),topology=sourceTopology(shape);
  assert.equal(topology.triangles,triangles); assert.equal(topology.components.length,components); assert.equal(topology.duplicateFaces,duplicates);
  assert.equal(topology.closedOrientedManifold,false);
  const original=h.inventory.assets.find(a=>a.tree==='isa'&&a.file===file);
  assert.equal(bytes.length,original.bytes);
  rows.push({id,file,name:definition.name,definition,path,sha256,bytes:bytes.length,archiveCrc32:original.crc32,topology,policyScreen:h.policy.inspect(definition),status:'needs-source-and-anatomical-review',runtimeAdmission:false});
  if(!check) await writeFile(path,bytes,{flag:'wx'});
}
const result={sourceCommit:'4c30ff9f4a29249cdd716e616a55b98006d54a3a',license:'CC-BY-4.0',credit:h.catalog.credit,sourceArchive:'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',licenseUrl:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',evidence:h.evidence,rows,modifications:'None. Complete original files retained for offline review only.',clinicalApproval:false,limitations:['Preliminary condition screen, not a complete ownership, overlap, laterality or anatomical assessment.','Clavicular pectoralis parts each contain 13 components and 9 duplicate faces; superficial thumb-flexor heads each contain 15 components and 11 duplicate faces.','No fragment is removed, joined, relabelled or used in the runtime viewer. Separate review must decide whether an explicitly documented derivative is appropriate.','No new formal source hold: these four remain in the review queue, not approved for admission.']};
const output=JSON.stringify(result,null,2)+'\n',path='docs/muscle-part-condition-audit.json';
if(check) assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({candidates:rows.length,triangles:rows.reduce((n,r)=>n+r.topology.triangles,0),runtimeAdmissions:0,auditSha256:hash(output)}));
