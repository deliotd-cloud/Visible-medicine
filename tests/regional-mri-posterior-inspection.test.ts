import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const popliteus='anat.knee.msk.popliteus_muscle';
const artery='anat.knee.nvs.popliteal_artery';
const vein='anat.knee.nvs.popliteal_vein';
const priorMetadataSha256='6a78cf1847f451e18e2452dd57ed4b3b71c7b612c602d1fd843111eedeffe627';
const apiPromise=build({stdin:{contents:[
  "export * from './lib/regional-mri-package';",
  "export * from './lib/regional-mri-guided-study';",
  "export {regionalMriFocusSlice} from './lib/regional-mri-render';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'}).then(result=>
  import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64')));
const asset=(bytes:ArrayBuffer)=>({size:bytes.byteLength,async arrayBuffer(){return bytes.slice(0)}});

async function fixture(region='knee'){
  const api=await apiPromise;
  const imageA=Uint8Array.from({length:27},(_,index)=>index+1).buffer;
  const imageB=Uint8Array.from({length:27},(_,index)=>index+31).buffer;
  const hashA=sha(new Uint8Array(imageA)),hashB=sha(new Uint8Array(imageB));
  const grid={shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
  const annotation=(id:string,anatomyId:string,seriesId:string,imageHash:string,
    status:'accepted-scoped'|'provisional'|'deferred'='accepted-scoped',geometryKind:'points'|'none'='points',side:'left'|'right'='left')=>({
    id,anatomyId,label:id,seriesId,sourceImageSha256:imageHash,laterality:side,coverage:'partial',
    review:{status,revision:'c'.repeat(64),scope:'Synthetic current-sequence extent only'},
    geometry:geometryKind==='none'?{kind:'none'}:{kind:'points',points_ras_mm:[[1,2,1]]},
  });
  const a=(id:string,concept:string,status:'accepted-scoped'|'provisional'|'deferred'='accepted-scoped',geometry:'points'|'none'='points',side:'left'|'right'='left')=>
    annotation(id,concept,'native',hashA,status,geometry,side);
  const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region,laterality:'bilateral',
    coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
      {id:'native',label:'Synthetic native knee sequence',image:{...grid,file:'native.raw',sha256:hashA,dtype:'uint8'},annotations:[
        a('popliteus-left-a',popliteus),a('popliteus-left-b',popliteus),a('popliteus-right',popliteus,'accepted-scoped','points','right'),
        a('artery-provisional',artery,'provisional'),a('artery-deferred',artery,'deferred','none'),
        a('artery-no-geometry',artery,'accepted-scoped','none'),
        a('vein-left',vein),a('vein-right',vein,'accepted-scoped','points','right'),
        a('popliteal-branch','anat.knee.nvs.popliteal_artery_branch'),
      ]},
      {id:'other',label:'Synthetic other knee sequence',image:{...grid,file:'other.raw',sha256:hashB,dtype:'uint8'},annotations:[
        annotation('artery-other',artery,'other',hashB),annotation('vein-other',vein,'other',hashB),
      ]},
    ]};
  const bytes=new TextEncoder().encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=sha(new Uint8Array(bytes));
  const pkg=await api.openRegionalMriPackage(bytes,new Map([['manifest.json',asset(bytes)],['native.raw',asset(imageA)],['other.raw',asset(imageB)]]),revision);
  const study=await api.loadRegionalMriSeries(pkg,'native'),other=await api.loadRegionalMriSeries(pkg,'other');
  const guides=api.regionalMriGuides(pkg,study),guide=guides.find((entry:any)=>entry.id==='posterior-knee');
  if(region==='knee')assert(guide);
  return {api,pkg,study,other,guides,guide,revision,manifest};
}

test('fifth posterior guide has exact three slots and content-bound revision while four older guides remain byte-exact',async()=>{
  const f=await fixture(),guide=f.guide;
  assert.equal(f.guides.length,5);
  assert.deepEqual(f.guides.map((entry:any)=>entry.id),['cruciate-ligaments','collateral-ligaments','menisci','extensor-mechanism','posterior-knee']);
  const prior=f.guides.slice(0,4).map(({id,title,revision,steps}:any)=>({id,title,revision,
    steps:steps.map(({anatomyId,title,caption,source}:any)=>({anatomyId,title,caption,source}))}));
  assert.equal(sha(JSON.stringify(prior)),priorMetadataSha256);
  assert.equal(guide.title,'Posterior knee: popliteus and vessels');
  assert.deepEqual(guide.steps.map((step:any)=>step.anatomyId),[popliteus,artery,vein]);
  const content={id:guide.id,title:guide.title,steps:guide.steps.map(({anatomyId,title,caption,source}:any)=>({anatomyId,title,caption,source}))};
  assert.match(f.api.POSTERIOR_GUIDE_REVISION,/^knee-posterior-guided-inspection-20261014-v1:[a-f0-9]{64}$/);
  assert.equal(f.api.POSTERIOR_GUIDE_REVISION,`knee-posterior-guided-inspection-20261014-v1:${sha(JSON.stringify(content))}`);
  assert.equal(guide.revision,f.api.POSTERIOR_GUIDE_REVISION);
  assert.equal(guide.sourceRevision,f.revision);assert.equal(guide.sequenceId,'native');assert.equal(guide.imageSha256,f.study.series.image.sha256);
  assert(Object.isFrozen(f.guides));assert(Object.isFrozen(guide));assert(Object.isFrozen(guide.steps));
  for(const step of guide.steps){assert(Object.isFrozen(step));assert(Object.isFrozen(step.candidates));assert(Object.isFrozen(step.source));}
  assert.deepEqual(guide.steps.map((step:any)=>step.source.href),[
    'https://pubmed.ncbi.nlm.nih.gov/33594009/',
    'https://pubmed.ncbi.nlm.nih.gov/19418007/',
    'https://pubmed.ncbi.nlm.nih.gov/19418007/',
  ]);
  assert.match(guide.steps[0].caption,/does not establish its complete attachments/);
  assert.match(guide.steps[0].caption,/not registered patient anatomy/);
  assert.match(guide.steps[1].caption,/does not establish a complete lumen, branching, flow, patency, compression or a diagnosis/);
  assert.match(guide.steps[2].caption,/does not establish full drainage, patency, thrombosis or registered 3D correspondence/);
  assert.equal(f.pkg.manifest.registration,'none');
});

test('posterior slots retain only current-sequence exact concepts and require an explicit accepted geometric variant',async()=>{
  const f=await fixture(),g=f.guide,choose=(index:number,id:string)=>f.api.regionalMriGuideAnnotation(f.pkg,f.study,g,index,id);
  assert.deepEqual(g.steps.map((step:any)=>step.candidates.map((candidate:any)=>candidate.id)),[
    ['popliteus-left-a','popliteus-left-b','popliteus-right'],
    ['artery-provisional','artery-deferred','artery-no-geometry'],
    ['vein-left','vein-right'],
  ]);
  assert.strictEqual(choose(0,'popliteus-left-b'),f.study.series.annotations[1]);
  assert.strictEqual(choose(0,'popliteus-left-a'),f.study.series.annotations[0]);
  assert.strictEqual(choose(0,'popliteus-right'),f.study.series.annotations[2],
    'Guide annotation choice does not impose the downstream same-side body handoff rule');
  assert.strictEqual(choose(2,'vein-right'),f.study.series.annotations[7]);
  for(const id of ['artery-provisional','artery-deferred','artery-no-geometry','artery-other','popliteal-branch','vein-left'])
    assert.equal(choose(1,id),null,id);
  for(const [index,id] of [[0,'vein-left'],[2,'popliteus-left-a'],[2,'vein-other'],[0,'']] as const)
    assert.equal(choose(index,id),null,`No first-candidate, wrong-slot or other-sequence fallback: ${id}`);
  assert.deepEqual(f.api.regionalMriGuides(f.pkg,f.other)[4].steps.map((step:any)=>step.candidates.map((candidate:any)=>candidate.id)),
    [[],['artery-other'],['vein-other']]);
  assert.equal(f.pkg.manifest.series[0].annotations[3].review.status,'provisional');
});

test('actual package, loaded sequence, guide object and slot index jointly own posterior selections',async()=>{
  const f=await fixture(),foreign=await fixture(),g=f.guide;
  const choose=(pkg:any,study:any,guide:any,index:any,id='popliteus-left-a')=>f.api.regionalMriGuideAnnotation(pkg,study,guide,index,id);
  assert.strictEqual(choose(f.pkg,f.study,g,0),f.study.series.annotations[0]);
  assert.equal(choose(foreign.pkg,f.study,g,0),null);
  assert.equal(choose(f.pkg,foreign.study,g,0),null);
  assert.equal(choose(f.pkg,{...f.study},g,0),null);
  assert.equal(choose({...f.pkg},f.study,g,0),null);
  assert.equal(choose(f.pkg,f.study,{...g},0),null);
  assert.equal(choose(f.pkg,f.other,g,0),null);
  for(const index of [-1,1,2,3,0.5,NaN,Infinity])assert.equal(choose(f.pkg,f.study,g,index),null,String(index));
  assert.throws(()=>f.api.regionalMriGuides({...f.pkg},f.study));
  assert.throws(()=>f.api.regionalMriGuides(f.pkg,{...f.study}));
});

test('explicit posterior geometric selection loads and focuses in its native plane; non-knee package has no guides',async()=>{
  const f=await fixture(),selected=f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,2,'vein-left');assert(selected);
  const overlay=await f.api.loadRegionalMriAnnotation(f.pkg,f.study,selected);
  assert.strictEqual(overlay.annotation,selected);assert.equal(overlay.purpose,'scoped-display');
  for(const plane of ['axial','coronal','sagittal'])
    assert.equal(f.api.regionalMriFocusSlice(f.study,overlay,plane),[1,2,1][f.study.geometry.views[plane].fixedAxisIJK]);
  assert.equal(f.api.regionalMriGuideAnnotation(f.pkg,f.study,f.guide,1,'artery-provisional'),null);
  const leg=await fixture('leg');assert.deepEqual(leg.guides,[]);
});
