// One exact dependency-only transition. No geometry, topology or decision migration.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {plexusFingerprints,plexusHash} from './plexus-review-fingerprints.mjs';
const OLD_PACKET='846970bb1ec6b27e9b3ba5eeddaf9e773915802fe1374c29c2739382455f8140';
const OLD_LOCK='da6513ef764b1291e1bc87ebd50184971ebe7ffe44be24e9753e8071fe297b68';
const NEW_LOCK='66a49e4531dc01079e16c74ed5034976de6250fa71ba024915087b9ea53327e5';
const OLD_MODULE='cb874101b4811f5f21a04b80364b8588729cf009a9784f5bd7a9993ae7fc1782';
const marker='export const plexusReviewAssets: Record<string,string> = ';
export function rebindPlexusDependency(packetBytes,moduleText,beforeLockBytes,afterLockBytes,readWebsite){
 assert.equal(plexusHash(packetBytes),OLD_PACKET,'Only the immutable pre-checksum packet is eligible');
 assert.equal(plexusHash(moduleText),OLD_MODULE,'Only the exact original private module is eligible');
 assert.equal(plexusHash(beforeLockBytes),OLD_LOCK);assert.equal(plexusHash(afterLockBytes),NEW_LOCK);
 const original=JSON.parse(packetBytes),packet=structuredClone(original),oldLock=JSON.parse(beforeLockBytes),nextLock=JSON.parse(afterLockBytes);
 const keys=new Set([...Object.keys(oldLock.packages),...Object.keys(nextLock.packages)]);
 for(const key of keys)if(key!==''&&key!=='node_modules/@noble/hashes')assert.deepEqual(nextLock.packages[key],oldLock.packages[key],'Unrelated dependency changed: '+key);
 assert.equal(oldLock.packages['node_modules/@noble/hashes'],undefined);
 const expectedRoot=structuredClone(oldLock.packages['']);expectedRoot.dependencies['@noble/hashes']='2.4.0';assert.deepEqual(nextLock.packages[''],expectedRoot);
 const addition=nextLock.packages['node_modules/@noble/hashes'];assert.equal(addition.version,'2.4.0');assert.equal(addition.license,'MIT');assert.equal(addition.dependencies,undefined);
 assert.equal(addition.integrity,'sha512-X5XaVWZIBCT7HHZGm5I7ZQXDwLG+bGXuSrMQAW+7Zvl87h1kmc1ZB1VSRJcpUfoUrGQp4Fkoxm5kZ+Ms+aW+eA==');
 assert.equal(packet.purpose,'private-original-plexus-schematic-review');assert.equal(packet.admissions,0);assert.equal(packet.clinicalValidation,false);assert.equal(packet.patientDataIncluded,false);
 assert.equal(packet.context.clinicalApproved,false);assert.equal(packet.context.learnerCatalogAdmission,false);assert.equal(packet.context.frame.patientRegistration,false);
 assert.equal(packet.topologyInputs.filter(row=>row.kind==='website'&&row.path==='package-lock.json').length,0);
 assert.equal(packet.presentationInputs.filter(row=>row.kind==='website'&&row.path==='package-lock.json').length,1);
 assert(moduleText.startsWith("import 'server-only';"));assert.equal(moduleText.split(marker).length,2);
 const assets=JSON.parse(moduleText.split(marker)[1].trim().replace(/;$/,''));assert.deepEqual(Object.keys(assets).sort(),packet.files.map(row=>row.name).sort());
 for(const row of packet.files){const bytes=Buffer.from(assets[row.name],'base64');assert.equal(bytes.length,row.bytes);assert.equal(plexusHash(bytes),row.sha256);}
 const fingerprint=()=>plexusFingerprints({study:packet.study,topologyInputs:packet.topologyInputs,presentationInputs:packet.presentationInputs,assets:packet.files.filter(row=>row.name!=='index.html').map(({name,sha256})=>({name,sha256})),packages:packet.packages,checklistVersion:packet.context.checklistVersion,checklists:packet.context.checklists});
 const before=fingerprint();for(const key of ['topologyHash','presentationHash','materialHash'])assert.equal(packet.context[key],before[key]);assert.equal(packet.context.revisions.topology,before.topologyHash);assert.equal(packet.context.revisions.presentation,before.presentationHash);
 for(const row of [...packet.topologyInputs,...packet.presentationInputs].filter(row=>row.kind==='website')){
   const actual=plexusHash(readWebsite(row.path));if(row.path==='package-lock.json'){assert.equal(row.sha256,OLD_LOCK);assert.equal(actual,NEW_LOCK);row.sha256=NEW_LOCK;}else assert.equal(actual,row.sha256,'Unrelated source changed: '+row.path);
 }
 const after=fingerprint();assert.equal(after.topologyHash,before.topologyHash);assert.notEqual(after.presentationHash,before.presentationHash);assert.notEqual(after.materialHash,before.materialHash);
 Object.assign(packet.context,after);packet.context.revisions.presentation=after.presentationHash;
 let html=Buffer.from(assets['index.html'],'base64').toString('utf8');
 for(const name of ['app.js','app.css']){const old='./'+name+'?revision='+before.materialHash;assert.equal(html.split(old).length,2);html=html.replace(old,'./'+name+'?revision='+after.materialHash);}
 const bytes=Buffer.from(html);assets['index.html']=bytes.toString('base64');const row=packet.files.find(row=>row.name==='index.html');row.bytes=bytes.length;row.sha256=plexusHash(bytes);
 assert.deepEqual(packet.study,original.study);assert.deepEqual(packet.topologyInputs,original.topologyInputs);assert.deepEqual(packet.packages,original.packages);assert.deepEqual(packet.context.checklists,original.context.checklists);assert.deepEqual(packet.files.filter(row=>row.name!=='index.html'),original.files.filter(row=>row.name!=='index.html'));
 return {packet,moduleText:moduleText.slice(0,moduleText.indexOf(marker))+marker+JSON.stringify(assets)+';\n',before,after};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.deepEqual(process.argv.slice(2),['--apply'],'Use --apply only after preserving exact original inputs');
 const result=rebindPlexusDependency(readFileSync('tests/fixtures/plexus-before-head-checksum.txt'),readFileSync('.local/plexus-review/assets.ts','utf8'),readFileSync('tests/fixtures/plexus-before-head-checksum-lock.txt'),readFileSync('package-lock.json'),relative=>readFileSync(relative));
 writeFileSync('lib/plexus-review-manifest.json',JSON.stringify(result.packet,null,2)+'\n');writeFileSync('.local/plexus-review/assets.ts',result.moduleText);
 console.log(JSON.stringify({before:result.before,after:result.after,topologyUnchanged:true,nonHtmlAssetsUnchanged:true,admissions:0,approvalsMigrated:false}));
}
