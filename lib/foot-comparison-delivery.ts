import 'server-only';

type Manifest={purpose:string;revision:string;admissions:number;clinicalValidation:boolean;registered:boolean;sourceGeometryChanged:boolean;files:Array<{name:string;bytes:number;sha256:string}>};
const base='/api/atlas-review/source-comparisons/foot/';
const maxAssetBytes=16*1024*1024;
// Allocate only the declared size; reject excess output before retaining it.
async function expandPinnedAsset(encoded:string,expectedBytes:number){
  if(!Number.isSafeInteger(expectedBytes)||expectedBytes<1||expectedBytes>maxAssetBytes||
    typeof encoded!=='string'||encoded.length>maxAssetBytes*2)throw Error('Invalid asset size.');
  const compressed=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const reader=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const bytes=new Uint8Array(expectedBytes);let length=0;
  try{
    for(;;){const chunk=await reader.read();if(chunk.done)break;
      if(chunk.value.byteLength>expectedBytes-length)throw Error('Asset exceeds pinned size.');
      bytes.set(chunk.value,length);length+=chunk.value.byteLength;
    }
    if(length!==expectedBytes)throw Error('Asset is shorter than pinned size.');
    return bytes;
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
const mime=(name:string)=>name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.json')?'application/json; charset=utf-8':name.endsWith('.obj')?'text/plain; charset=utf-8':'text/plain; charset=utf-8';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie, oai-authenticated-user-id','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','X-Robots-Tag':'noindex, nofollow',
  'Content-Security-Policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"};
/** Call inside runClinicalReview for EVERY request. No approval, upload, or Atlas mutation. */
export async function deliverFootComparison(request:Request, manifest:Manifest, assets:Record<string,string>):Promise<Response>{
  const denied=(status:number,error:string)=>new Response(request.method==='HEAD'?null:JSON.stringify({error}),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
  if(request.method!=='GET'&&request.method!=='HEAD')return denied(405,'Read-only source comparison.');
  if(manifest.purpose!=='held-v3-foot-source-inspection'||manifest.admissions!==0||manifest.clinicalValidation!==false||manifest.registered!==false||manifest.sourceGeometryChanged!==false)return denied(503,'Held comparison unavailable.');
  const url=new URL(request.url),name=url.pathname.slice(base.length);
  if(!url.pathname.startsWith(base)||!name||name.includes('/')||!Object.hasOwn(Object.fromEntries(manifest.files.map(f=>[f.name,true])),name))return denied(404,'Unknown comparison asset.');
  const revisions=url.searchParams.getAll('revision'),detail=url.searchParams.getAll('detail');
  if(revisions.length!==1||revisions[0]!==manifest.revision||!(/^[a-f0-9]{64}$/).test(revisions[0])||detail.length>1||detail.length===1&&(name!=='index.html'||!['95','99'].includes(detail[0]))||[...url.searchParams.keys()].some(k=>k!=='revision'&&k!=='detail'))return denied(409,'Comparison revision changed; reopen Clinical Review.');
  const pins=manifest.files.filter(f=>f.name===name);
  if(pins.length!==1||!(/^[A-Za-z0-9_.-]+$/).test(name))return denied(503,'Comparison asset unavailable.');
  try{
    if(!Object.hasOwn(assets,name))return denied(503,'Comparison asset unavailable.');
    const pin=pins[0],bytes=await expandPinnedAsset(assets[name],pin.bytes);
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    const sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    if(bytes.length!==pin.bytes||sha!==pin.sha256)return denied(503,'Comparison asset evidence changed.');
    const attachment=name.endsWith('.obj')||['source-readme.html','license-deed.html','license-legalcode.html'].includes(name);
    return new Response(request.method==='HEAD'?null:bytes,{headers:{...headers,'Content-Type':mime(name),'Content-Length':String(bytes.length),'X-Source-Asset-Bytes':String(bytes.length),'X-Source-Asset-SHA256':pin.sha256,...(attachment?{'Content-Disposition':`attachment; filename="${name}"`}:{})}});
  }catch{return denied(503,'Comparison asset unavailable.');}
}
