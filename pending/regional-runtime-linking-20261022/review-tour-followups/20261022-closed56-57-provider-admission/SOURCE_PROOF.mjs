import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';

const stage='F:/VisibleMedicine/staging/20261022-closed56-57-provider-admission/';
const candidate='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests/';
const sha=s=>createHash('sha256').update(s).digest('hex');
const read=p=>readFileSync(p,'utf8');
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'unique seam '+a.slice(0,80));return s.replace(a,b);};
const names=['closed56-femoral-epoch.test.mjs','head-manual-recovery-54-to-55-closed.test.mjs','historical-head-toolbar-css-extension.test.mjs','closed57-original-tests.test.mjs'];
const rawHashes=['61e2886316e369954d6902709d885357b1f6c62318eb4c5056260eb6d40ab718','a61fbe8b30ca01e50035c843399ae4cfbb0c0be214b3ec117b7424664cd5163d','ed5e97efb13abf3df17bea0d4175bd61b58101b35a086909672ac7091373ce19','926a8367daa7311ab955b25a5fc47b0ae1edae7845a3d4229bc2b9e0fed631da'];
const codeHashes=['1e2111111f5c9798a778710e65057680928c18ae79f954fc40796c4ca01fde4a','e7d47048bc2b69bd13ad1ca03cc3bb7db377cd8b0e720847165189c53b2f07af','b11a1e6d8216880a50e9dc8120b35d91eeeacf1e035e0762796054e2ca92af60','ac08121a7e58bf747880bd1a0c24c9479ee51ffdb8cfa0c7a2b2ef7f4ed10966'];
const raws=names.map((n,i)=>{const x=read(stage+'RAW/tests/'+n);assert.equal(sha(x),rawHashes[i]);assert.equal(x,read(candidate+n));return x;});
const codes=names.map(n=>read(stage+'CODE/tests/'+n));

// Invert only explicit current-delivery assertions; all closed56 history remains byte-identical.
let femoral=codes[0];
femoral=once(femoral," assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"," assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');");
femoral=once(femoral," assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');\n assert.deepEqual(pin.runtimeSources,{'head-neck':pin.source,shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9','lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9','female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9'});"," assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');");
femoral=once(femoral,' assert.equal(review.files.length,1558);',' assert.equal(review.files.length,1553);');
femoral=once(femoral,' assert.equal(inputs.inputs.length,1723);',' assert.equal(inputs.inputs.length,1710);');
assert.equal(femoral,raws[0]);

let manual=codes[1];
manual=once(manual," assert.equal(current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"," assert.equal(current.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');");
manual=once(manual," assert.equal(current.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');"," assert.equal(current.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');");
manual=once(manual," assert.equal(current.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');"," assert.equal(current.reviewIntegration,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');");
manual=once(manual," assert.equal(current.reviewSourceFiles,1558);\n assert.deepEqual(current.runtimeSources,{'head-neck':current.source,shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9','lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9','female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9'});"," assert.equal(current.reviewSourceFiles,1553);");
assert.equal(manual,raws[1]);

let toolbar=codes[2];
toolbar=once(toolbar,"const once=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};\n",'');
const toolbarAdapter=toolbar.slice(toolbar.indexOf(' const live=readFileSync(new URL(`./historical-current-atlas-delivery-'),toolbar.indexOf(' const difference=',toolbar.indexOf(' const live=readFileSync(new URL(`./historical-current-atlas-delivery-')));
assert(toolbarAdapter.includes('assert.equal(providerPreimage.toString(\'utf8\'),expected'));
toolbar=once(toolbar,toolbarAdapter," const actual=readFileSync(new URL(`./historical-current-atlas-delivery-${epoch}.mjs`,import.meta.url),'utf8');\n");
assert.equal(toolbar,raws[2]);
const toolbarEvidence=runInNewContext(codes[2].slice(codes[2].indexOf('const parent='),codes[2].indexOf('\nfor(const [epoch,oldHash] of parent)test('))+'\n({parent,edits,prior56Edits,rootEdits})');
for(const [epoch,digest] of toolbarEvidence.parent){
 const old=read(candidate+`fixtures/closed57-reader-originals/historical-current-atlas-delivery-${epoch}.mjs.raw`);assert.equal(sha(old),digest);
 const [a,b]=toolbarEvidence.edits.get(epoch);let expected=once(old,a,b);
 if(epoch===56){for(const [from,to] of toolbarEvidence.prior56Edits)expected=once(expected,from,to);for(const [from,to] of toolbarEvidence.rootEdits)expected=once(expected,from,to);}
 let live=read(candidate+`historical-current-atlas-delivery-${epoch}.mjs`);
 if(epoch!==56){
  const prior=read(candidate+`fixtures/closed54-55-provider/historical-current-atlas-delivery-${epoch}.mjs.raw`);
  assert.equal(sha(prior),epoch===54?'983baa628d7f4ffa3d94b524365009f63622dce6dbe8bb2cfefd656f2f81300f':'ac8ce7399f77d360d8cc90e1cc3eccb6af5267f10e42babaf56c0017aeaecf7a');
  assert.equal(expected,prior);
  live=once(live,"import {readClosed54Or55BoundSource} from './closed54-55-bound-source.mjs';\n",'');
  live=once(live,`readLive=p=>readClosed54Or55BoundSource(${epoch},p)`,'readLive=p=>readFileSync(new URL(p,site))');
  if(epoch===54)live=once(live,"if(['components/head-atlas.css','components/HeadAtlasViewer.tsx'].includes(path))","if(['app/workspace/atlas-review/model/page.tsx','app/workspace/atlas-review/model/embedded/page.tsx','components/head-atlas.css','components/HeadAtlasViewer.tsx'].includes(path))");
 }
 assert.equal(live,expected,'whole provider inverse '+epoch);
}

