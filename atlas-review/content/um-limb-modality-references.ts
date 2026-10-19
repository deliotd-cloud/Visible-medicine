// Primary reading links, not imported publisher text, figures or licensed assets.
import type { SpecimenTopicDraft } from './um-limb-clinical';

export const limbModalityReferences = {
  ct: { title: 'ACR/RSNA · Body CT', url: 'https://www.radiologyinfo.org/en/info/bodyct' },
  mri: { title: 'ACR/RSNA · Musculoskeletal MRI', url: 'https://www.radiologyinfo.org/en/info/muscmr' },
  xray: { title: 'ACR/RSNA · Bone X-ray', url: 'https://www.radiologyinfo.org/en/info/bonerad' },
  ultrasound: { title: 'ACR/RSNA · Musculoskeletal Ultrasound', url: 'https://www.radiologyinfo.org/en/info/musculous' },
  hipUS: { title: 'ESSR · Hip ultrasound technical guidelines', url: 'https://essr.org/content-essr/uploads/2016/10/hip.pdf' },
  kneeUS: { title: 'ESSR · Knee ultrasound technical guidelines', url: 'https://essr.org/content-essr/uploads/2016/10/knee.pdf' },
  ankleUS: { title: 'ESSR · Ankle ultrasound technical guidelines', url: 'https://essr.org/content-essr/uploads/2016/10/ankle.pdf' },
  lowerLimbTable: { title: 'Texas Tech · Lower-limb muscle anatomy', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html' },
} as const;

export function limbModalityDraft(body: string, ...references: (keyof typeof limbModalityReferences)[]): SpecimenTopicDraft {
  return { readiness: 'draft', body, references: references.map(key => limbModalityReferences[key].url) };
}
