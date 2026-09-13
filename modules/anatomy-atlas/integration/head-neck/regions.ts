/** The established URL namespace remains stable; one build shares exact assets across regions. */
export const regionalModules = {
  'head-neck': {title:'Head and neck', website:'/atlas/head-neck-3d'},
  thorax: {title:'Thorax', website:'/atlas/thorax-3d'},
} as const;
export type RegionalModule = keyof typeof regionalModules;
export function parseRegionalModule(query:URLSearchParams):RegionalModule|null {
  const regions=query.getAll('region');
  if(!regions.length)return 'head-neck';
  if(regions.length!==1 || !Object.hasOwn(regionalModules,regions[0]))return null;
  return regions[0] as RegionalModule;
}
