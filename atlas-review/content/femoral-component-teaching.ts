import type { NestedConcept } from './nested-teaching';

export const femoralComponentReferences = {
  femoralComponentAnatomy: {
    title: 'UAMS · Arteries of the lower limb',
    url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/',
  },
  femoralComponentVariation: {
    title: 'Artero et al. (2018) · Bilateral thigh-flap vascular variation',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29922539/',
  },
  femoralComponentInjury: {
    title: 'Cho et al. (2025) · Descending circumflex branch injury case report',
    url: 'https://aott.org.tr/index.php/pub/article/view/4018',
  },
  femoralComponentCTA: {
    title: 'Yu et al. (2022) · CTA mapping of anterolateral thigh perforators',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36512153/',
  },
  femoralComponentMRA: {
    title: 'Jiang et al. (2016) · Contrast-enhanced MRA of thigh flap vessels',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27446322/',
  },
  femoralComponentDoppler: {
    title: 'Debelmas et al. (2018) · Colour Doppler assessment of thigh perforators',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29481406/',
  },
};
const pending = {
  body: 'Component-specific clinical teaching awaits review. This source partition is not an angiogram or a complete vascular network.',
  references: [],
  readiness: 'pending' as const,
};
export const femoralComponentConcepts: NestedConcept[] = [
  {
    id: 'femoral-lateral-source',
    study: 'femoral-components',
    fmaIds: ['FMA20801', 'FMA20802'],
    sections: {
      anatomy: {
        body: 'The lateral circumflex femoral artery usually arises from the deep femoral artery; origin varies. Its ascending, transverse and descending branches are not all separately represented in this component view.',
        references: ['femoralComponentAnatomy'],
        readiness: 'draft',
      },
      function: {
        body: 'Its branches contribute to the blood supply of the lateral hip and thigh. This supplied surface does not establish complete perfusion territories or collateral continuity.',
        references: ['femoralComponentAnatomy'],
        readiness: 'draft',
      },
      clinical: {
        body: 'The selected lateral circumflex femoral component provides parent-vessel context for anterolateral thigh flap anatomy. Clinical and cadaver observations found that cutaneous branches of its descending branch could travel through muscle on one side but through a septum on the other. The opposite thigh is therefore not a reliable template. Those perforators are not separately mapped here; this surface cannot define a flap territory or harvest route.',
        references: ['femoralComponentVariation'],
        readiness: 'draft',
      },
      pathology: {
        body: 'Injury to a descending branch of the lateral circumflex femoral artery has been reported with pseudoaneurysm after intertrochanteric fracture fixation. This is branch-level clinical context, not evidence of a lesion in the selected parent component. A single case cannot establish frequency or prove a general injury mechanism. No pseudoaneurysm, wall defect, bleeding, fracture or implant is represented in this reference model.',
        references: ['femoralComponentInjury'],
        readiness: 'draft',
      },
    },
    imaging: {
      ct: {
        body: 'CTA can trace the lateral circumflex femoral system and locate perforators for anterolateral thigh flap assessment. A 35-patient study demonstrated variable origins and muscular or septal courses, not one universal branching pattern. Compare the parent vessel with the actual acquired branches; this supplied component does not map those perforators, measure their calibre or define a safe harvest route.',
        references: ['femoralComponentCTA'],
        readiness: 'draft',
      },
      mri: {
        body: 'Contrast-enhanced MR angiography can depict the lateral circumflex femoral artery and its branching pattern. In a retrospective series of 68 patients, the parent artery was visualised in all patients, but tertiary branches were identified in only 94 of 136 limbs. Parent-vessel visibility therefore does not establish a complete perforator map. This surface contains no MR signal, flow measurement or patient registration.',
        references: ['femoralComponentMRA'],
        readiness: 'draft',
      },
      ultrasound: {
        body: 'Colour Doppler can assess the course and location of thigh perforators, including their passage through the vastus lateralis aponeurosis. A prospective study compared 30 located perforators with operative findings; localisation was useful but not exact in every case. Use this parent-vessel component for orientation only: it contains neither a Doppler signal nor the small perforators, and cannot substitute for an acquired examination.',
        references: ['femoralComponentDoppler'],
        readiness: 'draft',
      },
    },
    modelLimit:
      'One source-labelled component within the existing deep-femoral aggregate. Clinical boundaries and vessel junctions are unvalidated; no complete branch network is implied.',
    quiz: {
      question:
        'Does separating this component establish a complete lateral circumflex branch network?',
      answer:
        'No. It exposes the supplied source surface, not every branch or a verified connected lumen.',
      references: [],
      basis: 'model-scope',
    },
  },
  {
    id: 'femoral-source-remainder',
    study: 'femoral-components',
    fmaIds: ['FMA20796', 'FMA20797'],
    sections: {
      anatomy: {
        body: 'This is the remaining supplied surface after the lateral circumflex source is separated from the deep-femoral aggregate. It is a source component, not the whole artery or an independently named perforating branch.',
        references: [],
        readiness: 'draft',
      },
      function: {
        body: 'A separate functional territory has not been assigned to this remainder. Source file boundaries alone do not define a physiological unit.',
        references: [],
        readiness: 'pending',
      },
      clinical: pending,
      pathology: pending,
    },
    modelLimit:
      'Uses the aggregate FMA reference only for provenance; the component ID and single-file binding identify this partial representation. Do not infer complete deep-femoral anatomy.',
    quiz: {
      question:
        'Is “source remainder” the name of another anatomical artery?',
      answer:
        'No. It describes one retained source component of the aggregate, not a newly named artery.',
      references: [],
      basis: 'model-scope',
    },
  },
];
