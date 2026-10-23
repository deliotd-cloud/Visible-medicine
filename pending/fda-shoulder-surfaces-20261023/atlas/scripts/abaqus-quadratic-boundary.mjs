// Corner/midside numbering: official Abaqus three-dimensional solid library.
// Piecewise-linear boundary sampling, not a solver or an exact curved FE surface.
import assert from 'node:assert/strict';
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const finite=(v,label)=>{assert(Number.isFinite(v),label+' is not finite');return v;};
const key=ids=>[...ids].sort((a,b)=>a-b).join(':');
const id=n=>assert(Number.isSafeInteger(n)&&n>0,'Invalid source ID');
// Face corner order, edge midsides in matching AB/BC/CA order, opposite corner.
export const TETRA10_FACES=Object.freeze([
  [0,1,2,4,5,6,3], [0,3,1,7,8,4,2],
  [1,3,2,8,9,5,0], [2,3,0,9,7,6,1],
].map(f=>Object.freeze(f)));

export function extractQuadraticBoundary(part){
  assert(part?.nodes instanceof Map&&part?.elements instanceof Map,'Expected explicit part maps');
  assert.equal(part.elementType,'C3D10M','Unsupported source element type');
  assert(part.nodes.size&&part.elements.size,'Empty source mesh');
  for(const [n,p]of part.nodes){id(n);assert(Array.isArray(p)&&p.length===3&&p.every(Number.isFinite),'Invalid node coordinates');}
  const faces=new Map(),cells=new Set();let negativeCornerVolumes=0,minAbsCornerDeterminant=Infinity,minNormalizedCornerDeterminant=Infinity;
  for(const [element,nodes]of part.elements){
    id(element);assert(Array.isArray(nodes)&&nodes.length===10&&new Set(nodes).size===10,'Invalid ten-node connectivity');
    for(const n of nodes){id(n);assert(part.nodes.has(n),'Missing element node');}
    const cellKey=key(nodes.slice(0,4));assert(!cells.has(cellKey),'Duplicate corner tetrahedron');cells.add(cellKey);
    const p=nodes.slice(0,4).map(n=>part.nodes.get(n));
    const determinant=finite(dot(sub(p[1],p[0]),cross(sub(p[2],p[0]),sub(p[3],p[0]))),'Corner determinant');
    assert(determinant!==0,'Degenerate corner tetrahedron');if(determinant<0)negativeCornerVolumes++;
    const maxEdge=Math.max(...p.flatMap((v,i)=>p.slice(i+1).map(w=>Math.hypot(...sub(v,w)))));
    minAbsCornerDeterminant=Math.min(minAbsCornerDeterminant,Math.abs(determinant));
    minNormalizedCornerDeterminant=Math.min(minNormalizedCornerDeterminant,finite(Math.abs(determinant)/maxEdge**3,'Normalized determinant'));
    for(const [face,template]of TETRA10_FACES.entries()){
      const [a,b,c,ab,bc,ca,opposite]=template.map(i=>nodes[i]),faceKey=key([a,b,c]);
      const edges=[[a,b,ab],[b,c,bc],[c,a,ca]].map(([x,y,m])=>[Math.min(x,y),Math.max(x,y),m]).sort((x,y)=>x[0]-y[0]||x[1]-y[1]);
      const signature=JSON.stringify(edges),previous=faces.get(faceKey);
      if(previous){
        assert.equal(previous.count,1,'Nonmanifold tetrahedron face');
        assert.equal(previous.signature,signature,'Shared face midside mismatch');
        const pa=part.nodes.get(a),normal=cross(sub(part.nodes.get(b),pa),sub(part.nodes.get(c),pa));
        assert(dot(normal,sub(part.nodes.get(opposite),pa))*dot(normal,sub(part.nodes.get(previous.opposite),pa))<0,'Overlapping face-neighbour tetrahedra');
        previous.count=2;
      }else faces.set(faceKey,{count:1,signature,element,face:face+1,ids:[a,b,c,ab,bc,ca],opposite});
    }
  }
  const sourceFaces=[],sourceTriangles=[],used=new Set();let internalFaces=0;
  for(const f of faces.values()){
    if(f.count===2){internalFaces++;continue;}
    let [a,b,c,ab,bc,ca]=f.ids;
    const pa=part.nodes.get(a),normal=cross(sub(part.nodes.get(b),pa),sub(part.nodes.get(c),pa));
    if(dot(normal,sub(part.nodes.get(f.opposite),pa))>0)[b,c,ab,ca]=[c,b,ca,ab];
    sourceFaces.push({element:f.element,face:f.face,nodeIds:[a,b,c,ab,bc,ca]});
    for(const tri of [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]]){
      const [x,y,z]=tri.map(n=>part.nodes.get(n)),area=Math.hypot(...cross(sub(y,x),sub(z,x)));
      assert(finite(area,'Sampled triangle area')>0,'Degenerate sampled boundary triangle');
      sourceTriangles.push(tri);for(const n of tri)used.add(n);
    }
  }
  const sourceNodeIds=[...used].sort((a,b)=>a-b),indices=new Map(sourceNodeIds.map((n,i)=>[n,i]));
  const vertices=sourceNodeIds.map(n=>[...part.nodes.get(n)]),triangles=sourceTriangles.map(t=>t.map(n=>indices.get(n)));
  const audit=auditTriangleSurface(vertices,triangles);
  return {sourceNodeIds,vertices,triangles,sourceFaces,audit:{...audit,
    sourceNodes:part.nodes.size,sourceElements:part.elements.size,negativeCornerVolumes,minAbsCornerDeterminant,minNormalizedCornerDeterminant,
    boundaryQuadraticFaces:sourceFaces.length,internalQuadraticFaces:internalFaces,
    construction:'Four linear triangles per six-node boundary face; existing corner/midside coordinates only',
    smoothing:false,decimation:false,coordinateWelding:false,exactContinuousQuadraticSurface:false,selfIntersectionsChecked:false,
    anatomicalReview:false,registeredToBodyParts3D:false,patientSpaceRegistration:false}};
}

