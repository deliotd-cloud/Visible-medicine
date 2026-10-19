import assert from 'node:assert/strict';
import test from 'node:test';
import {createEducationMediaObjectReader} from '../lib/education-media-object-reader.ts';
import {EDUCATION_MEDIA_OBJECT_LIMIT} from '../lib/education-media-delivery.ts';
import {readEducationMediaObject} from '../lib/education-media-delivery.ts';

const key='education-media/synthetic/source-v1/object-1';
function stream(chunks,{keepOpen=false,fail=false,cancelFails=false}={}) {
  let index=0,cancelled=0,readerRequests=0;
  const body=new ReadableStream({
    pull(controller) {
      if(index<chunks.length)controller.enqueue(chunks[index++]);
      else if(fail)controller.error(Error('synthetic private provider detail'));
      else if(!keepOpen)controller.close();
    },
    cancel(){cancelled++;if(cancelFails)throw Error('synthetic cancel failure');},
  });
  const original=body.getReader.bind(body);
  body.getReader=(...args)=>{readerRequests++;return original(...args);};
  return {body,get cancelled(){return cancelled;},get readerRequests(){return readerRequests;}};
}
function stored(parts,overrides={},options={}) {
  const source=stream(parts,options);
  const object={key,size:3,body:source.body,bodyUsed:false,arrayBuffer(){throw Error('Unbounded object reader invoked');},...overrides};
  let gets=0;
  return {source,object,get gets(){return gets;},reader:createEducationMediaObjectReader({async get(requested){gets++;assert.equal(requested,key);return object;}})};
}

test('reads a complete bounded object into owned bytes, without arrayBuffer or shared chunks',async()=>{
  const first=new Uint8Array([1,2]),last=new Uint8Array([3]);
  const fixture=stored([first,last]);const bytes=await fixture.reader(key,3);
  assert.deepEqual(bytes,new Uint8Array([1,2,3]));assert.equal(fixture.gets,1);assert.equal(fixture.source.cancelled,0);
  first.fill(99);last.fill(99);assert.deepEqual(bytes,new Uint8Array([1,2,3]));
  assert.equal(fixture.object.body.locked,false);
});

test('invalid/private/quarantine keys and invalid caps are refused before bucket access',async()=>{
  let calls=0;const read=createEducationMediaObjectReader({async get(){calls++;throw Error('Must not read');}});
  for(const bad of ['quarantine/object','atlas-models/object','https://example.test/object','education-media/a/../b','education-media/a//b','education-media/a?x=1','education-media/a\n',null])assert.equal(await read(bad,3),null);
  for(const cap of [0,-1,1.5,NaN,Infinity,EDUCATION_MEDIA_OBJECT_LIMIT+1,'3'])assert.equal(await read(key,cap),null);
  assert.equal(calls,0);
});

test('missing and throwing storage produce no bytes or provider exception',async()=>{
  for(const get of [async()=>null,async()=>{throw Error('synthetic storage key and credentials must remain private');}])assert.equal(await createEducationMediaObjectReader({get})(key,3),null);
});

test('wrong-key, oversized, malformed-size, ranged or consumed metadata refuses before reader creation',async()=>{
  for(const overrides of [{key:'education-media/other'},{size:4},{size:0},{size:-1},{size:1.5},{size:NaN},{range:{offset:0,length:3}},{bodyUsed:true}]) {
    const fixture=stored([new Uint8Array([1,2,3])],overrides,{keepOpen:true});
    assert.equal(await fixture.reader(key,3),null);assert.equal(fixture.source.cancelled,1);
    assert.equal(fixture.source.readerRequests,0);
    assert.equal(fixture.object.body.locked,false);
  }
});

test('a metadata-only R2 return is not treated as an object body',async()=>{
  const read=createEducationMediaObjectReader({async get(){return {key,size:3};}});
  assert.equal(await read(key,3),null);
});

test('a truncated stream never releases a partial object',async()=>{
  const fixture=stored([new Uint8Array([1,2])]);assert.equal(await fixture.reader(key,3),null);assert.equal(fixture.object.body.locked,false);
});

test('a stream exceeding its declared size is cancelled at the first excess chunk',async()=>{
  const fixture=stored([new Uint8Array([1,2]),new Uint8Array([3,4])],{},{keepOpen:true});
  assert.equal(await fixture.reader(key,3),null);assert.equal(fixture.source.cancelled,1);assert.equal(fixture.object.body.locked,false);
});

test('non-byte and empty chunks are refused rather than counted or looped indefinitely',async()=>{
  for(const chunk of ['not bytes',new Uint8Array(0)]) {
    const fixture=stored([chunk],{},{keepOpen:true});assert.equal(await fixture.reader(key,3),null);assert.equal(fixture.source.cancelled,1);
  }
});

