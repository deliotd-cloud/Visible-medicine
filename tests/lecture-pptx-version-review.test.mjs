import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {compareMedia,compareIntakes,renderComparison,fileHash,loadBoundIntake,writePrivateComparison} from '../scripts/lecture-pptx-version-review.mjs';
const h=n=>String(n).repeat(64);
const media=(hash,extra={})=>({sha256:hash,targetMode:'Internal',part:'ppt/media/a.png',relationshipId:'rId2',...extra});
function intake(text='Heading',mediaRows=[]) {
  const s={position:1,part:'ppt/slides/slide1.xml',partSha256:h(1),anchor:h(9)+':ppt/slides/slide1.xml',textBlocks:[{paragraphs:[{text}]}],notesBlocks:[],media:mediaRows,tables:[],notesParts:[]};
  return {state:'quarantined',readyForPublication:false,source:{sha256:h(9)},slides:[s],parts:[{part:s.part,sha256:s.partSha256}]};
}
test('relationship or package rename is metadata, not changed media bytes',()=>{
  const r=compareMedia([media(h(1))],[media(h(1),{part:'ppt/media/b.png',relationshipId:'rId8'})]);
  assert.equal(r.metadataChanged,true);assert.equal(r.content,'same-direct-byte-multiset');assert.equal(r.orderChanged,false);
});
test('same-name replacement with different byte hash is detected',()=>{
  const r=compareMedia([media(h(1))],[media(h(2))]);assert.equal(r.metadataChanged,false);assert.equal(r.content,'different-direct-byte-multiset');
});
test('media reordering is separate from a different byte multiset',()=>{
  const r=compareMedia([media(h(1)),media(h(2))],[media(h(2)),media(h(1))]);assert.equal(r.content,'same-direct-byte-multiset');assert.equal(r.orderChanged,true);
});
test('duplicate media occurrences retain multiplicity',()=>{
  assert.equal(compareMedia([media(h(1))],[media(h(1)),media(h(1))]).content,'different-direct-byte-multiset');
});
test('missing and unresolved hashes remain unknown even when records match',()=>{
  for(const hash of [null,undefined,'']){const r=compareMedia([media(hash)],[media(hash)]);assert.equal(r.content,'unknown');assert.equal(r.orderChanged,null);}
});
test('empty direct-media arrays compare without inferring inherited content',()=>{
  assert.equal(compareMedia([],[]).content,'same-direct-byte-multiset');assert.equal(compareMedia([],[media(h(1))]).content,'different-direct-byte-multiset');
});
test('external and unsupported target modes cannot claim equal media bytes',()=>{
  for(const mode of ['External','Unknown',null,undefined])assert.equal(compareMedia([media(h(1),{targetMode:mode})],[media(h(1),{targetMode:mode})]).content,'unknown');
});
test('intake comparison keeps notes and shared themes visible',()=>{
  const a=intake(),b=intake();b.slides[0].notesBlocks=[{paragraphs:[{text:'Presenter note'}]}];
  a.parts.push({part:'ppt/theme/theme1.xml',sha256:h(2)});b.parts.push({part:'ppt/theme/theme1.xml',sha256:h(3)});
  const r=compareIntakes(a,b);assert.equal(r.counts.notesChanged,1);assert.equal(r.counts.textChanged,0);assert.equal(r.changedSharedParts.length,1);
  assert.equal(r.readyForPublication,false);assert.equal(r.sourceSelected,false);
});
test('unmatched tails are positions, not proven semantic additions/deletions',()=>{
  const a=intake(),b=intake();b.slides=[];const r=compareIntakes(a,b);assert.equal(r.counts.unmatchedPositions,1);assert.equal(r.positions[0].semanticAdditionOrDeletionProven,false);
});
test('changed source anchor, part hash, malformed intake and falsely ready state fail closed',()=>{
  const a=intake();for(const mutate of [b=>b.slides[0].anchor='wrong',b=>b.slides[0].partSha256=h(7),b=>b.readyForPublication=true,b=>b.slides[0].textBlocks=null]){
    const b=structuredClone(a);mutate(b);assert.throws(()=>compareIntakes(a,b));
  }
});
test('report treats source text as literal Markdown text',()=>{
  const a=intake('hello'),b=intake('[click](https://example.test) | <script>oops</script>');
  const r=renderComparison(compareIntakes(a,b));assert(r.includes('\\[click\\]'));assert(r.includes('\\|'));assert(r.includes('\\<script\\>'));assert(!r.includes('[click](https://example.test)'));
});
function fixture(t) {
  const root=fs.mkdtempSync(path.join(tmpdir(),'vm-version-review-'));
  t.after(()=>{const real=fs.realpathSync(root),base=fs.realpathSync(tmpdir());assert(real.startsWith(base+path.sep));assert.match(path.basename(real),/^vm-version-review-[^\\/]+$/);fs.rmSync(real,{recursive:true,force:true});});
  const deck=path.join(root,'synthetic.pptx'),file=path.join(root,'intake.json');fs.writeFileSync(deck,'Synthetic source bytes, not a rendered presentation.');
  const data=intake();data.source.sha256=fileHash(deck);data.slides[0].anchor=data.source.sha256+':'+data.slides[0].part;fs.writeFileSync(file,JSON.stringify(data));return {root,deck,file,data};
}
test('bound source replay rejects a changed deck and preserves source bytes',t=>{
  const f=fixture(t);const original=fileHash(f.deck),receipt=fileHash(f.file);assert.equal(loadBoundIntake(f.deck,f.file,receipt).source.sha256,original);
  fs.writeFileSync(f.deck,'Changed synthetic bytes');assert.throws(()=>loadBoundIntake(f.deck,f.file,receipt),/does not match intake/);
});
test('private output is create-only, outside the source checkout, with unchanged inputs',t=>{
  const f=fixture(t),out=path.join(f.root,'private-report');const before=[fileHash(f.deck),fileHash(f.file)];
  const options={leftDeck:f.deck,leftIntake:f.file,leftIntakeSha256:before[1],rightDeck:f.deck,rightIntake:f.file,rightIntakeSha256:before[1],output:out};
  assert.equal(writePrivateComparison(options).readyForPublication,false);
  assert(fs.existsSync(path.join(out,'REVIEW.md')));assert.deepEqual([fileHash(f.deck),fileHash(f.file)],before);
  assert.throws(()=>writePrivateComparison(options),/already exists/);
  const sourceOutput=fileURLToPath(new URL('../public/private-report',import.meta.url));
  assert.throws(()=>writePrivateComparison({...options,output:sourceOutput}),/outside the website source tree/);assert(!fs.existsSync(sourceOutput));
});
test('changed intake text with unchanged claimed source and part hashes is rejected by its receipt',t=>{
  const f=fixture(t),receipt=fileHash(f.file);f.data.slides[0].textBlocks[0].paragraphs[0].text='Tampered text';fs.writeFileSync(f.file,JSON.stringify(f.data));
  assert.throws(()=>loadBoundIntake(f.deck,f.file,receipt),/no longer matches/);assert.throws(()=>loadBoundIntake(f.deck,f.file),/independently verified intake receipt/);
});
test('a forged or missing source identity and inconsistent internal media digest are refused',()=>{
  const a=intake();const b=intake();delete b.source.sha256;b.slides[0].anchor='undefined:'+b.slides[0].part;assert.throws(()=>compareIntakes(a,b),/Invalid source deck hash/);
  const c=intake('Heading',[media(h(3),{targetMode:'Internal'})]);c.parts.push({part:'ppt/media/a.png',sha256:h(2)});assert.throws(()=>compareIntakes(a,c),/Media hash does not match/);
});
