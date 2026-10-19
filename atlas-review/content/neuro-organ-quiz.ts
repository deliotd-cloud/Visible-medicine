// Original formative wording about general anatomy; source surfaces do not establish complete anatomy or physiology.
const brain = 'https://anatomy.ttuhscep.edu/anatomytables/brain.html';
const centralCanal = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4614133/';
const pituitary = 'https://www.yourhormones.info/glands/pituitary-gland/';
const pituitarySella = 'https://www.yourhormones.info/endocrine-conditions/empty-sella-syndrome/';
const eye = 'https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/how-eyes-work';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, references: string[]) =>
  ({body, choices, correctAnswer, explanation, references});

export const neuroOrganQuizQuestions = {
  brain: question('Which three structures make up the brainstem?',
    ['Cerebrum, cerebellum and thalamus', 'Midbrain, pons and medulla oblongata', 'Pons, cerebellum and spinal cord', 'Thalamus, hypothalamus and midbrain'],
    'Midbrain, pons and medulla oblongata',
    'The brainstem consists of the midbrain, pons and medulla oblongata; the aggregate brain mesh does not independently validate these boundaries.', [brain]),
  centralCanal: question('Which cell type lines a patent central canal of the spinal cord?',
    ['Astrocytes', 'Schwann cells', 'Osteocytes', 'Ependymal cells'], 'Ependymal cells',
    'Ependymal cells line a patent central canal. In most adult human spinal cords the canal is not patent, so this source surface does not establish an open lumen.', [centralCanal]),
  pituitary: question('The pituitary gland sits in which bony depression?',
    ['Sella turcica of the sphenoid', 'Cribriform plate of the ethmoid', 'Jugular fossa of the temporal bone', 'Foramen magnum of the occipital bone'],
    'Sella turcica of the sphenoid',
    'The pituitary sits in the sella turcica, a depression of the sphenoid bone. This source mesh does not establish an individual patient position.', [pituitary, pituitarySella]),
  eyeball: question('Which part of the eye detects incoming light?',
    ['Cornea', 'Iris', 'Retina', 'Sclera'], 'Retina',
    'Photoreceptors in the retina convert light into electrical signals. The globe source aggregate does not independently segment or validate the retina.', [eye]),
  tentorium: question('The tentorium cerebelli is a dural fold between which structures?',
    ['Cerebellum and spinal cord', 'Cerebral hemispheres and cerebellum', 'Two cerebral hemispheres', 'Two cerebellar hemispheres'],
    'Cerebral hemispheres and cerebellum',
    'The tentorium is a dural sheet over the cerebellum, separating it from posterior cerebrum. The selectable source represents only a right-sided portion.', [brain]),
} as const;
export type NeuroOrganQuizGroup = keyof typeof neuroOrganQuizQuestions;
