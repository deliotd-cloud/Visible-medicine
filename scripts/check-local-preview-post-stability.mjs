// Synthetic unauthenticated requests only. No cookies, scans or review decisions.
import assert from 'node:assert/strict';
const port = process.argv[2] ?? '3000';
if (!['3000', '3196'].includes(port)) throw new Error('Use scoped loopback preview port 3000 or 3196');
const origin = `http://127.0.0.1:${port}`;
const decisions = '/api/atlas-review/body-review/decisions';
const receipts = [];
async function request(path, expected, options = {}) {
  const response = await fetch(origin + path, {
    ...options,
    redirect: 'manual',
    signal: AbortSignal.timeout(10000),
    headers: { Connection: 'close', ...options.headers },
  });
  await response.arrayBuffer();
  assert.equal(response.status, expected, `${options.method ?? 'GET'} ${path}`);
  receipts.push({ method: options.method ?? 'GET', path, status: response.status });
}
// Refuse to send even a synthetic POST unless this session is unauthenticated.
await request(decisions, 401);
for (let cycle = 0; cycle < 20; cycle++) {
  await request(decisions, 401, {
    method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{}',
  });
  await request(['/atlas/3d', '/atlas/ct-head', '/atlas/mri-head'][cycle % 3], 200);
}
console.log(JSON.stringify({ at: new Date().toISOString(), origin, checks: receipts.length,
  receipts, syntheticOnly: true, signedInAcceptance: false, publicDeployment: false }, null, 2));
