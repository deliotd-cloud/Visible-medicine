// Original factual teaching; no third-party table, illustration or patient image.
export const laryngealMuscleTeachingReferences = [
  'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
  'https://doi.org/10.1186/s13244-019-0786-7',
  'https://creativecommons.org/licenses/by/4.0/',
] as const;

export const laryngealMuscleTeachingCredit = 'Anatomical facts checked against Texas Tech University Health Sciences Center El Paso, Anatomy Tables: Larynx and Neck; no table or artwork reproduced. Innervation context adapted from Montoya S, Portanova A and Bhatt AA, A radiologic review of hoarse voice from anatomic and neurologic perspectives, Insights Imaging 10, 108 (2019), CC BY 4.0. Original summary; no endorsement implied.';

export const laryngealMuscleTeachingTopics = {
  posterior: {
    anatomy: {
      title: 'Posterior cricoarytenoid attachments',
      body: 'A paired muscle behind the larynx, extending from the posterior cricoid lamina to the muscular process of its arytenoid.',
      prompt: 'Compare this selected source with the cricoid and same-side arytenoid in the existing posterior laryngeal study window. Surface contact is not an independently validated attachment footprint.',
    },
    function: {
      title: 'Vocal-fold opening',
      body: 'Posterior pull on the muscular process rotates the arytenoid to separate the vocal folds. This is the sole vocal-fold abductor.',
      prompt: 'Compare with the lateral cricoarytenoid entry to distinguish opening from closing. Explode and rotate are viewing controls, not a simulation of muscle contraction or breathing.',
    },
  },
  lateral: {
    anatomy: {
      title: 'Lateral cricoarytenoid attachments',
      body: 'This paired muscle links the cricoid arch to the muscular process of the same-side arytenoid, unlike the posterior muscle on the lamina.',
      prompt: 'Use the cricoid and same-side arytenoid as reference selections. The supplied muscle surface does not verify its attachment area or a surgical plane.',
    },
    function: {
      title: 'Vocal-fold closing',
      body: 'Anterior traction on the muscular process rotates the arytenoid toward vocal-fold closure. Its adducting action opposes the posterior cricoarytenoid.',
      prompt: 'Compare the two separately selectable muscles before separating them. Their displayed positions do not measure contraction, glottic closure or voice quality.',
    },
  },
  transverse: {
    anatomy: {
      title: 'Transverse interarytenoid bridge',
      body: 'Transverse fibres bridge the posterior aspects of the two arytenoid cartilages. This source is a single midline selection, not a right-left pair.',
      prompt: 'Keep both arytenoid cartilages visible for orientation. Source naming and a continuous-looking surface do not establish the completeness of the interarytenoid muscle or mucosal covering.',
    },
    function: {
      title: 'Arytenoid approximation',
      body: 'The transverse component brings the arytenoids together, contributing to vocal-fold adduction rather than opening.',
      prompt: 'Compare this bridging source with the paired cricoarytenoids. No airway lumen, seal, vibration or coordinated swallowing is simulated.',
    },
  },
  oblique: {
    anatomy: {
      title: 'Crossing interarytenoid fibres',
      body: 'Oblique fibres ascend from one arytenoid muscular process toward the opposite arytenoid near its apex, forming a crossing arrangement with the other side.',
      prompt: 'The left/right names identify supplied source records. Do not infer a validated fibre-by-fibre crossing, attachment boundary or continuous aryepiglottic extension from them.',
    },
    function: {
      title: 'Interarytenoid adduction',
      body: 'These oblique fibres help approximate the arytenoids and contribute to adduction. They do not replace the posterior cricoarytenoid opening action.',
      prompt: 'Compare both oblique selections and the transverse component. Moving either source in an exploded view illustrates separation only, not normal contraction or swallowing.',
    },
  },
} as const;
