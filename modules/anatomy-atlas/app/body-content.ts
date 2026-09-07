import {
  structures as shoulderStructures,
  type ContentTab,
  type ContentSection,
} from './anatomy-data';
import type { BodyStructure } from './body-types';
import { neuroGroupFor } from '../lib/neuroanatomy';
import { axialGroupFor } from '../lib/axial-anatomy';
import { headDetailGroupFor } from '../lib/head-detail';
import { intestinalJunction } from '../lib/intestinal-junction';
import { mesentericGroupFor } from '../lib/mesenteric-anatomy';
import { pancreaticGroupFor } from '../lib/pancreatic-anatomy';
import { thoracicGroupFor } from '../lib/thoracic-anatomy';
import { handVascularGroupFor } from '../lib/hand-vascular-anatomy';
import { handVenousGroupFor } from '../lib/hand-venous-anatomy';
import { footVascularGroupFor } from '../lib/foot-vascular-anatomy';
import { ocularGroupFor } from '../lib/ocular-anatomy';
import { laryngealGroupFor } from '../lib/laryngeal-anatomy';
import { forearmVascularGroupFor } from '../lib/forearm-vascular-anatomy';
import { draftLesson, type ContentLesson } from '../lib/content-types';
import { shoulderArmLesson } from '../lib/shoulder-arm-curriculum';
import { forearmMuscleLesson } from '../lib/forearm-curriculum';
import { handMuscleLesson } from '../lib/hand-curriculum';
import { thighMuscleLesson } from '../lib/thigh-curriculum';
import { legMuscleLesson } from '../lib/leg-curriculum';
import { footMuscleLesson } from '../lib/foot-curriculum';
import { pelvicMuscleLesson } from '../lib/pelvic-curriculum';
import { orbitalMuscleLesson } from '../lib/orbital-curriculum';
import { swallowingMuscleLesson } from '../lib/swallowing-curriculum';

// Original short educational notes, not imported textbook prose. Review pending.
const functions: Record<string, string> = {
  FMA7088:
    'The heart generates the pressure that drives pulmonary and systemic blood flow.',
  FMA7309:
    'The right lung supports exchange of oxygen and carbon dioxide between air and blood.',
  FMA7310:
    'The left lung supports exchange of oxygen and carbon dioxide between air and blood.',
  FMA7197:
    'The liver processes absorbed nutrients, produces bile and participates in metabolism and synthesis of plasma proteins.',
  FMA7198:
    'The pancreas contributes digestive secretions and releases hormones involved in glucose regulation.',
  FMA7148:
    'The stomach stores and mixes a meal and begins chemical digestion before gastric contents enter the duodenum.',
  FMA7200:
    'The small intestine is a major site of digestion and nutrient absorption.',
  FMA7201:
    'The large intestine absorbs water and electrolytes and conveys residual material towards elimination.',
  FMA7202: 'The gallbladder stores and concentrates bile between meals.',
  FMA7204:
    'The kidney filters blood and adjusts water, electrolyte and acid–base balance through urine formation.',
  FMA7205:
    'The kidney filters blood and adjusts water, electrolyte and acid–base balance through urine formation.',
  FMA15900: 'The urinary bladder stores urine before coordinated emptying.',
  FMA7131:
    'The esophagus conveys swallowed material from the pharynx to the stomach.',
  FMA7394: 'The trachea conducts air between the larynx and the main bronchi.',
  FMA7196: 'The spleen filters blood and contributes to immune surveillance.',
  FMA15629:
    'The adrenal gland releases hormones involved in stress responses and regulation of metabolism and fluid balance.',
  FMA15630:
    'The adrenal gland releases hormones involved in stress responses and regulation of metabolism and fluid balance.',
  FMA50801:
    'The brain integrates sensory information and supports movement, cognition and regulation of bodily functions.',
};
/** Display API: omit editorial metadata, retaining the ContentSection shape. */
export function bodyContent(s: BodyStructure, tab: ContentTab): ContentSection {
  const { readiness: _readiness, ...section } = bodyLesson(s, tab);
  return section;
}

