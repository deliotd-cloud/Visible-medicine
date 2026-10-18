// Original questions about usual anatomy; not patient- or mesh-validated findings.
export const pelvicDuctQuizQuestions = {
  testis: {
    body: 'Where does sperm production normally occur within the testis?',
    choices: ['Seminiferous tubules', 'Epididymal tail', 'Seminal vesicle', 'Prostatic urethra'],
    correctAnswer: 'Seminiferous tubules',
    explanation: 'Sperm develop in seminiferous tubules. Their later maturation and storage in the epididymis are different processes; these microscopic tubules are not represented by the external testis mesh.',
    references: ['https://training.seer.cancer.gov/anatomy/reproductive/male/testes.html', 'https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html'],
  },
  duct: {
    body: 'Which duct joins the terminal deferent duct to form the ejaculatory duct?',
    choices: ['Ureter', 'Duct of the seminal vesicle', 'Efferent ductule of the testis', 'Bulbourethral gland duct'],
    correctAnswer: 'Duct of the seminal vesicle',
    explanation: 'The same-side seminal-vesicle duct meets the terminal ductus deferens to form an ejaculatory duct, which opens into the prostatic urethra. Sperm do not travel through the seminal vesicle itself as a serial transit stop. These junctions and lumen continuity are not established by the rendered surfaces.',
    references: ['https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html'],
  },
  urethra: {
    body: 'Which statement distinguishes the adult male urethra from a ureter?',
    choices: ['Both carry urine directly from kidney to bladder', 'The urethra produces sperm', 'The urethra carries urine outward from the bladder and also conveys semen', 'The ureter normally carries semen through the prostate'],
    correctAnswer: 'The urethra carries urine outward from the bladder and also conveys semen',
    explanation: 'A ureter connects a kidney with the bladder. The male urethra is the outlet for urine and also a reproductive passage for semen. This shared role does not mean simultaneous flow, and the surface model does not demonstrate patency.',
    references: ['https://training.seer.cancer.gov/anatomy/urinary/components/urethra.html', 'https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html'],
  },
} as const;
export type PelvicDuctQuizGroup = keyof typeof pelvicDuctQuizQuestions;
