import type { AxialGroup } from './axial-anatomy';
export const intestinalJunction: AxialGroup = {
  id: 'ileocecal-junction',
  name: 'Ileocecal junction',
  fmaIds: ['FMA11338'],
  anatomy:
    'The ileocecal junction is where the ileum joins the cecum. This small source surface is independently selectable; the surrounding small- and large-intestine display aggregates no longer repeat it.',
  function:
    'This is the transition from small to large intestine. The model shows an exterior source surface, not valve opening, bowel contents or a simulation of transit.',
  caution:
    'The source uses this same component for several cecal and ileal-wall definitions. It does not establish a complete cecum, separate valve leaflets, bowel-wall layers or a safe dissection plane. Specialist review is still required.',
  references: [
    'https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_tables.html',
  ],
};
