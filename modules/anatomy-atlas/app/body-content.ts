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
import { neckMuscleLesson } from '../lib/neck-curriculum';
import { deepNeckMuscleLesson } from '../lib/deep-neck-curriculum';
import { trunkMuscleLesson } from '../lib/trunk-curriculum';
import { orbitalNerveLesson } from '../lib/orbital-nerve-curriculum';
import { centralNeuroLesson } from '../lib/central-neuro-curriculum';
import { organLesson } from '../lib/organ-curriculum';
import { connectiveLesson } from '../lib/connective-curriculum';
import { spinalBoneLesson } from '../lib/spinal-bone-curriculum';
import { thoracicBoneLesson } from '../lib/thoracic-bone-curriculum';
import { cranialBoneLesson } from '../lib/cranial-bone-curriculum';
import { limbBoneLesson } from '../lib/limb-bone-curriculum';
import { acralBoneLesson } from '../lib/acral-bone-curriculum';
import { thoracicVesselLesson } from '../lib/thoracic-vessel-curriculum';
import { abdominalVesselLesson } from '../lib/abdominal-vessel-curriculum';
import { pelvicVesselLesson } from '../lib/pelvic-vessel-curriculum';
import { upperLimbVesselLesson } from '../lib/upper-limb-vessel-curriculum';
import { regionalVesselLesson } from '../lib/regional-vessel-curriculum';
import { neuralAnatomyLesson } from '../lib/neural-anatomy-curriculum';
import { organAnatomyLesson } from '../lib/organ-anatomy-curriculum';
import { connectiveAnatomyLesson } from '../lib/connective-anatomy-curriculum';
import { shoulderClinicalLesson } from '../lib/shoulder-clinical-curriculum';
import { scapularArmClinicalLesson } from '../lib/scapular-arm-clinical-curriculum';
import { forearmClinicalLesson } from '../lib/forearm-clinical-curriculum';
import { handClinicalLesson } from '../lib/hand-clinical-curriculum';
import { thighClinicalLesson } from '../lib/thigh-clinical-curriculum';
import { legClinicalLesson } from '../lib/leg-clinical-curriculum';
import { footClinicalLesson } from '../lib/foot-clinical-curriculum';
import { trunkClinicalLesson } from '../lib/trunk-clinical-curriculum';
import { headClinicalLesson } from '../lib/head-clinical-curriculum';
import { neckClinicalLesson } from '../lib/neck-clinical-curriculum';
import { limbBoneClinicalLesson } from '../lib/limb-bone-clinical-curriculum';
import { axialBoneClinicalLesson } from '../lib/axial-bone-clinical-curriculum';
import { cranialBoneClinicalLesson } from '../lib/cranial-bone-clinical-curriculum';
import { acralBoneClinicalLesson } from '../lib/acral-bone-clinical-curriculum';
import { orbitalNeuralClinicalLesson } from '../lib/orbital-neural-clinical-curriculum';
import { centralNeuralClinicalLesson } from '../lib/central-neural-clinical-curriculum';
import { thoracicOrganClinicalLesson } from '../lib/thoracic-organ-clinical-curriculum';
import { abdominalOrganClinicalLesson } from '../lib/abdominal-organ-clinical-curriculum';
import { pelvicOrganClinicalLesson } from '../lib/pelvic-organ-clinical-curriculum';
import { headOrganClinicalLesson } from '../lib/head-organ-clinical-curriculum';
import { dentalClinicalLesson } from '../lib/dental-clinical-curriculum';
import { limbConnectiveClinicalLesson } from '../lib/limb-connective-clinical-curriculum';
import { axialConnectiveClinicalLesson } from '../lib/axial-connective-clinical-curriculum';
import { regionalConnectiveClinicalLesson } from '../lib/regional-connective-clinical-curriculum';
import { thoracicVesselClinicalLesson } from '../lib/thoracic-vessel-clinical-curriculum';
import { abdominalVesselClinicalLesson } from '../lib/abdominal-vessel-clinical-curriculum';
import { pelvicVesselClinicalLesson } from '../lib/pelvic-vessel-clinical-curriculum';
import { headNeckVesselClinicalLesson } from '../lib/head-neck-vessel-clinical-curriculum';
import { shoulderArmVesselClinicalLesson } from '../lib/shoulder-arm-vessel-clinical-curriculum';
import { forearmVesselClinicalLesson } from '../lib/forearm-vessel-clinical-curriculum';
import { handVesselClinicalLesson } from '../lib/hand-vessel-clinical-curriculum';
import { lowerLimbVesselClinicalLesson } from '../lib/lower-limb-vessel-clinical-curriculum';
import { achillesImagingLesson } from '../lib/achilles-imaging';
import { kneeImagingLesson } from '../lib/knee-imaging';
import { bodyXrayLesson } from '../lib/xray-teaching';
import { spineImagingLesson } from '../lib/spine-imaging';
import { hipImagingLesson } from '../lib/hip-imaging';
import { wristImagingLesson } from '../lib/wrist-imaging';
import { brachialVeinLesson } from '../lib/brachial-veins';
import { tentoriumLesson } from '../lib/tentorium';
import { deepLegVeinLesson } from '../lib/deep-leg-veins';
import { portalVeinLesson } from '../lib/portal-veins';
import { hepaticVeinLesson } from '../lib/hepatic-veins';
import { longusColliLesson } from '../lib/longus-colli';
import { cubitalVeinLesson } from '../lib/cubital-veins';
import { genicularArteryLesson } from '../lib/genicular-arteries';
import { inferiorThyroidLesson } from '../lib/inferior-thyroid-arteries';
import { subscapularArteryLesson } from '../lib/subscapular-arteries';
import { circumflexFemoralLesson } from '../lib/circumflex-femoral';
import { cranialArteryLesson } from '../lib/cranial-arteries';
import { deferentDuctLesson } from '../lib/deferent-ducts';
import { inferiorEpigastricLesson } from '../lib/inferior-epigastric-vessels';
import { pelvicVeinLesson } from '../lib/pelvic-veins';
import { limbicLandmarkLesson } from '../lib/limbic-landmarks';
import { tarsalImagingLesson } from '../lib/tarsal-imaging';
import { upperVesselImagingLesson } from '../lib/upper-vessel-imaging';
import { lowerArterialImagingLesson } from '../lib/lower-arterial-imaging';
import { limbBoneImagingLesson } from '../lib/limb-bone-imaging';
import { thoracicBoneImagingLesson } from '../lib/thoracic-bone-imaging';
import { abdominalOrganImagingLesson } from '../lib/abdominal-organ-imaging';
import { pelvicOrganImagingLesson } from '../lib/pelvic-organ-imaging';

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
  const cranial = cranialArteryLesson(s, tab);
  if (cranial) return cranial;
  const circumflex = circumflexFemoralLesson(s, tab);
  if (circumflex) return circumflex;
  const subscapular = subscapularArteryLesson(s, tab);
  if (subscapular) return subscapular;
  const lowerArterialImaging = lowerArterialImagingLesson(s, tab);
  if (lowerArterialImaging) return lowerArterialImaging;
  const limbic = limbicLandmarkLesson(s, tab);
  if (limbic) return limbic;
  const pelvicVein = pelvicVeinLesson(s, tab);
  if (pelvicVein) return pelvicVein;
  const epigastric = inferiorEpigastricLesson(s, tab);
  if (epigastric) return epigastric;
  const upperVesselImaging = upperVesselImagingLesson(s, tab);
  if (upperVesselImaging) return upperVesselImaging;
  const thyroid = inferiorThyroidLesson(s, tab);
  const deferent = deferentDuctLesson(s, tab);
  if (deferent) return deferent;
  if (thyroid) return thyroid;
  const genicular = genicularArteryLesson(s, tab);
  if (genicular) return genicular;
  const cubitalVein = cubitalVeinLesson(s, tab);
  if (cubitalVein) return cubitalVein;
  const deepLegVein = deepLegVeinLesson(s, tab);
  if (deepLegVein) return deepLegVein;
  const longusColli = longusColliLesson(s, tab);
  if (longusColli) return longusColli;
  const hepaticVein = hepaticVeinLesson(s, tab);
  if (hepaticVein) return hepaticVein;
  const portalVein = portalVeinLesson(s, tab);
  if (portalVein) return portalVein;
  const tarsalImaging = tarsalImagingLesson(s, tab);
  if (tarsalImaging) return tarsalImaging;
  const limbBoneImaging = limbBoneImagingLesson(s, tab);
  if (limbBoneImaging) return limbBoneImaging;
  const thoracicBoneImaging = thoracicBoneImagingLesson(s, tab);
  if (thoracicBoneImaging) return thoracicBoneImaging;
  const abdominalOrganImaging = abdominalOrganImagingLesson(s, tab);
  if (abdominalOrganImaging) return abdominalOrganImaging;
  const pelvicOrganImaging = pelvicOrganImagingLesson(s, tab);
  if (pelvicOrganImaging) return pelvicOrganImaging;
  const tentorium = tentoriumLesson(s, tab);
  if (tentorium) return tentorium;
  const brachialVein = brachialVeinLesson(s, tab);
  if (brachialVein) return brachialVein;
  const wristImaging = wristImagingLesson(s, tab);
  if (wristImaging) return wristImaging;
  const hipImaging = hipImagingLesson(s, tab);
  if (hipImaging) return hipImaging;
  const spineImaging = spineImagingLesson(s, tab);
  if (spineImaging) return spineImaging;
  const xray = bodyXrayLesson(s, tab);
  if (xray) return xray;
  const existing = shoulderStructures.find((item) =>
    item.sourceFmaIds?.includes(s.fmaId),
  );
  if (existing) return draftLesson(existing.sections[tab]);
  const kneeImaging = kneeImagingLesson(s, tab);
  if (kneeImaging) return kneeImaging;
  const achillesImaging = achillesImagingLesson(s, tab);
  if (achillesImaging) return achillesImaging;
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
  const neckMuscle = neckMuscleLesson(s, tab);
  if (neckMuscle) return neckMuscle;
  const deepNeckMuscle = deepNeckMuscleLesson(s, tab);
  if (deepNeckMuscle) return deepNeckMuscle;
  const trunkMuscle = trunkMuscleLesson(s, tab);
  if (trunkMuscle) return trunkMuscle;
  const orbitalNerve = orbitalNerveLesson(s, tab);
  if (orbitalNerve) return orbitalNerve;
  const centralNeuro = centralNeuroLesson(s, tab);
  if (centralNeuro) return centralNeuro;
  const organ = organLesson(s, tab);
  if (organ) return organ;
  const connective = connectiveLesson(s, tab);
  if (connective) return connective;
  const spinalBone = spinalBoneLesson(s, tab);
  if (spinalBone) return spinalBone;
  const thoracicBone = thoracicBoneLesson(s, tab);
  if (thoracicBone) return thoracicBone;
  const cranialBone = cranialBoneLesson(s, tab);
  if (cranialBone) return cranialBone;
  const limbBone = limbBoneLesson(s, tab);
  if (limbBone) return limbBone;
  const acralBone = acralBoneLesson(s, tab);
  if (acralBone) return acralBone;
  const thoracicVessel = thoracicVesselLesson(s, tab);
  if (thoracicVessel) return thoracicVessel;
  const abdominalVessel = abdominalVesselLesson(s, tab);
  if (abdominalVessel) return abdominalVessel;
  const pelvicVessel = pelvicVesselLesson(s, tab);
  if (pelvicVessel) return pelvicVessel;
  const upperLimbVessel = upperLimbVesselLesson(s, tab);
  if (upperLimbVessel) return upperLimbVessel;
  const regionalVessel = regionalVesselLesson(s, tab);
  if (regionalVessel) return regionalVessel;
  const neuralAnatomy = neuralAnatomyLesson(s, tab);
  if (neuralAnatomy) return neuralAnatomy;
  const organAnatomy = organAnatomyLesson(s, tab);
  if (organAnatomy) return organAnatomy;
  const connectiveAnatomy = connectiveAnatomyLesson(s, tab);
  if (connectiveAnatomy) return connectiveAnatomy;
  const shoulderClinical = shoulderClinicalLesson(s, tab);
  if (shoulderClinical) return shoulderClinical;
  const scapularArmClinical = scapularArmClinicalLesson(s, tab);
  if (scapularArmClinical) return scapularArmClinical;
  const forearmClinical = forearmClinicalLesson(s, tab);
  if (forearmClinical) return forearmClinical;
  const handClinical = handClinicalLesson(s, tab);
  if (handClinical) return handClinical;
  const thighClinical = thighClinicalLesson(s, tab);
  if (thighClinical) return thighClinical;
  const legClinical = legClinicalLesson(s, tab);
  if (legClinical) return legClinical;
  const footClinical = footClinicalLesson(s, tab);
  if (footClinical) return footClinical;
  const trunkClinical = trunkClinicalLesson(s, tab);
  if (trunkClinical) return trunkClinical;
  const headClinical = headClinicalLesson(s, tab);
  if (headClinical) return headClinical;
  const neckClinical = neckClinicalLesson(s, tab);
  if (neckClinical) return neckClinical;
  const limbBoneClinical = limbBoneClinicalLesson(s, tab);
  if (limbBoneClinical) return limbBoneClinical;
  const axialBoneClinical = axialBoneClinicalLesson(s, tab);
  if (axialBoneClinical) return axialBoneClinical;
  const cranialBoneClinical = cranialBoneClinicalLesson(s, tab);
  if (cranialBoneClinical) return cranialBoneClinical;
  const acralBoneClinical = acralBoneClinicalLesson(s, tab);
  if (acralBoneClinical) return acralBoneClinical;
  const orbitalNeuralClinical = orbitalNeuralClinicalLesson(s, tab);
  if (orbitalNeuralClinical) return orbitalNeuralClinical;
  const centralNeuralClinical = centralNeuralClinicalLesson(s, tab);
  if (centralNeuralClinical) return centralNeuralClinical;
  const thoracicOrganClinical = thoracicOrganClinicalLesson(s, tab);
  if (thoracicOrganClinical) return thoracicOrganClinical;
  const abdominalOrganClinical = abdominalOrganClinicalLesson(s, tab);
  if (abdominalOrganClinical) return abdominalOrganClinical;
  const pelvicOrganClinical = pelvicOrganClinicalLesson(s, tab);
  if (pelvicOrganClinical) return pelvicOrganClinical;
  const headOrganClinical = headOrganClinicalLesson(s, tab);
  if (headOrganClinical) return headOrganClinical;
  const dentalClinical = dentalClinicalLesson(s, tab);
  if (dentalClinical) return dentalClinical;
  const limbConnectiveClinical = limbConnectiveClinicalLesson(s, tab);
  if (limbConnectiveClinical) return limbConnectiveClinical;
  const axialConnectiveClinical = axialConnectiveClinicalLesson(s, tab);
  if (axialConnectiveClinical) return axialConnectiveClinical;
  const regionalConnectiveClinical = regionalConnectiveClinicalLesson(s, tab);
  if (regionalConnectiveClinical) return regionalConnectiveClinical;
  const thoracicVesselClinical = thoracicVesselClinicalLesson(s, tab);
  if (thoracicVesselClinical) return thoracicVesselClinical;
  const abdominalVesselClinical = abdominalVesselClinicalLesson(s, tab);
  if (abdominalVesselClinical) return abdominalVesselClinical;
  const pelvicVesselClinical = pelvicVesselClinicalLesson(s, tab);
  if (pelvicVesselClinical) return pelvicVesselClinical;
  const headNeckVesselClinical = headNeckVesselClinicalLesson(s, tab);
  if (headNeckVesselClinical) return headNeckVesselClinical;
  const shoulderArmVesselClinical = shoulderArmVesselClinicalLesson(s, tab);
  if (shoulderArmVesselClinical) return shoulderArmVesselClinical;
  const forearmVesselClinical = forearmVesselClinicalLesson(s, tab);
  if (forearmVesselClinical) return forearmVesselClinical;
  const handVesselClinical = handVesselClinicalLesson(s, tab);
  if (handVesselClinical) return handVesselClinical;
  const lowerLimbVesselClinical = lowerLimbVesselClinicalLesson(s, tab);
  if (lowerLimbVesselClinical) return lowerLimbVesselClinical;
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
  if (tab === 'function' && ['FMA50881', 'FMA50882'].includes(s.fmaId))
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
  if (tab === 'function' && ['FMA53549', 'FMA53550'].includes(s.fmaId))
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
