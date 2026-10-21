import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-review-destination-application';
const {site}=json(stage+'/PREPARATION.json');
const proposal='F:/VisibleMedicine/staging/20261021-nav-history-contract-proposal';
const header='F:/VisibleMedicine/staging/20261021-header-session-contract-proposal';
const before=json('F:/VisibleMedicine/staging/20261021-source190-website/SOURCE_INPUTS_AFTER.json');
const original=new Map(before.map(r=>[r.path,r.sha256]));
const work=[],add=(p,b,from)=>work.push({path:p,bytes:b,from});
for(const [p,digest] of Object.entries(json(header+'/MANIFEST.json').currentExactFixtures))
 assert.equal(sha(read(site+'/'+p.replace(/\.raw$/,''))),digest,'Header proposal source moved: '+p);
for(const p of ['tests/header-session.test.ts','tests/header-workspace-destination.test.mjs','tests/clinical-review-wayfinding.test.mjs'])
 assert.equal(sha(read(site+'/'+p)),original.get(p),'Whole test preimage moved: '+p);
const hp=read(header+'/tests/header-session.test.ts');assert.equal(sha(hp),json(header+'/MANIFEST.json').proposalTest.sha256);
let text=hp.toString();
text=text.replace('existsSync, readFileSync','readFileSync');
const fallback="readFileSync(existsSync(sourcePath) ? sourcePath : new URL('../' + path + '.raw', import.meta.url), 'utf8')";
assert.equal(text.split(fallback).length,2);text=text.replace(fallback,"readFileSync(sourcePath, 'utf8')");
assert(!text.includes('existsSync'),'Shipping harness must fail if actual source is missing');
add('tests/header-session.test.ts',Buffer.from(text),'header current proposal, exact fixture fallback removed');
for(const p of ['header-workspace-destination.test.mjs','clinical-review-wayfinding.test.mjs']){
 const b=read(proposal+'/tests/'+p);let s=b.toString();assert.equal(s.split("'./_harness.mjs'").length,2);
 s=s.replace("'./_harness.mjs'","'./review-navigation-history-harness.mjs'");add('tests/'+p,Buffer.from(s),'two-test proposal, exact harness rename only');
}
let harness=read(proposal+'/tests/_harness.mjs').toString();
const absolute="export const candidate='F:/VisibleMedicine/staging/20261021-source190-website/website';";
assert.equal(harness.split(absolute).length,2);
harness=harness.replace(absolute,"export const candidate=fileURLToPath(new URL('..',import.meta.url));");
assert.equal(harness.split("new URL('../fixtures/'+name+'.b64',import.meta.url)").length,2);
harness=harness.replace("new URL('../fixtures/'+name+'.b64',import.meta.url)","new URL('./fixtures/review-navigation-before/'+name+'.b64',import.meta.url)");
add('tests/review-navigation-history-harness.mjs',Buffer.from(harness),'two-test proposal; portable checkout root and scoped fixture path');
const fixturePairs=[
 ['header-workspace-destination.test.mjs',site+'/tests/header-workspace-destination.test.mjs'],
 ['clinical-review-wayfinding.test.mjs',site+'/tests/clinical-review-wayfinding.test.mjs'],
 ['SiteHeader.tsx',stage+'/preimages/components/SiteHeader.tsx'],
 ['SiteFrame.tsx',stage+'/preimages/components/SiteFrame.tsx'],
];
for(const [name,from] of fixturePairs){
 const b=read(proposal+'/fixtures/'+name+'.b64'),decoded=Buffer.from(b.toString().replace(/\s/g,''),'base64');
 assert.equal(sha(decoded),sha(read(from)),'Fixture is not exact owned code/test: '+name);
 add('tests/fixtures/review-navigation-before/'+name+'.b64',b,'hash-verified whole original owned UI/test bytes');
}
const changes=[],patch=['*** Begin Patch'];
for(const row of work){
 const current=site+'/'+row.path,existed=fs.existsSync(current);const pre=existed?read(current):null;
 assert(existed===original.has(row.path),'Unexpected pre-existing file: '+row.path);
 if(existed){
  const dest=stage+'/preimages/'+row.path;assert(!fs.existsSync(dest));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(current,dest,fs.constants.COPYFILE_EXCL);
  const proposed=stage+'/history-proposed/'+row.path;fs.mkdirSync(path.dirname(proposed),{recursive:true});fs.writeFileSync(proposed,row.bytes,{flag:'wx'});
  const d=spawnSync('git',['diff','--no-index','--no-ext-diff','--text',current,proposed],{encoding:'utf8',windowsHide:true});assert([0,1].includes(d.status));
  const lines=d.stdout.replaceAll('\r\n','\n').split('\n');const start=lines.findIndex(l=>l.startsWith('@@'));assert(start>=0);
  patch.push('*** Update File: '+current,...lines.slice(start).filter(l=>!l.startsWith('\\ No newline')).map(l=>l.startsWith('@@')?'@@':l).filter((l,i,a)=>i<a.length-1||l!==''));
 }else{patch.push('*** Add File: '+current,...row.bytes.toString().replaceAll('\r\n','\n').replace(/\n$/,'').split('\n').map(l=>'+'+l));}
 changes.push({path:row.path,beforeSha256:pre?sha(pre):null,proposedSha256:sha(row.bytes),source:row.from});
}
patch.push('*** End Patch');
fs.writeFileSync(stage+'/HISTORY_ADMISSION.json',JSON.stringify({changes,exactHistoricalFixtures:true,shippingSourceFallbackRemoved:true,portableHarness:true,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/HISTORY_ADMISSION.patch',patch.join('\n')+'\n',{flag:'wx'});
console.log(patch.join('\n'));
