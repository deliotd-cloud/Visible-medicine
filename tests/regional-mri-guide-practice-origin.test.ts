import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const apiPromise=build({stdin:{contents:"export * from './lib/regional-mri-package'; export * from './lib/regional-mri-guided-study'; export * from './lib/regional-mri-guide-practice-origin';",
  resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'})
  .then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64')));

async function fixture(change:{review?:string;image?:number;region?:string}={}){
  const api=await apiPromise,image=Uint8Array.from({length:27},(_,i)=>i+(change.image??0)),imageHash=sha(image);
  let reads=0;
  const asset=(bytes:Uint8Array)=>({size:bytes.byteLength,async arrayBuffer(){reads++;return bytes.slice().buffer;}});
  const grid={shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
  const annotation=(id:string,anatomyId:string,status='accepted-scoped',seriesId='native')=>({id,anatomyId,label:`Synthetic ${id}`,
    seriesId,sourceImageSha256:imageHash,laterality:'left',coverage:'partial',
    review:{status,revision:change.review??'a'.repeat(64),scope:'Synthetic teaching extent'},
    geometry:{kind:'points',points_ras_mm:[[1,1,1]]}});
  const acl='anat.knee.lig.anterior_cruciate_ligament',pcl='anat.knee.lig.posterior_cruciate_ligament';
  const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:change.region??'knee',laterality:'left',
    coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
      {id:'native',label:'Synthetic native',image:{...grid,file:'native.raw',sha256:imageHash,dtype:'uint8'},annotations:[
        annotation('acl-a',acl),annotation('acl-b',acl),annotation('pcl-provisional',pcl,'provisional'),
        annotation('mcl','anat.knee.lig.medial_collateral_ligament')]},
      {id:'other',label:'Synthetic other',image:{...grid,file:'other.raw',sha256:imageHash,dtype:'uint8'},annotations:[annotation('other-acl',acl,'accepted-scoped','other')]},
    ]};
  const bytes=new TextEncoder().encode(JSON.stringify(manifest));
  const files=new Map([['manifest.json',asset(bytes)],['native.raw',asset(image)],['other.raw',asset(image)]]);
  const pkg=await api.openRegionalMriPackage(bytes.buffer,files,sha(bytes)),study=await api.loadRegionalMriSeries(pkg,'native');
  const otherStudy=await api.loadRegionalMriSeries(pkg,'other'),guides=api.regionalMriGuides(pkg,study),guide=guides[0];
  const source={revision:pkg.revision,region:pkg.manifest.region};
  const load=(id='acl-b')=>api.loadRegionalMriAnnotation(pkg,study,study.series.annotations.find((a:any)=>a.id===id),undefined,
    id==='pcl-provisional'?{inspectProvisional:true}:undefined);
  const overlay=await load();
  const capture=(position:any={guide,index:0},selected:any=overlay,s:any=source,p:any=pkg,st:any=study)=>
    api.createRegionalMriGuidePracticeOrigin(s,p,st,selected,position);
  const resolve=(origin:any,s:any=source,p:any=pkg,st:any=study,current:any=guides)=>
    api.resolveRegionalMriGuidePracticeOrigin(origin,s,p,st,current);
  return {api,pkg,study,otherStudy,guides,guide,source,load,overlay,capture,resolve,reads:()=>reads};
}

test('real loader capture is opaque, frozen, repeatable and does not expose teaching or answers',async()=>{
  const f=await fixture(),before=f.reads(),origin=f.capture();
  assert(origin);assert(Object.isFrozen(origin));assert.deepEqual(Reflect.ownKeys(origin),[]);
  assert.equal(JSON.stringify(origin),'{}');assert.equal(JSON.stringify({...origin}),'{}');
  for(let i=0;i<3;i++){
    const result=f.resolve(origin);
    assert(Object.isFrozen(result));assert.strictEqual(result.guide,f.guide);assert.equal(result.index,0);
    assert.strictEqual(result.annotation,f.overlay.annotation);
  }
  assert.equal(f.reads(),before,'capture and resolution must never read/load assets');
  assert.throws(()=>Object.assign(origin,{answer:'forged'}),TypeError);
});

test('an explicit second variant survives multiple candidates without an automatic alternate',async()=>{
  const f=await fixture(),origin=f.capture(),first=await f.load('acl-a');
  assert.equal(f.guide.steps[0].candidates.length,2);
  assert.equal(f.resolve(origin).annotation.id,'acl-b');
  assert.equal(f.resolve(f.capture({guide:f.guide,index:0},first)).annotation.id,'acl-a');
  assert.equal(f.resolve(origin,f.source,f.pkg,f.study,[]),null);
  assert.equal(f.resolve(origin).annotation.id,'acl-b');
});

test('tokens cannot be forged, spread, serialized, prototype-cloned or copied',async()=>{
  const f=await fixture(),origin=f.capture();
  for(const fake of [null,undefined,false,1,'origin',{},Object.freeze({}),{...origin},JSON.parse(JSON.stringify(origin)),
    Object.create(origin),{guide:f.guide,index:0,annotation:f.overlay.annotation}])assert.equal(f.resolve(fake),null);
});

test('capture requires a real guide, exact step and explicit annotation membership',async()=>{
  const f=await fixture();
  for(const position of [null,{guide:f.guide,index:-1},{guide:f.guide,index:0.5},{guide:f.guide,index:NaN},
    {guide:f.guide,index:99},{guide:f.guide,index:1},{guide:f.guides[1],index:0},
    {guide:{...f.guide},index:0},{guide:{...f.guide,revision:'changed'},index:0},
    {guide:{...f.guide,steps:[{...f.guide.steps[0],candidates:[f.overlay.annotation]}]},index:0}])assert.equal(f.capture(position),null);
  assert.equal(f.capture({guide:f.guide,index:0},await f.load('mcl')),null);
  assert.equal(f.capture({guide:f.guide,index:1},await f.load('pcl-provisional')),null);
});

test('capture rejects loader clones, foreign packages/sequences and provisional display',async()=>{
  const f=await fixture(),foreign=await fixture(),position={guide:f.guide,index:0};
  for(const [pkg,study,overlay] of [[{...f.pkg},f.study,f.overlay],[foreign.pkg,f.study,f.overlay],
    [f.pkg,{...f.study},f.overlay],[f.pkg,f.otherStudy,f.overlay],[f.pkg,f.study,{...f.overlay}],
    [f.pkg,f.study,{...f.overlay,annotation:{...f.overlay.annotation}}],[f.pkg,f.study,foreign.overlay],
    [f.pkg,f.study,{...f.overlay,purpose:'provisional-inspection'}]])assert.equal(f.capture(position,overlay,f.source,pkg,study),null);
});

test('source metadata is copied and current source revision/region must still match',async()=>{
  const f=await fixture(),origin=f.capture(),revision=f.source.revision;
  for(const source of [{...f.source,revision:'b'.repeat(64)},{...f.source,region:'shoulder'}, {revision:'',region:'knee'}]){
    assert.equal(f.capture({guide:f.guide,index:0},f.overlay,source),null);assert.equal(f.resolve(origin,source),null);
  }
  f.source.revision='retired';assert.equal(f.resolve(origin),null);
  assert(f.resolve(origin,{revision,region:'knee'}),'capture retained immutable source values');
  f.source.revision=revision;assert(f.resolve(origin));
});

test('resolve refuses replaced ownership and changed guide/review/image identities',async()=>{
  const f=await fixture(),origin=f.capture();
  assert.equal(f.resolve(origin,f.source,{...f.pkg}),null);
  assert.equal(f.resolve(origin,f.source,f.pkg,{...f.study}),null);
  assert.equal(f.resolve(origin,f.source,f.pkg,f.otherStudy),null);
  assert.equal(f.resolve(origin,f.source,f.pkg,f.study,f.api.regionalMriGuides(f.pkg,f.study)),null,'fresh guide objects retire the old position');
  for(const change of [{revision:'changed'},{sourceRevision:'b'.repeat(64)},{sequenceId:'other'},{imageSha256:'c'.repeat(64)},
    {steps:[f.guide.steps[1],f.guide.steps[0]]},{steps:[{...f.guide.steps[0],candidates:[{...f.overlay.annotation,review:{...f.overlay.annotation.review,revision:'c'.repeat(64)}}]}]}]){
    const changed={...f.guide,...change};
    assert.equal(f.resolve(origin,f.source,f.pkg,f.study,[changed]),null);
    assert.equal(f.capture({guide:changed,index:0}),null);
  }
  for(const changed of [await fixture({review:'b'.repeat(64)}),await fixture({image:1}),await fixture({region:'shoulder'})]){
    assert.equal(f.resolve(origin,changed.source,changed.pkg,changed.study,changed.guides),null);
  }
});

test('loader-owned source, guide, review and annotation snapshots resist in-place changes',async()=>{
  const f=await fixture(),origin=f.capture();
  for(const [object,key,value] of [[f.guide,'revision','changed'],[f.guide,'imageSha256','b'.repeat(64)],
    [f.overlay.annotation.review,'revision','b'.repeat(64)],[f.overlay.annotation.review,'status','provisional'],
    [f.overlay.annotation,'id','changed'],[f.study.series.image,'sha256','c'.repeat(64)],
    [f.guide.steps[0].candidates,'0',f.study.series.annotations[3]],[f.guide.steps,'0',f.guide.steps[1]]]){
    assert(Object.isFrozen(object));assert.throws(()=>Object.assign(object,{[key as string]:value}),TypeError);
    assert.strictEqual(f.resolve(origin).annotation,f.overlay.annotation);
  }
});
