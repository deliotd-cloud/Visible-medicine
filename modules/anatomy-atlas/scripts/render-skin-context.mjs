import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Matrix4,Vector3,Ray,Triangle} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import sharp from 'sharp';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
import {projectSkinContext} from './skin-context-projection.mjs';
assert(process.argv.includes('--check'),'Use --check to verify cached source without network');
const {skinMesh}=await import('./audit-skin-source.mjs');
const {catalog,records,policy,evidence}=await loadCurrentSourceHolds();
const hash=b=>createHash('sha256').update(b).digest('hex');
const ids=['FMA16586','FMA52734','FMA24469','FMA24475','FMA23131','FMA52789','FMA23465','FMA24483','FMA24478','FMA16587','FMA52748','FMA23464','FMA24468','FMA24474','FMA23130','FMA52788','FMA24482','FMA24477','FMA7088','FMA7309','FMA7310'];
const meshes=[{...skinMesh,id:'FMA7163',role:'skin',color:[220,171,133]}],contexts=[],loaded=new Map();
const inverse=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor).invert();
for(const id of ids){
  const matches=catalog.structures.filter(s=>s.fmaId===id);assert.equal(matches.length,1);
  const [s]=matches,record=records.find(r=>r.id===id&&r.tree===s.sourceTree);assert(record);
  assert.equal(policy.inspect(record).status,'no-known-source-hold',id+' is held');
  const bundle=catalog.bundles.find(b=>b.id===s.bundle);assert(bundle);
  if(!loaded.has(bundle.id)){
    const bytes=await readFile('public'+bundle.url.split('?')[0]);
    assert.equal(hash(bytes),bundle.sha256);assert.equal(bytes.length,bundle.bytes);
    loaded.set(bundle.id,(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene);
  }
  const objects=[];loaded.get(bundle.id).traverse(n=>{if(n.isMesh&&n.name===s.nodeName)objects.push(n);});assert.equal(objects.length,1);
  // The atlas uses raw geometry from its GLB nodes. Restore only its pinned
  // source-to-scene matrix, never independently align/scale individual structures.
  const geometry=objects[0].geometry,positions=geometry.getAttribute('position');assert.equal(positions.itemSize,3);
  geometry.computeBoundingBox();
  for(const [key,actual] of [['min',geometry.boundingBox.min.toArray()],['max',geometry.boundingBox.max.toArray()]])
    actual.forEach((v,k)=>assert(Math.abs(v-s.bounds[key][k])<1e-5,'Unexpected catalog/geometry frame'));
  const vertices=Array.from({length:positions.count},(_,i)=>new Vector3().fromBufferAttribute(positions,i).applyMatrix4(inverse).toArray());
  const indices=geometry.index?.array??Array.from({length:positions.count},(_,i)=>i);assert.equal(indices.length%3,0);
  const faces=Array.from({length:indices.length/3},(_,i)=>[indices[3*i],indices[3*i+1],indices[3*i+2]]);
  meshes.push({id,vertices,faces,role:'context',color:s.category==='bone'?[49,116,126]:id==='FMA7088'?[174,65,68]:[139,106,161]});
  contexts.push({id,name:s.name,bundle:bundle.id,bundleSha256:bundle.sha256,node:s.nodeName,vertices:vertices.length,faces:faces.length});
}
const views=[{name:'Anterior',horizontal:[1,0,0],depthAxis:[0,-1,0]},
  {name:'Posterior',horizontal:[-1,0,0],depthAxis:[0,1,0]},
  {name:'Left lateral',horizontal:[0,-1,0],depthAxis:[1,0,0]},
  {name:'Anterior oblique',horizontal:[Math.SQRT1_2,-Math.SQRT1_2,0],depthAxis:[-Math.SQRT1_2,-Math.SQRT1_2,0]}];
const paneWidth=440,paneHeight=900,scale=.48,panes=[],screening=[];
for(const [i,view] of views.entries()){
  const {pixels,rows}=projectSkinContext(meshes,{...view,width:paneWidth,height:paneHeight,scale,origin:[200,810]});
  panes.push({input:await sharp(pixels,{raw:{width:paneWidth,height:paneHeight,channels:3}}).png().toBuffer(),left:i*paneWidth,top:95});
  screening.push({view:view.name,rows});
}
const width=paneWidth*4,height=1120;
// Independently confirm flagged raster samples using Three's ray/triangle method.
// This does not classify a non-convex mesh as a valid solid or certify anatomy.
const skinPoints=skinMesh.vertices.map(p=>new Vector3(...p)),rayConfirmation=[];
for(const [i,screen] of screening.entries())for(const row of screen.rows)for(const sample of row.flagSamples){
  const h=(sample.pixel[0]-200)/scale,z=(810-sample.pixel[1])/scale;
  const horizontal=new Vector3(...views[i].horizontal),direction=new Vector3(...views[i].depthAxis);
  const origin=horizontal.clone().multiplyScalar(h);origin.z=z;
  const point=origin.clone().addScaledVector(direction,sample.contextDepthMm);
  const ray=new Ray(origin.clone().addScaledVector(direction,5000),direction.clone().negate());
  const hit=new Vector3(),closest=new Vector3(),triangle=new Triangle(),depths=[];
  let distanceSquared=Infinity;
  for(const face of skinMesh.faces){
    const [a,b,c]=face.map(j=>skinPoints[j]);
    if(ray.intersectTriangle(a,b,c,false,hit))depths.push(hit.dot(direction));
    triangle.set(a,b,c).closestPointToPoint(point,closest);
    distanceSquared=Math.min(distanceSquared,point.distanceToSquared(closest));
  }
  depths.sort((a,b)=>a-b);assert(depths.length>0);
  assert(Math.abs(depths[0]-sample.skinDepthIntervalMm[0])<1e-6);
  assert(Math.abs(depths.at(-1)-sample.skinDepthIntervalMm[1])<1e-6);
  rayConfirmation.push({view:screen.view,id:row.id,pixel:sample.pixel,sourcePointMm:point.toArray(),
    rayIntersectionDepthsMm:depths,nearestSkinDistanceMm:Math.sqrt(distanceSquared)});
}
const svg=`<svg width="${width}" height="${height}"><g fill="#123b42" font-family="Arial, sans-serif">
<text x="24" y="31" font-size="24">Skin candidate with existing internal anatomy · original common source frame · NOT APPROVED</text>
<text x="24" y="57" font-size="16">Teal: 18 retained bones. Red: heart aggregate. Purple: partial lung aggregates, not complete outer surfaces. Skin ghosted.</text>
${views.map((v,i)=>`<text x="${24+i*paneWidth}" y="84" font-size="18">${v.name}</text>`).join('')}
<text x="24" y="1016" font-size="17">No individual fitting, repaired skin, new anatomical partitions or patient-image registration.</text>
<text x="24" y="1042" font-size="16">Alignment screen only: limited views, approximately 2.08 mm/pixel; not proof of enclosure or anatomical accuracy.</text>
<text x="24" y="1068" font-size="15">BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</text>
<text x="24" y="1094" font-size="15">https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html · Original source attribution; changed presentation only.</text></g></svg>`;
const png=await sharp({create:{width,height,channels:3,background:'#f8f8f8'}}).composite([...panes,{input:Buffer.from(svg)}]).png().toBuffer();
const report={schemaVersion:1,skinSha256:'682f402206f15592acdeaae8ffb6b34c3e5c3267fa4685e63d2e4920ef2a80e0',catalogEvidence:evidence,
  coordinateSystem:catalog.coordinateSystem,contexts,screening,rayConfirmation,pixelsPerMm:scale,depthFlagToleranceMm:1,
  projectionSha256:hash(png),clinicalApproval:false,runtimeAdmission:false,
  limitations:['A view-ray minimum/maximum depth interval is not a solid-interior test, particularly for concave or open surfaces.',
    'Raster sampling can miss narrow intersections and can flag holes/seams or silhouette edge discretisation.',
    'Only the specified 21 existing structures and four views were screened; other anatomy remains untested.']};
for(const [path,data] of [['../work/skin-context-review-20260926.png',png],['docs/skin-context-screen-20260926.json',Buffer.from(JSON.stringify(report,null,2)+'\n')]]){
  if(process.argv.includes('--verify-output'))assert.deepEqual(data,await readFile(path),'Context evidence changed');
  else await writeFile(path,data,{flag:process.argv.includes('--refresh')?'w':'wx'});
}
console.log(JSON.stringify({contexts:contexts.length,image:'../work/skin-context-review-20260926.png',flags:screening.map(s=>({view:s.view,rows:s.rows.filter(r=>r.missingSkinPixels||r.outsideDepthEnvelopePixels)}))}));
