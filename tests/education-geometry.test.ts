import test from 'node:test';
import assert from 'node:assert/strict';
import {
  imagePointToPatientPoint, projectPatientPointToSeries, resolvePatientSpaceLocalizer,
  resolveStoredPatientSpaceLocalizer, educationGeometryForCase, SpatialLinkError,
  type DicomFrameGeometry, type DicomSeriesGeometry, type PatientPoint, type ValidatedRegistration,
} from '../lib/education-viewer-adapter.ts';

// Entirely synthetic coordinates: no scans, medical identifiers or release claims.
const frame = (index=0, z=0): DicomFrameGeometry => ({sopInstanceUid:`2.25.100.${index+1}`,frame:0,sliceIndex:index,imagePositionPatient:[0,0,z],imageOrientationPatient:[1,0,0,0,1,0],pixelSpacing:[1,1],rows:64,columns:64,sliceThicknessMm:2});
const series = (frames=[frame()]): DicomSeriesGeometry => ({studyInstanceUid:'2.25.1',seriesInstanceUid:'2.25.2',frameOfReferenceUid:'2.25.3',plane:'axial',frames});
const near = (actual:number,expected:number) => assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const rejects = (fn:()=>unknown) => assert.throws(fn,SpatialLinkError);
const identity: ValidatedRegistration['matrix'] = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const registration = (matrix:ValidatedRegistration['matrix']=identity): ValidatedRegistration => ({id:'synthetic-registration',sourceFrameOfReferenceUid:'2.25.9',targetFrameOfReferenceUid:'2.25.3',validated:true,matrix});
const registered = (registrations:ValidatedRegistration[],point:PatientPoint=[2,3,0]) => resolveStoredPatientSpaceLocalizer({sourceFrameOfReferenceUid:'2.25.9',patientPoint:point,targetSeries:[series()],registrations});

test('pixel centres use column spacing for x and row spacing for y',()=>{
  const f={...frame(),imagePositionPatient:[10,20,30] as const,pixelSpacing:[2,3] as const};
  const point=imagePointToPatientPoint(f,4,5);assert.deepEqual(point,[22,30,30]);
  const projected=projectPatientPointToSeries(series([f]),point);
  near(projected.x,4);near(projected.y,5);near(projected.distance,0);
});

test('oblique basis and bounded decimal round-off round-trip without changing source',()=>{
  const q=Math.SQRT1_2;
  const f={...frame(),imagePositionPatient:[10,20,30] as const,pixelSpacing:[2,3] as const,imageOrientationPatient:[q,q,0,-0.5,0.5,q] as const};
  const before=structuredClone(f),point=imagePointToPatientPoint(f,4,5);
  [10+12*q-5,20+12*q+5,30+10*q].forEach((v,i)=>near(point[i],v));
  const result=projectPatientPointToSeries(series([f]),point);near(result.x,4);near(result.y,5);assert.deepEqual(f,before);
  const rounded={...frame(),imageOrientationPatient:[1,0,0,0.000001,0.9999999999995,0] as const};
  const back=projectPatientPointToSeries(series([rounded]),imagePointToPatientPoint(rounded,4,5));near(back.x,4);near(back.y,5);
});

test('non-unit, skewed and degenerate direction cosines are rejected',()=>{
  for(const orientation of [[2,0,0,0,1,0],[1,0,0,0.6,0.8,0],[1,0,0,1,0,0],[0,0,0,0,1,0]]) rejects(()=>imagePointToPatientPoint({...frame(),imageOrientationPatient:orientation as unknown as DicomFrameGeometry['imageOrientationPatient']},2,3));
});

