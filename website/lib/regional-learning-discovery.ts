/** Public tour metadata only; never transport meshes, patient data or access. */
export type RegionalLearningTour = {
  id:string; title:string; description:string; revision:string;
  regionId:string; regionLabel:string; href:string; limitations:string;
  /** Authored framing regions, including contextual structures. Discovery only:
   * these do not change the launch region or imply imaging coverage. */
  scopeRegionIds?:string[];
  continuousPlaybackMs?:number;
  steps:Array<{title:string;structureName:string}>;
};
export type RegionalLearningCatalogueData = {
  available:boolean; sourceRevision:string|null; unavailableTours:number;
  regions:Array<{id:string;label:string}>; tours:RegionalLearningTour[];
};

/** Related regions never replace the canonical launch destination. */
export function regionalTourMatchesRegion(tour:RegionalLearningTour,regionId:string):boolean {
  return tour.regionId===regionId || tour.scopeRegionIds?.includes(regionId)===true;
}
