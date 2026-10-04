/** Independent diagram review only. No acquired-image or spatial-mesh approval. */
export const plexusReviewScope = 'independent-schematic' as const;
export const plexusCandidateId = 'vm:schematic:brachial-plexus:right' as const;
export const plexusChecklistVersion = 'original-plexus-review-1' as const;
export const plexusReviewTracks = ['topology', 'presentation'] as const;
export type PlexusReviewTrack = typeof plexusReviewTracks[number];
export type PlexusReviewCheck = {id:string; label:string};
export const plexusChecklists: Record<PlexusReviewTrack,PlexusReviewCheck[]> = {
  topology: [
    {id:'identity',label:'Review all 35 named parts, right laterality and typical C5–T1 scope.'},
    {id:'connections',label:'Check all 38 named directed connections, including divisions, cords, median roots and collateral origins.'},
    {id:'wording',label:'Check every structure summary and cited reference; distinguish usual anatomy from variants.'},
    {id:'limits',label:'Confirm omissions and the distinction between named continuity and individual fibre/root distribution.'},
    {id:'scope',label:'State the exact schematic topology reviewed. This is not a spatial nerve mesh or imaging registration.'},
  ],
  presentation: [
    {id:'views',label:'Inspect overview, oblique and posterior views, arbitrary diagram depth, crossings and joins.'},
    {id:'interaction',label:'Check all named selections, search, collateral disclosure, labels, fading and named-connection highlighting.'},
    {id:'spacing',label:'Check diagram spacing and reset/reassembly without implying physical nerve stretching or dissection.'},
    {id:'camera',label:'Inspect smooth interruptible camera motion and reduced-motion behavior on the reviewed devices.'},
    {id:'readability',label:'Check readability, label bounds, keyboard navigation and graphics-failure fallback at the reviewed sizes.'},
    {id:'scope',label:'State the tested presentation/device scope. Approval here grants no learner admission, spatial validation or CT/MRI mapping.'},
  ],
};
export type PlexusReviewContext = {
  catalogScope: typeof plexusReviewScope;
  candidateId: typeof plexusCandidateId;
  candidateName: string;
  sourceCommit: string;
  frame: {kind:'diagrammatic'; units:'arbitrary'; patientRegistration:false};
  partCount:35;
  connectionCount:38;
  clinicalApproved:false;
  learnerCatalogAdmission:false;
  materialHash:string;
  topologyHash:string;
  presentationHash:string;
  checklistVersion:typeof plexusChecklistVersion;
  checklists:typeof plexusChecklists;
  revisions:Record<PlexusReviewTrack,string>;
};
