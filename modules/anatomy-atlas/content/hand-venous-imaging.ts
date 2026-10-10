// Original, short educational text. No external scans, figures or tables included.
export const handVenousImagingReferences={
 anatomy:'https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html',
 imaging:'https://link.springer.com/article/10.1186/s13244-020-00958-4',
 mri:'https://pubmed.ncbi.nlm.nih.gov/8982197/',
} as const;
export const handVenousImagingTopics={
 'palmar-venous-arch-detail':{
  landmark:'Orient the named palmar venous arch against the metacarpals and arterial arches; its label does not verify depth or anastomoses.',
  ct:'Use palmar bone landmarks to locate the venous arch region on CT. An arterial-phase vessel image is not a complete venous map.',
  mri:'Compare palmar venous and arterial regions on MRI. Acquisition-specific vascular evidence, not blue mesh colour, establishes whether an observed channel is venous.',
  limit:'Deep and superficial arch names remain separate source labels, not proof of complete arch continuity or validated relative depth.',
 },
 'dorsal-hand-venous-detail':{
  landmark:'The dorsal superficial venous network communicates with cephalic and basilic drainage; this selection is not its complete tributary map.',
  ct:'Use the dorsal metacarpal surface as an orientation landmark on CT; vessel enhancement and resolution depend on the acquired examination.',
  mri:'Inspect dorsal subcutaneous tissue over the metacarpals on MRI. A selectable network does not mean every tributary is independently visible or segmented.',
  limit:'One network identity per hand is retained; missing tributaries and connections to forearm veins are not reconstructed.',
 },
 'palmar-metacarpal-venous-detail':{
  landmark:'Use the palmar metacarpal region to orient this grouped venous source, keeping venous selections distinct from palmar metacarpal arteries.',
  ct:'Compare the palmar metacarpal region on CT. The three source components are not three independently validated scan contours or numbered tributaries.',
  mri:'Use metacarpals and adjacent soft tissues for MRI orientation. Separate tissue compartments and demonstrated vessels must come from the scan, not exploded geometry.',
  limit:'Three components remain one original metacarpal-vein identity; detailed territories, depth and drainage connections require review.',
 },
 'proper-digital-venous-detail':{
  landmark:'Keep the recorded index, middle or ring finger and anatomical side fixed while comparing its palmar venous source with phalanges.',
  ct:'Locate the named digit on CT before comparing venous soft tissue. Two archived components do not establish two resolved vessel boundaries.',
  mri:'Compare the named digit and its palmar soft tissues on MRI. Small-channel visibility is acquisition-dependent; the atlas supplies neither flow measurements nor patency.',
  limit:'Each digital selection retains two unnamed components, not inferred radial/ulnar finger branches. Thumb detail is absent; little-finger vein groups remain withheld.',
 },
} as const;
