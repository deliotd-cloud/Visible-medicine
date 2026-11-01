import type { NestedSection } from './nested-teaching';

// Original orientation text; references are reading links, not redistributed assets.
export const hepaticVascularXrayReferences = {
  hepaticArterialDSA: {
    title: 'Choi et al. · Anatomic Variations of the Hepatic Artery in 5625 Patients (2021)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8415139/',
    scopedToConcept: true,
  },
  hepaticPortalVenogram: {
    title: 'Salei et al. · Portal Interventions in the Setting of Venous Thrombosis or Occlusion (2022), Anatomy and Figure 1',
    url: 'https://pubs.rsna.org/radiology/doi/10.1148/rg.220020',
    scopedToConcept: true,
  },
};

export const hepaticArterialXray: NestedSection = {
  body: 'On a contrast angiogram, follow the visible origin and course of the right or left hepatic artery. Digital subtraction angiography and CT were used together in the cited study; an artery need not arise or travel exactly as the atlas depicts. Compare the selected side with the acquired examination, retaining the observed branching pattern. These source surfaces are orientation aids, not plain-radiograph outlines, a complete perfusion map or a catheter route. Assemble the model before comparison. No angiogram, contrast flow, measured stenosis or patient registration is supplied.',
  references: ['hepaticArterialDSA'],
  readiness: 'draft',
};

export const hepaticPortalXray: NestedSection = {
  body: 'A contrast portal venogram can outline the main portal vein and its right and left branches, as in the cited anatomical example. Trace the opacified branches and check the acquired branching pattern rather than assuming every patient matches this source tree. These portal selections describe liver inflow, distinct from hepatic venous outflow. They are not a plain-radiograph vascular map. Use assembled anatomy for orientation; the model supplies no contrast dynamics, portal pressure, complete segmental territories or patient registration, and its surface gaps do not establish thrombosis.',
  references: ['hepaticPortalVenogram'],
  readiness: 'draft',
};
