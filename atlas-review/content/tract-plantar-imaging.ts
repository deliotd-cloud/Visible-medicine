export type TractPlantarModality = 'mri' | 'ultrasound';
export type TractPlantarGroup = 'iliotibial' | 'long-plantar';
export const tractPlantarReferences = {
  itbAnatomy:'https://pubmed.ncbi.nlm.nih.gov/16533314/',
  proximalMri:'https://pubmed.ncbi.nlm.nih.gov/21499978/',
  distalMri:'https://pubmed.ncbi.nlm.nih.gov/30593591/',
  itbUltrasound:'https://pubmed.ncbi.nlm.nih.gov/32807326/',
  plantarAnatomy:'https://anatomy.ttuhscep.edu/anatomytables/joints_lowerlimb.html',
  plantarMri:'https://pubmed.ncbi.nlm.nih.gov/19696279/',
};
type Ref=keyof typeof tractPlantarReferences;
type Topic={body:string;bullets:string[];references:Ref[]};
export const tractPlantarSelections:{fmas:string[];group:TractPlantarGroup;topics:TractPlantarModality[];landmark:string;limit:string;references:Ref[]}[]=[
  {fmas:['FMA58776','FMA58777'],group:'iliotibial',topics:['mri','ultrasound'],landmark:'The iliotibial tract is part of the fascia lata, with fibrous anchorage to the distal femur. Its relationship to the lateral femoral epicondyle is not that of a free cord sliding over bone.',limit:'This whole-tract surface does not separately resolve capsulo-osseous fibres, deep femoral attachments, a bursa or enthesis footprints. An exploded view is not a biomechanics simulation.',references:['itbAnatomy']},
  {fmas:['FMA44249','FMA44250'],group:'long-plantar',topics:['mri'],landmark:'The long plantar ligament links plantar calcaneus and cuboid with the lateral metatarsal bases. Keep it distinct from the short plantar and spring ligaments when comparing the transverse-tarsal region.',limit:'This is one supplied ligament surface, not individually segmented fascicles, a complete plantar ligament complex or a patient-specific attachment map.',references:['plantarAnatomy']},
];
// Original reference-based orientation. No publisher figures or scan data included.
export const tractPlantarTopics:Record<TractPlantarGroup,Partial<Record<TractPlantarModality,Topic>>>= {
  iliotibial:{
    mri:{body:'Separate proximal iliac-crest assessment from distal lateral-knee assessment. Pelvic MRI and cadaveric work localised proximal tract attachment around the iliac tubercle; a knee examination does not represent that proximal region.',bullets:['Distal MRI research depicts deep femoral attachment bands and the capsulo-osseous layer, including low-signal bands in non-pivot-shift examples. These finer structures are not separately delineated by this broad tract mesh.','The distal study compared twenty knees without a pivot-shift marrow-oedema pattern with twenty showing that pattern. These selected cohorts do not establish an injury in this donor or a population-wide normal reference.'],references:['proximalMri','distalMri']},
    ultrasound:{body:'Ultrasound elastography research sampled the iliotibial band over vastus lateralis, near the superior patellar level and in the lateral femorotibial region. The measured elastic response differed by location and hip/knee position.',bullets:['The living group comprised twelve healthy men, with a separate male-cadaver comparison. Those measurements are not universal stiffness thresholds or evidence of pathology.','A local sonographic sample and this full-length surface have different coverage. Atlas colour, thickness and separation do not encode echogenicity, stiffness or physiological tension.'],references:['itbUltrasound']},
  },
  'long-plantar':{
    mri:{body:'MRI-anatomy correlation of the transverse-tarsal ligament complex helps distinguish the plantar calcaneocuboid region from neighbouring stabilisers. The long plantar selection is an anatomical orientation aid within that region, not the entire complex.',bullets:['The cited study used ten fresh cadaveric feet, high-resolution MRI before and after joint contrast, and matched anatomical analysis. Its detailed visibility cannot be assumed for every routine clinical acquisition.','Keep the source ligament separate from the short plantar ligament and spring complex; do not transfer a finding or an attachment measurement from one to another. A displayed continuous surface does not grade a tear or prove joint stability.'],references:['plantarMri']},
  },
};
