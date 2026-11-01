import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const site='G:/VisibleMedicine-temp/staging/20261101-focus-website/website';
const native='G:/VisibleMedicine-temp/staging/20261101-focus-native-integration/atlas';
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
test('imported prostate focus helper is covered by the source revision and current import',()=>{
 const manifest=read(site+'/atlas-review/manifest.json');
 assert.equal(manifest.revision,'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc');
 const files=new Map(manifest.files.map(row=>[row.path,row]));assert.equal(files.size,manifest.files.length);
 for(const path of ['app/study-return-focus.ts','app/prostate-zones.tsx','app/study-surface.tsx','content/prostate-zones-revision.json']){
  const row=files.get(path);assert(row,'Missing imported '+path);
  assert.equal(row.sourceSha256,sha(native+'/'+path),path+' source');
  assert.equal(row.importedSha256,sha(site+'/atlas-review/'+path),path+' import');
 }
 const pin=read(site+'/atlas-review/content/prostate-zones-revision.json');
 const sourcePin=read(native+'/content/prostate-zones-revision.json');assert.deepEqual(pin,sourcePin);
 assert.equal(pin.clinicalReview,'pending');assert.equal(pin.patientSpaceRegistration,null);
 assert.equal(pin.inputs.filter(row=>row.file==='app/study-return-focus.ts').length,1);
 assert.equal(pin.inputs.find(row=>row.file==='app/study-return-focus.ts').sha256,files.get('app/study-return-focus.ts').sourceSha256);
 assert.match(fs.readFileSync(site+'/atlas-review/app/prostate-zones.tsx','utf8'),/from '\.\/study-return-focus'/);
 assert.match(fs.readFileSync(site+'/atlas-review/app/study-surface.tsx','utf8'),/from '\.\/study-return-focus'/);
});
