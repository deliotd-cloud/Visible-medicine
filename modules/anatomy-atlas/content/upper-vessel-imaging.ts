export type UpperVesselModality = 'ct' | 'mri' | 'ultrasound';
export type UpperVesselImagingGroup =
  | 'arterial-trunks'
  | 'deep-branch'
  | 'deep-veins'
  | 'superficial-veins';
export const upperVesselImagingGroups: Record<
  UpperVesselImagingGroup,
  string[]
> = {
  'arterial-trunks': ['FMA22655', 'FMA22656', 'FMA22691', 'FMA22692'],
  'deep-branch': ['FMA22696', 'FMA22697'],
  'deep-veins': ['FMA13330', 'FMA13331', 'FMA22935', 'FMA22936'],
  'superficial-veins': ['FMA13325', 'FMA13326', 'FMA22909', 'FMA22910'],
};
export const upperVesselImagingReferences = {
  cta: 'https://www.radiologyinfo.org/en/info/angioct',
  mra: 'https://www.radiologyinfo.org/en/info/angiomr',
  vascularUs: 'https://www.radiologyinfo.org/en/info/vascularus',
  venousUs: 'https://www.radiologyinfo.org/en/info/venousus',
  upperDvt: 'https://www.radiologyinfo.org/en/info/acs-upper-extremity-dvt',
};
type Ref = keyof typeof upperVesselImagingReferences;
type Topic = { body: string; bullets: string[]; references: Ref[] };
// Original short factual synthesis. No acquired images or publisher assets.
export const upperVesselImagingTopics: Record<
  UpperVesselImagingGroup,
  Partial<Record<UpperVesselModality, Topic>>
