import {assertPinnedFdaCatalogue,canonicalFdaReference,fdaReferenceCatalogueSha256,fdaReferenceDigest,type FdaShoulderReference} from './fda-shoulder-reference';

/** Draft material only; not an approval, decision writer or access entitlement. */
export async function fdaReferenceReviewMaterial(catalogue:FdaShoulderReference,structureId:string,rendererSourceSha256:string){
 await assertPinnedFdaCatalogue(catalogue);
 if(!/^[a-f0-9]{64}$/.test(rendererSourceSha256)||/^0+$/.test(rendererSourceSha256))throw new Error('Exact renderer source digest required');
 const structure=catalogue.structures.find(s=>s.id===structureId);
 if(!structure)throw new Error('Source-specific structure is not admitted in this draft');
 const material={schema:'vm-fda-reference-review/1',status:'draft-awaiting-anatomical-review',
  specimenId:catalogue.specimenId,structureId,source:catalogue.source,catalogueSha256:fdaReferenceCatalogueSha256,
  asset:catalogue.bundle,display:catalogue.display,structure,held:catalogue.held,rendererSourceSha256,
  scope:'Independent source assembly; no BodyParts3D substitution or CT/MRI synchronization',
  checks:['Source-part extent, shape and anatomical identity','Constructed versus segmented tissue provenance','Attachment and spatial relationships within this donor','Surface intersections and display fidelity'],
  outstanding:['Physical units and anatomical axes unvalidated','Bone extent unvalidated','Constructed glenoid cartilage held: two nonmanifold edges and three source vertices','No inherited clinical approvals or patient-space registration'],
  clinicalApproval:false,measurementEnabled:false,imagingRegistration:null,registeredToBodyParts3D:false,
  protectedWebsiteQueueIntegrated:false,decisionWritingEnabled:false};
 return {...material,revision:await fdaReferenceDigest(new TextEncoder().encode(canonicalFdaReference(material)))};
}
