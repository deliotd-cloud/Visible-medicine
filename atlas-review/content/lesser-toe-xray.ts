export type LesserToeSegment='proximal'|'middle'|'distal';
export const lesserToeXrayReferences={
  definition:'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/foot-phalanges/lesser-toe-fractures/definition',
  examination:'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/foot-phalanges/further-reading/patient-examination',
};

// Curated individual source identities, not inferred mirrored anatomy.
export const lesserToeXraySelections=([
  ['FMA32635','FJ3328','proximal'],['FMA32637','FJ3311','proximal'],
  ['FMA32639','FJ3312','proximal'],['FMA32641','FJ3315','proximal'],
  ['FMA32634','FJ3319','proximal'],['FMA32636','FJ3320','proximal'],
  ['FMA32638','FJ3321','proximal'],['FMA32640','FJ3324','proximal'],
  ['FMA32643','FJ3293','middle'],['FMA32645','FJ3294','middle'],
  ['FMA32647','FJ3295','middle'],['FMA230988','FJ3298','middle'],
  ['FMA32642','FJ3300','middle'],['FMA32644','FJ3301','middle'],
  ['FMA32646','FJ3302','middle'],['FMA230986','FJ3305','middle'],
  ['FMA32653','FJ3179','distal'],['FMA32655','FJ3180','distal'],
  ['FMA32657','FJ3181','distal'],['FMA32659','FJ3185','distal'],
  ['FMA32652','FJ3189','distal'],['FMA32654','FJ3190','distal'],
  ['FMA32656','FJ3191','distal'],['FMA32658','FJ3195','distal'],
] as const).map(([fmaId,file,group])=>({fmaId,file,group,topics:['xray' as const]}));

type Topic={body:string;bullets:string[];references:(keyof typeof lesserToeXrayReferences)[]};
// Original orientation summaries; no article images, tables or prose copied.
export const lesserToeXrayTopics:Record<LesserToeSegment,Topic>={
  proximal:{
    body:'Identify the selected toe on acquired AP and oblique views, then follow the proximal phalanx from its MTP base along the shaft to its PIP head. Compare available lateral images when assessing projectional overlap.',
    bullets:['Distinguish a shaft finding from involvement of either joint surface. The atlas is a whole-bone reference, not a fracture classification or a loaded joint examination.'],
    references:['definition','examination'],
  },
  middle:{
    body:'Locate the middle phalanx between the PIP and DIP joints. Trace its base, shaft and head on the acquired radiographic projections; do not mistake an overlapping adjacent toe for the selected bone.',
    bullets:['An apparent articular finding and a diaphyseal finding describe different locations. Inspect the actual joint margins rather than inferring extension from this intact donor surface.'],
    references:['definition','examination'],
  },
  distal:{
    body:'Follow the distal phalanx from its DIP base through the shaft to the terminal tuft. Compare the acquired projections to separate joint-surface involvement from a more distal finding.',
    bullets:['A radiograph or selected bone mesh does not establish nail-bed integrity. Soft-tissue assessment is separate, and no nail-bed surface or injury simulation is supplied here.'],
    references:['definition'],
  },
};
export const lesserToeXrayScopeNote='Draft orientation for revision-bound radiologist review. The selected source identifies a named bone, not a patient radiograph, fracture or verified joint space. No imaging study or spatial registration is loaded. Atlas, imaging-case and paid-lecture access remain independent.';
