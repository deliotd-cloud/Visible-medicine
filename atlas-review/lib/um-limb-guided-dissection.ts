import { limbDefinitions, type LimbScope } from './um-limb-studies';
import { canonicalSpecimenValue } from './specimen-links';
import { umProximalGuideSteps } from './um-proximal-guided-dissection';
import { umDistalGuideSteps } from './um-distal-guided-dissection';
import type { SpecimenDefinition } from './independent-specimen';
import type { SpecimenGuidedDissection, SpecimenGuidedStepSource } from './specimen-guided-dissection';

// Capture the complete admitted definitions, including bundle hashes, coordinate
// transforms, studies, geometry identities and omissions. Do not match by name.
const admitted = new Map(Object.entries(limbDefinitions).map(([scope, definition]) =>
  [definition.key, { scope: scope as LimbScope, fingerprint: canonicalSpecimenValue(definition) }]));
const sourceCameraBounds = JSON.parse(JSON.stringify(Object.fromEntries(
  Object.entries(limbDefinitions).map(([scope, definition]) => [scope, definition.closeUp]),
))) as Record<LimbScope, SpecimenDefinition['closeUp']>;

const wholeCameraScopes: Readonly<Record<string, 'hip-thigh' | 'knee' | 'foot'>> = {
  'whole-gluteal': 'hip-thigh', 'whole-hip-cartilage': 'hip-thigh',
  'whole-short-rotators': 'hip-thigh', 'whole-hip-flexors': 'hip-thigh',
  'whole-medial-thigh': 'hip-thigh', 'whole-extensor': 'hip-thigh',
  'whole-posterior-thigh': 'hip-thigh', 'whole-articular-knee': 'knee',
  'whole-knee': 'knee', 'whole-foot-bones': 'foot',
  'whole-plantar': 'foot', 'whole-dorsal': 'foot',
};

const wholeSteps: SpecimenGuidedStepSource[] = [
  { id: 'whole-source-skeleton', title: 'Whole-limb source context',
    caption: 'Begin with the supplied pelvis group and whole long bones, then compare talus and calcaneus. This is one incomplete right-limb specimen, separate from the whole-body atlas.',
    slugs: ['pelvis-group', 'femur', 'tibia', 'fibula', 'patella', 'talus', 'calcaneus'], selected: 'femur', view: 'anterior' },
  { id: 'whole-gluteal', title: 'Gluteal comparison',
    caption: 'Show the three gluteal source selections and tensor fasciae latae with pelvis and femur context. Select gluteus maximus; the source contains no sciatic nerve.',
    slugs: ['pelvis-group', 'femur', 'gluteus-maximus', 'gluteus-medius', 'gluteus-minimus', 'tensor-fasciae-latae'], selected: 'gluteus-maximus', view: 'posterior' },
  { id: 'whole-hip-cartilage', title: 'Hip source cartilage',
    caption: 'Compare the supplied femoral head cartilage with the original femur and pelvis group. No acetabular cartilage, capsule or labrum is supplied.',
    slugs: ['pelvis-group', 'femur', 'femoral-head-cartilage'], selected: 'femoral-head-cartilage', view: 'anterior' },
  { id: 'whole-short-rotators', title: 'Short rotator comparison',
    caption: 'Hide the gluteal selections and compare the supplied short rotator surfaces. Visibility changes are not validated surgical planes or tendon footprints.',
    slugs: ['pelvis-group', 'femur', 'piriformis', 'superior-gemellus', 'inferior-gemellus', 'obturator-internus', 'obturator-externus', 'quadratus-femoris'], selected: 'piriformis', view: 'posterior' },
  { id: 'whole-hip-flexors', title: 'Iliacus and psoas context',
    caption: 'Compare the separate iliacus and psoas major source surfaces with pelvis and femur. Lumbar vertebrae and plexus are not supplied.',
    slugs: ['pelvis-group', 'femur', 'iliacus', 'psoas-major'], selected: 'iliacus', view: 'anterior' },
  { id: 'whole-medial-thigh', title: 'Medial thigh comparison',
    caption: 'Compare the supplied adductor, gracilis and pectineus selections in their unchanged source positions. Nerves, vessels and fascia are not reconstructed.',
    slugs: ['pelvis-group', 'femur', 'adductor-longus', 'adductor-brevis', 'adductor-magnus', 'gracilis', 'pectineus'], selected: 'adductor-longus', view: 'anterior' },
  { id: 'whole-extensor', title: 'Thigh extensor context',
    caption: 'Compare the four quadriceps muscle selections, nearby sartorius and supplied extensor tissues. No mechanical continuity or attachment map is inferred.',
    slugs: ['femur', 'tibia', 'patella', 'rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius', 'sartorius', 'quadriceps-tendon', 'patellar-ligament'], selected: 'rectus-femoris', view: 'anterior' },
  { id: 'whole-posterior-thigh', title: 'Posterior thigh comparison',
    caption: 'Compare the two separately named biceps femoris heads, semimembranosus and semitendinosus with unchanged long-bone context. This is not a sciatic nerve dissection.',
    slugs: ['femur', 'tibia', 'fibula', 'biceps-femoris-long-head', 'biceps-femoris-short-head', 'semimembranosus', 'semitendinosus'], selected: 'biceps-femoris-long-head', view: 'posterior' },
  { id: 'whole-articular-knee', title: 'Articular knee selections',
    caption: 'Hide the bones to compare the supplied cartilage, collateral ligament and grouped meniscus surfaces. No complete joint or individual meniscus segmentation is inferred.',
    slugs: ['femoral-cartilage', 'tibial-cartilage', 'patellar-cartilage', 'mcl', 'lcl', 'meniscus-group'], selected: 'meniscus-group', view: 'superior' },
  { id: 'whole-knee', title: 'Knee cruciate context',
    caption: 'Hide the femur and extensor selections to inspect the ACL and PCL surfaces with tibia, fibula and the grouped meniscus source. The menisci are not individually segmented.',
    slugs: ['tibia', 'fibula', 'acl', 'pcl', 'meniscus-group'], selected: 'acl', view: 'anterior' },
  { id: 'whole-calf', title: 'Posterior calf comparison',
    caption: 'Compare both gastrocnemius source selections, soleus and the calcaneal tendon with tibia, fibula and calcaneus. Plantaris and peripheral neurovascular anatomy are absent.',
    slugs: ['tibia', 'fibula', 'calcaneus', 'gastrocnemius-medial', 'gastrocnemius-lateral', 'soleus', 'achilles-tendon'], selected: 'soleus', view: 'posterior' },
  { id: 'whole-deep-calf', title: 'Deep posterior selections',
    caption: 'Hide the superficial posterior selections and compare tibialis posterior, the long flexors and popliteus. This partial source view does not reconstruct the tarsal tunnel.',
    slugs: ['tibia', 'fibula', 'calcaneus', 'tibialis-posterior', 'flexor-digitorum-longus', 'flexor-hallucis-longus', 'popliteus'], selected: 'tibialis-posterior', view: 'posterior' },
  { id: 'whole-fibularis', title: 'Fibularis longus selection',
    caption: 'Compare the supplied whole fibularis longus selection with tibia, fibula and calcaneus. Fibularis brevis and retinacula are absent.',
    slugs: ['tibia', 'fibula', 'calcaneus', 'peroneus-longus'], selected: 'peroneus-longus', view: 'right' },
  { id: 'whole-foot-bones', title: 'Foot source context',
    caption: 'Compare the separately named tarsal surfaces with the supplied Phalanges group. Individual digits, metatarsal identities and complete foot joints are not added by this guide.',
    slugs: ['talus', 'calcaneus', 'navicular', 'cuboid', 'medial-cuneiform', 'intermediate-cuneiform', 'lateral-cuneiform', 'foot-bone-group'], selected: 'talus', view: 'superior' },
  { id: 'whole-plantar', title: 'Partial plantar muscles',
    caption: 'Show the four supplied plantar muscle selections with the foot source bones. Select flexor digitorum brevis; this is not a complete four-layer plantar dissection.',
    slugs: ['talus', 'calcaneus', 'navicular', 'cuboid', 'medial-cuneiform', 'intermediate-cuneiform', 'lateral-cuneiform', 'foot-bone-group', 'flexor-digitorum-brevis', 'abductor-hallucis', 'abductor-digiti-minimi', 'quadratus-plantae'], selected: 'flexor-digitorum-brevis', view: 'inferior' },
  { id: 'whole-dorsal', title: 'Dorsal source comparison',
    caption: 'Finish with the supplied extensor digitorum brevis and long anterior muscle/tendon surfaces. Separate extensor hallucis brevis, retinacula and insertion footprints are not mapped.',
    slugs: ['tibia', 'fibula', 'talus', 'calcaneus', 'foot-bone-group', 'extensor-digitorum-brevis', 'tibialis-anterior', 'extensor-digitorum-longus', 'extensor-hallucis-longus'], selected: 'extensor-digitorum-brevis', view: 'superior' },
];

