import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyMetadataTextCheckout as verify} from './atlas-metadata-text-checkout.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const exported=Buffer.from('Synthetic metadata é\r\nRights are not conferred\r\n'),committed=Buffer.from(exported.toString().replaceAll('\r\n','\n'));
const policy={path:'LICENSES/synthetic-evidence.html',exportSha256:sha(exported),committedSha256:sha(committed),exportBytes:exported.length,committedBytes:committed.length,crlfPairs:2};
const row={path:policy.path,sha256:policy.exportSha256};
test('exact declared text checkout is proved without changing either input',()=>{const a=Buffer.from(exported),b=Buffer.from(committed);assert.equal(verify(row,committed,exported,policy),true);assert(a.equals(exported));assert(b.equals(committed));});
test('another metadata path or arbitrary declared digest is refused',()=>{assert.throws(()=>verify({...row,path:'another'},committed,exported,policy));assert.throws(()=>verify({...row,sha256:'0'.repeat(64)},committed,exported,policy));});
test('substantive source change cannot masquerade as checkout representation',()=>{const changed=Buffer.from(exported);changed[0]^=1;assert.throws(()=>verify(row,committed,changed,policy));assert.throws(()=>verify(row,Buffer.from('altered'),exported,policy));});
test('lossy UTF8, NUL, bare CR and wrong CRLF counts are refused',()=>{
 for(const bytes of [Buffer.from([0xff,13,10]),Buffer.from('a\0b\r\n'),Buffer.from('a\rb\r\n')]){
  const git=Buffer.from(bytes.toString('utf8').replaceAll('\r\n','\n'));
  const p={...policy,exportSha256:sha(bytes),committedSha256:sha(git),exportBytes:bytes.length,committedBytes:git.length,crlfPairs:bytes.length-git.length};
  assert.throws(()=>verify({...row,sha256:p.exportSha256},git,bytes,p));
 }
 assert.throws(()=>verify(row,committed,exported,{...policy,crlfPairs:1}));
});
test('oversize or non-buffer representations are refused',()=>{assert.throws(()=>verify(row,committed,exported,{...policy,exportBytes:1048577}));assert.throws(()=>verify(row,committed.toString(),exported,policy));});
