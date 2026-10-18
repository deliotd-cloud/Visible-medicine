import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation} from '../lib/regional-mri-package.ts';
import {regionalMriFrame} from '../lib/regional-mri-render.ts';
import {createRegionalMriLocationCheck,gradeRegionalMriLocationCheck,revealRegionalMriLocationCheck,
  createRegionalMriStructureCheck} from '../lib/regional-mri-structure-check.ts';

const sha=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex');
const asset=(v:Uint8Array)=>({size:v.byteLength,async arrayBuffer(){return v.slice().buffer;}});
async function fixture(ambiguous=false){
  const image=Uint8Array.from({length:27},(_,i)=>i),mask=new Uint8Array(27),empty=new Uint8Array(27);mask[13]=1;
  const grid={shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
  const annotation=(id:string,concept:string,label:string,kind='mask',status='accepted-scoped',source=sha(image))=>({
    id,anatomyId:concept,label,seriesId:'s',sourceImageSha256:source,laterality:'left',coverage:'partial',
    review:{status,revision:'a'.repeat(64),scope:'Synthetic'},geometry:kind==='points'?{kind:'points',points_ras_mm:[[1,1,1]]}:
      {kind:'mask',file:`${id}.raw`,sha256:kind==='empty'?sha(empty):sha(mask),shape_kji:[3,3,3],offset_kji:[0,0,0],
        grid,gridKind:'source-native',mappingRevision:'b'.repeat(64)}});
  const annotations=[annotation('a','concept:a','Target'),annotation('variant','concept:a','Variant'),
    annotation('points','concept:points','Points','points','provisional'),annotation('provisional','concept:provisional','Provisional','mask','provisional'),
    annotation('empty','concept:empty','Empty','empty')];
  if(ambiguous)annotations.push(annotation('ambiguous','concept:other','Target'));
  const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',
    coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
      {id:'s',label:'S',image:{...grid,file:'image.raw',dtype:'uint8',sha256:sha(image)},annotations}]};
  const bytes=new TextEncoder().encode(JSON.stringify(manifest));
  const files=new Map([['image.raw',asset(image)],...annotations.filter(a=>a.geometry.kind==='mask').map(a=>[a.geometry.file,asset(a.id==='empty'?empty:mask)] as [string,ReturnType<typeof asset>])]);
  const pkg=await openRegionalMriPackage(bytes.buffer,files,sha(bytes));
  const study=await loadRegionalMriSeries(pkg,'s');
  const load=(id:string,inspect=false)=>loadRegionalMriAnnotation(pkg,study,study.series.annotations.find(a=>a.id===id)!,undefined,inspect?{inspectProvisional:true}:undefined);
  return {pkg,study,load};
}

test('location is independent of naming choice count and grades the exact displayed extent',async()=>{
  const f=await fixture(),overlay=await f.load('a');
  assert.equal(createRegionalMriStructureCheck(f.pkg,f.study,overlay),null);
  const check=createRegionalMriLocationCheck(f.pkg,f.study,overlay);assert(check);
  assert.equal(check.revision,'regional-mri-location-check-20261014-v1');
  assert(Object.isFrozen(check));assert.equal(check.targetLabel,'Target');assert.match(check.prompt,/Locate the saved target extent/);
  const frame=regionalMriFrame(f.study,overlay,'axial',1,{center:13,width:26,opacity:0});
  assert.equal(gradeRegionalMriLocationCheck(check,f.pkg,f.study,overlay,frame,'axial',1,1,1),'correct');
  assert.equal(gradeRegionalMriLocationCheck(check,f.pkg,f.study,overlay,frame,'axial',1,0,0),'incorrect');
  assert.equal(gradeRegionalMriLocationCheck(check,f.pkg,f.study,overlay,frame,'axial',0,1,1),'unavailable');
  assert.equal(gradeRegionalMriLocationCheck(check,f.pkg,f.study,overlay,frame,'axial',1,3,1),'unavailable');
  assert.equal(revealRegionalMriLocationCheck(check,f.pkg,f.study,overlay),'Target');
});

test('location proof refuses copies, other variants and source contexts',async()=>{
  const f=await fixture(),overlay=await f.load('a'),variant=await f.load('variant');
  const check=createRegionalMriLocationCheck(f.pkg,f.study,overlay);assert(check);
  const frame=regionalMriFrame(f.study,overlay,'axial',1,{center:13,width:26,opacity:.7});
  assert.equal(gradeRegionalMriLocationCheck({...check},f.pkg,f.study,overlay,frame,'axial',1,1,1),'unavailable');
  assert.equal(revealRegionalMriLocationCheck(structuredClone(check),f.pkg,f.study,overlay),null);
  assert.equal(gradeRegionalMriLocationCheck(check,f.pkg,f.study,variant,frame,'axial',1,1,1),'unavailable');
  assert.equal(revealRegionalMriLocationCheck(check,f.pkg,f.study,variant),null);
  const other=await fixture();
  assert.equal(gradeRegionalMriLocationCheck(check,other.pkg,f.study,overlay,frame,'axial',1,1,1),'unavailable');
  assert.equal(gradeRegionalMriLocationCheck(check,f.pkg,{...f.study},overlay,frame,'axial',1,1,1),'unavailable');
  assert.equal(gradeRegionalMriLocationCheck(check,f.pkg,f.study,{...overlay},frame,'axial',1,1,1),'unavailable');
  assert.equal(gradeRegionalMriLocationCheck(check,f.pkg,f.study,overlay,{...frame},'axial',1,1,1),'unavailable');
});

test('ambiguous label, provisional, empty and non-mask targets do not create checks',async()=>{
  const f=await fixture();
  for(const id of ['points','provisional','empty'] as const){
    const overlay=await f.load(id,id==='provisional'||id==='points');
    assert.equal(createRegionalMriLocationCheck(f.pkg,f.study,overlay),null,id);
  }
  const ambiguous=await fixture(true),target=await ambiguous.load('a');
  assert.equal(createRegionalMriLocationCheck(ambiguous.pkg,ambiguous.study,target),null);
});
