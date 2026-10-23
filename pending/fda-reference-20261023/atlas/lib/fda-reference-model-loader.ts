import {BufferGeometry,Material,Mesh,Object3D} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {assertPinnedFdaCatalogue,fdaReferenceAssetUrl,fdaReferenceCatalogueSha256,fdaReferenceDigest,type FdaReferenceStructure,type FdaShoulderReference} from './fda-shoulder-reference';

export type FdaReferenceModel={catalogue:FdaShoulderReference;revision:string;meshes:Array<{structure:FdaReferenceStructure;geometry:BufferGeometry}>;dispose:()=>void};
export type FdaReferenceLoadOptions={assetBase?:string;signal?:AbortSignal;expectedRevision?:string};
const abort=(signal?:AbortSignal)=>{if(signal?.aborted)throw new DOMException('Reference loading cancelled','AbortError');};
/** Bounded, same-origin, non-redirecting fetch. No external model or auth fallback. */
export async function readFdaReferenceBytes(url:string,limit:number,signal?:AbortSignal,fetcher:typeof fetch=fetch):Promise<Uint8Array>{
 abort(signal);
 const response=await fetcher(url,{credentials:'same-origin',redirect:'error',signal});
 if(!response.ok||response.redirected)throw new Error('Reference asset unavailable');
 const length=response.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>limit))throw new Error('Reference response exceeds its size limit');
 if(!response.body)throw new Error('Reference asset has no response body');
 const reader=response.body.getReader(),out=new Uint8Array(limit);let offset=0,complete=false;
 try{
  while(true){abort(signal);const {done,value}=await reader.read();if(done){complete=true;break;}
   if(offset+value.byteLength>limit)throw new Error('Reference response exceeds its size limit');
   out.set(value,offset);offset+=value.byteLength;
  }
  abort(signal);return out.slice(0,offset);
 }finally{if(!complete)await reader.cancel().catch(()=>{});reader.releaseLock();}
}
/** Extra refusal before Three can process any embedded glTF resource declarations. */
export function inspectFdaReferenceGlb(bytes:Uint8Array,catalogue:FdaShoulderReference){
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.byteLength<28||v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==bytes.byteLength)throw new Error('Invalid reference GLB header');
 const jsonLength=v.getUint32(12,true),binOffset=20+jsonLength;
 if(jsonLength%4||binOffset+8>bytes.length||v.getUint32(16,true)!==0x4e4f534a||v.getUint32(binOffset+4,true)!==0x004e4942||binOffset+8+v.getUint32(binOffset,true)!==bytes.length)throw new Error('Invalid reference GLB chunks');
 const doc=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(20,binOffset)));
 if(doc.asset?.version!=='2.0'||doc.asset?.extras?.status!=='draft-independent-reference')throw new Error('Reference GLB has another source scope');
 for(const key of ['images','textures','animations','skins','cameras','extensions','extensionsUsed','extensionsRequired','materials'])if(doc[key]!==undefined)throw new Error('Unsupported reference GLB resources');
 // This draft format has one embedded binary chunk and no URI, extension or transform at any depth.
 const walk=(x:unknown)=>{if(!x||typeof x!=='object')return;for(const [key,val]of Object.entries(x)){
  if(['uri','extensions','matrix','translation','rotation','scale','children'].includes(key))throw new Error('External or transformed reference resource refused');walk(val);
 }};walk(doc);
 if(doc.buffers?.length!==1||doc.buffers[0].byteLength!==v.getUint32(binOffset,true)||doc.nodes?.length!==6||doc.meshes?.length!==6||doc.scene!==0||doc.scenes?.length!==1||doc.scenes[0].nodes?.join(',')!=='0,1,2,3,4,5')throw new Error('Unexpected reference GLB assembly');
 for(const [i,s]of catalogue.structures.entries()){
  const node=doc.nodes[i],mesh=doc.meshes[i],p=mesh?.primitives?.[0];
  if(node.name!==s.nodeName||node.mesh!==i||mesh.name!==s.nodeName||mesh.primitives.length!==1||p.mode!==4||doc.accessors?.[p.attributes?.POSITION]?.count!==s.vertices||doc.accessors?.[p.attributes?.NORMAL]?.count!==s.vertices||doc.accessors?.[p.indices]?.count!==s.triangles*3)throw new Error('Reference source-part identity mismatch');
 }
 return doc;
}
function disposeScene(scene:Object3D){
 const geometries=new Set<BufferGeometry>(),materials=new Set<Material>();
 scene.traverse(o=>{if(o instanceof Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
}
export async function loadFdaReference(options:FdaReferenceLoadOptions={},fetcher:typeof fetch=fetch):Promise<FdaReferenceModel>{
 if(options.expectedRevision!==undefined&&options.expectedRevision!==fdaReferenceCatalogueSha256)throw new Error('Stale reference revision; no substitute loaded');
 const url=fdaReferenceAssetUrl(options.assetBase),catalogueUrl=url.replace(/reference\.glb$/,'catalog.json');
 const raw=await readFdaReferenceBytes(catalogueUrl,65536,options.signal,fetcher);
 if(await fdaReferenceDigest(raw)!==fdaReferenceCatalogueSha256)throw new Error('Reference catalogue checksum mismatch');
 const catalogue=await assertPinnedFdaCatalogue(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw)));
 const bytes=await readFdaReferenceBytes(url,catalogue.bundle.bytes,options.signal,fetcher);
 if(bytes.length!==catalogue.bundle.bytes||await fdaReferenceDigest(bytes)!==catalogue.bundle.sha256)throw new Error('Reference geometry checksum mismatch');
 abort(options.signal);inspectFdaReferenceGlb(bytes,catalogue);
 const loaded=await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer,'');
 try{
  abort(options.signal);const byName=new Map<string,Mesh>();
  loaded.scene.traverse(o=>{if(o instanceof Mesh){if(byName.has(o.name))throw new Error('Duplicate reference mesh');byName.set(o.name,o);}});
  if(byName.size!==6)throw new Error('Unexpected reference mesh count');
  const meshes=catalogue.structures.map(structure=>{
   const mesh=byName.get(structure.nodeName),geometry=mesh?.geometry;
   if(!geometry||geometry.getAttribute('position')?.count!==structure.vertices||geometry.index?.count!==structure.triangles*3)throw new Error('Decoded reference identity mismatch');
   return {structure,geometry};
  });
  let disposed=false;
  return {catalogue,meshes,revision:fdaReferenceCatalogueSha256,dispose:()=>{if(!disposed){disposed=true;disposeScene(loaded.scene);}}};
 }catch(error){disposeScene(loaded.scene);throw error;}
}
