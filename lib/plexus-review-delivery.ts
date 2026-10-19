import {validatePlexusReviewContext} from './plexus-review-decisions';
type Packet={schemaVersion:number;purpose:string;admissions:number;clinicalValidation:boolean;patientDataIncluded:boolean;context:unknown;files:Array<{name:string;bytes:number;sha256:string}>};
const base='/api/atlas-review/source-comparisons/plexus/';
const types:Record<string,string>={'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','app.css':'text/css; charset=utf-8','study.json':'application/json; charset=utf-8','THIRD_PARTY_NOTICES.txt':'text/plain; charset=utf-8'};
/** Every caller must authenticate with runClinicalReview; assets never enter public/. */
export async function deliverPlexusReview(request:Request,packet:Packet,assets:Record<string,string>){
  const headers={'Cache-Control':'private, no-store','Vary':'Cookie, oai-authenticated-user-id','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','X-Robots-Tag':'noindex, nofollow'};
  const denied=(status:number,error:string)=>new Response(request.method==='HEAD'?null:JSON.stringify({error}),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
  if(!['GET','HEAD'].includes(request.method))return denied(405,'Read-only schematic asset.');
  try{
    if(packet.schemaVersion!==1||packet.purpose!=='private-original-plexus-schematic-review'||packet.admissions!==0||packet.clinicalValidation!==false||packet.patientDataIncluded!==false)return denied(503,'Held schematic packet unavailable.');
    const context=validatePlexusReviewContext(packet.context),url=new URL(request.url),name=url.pathname.slice(base.length);
    if(!url.pathname.startsWith(base)||!Object.hasOwn(types,name))return denied(404,'Unknown schematic asset.');
    if(url.searchParams.size!==1||url.searchParams.getAll('revision').length!==1||url.searchParams.get('revision')!==context.materialHash)return denied(409,'Schematic revision changed; reopen Clinical Review.');
    if(packet.files.length!==Object.keys(types).length||new Set(packet.files.map(f=>f.name)).size!==packet.files.length||packet.files.some(f=>!Object.hasOwn(types,f.name)))return denied(503,'Schematic asset inventory changed.');
    const pins=packet.files.filter(f=>f.name===name),encoded=assets[name];
    if(pins.length!==1||typeof encoded!=='string'||encoded.length>8_000_000)return denied(503,'Schematic asset unavailable.');
    const pin=pins[0];
    if(!Number.isSafeInteger(pin.bytes)||pin.bytes<=0||pin.bytes>6_000_000||!/^[a-f0-9]{64}$/.test(pin.sha256))return denied(503,'Schematic asset evidence invalid.');
    const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
    if(bytes.length!==pin.bytes)return denied(503,'Schematic asset bytes changed.');
    const digest=await crypto.subtle.digest('SHA-256',bytes),sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    if(sha!==pin.sha256)return denied(503,'Schematic asset hash changed.');
    return new Response(request.method==='HEAD'?null:bytes,{headers:{...headers,'Content-Type':types[name],'Content-Length':String(bytes.length),'X-Source-Asset-Bytes':String(bytes.length),'X-Source-Asset-SHA256':sha,
      'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; font-src 'none'"}});
  }catch{return denied(503,'Schematic asset unavailable.');}
}
