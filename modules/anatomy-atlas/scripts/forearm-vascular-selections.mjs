import { forearmVascularDefinitions } from './forearm-vascular-candidates.mjs';
export const forearmVascularAdmissions = forearmVascularDefinitions.map(
  ([id]) => id,
);
export function forearmVascularSelections(isa) {
  return forearmVascularDefinitions.map(([fma, name, file]) => {
    const source = isa.get(fma);
    if (!source || source.name !== name || source.files.join() !== file)
      throw Error('Source definition changed: ' + fma);
    return {
      fma,
      name,
      files: [file],
      region: 'forearm',
      system: 'vessels',
      category: 'vessel',
      tree: 'isa',
      recovery: true,
      forearmVascularRecovery: true,
      coverageNote:
        'Unvalidated BodyParts3D 4.0 source-labelled interosseous artery in unchanged common coordinates. The exact IS-A component is used, not the larger PART-OF branch aggregate. Branch continuity, posterior interosseous trunk, complete elbow anastomoses, vascular lumen and blood flow are not established. No missing vessel or patient registration is inferred.',
    };
  });
}