test('provider read failures and rejecting cancellation remain unavailable',async()=>{
  const failed=stored([new Uint8Array([1])],{},{fail:true});assert.equal(await failed.reader(key,3),null);assert.equal(failed.object.body.locked,false);
  const cancelled=stored([new Uint8Array([1,2,3,4])],{},{keepOpen:true,cancelFails:true});assert.equal(await cancelled.reader(key,3),null);assert.equal(cancelled.object.body.locked,false);
});

test('parallel calls do not share buffers or request state',async()=>{
  const read=createEducationMediaObjectReader({async get(requested){const value=requested.endsWith('one')?1:2;return {key:requested,size:1,bodyUsed:false,body:stream([new Uint8Array([value])]).body};}});
  const [one,two]=await Promise.all([read('education-media/one',1),read('education-media/two',1)]);
  assert.deepEqual(one,new Uint8Array([1]));assert.deepEqual(two,new Uint8Array([2]));one[0]=9;assert.equal(two[0],2);
});

function protectedDependencies({allowed=true,clearance='cleared',corrupt=false,revokeAfterRead=false}={}) {
  const bytes=new Uint8Array([1,2,3]),hex=buffer=>Array.from(new Uint8Array(buffer),value=>value.toString(16).padStart(2,'0')).join('');
  return crypto.subtle.digest('SHA-256',bytes).then(digest=>{
    const hash=hex(digest),version='synthetic-assessment-v1',caseId='synthetic-case',objectId='synthetic-object';
    const assessmentHash='a'.repeat(64),publicationHash='b'.repeat(64),uids={studyInstanceUid:'1.2.3',seriesInstanceUid:'1.2.4',frameOfReferenceUid:'1.2.5',sopInstanceUid:'1.2.6'};
    const binding={assessmentVersionId:version,assessmentIntegrityHash:assessmentHash,caseId,caseVersion:1,casePublicationHash:publicationHash,sourceId:'synthetic-source',sourceRevision:'source-v1',clearanceRevision:'clearance-v1',objectId,representation:'dicom-instance',objectKey:key,sha256:hash,byteLength:3,contentType:'application/dicom',...uids};
    let objectReads=0,clearanceReads=0,authorizationReads=0;
    const readObject=createEducationMediaObjectReader({async get(requested){objectReads++;return {key:requested,size:3,bodyUsed:false,body:stream([corrupt?new Uint8Array([9,9,9]):bytes]).body};}});
    return {
      request:{actorId:'synthetic-actor',assessmentVersionId:version,assessmentIntegrityHash:assessmentHash,caseId,objectId},
      dependencies:{
        async loadVerifiedAssessment(){return {id:version,integrityHash:assessmentHash,manifest:{workbook:{id:'synthetic-workbook'},intendedPurpose:'education-only',product:'Visible Medicine',cases:[{id:caseId,version:1,publicationHash,media:{series:[{...uids,plane:'axial',sopInstanceUids:[uids.sopInstanceUid]}]}}]}};},
        async authorizeCase(actor,workbook,requestedCase){authorizationReads++;assert.deepEqual([actor,workbook,requestedCase],['synthetic-actor','synthetic-workbook',caseId]);return allowed;},
        async loadBinding(){return {...binding};},
        async loadClearance(){clearanceReads++;return {sourceId:binding.sourceId,sourceRevision:binding.sourceRevision,clearanceRevision:binding.clearanceRevision,state:revokeAfterRead&&clearanceReads>1?'revoked':clearance,privacyCleared:true,commercialUseCleared:true,objectSha256s:[hash]};},
        readObject,
      },get objectReads(){return objectReads;},get authorizationReads(){return authorizationReads;},
    };
  });
}

test('actual protected delivery contract composes the reader without losing exact case authorization or hashing',async()=>{
  const fixture=await protectedDependencies();const result=await readEducationMediaObject(fixture.request,fixture.dependencies);
  assert.deepEqual(result.bytes,new Uint8Array([1,2,3]));assert.equal(result.headers['Cache-Control'],'private, no-store');
  assert.equal(fixture.objectReads,1);assert.equal(fixture.authorizationReads,2);
});

test('actual protected contract refuses missing access/clearance before storage and corruption/revocation before release',async()=>{
  for(const [options,code,reads] of [[{allowed:false},'access-denied',0],[{clearance:'quarantine'},'source-unavailable',0],[{corrupt:true},'object-integrity',1],[{revokeAfterRead:true},'source-unavailable',1]]) {
    const fixture=await protectedDependencies(options);
    await assert.rejects(readEducationMediaObject(fixture.request,fixture.dependencies),error=>error.code===code);
    assert.equal(fixture.objectReads,reads);
  }
});