> = {
  'arterial-trunks': {
    ct: {
      body: 'CT angiography depicts contrast within vessels alongside adjacent tissues. In an arm study, follow the identified arterial course through the acquired images rather than diagnosing a narrowing from an atlas outline.',
      bullets: [
        'The source surface supplies spatial context only: no contrast bolus, intimal injury, calcified plaque or perfused lumen is encoded.',
        'Use the actual image series to assess vessel injury or obstruction; display colour and an apparently continuous mesh cannot establish patency.',
      ],
      references: ['cta'],
    },
    mri: {
      body: 'MR angiography evaluates vessels using an acquisition designed for vascular imaging, with or without contrast. A routine anatomical MR image and an angiographic reconstruction are not interchangeable with this selected surface.',
      bullets: [
        'Confirm which vascular acquisition and image orientation are being compared; the model has no MR sequence or signal.',
        'Motion and metal can limit MRA. Apparent vessel interruption requires image review, not interpretation of the atlas segmentation.',
      ],
      references: ['mra'],
    },
    ultrasound: {
      body: 'Vascular ultrasound combines real-time vessel imaging with Doppler assessment of moving blood. Use the atlas to understand the expected course, then identify the vessel on the actual ultrasound examination.',
      bullets: [
        'Doppler findings belong to the acquired study; this model has no velocity trace, pulse waveform or blood-flow measurement.',
        'Depth, small calibre and calcification can reduce visibility. A vessel absent from an ultrasound view is not automatically absent anatomically.',
      ],
      references: ['vascularUs'],
    },
  },
  'deep-branch': {
    ct: {
      body: 'The deep brachial artery is a separate posterior-arm branch, not the main brachial trunk. CTA can assess limb vascular injury; use the source course to orient the branch without assuming the displayed endpoints prove a joined origin.',
      bullets: [
        'The arm dissection can expose the selected branch beside triceps and humerus, but the model supplies neither fracture nor haematoma.',
        'No collateral perfusion, vessel-wall injury or contrast-filled lumen can be read from these triangles.',
      ],
      references: ['cta'],
    },
    mri: {
      body: 'Small-vessel depiction can be limited on MRA. Keep the posterior branch distinct from the brachial trunk and assess the actual acquisition before interpreting a faint or missing branch.',
      bullets: [
        'A sharply drawn atlas branch does not predict its visibility on a particular MR sequence.',
        'The radial nerve is absent from this study. Its usual anatomical relationship must not be treated as a segmented or registered MR finding.',
      ],
      references: ['mra'],
    },
    ultrasound: {
      body: 'The deep brachial branch is a small, deeper target compared with the main arm vessels. Both depth and calibre can limit ultrasound assessment.',
      bullets: [
        'Exposing the branch by hiding triceps in the atlas does not reproduce a sonographic acoustic window.',
        'A visible surface provides no Doppler signal or proof of distal perfusion; this is not an acquisition protocol.',
      ],
      references: ['vascularUs'],
    },
  },
  'deep-veins': {
    ct: {
      body: 'CT venography evaluates veins with intravenous contrast. It is a different imaging task from displaying an arterial CTA or this blue anatomical surface; the intended venous territory must be covered by the actual examination.',
      bullets: [
        'Upper-extremity DVT guidance includes CT venography in selected circumstances; this atlas does not choose a test.',
        'There is no thrombus, contrast filling defect, catheter or central venous obstruction represented here.',
      ],
      references: ['upperDvt'],
    },
    mri: {
      body: 'MR venography targets venous anatomy and can use contrast-enhanced or noncontrast techniques. Confirm that the image set actually evaluates the vein and its relevant outflow rather than assuming that any MR study does so.',
      bullets: [
        'The source vein is anatomical context, not a simulated MRV reconstruction or signal-intensity reference.',
        'An isolated surface cannot establish thrombus extent, a patent junction or a complete central venous assessment.',
      ],
      references: ['upperDvt'],
    },
    ultrasound: {
      body: 'Duplex ultrasound is commonly the initial imaging assessment for suspected upper-extremity deep venous thrombosis. The acquired examination assesses vessels and blood flow; a normal-looking atlas surface cannot exclude a clot.',
      bullets: [
        'Distinguish a deep vein from adjacent arterial and superficial venous selections before comparing the images.',
        'The model does not encode thrombus, Doppler response, venous valves or pressure-dependent deformation. An incomplete visible source network is not a complete negative examination.',
      ],
      references: ['upperDvt', 'venousUs'],
    },
  },
  'superficial-veins': {
    ultrasound: {
      body: 'Venous ultrasound can map arm veins and assess their real-time appearance and flow. The cephalic and basilic selections provide anatomical orientation; they are not a complete deep-venous examination.',
      bullets: [
        'No cannulation site, graft suitability, vessel diameter, patency or procedural clearance is established by the source mesh.',
        'Follow the actual patient vein and its junctions on imaging. This atlas does not supply the full variable communicating network.',
      ],
      references: ['venousUs'],
    },
  },
};
export const upperVesselImagingSelectionNotes = [
  {
    fmaIds: ['FMA22655', 'FMA22656'],
    note: 'Axillary artery: the three parts defined relative to pectoralis minor are not separate selectable segments; the brachial plexus is not supplied.',
  },
  {
    fmaIds: ['FMA22691', 'FMA22692'],
    note: 'Brachial artery: keep the main anterior arm vessel distinct from profunda brachii. Adult source geometry does not represent a paediatric supracondylar injury.',
  },
  {
    fmaIds: ['FMA22696', 'FMA22697'],
    note: 'Deep brachial artery: inspect posterior arm context in Study → Arm: deep brachial artery & triceps. The radial nerve and a complete collateral circuit remain absent.',
  },
  {
    fmaIds: ['FMA13330', 'FMA13331'],
    note: 'Axillary vein: this is one source-defined venous segment, not the full subclavian–central outflow or a validated thoracic-outlet compression model.',
  },
  {
    fmaIds: ['FMA22935', 'FMA22936'],
    note: 'Medial brachial vein: only one source-labelled medial vein per side is included. Do not infer a complete companion pair or a joined axillary junction.',
  },
  {
    fmaIds: ['FMA13325', 'FMA13326'],
    note: 'Cephalic vein: this superficial source selection spans forearm and arm; its visible endpoints do not certify the complete tributary pattern.',
  },
  {
    fmaIds: ['FMA22909', 'FMA22910'],
    note: 'Basilic vein: distinguish this selection from the medial brachial vein. Its whole source surface is not a segmented superficial-to-deep fascial transition.',
  },
];
