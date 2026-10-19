// Original orientation prose; references supply facts, never embedded media.
export const thoracicInletXrayReferences = {
  vascularPedicle: 'https://radiologyassistant.nl/chest/chest-x-ray/heart-failure',
  centralVeins: 'https://www.radiologymasterclass.co.uk/tutorials/chest/chest_tubes/chest_xray_central_line_anatomy',
} as const;

const veinBody = 'On each side, the internal jugular and subclavian veins unite into a brachiocephalic vein. The brachiocephalic pair then forms the SVC in the right mediastinum.';
const rightVeinCue = 'A subclavian catheter may pass below the clavicle then curve toward the SVC. Its silhouette is not the vessel wall or proof of safe placement.';
const leftVeinCue = 'A left-sided catheter approach may follow a shallower course toward the right-sided SVC. Its silhouette is not the vessel wall or proof of safe placement.';

export const thoracicInletXrayTopics = {
  FMA3953: {
    body: 'The right vascular pedicle border relates to the SVC. Do not mirror the left subclavian-origin landmark onto the selected right subclavian artery.',
    cue: 'A projected mediastinal border does not trace the whole selected artery or establish its calibre.',
    references: [thoracicInletXrayReferences.vascularPedicle],
  },
  FMA4694: {
    body: 'The left vascular pedicle border relates to the left subclavian artery origin. Use this as a limited orientation landmark on the chest radiograph.',
    cue: 'A projected mediastinal border does not trace the whole selected artery or establish its calibre.',
    references: [thoracicInletXrayReferences.vascularPedicle],
  },
  FMA4755: {body: veinBody, cue: rightVeinCue, references: [thoracicInletXrayReferences.centralVeins]},
  FMA4763: {body: veinBody, cue: leftVeinCue, references: [thoracicInletXrayReferences.centralVeins]},
  FMA4751: {body: veinBody, cue: rightVeinCue, references: [thoracicInletXrayReferences.centralVeins]},
  FMA4761: {body: veinBody, cue: leftVeinCue, references: [thoracicInletXrayReferences.centralVeins]},
} as const;

export const thoracicInletXrayShared = [
  'Check patient side and projection on the acquired image; screen-left is not patient-left. The lesson title identifies the selected named source vessel.',
  'Reassemble to 0% separation before comparison. This reference model is not a radiograph and supplies no patient measurement or patient-to-model registration.',
] as const;
