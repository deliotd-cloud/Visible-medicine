// Original factual synthesis; cited publications are reading sources, not imported assets.
export const spinalDiscUltrasoundGroups = {
  cervicalDisc: ['FMA13896', 'FMA13897', 'FMA13898', 'FMA13899', 'FMA13900'],
  thoracicDisc: ['FMA13495', 'FMA13500', 'FMA13501', 'FMA13502', 'FMA13503', 'FMA13504', 'FMA13505', 'FMA13506', 'FMA13507', 'FMA13508'],
  lumbarDisc: ['FMA16033', 'FMA16034', 'FMA16035', 'FMA16036'],
} as const;
export const spinalDiscUltrasoundTopics = {
  cervicalDisc: {
    body: 'Keep the cervical disc distinct from the vertebral body surface and the prevertebral soft tissues. An anterior neck ultrasound study in ten healthy volunteers demonstrated the longus colli and anterior C3–C6 vertebral surfaces, with less consistent visibility at the ends of the examined cervical range. This was evidence about accessible landmarks, not a validation of disc-internal assessment or exclusion of disc disease.',
    bullets: [
      'Use the 3D disc to understand its relationship to the vertebral bodies and tissues anterior to the spine; its full visible outline must not be interpreted as the ultrasound field of view.',
      'The small healthy-volunteer feasibility study does not establish diagnostic performance in postoperative or symptomatic patients. A visible anterior landmark cannot certify the posterior disc margin, cord or neural foramina.',
    ],
    citations: ['https://pubmed.ncbi.nlm.nih.gov/37813455/'],
  },
  thoracicDisc: {
    body: 'Distinguish a thoracic interlaminar acoustic window from the disc between vertebral bodies farther anteriorly. In a study of 61 adult volunteers, the visibility endpoint was the ligamentum-flavum/dura complex, not the internal disc. The upper thoracic region produced more inconclusive views than the lower thoracic region.',
    bullets: [
      'The study found better visibility with an oblique paramedian view than with a transverse midline view overall. That finding describes acoustic access; it does not make the entire thoracic disc or canal routinely visible.',
      'Bone-limited access and a nonvisualized deep structure do not establish absence, degeneration or a normal examination. This generic disc surface has no measured ultrasound boundary or validated correspondence to those volunteer images.',
    ],
    citations: ['https://pubmed.ncbi.nlm.nih.gov/22354105/'],
  },
  lumbarDisc: {
    body: 'Separate lumbar disc imaging research from posterior spinal landmark sonography. A human cadaveric study examined L4–L5 and L5–S1 discs through the anterior abdominal wall and with direct access to the anterior longitudinal ligament. Those experimental conditions do not establish routine visualization of every lumbar disc or reliable assessment of a symptomatic living patient.',
    bullets: [
      'The study reported that shear-wave measurements were restricted to the anterior disc and were unreliable. Do not derive stiffness, pressure, internal tears or a patient diagnosis from this static whole-disc mesh.',
      'Posterior spinal ultrasound may display vertebral and ligament/dural interfaces together rather than separate tissue layers. Such an interface is not a complete outline of the annulus or nucleus, and it must not be substituted for the selected whole disc.',
    ],
    citations: ['https://doi.org/10.1177/87564793211008342', 'https://pieweb.med.utoronto.ca/OBAnesthesia/OBAnesthesia_content/OBA_spinalUltrasound_module.html'],
  },
} as const;
