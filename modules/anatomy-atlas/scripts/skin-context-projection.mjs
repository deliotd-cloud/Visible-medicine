// Read-only geometric screening; not an enclosure/registration proof.
import assert from 'node:assert/strict';

export function projectSkinContext(meshes,{width,height,scale,origin,horizontal,depthAxis}){
  assert(meshes.length>0&&meshes[0].role==='skin');
  assert(Number.isInteger(width)&&width>0&&Number.isInteger(height)&&height>0);
  assert(Number.isFinite(scale)&&scale>0);
  for(const axis of [horizontal,depthAxis])assert(axis.length===3&&axis.every(Number.isFinite));
  assert(origin.length===2&&origin.every(Number.isFinite));
  const length=width*height;
  const skinNear=new Float64Array(length).fill(-Infinity),skinFar=new Float64Array(length).fill(Infinity);
  const contextNear=new Float64Array(length).fill(-Infinity);
  const skinColor=new Uint8Array(length*3),contextColor=new Uint8Array(length*3);
  const rows=[];
  for(const mesh of meshes){
    assert(mesh.vertices.length>0&&mesh.faces.length>0);
    const p=mesh.vertices.map(v=>{
      assert(v.length===3&&v.every(Number.isFinite));
      return [origin[0]+scale*v.reduce((n,x,i)=>n+x*horizontal[i],0),origin[1]-scale*v[2],v.reduce((n,x,i)=>n+x*depthAxis[i],0)];
    });
    assert(p.every(v=>v[0]>=0&&v[0]<width&&v[1]>=0&&v[1]<height),'Frame would crop geometry');
    const isSkin=mesh.role==='skin',occupied=new Set(),outside=new Set(),missing=new Set(),flagSamples=[];
    let maximumOutsideDepthMm=0;
    for(const face of mesh.faces){
      assert(face.length===3&&face.every(i=>Number.isInteger(i)&&i>=0&&i<p.length));
      const [a,b,c]=face.map(i=>p[i]);
      const determinant=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
      if(Math.abs(determinant)<1e-12)continue;
      const loX=Math.ceil(Math.min(a[0],b[0],c[0])),hiX=Math.floor(Math.max(a[0],b[0],c[0]));
      const loY=Math.ceil(Math.min(a[1],b[1],c[1])),hiY=Math.floor(Math.max(a[1],b[1],c[1]));
      const u=[b[0]-a[0],b[1]-a[1],(b[2]-a[2])*scale],v=[c[0]-a[0],c[1]-a[1],(c[2]-a[2])*scale];
      const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const norm=Math.hypot(...n);if(!norm)continue;
      const light=.35+.65*Math.abs((-.3*n[0]-.4*n[1]+.866*n[2])/norm);
      for(let y=loY;y<=hiY;y++)for(let x=loX;x<=hiX;x++){
        const pa=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/determinant;
        const pb=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/determinant;
        const pc=1-pa-pb;if(pa<0||pb<0||pc<0)continue;
        const z=pa*a[2]+pb*b[2]+pc*c[2],i=y*width+x;
        occupied.add(i);
        if(!isSkin){
          if(!Number.isFinite(skinNear[i]))missing.add(i);
          else if(z>skinNear[i]+1||z<skinFar[i]-1){
            outside.add(i);maximumOutsideDepthMm=Math.max(maximumOutsideDepthMm,z-skinNear[i],skinFar[i]-z);
            if(flagSamples.length<3)flagSamples.push({pixel:[x,y],contextDepthMm:z,skinDepthIntervalMm:[skinFar[i],skinNear[i]]});
          }
        }
        const near=isSkin?skinNear:contextNear,colors=isSkin?skinColor:contextColor;
        if(isSkin)skinFar[i]=Math.min(skinFar[i],z);
        if(z>near[i]){near[i]=z;mesh.color.forEach((c,k)=>{colors[i*3+k]=Math.round(c*light);});}
      }
    }
    rows.push({id:mesh.id,role:mesh.role,occupiedPixels:occupied.size,missingSkinPixels:missing.size,outsideDepthEnvelopePixels:outside.size,maximumOutsideDepthMm,flagSamples});
  }
  const pixels=Buffer.alloc(length*3,248);
  for(let i=0;i<length;i++)for(let k=0;k<3;k++){
    if(Number.isFinite(skinNear[i]))pixels[3*i+k]=Math.round(248*.72+skinColor[3*i+k]*.28);
    if(Number.isFinite(contextNear[i]))pixels[3*i+k]=contextColor[3*i+k];
  }
  return {pixels,rows};
}
