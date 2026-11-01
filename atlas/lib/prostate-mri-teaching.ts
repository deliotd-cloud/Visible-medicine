import type { ProstateZoneKey } from './prostate-zones';

/** Original education text, bound into the model revision; no image coordinates. */
export const prostateMriReferences = {
  acr: {
    title: 'ACR–ESUR–AdMeTech PI-RADS v2.1 (2019)',
    href: 'https://edge.sitecorecloud.io/americancoldf5f-acrorgf92a-productioncb02-3650/media/ACR/Files/RADS/PI-RADS/PIRADS-2019.pdf',
    section: 'Normal anatomy; evaluation of the central zone and anterior fibromuscular stroma',
  },
  anatomy: {
    title: 'Normal 3T MR Anatomy of the Prostate Gland and Surrounding Structures (2019)',
    href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6558623/',
    section: 'Zonal anatomy: peripheral and transition zones only',
  },
} as const;

type ReferenceKey = keyof typeof prostateMriReferences;
export type ProstateMriLesson = {
  landmark: string;
  signal: string;
  caution: string;
  reference: ReferenceKey;
  cautionReference?: ReferenceKey;
  question: string;
  choices: readonly { id: string; label: string }[];
  answerId: string;
  explanation: string;
};

export const prostateMriLessons: Record<ProstateZoneKey, ProstateMriLesson> = {
  peripheral: {
    landmark: 'Follow the outer posterior gland through the mid-gland and towards the apex.',
    signal: 'Normal tissue is generally bright on T2-weighted images.',
    caution: 'Trace its boundary across adjacent images; the diagram does not supply a scan boundary.',
    reference: 'anatomy',
    question: 'Where would you begin looking for the peripheral zone?',
    choices: [{id: 'anterior', label: 'Anterior non-glandular layer'}, {id: 'posterior', label: 'Outer posterior gland'}, {id: 'ducts', label: 'Basal tissue around ejaculatory ducts'}],
    answerId: 'posterior', explanation: 'Its posterior position and apical extent are useful landmarks.',
  },
  transition: {
    landmark: 'Locate the paired glandular tissue around the urethra above the verumontanum.',
    signal: 'Use its periurethral position together with T2 appearance.',
    caution: 'Identify the central zone separately rather than grouping both under one label.',
    reference: 'anatomy',
    cautionReference: 'acr',
    question: 'Which structure is the key landmark for the transition zone?',
    choices: [{id: 'rectum', label: 'Rectal lumen'}, {id: 'ducts', label: 'Ejaculatory ducts'}, {id: 'urethra', label: 'Proximal prostatic urethra'}],
    answerId: 'urethra', explanation: 'The transition zone lies around the proximal prostatic urethra.',
  },
  central: {
    landmark: 'Trace tissue around the ejaculatory ducts from the base towards the verumontanum.',
    signal: 'Normal central-zone tissue can be symmetrically dark on T2.',
    caution: 'Transition-zone enlargement can displace it. Low signal alone does not establish a lesion.',
    reference: 'acr',
    question: 'Which relationship identifies the central zone?',
    choices: [{id: 'ducts', label: 'Surrounds ejaculatory ducts'}, {id: 'rectum', label: 'Within the rectal wall'}, {id: 'anterior', label: 'Entire anterior surface'}],
    answerId: 'ducts', explanation: 'Follow the ducts and basal taper across planes.',
  },
  stroma: {
    landmark: 'Find the anterior layer of muscle and fibrous tissue.',
    signal: 'It normally has very low T2 signal and contains no glandular tissue.',
    caution: 'Dark signal here is expected; assess location and other sequences before interpreting a finding.',
    reference: 'acr',
    question: 'Which description fits the anterior fibromuscular stroma?',
    choices: [{id: 'gland', label: 'A fourth glandular zone'}, {id: 'fibromuscular', label: 'Non-glandular fibromuscular tissue'}, {id: 'duct', label: 'An ejaculatory duct lumen'}],
    answerId: 'fibromuscular', explanation: 'It is distinct from the three glandular zones.',
  },
};

export function checkProstateMriAnswer(zone: ProstateZoneKey, answerId: string | null): 'unanswered' | 'correct' | 'incorrect' {
  const lesson = prostateMriLessons[zone];
  if (!lesson || !lesson.choices.some(choice => choice.id === answerId)) return 'unanswered';
  return answerId === lesson.answerId ? 'correct' : 'incorrect';
}
