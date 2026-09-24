// Orthographic source-space diagnostic only; no mesh transformation or admission.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {build} from './workspace-test-build.mjs';
import {sourceObjShape} from './source-surface-audit.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const auditBytes=await readFile('docs/tibial-recurrent-source-audit.json');
assert.equal(sha(auditBytes),'78d221460bddf648d3f1ef5eab3183fb594e3a515b93a0e8c70beeea848ace26');
const audit=JSON.parse(auditBytes);
const bundle=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
await mkdir('docs/reviews', {recursive:true});
for (const side of ['Right','Left']) {
const wanted=['femur','tibia','fibula','patella','anterior tibial artery'].map(name=>side+' '+name);
const context=wanted.map(name=>{const matches=catalog.structures.filter(s=>s.name===name);assert.equal(matches.length,1,name);return matches[0];});
const layers=[];
for(const record of context){
  for(const source of record.sources){
    const bytes=await readFile(`../work/bodyparts3d/${record.sourceTree}/${source.file}.obj`);assert.equal(sha(bytes),source.sha256);
    layers.push({name:record.name,color:record.system==='vessels'?'#196f8a':'#839096',opacity:record.system==='vessels'?0.9:0.10,shape:sourceObjShape(bytes)});
  }
}
const target=audit.groups.find(g=>g.side===side.toLowerCase());
const targetBytes=await readFile(`../work/bodyparts3d/isa/${target.file}.obj`);assert.equal(sha(targetBytes),target.sha256);
layers.push({name:target.name,color:'#be322d',opacity:1,shape:sourceObjShape(targetBytes)});
const panes=[{x:20,axis:0,label:side+' knee: source X/Z projection',min:side==='Right'?-150:20,max:side==='Right'?-20:150},{x:570,axis:1,label:side+' knee: source Y/Z projection',min:-160,max:-30}];
assert(target.sourceBounds.min[2]>=260 && target.sourceBounds.max[2]<=460);
for(const pane of panes)assert(target.sourceBounds.min[pane.axis]>=pane.min && target.sourceBounds.max[pane.axis]<=pane.max,'Never clip candidate anatomy');
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="720"><rect width="1120" height="720" fill="#fafaf8"/><g font-family="Arial, sans-serif" fill="#193740"><text x="20" y="28" font-size="20">Source review: anterior tibial recurrent artery candidate</text><text x="20" y="52" font-size="13">Red: ${target.id} / ${target.file}. Blue: existing anterior tibial artery. Grey: existing bone surfaces.</text><text x="20" y="74" font-size="13">Orthographic projections, not acquired imaging. Context clipped to Z 260–460 mm; candidate untrimmed.</text>`;
for(const pane of panes){
  svg+=`<text x="${pane.x}" y="108" font-size="15">${pane.label}</text>`;
  for(const layer of layers){
    let d='';
    for(const face of layer.shape.faces){const points=face.map(i=>layer.shape.vertices[i]);if(points.some(p=>p[2]<260||p[2]>460||p[pane.axis]<pane.min||p[pane.axis]>pane.max))continue;
      // Keep one projected winding so opposite faces do not cancel in the SVG
      // compound path. This is a surface silhouette, not a volumetric section.
      const [a,b,c]=points;
      if((b[pane.axis]-a[pane.axis])*(c[2]-a[2])-(b[2]-a[2])*(c[pane.axis]-a[pane.axis])<=0)continue;
      d+='M'+points.map(p=>`${(pane.x+35+(p[pane.axis]-pane.min)*2.5).toFixed(2)},${(650-(p[2]-260)*2.5).toFixed(2)}`).join('L')+'Z';}
    svg+=`<path d="${d}" fill="${layer.color}" fill-opacity="${layer.opacity}"/>`;
  }
}
svg+='<text x="20" y="695" font-size="13">BodyParts3D © DBCLS, CC BY 4.0. Original coordinates/faces retained. Review pending; not clinically approved.</text></g></svg>';
const output=`docs/reviews/tibial-recurrent-${side.toLowerCase()}.png`;
await sharp(Buffer.from(svg)).png().toFile(output);
await writeFile(output.replace('.png','.json'),JSON.stringify({auditSha256:sha(auditBytes),sourceId:target.id,sourceFile:target.file,target:target.sha256,context:context.map(s=>({id:s.id,sources:s.sources})),imageSha256:sha(await readFile(output)),projection:{panes,zRangeMm:[260,460],candidateClipped:false,sourceFacesModified:false},geometryModified:false,clinicalApproved:false},null,2)+'\n');
console.log(JSON.stringify({output,sourceId:target.id,clinicalApproved:false}));
}
