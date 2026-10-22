// Read-only source and inverse witness. Run from this directory with node SOURCE_PROOF.mjs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const stage=fileURLToPath(new URL('.',import.meta.url));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const source='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const reviewSha='4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99';
const websiteHead='b953ff3f5f1891599cb6e91cb91311d9d6006270';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(cwd,...args)=>execFileSync('git',args,{cwd,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const json=p=>JSON.parse(readFileSync(`${website}/${p}`));
const exact=(a,b,label)=>assert.deepEqual(a,b,label);
exact(git(website,'rev-parse','HEAD').toString().trim(),websiteHead,'Frozen website HEAD');
exact(git(atlas,'rev-parse','HEAD').toString().trim(),source,'Atlas source HEAD');
exact(git(atlas,'status','--porcelain').toString().trim(),'','Atlas source clean');
const pin=json('tests/fixtures/current-atlas-delivery.json');
exact(pin.source,source,'Current Review source');
const review=json('atlas-review/manifest.json');
exact(sha(readFileSync(`${website}/atlas-review/manifest.json`)),pin.documents['atlas-review/manifest.json'],'Current Review document bytes');
exact(review.websiteIntegrationSha256,reviewSha,'Current Review integration digest');
exact(review.revision,source,'Current Review revision');
const inventory=json('lib/atlas-model-inventory.json');
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
 const base=`public/atlas-runtime/${name}/`,manifest=json(base+'manifest.json');
 const familySource=pin.runtimeSources[name];
 exact(manifest.sourceCommit,familySource,`${name}: source`);
 exact(inventory.sources.find(row=>row.module===name)?.sourceCommit,familySource,`${name}: inventory source`);
 exact(sha(readFileSync(`${website}/${base}manifest.json`)),pin.documents[base+'manifest.json'],`${name}: pinned manifest`);
 const notice='LICENSES/THIRD_PARTY_NOTICES.md',actual=readFileSync(`${website}/${base}${notice}`);
 const record=manifest.files.find(row=>row.path===notice);assert(record,`${name}: notice record`);
 exact(actual.length,record.bytes,`${name}: notice length`);
 exact(sha(actual),record.sha256,`${name}: notice digest`);
 exact(actual,git(atlas,'show',`${familySource}:${notice}`),`${name}: actual source notice`);
 if(name==='head-neck'||name==='shoulder'){
  const inputs=json(base+'source-inputs.json');
  for(const path of ['lib/hyoid-epiglottis-ultrasound.ts','content/hyoid-epiglottis-ultrasound.ts','content/hyoid-epiglottis-ultrasound-pins.json']){
   const authored=git(atlas,'show',`${familySource}:${path}`);
   exact(inputs.find(row=>row.path===path)?.sha256,sha(authored),`${name}: ${path} family input`);
   exact(review.files.find(row=>row.path===path)?.sourceSha256,sha(authored),`${name}: ${path} Review source`);
  }
 }
}
const reviewNotice='LICENSES/THIRD_PARTY_NOTICES.md';
const reviewNoticeBytes=readFileSync(`${website}/atlas-review/${reviewNotice}`);
const reviewNoticeRecord=review.files.find(row=>row.path===reviewNotice);assert(reviewNoticeRecord);
exact(sha(reviewNoticeBytes),reviewNoticeRecord.importedSha256,'Review imported notice');
exact(sha(git(atlas,'show',`${source}:${reviewNotice}`)),reviewNoticeRecord.sourceSha256,'Review authored notice');
exact(reviewNoticeBytes,git(atlas,'show',`${source}:${reviewNotice}`),'Review exact source notice');

// The proposal files retain the original line endings. LCS identifies every edit;
// replaying its inverse must recover the entire raw original buffer, not a subset.
function witness(name,originalSha,proposedSha){
 const old=readFileSync(`${stage}/${name}.original.bin`),proposal=readFileSync(`${stage}/${name}`);
 exact(sha(old),originalSha,`${name}: raw preimage`);
 exact(sha(proposal),proposedSha,`${name}: proposal`);
 exact(old,readFileSync(`${website}/tests/${name}`),`${name}: frozen website input`);
 const lines=b=>{const str=b.toString('utf8');assert.equal(Buffer.from(str).length,b.length,'UTF-8 source');return str.match(/[^\n]*\n|[^\n]+$/g)||[];};
 const a=lines(old),b=lines(proposal),dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
  dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,unchanged=0;const inverse=[],removed=[],added=[];
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){inverse.push(b[j]);i++;j++;unchanged++;continue;}
  if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1])){inverse.push(a[i]);removed.push(a[i]);i++;continue;}
  added.push(b[j]);j++;
 }
 exact(Buffer.from(inverse.join('')),old,`${name}: complete exact inverse`);
 assert(removed.length>0&&added.length>0&&unchanged>0,`${name}: nontrivial bounded edit`);
 const changed=(removed.concat(added)).join('');
 if(name.startsWith('atlas-hyoid')){
  assert.match(changed,/runtimeSources/);
  assert.match(changed,/exact family source/);
  assert.doesNotMatch(changed,/citation|radiologist|approval=false/);
 }else{
  assert.match(changed,/assertFamilyNotice/);
  assert.match(changed,/familySource/);
  assert.doesNotMatch(changed,/retainedNotice|renalNotice|backNotice|beforeWallBack/);
 }
 return {name,originalSha256:sha(old),proposalSha256:sha(proposal),originalBytes:old.length,proposalBytes:proposal.length,unchangedLines:unchanged,removedLines:removed.length,addedLines:added.length,exactInverse:true};
}
const files=[
 witness('atlas-hyoid-epiglottis-ultrasound-checks.mjs','47816bc4a76d72ab78b0e5e5ed23ba648dfe9aea76733c4fe3a949edcea6d050','47bb301e70aa826b6ac0237fcf082c8e6492eaaa1bbad21cced77eabb0d4b862'),
 witness('atlas-lumbar-tour.test.ts','9fa396133987d81fc5eff4ab4019aeea4e1f6ab2ea40b7eda7c6a2cbef650d3e','e7272354e58c00406639b2ee0620ba4033a493b560dbdb5770a514cc999aca9c'),
];
console.log(JSON.stringify({source,reviewSha,websiteHead,families:pin.runtimeSources,files,nativeTestsRun:false,modelBytesRead:false},null,2));
