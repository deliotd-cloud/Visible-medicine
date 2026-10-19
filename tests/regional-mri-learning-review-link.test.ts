import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {parseRegionalLearningReviewRequest,regionalLearningReviewHref} from '../lib/regional-mri-learning-review-link.ts';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {resolveRegionalMriLearning} from '../lib/regional-mri-learning.ts';

const valid={target:'vm:body:synthetic-left-patella',relation:'same-structure',atlasRevision:'a'.repeat(40),mappingRevision:'b'.repeat(64),teachingRevision:'c'.repeat(64)};
test('review requests accept only the complete bounded public reference tuple',()=>{
 const input={...valid},parsed=parseRegionalLearningReviewRequest(input);assert.deepEqual(parsed,valid);assert.notEqual(parsed,input);input.target='changed';assert.equal(parsed?.target,valid.target);
 for(const key of Object.keys(valid)){const missing={...valid} as Record<string,string>;delete missing[key];assert.equal(parseRegionalLearningReviewRequest(missing),null,key);}
 for(const patch of [{target:''},{target:'../private/scan'},{target:'x?annotation=private'},{target:'x'.repeat(241)},{target:['one','two']},{relation:'nearby-reference'},
  {atlasRevision:'A'.repeat(40)},{atlasRevision:'a'.repeat(64)},{mappingRevision:'b'.repeat(63)},{teachingRevision:'c'.repeat(65)},{source:'private-scan'},
  {return_to:'/workspace'},{target:undefined}])assert.equal(parseRegionalLearningReviewRequest({...valid,...patch}),null,JSON.stringify(patch));
 assert.equal(parseRegionalLearningReviewRequest(null as any),null);assert.equal(parseRegionalLearningReviewRequest([] as any),null);
});

test('arbitrary, borrowed and recomposed proof objects do not produce review links',()=>{
 for(const value of [null,undefined,{},valid,{entry:{target:{id:valid.target,relation:valid.relation},revision:valid.teachingRevision},atlasRevision:valid.atlasRevision,mappingRevision:valid.mappingRevision}])assert.equal(regionalLearningReviewHref(value),null);
});

const bundled=await build({stdin:{contents:`export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {buildRegionalMri3dCatalogue}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`) as any;
const enc=new TextEncoder(),sha=async(b:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),n=>n.toString(16).padStart(2,'0')).join('');
const asset=(b:ArrayBuffer):RegionalAsset=>({size:b.byteLength,async arrayBuffer(){return b.slice(0)}});
test('actual loader-owned body and specimen drafts link without any MRI context in the URL',async()=>{
 const image=new Uint8Array([2,3]).buffer,mask=new Uint8Array([1,0]).buffer,imageHash=await sha(image),maskHash=await sha(mask);
 const grid={shape_kji:[1,1,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{id:'private-synthetic-series',label:'Synthetic MRI',image:{...grid,file:'private-synthetic/image.raw',sha256:imageHash,dtype:'uint8'},annotations:[{id:'private-synthetic-annotation',anatomyId:'anat.knee.bne.patella',label:'Synthetic patella',seriesId:'private-synthetic-series',sourceImageSha256:imageHash,laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Synthetic scope'},geometry:{kind:'mask',file:'private-synthetic/mask.raw',sha256:maskHash,shape_kji:[1,1,2],offset_kji:[0,0,0],grid,gridKind:'source-native',mappingRevision:'d'.repeat(64)}}]}]};
 manifest.series[0].annotations.push({...manifest.series[0].annotations[0],id:'private-synthetic-acl',anatomyId:'anat.knee.lig.anterior_cruciate_ligament',label:'Synthetic ACL',geometry:{kind:'points',points_ras_mm:[[0,0,0]]}});
 const bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=await sha(bytes),assets=new Map([['manifest.json',asset(bytes)],['private-synthetic/image.raw',asset(image)],['private-synthetic/mask.raw',asset(mask)]]);
 const pkg=await openRegionalMriPackage(bytes,assets,revision),study=await loadRegionalMriSeries(pkg,'private-synthetic-series');
 const catalogue=await buildRegionalMri3dCatalogue({revision,region:'knee'}),kinds=new Set();
 for(const annotation of study.series.annotations){
 const overlay=await loadRegionalMriAnnotation(pkg,study,annotation),row=catalogue.entries.find((e:any)=>e.anatomyId===annotation.anatomyId&&e.sourceSide==='left');assert(row);
 for(const target of row.targets){
  kinds.add(target.kind);
  const proof=await resolveRegionalMriLearning({revision,region:'knee'},catalogue,pkg,study,overlay,target.id);assert(proof);
  assert.equal(proof.atlasRevision,catalogue.atlasRevision);assert.equal(proof.mappingRevision,catalogue.mappingRevision);
  const href=regionalLearningReviewHref(proof);assert(href);const url=new URL(href,'https://visible-medicine.invalid');
  assert.equal(url.pathname,'/workspace/atlas-review/reference-learning');assert.equal(url.origin,'https://visible-medicine.invalid');
  assert.deepEqual([...url.searchParams.keys()],Object.keys(valid));assert.equal(url.searchParams.get('target'),target.id);assert.equal(url.searchParams.get('relation'),target.relation);assert.equal(url.searchParams.get('teachingRevision'),proof.entry.revision);
  assert.deepEqual(parseRegionalLearningReviewRequest(Object.fromEntries(url.searchParams)),{target:target.id,relation:target.relation,atlasRevision:proof.atlasRevision,mappingRevision:proof.mappingRevision,teachingRevision:proof.entry.revision});
  for(const needle of [revision,imageHash,maskHash,'private-synthetic',proof.key,'shape_kji','offset_kji','points_ras_mm'])assert(!href.includes(needle),needle);
  assert.equal(regionalLearningReviewHref({...proof}),null);assert.equal(regionalLearningReviewHref(structuredClone(proof)),null);
 }
 }
 assert.deepEqual(kinds,new Set(['body','specimen']));
});
