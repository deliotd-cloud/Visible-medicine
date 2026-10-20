// Original concise factual teaching; linked publications are not bundled assets.
const anatomy='https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html';
export const corpusImagingTopics={
 ct:{
  title:'CT: urethral contrast is not the erectile-tissue boundary',
  body:'The corpus spongiosum is tissue around the spongy urethra, not the urethral passage itself. Dedicated CT retrograde urethrography introduces contrast into that passage; its opacified route must not be mistaken for the complete outline of the surrounding corpus spongiosum.',
  bullets:['An original prospective CT-urethrography study included 22 men with urethral abnormalities. Its selected clinical cohort is not evidence that routine CT consistently resolves normal spongiosal boundaries.','The investigators did not measure surrounding spongiofibrosis thickness on CT, explaining that similar attenuation of scar and adjacent erectile tissue limited that assessment. This is a study-specific limitation, not a normal measurement or a treatment recommendation.','This source-labelled bulb/shaft surface supplies no glans, tunical layers or validated urethral lumen. It is not a CT segmentation; neither a smooth surface nor the separate urethral model establishes tissue integrity, patency or a measured fibrosis boundary.'],
  citations:['https://doi.org/10.3390/app11031006',anatomy],
  credit:'Berna-Mestre and colleagues (2021), prospective CT retrograde urethrography study, especially its stated tissue-assessment limits; NCI SEER, Penis. No acquisition, contrast-dose, instrumentation or treatment instructions supplied.',
 },
 mri:{
  title:'MRI: separate the erectile compartments',
  body:'The corpus spongiosum is the ventral erectile column around the spongy urethra, distinct from the paired corpora cavernosa. An original normal-anatomy MRI study demonstrated these compartments, their coverings and the urethral lumen using combined T1- and T2-weighted assessment in different planes.',
  bullets:['On the actual study, distinguish the erectile compartments from the urethral passage. The cited historical technical study does not establish that every routine examination resolves every boundary.','The atlas colour is not MR signal. This bulb/shaft mesh supplies no glans, paired cavernosal bodies, tunical layers or validated lumen; its proximity to the separate urethra cannot establish patency, calibre or injury.'],
  citations:['https://pubmed.ncbi.nlm.nih.gov/2918824/',anatomy],
  credit:'Satragno, Martinoli and Cittadini (1989), original normal-anatomy MRI study; NCI SEER, Penis. No diagnostic-accuracy or modern protocol claim.',
 },
 ultrasound:{
  title:'Ultrasound: tissue, lumen and flow are different',
  body:'Locate the urethra-associated ventral corpus spongiosum separately from the paired cavernous bodies. Penile ultrasound evaluates anatomy in both longitudinal and transverse views; a single atlas perspective is not an equivalent examination.',
  bullets:['Gray-scale anatomy and vascular assessment answer different questions. Colour and spectral Doppler provide flow information that this static surface cannot supply.','The complete clinical examination extends beyond this supplied bulb/shaft surface. Neither an apparently smooth mesh nor the separate urethral model excludes a wall lesion, narrowing or injury; no lumen, acoustic response, Doppler waveform or erectile function is simulated.'],
  citations:['https://doi.org/10.1002/jum.16235',anatomy],
  credit:'AIUM Practice Parameter for the Performance of Penile Ultrasound (2023), examination scope and Doppler distinction; NCI SEER, Penis. No scanning, instrumentation or treatment protocol supplied.',
 },
} as const;
