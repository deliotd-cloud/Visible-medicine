// Original factual teaching map. No imported tables, images, lumen or flow data.
export const systemicVenousReferences = {
  neck: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-head-and-neck/',
  arm: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-upper-limb/',
  leg: 'https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html',
  chest: 'https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html',
  axillary: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8142095/',
  deepLeg: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5381851/',
  proximalLeg:
    'https://www.sonographers.org/publicassets/e6c705f1-b557-f011-913e-0050568796d8/Section-C---Venous-anatomy-of-the-lower-limb.pdf',
};
const group = (fmaIds: string[], context: string, note: string) => ({
  fmaIds,
  context,
  note,
});
// Paired arrays are explicitly right, left. Singles retain their source laterality.
export const systemicVenousGroups = {
  svc: group(
    ['FMA4720'],
    'thorax',
    'Systemic return reaches the right atrium. No chamber connection or blood flow is generated; pulmonary veins are a different circuit.',
  ),
  azygos: group(
    ['FMA4838'],
    'thorax',
    'The supplied azygos and hemiazygos surfaces do not constitute the entire azygos system. Accessory, intercostal and lumbar channels remain unmodelled here.',
  ),
  hemiazygos: group(
    ['FMA4944'],
    'thorax',
    'Hemiazygos normally crosses to azygos. Its source laterality remains unchanged; crossing height and tributary pattern are not measured.',
  ),
  ivc: group(
    ['FMA10951'],
    'pelvis',
    'Iliac and available hepatic outlets are mapped, not the complete inferior caval tributaries. No direct portal-to-caval connection is implied.',
  ),
  brachiocephalic: group(
    ['FMA4751', 'FMA4761'],
    'thorax',
    'Each brachiocephalic vein receives its same-side jugular/subclavian confluence. Right and left join the superior cava, not each other as a continuation.',
  ),
  subclavian: group(
    ['FMA4755', 'FMA4763'],
    'shoulder-arm',
    'Axillary-to-subclavian naming changes at the first rib. The source surface does not validate a catheter route or an exact boundary.',
  ),
  jugular: group(
    ['FMA4754', 'FMA4762'],
    'head-neck',
    'The internal jugular carries intracranial drainage towards the chest. Dural sinuses and facial tributaries are not selectable in this map.',
  ),
  axillary: group(
    ['FMA13330', 'FMA13331'],
    'shoulder-arm',
    'Basilic and deep brachial veins contribute to formation of the axillary vein. One medial brachial source vein per side is supplied, not the entire deep venous system.',
  ),
  medialBrachial: group(
    ['FMA22935', 'FMA22936'],
    'shoulder-arm',
    'One medial brachial vein per side. Companion veins, valves and exact donor junctions remain unvalidated; proximity does not establish continuity.',
  ),
  cephalic: group(
    ['FMA13325', 'FMA13326'],
    'forearm',
    'Superficial lateral drainage is distinct from deep veins. The missing median cubital communication is not drawn between cephalic and basilic.',
  ),
  basilic: group(
    ['FMA22909', 'FMA22910'],
    'forearm',
    'Superficial medial drainage joins the deep system proximally. This map does not segment the point of fascial penetration.',
  ),
  handNetwork: group(
    ['FMA62506', 'FMA62507'],
    'hand',
    'One dorsal network per side remains a whole source selection, not individually identified tributaries or a universal superficial pattern.',
  ),
  commonIliac: group(
    ['FMA21387', 'FMA21388'],
    'pelvis',
    'Internal and external iliac routes converge on each side. The two common iliac veins contribute to the inferior cava.',
  ),
  externalIliac: group(
    ['FMA18885', 'FMA18886'],
    'pelvis',
    'The proximal leg route passes through the common femoral segment, not separately selectable in this source map.',
  ),
  internalIliac: group(
    ['FMA18887', 'FMA18888'],
    'pelvis',
    'Pelvic tributaries and communicating plexuses are not reconstructed from this single source vessel.',
  ),
  femoral: group(
    ['FMA21188', 'FMA21189'],
    'thigh',
    'Femoral is a deep vein. The common femoral segment is not separately labelled; deep femoral return has its own source selection. Do not call the femoral vein superficial.',
  ),
  greatSaphenous: group(
    ['FMA21379', 'FMA21380'],
    'thigh',
    'The proximal outlet is at the saphenofemoral junction. Common femoral subdivision, valve function and perforator competence are not modelled.',
  ),
  popliteal: group(
    ['FMA44328', 'FMA44329'],
    'leg',
    'Anterior/posterior tibial sources are available, but fibular veins and collecting junctions remain unmodelled. A displayed gap does not establish obstruction.',
  ),
  anteriorTibial: group(
    ['FMA44336', 'FMA44337'],
    'leg',
    'Two source parts per side remain one selection, not a complete paired companion-vein plexus.',
  ),
  posteriorTibial: group(
    ['FMA44338', 'FMA44339'],
    'leg',
    'One source group per side. Fibular contributions, valves and the exact collecting junction are not reconstructed.',
  ),
  deepFemoral: group(
    ['FMA51042', 'FMA51043'],
    'thigh',
    'Deep femoral return is distinct from the femoral vein; the common femoral junction is not separately segmented.',
  ),
  smallSaphenous: group(
    ['FMA44334', 'FMA44335'],
    'leg',
    'The common popliteal termination is shown as one pattern. Cranial extensions, variable junctions and communications are not assigned to this donor.',
  ),
  footArch: group(
    ['FMA44881', 'FMA44882'],
    'foot',
    'The dorsal arch remains one selection. Medial/lateral marginal routes are not separately labelled surfaces.',
  ),
  hepatic: group(
    ['FMA14338', 'FMA14339'],
    'abdomen',
    'Hepatic venous outflow is distinct from portal inflow. The middle hepatic vein, intraparenchymal channels and portal-systemic collaterals are not supplied by this map.',
  ),
};
export type VenousKind =
  'tributary' | 'continuation' | 'confluence' | 'via-unmodelled' | 'variable';
