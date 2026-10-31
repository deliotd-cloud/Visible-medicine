// Test-only exact source roles. Install beside the two existing head tests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceHunks} from './head-tools-wider-consumer-inverse.mjs';
import {restoreCurrentHeadToolsViewer} from './head-tools-current-role.mjs';
import {restoreHeadToolsBefore20261022} from './head-tools-epoch-20261022.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const viewer='components/HeadAtlasViewer.tsx',css='components/head-atlas.css';
const currentSeal='F:/VisibleMedicine/staging/20261024-head-study-set-website/SOURCE_BOUND.json';
const previousSeal='F:/VisibleMedicine/staging/20261023-linked-head-region-picker/SOURCE_BOUND.json';
const currentSealSha='37ea31d0ab36e57311e11dcdb9c01a93770220cbf8c40d439fa35b08aff9c968';
const previousSealSha='6a6f601c32176a2ac8a3c2735178245487640434a17b157aed0d473fcec48183';
const currentViewerSha='9797cd2ce54405d0909d125f38fa4ea0184f367b7ac772406952f6dacd0b7ae5';
const previousViewerSha='a41c34769f419e0ec471a0a07cb6c25aee070ee706bcc6e9cae0344485edfd72';
const currentCssSha='5412024d7f86db31926cd20bbd327ff6a570ca0ed8e09a9e5d74681993f15931';
const filteredCssSha='fb22ea6087e7ea2b09cc63e8f769f8bf2c93c7aa00b8a8710d9b164f3813eb8a';
const beforeFilteredViewerSha='871d02c03888f904d6bbb1458148b4b6320fe9a4a83b5c948f38d0969b6a24e8';
const hunksSha=[
 '982d4f81300b05433df93a503279890065aa00c6ef75f6b5df8b8f34921e3c44',
 '7add29fa083e67d49da0fc06065351450647f607ab728404a2e5c637c74280ab',
 'b7f048569fc2435b73ff4c00c59fb449b96b3120bfa894098976eed0bbb32175',
 '3f9d91180c0dcc7dabfd881b359dadfce1114d9d430f9b67684ec7c39232e5cd',
 'eb883a3556f44ea89edb9965dafb5af3418c716cff170094d8faf23c41e102e9',
 'bf5bd23363c1dfc6e49353a15eafac166665126b38f227731a001dd0fefa9d79',
 '092ee0447ab82c29d392728745986c83dcc910a631fd6bf014b75f218cc3d741',
 'f783178708875f96bbe86762be92d25da3e12ca9582643724eaa86b14ab47f87',
 '6baeaa2f3f0d1d0f7e847bbc6a284cd55a404b71f4c58305b4b05638f65c8961',
 'a1fcc79e76a4b4b3d1fb827cbac63dba36b3711fe91be2accdf54c16a517da09',
 'e5e043841e668c4be7391e11447a7f741402ecbd33aa9bce6b48770601b6b06d',
];
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,'one exact declared source seam');return text.replace(from,to);};
function sealRow(file,expectedSealSha,expectedPath,expectedFileSha){
 const bytes=readFileSync(file);assert.equal(sha(bytes),expectedSealSha,'authenticated source seal');
 const seal=JSON.parse(bytes),row=seal.sourceRows.find(r=>r.path===expectedPath);
 assert(row,expectedPath);assert.equal(row.sha256,expectedFileSha,expectedPath+': source identity');
 return seal;
}
function lossless(bytes){assert(Buffer.isBuffer(bytes));const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);assert(!text.includes('\r'));return text;}

// Each later role is a complete, exact source transition. The combined hunk
// digest binds positions and both sides, while both traversals prove the old
// source is recovered without deleting intervening handlers or assertions.
function reverseExactTransition(currentBytes,priorBytes,{currentSha,priorSha,hunkCount,hunksSha,label}){
 assert.equal(sha(currentBytes),currentSha,label+': exact current binding');
 assert.equal(sha(priorBytes),priorSha,label+': authenticated predecessor');
 const current=lossless(currentBytes),prior=lossless(priorBytes);
 const hunks=sourceHunks(prior,current);
 assert.equal(hunks.length,hunkCount,label+': hunk count');
 assert.equal(sha(JSON.stringify(hunks)),hunksSha,label+': exact changed lines and positions');
 const reverse=current.split('\n'),forward=prior.split('\n');
 for(const h of hunks.toReversed()){
  assert.deepEqual(reverse.slice(h.newStart,h.newStart+h.added.length),h.added);
  reverse.splice(h.newStart,h.added.length,...h.removed);
  assert.deepEqual(forward.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);
  forward.splice(h.oldStart,h.removed.length,...h.added);
 }
 assert.equal(reverse.join('\n'),prior,label+': full historical source restored');
 assert.equal(forward.join('\n'),current,label+': full current source rebuilt');
 return priorBytes;
}

