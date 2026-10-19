// Original concise factual teaching; linked publications are not bundled assets.
const anatomy='https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html';
export const corpusImagingTopics={
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