/** One collapsed guided-learning sequence per exact admitted UM regional scope. */
export function umLimbGuidedDissection(definition: SpecimenDefinition): SpecimenGuidedDissection | null {
  const binding = admitted.get(definition.key);
  if (!binding || canonicalSpecimenValue(definition) !== binding.fingerprint) return null;
  const { scope } = binding;
  const plan = scope === 'whole' ? structuredClone(wholeSteps)
    : scope === 'hip-thigh' || scope === 'knee' ? umProximalGuideSteps(scope) : umDistalGuideSteps(scope);
  const bySlug = new Map(definition.surfaces.map(surface => [surface.slug, surface.id]));
  const steps = plan.map(step => {
    const ids = step.slugs.map(slug => bySlug.get(slug));
    const selectedId = bySlug.get(step.selected);
    if (!ids.length || ids.some(id => !id) || !selectedId || !ids.includes(selectedId)
      || new Set(ids).size !== ids.length) return null;
    const cameraScope = scope === 'whole' ? wholeCameraScopes[step.id] : undefined;
    const cameraBounds = cameraScope ? sourceCameraBounds[cameraScope] : null;
    return { id: step.id, title: step.title, caption: step.caption,
      ids: ids as string[], selectedId, view: step.view,
      ...(cameraBounds ? { cameraBounds: structuredClone(cameraBounds) } : {}) };
  });
  if (steps.some(step => !step) || new Set(steps.map(step => step?.id)).size !== steps.length) return null;
  return structuredClone({
    id: `um-${scope}-source-guide`, title: `${definition.label} · source-guided dissection`, status: 'draft',
    specimenKey: definition.key, sourceFrame: 'um-5t6tz7-v1-2:source-lps',
    limitation: 'Incomplete right-limb source surfaces. Guided visibility and camera changes do not validate anatomical boundaries, surgical planes, source orientation, tendon continuity or scan registration. No absent nerve, vessel or tissue is reconstructed. Radiologist review remains required.',
    steps,
  } as SpecimenGuidedDissection);
}
