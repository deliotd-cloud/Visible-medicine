import assert from 'node:assert/strict';
// Exact-coordinate surface/plane intersections, no tissue interpolation.
export function sourcePlaneSections(mesh,axis,value){
  assert(Number.isInteger(axis)&&axis>=0&&axis<3&&Number.isFinite(value));
  assert(Array.isArray(mesh.vertices)&&Array.isArray(mesh.faces));
  for(const p of mesh.vertices)assert(Array.isArray(p)&&p.length===3&&Array.from(p).every(Number.isFinite));
  const segments=[];let coplanarTriangles=0;
  for(const f of mesh.faces){
    assert(Array.isArray(f)&&f.length===3&&Array.from(f).every(i=>Number.isInteger(i)&&i>=0&&i<mesh.vertices.length));
    const vertices=f.map(i=>mesh.vertices[i]),distances=vertices.map(p=>p[axis]-value);
    assert(distances.every(Number.isFinite));
    if(distances.every(d=>d===0)){coplanarTriangles++;continue;}
    const points=[];
    for(let i=0;i<3;i++){
      const j=(i+1)%3,a=vertices[i],b=vertices[j],da=distances[i],db=distances[j];
      if(da===0)points.push(a);
      if((da<0&&db>0)||(da>0&&db<0)){
        const t=da/(da-db);assert(Number.isFinite(t)&&t>0&&t<1);
        const p=a.map((v,k)=>v+t*(b[k]-v));assert(p.every(Number.isFinite));points.push(p);
      }
    }
    const unique=[...new Map(points.map(p=>[p.join(','),p])).values()];
    if(unique.length===2)segments.push(unique.map(p=>[...p]));
    else assert(unique.length<2,'Ambiguous section: inspect before drawing');
  }
  return {segments,coplanarTriangles};
}
