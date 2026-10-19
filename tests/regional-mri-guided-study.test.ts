import assert from 'node:assert/strict';
import test from 'node:test';
import {openRegionalMriPackage,loadRegionalMriSeries,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {KNEE_GUIDE_REVISION,MENISCI_GUIDE_REVISION,EXTENSOR_GUIDE_REVISION,regionalMriGuides,regionalMriGuideAnnotation} from '../lib/regional-mri-guided-study.ts';

const acl='anat.knee.lig.anterior_cruciate_ligament';
const pcl='anat.knee.lig.posterior_cruciate_ligament';
const mcl='anat.knee.lig.medial_collateral_ligament';
const lcl='anat.knee.lig.lateral_collateral_ligament';
const medial='anat.knee.men.medial_meniscus';
const lateral='anat.knee.men.lateral_meniscus';
const medialRoot='anat.knee.men.medial_meniscus_anterior_root';
const quadriceps='anat.knee.tdn.quadriceps_tendon';
const patella='anat.knee.bne.patella';
const patellarTendon='anat.knee.tdn.patellar_tendon';
const patellarFacet='anat.knee.bne.patella_medial_facet';
const patellarCartilage='anat.knee.crt.patellar_cartilage';
const enc=new TextEncoder();
const sha=async(value:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',value)),n=>n.toString(16).padStart(2,'0')).join('');
const copy=(value:ArrayBuffer)=>value.slice(0);

async function fixture(region='knee'){
  const imageA=new Uint8Array([1,2,3,4]).buffer,imageB=new Uint8Array([5,6,7,8]).buffer;
  const hashA=await sha(imageA),hashB=await sha(imageB);
  const annotation=(id:string,anatomyId:string,status:'accepted-scoped'|'provisional'|'deferred',seriesId:string,sourceImageSha256:string,noGeometry=false)=>({
    id,anatomyId,label:id,seriesId,sourceImageSha256,laterality:'left' as const,coverage:'partial' as const,
    review:{status,revision:'a'.repeat(64),scope:'Synthetic source sequence only'},
    geometry:status==='deferred'||noGeometry?{kind:'none' as const}:{kind:'points' as const,points_ras_mm:[[1,2,3]]},
  });
  const grid={shape_kji:[1,2,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
  const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',
    region,laterality:'left',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
      {id:'sequence-a',label:'Synthetic A',image:{...grid,file:'sequence-a.raw',sha256:hashA,dtype:'uint8'},annotations:[
        annotation('acl-a',acl,'accepted-scoped','sequence-a',hashA),
        annotation('acl-b',acl,'accepted-scoped','sequence-a',hashA),
        annotation('pcl-provisional',pcl,'provisional','sequence-a',hashA),
        annotation('mcl-deferred',mcl,'deferred','sequence-a',hashA),
        annotation('medial-a',medial,'accepted-scoped','sequence-a',hashA),
        annotation('medial-b',medial,'accepted-scoped','sequence-a',hashA),
        annotation('lateral-provisional',lateral,'provisional','sequence-a',hashA),
        annotation('lateral-deferred',lateral,'deferred','sequence-a',hashA),
        annotation('lateral-no-geometry',lateral,'accepted-scoped','sequence-a',hashA,true),
        annotation('medial-root',medialRoot,'accepted-scoped','sequence-a',hashA),
        annotation('quadriceps-a',quadriceps,'accepted-scoped','sequence-a',hashA),
        annotation('quadriceps-b',quadriceps,'accepted-scoped','sequence-a',hashA),
        annotation('patella-provisional',patella,'provisional','sequence-a',hashA),
        annotation('patella-facet',patellarFacet,'accepted-scoped','sequence-a',hashA),
        annotation('patella-cartilage',patellarCartilage,'accepted-scoped','sequence-a',hashA),
        annotation('patellar-tendon-a',patellarTendon,'accepted-scoped','sequence-a',hashA),
        annotation('patellar-tendon-deferred',patellarTendon,'deferred','sequence-a',hashA),
        annotation('patellar-tendon-no-geometry',patellarTendon,'accepted-scoped','sequence-a',hashA,true),
      ]},
      {id:'sequence-b',label:'Synthetic B',image:{...grid,file:'sequence-b.raw',sha256:hashB,dtype:'uint8'},annotations:[
        annotation('pcl-b',pcl,'accepted-scoped','sequence-b',hashB),
        annotation('lcl-b',lcl,'accepted-scoped','sequence-b',hashB),
        annotation('lateral-b',lateral,'accepted-scoped','sequence-b',hashB),
        annotation('patella-b',patella,'accepted-scoped','sequence-b',hashB),
        annotation('patellar-tendon-b',patellarTendon,'accepted-scoped','sequence-b',hashB),
      ]},
    ]};
  const manifestBytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer;
  const revision=await sha(manifestBytes);
  const asset=(data:ArrayBuffer):RegionalAsset=>({size:data.byteLength,async arrayBuffer(){return copy(data);}});
  const files=new Map<string,RegionalAsset>([['manifest.json',asset(manifestBytes)],['sequence-a.raw',asset(imageA)],['sequence-b.raw',asset(imageB)]]);
  const pkg=await openRegionalMriPackage(manifestBytes,files,revision);
  const a=await loadRegionalMriSeries(pkg,'sequence-a'),b=await loadRegionalMriSeries(pkg,'sequence-b');
  return {pkg,a,b,manifest,revision};
}

test('guides expose four fixed slots from exactly one verified knee sequence without mutating source',async()=>{
  const {pkg,a,b,manifest,revision}=await fixture(),before=structuredClone(manifest);
  const guides=regionalMriGuides(pkg,a);
  const original=guides.slice(0,2);
  assert(Object.isFrozen(guides));assert.deepEqual(original.map(g=>g.title),['Cruciate ligaments','Collateral ligaments']);
  assert.deepEqual(original.flatMap(g=>g.steps.map(step=>step.anatomyId)),[acl,pcl,mcl,lcl]);
  assert.deepEqual(original.flatMap(g=>g.steps.map(step=>step.candidates.map(candidate=>candidate.id))),[
    ['acl-a','acl-b'],['pcl-provisional'],['mcl-deferred'],[],
  ]);
  for(const guide of original){
    assert.equal(guide.revision,KNEE_GUIDE_REVISION);assert.equal(guide.sourceRevision,revision);
    assert.equal(guide.sequenceId,'sequence-a');assert.equal(guide.imageSha256,a.series.image.sha256);
    assert(Object.isFrozen(guide));assert(Object.isFrozen(guide.steps));
    for(const step of guide.steps){assert(Object.isFrozen(step));assert(Object.isFrozen(step.source));assert(Object.isFrozen(step.candidates));}
  }
  assert.deepEqual(manifest,before);assert.equal(b.series.annotations.length,5);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guides[0],0,'acl-b'),a.series.annotations[1]);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guides[0],0,'acl-a'),a.series.annotations[0]);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guides[0],1,'pcl-b'),null,'no other-sequence fallback');
  assert.equal(regionalMriGuideAnnotation(pkg,a,guides[0],1,'pcl-provisional'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guides[1],0,'mcl-deferred'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guides[1],1,'lcl-b'),null);
  assert.equal(regionalMriGuides(pkg,b)[0].steps[0].candidates.length,0);
});

