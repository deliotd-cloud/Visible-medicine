// Original short orientation notes. Publications are reading references only;
// no article text, images, tables, scans or numeric reference ranges imported.
export const neonatalCranialUltrasoundReferences={
  parameter:'https://doi.org/10.1002/jum.16551',
  sectorAnatomy:'https://pubmed.ncbi.nlm.nih.gov/6974980/',
  correlatedAnatomy:'https://pubmed.ncbi.nlm.nih.gov/6974979/',
  callosalAnatomy:'https://pubmed.ncbi.nlm.nih.gov/6709917/',
} as const;
type Reference=keyof typeof neonatalCranialUltrasoundReferences;
type Family={body:string;bullets:readonly string[];citations:readonly Reference[]};
export const neonatalCranialUltrasoundTeaching:Record<'caudate'|'thalamus'|'putamen'|'pallidum'|'callosum'|'plexus',Family>={
  caudate:{
    body:'In neonatal ultrasound through an open anterior fontanelle, identify the caudate with neighbouring ventricular and thalamic landmarks across coronal and parasagittal views. Shuman and colleagues correlated these landmarks with neonatal anatomical sections; that work does not validate this generic 3D source as infant anatomy.',
    bullets:['Keep the caudate nucleus distinct from the adjacent caudothalamic groove.','Confirm acquired-image laterality; model shading does not diagnose haemorrhage.'],
    citations:['sectorAnatomy'],
  },
  thalamus:{
    body:'The thalamus is a deep landmark in neonatal transfontanellar views, assessed with the ventricular system and caudate rather than in isolation. Original sonographic–anatomical correlation supports this orientation, not patient-specific thalamic boundaries or the age of the selected mesh.',
    bullets:['Compare both annotated sides on acquired coronal views.','The thalamus is not the caudothalamic groove or choroid plexus.'],
    citations:['sectorAnatomy','correlatedAnatomy'],
  },
  putamen:{
    body:'Infant neurosonography includes the putamina among the deep nuclei assessed on coronal views near the foramina of Monro. Use adjacent nuclei and ventricular landmarks together; a selected putamen surface does not establish its complete sonographic boundary.',
    bullets:['Do not substitute a caudate or pallidal label.','No neonatal echogenicity, injury pattern or normal measurement is encoded here.'],
    citations:['parameter'],
  },
  pallidum:{
    body:'Pallidal nuclei are part of the coronal deep-grey assessment in infant neurosonography. The source selection names the globus pallidus; it supplies neither an infant-specific reconstruction nor separate validated internal and external pallidal segmentations.',
    bullets:['Correlate with neighbouring deep nuclei, not mesh colour.','A pallidal outline here is not evidence of normality on ultrasound.'],
    citations:['parameter','correlatedAnatomy'],
  },
  callosum:{
    body:'Babcock described the normal infant corpus callosum as a curved, relatively low-echo structure above the third ventricle on a midline sagittal view. Assess its course on acquired images; this static source surface cannot establish callosal completeness or developmental normality.',
    bullets:['A limited view must not be interpreted as callosal agenesis.','No age-adjusted length, thickness or diagnostic cut-off is supplied.'],
    citations:['callosalAnatomy'],
  },
  plexus:{
    body:'Infant coronal and parasagittal views assess the choroid plexus within the ventricular system; its atrial glomus is normally echogenic. The generic source group is not a pair of separately validated left and right ultrasound masks.',
    bullets:['Use ventricular position and more than one plane.','Mesh brightness is not echogenicity or proof of haemorrhage.'],
    citations:['parameter'],
  },
};
export const neonatalCranialUltrasoundNote=
  'Neonatal/infant transfontanellar orientation only: a suitable open acoustic window is required. The generic 3D source is not a validated neonatal model or an adult transcranial ultrasound map. No ultrasound images, patient registration or automatic CT/MRI correspondence are supplied. Original draft pending revision-bound radiologist sign-off; not diagnostic or procedural guidance. Atlas, imaging-case and paid-lecture access remain independent.';
