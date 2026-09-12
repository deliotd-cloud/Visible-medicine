import type { AxialStudy } from '../lib/axial-anatomy';
export const limbicLandmarkStudy: AxialStudy = {
  id:'deep-brain-septal-landmarks',title:'Deep brain: septal landmarks',regions:['head-neck','whole-body'],
  targetFmaIds:['FMA73414','FMA73413','FMA61975','FMA61842'],
  context:[{fmaIds:['FMA258714','FMA258716','FMA72924','FMA72925','FMA86464','FMA61961','FMA61970']}],
  view:'anterior',
  description:'Compare the striae medullares, lamina terminalis and source septal group with the thalami, fornices and commissural landmarks.',
  inspect:'Set aside the corpus callosum or a fornix to uncover deeper selections, then Undo to restore it. Use 0% separation when comparing original spatial relationships. The lamina comprises two source pieces touching at one point, not a reconstructed sheet. The septal group does not isolate septal nuclei or establish complete septum-pellucidum anatomy. Stria terminalis is withheld for source defects. These coarse reference surfaces are not tractography, a complete limbic circuit or clinically validated anatomy.',
  landmarks:['stria medullaris of thalamus$','lamina terminalis$','septum of telencephalon$','fornix of forebrain$','anterior commissure$'],
};
export const limbicLandmarkReferences = [
  'https://nba.uth.tmc.edu/neuroanatomy/L11/Lab11p09_index.html',
  'https://publish.uwo.ca/~jkiernan/brndiss.htm',
  'https://link.springer.com/article/10.1007/s00701-026-06791-w',
];
