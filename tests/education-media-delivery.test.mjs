import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {readEducationMediaObject,EducationMediaDeliveryError,EDUCATION_MEDIA_OBJECT_LIMIT} from '../lib/education-media-delivery.ts';
import {educationMediaReadiness} from '../lib/education-media-readiness.ts';

const hash=value=>createHash('sha256').update(value).digest('hex');
const assessmentHash=hash('synthetic immutable assessment'),publicationHash=hash('synthetic frozen case');
function fixture(){
  // Intentionally NOT a scan/image: these tests verify delivery integrity, not decoding.
  const bytes=new TextEncoder().encode('opaque synthetic Education bytes');
  const request={actorId:'synthetic-learner',assessmentVersionId:'assessment-v1',assessmentIntegrityHash:assessmentHash,caseId:'case-1',objectId:'object-1'};
  const series={studyInstanceUid:'2.25.1',seriesInstanceUid:'2.25.2',frameOfReferenceUid:'2.25.3',sopInstanceUids:['2.25.4'],plane:'axial',frameCount:1};
  const record={id:'assessment-v1',integrityHash:assessmentHash,manifest:{product:'Visible Medicine',intendedPurpose:'education-only',workbook:{id:'workbook-1'},cases:[{id:'case-1',version:2,publicationHash,media:{kind:'dicom',series:[series]}}]}};
  const binding={assessmentVersionId:'assessment-v1',assessmentIntegrityHash:assessmentHash,caseId:'case-1',caseVersion:2,casePublicationHash:publicationHash,sourceId:'source-1',sourceRevision:'source-r2',clearanceRevision:'clearance-r3',objectId:'object-1',objectKey:'education-media/synthetic/object-1',sha256:hash(bytes),byteLength:bytes.byteLength,contentType:'application/dicom',representation:'dicom-instance',studyInstanceUid:'2.25.1',seriesInstanceUid:'2.25.2',frameOfReferenceUid:'2.25.3',sopInstanceUid:'2.25.4'};
  const clearance={sourceId:'source-1',sourceRevision:'source-r2',clearanceRevision:'clearance-r3',state:'cleared',privacyCleared:true,commercialUseCleared:true,objectSha256s:[hash(bytes)]};
  const calls=[];
  const dependencies={
    async loadVerifiedAssessment(...args){calls.push(['assessment',...args]);return record;},
    async authorizeCase(...args){calls.push(['access',...args]);return true;},
    async loadBinding(...args){calls.push(['binding',...args]);return binding;},
    async loadClearance(...args){calls.push(['clearance',...args]);return clearance;},
    async readObject(...args){calls.push(['read',...args]);return bytes;},
  };
  return{bytes,request,record,binding,clearance,calls,dependencies};
}
async function denied(f,code){
  await assert.rejects(readEducationMediaObject(f.request,f.dependencies),error=>error instanceof EducationMediaDeliveryError&&error.code===code&&!error.message.includes('education-media/'));
}
test('exact frozen case/revision and verified bytes produce a private bounded object, never global readiness',async()=>{
  const f=fixture();const result=await readEducationMediaObject(f.request,f.dependencies);
  assert.deepEqual(result.bytes,f.bytes);assert.notEqual(result.bytes,f.bytes);
  assert.equal(result.sha256,hash(f.bytes));assert.equal(result.assessmentIntegrityHash,assessmentHash);
  assert.equal(result.sourceRevision,'source-r2');assert.equal(result.caseId,'case-1');
  assert.equal(result.headers['Cache-Control'],'private, no-store');assert.equal(result.headers['X-Content-Type-Options'],'nosniff');
  assert(!('objectKey' in result));assert(!('actorId' in result));assert(!('mediaReady' in result));
  assert.deepEqual(f.calls.filter(c=>c[0]==='access'),[['access','synthetic-learner','workbook-1','case-1'],['access','synthetic-learner','workbook-1','case-1']]);
  assert.deepEqual(f.calls.filter(c=>c[0]==='read'),[['read','education-media/synthetic/object-1',f.bytes.byteLength]]);
  assert.equal(educationMediaReadiness().mediaReady,false);
});
for(const [field,value] of [['actorId',''],['actorId','user\nspoof'],['assessmentVersionId','../other'],['caseId','%2fsecret'],['objectId','https://example.invalid'],['assessmentIntegrityHash','not-a-hash']])test('invalid request '+field+' is refused before dependencies',async()=>{
  const f=fixture();f.request[field]=value;await denied(f,'invalid-request');assert.equal(f.calls.length,0);
});
test('no frozen assessment or non-member case cannot resolve storage',async()=>{
  for(const duplicate of [false,true]){const f=fixture();f.record.manifest.cases=duplicate?[...f.record.manifest.cases,...f.record.manifest.cases]:[];await denied(f,'access-denied');assert(!f.calls.some(c=>c[0]==='binding'));}
  const f=fixture();f.dependencies.loadVerifiedAssessment=async()=>null;await denied(f,'access-denied');
});
test('Atlas or lecture permission cannot substitute for case access',async()=>{
  const f=fixture();f.dependencies.authorizeCase=async()=>false;f.request.atlasAllowed=true;f.request.lectureAllowed=true;
  await denied(f,'access-denied');assert(!f.calls.some(c=>c[0]==='binding'||c[0]==='read'));
});
test('stale assessment hash is refused before object lookup',async()=>{
  const f=fixture();f.request.assessmentIntegrityHash=hash('old version');await denied(f,'revision-mismatch');assert(!f.calls.some(c=>c[0]==='binding'));
});
test('a verified record for another assessment version is refused',async()=>{
  const f=fixture();f.record.id='assessment-v2';await denied(f,'revision-mismatch');assert(!f.calls.some(c=>c[0]==='binding'));
});
for(const field of ['studyInstanceUid','seriesInstanceUid','frameOfReferenceUid','sopInstanceUid'])test('same-case extra object outside frozen '+field+' is refused before reading',async()=>{
  const f=fixture();f.binding[field]='2.25.999';await denied(f,'revision-mismatch');assert(!f.calls.some(c=>c[0]==='read'));
});
test('ambiguous frozen series and slide/tile addressing are not treated as DICOM delivery',async()=>{
  for(const slide of [false,true]){const f=fixture();const series=f.record.manifest.cases[0].media.series;if(slide)series[0].plane='slide';else series.push({...series[0]});await denied(f,'revision-mismatch');assert(!f.calls.some(c=>c[0]==='read'));}
});
test('frozen media identifiers cannot be retargeted by mutation during authorization',async()=>{
  const f=fixture();f.dependencies.authorizeCase=async()=>{f.record.manifest.cases[0].media.series[0].sopInstanceUids=['2.25.999'];f.binding.sopInstanceUid='2.25.999';return true;};await denied(f,'revision-mismatch');
});
for(const [field,value] of [['assessmentVersionId','other-version'],['assessmentIntegrityHash',hash('other-manifest')],['caseId','case-2'],['caseVersion',3],['casePublicationHash',hash('mutable current case')],['objectId','object-2']])test('binding mismatch '+field+' cannot read bytes',async()=>{
  const f=fixture();f.binding[field]=value;await denied(f,'revision-mismatch');assert(!f.calls.some(c=>c[0]==='read'));
});
for(const [field,value] of [['state','quarantine'],['state','revoked'],['privacyCleared',false],['commercialUseCleared',false],['sourceRevision','old-source'],['clearanceRevision','old-clearance'],['objectSha256s',[]]])test('uncleared/stale source '+field+' cannot read bytes',async()=>{
  const f=fixture();f.clearance[field]=value;await denied(f,'source-unavailable');assert(!f.calls.some(c=>c[0]==='read'));
});
for(const key of ['quarantine/object-1','education-media/../secret','education-media/%2e%2e/secret','education-media//secret','https://example.invalid/image'])test('unscoped storage key is refused: '+key,async()=>{
  const f=fixture();f.binding.objectKey=key;await denied(f,'source-unavailable');assert(!f.calls.some(c=>c[0]==='read'));
});
test('missing binding, missing clearance and absent storage object fail closed',async()=>{
  for(const [method,code] of [['loadBinding','source-unavailable'],['loadClearance','source-unavailable'],['readObject','object-unavailable']]){const f=fixture();f.dependencies[method]=async()=>null;await denied(f,code);}
});
for(const [field,value] of [['byteLength',0],['byteLength',-1],['byteLength',1.1],['byteLength',EDUCATION_MEDIA_OBJECT_LIMIT+1],['contentType','image/svg+xml'],['contentType','text/html'],['contentType','image/png'],['representation','wsi-tile'],['sopInstanceUid','invalid'],['sha256','invalid']])test('invalid object contract '+field+' is refused before allocation',async()=>{
  const f=fixture();f.binding[field]=value;await denied(f,'source-unavailable');assert(!f.calls.some(c=>c[0]==='read'));
});
test('short, oversized and hash-changed objects never escape',async()=>{
  for(const size of [0,1,100]){const f=fixture();f.dependencies.readObject=async()=>new Uint8Array(size);await denied(f,'object-integrity');}
  const f=fixture();f.bytes[0]^=1;await denied(f,'object-integrity');
});
test('mid-read access revocation releases no object',async()=>{
  const f=fixture();let authorized=true;f.dependencies.authorizeCase=async()=>authorized;
  f.dependencies.readObject=async()=>{authorized=false;return f.bytes;};await denied(f,'access-denied');
});
test('mid-read clearance revocation and revision replacement release no object',async()=>{
  for(const field of ['state','clearanceRevision']){const f=fixture();f.dependencies.readObject=async()=>{f.clearance[field]=field==='state'?'revoked':'clearance-new';return f.bytes;};await denied(f,'source-unavailable');}
});
test('mid-read binding replacement releases no object even when byte hash is unchanged',async()=>{
  const f=fixture();f.dependencies.readObject=async()=>{f.binding.objectKey='education-media/other/object-1';return f.bytes;};await denied(f,'revision-mismatch');
});
test('request mutation during await cannot retarget the checked read',async()=>{
  const f=fixture();f.dependencies.loadVerifiedAssessment=async()=>{f.request.caseId='case-2';f.request.objectId='object-2';return f.record;};
  const result=await readEducationMediaObject(f.request,f.dependencies);assert.equal(result.caseId,'case-1');assert.equal(result.objectId,'object-1');
});
test('provider failure is redacted and never falls back to identifiers/demonstration images',async()=>{
  const f=fixture();f.dependencies.readObject=async()=>{throw Error('secret/key https://private.invalid credentials');};
  await denied(f,'delivery-unavailable');
});
test('production readiness is not wired to this one-object seam or client claims',()=>{
  const source=readFileSync(new URL('../lib/education-media-readiness.ts',import.meta.url),'utf8');
  assert(source.includes('mediaReady: false'));assert(!source.includes('readEducationMediaObject'));
});
