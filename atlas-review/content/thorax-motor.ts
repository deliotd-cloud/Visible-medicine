// Draft relationships for four supplied compound source surfaces only.
export const thoraxMotorRegions = ['thorax'] as const;
export const thoraxMotorReferences = {
  muscles: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html',
} as const;
const sharedLimit =
  'The source supplies compound midline muscle surfaces. Left and right filters retain the same whole surfaces and do not isolate a side. Nerve geometry or course, individual rib spaces, hemidiaphragms, contraction and clinical findings are not shown.';
export const thoraxMotorNerves = {
  phrenic: {
    label: 'Phrenic nerve',
    note: `Typical diaphragm motor relationship. ${sharedLimit}`,
    references: ['muscles'],
  },
  intercostal: {
    label: 'Segmental intercostal nerves',
    note: `Typical motor relationship for the available external, internal and innermost intercostal layers; no segmental nerve or rib-space assignment is made. ${sharedLimit}`,
    references: ['muscles'],
  },
} as const;
export const thoraxMotorBindings = [
  { fmaId: 'FMA13295', nerve: 'phrenic' },
  { fmaId: 'FMA9756', nerve: 'intercostal' },
  { fmaId: 'FMA9757', nerve: 'intercostal' },
  { fmaId: 'FMA9758', nerve: 'intercostal' },
] as const;
