import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {regionalMriReviewProjection,type RegionalMriManifest} from '../lib/regional-mri-package.ts';

const enc=new TextEncoder(),sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const hash='a'.repeat(64),grid={shape_kji:[1,1,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
async function projection(){const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
 {id:'axial',label:'Synthetic source',image:{...grid,file:'axial/image.raw',sha256:hash,dtype:'uint8'},annotations:[
  {id:'a1',anatomyId:'anat.knee.bne.patella',label:'Synthetic patella',seriesId:'axial',sourceImageSha256:hash,laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'b'.repeat(64),scope:'Synthetic source'},geometry:{kind:'points',points_ras_mm:[[0,0,0]]}},
  {id:'a2',anatomyId:'anat.knee.lig.anterior_cruciate_ligament',label:'Synthetic ACL',seriesId:'axial',sourceImageSha256:hash,laterality:'left',coverage:'partial',review:{status:'provisional',revision:'c'.repeat(64),scope:'Inspection only'},geometry:{kind:'mask',file:'axial/mask.raw',sha256:'d'.repeat(64),shape_kji:[1,1,2],offset_kji:[0,0,0],grid,gridKind:'derived-source-ras',mappingRevision:'e'.repeat(64)}},
  {id:'a3',anatomyId:'anat.knee.missing',label:'Deferred',seriesId:'axial',sourceImageSha256:hash,laterality:'left',coverage:'not-assessed',review:{status:'deferred',revision:'f'.repeat(64),scope:'No saved geometry'},geometry:{kind:'none'}},
 ]} ]};const bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer;return regionalMriReviewProjection(bytes,await sha(bytes));}
async function runtime(dev:boolean,value:unknown){const built=await build({stdin:{contents:`export {regionalMriReviewContext} from './lib/regional-mri-review-context';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',define:{'import.meta.env.DEV':dev?'true':'false'},plugins:[{name:'synthetic-virtual',setup(b){b.onResolve({filter:/^virtual:visible-medicine-regional-review-context$/},()=>({path:'synthetic',namespace:'review-context'}));b.onLoad({filter:/.*/,namespace:'review-context'},()=>({contents:'export default '+JSON.stringify(value)+';',loader:'js'}));}}]});return (await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString('base64')}`)).regionalMriReviewContext as (source:{revision:string;region:string}|null)=>Promise<any>;
}
const clone=<T>(value:T):T=>structuredClone(value);
async function resigned(value:any){const {projectionRevision:_old,...payload}=value;return {...payload,projectionRevision:await sha(enc.encode(JSON.stringify(payload)).buffer as ArrayBuffer)};}

test('DEV server helper admits actual projection, rechecks digest and returns frozen exact private metadata',async()=>{
 const data=await projection(),check=await runtime(true,data);
 const result=await check({revision:data.sourceRevision,region:'knee'});assert(result);assert.notStrictEqual(result,data);
 assert.equal(result.projectionRevision,data.projectionRevision);assert.equal(result.series[0].annotations[0].reviewStatus,'accepted-scoped');
 assert.equal(result.series[0].annotations[1].gridKind,'derived-source-ras');assert.equal(result.series[0].annotations[2].geometryKind,'none');
 assert(Object.isFrozen(result));assert(Object.isFrozen(result.series));assert(Object.isFrozen(result.series[0].annotations[0]));
 assert(!JSON.stringify(result).includes('axial/image.raw'));assert(!JSON.stringify(result).includes('points_ras_mm'));
});

test('production, missing context and source/region/revision mismatch are null',async()=>{
 const data=await projection(),dev=await runtime(true,data),prod=await runtime(false,data);
 assert.equal(await prod({revision:data.sourceRevision,region:'knee'}),null);
 assert.equal(await dev(null),null);assert.equal(await dev({revision:'0'.repeat(64),region:'knee'}),null);assert.equal(await dev({revision:data.sourceRevision,region:'thigh'}),null);
 const missing=await runtime(true,null);assert.equal(await missing({revision:data.sourceRevision,region:'knee'}),null);
});

test('malformed, extra, duplicate and inconsistent rows fail even with recomputed digest',async()=>{
 const data=await projection(),source={revision:data.sourceRevision,region:'knee'};
 for(const mutate of [
  (v:any)=>{v.extra='private path'},(v:any)=>{v.series[0].annotations[0].extra='coordinate'},
  (v:any)=>{v.series.push(clone(v.series[0]))},(v:any)=>{v.series[0].annotations.push(clone(v.series[0].annotations[0]))},
  (v:any)=>{v.series[0].annotations[0].laterality='unknown'},(v:any)=>{v.series[0].annotations[0].reviewStatus='approved'},
  (v:any)=>{v.series[0].annotations[1].gridKind=null},(v:any)=>{v.series[0].annotations[1].geometrySourceSha256=null},
  (v:any)=>{v.series[0].annotations[2].geometryKind='points'},(v:any)=>{v.series[0].annotations[0].geometryMappingRevision='0'.repeat(64)},
 ]){const changed=await resigned(mutateAndClone(data,mutate)),check=await runtime(true,changed);assert.equal(await check(source),null);}
 const tampered:any=clone(data);tampered.series[0].annotations[0].label='Changed without digest';const check=await runtime(true,tampered);assert.equal(await check(source),null);
});

function mutateAndClone<T>(value:T,mutate:(value:T)=>void):T{const result=clone(value);mutate(result);return result;}
