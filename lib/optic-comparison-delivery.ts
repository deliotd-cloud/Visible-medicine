type Packet = {
  purpose: string; reportSha256: string; admissions: number; clinicalValidation: boolean;
  sourceGeometryChanged: boolean; files: Array<{ name: string; bytes: number; sha256: string }>;
};
const base = '/api/atlas-review/source-comparisons/optic/';
const types: Record<string,string> = {
  'index.html': 'text/html; charset=utf-8', 'app.js': 'text/javascript; charset=utf-8',
  'scene.json': 'application/json; charset=utf-8', 'THIRD_PARTY_NOTICES.txt': 'text/plain; charset=utf-8',
};
/** Call ONLY after the existing Clinical Review principal check, on every request.
 * Read-only: no decision storage, source admission, clinical sign-off or upload. */
export async function deliverOpticComparison(request: Request, packet: Packet, assets: Record<string,string>) {
  const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, oai-authenticated-user-id',
    'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN', 'X-Robots-Tag': 'noindex, nofollow' };
  const denied = (status: number, error: string) => new Response(request.method === 'HEAD' ? null : JSON.stringify({ error }), {
    status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
  if (!['GET','HEAD'].includes(request.method)) return denied(405, 'Read-only source comparison.');
  if (packet.purpose !== 'source-only-optic-alternative-review' || packet.admissions !== 0 || packet.clinicalValidation !== false || packet.sourceGeometryChanged !== false)
    return denied(503, 'Held comparison packet unavailable.');
  const url = new URL(request.url), name = url.pathname.slice(base.length);
  if (!url.pathname.startsWith(base) || !Object.hasOwn(types,name)) return denied(404, 'Unknown comparison asset.');
  const revisions = url.searchParams.getAll('revision');
  if (revisions.length !== 1 || !/^[a-f0-9]{64}$/.test(revisions[0]) || revisions[0] !== packet.reportSha256 || [...url.searchParams.keys()].some(k => k !== 'revision'))
    return denied(409, 'Comparison revision changed; reopen Clinical Review.');
  const pins = packet.files.filter(f => f.name === name);
  if (pins.length !== 1 || !Object.hasOwn(assets,name)) return denied(503, 'Comparison asset unavailable.');
  try {
    const bytes = Uint8Array.from(atob(assets[name]), c => c.charCodeAt(0)), pin = pins[0];
    if (bytes.length !== pin.bytes) return denied(503, 'Comparison asset evidence changed.');
    const digest = await crypto.subtle.digest('SHA-256',bytes);
    const sha = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
    if (sha !== pin.sha256) return denied(503, 'Comparison asset evidence changed.');
    return new Response(request.method === 'HEAD' ? null : bytes, { headers: { ...headers,
      'Content-Type': types[name], 'Content-Length': String(bytes.length),
      'X-Source-Asset-Bytes': String(bytes.length), 'X-Source-Asset-SHA256': pin.sha256,
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; frame-ancestors 'self'; object-src 'none'; base-uri 'none'",
    } });
  } catch { return denied(503, 'Comparison asset unavailable.'); }
}
