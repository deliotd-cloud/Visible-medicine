export const elbowArterialCtReference = 'https://link.springer.com/article/10.1007/s11678-022-00686-9';
export const elbowArterialCtAnatomyReference = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
export const elbowArterialCtLicense = 'https://creativecommons.org/licenses/by/4.0/';
export const elbowArterialCtGroups = {
  inferiorUlnarCollateral: ['FMA22712', 'FMA22713'], superiorUlnarCollateral: ['FMA22707', 'FMA22708'],
  radialCollateral: ['FMA23126', 'FMA23127'], middleCollateral: ['FMA23124', 'FMA23125'],
  radialRecurrent: ['FMA22764', 'FMA22766'], anteriorUlnarRecurrent: ['FMA22801', 'FMA22802'],
  posteriorUlnarRecurrent: ['FMA22804', 'FMA22805'],
} as const;
export type ElbowArterialCtGroup = keyof typeof elbowArterialCtGroups;
// Original orientation prompts using the existing Atlas anatomical teaching map.
export const elbowArterialCtTopics = {
  inferiorUlnarCollateral: { body: 'For CT orientation, compare this brachial branch with the anterior ulnar recurrent artery at the medial elbow. Distinguish the collateral descending from the arm from the recurrent ascending from the forearm; the source surfaces do not verify their communication.' },
  superiorUlnarCollateral: { body: 'For CT orientation, retain the brachial parent and compare this medial collateral with the posterior ulnar recurrent artery. Its named ulnar-nerve relationship is an anatomical guide, not evidence that a nerve or communicating lumen is resolved on CT.' },
  radialCollateral: { body: 'For CT orientation, distinguish this deep brachial branch from the radial recurrent branch of the radial artery. Compare their lateral elbow relationship with source positions restored; their names and proximity do not prove a continuous opacified route.' },
  middleCollateral: { body: 'For CT orientation, follow the conceptual deep brachial parent and compare the middle collateral with the interosseous recurrent artery. Keep it distinct from the radial collateral; a typical communication is not a measured source junction or CT finding.' },
  radialRecurrent: { body: 'For CT orientation, compare the radial parent with this branch ascending towards the lateral elbow. Distinguish it from the radial collateral supplied by the deep brachial artery; source branch identity alone does not establish CTA visibility or continuity.' },
  anteriorUlnarRecurrent: { body: 'For CT orientation, distinguish this ulnar branch from its posterior counterpart and compare it with the inferior ulnar collateral. The existing anatomical map allows a common recurrent origin; the source does not resolve an individual branching variation on CT.' },
  posteriorUlnarRecurrent: { body: 'For CT orientation, retain the ulnar parent and compare this recurrent branch with the superior ulnar collateral at the medial elbow. Distinguish it from the anterior recurrent branch; a named collateral network does not establish adequate perfusion on CTA.' },
} as const;
export const elbowArterialCtEvidenceLimit = 'Habarta et al. (2022) report acquired CTA demonstrating brachial artery disruption after elbow dislocation. This case supports broad elbow vascular context; it does not establish visibility of every small collateral or recurrent artery or validate these meshes.';
