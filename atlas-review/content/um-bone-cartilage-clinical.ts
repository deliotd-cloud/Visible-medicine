// Original brief teaching; external sources are reading links, not imported assets.
// Reused prose carries no other subject's identities, source scope or geometry.
import { limbBoneClinicalGroups } from '../lib/limb-bone-clinical-curriculum';
import { acralBoneClinicalGroups } from '../lib/acral-bone-clinical-curriculum';
import type { SpecimenClinicalLesson, SpecimenTopicDraft } from './um-limb-clinical';

export const boneCartilageClinicalReferences = {
  proximalTibia: { title: 'AAOS · Proximal tibial fractures', url: 'https://www.orthoinfo.org/diseases--conditions/fractures-of-the-proximal-tibia-shinbone/' },
  ankleFracture: { title: 'AAOS · Ankle fractures', url: 'https://www.orthoinfo.org/diseases--conditions/ankle-fractures-broken-ankle/' },
  proximalFibula: { title: 'AO · Proximal fibular fracture with medial/syndesmotic injury: definition', url: 'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/malleoli/suprasyndesmotic-proximal-fibular-fracture-medial-injury-posterior-fracture/definition' },
  patellaFracture: { title: 'AAOS · Patellar fractures', url: 'https://www.orthoinfo.org/diseases--conditions/patellar-kneecap-fractures/' },
  kneeArthritis: { title: 'AAOS · Arthritis of the knee', url: 'https://www.orthoinfo.org/diseases--conditions/arthritis-of-the-knee/' },
  patellofemoralArthritis: { title: 'AAOS · Patellofemoral arthritis', url: 'https://www.orthoinfo.org/diseases--conditions/patellofemoral-arthritis/' },
  cuboidInjury: { title: 'Angoules et al. · Cuboid fracture diagnosis review (2019)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6379735/' },
  navicularStress: { title: 'AOFAS FootCareMD · Navicular stress fractures', url: 'https://www.footcaremd.org/foot-and-ankle-conditions/midfoot/navicular-stress-fractures' },
  lisfranc: { title: 'AAOS · Lisfranc midfoot injury', url: 'https://www.orthoinfo.org/diseases--conditions/lisfranc-midfoot-injury' },
  midfootBones: { title: 'OpenStax · Lower-limb bones', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb' },
} as const;
type Reference = keyof typeof boneCartilageClinicalReferences;
const urls = (...refs: Reference[]) => refs.map(r => boneCartilageClinicalReferences[r].url);
const draft = (body: string, ...refs: Reference[]): SpecimenTopicDraft => ({ readiness: 'draft', body, references: urls(...refs) });
const quiz = (question: string, answer: string, ...refs: Reference[]) => ({ question, answer, references: urls(...refs) });
function reuse(region: 'limb' | 'foot', key: string, clinicalRef: Reference, pathologyRef = clinicalRef) {
  const group = (region === 'limb' ? limbBoneClinicalGroups : acralBoneClinicalGroups).find(g => g.key === key);
  if (!group) throw new Error(`Missing authored bone concept: ${region}/${key}`);
  return { clinical: draft(group.clinical.body, clinicalRef), pathology: draft(group.pathology.body, pathologyRef) };
}

export const boneCartilageClinicalLessons: Record<string, SpecimenClinicalLesson> = {
  tibia: {
    modelLimit: 'The entire supplied tibia remains one selection. No plateau depression, fracture fragment, compartment pressure or separately graded malleolar injury is rendered; source defects are not fractures.',
    topics: {
      ...reuse('limb', 'tibia', 'proximalTibia'),
      clinical: draft('Assess proximal tibial injury together with surrounding soft tissues and neurovascular findings. Increasing severe pain or new numbness after injury needs urgent assessment; compartment syndrome is an emergency.', 'proximalTibia'),
      xray: draft('Radiographs locate tibial fractures and show alignment, but persistent suspicion of a plateau injury is not resolved by a negative film alone.', 'proximalTibia'),
      ct: draft('CT characterises plateau involvement, fragment position and fracture complexity. The whole reference bone does not provide a patient fracture classification.', 'proximalTibia'),
      mri: draft('MRI may investigate an occult plateau injury or associated soft-tissue damage. It is not a routine requirement for every tibial fracture.', 'proximalTibia'),
    },
    selfCheck: quiz('What distinguishes a tibial-plateau fracture from an extra-articular proximal tibial fracture?', 'A plateau fracture involves the knee joint surface. Not every proximal tibial fracture enters the joint.', 'proximalTibia'),
  },
  fibula: {
    modelLimit: 'A whole fibula is shown, without syndesmotic ligaments, a validated stress examination or ankle-fracture classification. Exploded spacing cannot demonstrate instability.',
    topics: {
      ...reuse('limb', 'fibula', 'proximalFibula'),
      xray: draft('Ankle radiographs assess distal fibular injury and the surrounding mortise. Clinical concern for a more proximal injury requires assessment beyond the ankle alone.', 'ankleFracture', 'proximalFibula'),
      ct: draft('CT can clarify complex ankle fracture anatomy and joint involvement. It does not turn this isolated reference fibula into a mechanical stability test.', 'ankleFracture'),
      mri: draft('MRI may assess associated ankle ligament injury when needed, but is rarely required for straightforward ankle-fracture assessment.', 'ankleFracture'),
    },
    selfCheck: quiz('Can a proximal fibular fracture be relevant to an ankle injury?', 'Yes. Some patterns include proximal fibular, syndesmotic and medial injury; do not assume every proximal fracture has that pattern.', 'proximalFibula'),
  },
  patella: {
    modelLimit: 'The supplied kneecap has no fracture grade, separately identified bipartite variant or dynamic extensor assessment. Source fragments cannot be interpreted as patient fracture fragments.',
    topics: {
      ...reuse('limb', 'patella', 'patellaFracture'),
      xray: draft('Views from different angles assess a patellar fracture and displacement. A developmental bipartite patella can resemble a fracture and needs appropriate interpretation.', 'patellaFracture'),
      ct: draft('CT may clarify a multifragmentary patellar fracture when detailed assessment is needed. Fragment count alone does not establish extensor function.', 'patellaFracture'),
    },
    selfCheck: quiz('Does a two-part patellar appearance always mean an acute fracture?', 'No. A developmental bipartite patella can resemble a fracture; the history and appropriate radiographs help distinguish them.', 'patellaFracture'),
  },
  'femoral-cartilage': {
    modelLimit: 'Only the supplied distal femoral cartilage surface is selected, not femoral-head cartilage. Condylar/trochlear defects, lesion depths and microscopic tissue quality are not separately mapped.',
    topics: {
      clinical: draft('Knee pain and stiffness require clinical assessment across the joint; they do not localise a cartilage defect to this femoral surface.', 'kneeArthritis'),
      pathology: draft('Articular cartilage wear can accompany joint degeneration and adjacent bone changes. The supplied surface is not a staged osteoarthritis model.', 'kneeArthritis'),
      xray: draft('Radiographs infer cartilage loss through joint-space changes and associated bone findings; they do not outline this cartilage surface directly.', 'kneeArthritis'),
      mri: draft('MRI can help assess cartilage and other joint tissues when needed. A smooth reference surface is not evidence of normal patient cartilage.', 'kneeArthritis'),
    },
    selfCheck: quiz('Does this selection include the cartilage of the femoral head?', 'No. It is the distal femoral surface at the knee; femoral-head cartilage remains a separate source selection.'),
  },
  'tibial-cartilage': {
    modelLimit: 'The original tibial cartilage group remains grouped and distinct from the menisci. No medial/lateral compartment grade, cartilage thickness measurement or load-bearing joint space is supplied.',
    topics: {
      clinical: draft('Assess tibiofemoral symptoms with examination and appropriate imaging. This grouped articular surface cannot identify one symptomatic compartment.', 'kneeArthritis'),
      pathology: draft('Degeneration may involve cartilage with neighbouring bone and other joint tissues. An intact-looking tibial surface does not exclude disease elsewhere.', 'kneeArthritis'),
      xray: draft('Joint-space narrowing is an indirect joint finding, not a direct measurement of this grouped cartilage mesh.', 'kneeArthritis'),
      mri: draft('MRI can assess joint soft tissues when clinically indicated; this cartilage selection alone does not establish meniscal integrity.', 'kneeArthritis'),
    },
    selfCheck: quiz('Is tibial articular cartilage the same source selection as the menisci?', 'No. The tibial cartilage group and meniscus group remain distinct supplied tissues; neither is split into invented lesion selections.'),
  },
  'patellar-cartilage': {
    modelLimit: 'This is the supplied patellar articular surface. No separate facet lesion, cartilage grade, patellar maltracking or trochlear dysplasia is reconstructed.',
    topics: {
      clinical: draft('Patellofemoral arthritis may cause anterior knee pain, particularly during activities loading the joint. Symptoms alone do not establish a patellar cartilage lesion.', 'patellofemoralArthritis'),
      pathology: draft('Cartilage degeneration on the patella and trochlear side can affect their articulation. A healed patellar fracture may still leave articular damage.', 'patellofemoralArthritis'),
      xray: draft('Radiographs from appropriate angles assess patellofemoral joint space, bone change and overall alignment; the cartilage itself is not directly outlined.', 'patellofemoralArthritis'),
      mri: draft('MRI may better evaluate patellofemoral cartilage when needed. The selected surface cannot establish a patient lesion or its severity.', 'patellofemoralArthritis'),
    },
    selfCheck: quiz('Can articular damage persist after a patellar fracture has healed?', 'Yes. Healing of bone does not ensure a smooth cartilage surface; residual joint damage can contribute to later arthritis.', 'patellofemoralArthritis'),
  },
  cuboid: {
    modelLimit: 'One original cuboid surface is shown. Lateral-column shortening, articular depression and operative distraction are not measured or simulated; grouped adjacent bones do not acquire individual identities.',
    topics: {
      ...reuse('foot', 'cuboid', 'cuboidInjury'),
      xray: draft('Foot radiographs assess cuboid and adjacent joint injury, but overlap can hide an occult fracture. Persistent clinical suspicion may require additional imaging.', 'cuboidInjury'),
      ct: draft('CT clarifies fracture configuration and articular displacement. Reference explode distance is not a measurement of lateral-column shortening.', 'cuboidInjury'),
      mri: draft('MRI can reveal an occult cuboid fracture when radiographs are unrevealing. Imaging findings require interpretation with symptoms and the wider foot injury.', 'cuboidInjury'),
    },
    selfCheck: quiz('Why assess lateral-column relationships as well as a cuboid fracture line?', 'Loss of column length and articular displacement can alter foot mechanics. The atlas separation slider does not measure either.', 'cuboidInjury'),
  },
  navicular: {
    modelLimit: 'The foot navicular is not the wrist scaphoid. No stress-fracture line, accessory navicular, bone-strength test or marrow signal is represented.',
    topics: {
      ...reuse('foot', 'navicular', 'navicularStress'),
      xray: draft('Early navicular stress fractures may not appear on radiographs. Ongoing activity-related midfoot symptoms need clinical assessment despite a normal initial film.', 'navicularStress'),
      ct: draft('CT can help investigate suspected navicular stress fracture when radiographs are inconclusive. This reference surface cannot establish healing or a return-to-sport date.', 'navicularStress'),
      mri: draft('MRI may reveal a suspected navicular stress injury not visible on radiographs. A normal-looking 3D surface is not equivalent to a negative scan.', 'navicularStress'),
    },
    selfCheck: quiz('Does a normal early X-ray exclude navicular stress fracture?', 'No. A clinically suspected stress fracture may need further assessment or imaging even when the initial radiograph looks normal.', 'navicularStress'),
  },
  'medial-cuneiform': {
    modelLimit: 'This source bone is distinct from the intermediate and lateral cuneiforms. No Lisfranc ligament, first/second-ray instability or patient diastasis is separately mapped.',
    topics: {
      ...reuse('foot', 'cuneiforms', 'midfootBones', 'lisfranc'),
      xray: draft('Clinician-directed weight-bearing views may reveal subtle midfoot widening not evident on non-weight-bearing films.', 'lisfranc'),
      mri: draft('MRI may assess suspected Lisfranc ligament injury when the diagnosis remains uncertain; this bone is not that ligament.', 'lisfranc'),
    },
    selfCheck: quiz('Does a normal non-weight-bearing film exclude a subtle Lisfranc injury?', 'No. Some instability is only apparent on further appropriately selected imaging.', 'lisfranc'),
  },
  'intermediate-cuneiform': {
    modelLimit: 'The intermediate cuneiform is separately named, but its adjacent grouped foot bones are not individually resolved. Do not assign a second-metatarsal lesion ID through this selection.',
    topics: {
      ...reuse('foot', 'cuneiforms', 'midfootBones', 'lisfranc'),
      xray: draft('Assess midfoot alignment across the joint assembly; a normal non-weight-bearing film can miss subtle instability.', 'lisfranc'),
      ct: draft('CT clarifies the number of joints involved and fracture extent; it is not required for every Lisfranc injury.', 'lisfranc'),
    },
    selfCheck: quiz('Which metatarsal normally articulates with the intermediate cuneiform distally?', 'The second metatarsal. That anatomical relationship does not create an individually identified metatarsal within this specimen\'s unresolved foot-bone group.', 'midfootBones'),
  },
  'lateral-cuneiform': {
    modelLimit: 'The lateral cuneiform is not the cuboid. No third-ray fracture, ligament tear or calibrated tarsometatarsal spacing is assigned to this intact reference bone.',
    topics: {
      ...reuse('foot', 'cuneiforms', 'midfootBones', 'lisfranc'),
      xray: draft('Interpret the cuneiform with neighbouring midfoot joints; radiographic alignment is not the same as exploded reference spacing.', 'lisfranc'),
      ct: draft('CT may define complex midfoot fractures and joint involvement; a single selected cuneiform does not describe the entire injury.', 'lisfranc'),
    },
    selfCheck: quiz('Is the lateral cuneiform another name for the cuboid?', 'No. They are distinct supplied tarsal bones and retain separate selections in this specimen.'),
  },
};
