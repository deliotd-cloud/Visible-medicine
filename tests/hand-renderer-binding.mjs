import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

/** Reproduce the Review binder's renderer metadata transform without writing files. */
export function deriveBoundRenderer(sourceBytes,websiteIntegrationSha256){
  assert(Buffer.isBuffer(sourceBytes));
  assert.match(websiteIntegrationSha256,/^[a-f0-9]{64}$/);
  const renderer=JSON.parse(sourceBytes);
  assert(renderer&&typeof renderer==='object'&&!Array.isArray(renderer));
  assert.match(renderer.sha256,/^[a-f0-9]{64}$/);
  renderer.sourceRendererSha256 ??= renderer.sha256;
  renderer.websiteIntegrationSha256=websiteIntegrationSha256;
  renderer.sha256=sha(JSON.stringify({source:renderer.sourceRendererSha256,website:websiteIntegrationSha256}));
  return Buffer.from(JSON.stringify(renderer,null,2)+'\n');
}
