/** Public tour metadata only; never transport meshes, patient data or access. */
export type RegionalLearningTour = {
  id:string; title:string; description:string; revision:string;
  regionId:string; regionLabel:string; href:string; limitations:string;
  steps:Array<{title:string;structureName:string}>;
};
export type RegionalLearningCatalogueData = {
  available:boolean; sourceRevision:string|null; unavailableTours:number;
  regions:Array<{id:string;label:string}>; tours:RegionalLearningTour[];
};