export function restoreCurrentHeadLayoutViewer(currentBytes){
 const prior=readFileSync('F:/VisibleMedicine/staging/20261027-head-release-repairs/website/'+viewer);
 return reverseExactTransition(currentBytes,prior,{
  currentSha:'65407ec32882f84f215f0df3210b0c632452592a0cef63b5c76eb3849c85d159',
  priorSha:'af896cf7b68b7fc7a6bfaf2b2e67c219901570d0b363fa728467db0b2bf50e10',
  hunkCount:35,hunksSha:'b96cb50ad6ff5bf294b502d2377ea72046645bda400668413d98f01265dd2da0',label:'current head viewer'
 });
}

export function restoreCurrentHeadLayoutCss(currentBytes){
 const prior=readFileSync('F:/VisibleMedicine/staging/20261024-head-study-set-website/website/'+css);
 return reverseExactTransition(currentBytes,prior,{
  currentSha:'ea5ee7cc5e58a664ed4f6b1e712dd67647c6e85f52ed22907f871d9edbb5aa73',
  priorSha:currentCssSha,hunkCount:2,hunksSha:'8aa5487e85c4462d1c633eda8fdb4d7926969ffd08ece058caf1fd4207556ead',label:'current head CSS'
 });
}

export function restoreCurrentCompactToolbarTest(currentBytes){
 const prior=readFileSync(new URL('./fixtures/head-toolbar-test-before-filtered-layout.mjs.raw',import.meta.url));
 return reverseExactTransition(currentBytes,prior,{
  currentSha:'4ad760ad15a3d5b7c1665fefc1cb6393973d08330982fc12a7471bb198be2f7',
  priorSha:'38319ac1772060f0d834e72b23ca876714fa7695032631d97d1767ace347846a',
  hunkCount:4,hunksSha:'e423d9f50b7b4cd763da155dcfc0c458c8cc8b7b966b285b36089ab43ebcbaf5',label:'current compact-toolbar test'
 });
}


// Exact later viewer-to-study-set transition; original older projections follow unchanged.
function restoreLaterHeadViewer(bytes){
 bytes=restoreCurrentHeadLayoutViewer(bytes);
 const receiptBytes=readFileSync("F:/VisibleMedicine/staging/20261027-head-release-repairs/SOURCE_CANDIDATE.json");assert.equal(sha(receiptBytes),"bd6d2004d744d23fe252d3b9d15d46f760c7f4d418f374c3d84f13df4ab425b7",'Authenticated later source receipt');
 const receipt=JSON.parse(receiptBytes),row=receipt.sourceRows.find(r=>r.path===viewer);
 assert.equal(row?.sha256,'af896cf7b68b7fc7a6bfaf2b2e67c219901570d0b363fa728467db0b2bf50e10');
 assert.equal(sha(bytes),row.sha256,'Only exact later current viewer bytes');
 const oldReceipt=sealRow(currentSeal,currentSealSha,viewer,currentViewerSha),prior=readFileSync(oldReceipt.website+'/'+viewer);
 assert.equal(sha(prior),currentViewerSha,'Authenticated study-set viewer');
 const before=lossless(prior),after=lossless(bytes),hunks=sourceHunks(before,after);
 assert.deepEqual(hunks.map(h=>sha(JSON.stringify(h))),["3e39686a9d4e8196ee4b15f97c1e6ff96a5e828534cde3797903d243cf8227d0","8a99ad8808403c68332d653bb923625070d30384cc5e0c21084c4fdd53ad584f","ead7bfefcebfe707342511f7267a50f041d2694e754dc586cc318b474d7a92a0","ac3da7121bae083868bada887f5bbecbbeff0247a4053cc68ee073ec2830ee1c","de0d9e27cdd49772045e35397ebc19993bca2126e13a342bc2f0543f640586e2","634c4e0ed4db2914ed6097646b2340970768a68db7075c7a013c685650c91e69","bc8e9944ff94ee651cfab793bc47a7af06c8a83ef9462753622f02cf179e913a","a233ce6a20f8655e857a8337d3be4f9e77b768432363c384b865e233d949760a","d1fe5b2bbbccf7c2a57bec2f3c2de0a45aaed05af588aa08a0041e273b465762","85d4c92181806030ae0838f2dc22fe9d0fb56e7c9fae2f81b4051c715046cc43","731caaf783d93e5ebaae9988af7c3bc2956e47a356b0c02999e53da58c940f60","194544d8bc41a639c10067a9aa8f74096c514ed01a502e18098661ea8427179e","321e1dc5ffad0def8044d34b9594b28f38e247810b2bbfd57c15b23bf0fd86b7","2ddd8dc86b02e301a049a2aba8dbe06de7fdaf345d2e5f49ea58931bad7174fe","b521676c7ad78dda0652d0b7e70bc5bcfee598fcc183e01d1889808d1620a0ed"],'Only exact later viewer hunks');
 const reverse=after.split('\n'),forward=before.split('\n');
 for(const h of hunks.toReversed()){
  assert.deepEqual(reverse.slice(h.newStart,h.newStart+h.added.length),h.added);reverse.splice(h.newStart,h.added.length,...h.removed);
  assert.deepEqual(forward.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);forward.splice(h.oldStart,h.removed.length,...h.added);
 }
 assert.equal(reverse.join('\n'),before,'Whole study-set viewer restored');assert.equal(forward.join('\n'),after,'Whole later viewer rebuilt');
 return prior;
}

