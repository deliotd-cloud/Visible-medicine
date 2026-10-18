import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {resolveRegionalMriLearning,isRegionalMriLearning,regionalLearningRevision} from '../lib/regional-mri-learning.ts';

const bundled=await build({stdin:{contents:`export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {buildRegionalMri3dCatalogue}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`) as any;
const enc=new TextEncoder(),sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const asset=(bytes:ArrayBuffer):RegionalAsset=>({size:bytes.byteLength,async arrayBuffer(){return bytes.slice(0)}});
const clone=<T>(v:T):T=>structuredClone(v);
async function fixture(label='Synthetic MRI'){
 const image=enc.encode('AB').buffer as ArrayBuffer,mask=new Uint8Array([1,0]).buffer as ArrayBuffer,imageHash=await sha(image),maskHash=await sha(mask);
 const grid={shape_kji:[1,1,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'bilateral',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
  {id:'axial',label,image:{...grid,file:'axial/image.raw',sha256:imageHash,dtype:'uint8'},annotations:[
   {id:'patella',anatomyId:'anat.knee.bne.patella',label:'Synthetic patella',seriesId:'axial',sourceImageSha256:imageHash,laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Synthetic scope'},geometry:{kind:'mask',file:'axial/mask.raw',sha256:maskHash,shape_kji:[1,1,2],offset_kji:[0,0,0],grid,gridKind:'source-native',mappingRevision:'d'.repeat(64)}},
   {id:'provisional',anatomyId:'anat.knee.bne.patella',label:'Provisional',seriesId:'axial',sourceImageSha256:imageHash,laterality:'left',coverage:'partial',review:{status:'provisional',revision:'e'.repeat(64),scope:'Inspection'},geometry:{kind:'points',points_ras_mm:[[0,0,0]]}},
   {id:'deferred',anatomyId:'anat.knee.bne.patella',label:'Deferred',seriesId:'axial',sourceImageSha256:imageHash,laterality:'left',coverage:'partial',review:{status:'deferred',revision:'f'.repeat(64),scope:'Deferred'},geometry:{kind:'none'}},
  ]},{id:'sagittal',label:'Other series',image:{...grid,file:'sagittal/image.raw',sha256:imageHash,dtype:'uint8'},annotations:[]}]};
 const bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=await sha(bytes);
 const assets=new Map([['manifest.json',asset(bytes)],['axial/image.raw',asset(image)],['axial/mask.raw',asset(mask)],['sagittal/image.raw',asset(image)]]);
 const pkg=await openRegionalMriPackage(bytes,assets,revision),study=await loadRegionalMriSeries(pkg,'axial'),other=await loadRegionalMriSeries(pkg,'sagittal');
 const overlay=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[0]),provisional=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[1],undefined,{inspectProvisional:true});
 const catalogue=await buildRegionalMri3dCatalogue({revision,region:'knee'}),target=catalogue.entries.find((e:any)=>e.anatomyId==='anat.knee.bne.patella'&&e.sourceSide==='left').targets[0];
 return {pkg,study,other,overlay,provisional,catalogue,target,revision};
}

test('accepted loader-owned MRI resolves only an exact public teaching packet',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'};
 const result=await resolveRegionalMriLearning(source,f.catalogue,f.pkg,f.study,f.overlay,f.target.id);
 assert(result);assert(isRegionalMriLearning(result));assert.equal(result.entry.target.id,f.target.id);assert.equal(result.target.oppositeSide,false);
 assert.equal(isRegionalMriLearning({...result}),false);assert(Object.isFrozen(result.entry));
 assert.equal(await resolveRegionalMriLearning(source,{...f.catalogue,learning:undefined},f.pkg,f.study,f.overlay,f.target.id),null);
 assert.equal(await resolveRegionalMriLearning(source,f.catalogue,f.pkg,f.study,f.provisional,f.target.id),null);
 assert.equal(await resolveRegionalMriLearning(source,f.catalogue,f.pkg,f.other,f.overlay,f.target.id),null);
 assert.equal(await resolveRegionalMriLearning(source,f.catalogue,f.pkg,f.study,f.overlay,'unknown'),null);
 assert.equal(await resolveRegionalMriLearning({...source,revision:'0'.repeat(64)},f.catalogue,f.pkg,f.study,f.overlay,f.target.id),null);
 assert.equal(await resolveRegionalMriLearning({...source,region:'thigh'},f.catalogue,f.pkg,f.study,f.overlay,f.target.id),null);
 const borrowed=await fixture('Borrowed MRI');assert.equal(await resolveRegionalMriLearning(source,f.catalogue,borrowed.pkg,f.study,f.overlay,f.target.id),null);
 assert.equal(await resolveRegionalMriLearning(source,f.catalogue,f.pkg,borrowed.study,f.overlay,f.target.id),null);
 assert.equal(await resolveRegionalMriLearning(source,f.catalogue,f.pkg,f.study,borrowed.overlay,f.target.id),null);
});

