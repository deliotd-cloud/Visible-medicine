// Original-surface section lines for investigation, not CT/MRI or repaired anatomy.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Triangle,Vector3} from 'three';
import sharp from 'sharp';
import {sourceObjShape} from './source-surface-audit.mjs';
import {sourcePlaneSections as section} from './source-plane-sections.mjs';
assert(process.argv.includes('--check'),'Use --check for verified offline source');
const {skinMesh}=await import('./audit-skin-source.mjs');
const source=await readFile('../work/bodyparts3d/isa/FJ3200.obj');
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(hash(source),'48583dbbeab8ae243aa4c266b44ca5b26b9c4e1e79976819cfdf5dcb59ec5772');
const frontal=sourceObjShape(source);
const screen=JSON.parse(await readFile('docs/skin-context-screen-20260926.json','utf8'));
const samples=screen.rayConfirmation;assert.equal(samples.length,3);
const point=samples[0].sourcePointMm;
const definitions=[{name:'Axial source section',axis:2,h:0,v:1,min:[-170,-270],max:[170,65]},
  {name:'Sagittal source section',axis:0,h:1,v:2,min:[-270,1320],max:[65,1680]},
  {name:'Coronal source section',axis:1,h:0,v:2,min:[-170,1320],max:[170,1680]}];
const width=1560,height=730,panes=[],plotHeight=490,plotWidth=480;
let svg=`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs>${definitions.map((_,i)=>`<clipPath id="clip${i}"><rect x="${20+i*520}" y="135" width="480" height="490"/></clipPath>`).join('')}</defs><rect width="100%" height="100%" fill="#f8fafb"/><g font-family="Arial, sans-serif" fill="#103541"><text x="22" y="34" font-size="23">Frontal-area investigation · original skin and frontal bone section lines</text><text x="22" y="64" font-size="16">Brown: original skin. Teal: original frontal bone. Red: flagged sample. NOT CT/MRI; no anatomy changed or approved.</text><text x="22" y="89" font-size="15">Head-only view windows; source millimetres, +X left / +Y posterior / +Z superior. Orientation is not radiological convention.</text>`;
for(const [i,d] of definitions.entries()){
  const scale=Math.min(plotWidth/(d.max[0]-d.min[0]),plotHeight/(d.max[1]-d.min[1]));
  const ox=20+i*520+(plotWidth-(d.max[0]-d.min[0])*scale)/2,oy=135+(plotHeight-(d.max[1]-d.min[1])*scale)/2;
  const xy=p=>[ox+(p[d.h]-d.min[0])*scale,oy+(d.max[1]-p[d.v])*scale];
  const rows=[];
  svg+=`<text x="${22+i*520}" y="119" font-size="17">${d.name} · ${'XYZ'[d.axis]}=${point[d.axis].toFixed(3)}</text><rect x="${20+i*520}" y="135" width="480" height="490" fill="white" stroke="#c8d4d8"/><g clip-path="url(#clip${i})">`;
  for(const {name,mesh,color} of [{name:'skin',mesh:skinMesh,color:'#9a613e'},{name:'frontal',mesh:frontal,color:'#00768b'}]){
    const result=section(mesh,d.axis,point[d.axis]);
    const path=result.segments.map(s=>'M'+s.map(p=>xy(p).map(n=>n.toFixed(4)).join(',')).join('L')).join('');
    svg+=`<path d="${path}" stroke="${color}" stroke-width="1.8" fill="none"/>`;
    rows.push({name,segments:result.segments.length,coplanarTriangles:result.coplanarTriangles});
  }
  const [x,y]=xy(point);svg+=`<circle cx="${x}" cy="${y}" r="5" fill="#e23e39"/><path d="M${x-12},${y}h24M${x},${y-12}v24" stroke="#e23e39"/></g><text x="${22+i*520}" y="650" font-size="15">Horizontal +${'XYZ'[d.h]} right; vertical +${'XYZ'[d.v]} up. 50 mm:</text><path d="M${380+i*520},645h${50*scale}" stroke="#103541" stroke-width="3"/>`;
  panes.push({...d,value:point[d.axis],rows});
}
svg+='<text x="22" y="684" font-size="15">BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</text><text x="22" y="709" font-size="14">dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html · Source intersections only; coplanar triangles counted, not interpolated tissue.</text></g></svg>';
const png=await sharp(Buffer.from(svg)).png().toBuffer();
const closest=new Vector3(),triangle=new Triangle();
const sourceConfirmation=samples.map(sample=>{
  const p=new Vector3(...sample.sourcePointMm);let distance=Infinity;
  for(const f of frontal.faces){triangle.set(...f.map(i=>new Vector3(...frontal.vertices[i]))).closestPointToPoint(p,closest);distance=Math.min(distance,p.distanceTo(closest));}
  return {...sample,nearestOriginalFrontalDistanceMm:distance};
});
const report={schemaVersion:1,skinSha256:screen.skinSha256,frontalSha256:hash(source),sourceConfirmation,panes,
  clinicalApproval:false,geometryModified:false,runtimeAdmission:false,imageSha256:hash(png)};
for(const [path,bytes] of [['../work/skin-head-sections-20260926.png',png],['docs/skin-head-sections-20260926.json',Buffer.from(JSON.stringify(report,null,2)+'\n')]]){
  if(process.argv.includes('--verify-output'))assert.deepEqual(bytes,await readFile(path));
  else await writeFile(path,bytes,{flag:'wx'});
}
console.log(JSON.stringify({image:'../work/skin-head-sections-20260926.png',originalFrontalDistancesMm:sourceConfirmation.map(s=>s.nearestOriginalFrontalDistanceMm)}));
