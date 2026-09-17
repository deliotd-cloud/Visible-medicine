// Public-source evidence only: this audit cannot admit or repair anatomy.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
import {archiveReader} from './bodyparts-archive.mjs';
import {sourceObjShape,sourceBoundsNear,sourceTriangleSet} from './source-surface-audit.mjs';
import {sourceTopology} from './source-topology.mjs';
import {geometryFingerprint} from './anatomy-inventory.mjs';
import {shapeCandidate,compareTranslatedShape} from './vessel-shape-math.mjs';
import {spatialDistanceIndex,uniqueSourceVertices,distanceSummary} from './source-spatial-math.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const pins=[['FJ2725','48063a8e366f2ad5c6745d9d20c31afc216a68561d5b4826de256444190f7634'],['FJ2730','bb15f6552044e7e9dbf7035fc0836b0ee10e1a46a22a0b2cc90c4eb711c11141']];
const current=await loadCurrentSourceHolds();
const definition=current.records.find(r=>r.tree==='isa'&&r.id==='FMA76767');
assert.deepEqual(definition,{id:'FMA76767',name:'anterior cardiac vein',representation:'BP8603',files:pins.map(p=>p[0]),tree:'isa'});
current.policy.assertNoKnownHolds([definition]);
const compiled=await build({stdin:{contents:`export {bodyDisplayCatalog} from './lib/body-display-catalog';export {nestedStudyTargets} from './lib/nested-anatomy';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const display=api.bodyDisplayCatalog(current.catalog),root={...display,structures:display.structures.filter(s=>s.fmaId!=='FMA76767')},nested=api.nestedStudyTargets(root),shoulder=JSON.parse(await readFile('public/models/bodyparts3d/manifest.json','utf8'));
const archiveEvidence=current.inventory.archives.find(a=>a.tree==='isa');
const archive=await archiveReader('isa',archiveEvidence.url);
const directory=[...archive.entries].filter(([name])=>name.endsWith('.obj')).sort(([a],[b])=>a.localeCompare(b));
assert.equal(directory.length,archiveEvidence.entryCount);assert.equal(hash(JSON.stringify(directory)),archiveEvidence.directorySha256);
const candidates=[];
for(const [file,sha256] of pins){
 const bytes=await archive.get(file);assert.equal(hash(bytes),sha256);
 const shape=sourceObjShape(bytes),topology=sourceTopology(shape);
 candidates.push({file,sha256,bytes:bytes.length,archiveEntry:archive.entries.get(file+'.obj'),geometrySha256:geometryFingerprint(bytes),shape,topology,triangles:sourceTriangleSet(shape),nearest:spatialDistanceIndex(shape)});
}
const assets=new Map();
const add=(structure,scope)=>{for(const source of structure.sources){
 const key=structure.sourceTree+'/'+source.file,old=assets.get(key);if(old)assert.equal(old.sha256,source.sha256);
 else assets.set(key,{tree:structure.sourceTree,file:source.file,sha256:source.sha256,owners:[]});assets.get(key).owners.push({scope,id:structure.id,fmaId:structure.fmaId});
}};
root.structures.forEach(s=>add(s,'root'));nested.forEach(t=>add(t.structure,'nested:'+t.study));
shoulder.parts.forEach(p=>add({id:p.structureId,fmaId:p.fmaId,sourceTree:'isa',sources:[{file:p.sourceFile.replace(/\.obj$/,''),sha256:p.sourceSha256}]},'shoulder'));
const screen=[],comparisons=[],matches=[];
const samples=s=>{const p=uniqueSourceVertices(s),stride=Math.max(1,Math.ceil(p.length/128));return p.filter((_,i)=>i%stride===0);};
for(const asset of assets.values()){
 const bytes=await readFile(`../work/bodyparts3d/${asset.tree}/${asset.file}.obj`);assert.equal(hash(bytes),asset.sha256);
 const shape=sourceObjShape(bytes),fingerprint=geometryFingerprint(bytes);
 const row={...asset,geometrySha256:fingerprint,bounds:{min:shape.min,max:shape.max},triangles:shape.faces.length,compared:[]};
 for(const c of candidates){
  const direct=asset.tree==='isa'&&asset.file===c.file,exact=fingerprint===c.geometrySha256;
  if(direct||exact)matches.push({candidate:c.file,asset:asset.tree+'/'+asset.file,direct,exact});
  const near=sourceBoundsNear(c.shape,shape,1.01),comparable=shapeCandidate(c.shape,shape);
  if(!near&&!comparable)continue;
  row.compared.push(c.file);const tri=sourceTriangleSet(shape);
  comparisons.push({candidate:c.file,asset:asset.tree+'/'+asset.file,owners:asset.owners,near,comparable,sharedTriangles:[...c.triangles].filter(t=>tri.has(t)).length,
   candidateToSource:distanceSummary(samples(c.shape),spatialDistanceIndex(shape)),sourceToCandidate:distanceSummary(samples(shape),c.nearest),translatedDiagnostic:comparable?compareTranslatedShape(c.shape,shape):null});
 }
 screen.push(row);
}
const a=candidates[0],b=candidates[1];
const candidateComparison={sharedTriangles:[...a.triangles].filter(t=>b.triangles.has(t)).length,aToB:distanceSummary(samples(a.shape),b.nearest),bToA:distanceSummary(samples(b.shape),a.nearest)};
const report={schemaVersion:1,baselineCommit:'430c9abbf66b14d9e485acdf2502ab33e42379a7',definition,license:current.catalog.license,credit:current.catalog.credit,evidence:current.evidence,sourceArchive:archive.source,archiveDirectorySha256:archiveEvidence.directorySha256,
 rootSelections:root.structures.length,nestedSelections:nested.length,shoulderSourceParts:shoulder.parts.length,shoulderSelections:new Set(shoulder.parts.map(p=>p.structureId)).size,screenedFiles:screen.length,candidates:candidates.map(({file,sha256,bytes,archiveEntry,geometrySha256,shape,topology})=>({file,sha256,bytes,archiveEntry,geometrySha256,bounds:{min:shape.min,max:shape.max},topology})),candidateComparison,matches,comparisons,screen,
 limitations:['Sparse unsigned-distance/translation diagnostics do not prove anatomical validity, continuous contact, self-intersection freedom or clinical acceptance.','Current root, reachable nested and shoulder source files were hash-verified. Independent v3/HRA/UM specimens use separate frames and are excluded.','No admission, source editing, relabelling, generated connectors or licensing substitution.'],admitted:false,clinicalApproval:false};
const output='../work/anterior-cardiac-vein-audit-20260917.json';
if(process.argv.includes('--check'))assert.deepEqual(report,JSON.parse(await readFile('docs/anterior-cardiac-vein-source-audit.json')));
else await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,root:root.structures.length,nested:nested.length,files:screen.length,matches,comparisons:comparisons.length,shared:comparisons.filter(c=>c.sharedTriangles),translated:comparisons.filter(c=>c.translatedDiagnostic?.similar),candidateComparison,admitted:false}));
