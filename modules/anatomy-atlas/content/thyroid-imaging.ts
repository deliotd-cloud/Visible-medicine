// Original brief teaching. Reading links do not redistribute publisher assets.
export const thyroidImagingTopics={
  ct:{
    title:'CTA: confirm the arterial origin',
    body:'CT angiography can show where an inferior thyroid artery originates. In a 210-subject CTA study, origins from the thyrocervical trunk, subclavian artery and vertebral artery were observed. The mapped parent in a reference atlas is therefore not a substitute for tracing the actual vessel in a patient acquisition.',
    bullets:[
      'Orient using the selected side and its mapped thyrocervical parent, then check the vessel origin independently on source images. The study does not establish visibility of every terminal branch in every acquisition.',
      'In a reported pseudoaneurysm, CT/CTA depicted a cervical haematoma and mass effect; angiography confirmed the inferior thyroid arterial feeder. A nearby arterial surface alone does not identify the source of bleeding.',
    ],
    citations:['https://www.wjgnet.com/1949-8470/full/v15/i6/182.htm','https://link.springer.com/article/10.1186/s12871-015-0052-6'],
    credit:'Bhardwaj et al. (2023), retrospective CTA cohort; Ruan et al. (2015), single case. No universal variant frequencies, diagnostic accuracy or treatment rule inferred.',
  },
  ultrasound:{
    title:'Doppler: measured flow, not mesh colour',
    body:'Colour Doppler examinations can assess the inferior thyroid artery and obtain peak systolic velocity, end-diastolic velocity and resistance index. These measurements were studied in a cohort of 119 women. They come from the ultrasound examination, not from the red colour, apparent calibre or separation of this 3D reference surface.',
    bullets:[
      'Use the atlas for sided orientation only. It contains no Doppler waveform, velocity scale, insonation angle, sample gate or measured lumen, and cannot supply a normal value or thyroid-function diagnosis.',
      'In a single reported arterial injury, Doppler showed a neck mass communicating with an adjacent artery; subsequent angiography identified the inferior thyroid source. This is a case example, not evidence that every neck mass or pseudoaneurysm can be assigned from one Doppler view.',
    ],
    citations:['https://pubmed.ncbi.nlm.nih.gov/25142871/','https://link.springer.com/article/10.1186/s12871-015-0052-6'],
    credit:'Garcia and Rech (2015), observational ultrasound study; Ruan et al. (2015), single case. No measurement thresholds, medication advice or intervention instructions imported.',
  },
} as const;