test('meniscal guide keeps fixed whole-meniscus slots and separate draft revision',async()=>{
  const {pkg,a,b}=await fixture();
  const guides=regionalMriGuides(pkg,a),guide=guides[2];
  assert.equal(guides.slice(0,4).length,4);
  assert.equal(guides.length,5);assert.equal(guides[4].id,'posterior-knee');
  assert.equal(KNEE_GUIDE_REVISION,'knee-guided-inspection-20261013-v1');
  assert.deepEqual(guides.slice(0,2).map(item=>item.revision),[KNEE_GUIDE_REVISION,KNEE_GUIDE_REVISION]);
  assert.equal(guide.id,'menisci');assert.equal(guide.title,'Menisci');
  assert.equal(guide.revision,MENISCI_GUIDE_REVISION);assert.notEqual(guide.revision,KNEE_GUIDE_REVISION);
  assert.equal(guide.sourceRevision,pkg.revision);assert.equal(guide.sequenceId,a.series.id);
  assert.equal(guide.imageSha256,a.series.image.sha256);
  assert.deepEqual(guide.steps.map(step=>step.anatomyId),[medial,lateral]);
  assert.deepEqual(guide.steps.map(step=>step.candidates.map(candidate=>candidate.id)),[
    ['medial-a','medial-b'],['lateral-provisional','lateral-deferred','lateral-no-geometry'],
  ]);
  assert(Object.isFrozen(guide));assert(Object.isFrozen(guide.steps));
  for(const step of guide.steps){
    assert(Object.isFrozen(step));assert(Object.isFrozen(step.source));assert(Object.isFrozen(step.candidates));
    assert.equal(step.source.href,'https://pubmed.ncbi.nlm.nih.gov/17449741/');
    assert.match(step.caption,/recorded whole .* meniscus extent in this sequence/);
    assert.match(step.caption,/central tibial plateau and tibial cruciate insertions/);
    assert.match(step.caption,/does not establish individual horn, body or root coverage, normality, diagnosis or a registered 3D match/);
  }
  assert.deepEqual(regionalMriGuides(pkg,b)[2].steps.map(step=>step.candidates.map(candidate=>candidate.id)),[[],['lateral-b']]);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'medial-a'),a.series.annotations.find(candidate=>candidate.id==='medial-a'));
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'medial-b'),a.series.annotations.find(candidate=>candidate.id==='medial-b'));
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'medial-root'),null,'a root cannot replace a whole meniscus');
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,1,'lateral-provisional'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,1,'lateral-deferred'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,1,'lateral-no-geometry'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,1,'lateral-b'),null,'no alternate-sequence fallback');
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'lateral-provisional'),null,'fixed slot ownership');
  const other=await fixture();
  for(const tuple of [[other.pkg,a,guide],[pkg,b,guide],[pkg,{...a},guide],[pkg,a,{...guide}]] as const)
    assert.equal(regionalMriGuideAnnotation(...tuple as [any,any,any],0,'medial-a'),null);
});

