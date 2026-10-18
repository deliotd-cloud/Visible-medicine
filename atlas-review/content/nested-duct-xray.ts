import type { NestedSection } from './nested-teaching';

// Original orientation notes only; no source figures or procedure instructions.
// Shared ERCP key keeps the combined source budget visible across both concepts.
export const nestedDuctXrayReferences = {
  ductXrayErcp: {
    title: 'NIDDK · ERCP: contrast X-ray duct imaging',
    url: 'https://www.niddk.nih.gov/health-information/diagnostic-tests/endoscopic-retrograde-cholangiopancreatography',
    scopedToConcept: true,
  },
  ductXrayPtc: {
    title: 'ACR / RSNA · Biliary interventions: contrast cholangiography',
    url: 'https://www.radiologyinfo.org/en/info/biliary',
    scopedToConcept: true,
  },
};

export const pancreaticDuctXrayTeaching: NestedSection = {
  body: 'ERCP combines endoscopy with fluoroscopic X-ray imaging after contrast injection into the ducts. Use these source components for orientation to a contrast-outlined pancreatic duct, not as a plain-radiograph duct map. The two selections do not establish two complete independent trees or an accessory duct. A model gap or contact is not evidence of leakage, obstruction or communication. No patent lumen, papilla, measured calibre, acquired image or patient correspondence is supplied. Restore assembled anatomy before comparing relationships; explosion is not an X-ray projection.',
  references: ['ductXrayErcp'],
  readiness: 'draft',
};

export const hepaticDuctXrayTeaching: NestedSection = {
  body: 'Contrast X-ray cholangiography outlines opacified bile ducts. ERCP uses endoscopic access, whereas percutaneous transhepatic cholangiography (PTC) uses a different access route for contrast images. The right and left hepatic source groups provide intrahepatic orientation, not a procedural plan. Compare only the parts actually outlined on an authorised image. Apparent surface contacts cannot validate a confluence, open lumen or complete extrahepatic course; gaps are not a diagnosis of obstruction. No acquired cholangiogram, contrast dynamics, measured calibre or patient registration is supplied. Use assembled anatomy, not explosion, for spatial comparison.',
  references: ['ductXrayErcp', 'ductXrayPtc'],
  readiness: 'draft',
};
