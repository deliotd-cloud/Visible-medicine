import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreRelease18AdjacentHelper} from './release18-continuous-playback-inverse.mjs';
import {restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const current=read('./adjacent-current-role-inverse.mjs');
test('current adjacent helper preserves the complete prior helper and rejects undeclared edits',()=>{
 const prior=restoreRelease18AdjacentHelper(current);
 assert.equal(sha(prior),'064c45e32a766fe893bd07f72df6476da7bd8fd6231054b5f1c32223b7a43c46');
 assert.equal(sha(restoreReleaseDiagnosticContext('tests/adjacent-current-role-inverse.mjs',prior)),'c2df3cea3cebd3dd340d62407e14dd1b17b66f2c2d34ea226bff74a49bc7ee04');
 const missing=Buffer.from(current.toString().replace('bytes=restoreRelease18ContinuousPlayback(bytes);',''));
 assert.notDeepEqual(missing,current);
 const flipped=Buffer.from(current);flipped[0]^=1;
 for(const bad of [missing,flipped,Buffer.concat([current,Buffer.from('// foreign')])])assert.throws(()=>restoreRelease18AdjacentHelper(bad));
});
test('the original four-case tour history fixture stays immutable for its authenticated historical dispatcher',()=>{
 assert.equal(sha(read('./nine-history-original-adjacent-current-tour-source-roles.mjs')),'66cb2d654960cb270564da64478a21672ff84fddba89b6b56f6a56d2450eb99c');
 const wrapper=read('./adjacent-current-tour-source-roles.test.mjs').toString();
 assert(wrapper.includes("runNineHistory('adjacent-current-tour-source-roles')"));
});
