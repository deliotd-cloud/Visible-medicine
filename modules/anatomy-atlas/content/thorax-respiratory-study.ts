// Source-bound visibility lessons. Each record is one supplied compound surface,
// not a rib-space, hemidiaphragm, animated breath, or inferred subdivision.
export const thoraxRespiratoryBindings = [
  { id: 'vm:anatomy:body:thorax:midline:muscle:external-intercostal-muscle', fmaId: 'FMA9756', bundle: 'thorax-muscles', nodeName: 'FMA9756', sources: [
    { file: 'FJ1451', sha256: '588de751687a05ae711f9b8d65f78ddac891994158fa4a94ea2ca48d36dc1b61' },
    { file: 'FJ1451M', sha256: 'd4c021ba00dbe2bd3c7e722cb5982df7659d7d68fe6f4ec980588bfd65d31214' },
  ] },
  { id: 'vm:anatomy:body:thorax:midline:muscle:internal-intercostal-muscle', fmaId: 'FMA9757', bundle: 'thorax-muscles', nodeName: 'FMA9757', sources: [
    { file: 'FJ1455', sha256: 'aa71a14eb5d50c91569fb348ccf3747438bf0e5a4a8cd73784f7ae9ad2f801e3' },
    { file: 'FJ1455M', sha256: 'd92760297b5c8ceacf1013460e372abcb05f97192ffc514758d74ac0b73af373' },
  ] },
  { id: 'vm:anatomy:body:thorax:midline:muscle:innermost-intercostal-muscle', fmaId: 'FMA9758', bundle: 'thorax-muscles', nodeName: 'FMA9758', sources: [
    { file: 'FJ1454', sha256: '8e9a5c48482ba61dfe2ed19ced05121093a7bf3f8c6e0ac7d0c0b8ebe8bce45d' },
    { file: 'FJ1454M', sha256: '7458ea18bdf836da68b0220da5421cddb1bb653da909d998dea14db3d5ef00c5' },
  ] },
  { id: 'vm:anatomy:body:thorax:midline:muscle:diaphragm', fmaId: 'FMA13295', bundle: 'thorax-muscles', nodeName: 'FMA13295', sources: [
    { file: 'FJ3131', sha256: 'db97e5f8f8d46928ea54b42fb50789e8f5523ef973cc744b2c2f17930fc33dc8' },
  ] },
] as const;

const caution = 'These unreviewed compound source surfaces show fixed positions, not rib-space subdivisions, contraction, or breathing motion. Anatomical relationships require revision-bound radiologist review.';
export const thoraxRespiratoryStudies = [
  { id: 'respiratory-wall-overview', title: 'Respiratory wall layers & diaphragm', fmaIds: ['FMA9756', 'FMA9757', 'FMA9758', 'FMA13295'], view: 'anterior', description: 'Show the three supplied intercostal identities and diaphragm together.', inspect: `Rotate and select each named surface. Hide one, compare the remainder, then Undo to restore the source view. ${caution}` },
  { id: 'respiratory-intercostal-comparison', title: 'Intercostal layer comparison', fmaIds: ['FMA9756', 'FMA9757', 'FMA9758'], view: 'anterior', description: 'Compare external, internal and innermost intercostal source meshes without the diaphragm.', inspect: `Select a named layer, hide it to expose another, and Undo to restore the prior source view. Their supplied meshes do not distinguish individual rib spaces. ${caution}` },
  { id: 'respiratory-diaphragm', title: 'Diaphragm source surface', fmaIds: ['FMA13295'], view: 'inferior', description: 'Isolate the supplied diaphragm as one source identity.', inspect: `Compare its fixed source position with the overview. Undo restores the preceding state. The source does not separate muscular and tendinous parts. ${caution}` },
] as const;
