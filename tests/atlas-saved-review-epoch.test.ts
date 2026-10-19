import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
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
});
