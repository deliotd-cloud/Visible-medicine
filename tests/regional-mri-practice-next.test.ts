import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const apiPromise=build({stdin:{contents:"export * from './lib/regional-mri-package'; export * from './lib/regional-mri-practice-next';",
  resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'})
  .then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64')));
const asset=(bytes:Uint8Array)=>({size:bytes.byteLength,async arrayBuffer(){return bytes.slice().buffer;}});

async function fixture(){
  const api=await apiPromise,image=Uint8Array.from({length:27},(_,i)=>i),imageHash=sha(image);
  const other=Uint8Array.from({length:27},(_,i)=>i+1),otherHash=sha(other);
  const filled=new Uint8Array(27);filled[13]=1;
  const empty=new Uint8Array(27);
  const grid={shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
  const files=new Map<string,ReturnType<typeof asset>>([['native.raw',asset(image)],['other.raw',asset(other)]]);
  function annotation(id:string,concept:string,label:string,kind:'mask'|'points'|'curve'|'none'='points',
    status:'accepted-scoped'|'provisional'|'deferred'='accepted-scoped',seriesId='native',sourceHash=imageHash,
    point=[1,1,1],maskBytes=filled){
    const file=`${id}.raw`;
    if(kind==='mask')files.set(file,asset(maskBytes));
    return {id,anatomyId:concept,label,seriesId,sourceImageSha256:sourceHash,laterality:'left',coverage:'partial',
      review:{status,revision:'a'.repeat(64),scope:'Synthetic teaching extent'},
      geometry:kind==='mask'?{kind,file,sha256:sha(maskBytes),shape_kji:[3,3,3],offset_kji:[0,0,0],grid,
        gridKind:'source-native',mappingRevision:'b'.repeat(64)}:kind==='none'?{kind}:
        {kind,points_ras_mm:kind==='curve'?[point,[1,1,2]]:[point]}};
  }
  const annotations=[
    annotation('first','concept:first','First','mask'),
    annotation('point','concept:point','Point'),
    annotation('variant-a','concept:variant','Variant A'),
    annotation('variant-b','CONCEPT:VARIANT','Variant B','mask','provisional'),
    annotation('mask','concept:mask','Mask','mask'),
    annotation('duplicate-label-a','concept:duplicate-a','Shared'),
    annotation('duplicate-label-b','concept:duplicate-b','Ｓｈａｒｅｄ','mask'),
    annotation('provisional','concept:provisional','Provisional','mask','provisional'),
    annotation('deferred','concept:deferred','Deferred','none','deferred'),
    annotation('none','concept:none','None','none'),
    annotation('outside','concept:outside','Outside','points','accepted-scoped','native',imageHash,[7,1,1]),
    annotation('empty','concept:empty','Empty','mask','accepted-scoped','native',imageHash,[1,1,1],empty),
    annotation('curve','concept:curve','Curve','curve'),
    annotation('last','concept:last','Last','mask'),
  ];
  const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',
    coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
      {id:'native',label:'Native',image:{...grid,file:'native.raw',sha256:imageHash,dtype:'uint8'},annotations},
      {id:'other',label:'Other',image:{...grid,file:'other.raw',sha256:otherHash,dtype:'uint8'},annotations:[
        annotation('other-a','concept:other-a','Other A','points','accepted-scoped','other',otherHash),
        annotation('other-b','concept:other-b','Other B','points','accepted-scoped','other',otherHash)]},
    ]};
  const bytes=new TextEncoder().encode(JSON.stringify(manifest));files.set('manifest.json',asset(bytes));
  const pkg=await api.openRegionalMriPackage(bytes.buffer,files,sha(bytes));
  const study=await api.loadRegionalMriSeries(pkg,'native'),otherStudy=await api.loadRegionalMriSeries(pkg,'other');
  const load=(id:string,inspectProvisional=false)=>api.loadRegionalMriAnnotation(pkg,study,
    study.series.annotations.find((a:any)=>a.id===id),undefined,inspectProvisional?{inspectProvisional:true}:undefined);
  return {api,pkg,study,otherStudy,load,manifest};
}

test('source-owned candidates follow manifest order after current, wrap, and stay detached and frozen',async()=>{
  const f=await fixture(),overlay=await f.load('first');
  const result=f.api.regionalMriNextPracticeCandidates(f.pkg,f.study,overlay,'name');
  assert.deepEqual(result.map((a:any)=>a.id),['point','mask','outside','empty','curve','last']);
  assert(Object.isFrozen(result));assert.notEqual(result,f.study.series.annotations);
  assert.strictEqual(result[0],f.study.series.annotations[1]);
  assert.throws(()=>result.push(result[0]),TypeError);
  const afterLast=f.api.regionalMriNextPracticeCandidates(f.pkg,f.study,await f.load('last'),'name');
  assert.deepEqual(afterLast.map((a:any)=>a.id),['first','point','mask','outside','empty','curve']);
  assert.equal(f.manifest.series[0].annotations[0].label,'First');
});

test('locate accepts only mask metadata and valid loaded current extent',async()=>{
  const f=await fixture();
  const result=f.api.regionalMriNextPracticeCandidates(f.pkg,f.study,await f.load('first'),'locate');
  assert.deepEqual(result.map((a:any)=>a.id),['mask','empty','last']);
  assert.equal(f.api.regionalMriNextPracticeCandidates(f.pkg,f.study,await f.load('point'),'locate').length,0);
  assert.equal(f.api.regionalMriNextPracticeCandidates(f.pkg,f.study,await f.load('empty'),'locate').length,0);
  assert.equal(f.api.regionalMriNextPracticeCandidates(f.pkg,f.study,await f.load('outside'),'name').length,0);
  assert.equal(result.some((a:any)=>a.id==='empty'),true,'metadata eligibility does not prove nonempty loaded geometry');
  assert.equal(f.api.regionalMriNextPracticeCandidates(f.pkg,f.study,await f.load('first'),'unknown' as any).length,0);
});

test('loader ownership, source scope, provisional mode and clones refuse selection',async()=>{
  const f=await fixture(),overlay=await f.load('first'),foreign=(await fixture()).pkg;
  for(const [pkg,study,selected] of [[foreign,f.study,overlay],[f.pkg,f.otherStudy,overlay],
    [f.pkg,{...f.study},overlay],[f.pkg,f.study,{...overlay}],
    [f.pkg,f.study,{...overlay,annotation:{...overlay.annotation}}]] as any[]){
    const answer=f.api.regionalMriNextPracticeCandidates(pkg,study,selected,'name');
    assert.deepEqual(answer,[]);assert(Object.isFrozen(answer));
  }
  assert.deepEqual(f.api.regionalMriNextPracticeCandidates(f.pkg,f.study,await f.load('provisional',true),'name'),[]);
  await assert.rejects(f.load('deferred'),/No display geometry/);
  await assert.rejects(f.load('none'),/No display geometry/);
  assert.deepEqual(f.api.regionalMriNextPracticeCandidates(f.pkg,f.study,overlay,'locate').map((a:any)=>a.id),['mask','empty','last']);
});
