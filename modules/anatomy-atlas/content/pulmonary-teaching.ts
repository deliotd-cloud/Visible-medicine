import type { NestedSection } from './nested-teaching';

export const pulmonaryTeachingReferences = {
  pulmonaryTBDiagnosis: {
    title: 'CDC · Clinical and laboratory diagnosis for tuberculosis',
    url: 'https://www.cdc.gov/tb/hcp/testing-diagnosis/clinical-and-laboratory-diagnosis.html',
  },
  pulmonaryTBDistribution: {
    title: 'CDC · TB healthcare-setting guidance (2005), chest radiography',
    url: 'https://www.cdc.gov/mmwr/preview/mmwrhtml/rr5417a1.htm',
  },
  pulmonaryMiddleLobe: {
    title:
      'Freidkin et al. · Bronchoscopy in right middle lobe syndrome: 66 cases (2023)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37704575/',
  },
  pulmonaryAspiration: {
    title:
      'BTS / Simpson et al. · Aspiration pneumonia clinical statement (2023), p. s12',
    url: 'https://www.brit-thoracic.org.uk/document-library/clinical-statements/aspiration-pneumonia/bts-clinical-statement-on-aspiration-pneumonia/',
  },
  pulmonaryChestCT: {
    title: 'ACR / RSNA RadiologyInfo · Chest CT',
    url: 'https://www.radiologyinfo.org/en/info/chestct',
  },
};

const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});

// Lobe-level examples, not findings in these airway/vessel meshes. No segment,
// fissure, tissue boundary or scan correspondence is inferred from a branch.
export const pulmonaryTeaching = {
  upper: {
    clinical: draft(
      'An upper-lobe abnormality is a location, not a diagnosis. When tuberculosis is suspected, clinical history, examination, imaging and microbiological investigation are considered together. A positive infection test does not by itself establish active pulmonary disease. These branch groups cannot show infection or determine whether someone is infectious.',
      'pulmonaryTBDiagnosis',
    ),
    pathology: draft(
      'Upper-lobe infiltrates and cavities are recognised radiographic patterns in pulmonary tuberculosis, but lesions can occur elsewhere and appearances are not specific. Neither upper-lobe location nor a cavity confirms TB. The atlas supplies no infiltrate, cavity or diseased tissue; this example explains why anatomical location matters during interpretation.',
      'pulmonaryTBDistribution',
      'pulmonaryTBDiagnosis',
    ),
    imaging: {
      ct: draft(
        'Chest CT depicts nodules and other lung abnormalities and can be reviewed in multiple planes. Use the selected upper-lobe branches as an orientation aid when comparing an independently approved study. The coloured branch outline is not the tissue extent of a lobe, a nodule boundary or a CT attenuation value.',
        'pulmonaryChestCT',
      ),
    },
  },
  middle: {
    clinical: draft(
      'Persistent or recurrent right-middle-lobe collapse prompts investigation of its cause. In a retrospective bronchoscopy series, findings included masses within the bronchus and compression from outside it. This illustrates the importance of the airway and its surroundings; a selected referral series does not provide an individual patient’s cancer risk.',
      'pulmonaryMiddleLobe',
    ),
    pathology: draft(
      'Right middle lobe syndrome involves recurrent or chronic atelectasis, with mechanical and nonmechanical causes. Associated problems can include pneumonia beyond an obstruction and bronchiectasis. It is not synonymous with cancer. No collapse, airway blockage or abnormally dilated bronchus is represented by this static source group.',
      'pulmonaryMiddleLobe',
    ),
    imaging: {
      ct: draft(
        'Chest CT can evaluate pneumonia, bronchiectasis and chest tumours. For a middle-lobe study, compare the airway group with the surrounding tissue on the actual examination rather than treating branches as the whole lobe. This atlas has no fissure surfaces, tissue-density information or registered CT slices to establish a collapse pattern.',
        'pulmonaryChestCT',
      ),
    },
  },
  lower: {
    clinical: draft(
      'Aspiration distribution depends partly on posture: basal lower-lobe segments are commonly involved after predominantly upright positioning; superior lower-lobe or posterior upper-lobe segments may be involved when supine. Relate this to the history, not location alone. Individual bronchopulmonary segments are not separately delineated in these lobe-level branch groups.',
      'pulmonaryAspiration',
    ),
    pathology: draft(
      'Aspiration pneumonia is distinct from aspiration pneumonitis, a chemical lung injury often associated with inhaled gastric acid. Both can produce pulmonary opacities, so the clinical history matters. Lower-lobe location does not establish either diagnosis, and these meshes contain neither infected tissue nor a chemical-injury overlay.',
      'pulmonaryAspiration',
    ),
    imaging: {
      ct: draft(
        'CT may help when suspected aspiration pneumonia remains uncertain after an inconclusive chest radiograph or when competing diagnoses need clarification. Assess the distribution of consolidation alongside the history. This partial lower-lobe branch model supplies no consolidation, dependent tissue changes or patient-specific correspondence; rotating it does not simulate aspiration.',
        'pulmonaryAspiration',
      ),
    },
  },
} satisfies Record<
  string,
  {
    clinical: NestedSection;
    pathology: NestedSection;
    imaging: { ct: NestedSection };
  }
>;
