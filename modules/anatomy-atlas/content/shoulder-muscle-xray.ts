// Original plain-film orientation teaching. Links support facts, not reuse of figures or tables.
export const shoulderMuscleXrayReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
  deltoidVariant: 'https://pubmed.ncbi.nlm.nih.gov/11587519/',
  tricepsCases: 'https://pubmed.ncbi.nlm.nih.gov/33815751/',
  tricepsCohort: 'https://pubmed.ncbi.nlm.nih.gov/33181575/',
  shoulderGuideline: 'https://pubmed.ncbi.nlm.nih.gov/37236752/',
} as const;

export const shoulderMuscleXrayShared = {
  limitation: 'A radiograph projects bones and overlapping soft tissues; it does not trace this individual muscle part or establish tendon continuity. The selected surface is an anatomical guide, not a patient radiograph.',
  deltoid: 'If a cortical change is seen near the deltoid tuberosity, describe its actual appearance and assess it in clinical context. A five-patient series reported an indolent variant there, but location alone cannot classify a lesion or identify which deltoid part is involved.',
  biceps: 'A plain film can show associated bony findings, but a normal film cannot establish that either biceps tendon is intact. The two heads share a distal attachment apparatus at the radial tuberosity; this selection does not isolate the distal tendon.',
  triceps: 'An olecranon-adjacent fragment may be a clue to distal triceps injury, but absence of that clue does not exclude it. Published cases include normal radiographs; head and depth patterns in a selected surgical/MRI cohort were determined beyond plain film. The distal apparatus is shared by the triceps heads.',
} as const;

export const shoulderMuscleXrayTopics = {
  'deltoid-clavicular': {
    body: 'The lateral clavicle and humeral deltoid tuberosity orient this anterior part; a radiograph does not outline its separate border.',
    family: 'deltoid',
  },
  'deltoid-acromial': {
    body: 'Relate the acromion to the humeral deltoid tuberosity. The lateral shoulder cap is not a radiographically isolated compartment.',
    family: 'deltoid',
  },
  'deltoid-spinal': {
    body: 'The scapular spine and deltoid tuberosity orient this posterior part; underlying cuff tissue is not its radiographic outline.',
    family: 'deltoid',
  },
  'biceps-short-head': {
    body: 'The coracoid marks the short head’s origin, unlike the long head’s supraglenoid origin. Distal biceps reaches the radial tuberosity.',
    family: 'biceps',
  },
  'biceps-long-head': {
    body: 'Use the superior glenoid and proximal humeral intertubercular groove as landmarks; the shared distal biceps attachment is radial.',
    family: 'biceps',
  },
  'triceps-medial-head': {
    body: 'This deep humeral-origin head begins below the radial groove; its distal apparatus reaches the ulnar olecranon, not the radius.',
    family: 'triceps',
  },
  'triceps-lateral-head': {
    body: 'This head arises above the radial groove on the posterior humerus and contributes to the ulnar olecranon extensor apparatus.',
    family: 'triceps',
  },
  'triceps-long-head': {
    body: 'The infraglenoid scapular origin distinguishes this head from the humeral-origin heads; distally it joins the ulnar olecranon extensor apparatus.',
    family: 'triceps',
  },
} as const;
