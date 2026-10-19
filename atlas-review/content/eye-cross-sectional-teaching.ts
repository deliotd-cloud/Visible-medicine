import type { NestedImagingTopic, NestedSection } from './nested-teaching';

export const eyeCrossSectionalReferences = {
  eyeCrossSectionalMRAnatomy: {
    title: 'Foti, Travali, Farina et al. (2021) · MR anatomy of the eye · CC BY 4.0 · Original teaching adaptation; no images reproduced',
    url: 'https://link.springer.com/article/10.1186/s13244-021-01000-x',
  },
  eyeCrossSectionalPosteriorAnatomy: {
    title: 'De La Hoz Polo, Torramilans Lluís, Pozuelo Segura et al. (2016) · Ocular ultrasonography focused on the posterior eye segment · CC BY 4.0 · Original teaching adaptation; no images reproduced',
    url: 'https://link.springer.com/article/10.1007/s13244-016-0471-z',
  },
};

const draft = (body: string, source: string): NestedSection => ({
  body,
  references: [source, 'renalReuseLicense'],
  readiness: 'draft',
});

// Original draft teaching for source geometry, not acquired imaging or clinical review.
export const eyeCrossSectionalTeaching = {
  cornea: {
    ct: draft(
      'Locate the cornea anterior to the chamber and iris when orienting a CT section. The atlas boundary is a spatial cue, not CT attenuation or a calibrated corneal thickness.',
      'eyeCrossSectionalPosteriorAnatomy',
    ),
    mri: draft(
      'The collagen-rich cornea has low MR signal in the cited review. Orient it anterior to the aqueous space; model colour does not encode sequence signal or resolve corneal layers.',
      'eyeCrossSectionalMRAnatomy',
    ),
  },
  iris: {
    ct: draft(
      'Relate the iris to the chamber anteriorly and lens posteriorly when orienting CT. The pupil-surrounding model surface contains neither attenuation nor separately resolved iris layers; its rim is geometry.',
      'eyeCrossSectionalPosteriorAnatomy',
    ),
    mri: draft(
      'The iris belongs to the uveal tract; physiological enhancement is possible on contrast MRI. Relate it to the pupil and lens, but do not interpret mesh colour as enhancement.',
      'eyeCrossSectionalMRAnatomy',
    ),
  },
  lens: {
    mri: draft(
      'The normal protein-rich lens has relatively low T2 signal. Its biconvex position behind the iris aids orientation; atlas shade is not a signal measurement or a cataract assessment.',
      'eyeCrossSectionalMRAnatomy',
    ),
  },
  zonule: {
    ct: draft(
      'Orient the lens support beside the lens and ciliary region in a CT overview. This grouped mesh is not a resolved CT fibre map; model gaps cannot establish attachment disruption.',
      'eyeCrossSectionalPosteriorAnatomy',
    ),
    mri: draft(
      'Zonular fibres connect ciliary body and lens. This grouped support mesh cannot resolve individual fibres, tension or MR signal; separation is a viewing aid, not a support-tear map.',
      'eyeCrossSectionalMRAnatomy',
    ),
  },
  vitreous: {
    ct: draft(
      'Locate the vitreous cavity behind the lens when orienting CT. This model supplies a compartment, not attenuation or internal interfaces; its transparency cannot establish that an acquired cavity is clear.',
      'eyeCrossSectionalPosteriorAnatomy',
    ),
    mri: draft(
      'Normal vitreous is dark on T1-weighted and bright on T2-weighted MRI. Locate it behind the lens; this mesh has no acquired signal, internal membranes or separate retinal surface.',
      'eyeCrossSectionalMRAnatomy',
    ),
  },
  choroid: {
    ct: draft(
      'Normal posterior globe coats are closely apposed. The atlas isolates choroid for CT orientation, not resolved layer segmentation; its two source pieces are not lesions, and no retinal mesh exists.',
      'eyeCrossSectionalPosteriorAnatomy',
    ),
  },
  chamber: {
    ct: draft(
      'The anterior chamber lies between cornea and iris. Its left-only outline supports CT orientation, not fluid attenuation, measured depth or angle assessment. There is no right-eye chamber substitute.',
      'eyeCrossSectionalPosteriorAnatomy',
    ),
    mri: draft(
      'Normal aqueous fluid is dark on T1-weighted and bright on T2-weighted MRI. The left anterior chamber orients this space; it supplies neither acquired signal, depth measurement nor a right counterpart.',
      'eyeCrossSectionalMRAnatomy',
    ),
  },
} satisfies Record<string, Partial<Record<NestedImagingTopic, NestedSection>>>;
