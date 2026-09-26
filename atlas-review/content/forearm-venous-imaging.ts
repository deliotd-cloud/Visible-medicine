export const forearmVenousReferences={
 anatomy:'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-upper-limb/',
 upperMrv:'https://pubmed.ncbi.nlm.nih.gov/22920352/',
 forearmMrv:'https://pubmed.ncbi.nlm.nih.gov/12598988/',
};
export type ForearmVenousGroup='cephalic'|'basilic';
type Topic={landmark:string;body:string;bullets:string[];references:(keyof typeof forearmVenousReferences)[]};
// Original short orientation drafts; linked publications supply no reusable scan asset.
export const forearmVenousTopics:Record<ForearmVenousGroup,Topic>={
 cephalic:{
  landmark:'The cephalic vein is a superficial route on the lateral forearm; its connections and calibre can vary.',
  body:'Dedicated upper-limb MR venography can depict the cephalic vein. In a comparison of two noncontrast MRV acquisitions, cephalic-vein visibility was similar between them. This does not establish visibility on a routine forearm MRI.',
  bullets:['Follow the named surface for orientation only. Its blue outline has no MR signal, measured calibre, flow or proof of a patent lumen.'],
  references:['anatomy','upperMrv','forearmMrv'],
 },
 basilic:{
  landmark:'The basilic vein is a superficial medial forearm route, distinct from the deep brachial veins.',
  body:'Basilic-vein visibility in upper-limb MR venography depends on acquisition. A noncontrast comparison found better depiction with fresh-blood imaging than with time-of-flight MRV; neither result makes the vein reliably visible on an ordinary forearm MRI.',
  bullets:['The source surface supplies no MR sequence, contrast, patient-specific branch pattern or evidence of venous patency.'],
  references:['anatomy','upperMrv'],
 },
};
