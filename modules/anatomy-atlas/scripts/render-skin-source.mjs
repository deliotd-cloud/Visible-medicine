// Scientific orthographic source projections, not generated anatomical artwork.
// Run with --check to verify pinned local bytes before rendering. No network.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
assert(process.argv.includes('--check'),'Use --check for offline, pinned source verification');
const {skinMesh:{vertices,faces}}=await import('./audit-skin-source.mjs');
const width=1200,height=1000,scale=.45;
const pixels=Buffer.alloc(width*height*3,248),depth=new Float64Array(width*height).fill(-Infinity);
// Source X left / Y posterior / Z superior. Views look towards the source.
const views=[{label:'Anterior · source left on screen right',h:0,sign:1,d:1,near:-1},
  {label:'Posterior · source left on screen left',h:0,sign:-1,d:1,near:1},
  {label:'Left lateral · anterior on screen right',h:1,sign:-1,d:0,near:1}];
for(const [pane,view] of views.entries()){
  const points=vertices.map(v=>[pane*400+200+(v[view.h]-(view.h===1?-100:0))*view.sign*scale,
    105+(1642-v[2])*scale,v[view.d]*view.near]);
  assert(points.every(p=>p.every(Number.isFinite)&&p[0]>=pane*400&&p[0]<pane*400+400&&p[1]>=95&&p[1]<895),
    'Projection would crop the source; revise the frame, never truncate geometry');
  for(const face of faces){
    const [a,b,c]=face.map(i=>points[i]);
    const determinant=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    if(Math.abs(determinant)<1e-12)continue;
    const loX=Math.max(pane*400,Math.ceil(Math.min(a[0],b[0],c[0]))),hiX=Math.min(pane*400+399,Math.floor(Math.max(a[0],b[0],c[0])));
    const loY=Math.max(95,Math.ceil(Math.min(a[1],b[1],c[1]))),hiY=Math.min(895,Math.floor(Math.max(a[1],b[1],c[1])));
    const u=[b[0]-a[0],b[1]-a[1],(b[2]-a[2])*scale],v=[c[0]-a[0],c[1]-a[1],(c[2]-a[2])*scale];
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const length=Math.hypot(...n);if(!length)continue;
    // Two-sided shading deliberately does not hide back-facing source triangles.
    const light=.30+.70*Math.abs((-.3*n[0]-.4*n[1]+.866*n[2])/length);
    const color=[220,171,133].map(x=>Math.round(x*light));
    for(let y=loY;y<=hiY;y++)for(let x=loX;x<=hiX;x++){
      const p=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/determinant;
      const q=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/determinant;
      const r=1-p-q;if(p<0||q<0||r<0)continue;
      const z=p*a[2]+q*b[2]+r*c[2],index=y*width+x;
      if(z<=depth[index])continue;depth[index]=z;
      color.forEach((value,k)=>{pixels[index*3+k]=value;});
    }
  }
}
const svg=`<svg width="${width}" height="${height}"><g font-family="Arial, sans-serif" fill="#123b42">
<text x="24" y="32" font-size="23">Skin source candidate · FMA7163 / FJ2810 · NOT ADMITTED</text>
<text x="24" y="59" font-size="15">Original source geometry; orthographic, two-sided shading. No repairs, regional splitting or clinical approval.</text>
${views.map((v,i)=>`<text x="${i*400+12}" y="88" font-size="14">${v.label}</text>`).join('')}
<text x="24" y="920" font-size="16">All supplied faces retained. Open boundaries and indexed fragments require inspection.</text>
<text x="24" y="948" font-size="14">BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</text>
<text x="24" y="976" font-size="14">https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html · Projection is not evidence of internal alignment.</text></g></svg>`;
const out='../work/skin-source-review-20260926.png';
const image=await sharp(pixels,{raw:{width,height,channels:3}}).composite([{input:Buffer.from(svg)}]).png().toBuffer();
if(process.argv.includes('--verify-output'))assert.deepEqual(image,await readFile(out),'Projection changed');
else await writeFile(out,image,{flag:'wx'});
console.log(out);
