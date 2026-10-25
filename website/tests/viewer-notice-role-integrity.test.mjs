import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadNoticeFixture,readCurrentNoticeInputs,readHistoricalNoticeTail,assertNoticeRow,noticeSections,assertHistoricalNoticeRetention,compareNoticeBytes,extractNoticeRecipe,assertNoticeIdentity,verifyCurrentNotice,assertPackageIdentities,assertNoticePackageSource,assertCompleteNoticeChild,noticeChildEnvironment} from './viewer-notice-roles.mjs';
const site=new URL('../',import.meta.url);
function actual(){const value=readCurrentNoticeInputs();return {...value,pin:JSON.parse(fs.readFileSync(new URL('tests/fixtures/current-atlas-delivery.json',site))),viewerManifest:JSON.parse(value.bytes.get('public/atlas-review-viewer/manifest.json')),source:value.bytes.get('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md'),viewer:value.bytes.get('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt')};}
function tailOf(value){return value.viewer.subarray(Buffer.byteLength('# Clinical Review third-party notices\n\nAtlas source: '+value.pin.source+'\n\n')+value.source.length);}
function joined(sections){return Buffer.concat([Buffer.from('\n\n'),...sections.map(r=>r.bytes)]);}

test('notice source and retention guards reject missing or changed original/new sections and altered actual recipe inputs',()=>{
 const value=actual(),old=readHistoricalNoticeTail(),tail=tailOf(value),sections=noticeSections(tail),oldSections=noticeSections(old);assert.deepEqual(assertHistoricalNoticeRetention(old,tail),{oldPackages:22,currentPackages:24});
 for(const name of [oldSections[0].name,'its-fine','react-use-measure'])assert.throws(()=>assertHistoricalNoticeRetention(old,joined(sections.filter(r=>r.name!==name))));
 const changedOld=sections.map(r=>r.name===oldSections[0].name?{...r,bytes:Buffer.concat([r.bytes,Buffer.from('foreign')])}:r);assert.throws(()=>assertHistoricalNoticeRetention(old,joined(changedOld)));
 const reordered=[...sections];[reordered[0],reordered[1]]=[reordered[1],reordered[0]];assert.throws(()=>assertHistoricalNoticeRetention(old,joined(reordered)));
 for(const name of ['its-fine','react-use-measure']){
  const section=sections.find(r=>r.name===name),changed=Buffer.from(value.viewer);const offset=changed.indexOf(section.bytes);assert(offset>=0);changed[offset+section.bytes.length-4]^=1;assert.throws(()=>compareNoticeBytes(changed,value.viewer));
  const binding=value.e.current.packages.find(r=>r.name===name),row=binding.noticeSources[0],bytes=value.bytes.get(row.path),foreign=Buffer.from(bytes);foreign[0]^=1;assert.throws(()=>assertNoticeRow(row,foreign));
 }
 const raw=fs.readFileSync(new URL('tests/fixtures/viewer-notice-roles/original-wave4.mjs.raw',site));const f=loadNoticeFixture();assertNoticeRow({path:'original-wave4',...f.originals.wave4},raw);assert.throws(()=>assertNoticeRow({path:'original-wave4',...f.originals.wave4},Buffer.concat([raw,Buffer.from('\n')])));
 const builder=value.bytes.get('scripts/build-clinical-review-viewer.mjs');assert(extractNoticeRecipe(builder).includes('const notices = ['));assert.throws(()=>extractNoticeRecipe(Buffer.concat([builder,Buffer.from('\n')])));
 compareNoticeBytes(Buffer.from('same'),Buffer.from('same'));assert.throws(()=>compareNoticeBytes(Buffer.from('a'),Buffer.from('b')));assert.throws(()=>compareNoticeBytes(Buffer.from('a'),Buffer.from('b'),()=> 'forced-collision'));
});

