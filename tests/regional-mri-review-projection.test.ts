import assert from 'node:assert/strict';
import test from 'node:test';
import {regionalMriReviewProjection,type RegionalMriManifest} from '../lib/regional-mri-package.ts';

const enc=new TextEncoder(),sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const grid={shape_kji:[1,2,3],ijk_to_ras:[[1,0,0,10],[0,2,0,20],[0,0,3,30],[0,0,0,1]]};
const imageHash='a'.repeat(64),maskHash='b'.repeat(64);
const annotation=(id:string,seriesId:string,kind:'mask'|'points'|'curve'|'none',status:'accepted-scoped'|'provisional'|'deferred')=>({
 id,anatomyId:'anat.knee.bne.patella',label:`Synthetic ${id}`,seriesId,sourceImageSha256:imageHash,laterality:'left' as const,coverage:kind==='none'?'not-assessed' as const:'partial' as const,
 review:{status,revision:(status==='deferred'?'d':status==='provisional'?'e':'c').repeat(64),scope:`Source scope for ${id}`},
 geometry:kind==='mask'?{kind:'mask' as const,file:`${seriesId}/${id}.raw`,sha256:maskHash,shape_kji:[1,1,2],offset_kji:[0,1,1],grid,gridKind:'source-native' as const,mappingRevision:'f'.repeat(64)}:
  kind==='points'?{kind:'points' as const,points_ras_mm:[[10,20,30]]}:kind==='curve'?{kind:'curve' as const,points_ras_mm:[[10,20,30],[11,20,30]]}:{kind:'none' as const},
});
function manifest():RegionalMriManifest{return {schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'bilateral',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
 {id:'axial',label:'Axial source',image:{...grid,file:'axial/image.raw',sha256:imageHash,dtype:'uint8'},annotations:[annotation('mask-a','axial','mask','accepted-scoped'),annotation('point-a','axial','points','provisional'),annotation('deferred-a','axial','none','deferred')]},
 {id:'sagittal',label:'Sagittal source',image:{...grid,file:'sagittal/image.raw',sha256:imageHash,dtype:'uint8'},annotations:[annotation('curve-b','sagittal','curve','accepted-scoped')]},
]};}
async function packed(value:RegionalMriManifest=manifest()){const bytes=enc.encode(JSON.stringify(value)).buffer as ArrayBuffer;return {bytes,revision:await sha(bytes)};}
const clone=<T>(value:T):T=>structuredClone(value);

test('exact independently pinned bytes produce frozen, ordered metadata and a canonical projection digest',async()=>{
 const input=await packed(),original=input.bytes.slice(0),result=await regionalMriReviewProjection(input.bytes,input.revision);
 assert.deepEqual(input.bytes,original);assert.equal(result.sourceRevision,input.revision);assert.equal(result.region,'knee');
 assert.equal(result.schema,'visible-medicine.regional-mri-review-context/1');assert.equal(result.registration,'none');assert.equal(result.release,'local-private-draft');
 assert.deepEqual(result.series.map(s=>s.id),['axial','sagittal']);
 assert.deepEqual(result.series[0].annotations.map(a=>a.id),['mask-a','point-a','deferred-a']);
 assert.equal(result.series[0].annotations[0].anatomyId,result.series[1].annotations[0].anatomyId,'repeated anatomy is retained per sequence');
 const {projectionRevision,...payload}=result;
 assert.equal(projectionRevision,await sha(enc.encode(JSON.stringify(payload)).buffer as ArrayBuffer));
 assert(Object.isFrozen(result));assert(Object.isFrozen(result.series));assert(Object.isFrozen(result.series[0]));assert(Object.isFrozen(result.series[0].annotations[0]));
 assert.deepEqual(Object.keys(result),['schema','sourceRevision','region','laterality','registration','release','series','projectionRevision']);
});