test('malformed dimensions, sparse tuples, missing identity and nonnumeric pixels fail closed',()=>{
  for(const value of [NaN,Infinity,0,-1,1.5]) for(const key of ['rows','columns']) rejects(()=>imagePointToPatientPoint({...frame(),[key]:value},2,3));
  for(const value of [NaN,Infinity,0,-1]) rejects(()=>imagePointToPatientPoint({...frame(),sliceThicknessMm:value},2,3));
  assert.deepEqual(imagePointToPatientPoint({...frame(),sliceThicknessMm:1.5},2,3),[2,3,0]);
  for(const patch of [{frame:-1},{frame:0.1},{sliceIndex:NaN},{sopInstanceUid:''},{imagePositionPatient:[0,,0]},{imageOrientationPatient:new Array(6)},{pixelSpacing:[1,NaN]},{imagePositionPatient:null}]) rejects(()=>imagePointToPatientPoint({...frame(),...patch} as DicomFrameGeometry,2,3));
  for(const x of [NaN,Infinity,null,'2',-1,64]) rejects(()=>imagePointToPatientPoint(frame(),x as number,2));
  rejects(()=>imagePointToPatientPoint({...frame(),pixelSpacing:[1,Number.MAX_VALUE]},2,3));
});

test('source SOP, decoded frame and display index resolve one consistent frame',()=>{
  const first=frame(),second={...frame(1,5),sopInstanceUid:first.sopInstanceUid,frame:1};
  const source=series([first,second]);
  const base={sourceSeries:source,sourceSopInstanceUid:first.sopInstanceUid,x:2,y:3,targetSeries:[source]};
  rejects(()=>resolvePatientSpaceLocalizer(base));
  for(const selector of [{sourceFrame:1},{sourceSliceIndex:1},{sourceFrame:1,sourceSliceIndex:1}]) {
    const result=resolvePatientSpaceLocalizer({...base,...selector});assert.deepEqual(result.patientPoint,[2,3,5]);assert.equal(result.mapped[0].frame,1);
  }
  rejects(()=>resolvePatientSpaceLocalizer({...base,sourceFrame:0,sourceSliceIndex:1}));
  rejects(()=>resolvePatientSpaceLocalizer({...base,sourceSliceIndex:99}));
  rejects(()=>resolvePatientSpaceLocalizer({...base,sourceFrame:1.2}));
  rejects(()=>resolvePatientSpaceLocalizer({...base,sourceFrame:null as unknown as number}));
  rejects(()=>resolvePatientSpaceLocalizer({...base,sourceSopInstanceUid:undefined}));
  assert.deepEqual(resolvePatientSpaceLocalizer({...base,sourceSopInstanceUid:undefined,sourceSliceIndex:1}).patientPoint,[2,3,5]);
});

test('conflicting selectors and duplicate frame/display identities never select the first item',()=>{
  const source=series([frame(),frame(1,5)]);
  rejects(()=>resolvePatientSpaceLocalizer({sourceSeries:source,sourceSopInstanceUid:source.frames[0].sopInstanceUid,sourceSliceIndex:1,x:2,y:3,targetSeries:[source]}));
  for(const f of [{...frame(1),sliceIndex:0},{...frame(1),sopInstanceUid:frame().sopInstanceUid}]) rejects(()=>projectPatientPointToSeries(series([frame(),f]),[2,3,0]));
});

test('projection preserves native gaps and does not extend outside the slab',()=>{
  const stack=series([frame(),frame(1,5)]);
  assert.equal(projectPatientPointToSeries(stack,[2,3,0.75]).frame.sliceIndex,0);
  for(const z of [-2,2.5,7,999]) rejects(()=>projectPatientPointToSeries(stack,[2,3,z]));
  const unknown={...frame(),sliceThicknessMm:undefined};
  assert.equal(projectPatientPointToSeries(series([unknown]),[2,3,0]).distance,0);
  rejects(()=>projectPatientPointToSeries(series([unknown]),[2,3,0.1]));
});

test('frame choice considers in-plane field of view as well as distance',()=>{
  const outside={...frame(),imagePositionPatient:[20,0,0] as const,columns:1};
  const inside=frame(1,0.1);
  assert.equal(projectPatientPointToSeries(series([outside,inside]),[2,3,0]).frame.sliceIndex,1);
  rejects(()=>projectPatientPointToSeries(series(),[100,3,0]));
});

