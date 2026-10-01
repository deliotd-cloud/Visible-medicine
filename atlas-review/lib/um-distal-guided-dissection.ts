import type { SpecimenGuidedStepSource } from './specimen-guided-dissection';

// Visibility comparisons of admitted source slugs. The owning adapter binds
// source revision and validates membership before exposing a draft guide.
const calfSteps: SpecimenGuidedStepSource[] = [
  {
    id: 'um-calf-overview', title: 'Calf source overview',
    caption: 'Survey all supplied calf surfaces with whole tibia, fibula and calcaneus. This incomplete specimen does not show every calf tissue.',
    slugs: ['tibia', 'fibula', 'calcaneus', 'popliteus', 'gastrocnemius-medial', 'gastrocnemius-lateral', 'soleus', 'achilles-tendon', 'tibialis-posterior', 'flexor-digitorum-longus', 'flexor-hallucis-longus', 'tibialis-anterior', 'extensor-digitorum-longus', 'extensor-hallucis-longus', 'peroneus-longus'],
    selected: 'soleus', view: 'posterior',
  },
  {
    id: 'um-calf-superficial', title: 'Posterior calf surfaces',
    caption: 'Compare the two separately named gastrocnemius heads with soleus and the supplied calcaneal tendon. The bones remain whole.',
    slugs: ['tibia', 'fibula', 'calcaneus', 'gastrocnemius-medial', 'gastrocnemius-lateral', 'soleus', 'achilles-tendon'],
    selected: 'gastrocnemius-medial', view: 'posterior',
  },
  {
    id: 'um-calf-soleus', title: 'Compare soleus',
    caption: 'Hide both gastrocnemius selections to inspect the supplied soleus surface beside the original calcaneal tendon.',
    slugs: ['tibia', 'fibula', 'calcaneus', 'soleus', 'achilles-tendon'],
    selected: 'soleus', view: 'posterior',
  },
  {
    id: 'um-calf-deep-posterior', title: 'Deep posterior surfaces',
    caption: 'Compare popliteus, tibialis posterior and the two supplied long flexor surfaces with whole-bone context. Nearby nerves and vessels are absent.',
    slugs: ['tibia', 'fibula', 'calcaneus', 'popliteus', 'tibialis-posterior', 'flexor-digitorum-longus', 'flexor-hallucis-longus'],
    selected: 'tibialis-posterior', view: 'posterior',
  },
  {
    id: 'um-calf-anterior', title: 'Anterior calf surfaces',
    caption: 'Turn anteriorly to compare tibialis anterior with the supplied long extensor surfaces. Retinacula are not supplied.',
    slugs: ['tibia', 'fibula', 'tibialis-anterior', 'extensor-digitorum-longus', 'extensor-hallucis-longus'],
    selected: 'tibialis-anterior', view: 'anterior',
  },
  {
    id: 'um-calf-fibularis', title: 'Fibularis longus',
    caption: 'Inspect the single supplied fibularis (peroneus) longus selection beside the whole tibia, fibula and calcaneus. Fibularis brevis is absent.',
    slugs: ['tibia', 'fibula', 'calcaneus', 'peroneus-longus'],
    selected: 'peroneus-longus', view: 'right',
  },
  {
    id: 'um-calf-calcaneal-tendon', title: 'Calcaneal tendon',
    caption: 'Return posteriorly to compare the original calcaneal tendon surface with calcaneus, soleus and both gastrocnemius selections. Source continuity is not validated.',
    slugs: ['tibia', 'fibula', 'calcaneus', 'gastrocnemius-medial', 'gastrocnemius-lateral', 'soleus', 'achilles-tendon'],
    selected: 'achilles-tendon', view: 'posterior',
  },
];

const footBones = ['calcaneus', 'cuboid', 'intermediate-cuneiform', 'lateral-cuneiform', 'medial-cuneiform', 'navicular', 'foot-bone-group', 'talus'];
const footSteps: SpecimenGuidedStepSource[] = [
  {
    id: 'um-foot-bones', title: 'Source foot bones',
    caption: 'Compare the separate tarsal surfaces from above. The source Phalanges surface stays one foot-bone group, without digit or bone numbering.',
    slugs: footBones, selected: 'talus', view: 'superior',
  },
  {
    id: 'um-foot-ankle-extensors', title: 'Anterior ankle surfaces',
    caption: 'Compare the whole tibialis anterior and long extensor source surfaces with tibia, fibula, talus and calcaneus. Tendon footprints are not mapped.',
    slugs: ['tibia', 'fibula', 'talus', 'calcaneus', 'tibialis-anterior', 'extensor-digitorum-longus', 'extensor-hallucis-longus'],
    selected: 'tibialis-anterior', view: 'anterior',
  },
  {
    id: 'um-foot-plantar', title: 'Plantar source muscles',
    caption: 'Turn below the foot to compare the supplied abductor, flexor digitorum brevis and quadratus plantae surfaces against whole source bones. Plantar coverage is partial.',
    slugs: [...footBones, 'abductor-hallucis', 'abductor-digiti-minimi', 'flexor-digitorum-brevis', 'quadratus-plantae'],
    selected: 'flexor-digitorum-brevis', view: 'inferior',
  },
  {
    id: 'um-foot-quadratus', title: 'Compare quadratus plantae',
    caption: 'Hide flexor digitorum brevis to inspect the supplied quadratus plantae selection with the remaining plantar source muscles and whole bones.',
    slugs: [...footBones, 'abductor-hallucis', 'abductor-digiti-minimi', 'quadratus-plantae'],
    selected: 'quadratus-plantae', view: 'inferior',
  },
  {
    id: 'um-foot-dorsal', title: 'Dorsal source muscle',
    caption: 'Return above the foot to inspect the single extensor digitorum brevis source selection. No separate extensor hallucis brevis surface is labelled.',
    slugs: [...footBones, 'extensor-digitorum-brevis'],
    selected: 'extensor-digitorum-brevis', view: 'superior',
  },
  {
    id: 'um-foot-long-flexors', title: 'Long flexor surfaces',
    caption: 'Compare tibialis posterior and the supplied long flexor surfaces with whole ankle bones. This visibility view does not map a tunnel or nerve route.',
    slugs: ['tibia', 'fibula', 'talus', 'calcaneus', 'tibialis-posterior', 'flexor-digitorum-longus', 'flexor-hallucis-longus'],
    selected: 'tibialis-posterior', view: 'posterior',
  },
  {
    id: 'um-foot-fibularis', title: 'Fibularis longus context',
    caption: 'Inspect the supplied whole fibularis longus surface with tibia, fibula and foot source bones. No fibularis brevis, retinaculum or validated plantar tendon route is added.',
    slugs: ['tibia', 'fibula', ...footBones, 'peroneus-longus'],
    selected: 'peroneus-longus', view: 'right',
  },
  {
    id: 'um-foot-calcaneal-tendon', title: 'Calcaneal tendon',
    caption: 'Compare the original calcaneal tendon selection with calcaneus, talus, tibia and fibula. No attachment footprint or tendon repair is represented.',
    slugs: ['tibia', 'fibula', 'talus', 'calcaneus', 'achilles-tendon'],
    selected: 'achilles-tendon', view: 'posterior',
  },
];

/** Detached source-slug plans for the admitted calf and foot specimens. */
export function umDistalGuideSteps(scope: 'calf' | 'foot'): SpecimenGuidedStepSource[] {
  return structuredClone(scope === 'calf' ? calfSteps : footSteps);
}
