import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
const apiPromise=build({stdin:{contents:"export * from './lib/regional-mri-package'; export * from './lib/regional-mri-structure-check';",resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,format:'esm',platform:'node'}).then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64')));
const asset=(bytes:Uint8Array)=>({size:bytes.byteLength,async arrayBuffer(){return bytes.slice().buffer}});

async function fixture(){
  const api=await apiPromise,image=Uint8Array.from({length:27},(_,i)=>i),imageHash=sha(image);
  const other=Uint8Array.from({length:27},(_,i)=>i+1),otherHash=sha(other);
  const mask=new Uint8Array(27);mask[13]=1;const maskHash=sha(mask);
  const empty=new Uint8Array(27),emptyHash=sha(empty);
  const grid={shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
  const annotation=(id:string,anatomyId:string,label:string,status='accepted-scoped',kind='points',point=[1,1,1],seriesId='native',sourceImageSha256=imageHash):any=>({
    id,anatomyId,label,seriesId,sourceImageSha256,laterality:'left',coverage:'partial',review:{status,revision:'a'.repeat(64),scope:'Synthetic local extent'},
    geometry:kind==='none'?{kind:'none'}:kind==='points'?{kind:'points',points_ras_mm:[point]}:{kind:'mask',file:kind==='empty'?'empty.raw':kind==='derived'?'derived.raw':'mask.raw',
      sha256:kind==='empty'?emptyHash:maskHash,shape_kji:[3,3,3],offset_kji:[0,0,0],grid,gridKind:kind==='derived'?'derived-source-ras':'source-native',mappingRevision:'b'.repeat(64)}
  });
  const annotations=[
    annotation('target-a','concept:target','Target label'),annotation('target-b','concept:target','Target variant'),
    annotation('one','concept:one','First choice'),annotation('one-b','concept:one','First variant'),
    annotation('two','concept:two','Second choice','accepted-scoped','mask'),
    annotation('three','concept:three','Third choice','accepted-scoped','derived'),
    annotation('provisional','concept:provisional','Provisional','provisional'),
    annotation('deferred','concept:deferred','Deferred','deferred','none'),
    annotation('no-geometry','concept:none','No geometry','accepted-scoped','none'),
    annotation('outside','concept:outside','Outside','accepted-scoped','points',[4,1,1]),
    annotation('empty','concept:empty','Empty','accepted-scoped','empty'),
  ];
  const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',coordinateSystem:'per-series-RAS-mm',
    registration:'none',release:'local-private-draft',series:[
      {id:'native',label:'Native',image:{...grid,file:'native.raw',sha256:imageHash,dtype:'uint8'},annotations},
      {id:'other',label:'Other',image:{...grid,file:'other.raw',sha256:otherHash,dtype:'uint8'},annotations:[
        annotation('other-one','concept:other-one','Other one','accepted-scoped','points',[1,1,1],'other',otherHash),
        annotation('other-two','concept:other-two','Other two','accepted-scoped','points',[1,1,1],'other',otherHash)]},
    ]};
  const bytes=new TextEncoder().encode(JSON.stringify(manifest)),revision=sha(bytes);
  const files=new Map([['manifest.json',asset(bytes)],['native.raw',asset(image)],['other.raw',asset(other)],['mask.raw',asset(mask)],['derived.raw',asset(mask)],['empty.raw',asset(empty)]]);
  const pkg=await api.openRegionalMriPackage(bytes.buffer,files,revision),study=await api.loadRegionalMriSeries(pkg,'native'),otherStudy=await api.loadRegionalMriSeries(pkg,'other');
  const load=(id:string,inspectProvisional=false)=>api.loadRegionalMriAnnotation(pkg,study,study.series.annotations.find((a:any)=>a.id===id),undefined,inspectProvisional?{inspectProvisional:true}:undefined);
  return {api,pkg,study,otherStudy,load,manifest};
}

test('actual loader yields immutable four-choice identification and exact feedback',async()=>{
  const f=await fixture(),overlay=await f.load('target-a'),check=f.api.createRegionalMriStructureCheck(f.pkg,f.study,overlay);
  assert(check);assert.equal(check.revision,'regional-mri-structure-check-20261014-v1');
  assert.match(check.prompt,/saved highlighted annotation/);assert.equal(check.options.length,4);
  assert(Object.isFrozen(check));assert(Object.isFrozen(check.options));assert(check.options.every((o:any)=>Object.isFrozen(o)));
  assert.equal(new Set(check.options.map((o:any)=>o.label)).size,4);
  assert(check.options.some((o:any)=>o.label==='Target label'));
  for(const label of ['Target variant','First variant','Provisional','Deferred','No geometry','Other one'])
    assert(!check.options.some((o:any)=>o.label===label),label);
  assert.equal(JSON.stringify(check).includes('answer'),false);
  const answer=f.api.revealRegionalMriStructureCheck(check,f.pkg,f.study,overlay);assert.equal(answer.label,'Target label');
  assert.deepEqual(JSON.parse(check.key),[check.revision,f.pkg.revision,f.study.series.id,f.study.series.image.sha256,
    overlay.annotation.id,overlay.annotation.review.revision]);
  assert.equal(f.api.gradeRegionalMriStructureCheck(check,f.pkg,f.study,overlay,answer.id),'correct');
  assert.equal(f.api.gradeRegionalMriStructureCheck(check,f.pkg,f.study,overlay,check.options.find((o:any)=>o.id!==answer.id).id),'incorrect');
  assert.equal(f.api.gradeRegionalMriStructureCheck(check,f.pkg,f.study,overlay,'unknown'),'unavailable');
  assert.equal(f.api.gradeRegionalMriStructureCheck({...check},f.pkg,f.study,overlay,answer.id),'unavailable');
  assert.equal(f.api.revealRegionalMriStructureCheck(structuredClone(check),f.pkg,f.study,overlay),null);
  assert.throws(()=>{check.options[0].label='Tampered';},TypeError);
  assert.equal(f.manifest.series[0].annotations[0].label,'Target label');
});

test('deterministic rotation allows varied answer positions across explicit verified selections',async()=>{
  const f=await fixture(),positions=new Set<number>();
  for(const id of ['target-a','target-b','one','one-b','two','three']){
    const overlay=await f.load(id),check=f.api.createRegionalMriStructureCheck(f.pkg,f.study,overlay);assert(check,id);
    const answer=f.api.revealRegionalMriStructureCheck(check,f.pkg,f.study,overlay);assert(answer);
    positions.add(check.options.findIndex((option:any)=>option.id===answer.id));
    assert.equal(f.api.createRegionalMriStructureCheck(f.pkg,f.study,overlay).key,check.key,'same source selection has a stable key');
  }
  assert(positions.size>1,'selected answers must occupy more than one position');
  assert(positions.has(0),'first position must remain possible');
  assert([...positions].some(position=>position>0),'later positions must remain possible');
});

test('target variant is exact; duplicate concept and label cannot become distractors',async()=>{
  const f=await fixture(),variant=await f.load('target-b'),check=f.api.createRegionalMriStructureCheck(f.pkg,f.study,variant);
  assert(check);assert.equal(f.api.revealRegionalMriStructureCheck(check,f.pkg,f.study,variant).label,'Target variant');
  assert(!check.options.some((o:any)=>o.label==='Target label'));
  const selected=await f.load('target-a');
  const forged={...selected,annotation:{...selected.annotation,label:'Different'}};
  assert.equal(f.api.createRegionalMriStructureCheck(f.pkg,f.study,forged),null);
  const alternate=await f.load('target-b');
  assert.equal(f.api.gradeRegionalMriStructureCheck(check,f.pkg,f.study,alternate,'choice-1'),'unavailable');
  assert.equal(f.api.revealRegionalMriStructureCheck(check,f.pkg,f.study,selected),null);
});

test('provisional, empty, outside, geometry-none and wrong ownership refuse checks',async()=>{
  const f=await fixture(),target=await f.load('target-a'),check=f.api.createRegionalMriStructureCheck(f.pkg,f.study,target);assert(check);
  for(const id of ['provisional','outside','empty']){
    const overlay=await f.load(id,id==='provisional');assert.equal(f.api.createRegionalMriStructureCheck(f.pkg,f.study,overlay),null,id);
  }
  for(const id of ['deferred','no-geometry'])await assert.rejects(f.load(id),/No display geometry/);
  const otherPkg=(await fixture()).pkg;
  for(const [pkg,study,overlay] of [[otherPkg,f.study,target],[f.pkg,f.otherStudy,target],[f.pkg,{...f.study},target],[f.pkg,f.study,{...target}],
    [f.pkg,f.study,{...target,annotation:{...target.annotation}}]] as any[]){
    assert.equal(f.api.createRegionalMriStructureCheck(pkg,study,overlay),null);
    assert.equal(f.api.gradeRegionalMriStructureCheck(check,pkg,study,overlay,'choice-1'),'unavailable');
    assert.equal(f.api.revealRegionalMriStructureCheck(check,pkg,study,overlay),null);
  }
});

test('same-sequence inventory with ambiguous target label or too few concepts refuses question',async()=>{
  const f=await fixture();
  // Loader manifest is frozen; build a separate valid synthetic package for each inventory.
  async function repack(change:(manifest:any)=>void){
    const manifest=structuredClone(f.manifest);change(manifest);
    const image=Uint8Array.from({length:27},(_,i)=>i),other=Uint8Array.from({length:27},(_,i)=>i+1),mask=new Uint8Array(27);mask[13]=1;
    const empty=new Uint8Array(27),bytes=new TextEncoder().encode(JSON.stringify(manifest));
    const available=new Map([['manifest.json',asset(bytes)],['native.raw',asset(image)],['other.raw',asset(other)],['mask.raw',asset(mask)],['derived.raw',asset(mask)],['empty.raw',asset(empty)]]);
    const used=new Set(['manifest.json',...manifest.series.map((s:any)=>s.image.file),...manifest.series.flatMap((s:any)=>s.annotations.filter((a:any)=>a.geometry.kind==='mask').map((a:any)=>a.geometry.file))]);
    const pkg=await f.api.openRegionalMriPackage(bytes.buffer,new Map([...available].filter(([path])=>used.has(path))),sha(bytes));
    const study=await f.api.loadRegionalMriSeries(pkg,'native');
    const overlay=await f.api.loadRegionalMriAnnotation(pkg,study,study.series.annotations[0]);
    return f.api.createRegionalMriStructureCheck(pkg,study,overlay);
  }
  assert.equal(await repack(m=>{m.series[0].annotations.find((a:any)=>a.id==='one').label='Target label';}),null);
  assert.equal(await repack(m=>{m.series[0].annotations=m.series[0].annotations.filter((a:any)=>['target-a','target-b','one','one-b','provisional','deferred','no-geometry'].includes(a.id));}),null);
});
