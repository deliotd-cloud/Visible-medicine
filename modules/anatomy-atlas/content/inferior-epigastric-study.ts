import type { AxialStudy } from '../lib/axial-anatomy';
export const inferiorEpigastricStudy: AxialStudy = {
  id:'abdominal-wall-epigastric-vessels', title:'Abdominal wall: epigastric vessels',
  regions:['abdomen','whole-body'],
  targetFmaIds:['FMA20689','FMA21164','FMA20688','FMA21163'],
  context:[{fmaIds:['FMA18806','FMA18807','FMA18885','FMA18886','FMA3988','FMA4083']}],
  view:'anterior',
  description:'Compare the inferior epigastric arteries and veins with the external iliac vessels and superior epigastric arteries. Choose a side for a simpler view.',
  inspect:'Select an artery or vein, set it aside, and use Undo to restore it. Return separation to 0% before comparing original source positions. This vessels-only reference does not supply rectus sheath, inguinal rings, fascia, nerves or a complete perforator network. Proximity is not proof of a joined lumen or anastomosis. The separate abdominal-wall specimen belongs to a different source version and is not overlaid here. Clinical review is pending.',
  landmarks:['inferior epigastric artery$','inferior epigastric vein$','external iliac artery$','superior epigastric artery$'],
};
export const inferiorEpigastricReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html',
  'https://anatomy.ttuhscep.edu/schemes/inguinal_tables.html',
  'https://anatomy.ttuhscep.edu/schemes/abdo_wall_ing_questions/abdo_wall_12_feedback.html',
];
