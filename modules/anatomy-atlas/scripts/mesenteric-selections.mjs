export const mesentericDefinitions = [
  ['FMA14643', 'mesentery of small intestine', 'FJ3396'],
  ['FMA14647', 'transverse mesocolon', 'FJ3398'],
  ['FMA16549', 'mesoappendix', 'FJ3397'],
  ['FMA14332', 'superior mesenteric vein', 'FJ3647'],
  ['FMA14809', 'ileal artery', 'FJ3437'],
  ['FMA14810', 'middle colic artery', 'FJ3542'],
  ['FMA14811', 'right colic artery', 'FJ3590'],
  ['FMA14815', 'ileocolic artery', 'FJ3439'],
  ['FMA14818', 'appendicular artery', 'FJ3410'],
  ['FMA14819', 'ileal branch of inferior branch of ileocolic artery', 'FJ2034'],
  [
    'FMA14820',
    'ascending branch of inferior branch of ileocolic artery',
    'FJ3414',
  ],
  ['FMA14824', 'marginal colic artery', 'FJ2025'],
  ['FMA14826', 'left colic artery', 'FJ3494'],
  ['FMA14828', 'ascending branch of left colic artery', 'FJ3399'],
  ['FMA14829', 'descending branch of left colic artery', 'FJ3428'],
  ['FMA15391', 'inferior mesenteric vein', 'FJ3443'],
  ['FMA15405', 'ileal vein', 'FJ3438'],
  ['FMA15406', 'middle colic vein', 'FJ3543'],
  ['FMA15407', 'right colic vein', 'FJ3591'],
  ['FMA66358', 'trunk of superior mesenteric artery', 'FJ3644'],
];
// Admission is deliberately separate from candidate retrieval. Update this
// explicit list only after source/overlap evidence has been inspected.
export const mesentericHeldIds = ['FMA66358', 'FMA14809', 'FMA14819'];
export const mesentericAdmissions = [
  'FMA14643',
  'FMA14647',
  'FMA16549',
  'FMA14332',
  'FMA14810',
  'FMA14811',
  'FMA14815',
  'FMA14818',
  'FMA14820',
  'FMA14824',
  'FMA14826',
  'FMA14828',
  'FMA14829',
  'FMA15391',
  'FMA15405',
  'FMA15406',
  'FMA15407',
];
export function mesentericCandidates(isa) {
  return mesentericDefinitions.map(([fma, name, file], i) => {
    const r = isa.get(fma);
    if (!r || r.name !== name || r.files.join() !== file)
      throw Error('Mesenteric source changed: ' + fma);
    return {
      fma,
      name,
      files: [file],
      tree: 'isa',
      region: 'abdomen',
      system: i < 3 ? 'connective' : 'vessels',
      category: i < 3 ? 'membrane' : 'vessel',
      recovery: true,
      mesentericRecovery: true,
      coverageNote:
        'Unvalidated BodyParts3D 4.0 source surface in the unchanged common coordinate frame. ' +
        (i < 3
          ? 'Selected mesenteric surface only, not a complete peritoneum, mesenteric root, fascial plane or separately segmented peritoneal leaves. Attachments, folds and embedded structures require specialist review.'
          : 'Selected named vessel surface only, not a complete vascular tree. Branch continuity, calibre, bowel supply territories, variants and vessel relationships require specialist review. No flow, patency or procedural guidance is established.'),
    };
  });
}
export const mesentericSelections = (isa) =>
  mesentericCandidates(isa).filter((c) => mesentericAdmissions.includes(c.fma));
