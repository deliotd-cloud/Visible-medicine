import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {savedReviewEpoch} from './atlas-saved-review-epoch.ts';

const website='f232847c2d78013508bbd572258fbc35e133ea46';
const source='b4be1f0f343e54ee0fc021bcebac7bb62e978deb';
const manifestSha='e01bad9bfc1d241afd6b9a032076aa9c754d88ed1b50305d0c2049e3cefa7ec9';

test('saved Review epoch binds exact source and bytes and rejects cross-repo reads',()=>{
 assert.throws(()=>savedReviewEpoch(website,'0'.repeat(40),manifestSha),/saved Review source revision/);
 assert.throws(()=>savedReviewEpoch(website,source,'0'.repeat(64)),/saved Review manifest bytes/);
 const epoch=savedReviewEpoch(website,source,manifestSha);
 const bytes=epoch.readFileSync('atlas-review/manifest.json');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestSha);
 assert.equal(JSON.parse(bytes.toString()).revision,source);
 assert.throws(()=>epoch.readFileSync('../atlas/private.json'),/read outside website/);
 assert.throws(()=>epoch.readFileSync('F:/VisibleMedicine/atlas/README.md'),/read outside website/);
 assert.throws(()=>epoch.readFileSync('F:README.md'),/read outside website/);
 assert.throws(()=>epoch.readFileSync('G:README.md'),/read outside website/);
 assert.throws(()=>epoch.readFileSync('\\\\server\\share\\README.md'),/read outside website/);
 assert.throws(()=>epoch.readFileSync(Buffer.from('F:/VisibleMedicine/atlas/README.md')),/read outside website/);
 assert.throws(()=>epoch.readFileSync(pathToFileURL('F:/VisibleMedicine/atlas/README.md')),/read outside website/);
 assert.throws(()=>epoch.readFileSync(42 as any),/unsupported website path type/);
 assert.throws(()=>epoch.readFileSync(new URL('https://example.test/README.md')));
 assert.throws(()=>epoch.readFileSync(Buffer.from([0xff])),/encoded data/);
 assert.throws(()=>epoch.readFileSync('ATLAS-REVIEW/manifest.json'),/historical path casing/);
 assert.throws(()=>epoch.readFileSync('PACKAGE.JSON'),/historical path casing/);

 const frozenPath=resolve('atlas-review/manifest.json');
 assert.deepEqual(epoch.readFileSync(frozenPath),bytes);
 assert.deepEqual(epoch.readFileSync(pathToFileURL(frozenPath)),bytes);
 assert.deepEqual(epoch.readFileSync(Buffer.from(frozenPath)),bytes);
 assert.equal(epoch.readFileSync('atlas-review/manifest.json','utf8'),bytes.toString());
 const livePath=resolve('README.md');
 assert.deepEqual(epoch.readFileSync('README.md'),readFileSync(livePath));
 assert.deepEqual(epoch.readFileSync(livePath),readFileSync(livePath));
 assert.deepEqual(epoch.readFileSync(pathToFileURL(livePath)),readFileSync(livePath));
 assert.deepEqual(epoch.readFileSync(Buffer.from(livePath)),readFileSync(livePath));
 const originalCwd=process.cwd();
 try{
  process.chdir(resolve('tests'));
  assert.deepEqual(epoch.readFileSync('README.md'),readFileSync(livePath));
 }finally{
  process.chdir(originalCwd);
 }
});