export function restoreHeadViewerTo20261023(currentBytes,{previousBytes}={}){
 currentBytes=restoreLaterHeadViewer(currentBytes);
 const now=sealRow(currentSeal,currentSealSha,viewer,currentViewerSha);
 const before=sealRow(previousSeal,previousSealSha,viewer,previousViewerSha);
 assert.equal(now.website,'F:/VisibleMedicine/staging/20261024-head-study-set-website/website');
 assert.equal(before.website,'F:/VisibleMedicine/staging/20261023-linked-head-region-picker/website');
 assert.equal(sha(currentBytes),currentViewerSha,'only the exact current viewer');
 const prior=previousBytes??readFileSync(before.website+'/'+viewer);
 assert.equal(sha(prior),previousViewerSha,'only the exact sealed prior viewer');
 const old=lossless(prior),actual=lossless(currentBytes),hunks=sourceHunks(old,actual);
 assert.deepEqual(hunks.map(h=>sha(Buffer.from(JSON.stringify(h)))),hunksSha,'only the eleven later source hunks');
 const reverse=actual.split('\n');
 for(const h of hunks.toReversed()){
  assert.deepEqual(reverse.slice(h.newStart,h.newStart+h.added.length),h.added);
  reverse.splice(h.newStart,h.added.length,...h.removed);
 }
 assert.equal(reverse.join('\n'),old,'whole prior viewer restored');
 const forward=old.split('\n');
 for(const h of hunks.toReversed()){
  assert.deepEqual(forward.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);
  forward.splice(h.oldStart,h.removed.length,...h.added);
 }
 assert.equal(forward.join('\n'),actual,'whole current viewer rebuilt');
 return prior;
}

export function restoreHeadToolsEpochViewer(currentBytes,options){
 const previous=restoreHeadViewerTo20261023(currentBytes,options);
 const epoch=readFileSync(new URL('./fixtures/head-tools-role-20261022/components/HeadAtlasViewer.tsx.raw',import.meta.url));
 return restoreCurrentHeadToolsViewer(previous,epoch);
}

export function restoreBeforeFilteredViewer(currentBytes,options){
 const epoch=restoreHeadToolsEpochViewer(currentBytes,options);
 const preToolbar=readFileSync(new URL('./fixtures/head-toolbar-before-compaction-20261022.tsx.raw',import.meta.url));
 let filtered=restoreHeadToolsBefore20261022(epoch,preToolbar);
 const from='{study&&filtersActive&&<details className="head-overlay-settings head-filtered-practice" onKeyDown={headDisclosureKeyDown}><summary>Practise these results ({filteredPracticeEntries.length} masks)</summary><div className="head-filtered-practice-options">';
 const to='{study&&filtersActive&&<>';
 const endFrom='    </div></details>}\n    <div id="head-index-list"';
 const endTo='    </>}\n    <div id="head-index-list"';
 filtered=once(filtered,from,to);filtered=once(filtered,endFrom,endTo);
 const prior=readFileSync(new URL('./fixtures/head-viewer-before-filtered-layout.tsx.raw',import.meta.url));
 assert.equal(sha(prior),beforeFilteredViewerSha);
 assert.equal(filtered,lossless(prior),'whole pre-filter viewer restored');
 assert.equal(once(once(filtered,to,from),endTo,endFrom),lossless(preToolbar),'whole filtered viewer rebuilt');
 return prior;
}

const provenanceSuffix='\n/* Compact, disclosure-only provenance. No image, mask or review state changes. */\n'+
 '.head-source-note>details>summary{box-sizing:border-box;min-height:44px;list-style-position:inside;padding:10px 12px;border:1px solid var(--imaging-line);border-radius:6px;cursor:pointer;line-height:1.5;color:var(--imaging-ink);background:var(--imaging-panel);font-weight:600}\n'+
 '.head-source-note>details>summary:focus-visible{outline:3px solid var(--imaging-teal);outline-offset:3px}\n'+
 '.head-source-content{display:grid;gap:8px;padding:10px 0;min-width:0;overflow-wrap:anywhere}\n'+
 '.head-source-note .head-source-reminder{font-size:12px;line-height:1.5;margin:0;color:var(--imaging-ink)}\n';
export function restoreHeadFilteredCssCurrent(currentBytes){
 currentBytes=restoreCurrentHeadLayoutCss(currentBytes);
 const seal=sealRow(currentSeal,currentSealSha,css,currentCssSha);
 assert.equal(seal.website,'F:/VisibleMedicine/staging/20261024-head-study-set-website/website');
 assert.equal(sha(currentBytes),currentCssSha,'only the exact current CSS');
 const actual=lossless(currentBytes);
 assert(actual.endsWith(provenanceSuffix),'one exact later provenance disclosure block');
 const filtered=actual.slice(0,-provenanceSuffix.length);
 assert.equal(sha(Buffer.from(filtered)),filteredCssSha,'authentic filtered-layout CSS');
 assert.equal(filtered+provenanceSuffix,actual,'whole current CSS rebuilt');
 return Buffer.from(filtered);
}
