import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Test-only proof for an explicitly pinned metadata checkout representation.
// It never rewrites evidence or grants rights to the represented source.
export function verifyMetadataTextCheckout(row,committed,exported,policy){
 assert.equal(row.path,policy.path,'Exact metadata path');
 assert.match(policy.exportSha256,/^[a-f0-9]{64}$/);
 assert.match(policy.committedSha256,/^[a-f0-9]{64}$/);
 for(const size of [policy.exportBytes,policy.committedBytes,policy.crlfPairs])assert(Number.isSafeInteger(size)&&size>=0&&size<=1048576,'Bounded metadata size');
 assert.equal(policy.exportBytes-policy.committedBytes,policy.crlfPairs,'Declared reversible representation');
 assert(Buffer.isBuffer(committed)&&Buffer.isBuffer(exported),'Exact bytes required');
 assert.equal(exported.length,policy.exportBytes);assert.equal(committed.length,policy.committedBytes);
 assert.equal(row.sha256,policy.exportSha256,'Closed exported metadata pin');
 assert.equal(sha(exported),policy.exportSha256,'Exact exported metadata bytes');
 assert.equal(sha(committed),policy.committedSha256,'Exact committed metadata bytes');
 const text=exported.toString('utf8');assert(Buffer.from(text,'utf8').equals(exported),'No lossy text conversion');
 assert(!text.includes('\0'),'No binary metadata fallback');
 assert.equal((text.match(/\r\n/g)||[]).length,policy.crlfPairs,'Exact CRLF count');
 const lf=text.replaceAll('\r\n','\n');assert(!lf.includes('\r'),'No bare-CR normalization');
 assert(Buffer.from(lf,'utf8').equals(committed),'Only declared CRLF-to-LF representation may differ');
 return true;
}
