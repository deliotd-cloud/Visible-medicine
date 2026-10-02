import type {NestedConcept,NestedSection} from './nested-teaching';

/** Original file-scoped education; sources support parent context only.
 * No publication figure, image, dataset or independent branch name is imported. */
export const picaSourceTeachingReferences={
  picaSourceParentAnatomy:{
    scopedToConcept:true,
    title:'UAMS · Head and neck arteries (parent PICA context)',
    url:'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-head-and-neck/',
  },
  picaSourceAngiography:{
    scopedToConcept:true,
    title:'Akgun et al. (2013) · Vertebrobasilar CTA and MRA cohorts (original abstract)',
    url:'https://pubmed.ncbi.nlm.nih.gov/24023533/',
  },
};
const pending=(body:string):NestedSection=>({body,readiness:'pending',references:[]});
// Explicit archive membership and exact topology diagnostics, not clinical segments.
// Both sides are independently bound to their supplied records; no mirroring here.
export const picaSourceFiles=[
  {file:'FJ1700',order:1,triangles:326,components:1},
  {file:'FJ1701',order:2,triangles:306,components:2},
  {file:'FJ1702',order:3,triangles:240,components:1},
  {file:'FJ1703',order:4,triangles:224,components:1},
  {file:'FJ1704',order:5,triangles:286,components:1},
  {file:'FJ1705',order:6,triangles:322,components:1},
  {file:'FJ1706',order:7,triangles:292,components:1},
  {file:'FJ1707',order:8,triangles:84,components:1},
  {file:'FJ1708',order:9,triangles:86,components:1},
  {file:'FJ1709',order:10,triangles:176,components:1},
  {file:'FJ1710',order:11,triangles:166,components:1},
  {file:'FJ1711',order:12,triangles:736,components:1},
  {file:'FJ1715',order:13,triangles:796,components:1},
].flatMap(record=>[
  {...record,side:'right' as const,fmaId:'FMA50519'},
  {...record,file:record.file+'M',side:'left' as const,fmaId:'FMA50520'},
]).sort((a,b)=>a.side===b.side?a.order-b.order:a.side==='right'?-1:1);

const focus=[
  ['The inherited FMA identifies the whole parent PICA, not a separate branch in this file.',
   'Does the inherited parent FMA certify a separately named branch?',
   'No. It binds the parent PICA; the child remains a source-file partition with its own exact record.'],
  ['This file contains two disconnected surface components. Do not connect them or interpret the separation as vessel obstruction.',
   'Do the two disconnected pieces demonstrate an occlusion?',
   'No. These are supplied surface components, not an acquired angiogram or evidence of vessel obstruction.'],
  ['Source part 03 follows archive ordering, not an anterior-medullary, lateral-medullary or other clinical segment assignment.',
   'Does source part 03 identify the third anatomical PICA segment?',
   'No. The number orders source files. Anatomical segment boundaries require separate source-specific review.'],
  ['Side belongs to the supplied parent/child records. Rotating the camera can change screen position without changing anatomical laterality.',
   'Does moving this file to the other side of the screen change its anatomical side?',
   'No. Camera position and screen position are view state; anatomical laterality remains bound to the supplied records.'],
  ['A file boundary or nearby surface is not a proven vessel junction. No continuous lumen has been established for this part.',
   'Does an adjacent file edge prove a patent junction?',
   'No. Adjacent surfaces and archive boundaries do not establish lumen continuity, blood flow or a clinically patent junction.'],
  ['The general PICA supply described in the reference belongs to the parent circulation. It cannot be allocated to this file as a perfusion territory.',
   'Can the parent PICA supply be assigned as this file’s independent perfusion territory?',
   'No. Parent-vessel context is educational orientation; this file has no separately validated territory.'],
  ['Triangle count describes surface tessellation, not vessel calibre, physiological importance or a stenosis grade.',
   'Does triangle count measure vessel calibre or stenosis?',
   'No. It records mesh resolution. Clinical calibre and stenosis need suitable acquired images and their own review.'],
  ['A small source surface is not a missing angiographic branch. Neither model visibility nor an isolated image projection establishes absence or disease.',
   'Can hiding this small surface establish an absent PICA branch?',
   'No. Hiding is a display operation; an anatomical absence or clinical lesion requires independent evidence.'],
  ['Noncontrast head CT and contrast-enhanced CTA are different acquisitions. This static surface contains neither brain attenuation nor contrast-filled lumen data.',
   'Is this source surface equivalent to noncontrast CT or CTA pixels?',
   'No. It is a reference mesh. Noncontrast CT, CTA and this surface have different data and interpretation requirements.'],
  ['The cited study used separate CTA and MRA patient cohorts. Its observations do not validate this file or provide a paired accuracy comparison for it.',
   'Does the cited study provide a paired CTA-versus-MRA accuracy result for this mesh file?',
   'No. It studied separate acquired-image cohorts, not this file or a matched comparison of this anatomy mesh.'],
  ['Explode, clipping and a flat teaching plate change presentation, not anatomy. Return separation to zero before reviewing the retained source position.',
   'Does an exploded gap define a surgical dissection plane?',
   'No. Separation is a non-anatomical display aid; a surgical plane has not been validated from that layout.'],
  ['Similar supplied opposite-side topology does not certify bilateral symmetry in an individual patient. Each side keeps an independent source binding.',
   'Do matching opposite-side triangle counts prove patient symmetry?',
   'No. Archive topology is not individual anatomy. Patient side, origin, course and symmetry need their own imaging and review.'],
  ['The final listed file is FJ1715 (FJ1715M on the supplied left side), source part 13. Gaps in filename numbering do not identify a missing anatomical segment.',
   'Do skipped filename numbers certify missing PICA segments?',
   'No. Archive naming is not a complete branch inventory or an anatomical segment classification.'],
] as const;

