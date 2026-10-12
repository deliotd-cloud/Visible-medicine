// Original factual orientation; references are reading links, not reusable media.
const anatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-abdomen/';
const catheter='https://www.radiologyinfo.org/en/info/angiocath';

export const gastricVenousXrayTopics={
  'left-gastric-vein':{
    title:'Lesser-curvature venous orientation',
    body:'The left gastric vein drains the lesser-curvature region and lower oesophagus toward the portal venous system. On an acquired contrast venogram, identify only the demonstrated course and actual junction; this usual drainage reference does not establish every variant.',
    bullets:[
      'Compare with the right gastric vein along the lesser-curvature side, not with the gastroepiploic veins at the greater curvature.',
      'Oesophageal venous communications are an anatomical relationship, not evidence that this retained surface depicts varices, a complete collateral network or a shunt.',
    ],citations:[anatomy,catheter],
  },
  'right-gastric-vein':{
    title:'Lesser-curvature venous orientation',
    body:'The right gastric vein drains the lesser-curvature region toward the portal vein. Use an acquired contrast venogram to establish its demonstrated junction rather than assuming that surface proximity in the Atlas proves a confluence.',
    bullets:[
      'Compare with the left gastric vein at the lesser curvature, distinct from the gastroepiploic pair at the greater curvature. The source name does not constrain every point to one half of the abdomen.',
      'Keep the right gastric vein distinct from the right gastric artery. An arterial contrast image is not automatically a venous map; the retained source supplies no acquisition timing or contrast phase.',
    ],citations:[anatomy,catheter],
  },
  'left-gastroepiploic-vein':{
    title:'Greater-curvature venous orientation',
    body:'The left gastroepiploic vein, also called the left gastro-omental vein, drains the greater-curvature and omental region toward the splenic vein. This usual relationship is a reference for comparison, not a patient-specific junction map.',
    bullets:[
      'Compare the left gastroepiploic selection with the splenic vein in assembled anatomy. Do not replace the source with the left gastric vein, whose lesser-curvature relationship is different.',
      'If an acquired contrast venogram demonstrates this vessel, follow the opacified segment itself. An absent or overlapping segment in a projection cannot be diagnosed from the source surface as occluded or missing.',
    ],citations:[anatomy,catheter],
  },
  'right-gastroepiploic-vein':{
    title:'Greater-curvature venous orientation',
    body:'The right gastroepiploic vein, also called the right gastro-omental vein, drains the greater-curvature and omental region toward the superior mesenteric vein. Treat this as usual drainage orientation, not proof of a complete or invariant gastrocolic venous junction.',
    bullets:[
      'Compare the right gastroepiploic selection with the superior mesenteric vein, while keeping the left gastroepiploic-to-splenic relationship separate.',
      'If an acquired contrast venogram demonstrates this course, identify its observed junction. The retained surface cannot establish every tributary, a patent confluence or a catheter route.',
    ],citations:[anatomy,catheter],
  },
} as const;
