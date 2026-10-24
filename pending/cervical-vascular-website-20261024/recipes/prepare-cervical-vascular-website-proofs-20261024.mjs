// Add a fresh source role; retain the genuine765 theorem/helper in full.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-cervical-vascular-website',site=stage+'/website';
const oldFile='F:/VisibleMedicine/staging/20261024-guided-review-current-proof/PROOF_BOUND.json';assert.equal(hash(oldFile),'cb626284d1a7604e46b1a42fb226a20b46052911c4d820ffc01913516751c02e');const old=json(oldFile);
const originalPath='tests/guided-review-completeness-765.test.mjs',helper='tests/guided-review-completeness.mjs',raw='tests/fixtures/guided-review-completeness-765.mjs.raw',fresh='tests/guided-review-completeness-b79.test.mjs';
for(const p of [originalPath,helper])assert.equal(hash(old.website+'/'+p),old.sourceRows.find(r=>r.path===p)?.sha256,p);
fs.copyFileSync(old.website+'/'+originalPath,site+'/'+raw,fs.constants.COPYFILE_EXCL);fs.copyFileSync(old.website+'/'+helper,site+'/'+helper,fs.constants.COPYFILE_EXCL);
let next=fs.readFileSync(old.website+'/'+originalPath,'utf8');const original=next;
const seams=[['7659453d7d99da78742b06ee6e6665a467e5d972','b79e110d2d28f18993263926ba35aa7a3f478b20'],['386b175434aa1f7cbcd705e05f0946b3b594ca54','0dd97cc55ef9aff3493b91752309d1d661c0b0c8'],['assert.equal(manifest.files.length,1601)','assert.equal(manifest.files.length,1603)']];
for(const [a,b]of seams){assert.equal(next.split(a).length,2,a);next=next.replace(a,b);}let inverse=next;for(const [a,b]of [...seams].reverse())inverse=inverse.replace(b,a);assert.equal(inverse,original);
fs.writeFileSync(site+'/'+fresh,next,{flag:'wx'});
const parent=json('F:/VisibleMedicine/staging/20261024-guided-review-navigation/SOURCE_BOUND.json'),delivery='tests/current-atlas-delivery.test.mjs';assert.equal(hash(parent.website+'/'+delivery),parent.sourceRows.find(r=>r.path===delivery)?.sha256);fs.copyFileSync(parent.website+'/'+delivery,site+'/tests/fixtures/current-atlas-delivery-765-navigation.mjs.raw',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/PROOF_TRANSITION.json',JSON.stringify({at:new Date().toISOString(),oldProof:oldFile,oldProofSha256:hash(oldFile),oldTheoremSha256:hash(old.website+'/'+originalPath),newTheoremSha256:hash(site+'/'+fresh),originalHelperSha256:hash(site+'/'+helper),seams,wholeOriginalTheoremInverseVerified:true,old765AndEarlier5f3ProofsPreserved:true,previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({newProofPaths:4,oneAdditionalCurrentDeliveryRaw:true,wholeOriginal765TheoremPreserved:true,previewChanged:false}));