test('extensor guide keeps three exact same-sequence slots and refuses substitute or unreviewed anatomy',async()=>{
  const {pkg,a,b,manifest,revision}=await fixture(),before=structuredClone(manifest);
  const guides=regionalMriGuides(pkg,a),guide=guides[3];
  assert.equal(guides.slice(0,4).length,4);
  assert.equal(guides.length,5);assert.equal(guides[4].id,'posterior-knee');
  assert.deepEqual(guides.slice(0,3).map(item=>item.revision),[KNEE_GUIDE_REVISION,KNEE_GUIDE_REVISION,MENISCI_GUIDE_REVISION]);
  assert.equal(guide.id,'extensor-mechanism');assert.equal(guide.title,'Extensor mechanism');
  assert.equal(guide.revision,EXTENSOR_GUIDE_REVISION);
  assert.notEqual(guide.revision,KNEE_GUIDE_REVISION);assert.notEqual(guide.revision,MENISCI_GUIDE_REVISION);
  assert.equal(guide.sourceRevision,revision);assert.equal(guide.sequenceId,'sequence-a');
  assert.equal(guide.imageSha256,a.series.image.sha256);
  assert.deepEqual(guide.steps.map(step=>step.anatomyId),[quadriceps,patella,patellarTendon]);
  assert.deepEqual(guide.steps.map(step=>step.candidates.map(candidate=>candidate.id)),[
    ['quadriceps-a','quadriceps-b'],['patella-provisional'],
    ['patellar-tendon-a','patellar-tendon-deferred','patellar-tendon-no-geometry'],
  ]);
  assert.deepEqual(regionalMriGuides(pkg,b)[3].steps.map(step=>step.candidates.map(candidate=>candidate.id)),[[],['patella-b'],['patellar-tendon-b']]);
  assert(Object.isFrozen(guide));assert(Object.isFrozen(guide.steps));
  for(const step of guide.steps){assert(Object.isFrozen(step));assert(Object.isFrozen(step.source));assert(Object.isFrozen(step.candidates));}
  assert.equal(guide.steps[0].source.href,'https://pubmed.ncbi.nlm.nih.gov/19690926/');
  assert.match(guide.steps[0].source.title,/Waligora et al/);
  assert.match(guide.steps[0].caption,/variable tendon layering/);
  assert.match(guide.steps[0].caption,/does not identify separate layers/);
  assert.equal(guide.steps[1].source.href,'https://pubmed.ncbi.nlm.nih.gov/16283173/');
  assert.match(guide.steps[1].caption,/patella bone extent/);
  assert.match(guide.steps[1].caption,/does not establish patellar cartilage or retinacular coverage, tracking, patellar height or a diagnosis/);
  assert.equal(guide.steps[2].source.href,'https://pubmed.ncbi.nlm.nih.gov/16283173/');
  assert.match(guide.steps[2].source.title,/Andrikoula et al/);
  assert.match(guide.steps[2].caption,/patellar apex and tibial tubercle/);
  assert.match(guide.steps[2].caption,/does not establish either attachment or a complete extensor mechanism/);
  assert.deepEqual(manifest,before);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'quadriceps-a'),a.series.annotations.find(candidate=>candidate.id==='quadriceps-a'));
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'quadriceps-b'),a.series.annotations.find(candidate=>candidate.id==='quadriceps-b'));
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,1,'patella-provisional'),null,'whole patella remains unavailable');
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,1,'patella-facet'),null,'a facet cannot replace whole patella');
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,1,'patella-cartilage'),null,'cartilage cannot replace patella bone');
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,1,'patella-b'),null,'no other-sequence fallback');
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,2,'patellar-tendon-a'),a.series.annotations.find(candidate=>candidate.id==='patellar-tendon-a'));
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,2,'patellar-tendon-deferred'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,2,'patellar-tendon-no-geometry'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,2,'patellar-tendon-b'),null,'no other-sequence fallback');
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'patellar-tendon-a'),null,'no slot substitution');
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,2,'quadriceps-a'),null,'no slot substitution');
  const other=await fixture();
  for(const tuple of [[other.pkg,a,guide],[{...pkg},a,guide],[pkg,{...a},guide],[pkg,b,guide],[pkg,a,{...guide}],[pkg,a,structuredClone(guide)],[pkg,a,guides[2]]] as const)
    assert.equal(regionalMriGuideAnnotation(...tuple as [any,any,any],0,'quadriceps-a'),null);
  for(const index of [-1,1,2,3,0.5,NaN,Infinity])
    assert.equal(regionalMriGuideAnnotation(pkg,a,guide,index,'quadriceps-a'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'unknown'),null);
});

