// Original, source-bound teaching drafts. References are linked, not reproduced.
// These describe usual human anatomy; the UM surfaces do not contain vascular anatomy.
export type SpecimenDepthNote = { body: string; references: Array<{ title: string; url: string }> };
export type SpecimenDepthLesson = {
  status: 'draft';
  revision: string;
  reviewScope?: 'calf-depth' | 'thigh-depth';
  relationships: SpecimenDepthNote;
  arterialSupply: SpecimenDepthNote;
  clinicalPitfall: SpecimenDepthNote;
  modelLimit: string;
};

const table = { title: 'Texas Tech · Lower-limb muscle anatomy', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html' };
const arterial = { title: 'NCBI Bookshelf · Lower-limb arteries', url: 'https://www.ncbi.nlm.nih.gov/books/NBK544319/?report=classic' };
const leg = { title: 'NCBI Bookshelf · Leg anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537024/' };
const anterior = { title: 'NCBI Bookshelf · Tibialis anterior anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK513304/' };
const fhl = { title: 'NCBI Bookshelf · Flexor hallucis longus anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539776/?report=printable' };
const foot = { title: 'NCBI Bookshelf · Foot muscles', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539705/?report=printable' };
const popliteusStudy = { title: 'Jeon et al. · Popliteus arterial dissection (2022)', url: 'https://pubmed.ncbi.nlm.nih.gov/35047639/' };
const tennisLeg = { title: 'Delgado et al. · Tennis-leg ultrasound differential (2002)', url: 'https://pubmed.ncbi.nlm.nih.gov/12091669/' };
const note = (body: string, ...references: SpecimenDepthNote['references']): SpecimenDepthNote => ({ body, references });
const revision = 'um-calf-depth-20261005-v1';

export const umCalfDepth: Record<string, SpecimenDepthLesson> = {
  'tibialis-anterior': {
    status: 'draft', revision,
    relationships: note('In the anterior leg, tibialis anterior lies beside the long toe extensors. Its tendon passes most medially across the front of the ankle; the anterior tibial vessels continue deeper in this compartment.', anterior),
    arterialSupply: note('Branches of the anterior tibial artery typically supply the muscle in the anterior leg.', table, arterial),
    clinicalPitfall: note('A visible anterior tendon course does not identify a cause of weak dorsiflexion. Tendon injury, muscle injury and neurological causes require separate assessment; the adjacent vessels and deep fibular nerve are absent here.', anterior),
    modelLimit: 'The surface shows no extensor retinacula, compartment fascia, vessels or nerves. It cannot measure perfusion, pressure or simulate foot drop.',
  },
  'tibialis-posterior': {
    status: 'draft', revision,
    relationships: note('Tibialis posterior is deep to soleus in the posterior leg. At the medial ankle its tendon passes anterior to flexor digitorum longus, then turns toward the medial foot beneath the flexor retinaculum.', leg),
    arterialSupply: note('Branches of posterior tibial and fibular arteries commonly contribute to its muscle supply.', table, arterial),
    clinicalPitfall: note('The medial ankle tendon is one element of arch support. A separated reference muscle cannot demonstrate weight-bearing arch collapse or distinguish tendon disease from ligament and joint pathology.', leg, foot),
    modelLimit: 'Flexor retinaculum, detailed fascia, vessels, nerves and distal tendon slips are absent. No perfusion, load or deformity simulation is available.',
  },
  'flexor-digitorum-longus': {
    status: 'draft', revision,
    relationships: note('Flexor digitorum longus starts in the deep posterior leg. Its tendon crosses behind the medial malleolus, posterior to tibialis posterior, then travels into the sole where quadratus plantae joins the long-flexor apparatus.', foot),
    arterialSupply: note('The posterior tibial artery is a typical arterial source for this deep posterior muscle.', table, arterial),
    clinicalPitfall: note('At the medial ankle, an apparent long-flexor course is not a complete tarsal-tunnel map. The nerve and vessels are unsegmented, and four separate digital tendon slips are not validated.', foot),
    modelLimit: 'The surface lacks flexor retinaculum, compartment fascia, vessels, nerves and validated individual toe slips. It cannot measure perfusion or simulate entrapment.',
  },
  'flexor-hallucis-longus': {
    status: 'draft', revision,
    relationships: note('Flexor hallucis longus lies lateral to the other deep posterior flexors. Its tendon passes behind the medial ankle, courses under the sustentaculum tali and continues toward the great toe beneath the sole.', fhl),
    arterialSupply: note('Fibular and posterior tibial arterial branches commonly contribute to flexor hallucis longus.', table, arterial),
    clinicalPitfall: note('Posteromedial ankle pain should not be assigned to this tendon from position alone. Dynamic tendon motion, its sheath and neighboring neurovascular structures require examination beyond the static muscle surface.', fhl),
    modelLimit: 'Tendon sheath, retinaculum, fascia, vessels and nerves are absent. The surface cannot show tendon motion, impingement, perfusion or disease.',
  },
  'peroneus-longus': {
    status: 'draft', revision,
    relationships: note('Fibularis longus, named peroneus longus in the source, lies superficial to fibularis brevis laterally. Its tendon turns behind the lateral malleolus and crosses the sole toward the medial cuneiform and first metatarsal.', foot),
    arterialSupply: note('Branches of the fibular artery usually supply this lateral-compartment muscle.', table, arterial),
    clinicalPitfall: note('Lateral ankle pain cannot be assigned to longus from this muscle selection. Brevis, retinacula, tendon sheath and dynamic instability need separate evaluation; the displayed separation is only a viewing control.', table),
    modelLimit: 'Lateral compartment fascia, retinacula, vessels and nerves are absent. Brevis and tendon sheath are not validated disease models; no perfusion or instability is simulated.',
  },
  soleus: {
    status: 'draft', revision,
    relationships: note('Soleus lies deep to both gastrocnemius heads and superficial to the deep posterior leg muscles. Its aponeurotic contribution joins the gastrocnemius contribution in the calcaneal tendon; popliteal structures lie more proximally.', leg),
    arterialSupply: note('Popliteal, posterior tibial and fibular arterial branches contribute; their relative contributions can vary.', arterial),
    clinicalPitfall: note('Separating soleus from gastrocnemius does not expose an injury plane. A deeper calf lesion may need targeted imaging; static muscle spacing does not grade strain or identify venous disease.', leg, tennisLeg),
    modelLimit: 'Intramuscular aponeuroses, compartment fascia, vessels and nerves are absent. No perfusion, strain, compartment pressure or venous disease is simulated.',
  },
  'gastrocnemius-medial': {
    status: 'draft', revision,
    relationships: note('The medial gastrocnemius head is superficial to soleus and joins the lateral head in the calcaneal tendon apparatus. Plantaris may course between these posterior calf structures; the popliteal fossa lies proximally.', leg),
    arterialSupply: note('Sural branches of the popliteal artery and posterior tibial branches typically contribute.', table, arterial),
    clinicalPitfall: note('A medial calf lesion may involve gastrocnemius, plantaris or neighboring tissues. The tennis-leg ultrasound series also evaluated venous thrombosis; this reference surface cannot rule out a vascular cause.', tennisLeg),
    modelLimit: 'Plantaris course, detailed fascia, vessels and nerves are absent. The head cannot display fluid, tear, thrombosis or measured perfusion.',
  },
  'gastrocnemius-lateral': {
    status: 'draft', revision,
    relationships: note('The lateral head occupies the superficial posterolateral calf beside the medial head, with soleus deep to both. Their distal contributions converge toward the calcaneal tendon; the lateral head borders the popliteal fossa.', table, leg),
    arterialSupply: note('Sural branches from the popliteal artery, with posterior tibial contributions, typically supply gastrocnemius.', table, arterial),
    clinicalPitfall: note('Evidence about medial-head tennis leg does not establish a lateral-head injury frequency. Lateral calf pain requires its own tissue assessment, including nearby tendon and nonmuscular causes.', tennisLeg),
    modelLimit: 'Detailed fascia, vessels and nerves are absent. This head cannot show a tear, venous disorder, measured perfusion or disease progression.',
  },
  popliteus: {
    status: 'draft', revision,
    relationships: note('Popliteus crosses the posterior knee deep to the superficial calf muscles, with its muscle belly on the posterior proximal tibia. Its tendon relates to the lateral knee; adjacent popliteal vessels are not represented.', popliteusStudy),
    arterialSupply: note('Inferior medial genicular, posterior tibial and sometimes anterior tibial branches contribute variably; no single source is universal.', popliteusStudy),
    clinicalPitfall: note('An isolated popliteus surface is not the complete posterolateral corner. Its appearance cannot establish tendon injury or knee instability, and an artery inferred from a generic diagram may miss normal variation.', popliteusStudy),
    modelLimit: 'Capsular and fascial details, vessels and nerves are absent. No arterial entry, perfusion, tendon injury or knee instability is simulated.',
  },
};
