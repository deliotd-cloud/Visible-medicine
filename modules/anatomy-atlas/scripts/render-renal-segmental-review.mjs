// Original-source projections for review, not clinical images or new anatomy.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {renalSegmentalCandidates} from './renal-segmental-candidates.mjs';
import {sourceObjShape} from './source-surface-audit.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const auditBytes=await readFile('docs/renal-segmental-source-audit.json');
assert.equal(hash(auditBytes),'5048193c716e778b7f7322a270719dfe43e2339b2fe1cde071da8c31102125e5');
const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const palette={superior:'#b52e36',inferior:'#c47900',posterior:'#7552a6'};
await mkdir('docs/reviews',{recursive:true});
for(const side of ['right','left']){
 const title=side[0].toUpperCase()+side.slice(1);
 const context=[title+' kidney',title+' renal artery'].map(name=>{
  const matches=catalog.structures.filter(s=>s.name===name);assert.equal(matches.length,1,name);return matches[0];
 });
 const proposals=renalSegmentalCandidates.filter(c=>c.side===side),layers=[];
 for(const record of context)for(const source of record.sources){
  const bytes=await readFile(`../work/bodyparts3d/${record.sourceTree}/${source.file}.obj`);assert.equal(hash(bytes),source.sha256);
  layers.push({id:record.id,label:record.name,color:record.system==='vessels'?'#146576':'#71818a',opacity:record.system==='vessels'?0.75:0.12,shape:sourceObjShape(bytes)});
 }
 for(const candidate of proposals){
  assert.equal(candidate.files.length,1);
  const bytes=await readFile(`../work/bodyparts3d/${candidate.tree}/${candidate.files[0]}.obj`);assert.equal(hash(bytes),candidate.sha256);
  const part=candidate.name.split(' ')[0];assert(palette[part]);
  layers.push({id:candidate.id,label:candidate.name,color:palette[part],opacity:1,shape:sourceObjShape(bytes)});
 }
 const all=layers.flatMap(l=>l.shape.vertices),zMin=Math.min(...all.map(p=>p[2])),zMax=Math.max(...all.map(p=>p[2]));
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820"><rect width="1200" height="820" fill="#fafaf8"/><g font-family="Arial, sans-serif" fill="#163841">';
 svg+=`<text x="24" y="32" font-size="23">${title} renal artery candidates — source-space review</text>`;
 svg+='<text x="24" y="60" font-size="14">Grey: existing kidney. Teal: existing renal artery. Coloured branches: proposals, not admitted.</text>';
 proposals.forEach((c,i)=>{const part=c.name.split(' ')[0];svg+=`<text x="24" y="${87+i*22}" font-size="14" fill="${palette[part]}">${esc(c.id+' / '+c.files[0]+' — '+c.name)}</text>`;});
 const panes=[];
 for(const axis of [0,1]){
  const x=24+axis*590,y=193,width=562,height=526;
  const min=Math.min(...all.map(p=>p[axis])),max=Math.max(...all.map(p=>p[axis]));
  const scale=Math.min((width-40)/(max-min),(height-40)/(zMax-zMin));
  const originX=x+width/2,originY=y+height/2;
  panes.push({axis:axis===0?'X/Z':'Y/Z',sourceHorizontalMm:[min,max],sourceVerticalMm:[zMin,zMax],pixelsPerMm:scale});
  svg+=`<text x="${x}" y="175" font-size="16">${axis===0?'X/Z':'Y/Z'} projection · complete supplied extents</text><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="white" stroke="#d7dfe1"/>`;
  for(const layer of layers){
   let d='';
   for(const face of layer.shape.faces){
    const p=face.map(i=>layer.shape.vertices[i]),[a,b,c]=p;
    // Select one projected winding to avoid cancellation of compound silhouettes.
    if((b[axis]-a[axis])*(c[2]-a[2])-(b[2]-a[2])*(c[axis]-a[axis])<=0)continue;
    d+='M'+p.map(v=>`${(originX+(v[axis]-(min+max)/2)*scale).toFixed(3)},${(originY-(v[2]-(zMin+zMax)/2)*scale).toFixed(3)}`).join('L')+'Z';
   }
   svg+=`<path d="${d}" fill="${layer.color}" fill-opacity="${layer.opacity}"/>`;
  }
 }
 svg+='<text x="24" y="751" font-size="14">Not CT/MRI, a perfusion map, a connected lumen, or proof of renal segment identity. Clinical review pending.</text>';
 svg+='<text x="24" y="776" font-size="13">BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</text>';
 svg+='<text x="24" y="798" font-size="13">Original source coordinates and faces retained; projections only. No trimming, interpolation, repair or inferred tissue.</text></g></svg>';
 const image=await sharp(Buffer.from(svg)).png().toBuffer();
 const out=`docs/reviews/renal-segmental-${side}`;
 const evidence={auditSha256:hash(auditBytes),side,candidates:proposals,context:context.map(c=>({id:c.id,sourceTree:c.sourceTree,sources:c.sources})),panes,imageSha256:hash(image),candidateClipped:false,geometryModified:false,admissionApproved:false,clinicalApproved:false};
 const json=JSON.stringify(evidence,null,2)+'\n';
 if(process.argv.includes('--check')){assert.deepEqual(await readFile(out+'.png'),image);assert.equal(await readFile(out+'.json','utf8'),json);}
 else{await writeFile(out+'.png',image,{flag:'wx'});await writeFile(out+'.json',json,{flag:'wx'});}
 console.log(JSON.stringify({image:out+'.png',candidates:proposals.length,sha256:hash(image),admitted:false}));
}
