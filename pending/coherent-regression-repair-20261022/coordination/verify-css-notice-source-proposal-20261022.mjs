// Source-only integration proof; no renderer, esbuild, native teaching root or broad suite.
import assert from 'node:assert/strict';
import {existsSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-css-notice-admission-proposal',prepared=json(root+'/PREPARED.json'),website=prepared.website;
assert(!existsSync(root+'/SOURCE_PROOF.json'));
const expected={
 'tests/atlas-contextual-undo.test.ts':'c2db133eec6867d1490101edb505d3e2d1f7bfd3772c0eef7a16a1ca1fe7a0a3',
 'tests/atlas-current-history-wave4-contract.test.mjs':'67d44d60387a833b16726fdb090d9f28e8231af3f557b90c0a70d496f14eea05',
};
const cut=(text,start,end)=>{assert.equal(text.split(start).length,2);assert.equal(text.split(end).length,2);const a=text.indexOf(start),b=text.indexOf(end);assert(b>a);return{a,b,body:text.slice(a,b)};};
const unique=(text,from,to)=>{assert.equal(text.split(from).length,2,'Unique source inverse');return text.replace(from,to);};
const inverseRows=[];
for(const row of prepared.files){
 const before=read(root+'/before/'+row.path.slice(6)+'.raw').toString(),after=read(root+'/'+row.path).toString();
 assert.equal(sha(Buffer.from(before)),row.sha256);assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Frozen source unchanged');assert.equal(sha(Buffer.from(after)),expected[row.path]);
 let inverse=after;
 if(row.path.endsWith('atlas-contextual-undo.test.ts')){
  const end="  for(const path of ['app/body-selection-notice.tsx'";
  const oldBlock=cut(before,"  assert.equal(inputs.find(input=>input.path==='app/body-explorer.css')",end);
  const added=cut(after,"  const cssPath='app/body-explorer.css';",end);
  inverse=after.slice(0,added.a)+oldBlock.body+after.slice(added.b);
 }else{
  const added=cut(after,'  const runtimeSource=git(atlas,pin.runtimeSources[name],path);','  assert.equal(entry.bytes,bytes.length);');
  const oldBlock=cut(before,'  assert.deepEqual(bytes,source,name);','  assert.equal(entry.bytes,bytes.length);');
  inverse=after.slice(0,added.a)+oldBlock.body+after.slice(added.b);
  inverse=unique(inverse,' const pin=validateCurrentAtlasDelivery();\n','');
  inverse=unique(inverse,'  assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);','  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);');
 }
 assert.equal(inverse,before,'Entire original source, registrations and all assertions survive exact inverse');
 inverseRows.push({path:row.path,originalSha256:row.sha256,proposedSha256:expected[row.path],completeOriginalInverse:true});
}
const api=await import(pathToFileURL(website+'/tests/current-atlas-delivery.mjs').href),pin=api.validateCurrentAtlasDelivery(),atlas=api.currentAtlasDeliveryRoot();
const git=(source,path)=>runGit(['-C',atlas,'show',source+':'+path]);
const css=git(pin.source,'app/body-explorer.css'),oldCss=git(prepared.css.previousSource,'app/body-explorer.css'),append=read(root+'/tests/fixtures/drawable-space-css-append.css.raw');
assert.equal(sha(oldCss),prepared.css.previousSha256);assert.equal(sha(append),prepared.css.appendSha256);assert.deepEqual(css,Buffer.concat([oldCss,append]));
const inputs=json(website+'/public/atlas-runtime/head-neck/source-inputs.json');assert.equal(inputs.find(row=>row.path==='app/body-explorer.css').sha256,sha(css));
const noticePath='LICENSES/THIRD_PARTY_NOTICES.md',noticeFeature='589263554141ba94548f9073327d4e51674bc33b';
const historicalNotice=git(noticeFeature,noticePath),sourceNotice=git(pin.source,noticePath);assert.equal(sha(historicalNotice),'359dd59a89232c8530662fb7c81558070abf8c5629b5254f180788818870190b');
assert.deepEqual(read(website+'/atlas-review/'+noticePath),sourceNotice);
const families=[];
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
 const base=website+'/public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json');assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
 const notice=read(base+noticePath),source=git(pin.runtimeSources[name],noticePath),entry=manifest.files.find(row=>row.path===noticePath);assert.deepEqual(notice,source);assert.equal(entry.bytes,notice.length);assert.equal(entry.sha256,sha(notice));
 const delta=runGit(['-C',atlas,'diff','--no-ext-diff','--no-textconv','--no-renames','--numstat',noticeFeature,pin.runtimeSources[name],'--',noticePath]).toString();
 if(delta==='')assert.deepEqual(source,historicalNotice);else assert.match(delta,/^[0-9]+\t0\tLICENSES\/THIRD_PARTY_NOTICES\.md\n$/);
 families.push({name,source:pin.runtimeSources[name],noticeSha256:sha(notice),historicalNoticeLinesRetained:true});
}
const oldEpoch='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6',site=(path)=>runGit(['-C',website,'show',oldEpoch+':'+path]);
const oldSource=site('atlas-review/'+noticePath),oldViewer=site('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt');
const oldPrefix=Buffer.from('# Clinical Review third-party notices\n\nAtlas source: 88cea927d48729769b96ad8fe680b0872b7e6687\n\n');assert.deepEqual(oldViewer.subarray(0,oldPrefix.length),oldPrefix);
const tail=oldViewer.subarray(oldPrefix.length+oldSource.length),viewer=read(website+'/public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt');
assert.deepEqual(viewer,Buffer.concat([Buffer.from('# Clinical Review third-party notices\n\nAtlas source: '+pin.source+'\n\n'),sourceNotice,tail]));
assert.equal(json(website+'/public/atlas-review-viewer/manifest.json').files.find(row=>row.path==='THIRD_PARTY_NOTICES.txt').sha256,sha(viewer));
const result={at:new Date().toISOString(),website,source:pin.source,review:pin.reviewIntegration,inverseRows,cssExactPrefixAndAppend:true,cssAppendSha256:sha(append),families,protectedViewerCompleteHistoricalDependencyTailRetained:true,nativeRootsRerun:false,frozenOrCanonicalSourceEdited:false,heavyBuildOrBroadValidation:false,clinicalApproval:false,publicDeployment:false};
writeFileSync(root+'/SOURCE_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/SOURCE_PROOF.json',sha256:sha(read(root+'/SOURCE_PROOF.json')),wholeSourceInverses:2,actualFamilyNoticesVerified:4,exactCssAppend:true,completeViewerTail:true,nativeRootsRerun:false}));
