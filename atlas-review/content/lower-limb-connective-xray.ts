// Original teaching prose. Reading citations do not grant image/diagram reuse rights.
export const lowerLimbConnectiveXrayTeaching = {
  achilles: {
    body: 'Use the posterior calcaneus to orient the heel attachment of the selected calcaneal (Achilles) tendon. A lateral ankle radiograph may show the tendon-region soft-tissue outline and the adjacent pre-Achilles fat-pad lucency, often called Kager\'s triangle. These are projectional clues, not the individual subtendons or the coloured atlas surface.',
    bullets: [
      'Altered Kager fat-pad appearance can accompany an acute rupture, but a retrospective case-control study found both missed ruptures and positive signs in ankle-sprain controls. Neither a preserved triangle nor its obscuration alone settles tendon integrity.',
      'An insertional avulsion may include a visible bone fragment at the heel attachment. Absence of that fragment does not exclude a tendon tear elsewhere; plain films do not grade a partial tear or measure a tendon gap.',
      'Ultrasound or MRI can assess tendon soft tissues when clinically indicated. This lesson does not select a scan protocol, diagnose a rupture or replace clinical assessment.',
    ],
    references: [
      'https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear',
      'https://pubmed.ncbi.nlm.nih.gov/36036526/',
    ],
  },
  iliotibial: {
    body: 'Follow the iliotibial tract down the lateral thigh toward its tibial attachment around Gerdy\'s tubercle on the anterolateral proximal tibia. Use the proximal tibial bone as an X-ray orientation landmark; a plain film does not display the complete fascial band, its separate layers or an attachment footprint matching this mesh.',
    bullets: [
      'A reported Gerdy-tubercle avulsion was visible on radiographs and confirmed with CT; MRI assessed associated soft tissues. That unusual isolated case illustrates a bony clue, not a rule that such injuries are isolated or that a normal radiograph excludes an iliotibial-tract injury.',
      'Do not equate every lateral tibial fragment with the same injury. Gerdy-tubercle and Segond avulsions require attention to the actual donor site and associated findings. Cadaveric/MR research found iliotibial fibres extending behind Gerdy\'s tubercle and attaching to some Segond fragments, so an absolute “Segond never involves the iliotibial tract” rule is incorrect.',
      'MRI or targeted ultrasound may help assess soft tissues as clinically appropriate. Rotating or exploding this reference model does not reproduce a radiographic projection, mechanical instability or an acquired image.',
    ],
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/11323461/',
      'https://jassm.org/an-unusual-case-of-isolated-iliotibial-band-avulsion-fracture/',
      'https://www.radiologyinfo.org/en/info/musculous',
    ],
  },
} as const;
