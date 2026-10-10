import {ShapeUtils,Vector2} from 'three';

const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const same=(a,b)=>a.every((value,i)=>value===b[i]);
function onSegment(a,b,p,epsilon){return Math.abs(orient(a,b,p))<=epsilon&&p.every((value,i)=>value>=Math.min(a[i],b[i])-Math.sqrt(epsilon)&&value<=Math.max(a[i],b[i])+Math.sqrt(epsilon));}
function intersects(a,b,c,d,epsilon){const values=[orient(a,b,c),orient(a,b,d),orient(c,d,a),orient(c,d,b)];return values[0]*values[1]<-epsilon*epsilon&&values[2]*values[3]<-epsilon*epsilon||onSegment(a,b,c,epsilon)||onSegment(a,b,d,epsilon)||onSegment(c,d,a,epsilon)||onSegment(c,d,b,epsilon);}

/** Source-coordinate polygon tessellation only; never repair, scale or relabel.
 * Nonplanar quads have no unique implied surface. Their deterministic projected
 * tessellation is disclosed, not a claim of source/clinical surface equivalence.
 */
export function triangulateSourcePolygon(vertices,face){
 if(!Array.isArray(face)||face.length<3||new Set(face).size!==face.length)throw Error('Repeated or insufficient polygon indexes');
 const points=face.map(index=>{if(!Number.isSafeInteger(index)||index<0||index>=vertices.length)throw Error('Invalid source index');const point=vertices[index];if(!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite))throw Error('Nonfinite source point');return point;});
 if(points.some((point,i)=>points.slice(i+1).some(other=>same(point,other))))throw Error('Repeated source coordinates');
 // Centring is numerical projection only; returned source points remain untouched.
 const origin=points[0],p=points.map(point=>point.map((value,i)=>value-origin[i]));
 const normal=[0,0,0];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];normal[0]+=a[1]*b[2]-a[2]*b[1];normal[1]+=a[2]*b[0]-a[0]*b[2];normal[2]+=a[0]*b[1]-a[1]*b[0];}
 const magnitude=Math.hypot(...normal);if(!magnitude)throw Error('Zero Newell polygon area');
 const axis=normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs))),axes=[0,1,2].filter(index=>index!==axis),flat=p.map(point=>axes.map(index=>point[index]));
 const scale=Math.max(...flat.flat().map(Math.abs)),epsilon=Number.EPSILON*scale*scale*512;
 const area=flat.reduce((sum,a,i)=>sum+orient([0,0],a,flat[(i+1)%flat.length]),0)/2;
 if(Math.abs(area)<=epsilon)throw Error('Numerically degenerate projection');
 for(let i=0;i<flat.length;i++)for(let j=i+1;j<flat.length;j++){
  if(j===i+1||i===0&&j===flat.length-1)continue;
  if(intersects(flat[i],flat[(i+1)%flat.length],flat[j],flat[(j+1)%flat.length],epsilon))throw Error('Self-intersecting projected polygon');
 }
 const local=face.length===3?[[0,1,2]]:ShapeUtils.triangulateShape(flat.map(point=>new Vector2(...point)),[]);
 if(local.length!==face.length-2)throw Error('Tessellation lost source polygon vertices');
 let sum=0;const edges=new Map();
 for(const triangle of local){
  if(triangle.length!==3||new Set(triangle).size!==3||triangle.some(index=>!Number.isSafeInteger(index)||index<0||index>=face.length))throw Error('Invalid tessellation index');
  let triangleArea=orient(...triangle.map(index=>flat[index]))/2;
  if(Math.abs(triangleArea)<=epsilon)throw Error('Degenerate tessellation triangle');
  if(Math.sign(triangleArea)!==Math.sign(area)){[triangle[1],triangle[2]]=[triangle[2],triangle[1]];triangleArea=-triangleArea;}
  const [a,b,c]=triangle.map(index=>p[index]),ab=b.map((value,i)=>value-a[i]),ac=c.map((value,i)=>value-a[i]),cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  if(cross.reduce((value,n,i)=>value+n*normal[i],0)<=0)throw Error('Tessellation folds against source polygon winding');
  sum+=triangleArea;
  for(let i=0;i<3;i++){const x=triangle[i],y=triangle[(i+1)%3],key=[Math.min(x,y),Math.max(x,y)].join('/'),row=edges.get(key)??{count:0,direction:0};row.count++;row.direction+=x<y?1:-1;edges.set(key,row);}
 }
 if(Math.abs(sum-area)>Math.max(epsilon*face.length,Math.abs(area)*1e-10))throw Error('Tessellation projected-area mismatch');
 const perimeter=new Set();for(let i=0;i<face.length;i++){const next=(i+1)%face.length,key=[Math.min(i,next),Math.max(i,next)].join('/');perimeter.add(key);const edge=edges.get(key);if(!edge||edge.count!==1||edge.direction!==(i<next?1:-1))throw Error('Source polygon boundary not preserved');}
 for(const[key,edge]of edges)if(!perimeter.has(key)&&(edge.count!==2||edge.direction!==0))throw Error('Invalid internal tessellation edge');
 const maxPlaneDistance=Math.max(...p.map(point=>Math.abs(point.reduce((sum,value,i)=>sum+value*normal[i],0)/magnitude))),extent=Math.max(...[0,1,2].map(axis=>Math.max(...p.map(point=>point[axis]))-Math.min(...p.map(point=>point[axis]))));
 if(face.length>4&&maxPlaneDistance>extent*1e-6)throw Error('Nonplanar n-gon requires explicit source review');
 return{triangles:local.map(triangle=>triangle.map(index=>face[index])),polygonVertices:face.length,projectionAxis:axis,maxPlaneDistanceSourceUnits:maxPlaneDistance,planeDistanceFraction:extent?maxPlaneDistance/extent:0,nonplanarQuad:face.length===4&&maxPlaneDistance>extent*1e-6,projectedAreaSourceUnits2:area};
}

export function triangulateSourceObject(object){
 const triangles=[],polygonRanges=[],failures=[];let nonplanarQuads=0,maxPlaneDistanceFraction=0;const nGons=[];
 for(let i=0;i<object.faces.length;i++){
  try{const result=triangulateSourcePolygon(object.vertices,object.faces[i]);polygonRanges.push({sourceFace:i,firstTriangle:triangles.length,triangles:result.triangles.length});triangles.push(...result.triangles);nonplanarQuads+=Number(result.nonplanarQuad);maxPlaneDistanceFraction=Math.max(maxPlaneDistanceFraction,result.planeDistanceFraction);if(result.polygonVertices>4)nGons.push({sourceFace:i,...result});}
  catch(error){failures.push({sourceFace:i,reason:error.message});}
 }
 // A failed face holds the entire labelled object; never omit it as a "repair".
 return{name:object.name,vertices:object.vertices,triangles:failures.length?null:triangles,polygonRanges:failures.length?null:polygonRanges,failures,nonplanarQuads,maxPlaneDistanceFraction,nGons};
}
