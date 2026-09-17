// Original teaching; linked references do not admit publisher media or datasets.
const anatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-upper-limb/';
const dvt='https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/';
const superficial=[anatomy,'https://pubmed.ncbi.nlm.nih.gov/23131916/','https://www.nhs.uk/conditions/phlebitis/',dvt] as const;
export const upperVenousClinicalReferences={
  brachial:[anatomy,'https://www.radiologyinfo.org/en/info/acs-upper-extremity-dvt',dvt],
  cubital:superficial,antebrachial:superficial,
} as const;
export const upperVenousClinicalTopics={
  brachial:{
    clinical:{
      title:'Deep arm venous context',
      body:'The medial brachial vein belongs to the deep arm venous system, not the superficial basilic route. Arm pain and swelling can accompany upper-extremity deep vein thrombosis, but these findings are not specific to an individual vein. A clinical assessment and appropriate imaging are needed; the blue reference surface cannot establish the diagnosis.',
      prompt:'Compare the same-side axillary outflow and basilic contribution using Venous drainage. Their teaching relationship is not proof of a patent junction or a complete companion-vein pair in this source.',
    },
    pathology:{
      title:'Deep venous thrombosis and embolic risk',
      body:'Deep vein thrombosis is clot within a deep vein and can affect the upper limb. Part of a clot can travel to the lungs, causing pulmonary embolism. The source-labelled medial brachial vein is an anatomical reference: it contains no represented thrombus, measured obstruction or assessment of embolic risk.',
      prompt:'A visible gap between separate reference structures does not diagnose occlusion; conversely, an unbroken-looking surface does not prove patency. No compression response, Doppler signal or patient examination is supplied.',
    },
  },
  cubital:{
    clinical:{
      title:'Variable superficial elbow connections',
      body:'The median cubital vein commonly links superficial cephalic and basilic routes near the elbow. The configuration varies and the named connection may be absent. Nearby cutaneous nerves and arteries also vary, so this reference cannot identify a safe puncture site or substitute for assessment of the individual.',
      prompt:'Compare cephalic and basilic context with separation at zero. Do not treat the supplied right and left surfaces as a survey of population variants or infer an unseen perforator.',
    },
    pathology:{
      title:'Superficial inflammation versus deep thrombosis',
      body:'Superficial thrombophlebitis can involve arm veins and may cause local tenderness, swelling, warmth and skin change. Inflammation can follow a cannula or injection, but a cause cannot be assigned from this model. Similar symptoms require assessment for other causes, including deep vein thrombosis; superficial and deep venous disease are not interchangeable labels.',
      prompt:'Localise the named superficial elbow vein without assuming the deep system is normal. No clot extent, inflamed wall, infection or extension into another vessel is represented.',
    },
  },
  antebrachial:{
    clinical:{
      title:'Variable superficial forearm drainage',
      body:'The median antebrachial vein receives superficial palm and anterior-forearm drainage. Its size, presence and termination vary; basilic or median cubital drainage are described alternatives, not two proven outlets in this model. A prominent superficial vessel alone does not establish deep venous patency or a suitable access route.',
      prompt:'Follow the available forearm surface towards the elbow while distinguishing observed geometry from a typical drainage relationship. Do not manufacture a missing connection or universal termination.',
    },
    pathology:{
      title:'Superficial forearm venous disease',
      body:'Inflammation or thrombosis of a superficial forearm vein can cause a locally painful, tender or warm area with swelling and skin change. A cannula or injection may be associated with superficial inflammation. These are general clinical possibilities, not findings encoded in this median antebrachial surface or proof that a particular symptom comes from this vein.',
      prompt:'Distinguish superficial symptoms from the separate question of deep venous thrombosis. Source colour, calibre and apparent continuity do not establish thrombus, normal flow or a benign clinical course.',
    },
  },
} as const;
