// Original concise teaching; no article media, tables, cases or patient data.
export const deepVenousClinicalReferences = [
  'https://www.nhlbi.nih.gov/health/deep-vein-thrombosis',
  'https://doi.org/10.1186/s12959-023-00550-y',
  'https://creativecommons.org/licenses/by/4.0/',
] as const;

export const deepVenousClinicalCredit = 'Source: National Heart, Lung, and Blood Institute; National Institutes of Health; U.S. Department of Health and Human Services. Ultrasound interpretation context: original adapted summary of Akram F et al., Thrombosis Journal 2023;21:110 (CC BY 4.0). No endorsement implied; linked media are not included.';

export const deepVenousClinicalTopics = {
  anterior: {
    clinical: {
      title: 'Anterior calf veins & ultrasound assessment',
      body: 'Identify this anterior leg selection separately from the posterior tibial veins. In a real venous ultrasound examination, compression assesses the response of the vein, while Doppler contributes flow information. Rotating, fading or separating this surface performs neither assessment: an apparently open model is not evidence of a patent vein.',
      prompt: 'Study question: what additional acquired evidence would you need before describing compressibility or flow? The 3D colour and apparent vessel width are display choices, not ultrasound findings.',
    },
    pathology: {
      title: 'Calf deep-vein thrombosis',
      body: 'A thrombus in an anterior tibial vein is a deep calf venous lesion, not an arterial occlusion. DVT may be associated with pulmonary embolism. This lesson introduces the distinction between the affected vessel and a possible distant complication; it does not predict embolic risk from vessel size or from the model.',
      prompt: 'Compare the vein with its arterial neighbour, then identify the popliteal direction. The selection does not establish thrombus presence, proximal extension or the condition of unmodelled companion veins.',
    },
  },
  posterior: {
    clinical: {
      title: 'Posterior calf context & symptom correlation',
      body: 'Use the posterior tibial selection to orient within the deep posterior leg, rather than to localise disease from symptoms alone. Leg swelling, pain or warmth may accompany DVT, but assessment combines clinical history, examination and appropriate tests. A normal-looking atlas cannot confirm or exclude a clot.',
      prompt: 'Study question: which findings come from the patient and which come from imaging? A single displayed calf vein is not a complete venous examination or an exclusion of disease elsewhere.',
    },
    pathology: {
      title: 'Thrombosis versus post-thrombotic change',
      body: 'Posterior tibial thrombosis is a calf DVT example. On subsequent ultrasound, persistent abnormality may represent chronic post-thrombotic change rather than a new acute clot. Interpret appearances with the clinical course and available prior imaging; ultrasound appearance alone may not reliably date a thrombus.',
      prompt: 'Do not label a narrowed or irregular atlas surface as acute or chronic thrombosis. There is no pathological lumen, ultrasound texture or earlier patient examination in this reference selection.',
    },
  },
  profunda: {
    clinical: {
      title: 'Name the deep thigh vessel precisely',
      body: 'The deep femoral vein, also called the profunda femoris vein, is a distinct deep thigh selection rather than another name for the femoral vein. When linking an imaging finding, retain the precise vessel and side: identifying one source must not silently select or imply assessment of the other.',
      prompt: 'Select the same-side femoral vein separately and compare the names. A teaching drainage relationship is not a demonstrated patient confluence or proof that either vessel has been examined.',
    },
    pathology: {
      title: 'Deep thigh thrombosis & extent',
      body: 'A clot involving the profunda femoris vein concerns the deep thigh venous system. Record the named vessel and extent on actual imaging rather than inferring involvement of the adjacent femoral vein. DVT assessment requires patient evidence; the length of this selected source is not the length of a thrombus.',
      prompt: 'Study question: does selecting the profunda show femoral-vein thrombosis? No. Separate structures and their imaging findings require separate identification; neither isolation nor explode mode depicts clot propagation.',
    },
  },
} as const;
