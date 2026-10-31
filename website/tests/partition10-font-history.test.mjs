import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPresentationFontBeforeProvenance,assertPresentationFontProvenance,restorePresentationBeforeFontProvenance} from './partition10-font-history.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
test('historical presentation remains exact and current font provenance is independently checked',()=>{
 const current=read('tests/imaging-presentation.test.mjs');
 assert.equal(createHash('sha256').update(restorePresentationBeforeFontProvenance(current)).digest('hex'),'b8759b92109408ad937727b029b667e3d698d17dcefb8d0194995a5ec81dc5e2');
 assert.equal(readPresentationFontBeforeProvenance().length,23108);assertPresentationFontProvenance({read});
 for(const alter of [s=>s+'\n// changed',s=>s.replace('assertPresentationFontProvenance({read});',''),s=>s.replace('5f3d6ad60f29','000000000000'),s=>s.replace('No auth, splash, navigation or metadata edits','Changed assertion')]){
  assert.throws(()=>restorePresentationBeforeFontProvenance(Buffer.from(alter(current.toString()))));
 }
});
test('changed font, provenance, licence and missing notices are rejected',()=>{
 for(const target of ['public/fonts/geist-mono-latin.woff2','LICENSES/native-website/geist-mono-provenance.json','LICENSES/geist-mono-OFL.txt','public/licenses/geist-mono-OFL.txt','LICENSES/THIRD_PARTY_NOTICES.md']){
  assert.throws(()=>assertPresentationFontProvenance({read:path=>path===target?Buffer.from('changed'):read(path)}),target);
 }
});
