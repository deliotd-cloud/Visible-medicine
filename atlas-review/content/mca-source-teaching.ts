import type { NestedConcept, NestedSection } from './nested-teaching';

/** Original educational copy. References explain the parent vessel/imaging,
 * never an independent anatomical identity for these archive partitions. */
export const mcaSourceTeachingReferences = {
  mcaSourceParentAnatomy: {
    title: 'UAMS · Head and neck arteries (parent MCA context)',
    url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-head-and-neck/',
  },
  mcaSourceAngiography: {
    title: 'Bash et al. (2005) · Acquired CTA, TOF MRA and DSA comparison',
    url: 'https://pubmed.ncbi.nlm.nih.gov/15891154/',
  },
};

const pending = (body: string): NestedSection => ({
  body, readiness: 'pending', references: [],
});

const sourceLessons = [
  {
    file: 'FJ1662', order: '01',
    scope: 'FJ1662 and FJ1663 are different source files even though their original headers use the same description. A repeated header is not evidence that they represent the same named branch.',
    question: 'Do matching original descriptions make FJ1662 and FJ1663 one verified anatomical branch?',
    answer: 'No. They retain different file identities and supplied surfaces. Their exact branch identities and relationship need anatomical review.',
  },
  {
    file: 'FJ1663', order: '02',
    scope: 'The number 02 follows archive membership. It does not place FJ1663 downstream of FJ1662 or establish an M2 segment, a perforator or a lumen connection.',
    question: 'Does “source part 02” mean the second clinical segment or a branch downstream of part 01?',
    answer: 'No. This is archive ordering, not a validated branching order or M1/M2 segmentation.',
  },
  {
    file: 'FJ1692', order: '03',
    scope: 'An original header suggests a sphenoid-part description, but that label has not been validated against this surface. FJ1692 is not admitted here as a separately verified M1 segment or its clinical boundary.',
    question: 'Can FJ1692’s original header alone certify an M1 segment boundary?',
    answer: 'No. A source description is provenance, not an accepted anatomical boundary. Keep the file identity until revision-bound anatomical review.',
  },
] as const;

export const mcaSourceConcepts: NestedConcept[] = sourceLessons.map<NestedConcept>(({file, order, scope, question, answer}) => ({
  id: `mca-source-${file.toLowerCase()}`,
  study: 'cranial-artery-components',
  fmaIds: ['FMA50082'],
  sections: {
    anatomy: {
      body: `Source part ${order} is the supplied ${file} surface within the right-MCA aggregate, not a newly named artery. ${scope} Parent-vessel context only: the MCA arises from the internal carotid and supplies lateral frontal, parietal and temporal regions. That broad description is not a territory assigned to this file. FMA50082 identifies the parent; it is not an independent child FMA.`,
      references: ['mcaSourceParentAnatomy'], readiness: 'draft',
    },
    function: pending(`A separate physiological territory has not been assigned to ${file}. File boundaries and separation controls do not establish perfusion, collateral supply or connected flow.`),
    clinical: pending(`Branch-specific clinical teaching for ${file} awaits anatomical identification and review. Do not infer a procedural target, symptom pattern or treatment route from this source partition.`),
    pathology: pending(`No lesion is represented in ${file}. Component-specific pathology teaching remains pending; a disconnected mesh piece is not evidence of occlusion, stenosis or injury.`),
  },
  imaging: {
    ct: {
      body: `CTA evaluates acquired vascular images; it is not this archive surface. Bash et al. compared CTA, TOF MRA and DSA in 28 patients. For ${file}, no corresponding scan, contrast-filled lumen, calibre measurement or accepted branch assignment exists. A source-file edge must not be read as an occlusion.`,
      references: ['mcaSourceAngiography'], readiness: 'draft',
    },
    mri: {
      body: `TOF MRA was evaluated against acquired angiography in that study, not against source-file partitions. ${file} contains no MR signal or flow measurement. Neither its silhouette nor gaps identify signal loss, patency or an M1/M2 boundary. Any future correspondence needs a reviewed series and explicit spatial registration.`,
      references: ['mcaSourceAngiography'], readiness: 'draft',
    },
  },
  modelLimit: `${file} is one of three existing right-MCA source-file partitions. Together they preserve the supplied aggregate, not a complete MCA tree. A file may contain disconnected pieces; source order is not branch order. Finer anatomical identity, junctions, lumen continuity, functional territories and patient correspondence remain unvalidated. No new geometry or opposite-side counterpart is implied.`,
  quiz: { question, answer, references: [], basis: 'model-scope' },
}));
