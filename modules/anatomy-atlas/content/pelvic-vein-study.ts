import type { AxialStudy } from '../lib/axial-anatomy';
export const pelvicVeinStudy: AxialStudy = {
  id:'pelvic-venous-tributaries', title:'Pelvic venous tributaries',
  regions:['pelvis','whole-body'],
  targetFmaIds:['FMA18904','FMA18913','FMA18916','FMA18910','FMA18903','FMA18912','FMA18918','FMA18906','FMA18915','FMA18909'],
  context:[{fmaIds:['FMA21387','FMA21388','FMA18887','FMA18888','FMA16586','FMA16587','FMA16202']}],
  view:'anterior',
  description:'Inspect ten pelvic vein selections with the iliac veins, hip bones and sacrum. Choose a side to simplify the view. Left-side coverage is incomplete.',
  inspect:'Select a vein or set aside an obscuring bone, then Undo to restore it. Return separation to 0% to inspect original positions. Left internal pudendal and left lateral sacral sources are held for coordinate/laterality review; they have not been mirrored or reconstructed. Short superior gluteal surfaces do not show a complete drainage network. Surface proximity is not proof of connected lumens, patency or a safe procedural route. Clinical review is pending.',
  landmarks:['iliolumbar vein$','gluteal vein$','obturator vein$','internal pudendal vein$','lateral sacral vein$'],
};
export const pelvicVeinReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/veins_pelvis_perineum.html',
  'https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html',
  'https://pubmed.ncbi.nlm.nih.gov/17373712/',
];
