// Offline context only. No source geometry modification or admission.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {buildPelvicFloorContext} from './pelvic-floor-context.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const colors=['#006d85','#b64426','#704bb0','#986c00'];
const boneFiles=['FJ3152','FJ3288','FJ3393'];
const muscleFiles=['FJ1426','FJ1426M'];

export function commonPelvicContextFrame(candidateShapes,contextShapes){
  assert(candidateShapes.length&&contextShapes.length,'Missing source geometry');
  const all=[...candidateShapes,...contextShapes];
  for(const s of all)assert(s.min.length===3&&s.max.length===3&&s.min.every((v,i)=>Number.isFinite(v)&&Number.isFinite(s.max[i])&&v<=s.max[i]),'Invalid source bounds');
  const min=[0,1,2].map(axis=>Math.min(...all.map(s=>s.min[axis])));
  const max=[0,1,2].map(axis=>Math.max(...all.map(s=>s.max[axis])));
  min[0]=Math.min(0,min[0]);max[0]=Math.max(0,max[0]);
  return {min,max};
}

export function pelvicFloorContextProjection(group,candidateShapes,contextShapes,frame){
  const candidates=group.files.map((file,i)=>{
    const matches=candidateShapes.filter(s=>s.tree===group.tree&&s.file===file);
    assert.equal(matches.length,1,'Missing or duplicate held component');
    return {...matches[0],color:colors[i%colors.length],opacity:group.files.length>1?0.67:0.95};
  });
  assert.equal(contextShapes.length,5,'Exactly the five source-bound context components are required');
  assert.deepEqual(contextShapes.map(s=>s.file).sort(),[...boneFiles,...muscleFiles].sort());
  const bones=contextShapes.filter(s=>boneFiles.includes(s.file)).map(s=>({...s,color:'#566f7c',opacity:0.19}));
  const muscles=contextShapes.filter(s=>muscleFiles.includes(s.file)).map(s=>({...s,color:'#7c667d',opacity:0.3}));
  const rows=[{label:'Pelvic bones + held definition',layers:[...bones,...candidates]},
    {label:'Same frame + bilateral obturator internus context',layers:[...bones,...muscles,...candidates]}];
  const width=1560,height=1150,paneWidth=488,paneHeight=344;
  const axes=[[0,2],[1,2],[0,1]],{min,max}=frame;
  const scale=Math.min(...axes.flatMap(([h,v])=>[(paneWidth-52)/Math.max(1,max[h]-min[h]),(paneHeight-52)/Math.max(1,max[v]-min[v])]));
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img"><title>${escape(group.name)} in original pelvic context</title><desc>Held source components with existing hip bones, sacrum and bilateral obturator internus in original source coordinates; not proof of attachment.</desc><rect width="100%" height="100%" fill="#f7fafb"/><g fill="#103541" font-family="Arial, sans-serif">`;
  svg+=`<text x="24" y="35" font-size="25">${escape(group.id+' · '+group.name)} — contextual review</text><text x="24" y="65" font-size="16">HELD · no new anatomy admitted · same original source frame and scale on all seven sheets</text>`;
  svg+='<text x="24" y="93" font-size="15">Grey: right/left hip bones (FJ3152/FJ3288), sacrum (FJ3393). Purple-grey: obturator internus (FJ1426/FJ1426M).</text>';
  candidates.forEach((s,i)=>{svg+=`<text x="${24+(i%2)*760}" y="${123+Math.floor(i/2)*25}" fill="${s.color}" font-size="16">${escape(group.tree+'/'+s.file)} · held component ${i+1}</text>`;});
  const panes=[];
  for(const [rowIndex,row]of rows.entries()){
    const y=195+rowIndex*407;
    svg+=`<text x="24" y="${y-12}" font-size="18">${row.label}</text>`;
    for(const [paneIndex,[h,v]]of axes.entries()){
      const x=24+paneIndex*512;
      const px=p=>x+paneWidth/2+(p[h]-(min[h]+max[h])/2)*scale;
      const py=p=>y+paneHeight/2-(p[v]-(min[v]+max[v])/2)*scale;
      panes.push({row:rowIndex,axes:`${'XYZ'[h]}/${'XYZ'[v]}`,files:row.layers.map(s=>`${s.tree}/${s.file}`),boundsMm:{min:[min[h],min[v]],max:[max[h],max[v]]},pixelsPerMm:scale});
      svg+=`<rect x="${x}" y="${y}" width="${paneWidth}" height="${paneHeight}" fill="white" stroke="#cbd8dc"/>`;
      for(const layer of row.layers){
        let path='';
        for(const face of layer.faces){
          const points=face.map(i=>layer.vertices[i]).map(p=>[px(p),py(p)]);
          const [a,b,c]=points,area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
          if(area===0)continue;
          if(area<0)points.reverse(); // Projection fill only, never alter the source mesh.
          path+='M'+points.map(p=>p.map(n=>n.toFixed(3)).join(',')).join('L')+'Z';
        }
        svg+=`<path d="${path}" fill="${layer.color}" fill-opacity="${layer.opacity}"/>`;
      }
      if(h===0){const zero=px([0,0,0]);svg+=`<path d="M${zero},${y+4}V${y+paneHeight-4}" stroke="#111" stroke-dasharray="5 4"/><text x="${zero+5}" y="${y+19}" font-size="13">X=0</text>`;}
      svg+=`<path d="M${x+15},${y+paneHeight-15}h${20*scale}" stroke="#103541" stroke-width="3"/><text x="${x+15}" y="${y+paneHeight-26}" font-size="13">20 mm</text><text x="${x+8}" y="${y+paneHeight+24}" font-size="15">Source ${'XYZ'[h]}/${'XYZ'[v]} · +${'XYZ'[h]} right, +${'XYZ'[v]} up</text>`;
    }
  }
  svg+='<text x="24" y="1013" font-size="15">Coordinate projections, not radiological views. Source +X is the left-side convention; X=0 is not a validated anatomical midline.</text><text x="24" y="1040" font-size="15">No separate coccyx, fascia, attachment landmarks or organs supplied here. Overlap/proximity does not establish attachment.</text><text x="24" y="1067" font-size="15">Transparent silhouettes show all layers, not depth occlusion. No tissue repair, trimming, reflection, registration or clinical approval.</text><text x="24" y="1094" font-size="14">BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</text><text x="24" y="1121" font-size="14">https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html · Existing context is itself unvalidated; source labels remain source claims.</text></g></svg>';
  return {svg,panes,width,height};
}

