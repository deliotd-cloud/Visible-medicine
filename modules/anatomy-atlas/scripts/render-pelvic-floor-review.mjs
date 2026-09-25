// Offline source-derived scientific projections, never a clinical image or mesh admission.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {buildPelvicFloorReview} from './pelvic-floor-review.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const colors=['#006d85','#b64426','#704bb0','#986c00'];
export function pelvicFloorProjection(group,shapes){
  const layers=group.files.map((file,index)=>{
    const matching=shapes.filter(s=>s.tree===group.tree&&s.file===file);
    assert.equal(matching.length,1,'Missing or ambiguous source geometry');
    return {...matching[0],color:colors[index%colors.length]};
  });
  assert(layers.length>0);
  const min=[0,1,2].map(axis=>Math.min(...layers.map(s=>s.min[axis])));
  const max=[0,1,2].map(axis=>Math.max(...layers.map(s=>s.max[axis])));
  // X=0 remains visible without cutting off any candidate, including an off-axis source.
  min[0]=Math.min(0,min[0]);max[0]=Math.max(0,max[0]);
  const width=1440,rowHeight=336,paneWidth=448,paneHeight=270,startY=174;
  const rows=[{label:'Complete source definition: all supplied components overlaid',layers},
    ...layers.map(layer=>({label:`${group.tree}/${layer.file} alone — same frame and scale`,layers:[layer]}))];
  const height=startY+rows.length*rowHeight+124;
  const axes=[[0,2],[1,2],[0,1]];
  const scale=Math.min(...axes.flatMap(([h,v])=>[(paneWidth-72)/Math.max(1,max[h]-min[h]),(paneHeight-52)/Math.max(1,max[v]-min[v])]));
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img"><title>${esc(group.name)} source review</title><desc>Three orthographic projections of each supplied file and the full definition overlay. No geometry is repaired or admitted.</desc><rect width="100%" height="100%" fill="#f7fafb"/><g font-family="Arial, sans-serif" fill="#103541">`;
  svg+=`<text x="24" y="35" font-size="25">${esc(group.id+' · '+group.name)}</text><text x="24" y="65" font-size="16">HELD FOR REVIEW · original source coordinates · labels are source claims, not validated laterality</text>`;
  layers.forEach((layer,i)=>{svg+=`<text x="${24+(i%2)*700}" y="${98+Math.floor(i/2)*26}" font-size="16" fill="${layer.color}">${esc(group.tree+'/'+layer.file)} · source component ${i+1}</text>`;});
  const panes=[];
  for(const [rowIndex,row] of rows.entries()){
    const y=startY+rowIndex*rowHeight;
    svg+=`<text x="24" y="${y-10}" font-size="17">${esc(row.label)}</text>`;
    for(const [paneIndex,[h,v]] of axes.entries()){
      const x=24+paneIndex*472;
      const px=point=>x+paneWidth/2+(point[h]-(min[h]+max[h])/2)*scale;
      const py=point=>y+paneHeight/2-(point[v]-(min[v]+max[v])/2)*scale;
      panes.push({row:rowIndex,files:row.layers.map(l=>l.file),axes:`${'XYZ'[h]}/${'XYZ'[v]}`,boundsMm:{min:[min[h],min[v]],max:[max[h],max[v]]},pixelsPerMm:scale});
      svg+=`<rect x="${x}" y="${y}" width="${paneWidth}" height="${paneHeight}" fill="white" stroke="#cbd8dc"/>`;
      for(const layer of row.layers){
        let path='';
        for(const face of layer.faces){
          const points=face.map(i=>layer.vertices[i]);
          const projected=points.map(p=>[px(p),py(p)]);
          const [a,b,c]=projected;
          const area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
          if(area===0)continue; // Edge-on faces have no area in this projection.
          if(area<0)projected.reverse(); // 2D fill winding only; original faces are unchanged.
          path+='M'+projected.map(p=>p.map(n=>n.toFixed(3)).join(',')).join('L')+'Z';
        }
        svg+=`<path d="${path}" fill="${layer.color}" fill-opacity="${rowIndex===0&&layers.length>1?0.48:0.83}"/>`;
      }
      if(h===0){const zero=px([0,0,0]);svg+=`<path d="M${zero},${y+4}V${y+paneHeight-4}" stroke="#111" stroke-width="1.2" stroke-dasharray="5 4"/><text x="${zero+5}" y="${y+19}" font-size="13">X=0</text>`;}
      svg+=`<text x="${x+8}" y="${y+paneHeight+23}" font-size="14">Source ${'XYZ'[h]}/${'XYZ'[v]} · mm · +${'XYZ'[h]} right, +${'XYZ'[v]} up</text>`;
      const bar=Math.min(10,Math.max(1,Math.floor(100/scale)));
      svg+=`<path d="M${x+18},${y+paneHeight-18}h${bar*scale}" stroke="#103541" stroke-width="3"/><text x="${x+18}" y="${y+paneHeight-28}" font-size="13">${bar} mm</text>`;
    }
  }
  const footer=height-92;
  svg+=`<text x="24" y="${footer}" font-size="15">Source +X convention is left; X=0 is a source plane, not a validated anatomical midline. Complete extents retained.</text><text x="24" y="${footer+26}" font-size="15">Projection overlap is not proof of 3D intersection, equivalent tissue or correct attachment. No admission or clinical approval.</text><text x="24" y="${footer+52}" font-size="14">BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</text><text x="24" y="${footer+77}" font-size="14">https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html · No repair, trimming, reflection or registration.</text></g></svg>`;
  return {svg,panes,width,height};
}

export async function renderPelvicFloorReview({check=false}={}){
  const {report,shapes}=await buildPelvicFloorReview();
  const folder='docs/reviews/pelvic-floor';
  if(!check)await mkdir(folder,{recursive:true});
  async function retain(path,bytes){
    if(check){assert.deepEqual(await readFile(path),Buffer.from(bytes));return;}
    try{await writeFile(path,bytes,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;assert.deepEqual(await readFile(path),Buffer.from(bytes));}
  }
  const reportBytes=JSON.stringify(report,null,2)+'\n';
  const images=[];
  for(const group of report.groups){
    const {svg,panes,width,height}=pelvicFloorProjection(group,shapes);
    const png=await sharp(Buffer.from(svg)).png().toBuffer();
    const path=`${folder}/${group.tree}-${group.id}.png`;
    await retain(path,png);
    images.push({tree:group.tree,id:group.id,name:group.name,path,width,height,sha256:hash(png),panes});
  }
  await retain(`${folder}/measurements.json`,reportBytes);
  await retain(`${folder}/projections.json`,JSON.stringify({schemaVersion:1,measurementsSha256:hash(reportBytes),images,geometryModified:false,admissionApproved:false,clinicalApproved:false},null,2)+'\n');
  console.log(JSON.stringify({groups:report.groups.length,images:images.length,folder,measurementsSha256:hash(reportBytes),check,admitted:false}));
  return {report,images};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert(process.argv.slice(2).every(arg=>arg==='--check'),'Only --check is supported');
  await renderPelvicFloorReview({check:process.argv.includes('--check')});
}
