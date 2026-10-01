import type { SpecimenGuidedStepSource } from './specimen-guided-dissection';

// Source-slug visibility plans for the incomplete right adult limb. The owning
// adapter resolves these against its admitted catalog and binds source revision.
const hipThighSteps: SpecimenGuidedStepSource[] = [
  {
    id: 'um-hip-bone-cartilage', title: 'Hip source context',
    caption: 'Compare the whole pelvis group and femur with the supplied femoral head cartilage. Acetabular cartilage, labrum and capsule are not supplied.',
    slugs: ['pelvis-group', 'femur', 'femoral-head-cartilage'], selected: 'femoral-head-cartilage', view: 'anterior',
  },
  {
    id: 'um-hip-gluteal-surface', title: 'Gluteal surfaces',
    caption: 'Show the supplied gluteal and tensor fasciae latae surfaces with whole-bone context. Select gluteus maximus before comparing the other source selections.',
    slugs: ['pelvis-group', 'femur', 'gluteus-maximus', 'gluteus-medius', 'gluteus-minimus', 'tensor-fasciae-latae'], selected: 'gluteus-maximus', view: 'posterior',
  },
  {
    id: 'um-hip-gluteal-compare', title: 'Compare gluteal muscles',
    caption: 'Hide gluteus maximus to inspect the remaining supplied gluteal surfaces. This visibility change does not define a dissection plane.',
    slugs: ['pelvis-group', 'femur', 'gluteus-medius', 'gluteus-minimus', 'tensor-fasciae-latae'], selected: 'gluteus-medius', view: 'posterior',
  },
  {
    id: 'um-hip-short-rotators', title: 'Short rotator surfaces',
    caption: 'Compare the six named short rotator source surfaces after hiding the gluteal selections. Their tendon footprints and nearby nerves are not mapped.',
    slugs: ['pelvis-group', 'femur', 'piriformis', 'superior-gemellus', 'inferior-gemellus', 'obturator-internus', 'obturator-externus', 'quadratus-femoris'], selected: 'piriformis', view: 'posterior',
  },
  {
    id: 'um-hip-flexors', title: 'Iliacus and psoas',
    caption: 'Turn to the anterior view to compare the separate iliacus and psoas major selections against the same whole bones. The lumbar plexus is absent.',
    slugs: ['pelvis-group', 'femur', 'iliacus', 'psoas-major'], selected: 'iliacus', view: 'anterior',
  },
  {
    id: 'um-thigh-medial', title: 'Medial thigh surfaces',
    caption: 'Compare the supplied adductor, gracilis and pectineus surfaces. Source fragments retain their original names and are not new muscles.',
    slugs: ['pelvis-group', 'femur', 'adductor-longus', 'adductor-brevis', 'adductor-magnus', 'gracilis', 'pectineus'], selected: 'adductor-longus', view: 'anterior',
  },
  {
    id: 'um-thigh-anterior', title: 'Anterior thigh surfaces',
    caption: 'Show rectus femoris, the three supplied vasti and sartorius with the original femur, patella and extensor tissues.',
    slugs: ['femur', 'patella', 'rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius', 'sartorius', 'quadriceps-tendon', 'patellar-ligament'], selected: 'rectus-femoris', view: 'anterior',
  },
  {
    id: 'um-thigh-vasti', title: 'Compare the vasti',
    caption: 'Hide rectus femoris to inspect the three supplied vastus surfaces with the whole femur and patella. This is a visibility comparison of source meshes.',
    slugs: ['femur', 'patella', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius', 'quadriceps-tendon', 'patellar-ligament'], selected: 'vastus-intermedius', view: 'anterior',
  },
  {
    id: 'um-thigh-posterior', title: 'Posterior thigh surfaces',
    caption: 'Turn posteriorly to compare both separately named biceps femoris heads with semimembranosus and semitendinosus. Whole femur, tibia and fibula remain in source position.',
    slugs: ['femur', 'tibia', 'fibula', 'biceps-femoris-long-head', 'biceps-femoris-short-head', 'semimembranosus', 'semitendinosus'], selected: 'biceps-femoris-long-head', view: 'posterior',
  },
];

const kneeSteps: SpecimenGuidedStepSource[] = [
  {
    id: 'um-knee-overview', title: 'Knee source overview',
    caption: 'Survey all 15 supplied knee surfaces. The long bones remain whole; this incomplete source does not represent the full joint.',
    slugs: ['femur', 'tibia', 'fibula', 'patella', 'femoral-cartilage', 'tibial-cartilage', 'patellar-cartilage', 'acl', 'pcl', 'mcl', 'lcl', 'patellar-ligament', 'meniscus-group', 'quadriceps-tendon', 'popliteus'], selected: 'patella', view: 'anterior',
  },
  {
    id: 'um-knee-extensor', title: 'Extensor tissues',
    caption: 'Compare the quadriceps tendon, whole patella and patellar ligament with the original bones. No quadriceps muscle is included in this knee source view.',
    slugs: ['femur', 'tibia', 'fibula', 'patella', 'quadriceps-tendon', 'patellar-ligament', 'patellar-cartilage'], selected: 'quadriceps-tendon', view: 'anterior',
  },
  {
    id: 'um-knee-collateral', title: 'Collateral ligaments',
    caption: 'Hide extensor tissues to compare the two named collateral ligament surfaces with whole-bone context. Their attachment footprints are not defined.',
    slugs: ['femur', 'tibia', 'fibula', 'patella', 'mcl', 'lcl'], selected: 'mcl', view: 'anterior',
  },
  {
    id: 'um-knee-articular', title: 'Cartilage and menisci',
    caption: 'With bones hidden, compare the supplied cartilage surfaces and the single grouped meniscus selection. Medial and lateral menisci are not labelled separately.',
    slugs: ['femoral-cartilage', 'tibial-cartilage', 'patellar-cartilage', 'meniscus-group'], selected: 'meniscus-group', view: 'superior',
  },
  {
    id: 'um-knee-cruciate', title: 'Cruciate ligaments',
    caption: 'Compare the ACL and PCL selections beside the whole tibia, fibula and grouped meniscus source. Hiding the femur is only a visibility change.',
    slugs: ['tibia', 'fibula', 'meniscus-group', 'acl', 'pcl'], selected: 'acl', view: 'anterior',
  },
  {
    id: 'um-knee-posterior', title: 'Posterior source surfaces',
    caption: 'Turn posteriorly to inspect popliteus alongside the supplied PCL and LCL surfaces. The joint capsule, nerves and vessels are absent.',
    slugs: ['femur', 'tibia', 'fibula', 'pcl', 'lcl', 'popliteus'], selected: 'popliteus', view: 'posterior',
  },
];

/** Detached declarative plans; only an admitted source-bound adapter may use them. */
export function umProximalGuideSteps(scope: 'hip-thigh' | 'knee'): SpecimenGuidedStepSource[] {
  return structuredClone(scope === 'hip-thigh' ? hipThighSteps : kneeSteps);
}
