import type {AxialStudy} from '../lib/axial-anatomy';

export const portalHepaticStudyReferences = ['https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html'];
export const portalHepaticStudy: AxialStudy = {
  id: 'portal-hepatic-outflow',
  title: 'Liver: portal inflow & venous outflow',
  regions: ['abdomen'],
  targetFmaIds: ['FMA50735', 'FMA14338', 'FMA14339'],
  context: [{fmaIds: ['FMA7197', 'FMA10951']}],
  view: 'posterior',
  description: 'Compare the portal vein with the supplied right and left hepatic veins, liver and inferior vena cava. Choose Both sides to keep both hepatic veins in view.',
  inspect: 'Portal blood enters the liver; hepatic veins provide venous outflow toward the vena cava. Select the liver and Remove it to reveal covered vessels, then Undo to restore context. Extract selected separates one surface; return separation to 0% for original positions. These whole source surfaces do not prove connected lumens, flow or segment boundaries. The middle hepatic vein, complete tributaries, sinusoids and arterial inflow are not shown in this study. This is not a portal-triad dissection, procedural plan or registered scan. Clinical review is pending.',
  landmarks: ['hepatic portal vein$', 'right hepatic vein$', 'left hepatic vein$', 'inferior vena cava$'],
};
export const portalHepaticStudyFmaIds = [...portalHepaticStudy.targetFmaIds, ...portalHepaticStudy.context.flatMap(r => r.fmaIds ?? [])];