test('every source-declared status and geometry kind stays distinct; no asset path or spatial content escapes',async()=>{
 const {bytes,revision}=await packed(),result=await regionalMriReviewProjection(bytes,revision);
 const [mask,point,deferred]=result.series[0].annotations,curve=result.series[1].annotations[0];
 assert.deepEqual([mask.reviewStatus,point.reviewStatus,deferred.reviewStatus,curve.reviewStatus],['accepted-scoped','provisional','deferred','accepted-scoped']);
 assert.deepEqual([mask.geometryKind,point.geometryKind,deferred.geometryKind,curve.geometryKind],['mask','points','none','curve']);
 assert.equal(mask.gridKind,'source-native');assert.equal(mask.geometryMappingRevision,'f'.repeat(64));assert.equal(mask.geometrySourceSha256,maskHash);
 for(const entry of [point,deferred,curve]){assert.equal(entry.gridKind,null);assert.equal(entry.geometryMappingRevision,null);assert.equal(entry.geometrySourceSha256,null);}
 assert.equal(mask.reviewScope,'Source scope for mask-a');assert.equal(mask.coverage,'partial');
 const json=JSON.stringify(result);
 for(const forbidden of ['file','dtype','shape_kji','ijk_to_ras','offset_kji','points_ras_mm','pixel','raw','10,20,30','axial/image.raw','axial/mask.raw'])
  assert(!json.includes(`"${forbidden}"`)&&!json.includes(forbidden.includes('/')?forbidden:'"'+forbidden+'":'),`no ${forbidden} in projection`);
 assert(!json.includes('clinicalApproved')&&!json.includes('accepted-clinical'));
});

test('source or review context change alters digest; malformed and stale source fail before projection',async()=>{
 const base=await packed(),original=await regionalMriReviewProjection(base.bytes,base.revision);
 for(const mutate of [
  (m:RegionalMriManifest)=>{m.series[0].annotations[0].review.revision='0'.repeat(64)},
  (m:RegionalMriManifest)=>{m.series[0].annotations[0].review.scope='Revised scope'},
  (m:RegionalMriManifest)=>{m.series[0].annotations[0].coverage='complete'},
  (m:RegionalMriManifest)=>{m.series.reverse()},
 ]){const value=clone(manifest());mutate(value);const changed=await packed(value),result=await regionalMriReviewProjection(changed.bytes,changed.revision);assert.notEqual(result.projectionRevision,original.projectionRevision);}
 await assert.rejects(regionalMriReviewProjection(base.bytes,'0'.repeat(64)),/revision mismatch/);
 const invalid=manifest();(invalid as any).extra='untrusted';const wrong=await packed(invalid);
 await assert.rejects(regionalMriReviewProjection(wrong.bytes,wrong.revision),/Unsupported manifest fields/);
 const mismatched=manifest();mismatched.series[0].annotations[0].sourceImageSha256='0'.repeat(64);const bad=await packed(mismatched);
 await assert.rejects(regionalMriReviewProjection(bad.bytes,bad.revision),/different source sequence/);
});

test('input is detached before async hash; cancellation and bounded manifest size fail closed',async()=>{
 const input=await packed(),promise=regionalMriReviewProjection(input.bytes,input.revision);
 new Uint8Array(input.bytes).fill(0);const result=await promise;assert.equal(result.sourceRevision,input.revision);
 const fresh=await packed(),pre=new AbortController();pre.abort();
 await assert.rejects(regionalMriReviewProjection(fresh.bytes,fresh.revision,pre.signal),{name:'AbortError'});
 const during=new AbortController(),pending=regionalMriReviewProjection(fresh.bytes,fresh.revision,during.signal);during.abort();
 await assert.rejects(pending,{name:'AbortError'});
 await assert.rejects(regionalMriReviewProjection(new ArrayBuffer(8388609),'0'.repeat(64)),/manifest size/);
 await assert.rejects(regionalMriReviewProjection(new Uint8Array(1) as any,'0'.repeat(64)),/manifest size/);
});
