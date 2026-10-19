// Original short teaching. References confer no right to redistribute publisher media.
export const regionalVascularClinicalTopics={
  subscapular:{
    clinical:{
      title:'Branch variation and reconstructive context',
      body:'The subscapular arterial system is relevant to composite flap reconstruction. A CTA study documented variation, including separate origins of the thoracodorsal and circumflex scapular arteries without a shared subscapular trunk. The arrangement shown here is one reference configuration, not a universal branching pattern or a patient-specific flap plan.',
      prompt:'Compare the same-side thoracodorsal and circumflex scapular selections at zero separation. Their presence does not establish an intact common pedicle or the extent of a perfused tissue territory.',
      citation:'https://pubmed.ncbi.nlm.nih.gov/34998174/',
      credit:'Barrett et al. (2022), CTA anatomical study. Variation evidence, not a validated clinical planning protocol.',
    },
    pathology:{
      title:'Traumatic bleeding and adjacent nerve effects',
      body:'A published case described a subscapular arterial tear after shoulder dislocation, with a haematoma and brachial plexus neurological deficit. This illustrates a possible vascular contribution to neurological symptoms after trauma; a single report does not establish frequency or show that all post-dislocation deficits have this cause.',
      prompt:'Localise the artery in the shoulder context without interpreting the reference surface as a tear. No haematoma, plexus compression, perfusion deficit or injury mechanism is simulated.',
      citation:'https://pubmed.ncbi.nlm.nih.gov/6737535/',
      credit:'Nash et al. (1984), single case report; indexed abstract consulted. No treatment algorithm or incidence estimate is derived.',
    },
  },
  circumflex:{
    clinical:{
      title:'Anterolateral thigh flap vascular context',
      body:'Cutaneous branches associated with the descending lateral circumflex femoral artery are relevant to anterolateral thigh flap anatomy. A clinical and cadaver study found that these branches could pass through muscle on one side and along an intermuscular septum on the other. Do not assume that the opposite thigh reproduces the same arrangement.',
      prompt:'Distinguish this descending branch from its parent lateral circumflex femoral artery. The reference does not supply a complete perforator map, an individual skin territory or a safe harvest route.',
      citation:'https://pubmed.ncbi.nlm.nih.gov/29922539/',
      credit:'Bilateral Anatomic Variation of Anterolateral Thigh Flap in the Same Individual (2018), clinical/cadaver study. No population-wide proportion is inferred.',
    },
    pathology:{
      title:'Reported injury and pseudoaneurysm',
      body:'A case report described injury of the descending lateral circumflex femoral branch with pseudoaneurysm after fixation of an intertrochanteric fracture. Guide-pin injury was considered a possible mechanism, not proven as a universal explanation. This is a reported complication, not an estimate of its likelihood or a procedure guide.',
      prompt:'Use the named branch for orientation only. No arterial wall defect, pseudoaneurysm sac, active bleeding, fracture or implant is represented, and apparent mesh continuity cannot establish vessel integrity.',
      citation:'https://aott.org.tr/index.php/pub/article/view/4018',
      credit:'Cho, Heo and Jung (2025), single case report. Factual reference only; its non-commercial publisher media are not included.',
    },
  },
  epigastric:{
    pathology:{
      title:'Arterial bleeding and rectus sheath haematoma',
      body:'Bleeding from the inferior epigastric artery can produce a rectus sheath haematoma. A retrospective clinical series documented this arterial source in affected patients, including procedure-related injury. This does not mean that every abdominal-wall haematoma arises from this artery, or that a visible vessel identifies the bleeding source in an individual.',
      prompt:'Keep the artery distinct from its accompanying inferior epigastric vein. The reference contains neither a rectus sheath compartment nor a haematoma or contrast extravasation; it cannot define bleeding extent or a safe puncture site.',
      citation:'https://pubmed.ncbi.nlm.nih.gov/33308092/',
      credit:'Transcatheter Embolization of the Inferior Epigastric Artery: Technique and Clinical Outcomes, retrospective clinical series; indexed abstract consulted. No treatment recommendation is derived.',
    },
  },
} as const;