export const picaSourceConcepts:NestedConcept[]=picaSourceFiles.map(({file,order,side,fmaId,triangles,components})=>{
 const [scope,question,answer]=focus[order-1],label=`${side} PICA · ${file}`;
 return {
  id:'pica-source-'+file.toLowerCase(),study:'cranial-artery-components',fmaIds:[fmaId],
  sections:{
   anatomy:{
    body:`${label} is source part ${String(order).padStart(2,'0')} of 13 supplied files in this parent surface. Its source diagnostic counts ${triangles} triangles and ${components} disconnected surface component${components===1?'':'s'}, not clinical branches. ${scope} Parent-vessel context only: PICA usually arises from the vertebral artery and contributes supply to the medulla and inferior cerebellum. No separately named branch, origin variant, tissue territory or accepted segment boundary is assigned to ${file}.`,
    references:['picaSourceParentAnatomy'],readiness:'draft',
   },
   function:pending(`An independent functional territory for ${label} remains unassigned. Do not infer perfusion, flow, collateral supply or physiological importance from its tessellation or archive position.`),
   clinical:pending(`Branch-specific clinical context for ${label} awaits anatomical identification and revision-bound review. This source file alone establishes no patient symptom pattern, procedural target or treatment route.`),
   pathology:pending(`${label} represents supplied reference geometry, not a lesion. Disconnected pieces, hidden surfaces, clipping and separation do not demonstrate stenosis, thrombus, aneurysm or infarction.`),
  },
  imaging:{
   ct:{
    body:`${label}: CTA is an acquired, contrast-enhanced vascular examination, not this source file. Akgun et al. examined vertebrobasilar anatomy in separate CTA and MRA cohorts and reported differing branch configurations. That study does not identify ${file}, its origin or an independent perfusion territory. Noncontrast CT is a different tissue examination; this file supplies no corresponding CT pixels, contrast lumen, measurement or patient-space registration.`,
    references:['picaSourceAngiography'],readiness:'draft',
   },
   mri:{
    body:`${label}: structural brain MRI and MR angiography are not interchangeable with this surface. The cited acquired-image study used MRA in a separate cohort from CTA; it was not a matched accuracy study of these file partitions. ${file} carries no MR signal, flow measurement or accepted patient correspondence. A model gap or visibility change does not establish an absent branch or occlusion. Future correspondence requires an approved series, exact side/source identity and reviewed spatial registration.`,
    references:['picaSourceAngiography'],readiness:'draft',
   },
  },
  modelLimit:`${label} is one existing source-file partition, not a validated named branch. Its parent retains 13 files and 14 disconnected surface components. Ordered source triangles are preserved; no branch connection, lumen repair, patient territory, origin variant or missing segment is supplied. This draft does not certify anatomical/clinical accuracy or scan registration.`,
  quiz:{question:`${label}: ${question}`,answer,references:[],basis:'model-scope'},
 };
});
