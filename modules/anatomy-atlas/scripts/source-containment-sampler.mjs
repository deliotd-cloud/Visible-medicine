import assert from 'node:assert/strict';
import {Box3,Ray,Vector3} from 'three';
import {sourceTopology} from './source-topology.mjs';
import {spatialDistanceIndex} from './source-spatial-math.mjs';

// Three-direction even/odd ray sampling of original closed source surfaces.
// This classifies points against an envelope, NOT anatomical tissue or a lumen.
export function sourceContainmentSampler(shape,{boundaryMm=1e-6}={}){
 assert(Number.isFinite(boundaryMm)&&boundaryMm>0,'Invalid boundary tolerance');
 const topology=sourceTopology(shape),supported=topology.closedOrientedManifold;
 const directions=[[1,.137,.311],[-.233,1,.419],[.173,-.283,1]].map(v=>new Vector3(...v).normalize());
 if(!supported)return {topology,supported,boundaryMm,sample:()=>({classification:'unsupported-open-or-invalid-surface',distanceMm:null,parities:[]})};
 const nearest=spatialDistanceIndex(shape),entries=shape.triangles.map(({triangle})=>({triangle,box:new Box3().setFromPoints([triangle.a,triangle.b,triangle.c])}));
 function build(items){const box=new Box3();for(const i of items)box.union(i.box);if(items.length<=12)return {box,items};
  const size=box.getSize(new Vector3()),axis=size.x>=size.y&&size.x>=size.z?'x':size.y>=size.z?'y':'z';
  items.sort((a,b)=>a.box.min[axis]+a.box.max[axis]-b.box.min[axis]-b.box.max[axis]);const n=Math.floor(items.length/2);return {box,children:[build(items.slice(0,n)),build(items.slice(n))]};}
 const root=build(entries);
 function parity(point,direction){const ray=new Ray(point,direction),hits=[],intersection=new Vector3();
  function visit(node){if(!ray.intersectsBox(node.box))return;if(node.items){for(const {triangle}of node.items){if(ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,intersection)){const d=intersection.distanceTo(point);if(d>boundaryMm)hits.push(d);}}}else for(const child of node.children)visit(child);}
  visit(root);hits.sort((a,b)=>a-b);const unique=hits.filter((d,i)=>i===0||d-hits[i-1]>boundaryMm*.1);return unique.length%2;
 }
 return {topology,supported,boundaryMm,sample(value){assert(Array.isArray(value)&&value.length===3&&Array.from(value).every(Number.isFinite),'Invalid sample point');
  const point=new Vector3(...value),distanceMm=nearest(point);if(distanceMm<=boundaryMm)return {classification:'boundary',distanceMm,parities:[]};
  const parities=directions.map(d=>parity(point,d));return {classification:parities.every(p=>p===1)?'inside-envelope':parities.every(p=>p===0)?'outside-envelope':'ambiguous',distanceMm,parities};
 }};
}