export async function renderPelvicFloorContext({check=false}={}){
  const {report,candidateShapes,contextShapes}=await buildPelvicFloorContext();
  const frame=commonPelvicContextFrame(candidateShapes,contextShapes);
  const folder='docs/reviews/pelvic-floor-context';
  if(!check)await mkdir(folder,{recursive:true});
  const retain=async(path,bytes)=>{
    if(check)return assert.deepEqual(await readFile(path),Buffer.from(bytes));
    try{await writeFile(path,bytes,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;assert.deepEqual(await readFile(path),Buffer.from(bytes));}
  };
  const reportBytes=JSON.stringify(report,null,2)+'\n',images=[];
  for(const group of report.groups){
    const {svg,panes,width,height}=pelvicFloorContextProjection(group,candidateShapes,contextShapes,frame);
    const png=await sharp(Buffer.from(svg)).png().toBuffer();
    const path=`${folder}/${group.tree}-${group.id}.png`;
    await retain(path,png);images.push({id:group.id,tree:group.tree,name:group.name,path,sha256:sha(png),width,height,panes});
  }
  await retain(`${folder}/sources.json`,reportBytes);
  await retain(`${folder}/projections.json`,JSON.stringify({schemaVersion:1,sourcesSha256:sha(reportBytes),commonFrame:frame,images,geometryModified:false,admissionApproved:false,clinicalApproved:false},null,2)+'\n');
  console.log(JSON.stringify({groups:report.groups.length,contextComponents:contextShapes.length,images:images.length,folder,sourcesSha256:sha(reportBytes),check,admitted:false}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert(process.argv.slice(2).every(a=>a==='--check'),'Only --check is supported');
  await renderPelvicFloorContext({check:process.argv.includes('--check')});
}
