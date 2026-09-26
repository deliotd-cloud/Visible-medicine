// Original factual teaching; linked publisher media are not included.
const longusReference='https://ecios.org/DOIx.php?id=10.4055/cios.2018.10.2.204';
export const longusClinicalTopics={
  clinical:{
    title:'Longus colli symptoms in context',
    body:'Calcific longus colli tendinitis can present with acute neck pain, restricted movement and painful swallowing. These symptoms overlap with infection, including retropharyngeal abscess. Clinical assessment and imaging are needed; symptoms alone cannot identify the cause or the affected muscle part.',
    prompt:'Compare the three supplied parts in the Longus colli study. This is group-level clinical context, not a diagnosis attached to every part or evidence that the left side is diseased.',
  },
  pathology:{
    title:'Calcific tendinitis: local deposit, wider response',
    body:'Calcium hydroxyapatite deposition in the longus colli tendon can provoke inflammation. Upper cervical deposits near C1–C2 are described, but lower deposits also occur. Surrounding prevertebral fluid does not mean that each longus colli part contains a calcific deposit.',
    prompt:'The selected surface is reference anatomy, not a diseased tendon. No deposit, oedema, collection, infected tissue or disease boundary has been added.',
  },
  ct:{
    title:'CT: localise a deposit, not just swelling',
    body:'CT can demonstrate longus colli calcification and its relationship to the cervical vertebrae. In the cited series, deposits were mainly below the anterior C1 arch, with a lower-level exception. Calcification and an adjacent osteophyte must not be conflated.',
    prompt:'Use the source part and vertebrae for orientation only. A CT slice would need its own verified patient coordinates; moving or clipping this surface does not produce a CT image or localise a patient deposit.',
  },
  mri:{
    title:'MRI: surrounding soft-tissue response',
    body:'T2-weighted MRI may demonstrate prevertebral fluid associated with longus colli tendinitis. Fluid alone is not diagnostic and should not be equated with abscess. MRI findings require correlation with the clinical picture and assessment of calcification on CT.',
    prompt:'The 3D surface has no MRI signal, diffusion data or contrast enhancement. Its boundary is not a measured fluid extent or a validated fascial compartment.',
  },
} as const;
export const longusPartContext={
  superior:'Selected part: superior oblique. Its upper attachment provides orientation near the commonly described upper cervical deposit site; the exact tendon footprint is not delineated or clinically validated here.',
  vertical:'Selected part: vertical intermediate. This is not the superior oblique tendon at C1. Do not relocate the usual upper-cervical example onto this part or label the entire muscle as calcified.',
  inferior:'Selected part: inferior oblique. This is not the superior oblique tendon at C1. Lower-level deposits reported in patients do not establish a lesion in this particular reference part.',
} as const;
export const thyroidClinicalTopics={
  clinical:{
    title:'Variable recurrent laryngeal nerve relationship',
    body:'The recurrent laryngeal nerve and inferior thyroid artery have a variable relationship. Cadaveric study shows that one fixed crossing pattern cannot be assumed, including between the two sides. The arterial reference alone cannot locate the nerve or define a safe plane for neck surgery.',
    prompt:'Compare the same-side thyrocervical parent through Arterial connections. The nerve and gland are not supplied by this source addition; do not infer their positions from the artery colour, side or apparent course.',
    citation:'https://pubmed.ncbi.nlm.nih.gov/16455326/',
    credit:'Yalçin (2006), cadaveric observational study. Anatomical variation evidence, not an operative map.',
  },
  pathology:{
    title:'Reported iatrogenic pseudoaneurysm',
    body:'A case report described an inferior thyroid artery pseudoaneurysm associated with attempted internal jugular venous access. It illustrates a possible arterial complication of a venous procedure, not a common finding or an estimate of risk. The same name on a reference model does not diagnose such an injury.',
    prompt:'This is the normal-reference arterial selection, with no pseudoaneurysm sac, puncture track, haematoma or measured lumen. Do not use it to choose an access route or interpret a patient swelling.',
    citation:'https://link.springer.com/article/10.1186/s12871-015-0052-6',
    credit:'Ruan et al. (2015), single case report, CC BY 4.0. Original factual synthesis only; no patient images or procedure instructions imported.',
  },
} as const;
export const longusTeachingReference={url:longusReference,credit:'Suh, Eoh and Shin (2018), retrospective ten-case series. Original brief synthesis; no source images, tables, treatment regimen or diagnostic threshold imported. Publisher media are CC BY-NC 4.0 and are not bundled.'};