test('actual current manifest/package/source bindings refuse foreign roles, duplicate versions and wrong nested package sources',()=>{
 const value=actual(),f=value.f;assertNoticeIdentity(value.pin,value.viewerManifest);
 for(const key of ['source','sourceTree','reviewIntegration']){const pin=structuredClone(value.pin);pin[key]='0'.repeat(key==='reviewIntegration'?64:40);assert.throws(()=>assertNoticeIdentity(pin,value.viewerManifest));}
 const historical=structuredClone(value.pin);historical.source='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';historical.viewerPackages=22;assert.throws(()=>assertNoticeIdentity(historical,value.viewerManifest));
 const foreign=structuredClone(value.viewerManifest);foreign.sourceCommit='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';assert.throws(()=>assertNoticeIdentity(value.pin,foreign));
 const forged=structuredClone(value.viewerManifest);forged.files.find(r=>r.path==='THIRD_PARTY_NOTICES.txt').sha256='0'.repeat(64);assert.throws(()=>verifyCurrentNotice({pin:value.pin,viewerManifest:forged,source:value.source,viewer:value.viewer,oldTail:readHistoricalNoticeTail()}));
 assert.throws(()=>assertPackageIdentities(f.packages,f.packages.slice(1)));const duplicate=structuredClone(f.packages);duplicate[1]=structuredClone(duplicate[0]);assert.throws(()=>assertPackageIdentities(f.packages,duplicate));
 for(const key of ['version','license']){const changed=structuredClone(f.packages);changed[0][key]='foreign';assert.throws(()=>assertPackageIdentities(f.packages,changed));}
 const binding=value.e.current.packages.find(r=>r.name==='@floating-ui/dom'),pkg=JSON.parse(value.bytes.get(binding.packageJson)),lock=JSON.parse(value.bytes.get('package-lock.json'));assert.equal(binding.version,'1.8.0');assert.equal(binding.packageJson,'node_modules/@floating-ui/react-dom/node_modules/@floating-ui/dom/package.json');assertNoticePackageSource(binding,pkg,lock);
 const wrong=structuredClone(binding);wrong.packageJson='node_modules/@floating-ui/dom/package.json';assert.throws(()=>assertNoticePackageSource(wrong,pkg,lock));const wrongLock=structuredClone(lock);delete wrongLock.packages[binding.packageJson.slice(0,-'/package.json'.length)];assert.throws(()=>assertNoticePackageSource(binding,pkg,wrongLock));
 const changedPkg={...pkg,license:'foreign'};assert.throws(()=>assertNoticePackageSource(binding,changedPkg,lock));
});

function tap(cases){return 'TAP version 13\n'+Array.from({length:cases},(_,i)=>`ok ${i+1} - original ${i+1}\n`).join('')+`1..${cases}\n# tests ${cases}\n# pass ${cases}\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n`;}
test('whole-original four/one/three child transport refuses failed, skipped, contradictory or incomplete terminal evidence',()=>{
 for(const cases of [4,1,3]){
  const text=tap(cases),ok={code:0,signal:null};assert.equal(assertCompleteNoticeChild(ok,text,cases).tests,cases);
  for(const result of [{code:1,signal:null},{code:0,signal:'SIGTERM'},{code:0,signal:null,error:'ENOENT'},{code:null,signal:null}])assert.throws(()=>assertCompleteNoticeChild(result,text,cases));
  for(const bad of [text.replace('ok 1','not ok 1'),text.replace('original 1','original 1 # SKIP refused'),text.replace('original 1','original 1 # TODO refused'),text+'    not ok 1 - nested contradiction\n',text.replace('# skipped 0','# skipped 1'),text.replace('# todo 0','# todo 1'),text.replace('# cancelled 0','# cancelled 1'),text.replace('# fail 0','# fail 1'),text.replace('# tests '+cases+'\n',''),text.replace('ok 1 - original 1\n',''),text.replace('TAP version 13\n',''),text.replace(`1..${cases}\n`,''),text+`1..${cases}\n`,text+`# pass ${cases}\n`,text+'Bail out!\n'])assert.throws(()=>assertCompleteNoticeChild(ok,bad,cases));
 }
 const clean=noticeChildEnvironment({NODE_TEST_CONTEXT:'serialized',NODE_OPTIONS:'--test-name-pattern=only',DATABASE_URL:'remote',API_TOKEN:'synthetic',VM_ATLAS_SOURCE_REPO:'wrong',ComSpec:'cmd.exe'},'F:/native6d7');assert.equal(clean.NODE_TEST_CONTEXT,undefined);assert.equal(clean.DATABASE_URL,undefined);assert.equal(clean.API_TOKEN,undefined);assert.equal(clean.NODE_OPTIONS,'--max-old-space-size=768');assert.equal(clean.VM_ATLAS_SOURCE_REPO,'F:/native6d7');assert.equal(clean.ATLAS_SOURCE_REPO,'F:/native6d7');assert.equal(clean.ComSpec,'cmd.exe');
 const byteOnly=noticeChildEnvironment({},undefined);assert.equal(byteOnly.VM_ATLAS_SOURCE_REPO,undefined);
});