/** Readiness belongs to the authoring branch, never inferred from its title. */
export function bodyLesson(s: BodyStructure, tab: ContentTab): ContentLesson {
  const existing = shoulderStructures.find((item) =>
    item.sourceFmaIds?.includes(s.fmaId),
  );
  if (existing) return draftLesson(existing.sections[tab]);
  const shoulderArm = shoulderArmLesson(s, tab);
  if (shoulderArm) return shoulderArm;
  const forearmMuscle = forearmMuscleLesson(s, tab);
  if (forearmMuscle) return forearmMuscle;
  const handMuscle = handMuscleLesson(s, tab);
  if (handMuscle) return handMuscle;
  const thighMuscle = thighMuscleLesson(s, tab);
  if (thighMuscle) return thighMuscle;
  const legMuscle = legMuscleLesson(s, tab);
  if (legMuscle) return legMuscle;
  const footMuscle = footMuscleLesson(s, tab);
  if (footMuscle) return footMuscle;
  const pelvicMuscle = pelvicMuscleLesson(s, tab);
  if (pelvicMuscle) return pelvicMuscle;
  const orbitalMuscle = orbitalMuscleLesson(s, tab);
  if (orbitalMuscle) return orbitalMuscle;
  const swallowingMuscle = swallowingMuscleLesson(s, tab);
  if (swallowingMuscle) return swallowingMuscle;
  const axial =
    axialGroupFor(s.fmaId) ??
    headDetailGroupFor(s.fmaId) ??
    mesentericGroupFor(s.fmaId) ??
    pancreaticGroupFor(s.fmaId) ??
    thoracicGroupFor(s.fmaId) ??
    handVascularGroupFor(s.fmaId) ??
    handVenousGroupFor(s.fmaId) ??
    footVascularGroupFor(s.fmaId) ??
    ocularGroupFor(s.fmaId) ??
    laryngealGroupFor(s.fmaId) ??
    forearmVascularGroupFor(s.fmaId) ??
    (intestinalJunction.fmaIds.includes(s.fmaId)
      ? intestinalJunction
      : undefined);
  if (axial && (tab === 'anatomy' || tab === 'function'))
    return {
      readiness: 'draft',
      title: `${axial.name} · draft`,
      body: tab === 'anatomy' ? axial.anatomy : axial.function,
      bullets:
        tab === 'anatomy'
          ? [
              `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}`,
              axial.caution,
              'Use Study windows & focuses to preview and open its local study view.',
            ]
          : [axial.caution],
      note: s.coverageNote ?? 'Anatomical and teaching review pending.',
      citations: axial.references,
    };
  const neuro = neuroGroupFor(s.fmaId);
  if (neuro && (tab === 'anatomy' || tab === 'function'))
    return {
      readiness: tab === 'function' && !neuro.function ? 'pending' : 'draft',
      title: `${neuro.name} · draft`,
      body:
        tab === 'anatomy'
          ? neuro.anatomy
          : (neuro.function ??
            'A structure-specific function lesson is awaiting specialist authorship and review.'),
      bullets:
        tab === 'anatomy'
          ? [
              `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}`,
              'Open Head & neck → Deep-brain overview or a focused compartment view to remove the overlying brain and skull.',
              'Study colours distinguish structures. They do not encode MRI signal, histological staining or tissue activation.',
            ]
          : undefined,
      note: s.coverageNote ?? 'Anatomical and teaching review pending.',
      citations:
        tab === 'anatomy'
          ? [
              ...neuro.references,
              'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
            ]
          : neuro.references,
    };
  if (tab === 'anatomy')
    return {
      readiness: 'identity-only',
      title: s.provenance?.recovered
        ? 'Recovered anatomy · review pending'
        : 'Anatomical identity',
      body: `${s.name} is represented by source-registered BodyParts3D geometry. It can be inspected in the regional view or in its full-body context.`,
      bullets: [
        `Source anatomical identifier: ${s.fmaId}`,
        s.sources.length === 1
          ? 'One source surface'
          : `${s.sources.length} source components grouped as one structure`,
        'Source-derived mesh, not an AI-invented anatomical surface.',
        'Independent anatomical review: not yet completed.',
      ],
      note:
        s.coverageNote ??
        'Detailed boundaries and regional classification still require independent anatomical review.',
      citations: [
        'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
        'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
      ],
    };
  if (tab === 'function' && /set of lumbricals/.test(s.sourceName))
    return {
      readiness: 'draft',
      title: 'Lumbrical group · draft',
      body: 'The hand lumbricals contribute to flexion at the metacarpophalangeal joints and extension at the interphalangeal joints through the extensor apparatus.',
      note: 'This source represents a group. Do not assign a single nerve supply to all four muscles; individual attachments and innervation need separate reviewed records.',
      citations: ['https://anatomy.elpaso.ttuhsc.edu/schemes/hand_tables.html'],
    };
  if (
    tab === 'function' &&
    /set of (palmar|dorsal) interossei/.test(s.sourceName)
  )
    return {
      readiness: 'draft',
      title: 'Interosseous group · draft',
      body: /dorsal/.test(s.sourceName)
        ? 'The dorsal hand interossei spread the fingers relative to the middle-finger axis. They also help bend the knuckles and straighten the interphalangeal joints.'
        : 'The palmar hand interossei draw the fingers towards the middle-finger axis. They also help bend the knuckles and straighten the interphalangeal joints.',
      bullets: [
        'Motor supply: deep branch of the ulnar nerve.',
        'These source groups are not individually numbered or attachment-validated.',
      ],
      note: 'Draft educational text; independent review pending.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
      ],
    };
  if (tab === 'function' && /intervertebral disk/.test(s.sourceName))
    return {
      readiness: 'draft',
      title: 'Whole intervertebral disc · draft',
      body: 'Intervertebral discs cushion and distribute loads between neighbouring vertebral bodies. An outer annulus surrounds the inner nucleus; those internal components are not separated in this mesh.',
      note: '22 source-labelled disc surfaces are available. One source level remains unresolved. No measured disc thickness, disease state or radiological level registration is certified.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/joints_back.html',
      ],
    };
  if (tab === 'function' && /calcaneal tendon/.test(s.sourceName))
    return {
      readiness: 'draft',
      title: 'Achilles tendon · draft',
      body: 'The calcaneal tendon transmits force from gastrocnemius and soleus to the heel bone, supporting plantar flexion at the ankle.',
      note: 'The source surface does not separately show subtendons, paratenon or a validated insertion footprint.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
      ],
    };
  if (tab === 'function' && /trochlear nerve/.test(s.sourceName))
    return {
      readiness: 'draft',
      title: 'Trochlear nerve (CN IV) · draft',
      body: 'The trochlear nerve supplies the superior oblique muscle of the eye. It emerges from the dorsal brainstem and reaches the orbit through the superior orbital fissure.',
      note: 'The displayed source segment is not a validated reconstruction of the entire nerve course.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/nerves_head_neck.html',
      ],
    };
  if (tab === 'function' && /long plantar ligament/.test(s.sourceName))
    return {
      readiness: 'draft',
      title: 'Long plantar ligament · draft',
      body: 'The long plantar ligament supports the plantar aspect of the lateral foot and contributes to longitudinal-arch stability.',
      note: 'Source surface and draft teaching note require independent anatomical review.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/joints_lowerlimb.html',
      ],
    };
  if (tab === 'function' && s.system === 'vessels')
    return {
      readiness: 'identity-only',
      title: 'Vascular segment · review pending',
      body: 'This entry makes a source-labelled vessel segment independently selectable. Its complete branches, tributaries, supplied territory and normal variants have not been authored as a reviewed lesson.',
      note: 'Gaps between displayed surfaces must not be interpreted as occlusion or as validated vessel endpoints. Red/blue identifies artery/vein, not oxygenation.',
    };
  if (tab === 'function' && /ciliary ganglion/.test(s.sourceName))
    return {
      readiness: 'draft',
      title: 'Ciliary ganglion · draft',
      body: 'This orbital ganglion relays parasympathetic signals to the sphincter pupillae and ciliary muscle through short ciliary nerves.',
      note: 'The small ganglion surface is selectable, but connecting roots and short ciliary nerve routes have not been reconstructed. Source identity and position require specialist review.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/nerves_head_neck.html',
      ],
    };
  if (tab === 'function' && /main bronchus/.test(s.sourceName))
    return {
      readiness: 'draft',
      title: 'Central airway · draft',
      body: 'The main bronchi conduct air from the trachea towards the lungs and their branching airways.',
      note: 'These source-labelled surfaces have not been boundary-validated. Do not infer clinical bronchial length, lumen or segment numbering from this representation.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/viscera_thorax.html',
      ],
    };
  if (tab === 'function' && ['FMA14539', 'FMA14668'].includes(s.fmaId))
    return {
      readiness: 'draft',
      title: 'Biliary drainage · draft',
      body:
        s.fmaId === 'FMA14539'
          ? 'The cystic duct provides the route into and out of the gallbladder. It joins the common hepatic duct to form the common bile duct.'
          : 'The common hepatic duct carries bile from the right and left hepatic ducts towards its junction with the cystic duct.',
      note: 'Only selected source-labelled duct surfaces are shown. The complete tree, junction boundaries and luminal continuity have not been validated.',
      citations: ['https://anatomy.ttuhscep.edu/schemes/liver_tables.html'],
    };
  if (tab === 'function')
    return functions[s.fmaId]
      ? {
          readiness: 'draft',
          title: 'Function',
          body: functions[s.fmaId],
          note: 'Draft teaching note · clinical/editorial review pending.',
        }
      : {
          readiness: 'pending',
          title: 'Function content pending',
          body: 'A structure-specific description of action, attachments and neural supply has not yet been authored and reviewed for this entry. The geometry and source identity are available now.',
        };
  if (['ct', 'mri', 'ultrasound'].includes(tab))
    return {
      readiness: 'pending',
      title: `${tab === 'ultrasound' ? 'Ultrasound' : tab.toUpperCase()} content pending`,
      body: 'No imaging study or validated modality-specific teaching material is loaded for this structure. This is a spatial anatomy model, not a substitute for diagnostic imaging.',
      note: 'Future imaging registration must use a verified patient coordinate frame; source-model coordinates are not patient coordinates.',
    };
  if (tab === 'pathology')
    return {
      readiness: 'pending',
      title: 'Pathology content pending',
      body: 'This surface represents reference anatomy. No lesion, disease simulation or reviewed pathology lesson has been added for this structure.',
    };
  if (tab === 'clinical')
    return {
      readiness: 'pending',
      title: 'Clinical content pending',
      body: 'Clinical relationships, examination findings and procedural guidance need specialist authorship and review before release. Do not use this draft model to plan patient care.',
    };
  return {
    readiness: 'generated-identification',
    title: 'Identification practice',
    body: `Find ${s.name.toLowerCase()} on the model.`,
  };
}
