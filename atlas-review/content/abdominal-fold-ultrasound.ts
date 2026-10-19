// Original factual teaching synthesis. Reading links do not license source illustrations.
export const abdominalFoldUltrasoundTopics = {
  mesentery: {
    title: 'Small-bowel mesentery · Ultrasound',
    body: 'Ultrasound can show mesenteric fat between bowel loops and vessels within it. Use the bowel wall, lumen and observed movement to distinguish bowel from the adjacent mesentery, and check the relationship in more than one plane. This atlas selection represents a generic anatomical fold, not a measured ultrasound boundary.',
    bullets: [
      'A broad abdominal survey and a targeted higher-frequency examination provide different views of the same relationships; neither guarantees depiction of the entire fold.',
      'Keep the mesenteric root and its fan-like attachments in mind when interpreting a local section. An unseen segment does not establish absent anatomy.',
    ],
    citations: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC5658311/'],
  },
  mesocolon: {
    title: 'Transverse mesocolon · Ultrasound and EUS',
    body: 'The transverse mesocolon connects the transverse colon to the posterior abdominal wall. An endoscopic ultrasound (EUS) review describes identifying it below the pancreas using its echogenic tissue and vascular relationships. EUS views obtained from the stomach are not equivalent to routine ultrasound through the abdominal wall.',
    bullets: [
      'Orient the fold against the pancreas, stomach and transverse colon. Adjacent greater omentum can be difficult to separate where the folds fuse.',
      'An echogenic band is not proof that the complete mesocolon boundary has been identified. The 3D selection is an orientation aid, not a registered EUS surface or an instruction for probe placement.',
    ],
    citations: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4361999/'],
  },
  mesoappendix: {
    title: 'Mesoappendix · Ultrasound',
    body: 'Assess the appendix and its surrounding fat as distinct structures. Periappendiceal fat can become more echogenic with appendiceal inflammation, but that is an accompanying observation, not a standalone diagnosis. The mesoappendix mesh is neither the appendiceal wall nor the entire region of bright surrounding fat.',
    bullets: [
      'The cited study included surgically confirmed appendicitis and excluded nonvisualized appendices; its findings do not establish a screening or rule-out test for an unselected population.',
      'Some confirmed cases had normal fat appearance. Do not use normal-looking fat alone to exclude appendicitis or infer an ultrasound abnormality from this generic atlas shape.',
    ],
    citations: ['https://pubmed.ncbi.nlm.nih.gov/34395109/'],
  },
} as const;
