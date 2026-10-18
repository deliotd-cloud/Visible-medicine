type Packet = {
  purpose: string; reportSha256: string; admissions: number; clinicalValidation: boolean;
  sourceGeometryChanged: boolean; levelAssigned: boolean; meshCount: number;
  meshes: Array<{key: string; id: string; role: string; held: boolean}>;
  files: Array<{name: string; bytes: number; sha256: string}>;
};
const base = '/api/atlas-review/source-comparisons/disc/';
const types: Record<string,string> = {
  'index.html': 'text/html; charset=utf-8', 'app.js': 'text/javascript; charset=utf-8',
  'scene.json': 'application/json; charset=utf-8', 'THIRD_PARTY_NOTICES.txt': 'text/plain; charset=utf-8',
};
/** Invoke only through runClinicalReview: authority is checked on every GET/HEAD.
 * No mutation, decision storage, level assignment or anatomy admission. */
export async function deliverDiscComparison(request: Request, packet: Packet, assets: Record<string,string>) {
  const headers = {'Cache-Control':'private, no-store', Vary:'Cookie, oai-authenticated-user-id',
    'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
    'X-Frame-Options':'SAMEORIGIN','X-Robots-Tag':'noindex, nofollow'};
  const denied = (status: number, error: string) => new Response(request.method === 'HEAD' ? null : JSON.stringify({error}), {
    status, headers:{...headers,'Content-Type':'application/json; charset=utf-8'},
  });
  if (!['GET','HEAD'].includes(request.method)) return denied(405,'Read-only source comparison.');
  const expectedCandidates = [['isa/FJ3211','FMA10446'],['partof/FJ3211','FMA25511']];
  if (packet.purpose !== 'source-only-unresolved-disc-review' || packet.admissions !== 0 || packet.clinicalValidation !== false ||
      packet.sourceGeometryChanged !== false || packet.levelAssigned !== false || packet.meshCount !== 8 || packet.meshes?.length !== 8 ||
      packet.meshes.filter(m=>m.role==='candidate').length !== 2 || expectedCandidates.some(([key,id])=>
        packet.meshes.filter(m=>m.key===key && m.id===id && m.role==='candidate' && m.held===true).length !== 1))
    return denied(503,'Held disc comparison unavailable.');
  const url = new URL(request.url), name = url.pathname.slice(base.length);
  if (!url.pathname.startsWith(base) || !Object.hasOwn(types,name)) return denied(404,'Unknown comparison asset.');
  const revisions = url.searchParams.getAll('revision');
  if (revisions.length !== 1 || !/^[a-f0-9]{64}$/.test(revisions[0]) || revisions[0] !== packet.reportSha256 || [...url.searchParams.keys()].some(k=>k!=='revision'))
    return denied(409,'Comparison revision changed; reopen Clinical Review.');
  const pins = packet.files.filter(f=>f.name===name);
  if (pins.length !== 1 || !Object.hasOwn(assets,name)) return denied(503,'Comparison asset unavailable.');
  try {
    const bytes = Uint8Array.from(atob(assets[name]),c=>c.charCodeAt(0)), pin = pins[0];
    if (bytes.length !== pin.bytes) return denied(503,'Comparison asset evidence changed.');
    const digest = await crypto.subtle.digest('SHA-256',bytes);
    const sha = Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    if (sha !== pin.sha256) return denied(503,'Comparison asset evidence changed.');
    return new Response(request.method==='HEAD' ? null : bytes,{headers:{...headers,
      'Content-Type':types[name],'Content-Length':String(bytes.length),'X-Source-Asset-Bytes':String(bytes.length),'X-Source-Asset-SHA256':pin.sha256,
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; frame-ancestors 'self'; object-src 'none'; base-uri 'none'",
    }});
  } catch { return denied(503,'Comparison asset unavailable.'); }
}
