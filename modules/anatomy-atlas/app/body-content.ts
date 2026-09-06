import {
  structures as shoulderStructures,
  type ContentTab,
  type ContentSection,
} from './anatomy-data';
import type { BodyStructure } from './body-types';
import { neuroGroupFor } from '../lib/neuroanatomy';

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
export function bodyContent(s: BodyStructure, tab: ContentTab): ContentSection {
  const existing = shoulderStructures.find((item) =>
    item.sourceFmaIds?.includes(s.fmaId),
  );
  if (existing) return existing.sections[tab];
  const neuro = neuroGroupFor(s.fmaId);
  if (neuro && (tab === 'anatomy' || tab === 'function'))
    return {
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
      title: 'Whole intervertebral disc · draft',
      body: 'Intervertebral discs cushion and distribute loads between neighbouring vertebral bodies. An outer annulus surrounds the inner nucleus; those internal components are not separated in this mesh.',
      note: '22 source-labelled disc surfaces are available. One source level remains unresolved. No measured disc thickness, disease state or radiological level registration is certified.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/joints_back.html',
      ],
    };
  if (tab === 'function' && /calcaneal tendon/.test(s.sourceName))
    return {
      title: 'Achilles tendon · draft',
      body: 'The calcaneal tendon transmits force from gastrocnemius and soleus to the heel bone, supporting plantar flexion at the ankle.',
      note: 'The source surface does not separately show subtendons, paratenon or a validated insertion footprint.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
      ],
    };
  if (tab === 'function' && /trochlear nerve/.test(s.sourceName))
    return {
      title: 'Trochlear nerve (CN IV) · draft',
      body: 'The trochlear nerve supplies the superior oblique muscle of the eye. It emerges from the dorsal brainstem and reaches the orbit through the superior orbital fissure.',
      note: 'The displayed source segment is not a validated reconstruction of the entire nerve course.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/nerves_head_neck.html',
      ],
    };
  if (tab === 'function' && /long plantar ligament/.test(s.sourceName))
    return {
      title: 'Long plantar ligament · draft',
      body: 'The long plantar ligament supports the plantar aspect of the lateral foot and contributes to longitudinal-arch stability.',
      note: 'Source surface and draft teaching note require independent anatomical review.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/joints_lowerlimb.html',
      ],
    };
  if (tab === 'function' && s.system === 'vessels')
    return {
      title: 'Vascular segment · review pending',
      body: 'This entry makes a source-labelled vessel segment independently selectable. Its complete branches, tributaries, supplied territory and normal variants have not been authored as a reviewed lesson.',
      note: 'Gaps between displayed surfaces must not be interpreted as occlusion or as validated vessel endpoints. Red/blue identifies artery/vein, not oxygenation.',
    };
  if (tab === 'function' && /ciliary ganglion/.test(s.sourceName))
    return {
      title: 'Ciliary ganglion · draft',
      body: 'This orbital ganglion relays parasympathetic signals to the sphincter pupillae and ciliary muscle through short ciliary nerves.',
      note: 'The small ganglion surface is selectable, but connecting roots and short ciliary nerve routes have not been reconstructed. Source identity and position require specialist review.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/nerves_head_neck.html',
      ],
    };
  if (tab === 'function' && /main bronchus/.test(s.sourceName))
    return {
      title: 'Central airway · draft',
      body: 'The main bronchi conduct air from the trachea towards the lungs and their branching airways.',
      note: 'These source-labelled surfaces have not been boundary-validated. Do not infer clinical bronchial length, lumen or segment numbering from this representation.',
      citations: [
        'https://anatomy.ttuhscep.edu/anatomytables/viscera_thorax.html',
      ],
    };
  if (tab === 'function' && ['FMA14539', 'FMA14668'].includes(s.fmaId))
    return {
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
          title: 'Function',
          body: functions[s.fmaId],
          note: 'Draft teaching note · clinical/editorial review pending.',
        }
      : {
          title: 'Function content pending',
          body: 'A structure-specific description of action, attachments and neural supply has not yet been authored and reviewed for this entry. The geometry and source identity are available now.',
        };
  if (['ct', 'mri', 'ultrasound'].includes(tab))
    return {
      title: `${tab === 'ultrasound' ? 'Ultrasound' : tab.toUpperCase()} content pending`,
      body: 'No imaging study or validated modality-specific teaching material is loaded for this structure. This is a spatial anatomy model, not a substitute for diagnostic imaging.',
      note: 'Future imaging registration must use a verified patient coordinate frame; source-model coordinates are not patient coordinates.',
    };
  if (tab === 'pathology')
    return {
      title: 'Pathology content pending',
      body: 'This surface represents reference anatomy. No lesion, disease simulation or reviewed pathology lesson has been added for this structure.',
    };
  if (tab === 'clinical')
    return {
      title: 'Clinical content pending',
      body: 'Clinical relationships, examination findings and procedural guidance need specialist authorship and review before release. Do not use this draft model to plan patient care.',
    };
  return {
    title: 'Identification practice',
    body: `Find ${s.name.toLowerCase()} on the model.`,
  };
}
