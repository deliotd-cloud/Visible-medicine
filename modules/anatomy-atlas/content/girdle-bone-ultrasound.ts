// Original orientation summaries; references are reading links, not licensed images.
export const girdleBoneUltrasoundReferences = {
  shoulder: 'https://www.essr.org/content-essr/uploads/2016/10/shoulder.pdf',
  hip: 'https://essr.org/content-essr/uploads/2016/10/hip.pdf',
  limits: 'https://www.radiologyinfo.org/en/info/musculous',
} as const;

export type GirdleBoneUltrasoundGroup = 'clavicle' | 'humerus' | 'scapula' | 'hip';
type Topic = {body: string; landmark: string; limit: string; reference: 'shoulder' | 'hip'};
export const girdleBoneUltrasoundTopics: Record<GirdleBoneUltrasoundGroup, Topic> = {
  clavicle: {
    body: 'At the superior shoulder, distinguish the lateral clavicle from the acromion across the acromioclavicular joint.',
    landmark: 'The acromion is scapular, not part of the selected clavicle.',
    limit: 'A whole-clavicle highlight is not a segmented joint capsule or ligament. This lesson does not assess the sternoclavicular joint.',
    reference: 'shoulder',
  },
  humerus: {
    body: 'At the proximal humerus, the long-head biceps tendon occupies the groove between the greater and lesser tuberosities.',
    landmark: 'Use those bony landmarks to orient the actual ultrasound image before interpreting nearby tendons.',
    limit: 'The whole humerus is selected, but this shoulder lesson does not cover the elbow. No tendon integrity or dynamic stability is encoded by the bone mesh.',
    reference: 'shoulder',
  },
  scapula: {
    body: 'Posteriorly, the scapular spine separates the supraspinous and infraspinous fossae. At the superior shoulder, identify the acromion beside the lateral clavicle.',
    landmark: 'These are landmarks on one scapula, not additional selectable bones.',
    limit: 'This whole-bone surface is not a complete ultrasound view of the scapula, nor a validated glenoid labrum or cuff segmentation.',
    reference: 'shoulder',
  },
  hip: {
    body: 'At the anterior hip, distinguish the anterior superior iliac spine near sartorius and tensor fasciae latae from the anterior inferior iliac spine at the direct rectus femoris tendon attachment.',
    landmark: 'These iliac landmarks belong to the hip bone. The greater trochanter belongs to the neighbouring femur.',
    limit: 'A whole adult hip-bone mesh is not a complete ultrasound map of the pelvic ring, acetabulum or labrum. It does not represent an infant hip examination.',
    reference: 'hip',
  },
};

export const girdleBoneUltrasoundSurfaceLimit =
  'Adult bone ultrasound shows accessible outer surfaces, not marrow or the bone interior; depth can limit visibility.';