test('guide choice requires exact package, study, generated guide and slot ownership',async()=>{
  const {pkg,a,b}=await fixture(),other=await fixture(),guide=regionalMriGuides(pkg,a)[0];
  assert.throws(()=>regionalMriGuides({...pkg},a),/owned|verified|Unknown/);
  assert.throws(()=>regionalMriGuides(pkg,{...a}),/owned|verified|Unknown/);
  assert.throws(()=>regionalMriGuides(other.pkg,a),/owned|verified|Unknown/);
  const shoulder=await fixture('shoulder');assert.deepEqual(regionalMriGuides(shoulder.pkg,shoulder.a),[]);
  for(const tuple of [[other.pkg,a,guide],[{...pkg},a,guide],[pkg,{...a},guide],[pkg,b,guide],[pkg,a,{...guide}],[pkg,a,structuredClone(guide)]] as const)
    assert.equal(regionalMriGuideAnnotation(...tuple as [any,any,any],0,'acl-a'),null);
  for(const index of [-1,1,2,0.5,NaN,Infinity])
    assert.equal(regionalMriGuideAnnotation(pkg,a,guide,index,'acl-a'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'unknown'),null);
  assert.equal(regionalMriGuideAnnotation(pkg,a,guide,0,'pcl-provisional'),null);
});