// The closed57 theorem itself changes only through a named later-source block and three inverse calls.
let closed57=codes[3];
const block=closed57.slice(closed57.indexOf('// Later admission seams'),closed57.indexOf('for(const [name,digest,candidate,edits] of cases)test('));
assert(block.includes('const closed56LaterEdits=')&&block.includes('const viewerProviderEdits='));
closed57=once(closed57,block,'');
closed57=once(closed57,'  for(const [before,after] of closed56LaterEdits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}\n','');
closed57=once(closed57," if(name==='historical-head-toolbar-css-preservation.test.mjs')for(const [before,after] of viewerProviderEdits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}\n",'');
closed57=once(closed57," if(name==='historical-head-toolbar-css-preservation.test.mjs')for(const [before,after] of viewerProviderEdits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}\n",'');
closed57=once(closed57," if(name==='closed56-femoral-epoch.test.mjs')for(const [before,after] of closed56LaterEdits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}\n",'');
assert.equal(closed57,raws[3]);

// Execute the source-only composition paths against the complete original fixtures.
const originalCases=runInNewContext(raws[3].slice(raws[3].indexOf('const cases=')+'const cases='.length,raws[3].indexOf('\n\n// Explicit later current-source seams;')).trim().replace(/;$/,''));
const historicEdits=runInNewContext(raws[3].slice(raws[3].indexOf('const closed56CurrentEdits=')+'const closed56CurrentEdits='.length,raws[3].indexOf('\n\nfor(const [name,digest,candidate,edits]',raws[3].indexOf('const closed56CurrentEdits='))).trim().replace(/;$/,''));
const later=runInNewContext(block+'\n({closed56LaterEdits,viewerProviderEdits})');
for(const [name,digest,target,edits] of originalCases){
 const original=read(candidate+'fixtures/closed57-original-tests/'+name+'.raw');assert.equal(sha(original),digest);
 let source=original;for(const [a,b] of edits)source=once(source,a,b);
 if(name==='closed56-femoral-epoch.test.mjs'){for(const [a,b] of historicEdits)source=once(source,a,b);for(const [a,b] of later.closed56LaterEdits)source=once(source,a,b);assert.equal(source,codes[0]);}
 if(name==='historical-head-toolbar-css-preservation.test.mjs')for(const [a,b] of later.viewerProviderEdits)source=once(source,a,b);
 assert.equal(source,name==='closed56-femoral-epoch.test.mjs'?codes[0]:read(candidate+target),'whole original '+name);
 let inverse=source;
 if(name==='historical-head-toolbar-css-preservation.test.mjs')for(const [a,b] of later.viewerProviderEdits.toReversed())inverse=once(inverse,b,a);
 if(name==='closed56-femoral-epoch.test.mjs'){for(const [a,b] of later.closed56LaterEdits.toReversed())inverse=once(inverse,b,a);for(const [a,b] of historicEdits.toReversed())inverse=once(inverse,b,a);}
 for(const [a,b] of edits.toReversed())inverse=once(inverse,b,a);
 assert.equal(inverse,original);
}
for(let i=0;i<names.length;i++){
 assert.notEqual(codes[i],raws[i]);
 assert.equal(sha(codes[i]),codeHashes[i]);
 const tampered=codes[i].replace('assert.equal','assert.notEqual');assert.notEqual(tampered,codes[i]);
 assert.notEqual(sha(tampered),codeHashes[i]);
 console.log(names[i],sha(raws[i]),sha(codes[i]),'inverse and mutation refusal');
}
