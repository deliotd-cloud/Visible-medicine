import type { NestedSection } from './nested-teaching';

export const pulmonaryTeachingReferences = {
  pulmonaryLobarProjection: {
    title: 'King’s College London · Chest radiograph: lungs and lobes',
    url: 'https://ehealth.kcl.ac.uk/tel/radiology/CXR/03-02-lungs.html',
  },
  pulmonaryChestXray: {
    title: 'ACR / RSNA RadiologyInfo · Chest X-ray',
    url: 'https://www.radiologyinfo.org/en/info/chestrad',
  },
  pulmonaryMRIPhysics: {
    title: 'Wild et al. · MRI of the lung: methods (2012)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3481083/',
  },
  pulmonaryUltrasoundLimits: {
    title: 'Demi et al. · New International Guidelines and Consensus on the Use of Lung Ultrasound (2023)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10086956/',
  },
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
      xray: draft(
        'Compare frontal and lateral chest radiographs when learning lobar relationships. On the right, the horizontal fissure separates upper from middle lobe; on the left, the lingula belongs to the upper lobe, not a separate middle lobe. These coloured upper-lobe branches are an orientation aid, not a radiographic opacity or a complete lobe outline.',
        'pulmonaryLobarProjection',
        'pulmonaryChestXray',
      ),
      ct: draft(
        'Chest CT depicts nodules and other lung abnormalities and can be reviewed in multiple planes. Use the selected upper-lobe branches as an orientation aid when comparing an independently approved study. The coloured branch outline is not the tissue extent of a lobe, a nodule boundary or a CT attenuation value.',
        'pulmonaryChestCT',
      ),
      mri: draft(
        'Aerated lung produces little conventional proton MR signal; tissue–air interfaces also cause rapid signal loss. Short-echo techniques can improve lung imaging, but sequence choice matters. Use upper-lobe branches for orientation only: their solid colours do not predict MR signal or guarantee that every distal branch will be resolved.',
        'pulmonaryMRIPhysics',
      ),
      ultrasound: draft(
        'Ultrasound of aerated lung is dominated by the pleural interface and acoustic artefacts, not an open view of deep upper-lobe branches. B-lines are artefacts, not the selected vessels or bronchi. An examined window cannot assess deeper lung obscured by aeration; the model supplies neither pleura nor an ultrasound field of view.',
        'pulmonaryUltrasoundLimits',
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
      xray: draft(
        'The right middle lobe is separated from the upper lobe by the horizontal fissure and from the lower lobe by the oblique fissure. Relate these boundaries across frontal and lateral views rather than using this branch group as a tissue silhouette. No fissure surface, collapse or scan correspondence is supplied by the selected model.',
        'pulmonaryLobarProjection',
        'pulmonaryChestXray',
      ),
      ct: draft(
        'Chest CT can evaluate pneumonia, bronchiectasis and chest tumours. For a middle-lobe study, compare the airway group with the surrounding tissue on the actual examination rather than treating branches as the whole lobe. This atlas has no fissure surfaces, tissue-density information or registered CT slices to establish a collapse pattern.',
        'pulmonaryChestCT',
      ),
      mri: draft(
        'Lung MRI appearance depends on the acquisition: parenchymal imaging, contrast-enhanced angiography and functional imaging answer different questions. This right-middle-lobe group combines airway and vascular surfaces; a single atlas colour cannot stand for their different signals. It supplies no collapse, tissue envelope, enhancement curve or proof of airway patency.',
        'pulmonaryMRIPhysics',
      ),
      ultrasound: draft(
        'A consolidation may become directly accessible to ultrasound when it contacts the visceral pleura in the examined window. This does not make deeper middle-lobe airway branches routinely visible through aerated lung. The model supplies no consolidation or pleural contact; absence of a finding in one accessible window does not exclude a deeper lesion.',
        'pulmonaryUltrasoundLimits',
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
      xray: draft(
        'The oblique fissure separates each lower lobe from the other lobes on that side. Use frontal and lateral radiographs together for lobar orientation; the selected lower-lobe branches do not trace the fissure or tissue boundary. A chest radiograph cannot exclude every lung abnormality, and further imaging may be needed. Atlas colours do not represent X-ray attenuation.',
        'pulmonaryLobarProjection',
        'pulmonaryChestXray',
      ),
      ct: draft(
        'CT may help when suspected aspiration pneumonia remains uncertain after an inconclusive chest radiograph or when competing diagnoses need clarification. Assess the distribution of consolidation alongside the history. This partial lower-lobe branch model supplies no consolidation, dependent tissue changes or patient-specific correspondence; rotating it does not simulate aspiration.',
        'pulmonaryAspiration',
      ),
      mri: draft(
        'Breathing changes lung position and inflation, affecting MR signal and alignment between acquisitions. Breath-holding or respiratory gating can reduce motion effects. Compare lower-lobe relationships on the actual sequences rather than treating a static branch model as a respiratory phase, perfusion map or patient-matched segmentation; its boundaries do not delineate lower-lobe tissue.',
        'pulmonaryMRIPhysics',
      ),
      ultrasound: draft(
        'At basal chest windows, interpret accessible pleural fluid, consolidation and diaphragm motion in their acquired context. Fluid beside lung is not a pulmonary vessel, and tissue-like consolidation is not a normal branch rendering. Deep abnormalities separated from the probe by aerated lung may be inaccessible; these meshes do not provide an acoustic window or diagnose aspiration.',
        'pulmonaryUltrasoundLimits',
      ),
    },
  },
} satisfies Record<
  string,
  {
    clinical: NestedSection;
    pathology: NestedSection;
    imaging: { ct: NestedSection; mri: NestedSection; ultrasound: NestedSection; xray: NestedSection };
  }
>;
