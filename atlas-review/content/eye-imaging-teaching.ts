import type { NestedImagingTopic, NestedSection } from './nested-teaching';

export const eyeImagingReferences = {
  lensBiometryUBM: {
    title: 'Huang et al. (2024) · Lens diameter and ocular biometry · CC BY 4.0',
    url: 'https://doi.org/10.3389/fmed.2023.1306276',
  },
  posteriorScleraBScan: {
    title: 'Vergouwen et al. (2023) · Scleritis in rheumatoid arthritis · CC BY 4.0',
    url: 'https://doi.org/10.3389/fopht.2023.1106419',
  },
  cornealPachymetry: {
    title: 'Kim et al. · Corneal thickness: OCT versus ultrasound pachymetry',
    url: 'https://pubmed.ncbi.nlm.nih.gov/18054888/',
  },
  anteriorSegmentUBM: {
    title:
      'Pavlin et al. · Ultrasound biomicroscopy of the anterior segment (1992)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/1558111/',
  },
  lensTraumaCT: {
    title: 'Gad et al. · CT assessment of anterior eye injuries (2017)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28952811/',
  },
  vitreousPOCUS: {
    title:
      'Lahham et al. · Ocular point-of-care ultrasound in emergency departments (2019)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30977855/',
  },
  uvealMelanomaImaging: {
    title:
      'Ferreira et al. · Uveal melanoma MRI with histopathological validation (2022)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34718831/',
  },
  scleritisImaging: {
    title: 'CT and MR Imaging in the Diagnosis of Scleritis (2016)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27444937/',
  },
};

const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});

// Original introductory teaching, not scan data, scanning instructions or mesh approval.
export const eyeImagingTeaching = {
  cornea: {
    ultrasound: draft(
      'Ultrasound pachymetry measures corneal thickness. A comparison in adults with clinically normal corneas found systematic differences from anterior-segment OCT, despite strong correlation: the readings were not directly interchangeable. This corneal surface has no validated thickness or ultrasound echoes; its displayed thickness is not a pachymetry result or a conversion between instruments.',
      'cornealPachymetry',
    ),
  },
  iris: {
    ultrasound: draft(
      'Ultrasound biomicroscopy (UBM) uses high-frequency ultrasound to examine anterior-segment relationships, including the iris and chamber angle. This differs from treating the pupil as an isolated opening. The atlas iris is one source surface: it does not resolve its muscle layers, reproduce a UBM section or provide a clinical angle measurement.',
      'anteriorSegmentUBM',
    ),
  },
  lens: {
    ultrasound: draft(
      'Specialised very-high-frequency ultrasound biomicroscopy (UBM) can depict the lens periphery behind the iris. Huang and colleagues estimated equatorial diameter using fitted lens outlines in a single-centre cross-sectional study of 194 eyes. This differs from anterior-to-posterior lens thickness. Their method was not established as a gold standard; displaced lenses and previous ocular trauma were excluded. Do not use this study to diagnose traumatic dislocation or assume ordinary ocular B-scan provides equivalent biometry. This atlas lens has no validated diameter, accommodation or ultrasound echoes. Adapted from Huang et al. (2024), CC BY 4.0; no images reproduced.',
      'lensBiometryUBM', 'renalReuseLicense',
    ),
    ct: draft(
      'In a retrospective acute-trauma study, thin-section multiplanar CT helped detect lens dislocation alongside other anterior-globe injuries, as an adjunct to ophthalmic assessment. Evaluate lens position in the context of the whole globe, not one apparent gap. Moving the atlas lens during separation is a viewing aid, not a traumatic dislocation or proof that the globe is intact.',
      'lensTraumaCT',
    ),
  },
  zonule: {
    ultrasound: draft(
      'UBM can visualise the zonule and its relationships behind the iris, where a surface view is insufficient. Relate the support apparatus to the lens and ciliary body on the actual examination. This grouped zonular mesh does not resolve individual fibres, identify a ruptured attachment or simulate their tension.',
      'anteriorSegmentUBM',
    ),
  },
  vitreous: {
    ultrasound: draft(
      'Real-time ocular ultrasound can assess echoes and moving interfaces in the vitreous cavity. Vitreous haemorrhage, vitreous detachment and retinal detachment are different findings; a multicentre study found limited sensitivity for vitreous detachment. That adult study excluded trauma and suspected globe rupture. Ultrasound was an adjunct, not a replacement for ophthalmic examination. This static compartment contains neither moving membranes nor a separate retinal mesh.',
      'vitreousPOCUS',
    ),
  },
  choroid: {
    ultrasound: draft(
      'For uveal melanoma, ultrasound and MRI can assess lesion dimensions, but a comparison study found systematic differences in measurements. They are not automatically interchangeable. This source choroid represents a coat of the eye, not a tumour: its two source pieces must not be mistaken for lesions or measured as tumour extent.',
      'uvealMelanomaImaging',
    ),
    mri: draft(
      'A uveal-melanoma study compared MRI with ophthalmic imaging and, in a subset, histopathology. MRI helped evaluate extraocular extension but had limitations for flat tumours and scleral invasion. The coloured choroid here supplies no MR signal, enhancement or lesion margin; a clean-looking boundary cannot establish absence of invasion.',
      'uvealMelanomaImaging',
    ),
  },
  sclera: {
    ultrasound: draft(
      'B-scan ultrasound can show thickening of the posterior sclera-choroidal complex and adjacent fluid. Vergouwen and colleagues illustrate an affected eye with fluid beside the sclera and optic nerve producing a T-sign. This example comes from a retrospective rheumatoid-arthritis/scleritis series, not a diagnostic-accuracy study: it does not establish a universal thickness threshold or a rule for excluding disease. Distinguish the combined imaged coats from this isolated scleral surface. Atlas separation and opacity do not simulate inflammation, fluid or ultrasound echoes. Adapted from Vergouwen et al. (2023), CC BY 4.0; no images reproduced.',
      'posteriorScleraBScan', 'renalReuseLicense',
    ),
    ct: draft(
      'A small retrospective scleritis series described eccentric globe-wall thickening and peripheral enhancement on CT, without separately resolving the globe layers. Do not equate a thick-looking atlas shell with inflammation: this model contains neither attenuation nor contrast enhancement, and the study does not establish a universal diagnostic rule.',
      'scleritisImaging',
    ),
    mri: draft(
      'In the same scleritis series, MRI demonstrated scleral thickening, enhancement and adjacent inflammatory change. Scleral enhancement must be distinguished from physiological choroidal enhancement. Interpret the actual sequence and clinical examination; the atlas colour and opacity controls cannot reproduce either finding or diagnose scleritis.',
      'scleritisImaging',
    ),
  },
  chamber: {
    ultrasound: draft(
      'UBM examines anterior-segment geometry, including the relationship of the iris to the chamber angle. Structural imaging is not a measurement of aqueous flow or intraocular pressure. Only the left anterior chamber is supplied here; its separated outline is neither a right-eye substitute nor a diagnostic angle or drainage assessment.',
      'anteriorSegmentUBM',
    ),
  },
} satisfies Record<string, Partial<Record<NestedImagingTopic, NestedSection>>>;