type Key = keyof typeof systemicVenousGroups;
const relationship = (from: Key, to: Key, kind: VenousKind, note: string) => ({
  from,
  to,
  kind,
  note,
});
export const systemicVenousRelationships = [
  relationship(
    'anteriorTibial',
    'popliteal',
    'via-unmodelled',
    'Typical deep calf return; intervening collecting junctions are not represented by a continuous source lumen.',
  ),
  relationship(
    'posteriorTibial',
    'popliteal',
    'via-unmodelled',
    'Typical proximal drainage through the calf collecting system; fibular contribution and precise confluence are unmodelled.',
  ),
  relationship(
    'deepFemoral',
    'femoral',
    'via-unmodelled',
    'Joins femoral return at the common femoral region, not a distal femoral segment; the junction is not separately labelled.',
  ),
  relationship(
    'hemiazygos',
    'azygos',
    'tributary',
    'A typical crossing route; the level and geometry of the junction are not established.',
  ),
  relationship(
    'azygos',
    'svc',
    'tributary',
    'Azygos enters the superior caval system; this is not an artery-style branch.',
  ),
  relationship(
    'jugular',
    'brachiocephalic',
    'confluence',
    'Joins the same-side subclavian contribution.',
  ),
  relationship(
    'subclavian',
    'brachiocephalic',
    'confluence',
    'Joins the same-side internal jugular contribution.',
  ),
  relationship(
    'brachiocephalic',
    'svc',
    'confluence',
    'Both sides contribute to one superior cava.',
  ),
  relationship(
    'axillary',
    'subclavian',
    'continuation',
    'Naming changes near the lateral margin of the first rib.',
  ),
  relationship(
    'cephalic',
    'axillary',
    'tributary',
    'Typical cephalic termination; individual patterns vary.',
  ),
  relationship(
    'basilic',
    'axillary',
    'confluence',
    'Deep brachial veins also contribute; the supplied medial vein is only part of that system.',
  ),
  relationship(
    'medialBrachial',
    'axillary',
    'confluence',
    'Typical deep contribution alongside basilic return; the exact donor confluence is not reconstructed.',
  ),
  relationship(
    'handNetwork',
    'cephalic',
    'tributary',
    'Lateral superficial route; the network is not subdivided.',
  ),
  relationship(
    'handNetwork',
    'basilic',
    'tributary',
    'Medial superficial route; the network is not subdivided.',
  ),
  relationship(
    'commonIliac',
    'ivc',
    'confluence',
    'Right and left iliac contributions converge; variants are not simulated.',
  ),
  relationship(
    'externalIliac',
    'commonIliac',
    'confluence',
    'Same-side external and internal iliac contributions.',
  ),
  relationship(
    'internalIliac',
    'commonIliac',
    'confluence',
    'Same-side pelvic contribution; no tributary plexus is generated.',
  ),
  relationship(
    'femoral',
    'externalIliac',
    'via-unmodelled',
    'Through the proximal common femoral segment, not separately labelled; transition is near the inguinal ligament.',
  ),
  relationship(
    'greatSaphenous',
    'femoral',
    'via-unmodelled',
    'Saphenofemoral outlet into the common femoral region, which this whole source does not subdivide.',
  ),
  relationship(
    'popliteal',
    'femoral',
    'continuation',
    'Continuation through the adductor-hiatus region; no exact boundary is segmented.',
  ),
  relationship(
    'smallSaphenous',
    'popliteal',
    'variable',
    'Common termination only; do not assume every small saphenous vein ends here.',
  ),
  relationship(
    'footArch',
    'greatSaphenous',
    'via-unmodelled',
    'Through the medial marginal route, not a separate source selection.',
  ),
  relationship(
    'footArch',
    'smallSaphenous',
    'via-unmodelled',
    'Through the lateral marginal route, not a separate source selection.',
  ),
  relationship(
    'hepatic',
    'ivc',
    'tributary',
    'Venous outlet from the liver, not direct drainage from the hepatic portal vein.',
  ),
];
