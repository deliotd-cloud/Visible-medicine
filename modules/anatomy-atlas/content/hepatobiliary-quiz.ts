// Original formative questions. References support usual anatomy, not the
// completeness, continuity or clinical accuracy of the displayed surfaces.
const accessory='https://training.seer.cancer.gov/anatomy/digestive/regions/accessory.html';
const ducts='https://anatomy.ttuhscep.edu/schemes/liver_ans.html';
export const hepatobiliaryQuizQuestions={
  liver:{
    body:'Which pair provides the liver with its usual dual blood inflow?',
    choices:['Hepatic veins and inferior vena cava','Hepatic arterial branches and hepatic portal vein','Common hepatic duct and cystic duct','Hepatic veins and common bile duct'],
    correctAnswer:'Hepatic arterial branches and hepatic portal vein',
    explanation:'Arterial branches and the portal vein bring blood into the liver. Hepatic veins carry blood away; bile ducts carry bile rather than blood. The external liver surface does not establish perfusion or vascular patency.',
    references:[accessory],
  },
  gallbladder:{
    body:'Which statement correctly distinguishes the gallbladder from the liver?',
    choices:['The gallbladder produces bile and the liver only stores it','Both organs normally produce pancreatic enzymes','The gallbladder stores bile produced by the liver','The gallbladder receives urine from the kidneys'],
    correctAnswer:'The gallbladder stores bile produced by the liver',
    explanation:'Bile is made in the liver. The gallbladder stores it between meals and releases it into the biliary ducts. A rendered gallbladder surface does not show bile movement, contraction, stones or inflammation.',
    references:['https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'],
  },
  portal:{
    body:'Which statement distinguishes the hepatic portal vein from the hepatic veins?',
    choices:['The portal vein normally carries bile to the duodenum','The portal vein brings venous blood from digestive organs toward the liver','The portal vein is the principal venous outlet from liver to inferior vena cava','The portal vein is an artery arising directly from the aorta'],
    correctAnswer:'The portal vein brings venous blood from digestive organs toward the liver',
    explanation:'Portal blood reaches the liver for processing; hepatic veins provide venous outflow to the inferior vena cava. Do not infer a patient’s flow direction, thrombosis or portal pressure from this reference surface.',
    references:[accessory,ducts],
  },
  cystic:{
    body:'In the usual biliary arrangement, the cystic duct joins which duct to form the common bile duct?',
    choices:['Common hepatic duct','Main pancreatic duct','Right hepatic vein','Hepatic portal vein'],
    correctAnswer:'Common hepatic duct',
    explanation:'The cystic duct communicates with the gallbladder and meets the common hepatic duct at the usual common-bile-duct junction. Biliary variants exist; separate source meshes do not validate their junction or a safe operative plane.',
    references:[ducts],
  },
  hepatic:{
    body:'Which usual upstream union forms the common hepatic duct?',
    choices:['Cystic duct and main pancreatic duct','Hepatic artery and portal vein','Right and left hepatic ducts','Right and left hepatic veins'],
    correctAnswer:'Right and left hepatic ducts',
    explanation:'The right and left hepatic ducts normally unite to form the common hepatic duct. Its later union with the cystic duct forms the common bile duct. The displayed selection is not a complete biliary tree or a patient-specific branching map.',
    references:[ducts],
  },
} as const;
export type HepatobiliaryQuizGroup=keyof typeof hepatobiliaryQuizQuestions;