test('ordinary mid-plane ties are stable but coplanar time/echo frames are ambiguous',()=>{
  const a=frame(),b=frame(1,2);
  for(const frames of [[a,b],[b,a]]) assert.equal(projectPatientPointToSeries(series(frames),[2,3,1]).frame.sliceIndex,0);
  rejects(()=>projectPatientPointToSeries(series([a,frame(1,0)]),[2,3,0]));
  const perpendicular={...frame(1),imageOrientationPatient:[1,0,0,0,0,1] as const};
  rejects(()=>projectPatientPointToSeries(series([a,perpendicular]),[2,0,0]));
});

test('stored non-finite points and missing series metadata never produce a projection',()=>{
  for(const point of [[NaN,0,0],[0,Infinity,0],[0,,0]]) rejects(()=>projectPatientPointToSeries(series(),point as unknown as PatientPoint));
  for(const patch of [{studyInstanceUid:''},{seriesInstanceUid:''},{frameOfReferenceUid:''},{frames:[]}]) rejects(()=>projectPatientPointToSeries({...series(),...patch},[2,3,0]));
});

test('explicit directed affine registration handles translation, scale and shear',()=>{
  const translated=registration([1,0,0,10,0,1,0,0,0,0,1,0,0,0,0,1]);
  const result=registered([translated]);near(result.mapped[0].x,12);near(result.mapped[0].y,3);assert.equal(result.mapped[0].registrationId,translated.id);
  const affine=registration([2,1,0,0,0,3,0,0,0,0,1,0,0,0,0,1]);
  const scaled=registered([affine]);near(scaled.mapped[0].x,7);near(scaled.mapped[0].y,9);
});

test('malformed, projective, singular and ambiguous registrations are rejected',()=>{
  const sparse=[...identity];delete sparse[5];
  for(const matrix of [identity.slice(0,15),sparse,identity.map((v,i)=>i===0?NaN:v),identity.map((v,i)=>i===5?0:v),identity.map((v,i)=>i===12?0.1:v),identity.map((v,i)=>i===15?2:v)]) rejects(()=>registered([registration(matrix as unknown as ValidatedRegistration['matrix'])]));
  rejects(()=>registered([registration(),registration()]));
  rejects(()=>registered([{...registration(),validated:'yes'} as unknown as ValidatedRegistration]));
  rejects(()=>registered([{...registration(),id:''}]));
  rejects(()=>registered([]));
  rejects(()=>registered([{...registration(),sourceFrameOfReferenceUid:'2.25.3',targetFrameOfReferenceUid:'2.25.9'}]));
});

test('all-or-nothing target mapping is retained and stored source provenance is not invented',()=>{
  const target=series(),point:PatientPoint=[2,3,0];
  const result=resolveStoredPatientSpaceLocalizer({sourceFrameOfReferenceUid:target.frameOfReferenceUid,patientPoint:point,targetSeries:[target]});
  assert.equal(result.sourceSeriesInstanceUid,null);assert.equal(result.sourcePlane,null);assert.deepEqual(result.patientPoint,point);assert.notEqual(result.patientPoint,point);
  rejects(()=>resolveStoredPatientSpaceLocalizer({sourceFrameOfReferenceUid:target.frameOfReferenceUid,patientPoint:point,targetSeries:[target,{...target,frameOfReferenceUid:'2.25.99'}]}));
});

test('existing synthetic tri-planar centre journey remains functional and source is unchanged',()=>{
  const stacks=educationGeometryForCase('case-liver'),before=structuredClone(stacks);
  const result=resolvePatientSpaceLocalizer({sourceSeries:stacks[0],sourceSliceIndex:48,x:128,y:128,targetSeries:stacks});
  assert.equal(result.mapped.length,3);assert.deepEqual(result.patientPoint,[0,0,0]);assert.ok(result.mapped.every(p=>p.sliceIndex===48));assert.deepEqual(stacks,before);
});