test('malformed, duplicate, altered and stale teaching cannot resolve or fall back',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'},entry=f.catalogue.learning.entries.find((e:any)=>e.target.id===f.target.id&&e.target.relation===f.target.relation);assert(entry);
 for(const mutate of [
  (c:any)=>{c.learning.entries.push(clone(entry))},
  (c:any)=>{c.learning.mappingRevision='0'.repeat(64)},
  (c:any)=>{c.learning.entries.find((e:any)=>e.target.id===f.target.id).topics[0].body='Altered'},
  (c:any)=>{c.learning.entries.find((e:any)=>e.target.id===f.target.id).target.side='right'},
  (c:any)=>{c.learning.entries.find((e:any)=>e.target.id===f.target.id).topics[0].references=[{url:'http://invalid.test',title:'Bad'}]},
  (c:any)=>{c.entries.find((row:any)=>row.anatomyId==='anat.knee.bne.patella'&&row.sourceSide==='left').targets[0].sourceHash='0'.repeat(64)},
 ]){const c=clone(f.catalogue);mutate(c);assert.equal(await resolveRegionalMriLearning(source,c,f.pkg,f.study,f.overlay,f.target.id),null);}
 const stale=clone(f.catalogue);stale.learning.entries.find((e:any)=>e.target.id===f.target.id).revision='0'.repeat(64);
 assert.equal(await resolveRegionalMriLearning(source,stale,f.pkg,f.study,f.overlay,f.target.id),null);
 const unknown=clone(f.catalogue);unknown.learning.entries=[];
 assert.equal(await resolveRegionalMriLearning(source,unknown,f.pkg,f.study,f.overlay,f.target.id),null);
 const valid=clone(f.catalogue);const e=valid.learning.entries.find((x:any)=>x.target.id===f.target.id);const {revision:_,...content}=e;
 assert.equal(await regionalLearningRevision(valid.atlasRevision,valid.mappingRevision,content),e.revision);
});

test('valid digests do not bypass target identity and payload detaches before awaiting its digest',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'};
 for(const patch of [{id:'unknown'},{kind:'specimen'},{label:'Borrowed label'},{side:'right'},{sourceHash:'0'.repeat(64)},{specimenRevision:'0'.repeat(64)},{relation:'parent-reference'}]){
  const c=clone(f.catalogue),e=c.learning.entries.find((e:any)=>e.target.id===f.target.id&&e.target.relation===f.target.relation);Object.assign(e.target,patch);
  const {revision:_,...content}=e;e.revision=await regionalLearningRevision(c.atlasRevision,c.mappingRevision,content);
  assert.equal(await resolveRegionalMriLearning(source,c,f.pkg,f.study,f.overlay,f.target.id),null,JSON.stringify(patch));
 }
 const c=clone(f.catalogue),entry=c.learning.entries.find((e:any)=>e.target.id===f.target.id&&e.target.relation===f.target.relation),original=entry.topics[0].body;
 const pending=resolveRegionalMriLearning(source,c,f.pkg,f.study,f.overlay,f.target.id);entry.topics[0].body='Altered during digest';source.revision='0'.repeat(64);
 const result=await pending;assert(result);assert.equal(result.entry.topics[0].body,original);assert(result.key.includes(f.revision));assert(!result.key.includes(source.revision));
});
