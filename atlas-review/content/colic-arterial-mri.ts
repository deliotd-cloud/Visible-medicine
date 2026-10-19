// Original teaching synthesis. Links support context; no source figure is reused.
export const colicArterialMriReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html',
  mra: 'https://www.radiologyinfo.org/en/info/angiomr',
} as const;

type ColicArterialMriGroup = {
  fmaId: string;
  laterality: 'midline' | 'right' | 'left' | 'unspecified';
  body: string;
  pitfall: string;
};

export const colicArterialMriGroups: Record<string, ColicArterialMriGroup> = {
  'middle-colic-artery': {
    fmaId: 'FMA14810', laterality: 'midline',
    body: 'On vascular-sensitive MR source images, trace a resolved branch from the SMA towards the transverse mesocolon before naming the middle colic pathway.',
    pitfall: 'A projected crossing cannot establish its origin or division; routine abdominal MRI may not resolve either.',
  },
  'right-colic-artery': {
    fmaId: 'FMA14811', laterality: 'right',
    body: 'Relate a visible ascending-colon arterial course to its actual mesenteric origin across adjacent MR source sections.',
    pitfall: 'The right colic branch can arise directly or through another branch; no separately seen trunk is not evidence of occlusion.',
  },
  'ileocolic-artery': {
    fmaId: 'FMA14815', laterality: 'unspecified',
    body: 'Follow the ileocolic course from the SMA towards the ileocaecal region where MR vessel continuity is resolved.',
    pitfall: 'Nearby veins and motion can obscure the small arterial course; a single projection does not establish the pedicle.',
  },
  'appendicular-artery': {
    fmaId: 'FMA14818', laterality: 'unspecified',
    body: 'Use the appendix and mesoappendix as orientation, then trace any resolved arterial approach to its parent branch.',
    pitfall: 'Supply can vary through caecal or ileocolic branches; an unseen fine vessel on routine MRI is not absent supply.',
  },
  'ileocolic-ascending-branch': {
    fmaId: 'FMA14820', laterality: 'unspecified',
    body: 'Keep the source-labelled ascending branch tied to the visible ileocolic parent and its superiorly directed course.',
    pitfall: 'Do not substitute a named caecal artery or claim a separate branch when the MR source images do not resolve one.',
  },
  'marginal-colic-artery': {
    fmaId: 'FMA14824', laterality: 'midline',
    body: 'Inspect any visible colic arterial connection along the mesenteric colonic border on source images, segment by segment.',
    pitfall: 'An apparent line on an MR projection does not establish continuous patency, collateral capacity or bowel perfusion.',
  },
  'left-colic-artery': {
    fmaId: 'FMA14826', laterality: 'left',
    body: 'Trace a resolved branch from the IMA towards the descending colon before assigning the left colic name.',
    pitfall: 'Origin and flexure supply vary; overlapping vessels on projection images cannot establish this branch alone.',
  },
  'left-colic-ascending-branch': {
    fmaId: 'FMA14828', laterality: 'left',
    body: 'Follow an upward course from a confirmed left colic parent towards the splenic-flexure region on MR source sections.',
    pitfall: 'Proximity to the flexure does not prove a complete connection with middle colic supply.',
  },
  'left-colic-descending-branch': {
    fmaId: 'FMA14829', laterality: 'left',
    body: 'Follow a downward course from the confirmed left colic parent beside the descending colon where visible.',
    pitfall: 'A short visible segment cannot establish its distal junction with sigmoid or marginal vessels.',
  },
};