export function auditTriangleSurface(vertices,triangles){
  assert(Array.isArray(vertices)&&vertices.length>0&&Array.isArray(triangles)&&triangles.length>0,'Empty surface');
  const edges=new Map(),links=Array.from({length:vertices.length},()=>new Map()),parent=vertices.map((_,i)=>i);
  const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  const union=(a,b)=>{parent[root(a)]=root(b);};
  let minDoubleArea=Infinity,area=0;
  for(const v of vertices)assert(Array.isArray(v)&&v.length===3&&v.every(Number.isFinite),'Invalid surface coordinate');
  for(const t of triangles){
    assert(Array.isArray(t)&&t.length===3&&new Set(t).size===3&&t.every(i=>Number.isSafeInteger(i)&&i>=0&&i<vertices.length),'Invalid surface triangle');
    const [a,b,c]=t.map(i=>vertices[i]),doubleArea=finite(Math.hypot(...cross(sub(b,a),sub(c,a))),'Surface area');assert(doubleArea>0,'Zero area surface triangle');
    minDoubleArea=Math.min(minDoubleArea,doubleArea);area+=doubleArea/2;
    for(let i=0;i<3;i++){
      const a=t[i],b=t[(i+1)%3],v=t[(i+2)%3],edgeKey=key([a,b]);
      const e=edges.get(edgeKey)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(edgeKey,e);union(a,b);
      const link=links[v];for(const [x,y]of [[a,b],[b,a]]){const list=link.get(x)||[];list.push(y);link.set(x,list);}
    }
  }
  let boundaryEdges=0,nonmanifoldEdges=0,inconsistentWindingEdges=0,nonmanifoldVertices=0,isolatedVertices=0;
  for(const e of edges.values()){if(e.count===1)boundaryEdges++;if(e.count>2)nonmanifoldEdges++;if(e.count===2&&e.direction!==0)inconsistentWindingEdges++;}
  for(const link of links){
    if(link.size===0){isolatedVertices++;continue;}
    const visited=new Set(),queue=[link.keys().next().value];
    while(queue.length){const v=queue.pop();if(visited.has(v))continue;visited.add(v);queue.push(...link.get(v).filter(n=>!visited.has(n)));}
    if(visited.size!==link.size||[...link.values()].some(n=>n.length!==2))nonmanifoldVertices++;
  }
  return {vertices:vertices.length,triangles:triangles.length,edges:edges.size,components:new Set(vertices.map((_,i)=>root(i))).size,
    boundaryEdges,nonmanifoldEdges,inconsistentWindingEdges,nonmanifoldVertices,isolatedVertices,minDoubleArea,
    areaInUnverifiedSourceUnitsSquared:finite(area,'Total surface area'),closedOrientedVertexManifold:boundaryEdges===0&&nonmanifoldEdges===0&&inconsistentWindingEdges===0&&nonmanifoldVertices===0&&isolatedVertices===0};
}

export function writeWavefrontText(surface,name){
  assert(/^[A-Za-z0-9_-]+$/.test(name),'Unsafe object name');
  return '# Unvalidated independent FDA source assembly; units and side not inferred.\n'+
    '# Node-sampled piecewise-linear surface, not exact curved finite-element geometry.\n'+
    'o '+name+'\n'+surface.vertices.map(p=>'v '+p.join(' ')).join('\n')+'\n'+
    surface.triangles.map(t=>'f '+t.map(i=>i+1).join(' ')).join('\n')+'\n';
}
